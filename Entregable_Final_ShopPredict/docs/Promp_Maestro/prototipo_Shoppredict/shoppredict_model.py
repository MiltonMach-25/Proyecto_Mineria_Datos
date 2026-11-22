from __future__ import annotations

import queue

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.tree import DecisionTreeClassifier


TARGET = "Revenue"
NOMINAL_CODE_COLUMNS = {"OperatingSystems", "Browser", "Region", "TrafficType"}


def normalize_target(values: pd.Series) -> pd.Series:
    """Valida y convierte la variable objetivo a las clases booleanas esperadas."""
    if pd.api.types.is_bool_dtype(values):
        result = values.astype(bool)
    elif pd.api.types.is_numeric_dtype(values):
        unique_values = set(values.dropna().unique())
        if not unique_values.issubset({0, 1}):
            raise ValueError("Revenue debe contener solamente las clases 0/1 o True/False.")
        result = values.map({0: False, 1: True})
    else:
        result = (
            values.astype("string")
            .str.strip()
            .str.lower()
            .map({"true": True, "false": False, "1": True, "0": False})
        )

    if result.isna().any() or result.nunique() != 2:
        raise ValueError(
            "Revenue debe estar completa y contener las dos clases "
            "False/True (o 0/1)."
        )
    return result.astype(bool)


def prepare_predictors(
    data: pd.DataFrame,
) -> tuple[pd.DataFrame, list[str], list[str]]:
    predictors = data.drop(columns=[TARGET, "Session_ID"], errors="ignore").copy()
    predictors = predictors.replace([np.inf, -np.inf], np.nan)
    if predictors.shape[1] == 0:
        raise ValueError("No hay variables predictoras disponibles.")

    for column in predictors.columns:
        if pd.api.types.is_bool_dtype(predictors[column]):
            predictors[column] = predictors[column].map({True: 1, False: 0})

    categorical_columns = [
        column
        for column in predictors.columns
        if column in NOMINAL_CODE_COLUMNS
        or not pd.api.types.is_numeric_dtype(predictors[column])
    ]
    numeric_columns = [
        column for column in predictors.columns if column not in categorical_columns
    ]
    for column in categorical_columns:
        predictors[column] = predictors[column].astype("string")
    return predictors, numeric_columns, categorical_columns


def prepare_inference_frame(
    data: pd.DataFrame,
    feature_columns: list[str],
    numeric_columns: list[str],
    categorical_columns: list[str],
) -> pd.DataFrame:
    predictors = data.loc[:, feature_columns].copy()
    predictors = predictors.replace([np.inf, -np.inf], np.nan)
    for column in numeric_columns:
        predictors[column] = pd.to_numeric(predictors[column], errors="raise")
    for column in categorical_columns:
        predictors[column] = predictors[column].astype("string")
    return predictors


def build_preprocessor(
    numeric_columns: list[str],
    categorical_columns: list[str],
    scale_numeric: bool,
) -> ColumnTransformer:
    numeric_steps: list[tuple[str, object]] = [
        ("imputer", SimpleImputer(strategy="median"))
    ]
    if scale_numeric:
        numeric_steps.append(("scaler", StandardScaler()))

    categorical_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="constant", fill_value="Sin dato")),
            ("encoder", OneHotEncoder(handle_unknown="ignore")),
        ]
    )
    transformers: list[tuple[str, object, list[str]]] = []
    if numeric_columns:
        transformers.append(
            ("numeric", Pipeline(steps=numeric_steps), numeric_columns)
        )
    if categorical_columns:
        transformers.append(
            ("categorical", categorical_pipeline, categorical_columns)
        )
    return ColumnTransformer(transformers=transformers, remainder="drop")


def build_model_specs() -> list[tuple[str, object, bool]]:
    return [
        ("Árbol de decisión", DecisionTreeClassifier(random_state=42), False),
        (
            "Random Forest",
            RandomForestClassifier(random_state=42, n_jobs=-1),
            False,
        ),
        (
            "Regresión logística",
            LogisticRegression(max_iter=1000, random_state=42),
            True,
        ),
    ]


def build_pipeline(
    classifier: object,
    numeric_columns: list[str],
    categorical_columns: list[str],
    scale_numeric: bool,
) -> Pipeline:
    return Pipeline(
        steps=[
            (
                "preprocessor",
                build_preprocessor(
                    numeric_columns, categorical_columns, scale_numeric
                ),
            ),
            ("classifier", classifier),
        ]
    )


def prepare_training_data(
    data: pd.DataFrame,
) -> tuple[pd.DataFrame, pd.Series, list[str], list[str], int]:
    if TARGET not in data.columns:
        raise ValueError(f"No se encontró la columna objetivo '{TARGET}'.")
    if len(data) < 10:
        raise ValueError("Se necesitan al menos 10 filas para entrenar y evaluar.")

    duplicates_removed = int(data.duplicated().sum())
    clean_data = data.drop_duplicates().reset_index(drop=True)
    target = normalize_target(clean_data[TARGET])
    predictors, numeric_columns, categorical_columns = prepare_predictors(clean_data)
    return predictors, target, numeric_columns, categorical_columns, duplicates_removed


def evaluate_models(
    data: pd.DataFrame,
    progress: queue.Queue[tuple[str, object]],
) -> tuple[list[dict[str, object]], dict[str, int]]:
    X, y, numeric_columns, categorical_columns, duplicates_removed = (
        prepare_training_data(data)
    )
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )
    progress.put(
        (
            "log",
            f"Partición estratificada: {len(X_train):,} entrenamiento / "
            f"{len(X_test):,} prueba (semilla 42).",
        )
    )
    if duplicates_removed:
        progress.put(
            (
                "log",
                f"Registros duplicados exactos excluidos del modelado: "
                f"{duplicates_removed:,}.",
            )
        )
    progress.put(
        (
            "log",
            f"Predictores: {len(numeric_columns)} numéricos y "
            f"{len(categorical_columns)} categóricos; Session_ID excluido.",
        )
    )

    results: list[dict[str, object]] = []
    for name, classifier, scale_numeric in build_model_specs():
        progress.put(("log", f"Entrenando {name}..."))
        pipeline = build_pipeline(
            classifier, numeric_columns, categorical_columns, scale_numeric
        )
        pipeline.fit(X_train, y_train)
        y_pred = pipeline.predict(X_test)
        probabilities = pipeline.predict_proba(X_test)[:, 1]
        result: dict[str, object] = {
            "name": name,
            "scale": "StandardScaler" if scale_numeric else "Sin escalamiento",
            "accuracy": accuracy_score(y_test, y_pred),
            "balanced_accuracy": balanced_accuracy_score(y_test, y_pred),
            "precision": precision_score(y_test, y_pred, zero_division=0),
            "recall": recall_score(y_test, y_pred, zero_division=0),
            "f1": f1_score(y_test, y_pred, zero_division=0),
            "roc_auc": roc_auc_score(y_test, probabilities),
            "confusion": confusion_matrix(y_test, y_pred, labels=[False, True]),
            "y_test": y_test.to_numpy(),
            "y_pred": np.asarray(y_pred),
            "pipeline": pipeline,
        }
        results.append(result)
        progress.put(
            (
                "log",
                f"{name}: F1={result['f1']:.3f}, recall={result['recall']:.3f}, "
                f"ROC-AUC={result['roc_auc']:.3f}.",
            )
        )

    return results, {
        "train": len(X_train),
        "test": len(X_test),
        "numeric": len(numeric_columns),
        "categorical": len(categorical_columns),
        "duplicates_removed": duplicates_removed,
    }
