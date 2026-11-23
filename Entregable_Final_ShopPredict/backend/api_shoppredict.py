from __future__ import annotations

import io
import math
import os
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Literal

import pandas as pd
from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel, ConfigDict, Field
from starlette.staticfiles import StaticFiles

from .shoppredict_model import (
    TARGET,
    build_model_specs,
    build_pipeline,
    normalize_target,
    prepare_inference_frame,
    prepare_training_data,
)


PROJECT_DIR = Path(__file__).resolve().parent
PACKAGE_DIR = PROJECT_DIR.parent
DEFAULT_DATASET = PACKAGE_DIR / "data" / "online_shoppers_intention.csv"
METRICS_FILE = PACKAGE_DIR / "assets" / "evidencias" / "metricas_modelos.csv"
FRONTEND_DIST = PACKAGE_DIR / "frontend" / "dist"
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
EXPECTED_COLUMNS = [
    "Administrative",
    "Administrative_Duration",
    "Informational",
    "Informational_Duration",
    "ProductRelated",
    "ProductRelated_Duration",
    "BounceRates",
    "ExitRates",
    "PageValues",
    "SpecialDay",
    "Month",
    "OperatingSystems",
    "Browser",
    "Region",
    "TrafficType",
    "VisitorType",
    "Weekend",
    "Revenue",
]
NUMERIC_COLUMNS = [
    "Administrative",
    "Administrative_Duration",
    "Informational",
    "Informational_Duration",
    "ProductRelated",
    "ProductRelated_Duration",
    "BounceRates",
    "ExitRates",
    "PageValues",
    "SpecialDay",
    "OperatingSystems",
    "Browser",
    "Region",
    "TrafficType",
]
KAGGLE_SOURCE = (
    "https://www.kaggle.com/datasets/imakash3011/"
    "online-shoppers-purchasing-intention-dataset"
)
UCI_SOURCE = (
    "https://archive.ics.uci.edu/dataset/468/"
    "online+shoppers+purchasing+intention+dataset"
)
ModelName = Literal["Árbol de decisión", "Random Forest", "Regresión logística"]


def inspect_dataset(data: pd.DataFrame) -> dict[str, Any]:
    missing_columns = sorted(set(EXPECTED_COLUMNS) - set(data.columns))
    extra_columns = sorted(set(data.columns) - set(EXPECTED_COLUMNS))
    issues = []
    if missing_columns:
        issues.append("Faltan columnas requeridas: " + ", ".join(missing_columns))
    if extra_columns:
        issues.append("Hay columnas no esperadas: " + ", ".join(extra_columns))
    if len(data) < 10:
        issues.append("Se requieren al menos 10 filas.")

    for column in NUMERIC_COLUMNS:
        if column not in data.columns:
            continue
        numeric = pd.to_numeric(data[column], errors="coerce")
        invalid = data[column].notna() & numeric.isna()
        if invalid.any():
            issues.append(f"{column} contiene valores que no son numéricos.")
        if not numeric.dropna().map(math.isfinite).all():
            issues.append(f"{column} contiene valores no finitos.")

    if "Weekend" in data.columns:
        weekend = data["Weekend"]
        if pd.api.types.is_bool_dtype(weekend):
            valid_weekend = weekend.notna()
        else:
            numeric_weekend = pd.to_numeric(weekend, errors="coerce")
            text_weekend = weekend.astype("string").str.strip().str.lower()
            valid_weekend = numeric_weekend.isin([0, 1]) | text_weekend.isin(
                ["true", "false"]
            )
        if (weekend.notna() & ~valid_weekend).any():
            issues.append("Weekend debe contener valores booleanos o 0/1.")

    if "Revenue" in data.columns:
        try:
            normalize_target(data["Revenue"])
        except ValueError as error:
            issues.append(str(error))

    return {
        "valid": not issues,
        "rows": len(data),
        "columns": len(data.columns),
        "duplicates": int(data.duplicated().sum()),
        "missing_columns": missing_columns,
        "extra_columns": extra_columns,
        "issues": issues,
    }


class PredictionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    model: ModelName = "Random Forest"
    features: dict[str, Any] = Field(
        description="Una sesión con los predictores originales del dataset."
    )


