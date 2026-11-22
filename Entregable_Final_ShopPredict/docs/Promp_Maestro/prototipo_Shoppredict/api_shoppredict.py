from __future__ import annotations

import os
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Literal

import pandas as pd
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field

from shoppredict_model import (
    TARGET,
    build_model_specs,
    build_pipeline,
    prepare_inference_frame,
    prepare_training_data,
)


PROJECT_DIR = Path(__file__).resolve().parent
DEFAULT_DATASET = PROJECT_DIR / "online_shoppers_intention.csv"
KAGGLE_SOURCE = (
    "https://www.kaggle.com/datasets/imakash3011/"
    "online-shoppers-purchasing-intention-dataset"
)
UCI_SOURCE = (
    "https://archive.ics.uci.edu/dataset/468/"
    "online+shoppers+purchasing+intention+dataset"
)
ModelName = Literal["Árbol de decisión", "Random Forest", "Regresión logística"]


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
    dataset_path = Path(os.environ.get("SHOPPREDICT_DATASET", DEFAULT_DATASET))
    if not dataset_path.is_absolute():
        dataset_path = PROJECT_DIR / dataset_path
    if not dataset_path.is_file():
        raise RuntimeError(
            f"No se encontró el dataset: {dataset_path}. Define SHOPPREDICT_DATASET "
            "o coloca online_shoppers_intention.csv en la carpeta del prototipo."
        )

    data = pd.read_csv(dataset_path)
    X, y, numeric_columns, categorical_columns, duplicates_removed = (
        prepare_training_data(data)
    )
    models = {}
    for model_name, classifier, scale_numeric in build_model_specs():
        pipeline = build_pipeline(
            classifier, numeric_columns, categorical_columns, scale_numeric
        )
        pipeline.fit(X, y)
        models[model_name] = pipeline

    app.state.models = models
    app.state.feature_columns = list(X.columns)
    app.state.numeric_columns = numeric_columns
    app.state.categorical_columns = categorical_columns
    app.state.dataset_metadata = {
        "file": dataset_path.name,
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
    title="ShopPredict AI API",
    description=(
        "API local de demostración para estimar Revenue con modelos entrenados "
        "sobre el dataset original Online Shoppers Purchasing Intention."
    ),
    version="1.0.0",
    lifespan=lifespan,
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


@app.get("/schema")
def schema(request: Request) -> dict[str, Any]:
    return {
        "target": TARGET,
        "features": request.app.state.feature_columns,
        "numeric_features": request.app.state.numeric_columns,
        "categorical_features": request.app.state.categorical_columns,
        "models": list(request.app.state.models),
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