class PredictionResponse(BaseModel):
    model: str
    revenue: bool
    label: str
    probability_purchase: float
    note: str


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    dataset_path = Path(os.environ.get("SHOPPREDICT_DATASET", str(DEFAULT_DATASET)))
    if not dataset_path.is_absolute():
        dataset_path = PACKAGE_DIR / dataset_path
    if not dataset_path.is_file():
        raise RuntimeError(
            f"No se encontró el dataset: {dataset_path}. Define SHOPPREDICT_DATASET "
            "o restaura data/online_shoppers_intention.csv."
        )

    try:
        data = pd.read_csv(dataset_path)
    except (pd.errors.EmptyDataError, pd.errors.ParserError, UnicodeDecodeError) as error:
        raise RuntimeError(f"No se pudo leer el dataset {dataset_path}: {error}") from error

    validation = inspect_dataset(data)
    if not validation["valid"]:
        raise RuntimeError(
            "El dataset no pasó la validación: "
            + "; ".join(validation["issues"])
        )

    try:
        X, y, numeric_columns, categorical_columns, duplicates_removed = (
            prepare_training_data(data)
        )
    except ValueError as error:
        raise RuntimeError(f"El dataset no es válido para entrenar: {error}") from error

    models = {}
    for model_name, classifier, scale_numeric in build_model_specs():
        pipeline = build_pipeline(
            classifier, numeric_columns, categorical_columns, scale_numeric
        )
        pipeline.fit(X, y)
        models[model_name] = pipeline

    if not METRICS_FILE.is_file():
        raise RuntimeError(f"No se encontró el archivo de métricas verificadas: {METRICS_FILE}")
    metrics_data = pd.read_csv(METRICS_FILE)
    if not {"name", "accuracy", "f1"}.issubset(metrics_data.columns):
        raise RuntimeError(
            "El archivo de métricas debe contener las columnas name, accuracy y f1."
        )
    model_metrics = []
    for row in metrics_data.to_dict(orient="records"):
        metric = {"name": str(row["name"])}
        for key, value in row.items():
            if key in {"name", "scale"} or pd.isna(value):
                continue
            number = float(value)
            if not math.isfinite(number):
                raise RuntimeError(f"La métrica {key} de {row['name']} no es finita.")
            metric[key] = number
        model_metrics.append(metric)

    app.state.models = models
    app.state.feature_columns = list(X.columns)
    app.state.numeric_columns = numeric_columns
    app.state.categorical_columns = categorical_columns
    app.state.target = y
    app.state.features = X
    app.state.model_metrics = model_metrics
    app.state.dataset_metadata = {
        "file": dataset_path.name,
        "rows_loaded": len(data),
        "rows_used": len(X),
        "features": len(X.columns),
        "duplicates_removed": duplicates_removed,
        "target": TARGET,
        "training": "All available labeled rows; this is for API demonstration.",
        "kaggle_source": KAGGLE_SOURCE,
        "uci_reference": UCI_SOURCE,
    }
    yield


app = FastAPI(
    title="ShopPredict API",
    description=(
        "API para consultar estadísticas verificadas y estimar Revenue con modelos "
        "entrenados sobre Online Shoppers Purchasing Intention."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

cors_origins = [
    origin.strip()
    for origin in os.environ.get(
        "FRONTEND_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,"
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.get("/health")
def health(request: Request) -> dict[str, str | int]:
    return {
        "status": "ready",
        "models_loaded": len(request.app.state.models),
    }


@app.get("/metadata")
def metadata(request: Request) -> dict[str, Any]:
    return request.app.state.dataset_metadata


def _summarize_group(features: pd.DataFrame, target: pd.Series) -> dict[str, Any]:
    total = len(target)
    purchases = int(target.sum())
    duration = (
        pd.to_numeric(features["ProductRelated_Duration"], errors="coerce")
        if "ProductRelated_Duration" in features
        else pd.Series(dtype=float)
    )
    return {
        "total": total,
        "purchases": purchases,
        "conversion": purchases / total if total else None,
        "avg_duration": float(duration.mean()) if duration.notna().any() else None,
    }


def _group_breakdown(
    features: pd.DataFrame,
    target: pd.Series,
    column: str,
    label_key: str,
) -> list[dict[str, Any]]:
    if column not in features:
        return []

    frame = features.copy()
    frame["_Revenue"] = target.to_numpy()
    result = []
    for value, group in frame.groupby(column, dropna=False, sort=False):
        label = "Sin dato" if pd.isna(value) else str(value)
        item = {
            label_key: label,
            **_summarize_group(group, group["_Revenue"].astype(bool)),
        }
        result.append(item)
    return result


def _build_stats_breakdown(
    features: pd.DataFrame, target: pd.Series
) -> dict[str, Any]:
    month_order = {
        month: index
        for index, month in enumerate(
            [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "June",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
            ]
        )
    }
    by_month = _group_breakdown(features, target, "Month", "month")
    by_month.sort(
        key=lambda item: (
            month_order.get(item["month"], len(month_order)),
            item["month"],
        )
    )

    by_visitor = _group_breakdown(features, target, "VisitorType", "visitor_type")
    by_visitor.sort(key=lambda item: item["visitor_type"])

    by_weekend = _group_breakdown(features, target, "Weekend", "weekend")
    for item in by_weekend:
        item["weekend"] = str(item["weekend"]).strip().lower() in {"true", "1"}
        item["label"] = "Fin de semana" if item["weekend"] else "Entre semana"
    by_weekend.sort(key=lambda item: item["weekend"])

    page_values = (
        pd.to_numeric(features["PageValues"], errors="coerce")
        if "PageValues" in features
        else pd.Series(index=features.index, dtype=float)
    )
    zero_mask = page_values.eq(0).fillna(False)
    positive_mask = page_values.gt(0).fillna(False)

    def summarize_signal(mask: pd.Series) -> dict[str, Any]:
        selected = target.loc[mask]
        total = len(selected)
        purchases = int(selected.sum())
        return {
            "total": total,
            "purchases": purchases,
            "conversion": purchases / total if total else None,
        }

    def average(column: str) -> float | None:
        if column not in features:
            return None
        values = pd.to_numeric(features[column], errors="coerce")
        return float(values.mean()) if values.notna().any() else None

    zero_summary = summarize_signal(zero_mask)
    positive_summary = summarize_signal(positive_mask)
    return {
        "by_month": by_month,
        "by_visitor": by_visitor,
        "by_weekend": by_weekend,
        "page_values_signal": {
            "zero_total": zero_summary["total"],
            "zero_purchases": zero_summary["purchases"],
            "zero_conversion": zero_summary["conversion"],
            "positive_total": positive_summary["total"],
            "positive_purchases": positive_summary["purchases"],
            "positive_conversion": positive_summary["conversion"],
        },
        "averages": {
            "page_values": average("PageValues"),
            "bounce_rate": average("BounceRates"),
            "exit_rate": average("ExitRates"),
            "product_related": average("ProductRelated"),
        },
    }


@app.get("/stats")
def stats(
    request: Request,
    month: str | None = None,
    visitor_type: str | None = None,
) -> dict[str, Any]:
    features = request.app.state.features
    target = request.app.state.target
    mask = pd.Series(True, index=features.index)
    if month:
        available_months = features["Month"].astype(str).unique()
        if month not in available_months:
            raise HTTPException(status_code=422, detail="El mes seleccionado no existe.")
        mask &= features["Month"].astype(str).eq(month)
    if visitor_type:
        available_visitors = features["VisitorType"].astype(str).unique()
        if visitor_type not in available_visitors:
            raise HTTPException(
                status_code=422,
                detail="El tipo de visitante seleccionado no existe.",
            )
        mask &= features["VisitorType"].astype(str).eq(visitor_type)

    filtered_features = features.loc[mask]
    filtered_target = target.loc[mask]
    duration = pd.to_numeric(
        filtered_features["ProductRelated_Duration"], errors="coerce"
    )
    if duration.isna().any():
        raise RuntimeError("ProductRelated_Duration contiene datos no numéricos.")
    total = len(filtered_target)
    purchases = int(filtered_target.sum())
    return {
        "total": total,
        "purchases": purchases,
        "conversion": purchases / total if total else None,
        "avg_duration": float(duration.mean()) if total else None,
        "filters": {"month": month, "visitor_type": visitor_type},
        "metrics_scope": "Métricas de modelos: holdout global documentado, sin filtros.",
        "models": request.app.state.model_metrics,
        "breakdown": _build_stats_breakdown(filtered_features, filtered_target),
    }


@app.get("/dataset/sample-csv", include_in_schema=False)
def sample_csv(request: Request) -> Response:
    features = request.app.state.features
    target = request.app.state.target
    purchase_indexes = target[target].index[:10]
    non_purchase_indexes = target[~target].index[:15]
    indexes = purchase_indexes.append(non_purchase_indexes)
    sample = features.loc[indexes].copy()
    sample[TARGET] = target.loc[indexes].to_numpy()
    return Response(
        content=sample.to_csv(index=False),
        media_type="text/csv",
        headers={
            "Content-Disposition": 'attachment; filename="shoppredict_muestra_valida.csv"'
        },
    )


@app.get("/metrics")
def metrics(request: Request) -> list[dict[str, Any]]:
    return request.app.state.model_metrics


@app.get("/schema")
def schema(request: Request) -> dict[str, Any]:
    features = request.app.state.features
    return {
        "target": TARGET,
        "features": request.app.state.feature_columns,
        "numeric_features": request.app.state.numeric_columns,
        "categorical_features": request.app.state.categorical_columns,
        "categorical_options": {
            column: sorted(features[column].dropna().astype(str).unique().tolist())
            for column in request.app.state.categorical_columns
        },
        "numeric_ranges": {
            column: {
                "minimum": float(features[column].min()),
                "maximum": float(features[column].max()),
                "median": float(features[column].median()),
            }
            for column in request.app.state.numeric_columns
        },
        "models": list(request.app.state.models),
    }


@app.post("/dataset/validate")
async def validate_dataset(file: UploadFile = File(...)) -> dict[str, Any]:
    content = await file.read(MAX_UPLOAD_BYTES + 1)
    await file.close()
    if not content:
        raise HTTPException(status_code=422, detail="El archivo está vacío.")
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"El archivo supera el límite de {MAX_UPLOAD_BYTES // (1024 * 1024)} MB.",
        )

    try:
        data = pd.read_csv(io.BytesIO(content))
    except (pd.errors.EmptyDataError, pd.errors.ParserError, UnicodeDecodeError) as error:
        raise HTTPException(
            status_code=422, detail=f"No se pudo leer el CSV: {error}"
        ) from error

    validation = inspect_dataset(data)
    return {
        **validation,
        "persisted": False,
    }


@app.post("/predict", response_model=PredictionResponse)
def predict(payload: PredictionRequest, request: Request) -> PredictionResponse:
    expected = request.app.state.feature_columns
    provided = set(payload.features)
    missing = sorted(set(expected) - provided)
    unexpected = sorted(provided - set(expected))
    if missing or unexpected:
        details = []
        if missing:
            details.append(f"Faltan variables: {', '.join(missing)}")
        if unexpected:
            details.append(f"Variables no esperadas: {', '.join(unexpected)}")
        raise HTTPException(status_code=422, detail="; ".join(details))

    try:
        row = pd.DataFrame([payload.features], columns=expected)
        predictors = prepare_inference_frame(
            row,
            expected,
            request.app.state.numeric_columns,
            request.app.state.categorical_columns,
        )
    except (TypeError, ValueError) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    pipeline = request.app.state.models[payload.model]
    prediction = bool(pipeline.predict(predictors)[0])
    classifier = pipeline.named_steps["classifier"]
    classes = list(classifier.classes_)
    positive_index = next(
        (index for index, label in enumerate(classes) if bool(label)),
        None,
    )
    if positive_index is None:
        raise RuntimeError("The trained model does not contain the purchase class.")
    probability = float(pipeline.predict_proba(predictors)[0][positive_index])
    return PredictionResponse(
        model=payload.model,
        revenue=prediction,
        label="Compra" if prediction else "Sin compra",
        probability_purchase=probability,
        note=(
            "Demostración académica; la estimación no garantiza una compra ni "
            "representa desempeño en producción."
        ),
    )


@app.get("/", include_in_schema=False)
def dashboard() -> FileResponse:
    frontend_index = FRONTEND_DIST / "index.html"
    if frontend_index.is_file():
        return FileResponse(frontend_index)
    return FileResponse(PACKAGE_DIR / "dashboard.html")


@app.get("/dashboard.html", include_in_schema=False)
def standalone_dashboard() -> FileResponse:
    return FileResponse(PACKAGE_DIR / "dashboard.html")


@app.get("/index.html", include_in_schema=False)
def presentation() -> FileResponse:
    return FileResponse(PACKAGE_DIR / "index.html")


if (FRONTEND_DIST / "dashboard-assets").is_dir():
    app.mount(
        "/dashboard-assets",
        StaticFiles(directory=FRONTEND_DIST / "dashboard-assets"),
        name="dashboard-assets",
    )


app.mount(
    "/assets",
    StaticFiles(directory=PACKAGE_DIR / "assets"),
    name="assets",
)
