"""Sesión 4: transformación y reducción de datos para el proyecto de e-commerce.

El script adapta la dinámica de mineria_de_datos/sesion4 al dataset
Online Shoppers Intention integrado con la fuente sintética de marketing.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.decomposition import PCA
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import (
    KBinsDiscretizer,
    MinMaxScaler,
    OneHotEncoder,
    RobustScaler,
    StandardScaler,
)

BASE_DIR = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = BASE_DIR / "dataset_limpio_cruce_marketing.csv"
DEFAULT_OUTPUT = Path(__file__).resolve().parent / "resultados"
TARGET = "Revenue"
ID_COLUMNS = ["Session_ID"]
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
    "Gasto_Historico_USD",
]
CATEGORICAL_COLUMNS = [
    "Month",
    "VisitorType",
    "Weekend",
    "Canal_Origen",
    "Cupon_Aplicado",
    "Nivel_Fidelidad",
]
DISCRETIZE_COLUMN = "Gasto_Historico_USD"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Aplica la Sesión 4 al dataset limpio de ProyectoMineriaDeDatos."
    )
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT, help="CSV de entrada")
    parser.add_argument(
        "--output-dir", type=Path, default=DEFAULT_OUTPUT, help="Carpeta para resultados"
    )
    parser.add_argument("--test-size", type=float, default=0.20)
    parser.add_argument("--random-state", type=int, default=42)
    return parser.parse_args()


def cargar_y_validar(ruta: Path) -> pd.DataFrame:
    if not ruta.exists():
        raise FileNotFoundError(f"No se encontró el CSV de entrada: {ruta}")

    df = pd.read_csv(ruta)
    columnas_requeridas = set(NUMERIC_COLUMNS + CATEGORICAL_COLUMNS + ID_COLUMNS + [TARGET])
    faltantes = columnas_requeridas - set(df.columns)
    if faltantes:
        raise ValueError(f"Faltan columnas requeridas: {', '.join(sorted(faltantes))}")
    if df.empty:
        raise ValueError("El CSV de entrada no contiene registros.")
    if df[NUMERIC_COLUMNS].isna().any().any() or df[CATEGORICAL_COLUMNS + [TARGET]].isna().any().any():
        raise ValueError("El dataset contiene nulos en columnas necesarias para transformar.")

    return df


def mostrar_diagnostico_distancias(X_train: pd.DataFrame) -> dict[str, float]:
    """Muestra por qué las variables deben llevar una escala comparable."""
    scaler = MinMaxScaler()
    X_minmax = pd.DataFrame(
        scaler.fit_transform(X_train), columns=X_train.columns, index=X_train.index
    )
    primera = X_train.iloc[0].to_numpy(dtype=float)
    segunda = X_train.iloc[1].to_numpy(dtype=float)
    primera_mm = X_minmax.iloc[0].to_numpy(dtype=float)
    segunda_mm = X_minmax.iloc[1].to_numpy(dtype=float)
    distancia_original = float(np.linalg.norm(primera - segunda))
    distancia_minmax = float(np.linalg.norm(primera_mm - segunda_mm))
    print("\n--- Distancia entre dos sesiones ---")
    print(f"Sin escalar : {distancia_original:.3f}")
    print(f"Con MinMax  : {distancia_minmax:.3f}")
    print("Las variables con unidades grandes dejan de dominar después del escalado.")
    return {
        "distancia_sin_escalar": distancia_original,
        "distancia_minmax": distancia_minmax,
    }


def comparar_escaladores(X_train: pd.DataFrame, output_dir: Path) -> pd.DataFrame:
    resultados: list[dict[str, Any]] = []
    escaladores = {
        "MinMaxScaler": MinMaxScaler(),
        "StandardScaler": StandardScaler(),
        "RobustScaler": RobustScaler(),
    }
    for nombre, escalador in escaladores.items():
        transformado = escalador.fit_transform(X_train)
        resultados.append(
            {
                "escalador": nombre,
                "minimo_global": float(transformado.min()),
                "maximo_global": float(transformado.max()),
                "media_abs_max": float(np.abs(transformado.mean(axis=0)).max()),
                "mediana_abs_max": float(np.abs(np.median(transformado, axis=0)).max()),
            }
        )

    reporte = pd.DataFrame(resultados)
    reporte.to_csv(output_dir / "comparacion_escaladores.csv", index=False)
    print("\n--- Comparación de escaladores ---")
    print(reporte.round(4).to_string(index=False))
    return reporte


def crear_preprocesador() -> ColumnTransformer:
    try:
        encoder = OneHotEncoder(handle_unknown="ignore", sparse_output=False, dtype=np.int64)
    except TypeError:  # Compatibilidad con scikit-learn anterior a 1.2.
        encoder = OneHotEncoder(handle_unknown="ignore", sparse=False, dtype=np.int64)

    return ColumnTransformer(
        transformers=[
            ("numericas_standard", StandardScaler(), NUMERIC_COLUMNS),
            ("categoricas_one_hot", encoder, CATEGORICAL_COLUMNS),
        ],
        remainder="drop",
        verbose_feature_names_out=False,
    )


def transformar_matriz(
    df: pd.DataFrame,
    train_indices: pd.Index,
    output_dir: Path,
) -> tuple[pd.DataFrame, pd.DataFrame, ColumnTransformer]:
    preprocesador = crear_preprocesador()
    preprocesador.fit(df.loc[train_indices, NUMERIC_COLUMNS + CATEGORICAL_COLUMNS])
    matriz_completa = preprocesador.transform(df[NUMERIC_COLUMNS + CATEGORICAL_COLUMNS])
    nombres = preprocesador.get_feature_names_out()
    X_final = pd.DataFrame(matriz_completa, columns=nombres, index=df.index)

    train_mask = df.index.isin(train_indices)
    X_final.loc[train_mask].to_csv(output_dir / "X_train_transformada.csv", index=False)
    X_final.loc[~train_mask].to_csv(output_dir / "X_test_transformada.csv", index=False)
    X_final.to_csv(output_dir / "X_transformada.csv", index=False)
    return X_final, X_final.loc[train_mask], preprocesador


def discretizar_variable(
    df: pd.DataFrame, train_indices: pd.Index, output_dir: Path
) -> tuple[pd.Series, list[float]]:
    discretizador = KBinsDiscretizer(
        n_bins=4,
        encode="ordinal",
        strategy="quantile",
        subsample=None,
        quantile_method="linear",
    )
    discretizador.fit(df.loc[train_indices, [DISCRETIZE_COLUMN]])
    valores = discretizador.transform(df[[DISCRETIZE_COLUMN]]).ravel().astype(int)
    etiquetas = np.array(["Bajo", "Medio-bajo", "Medio-alto", "Alto"])
    rangos = pd.Series(etiquetas[valores], index=df.index, name="Gasto_Historico_Rango")
    rangos.to_frame().to_csv(output_dir / "discretizacion_gasto.csv", index=False)
    bordes = discretizador.bin_edges_[0].tolist()
    print("\n--- Discretización por cuantiles ---")
    print(f"Variable: {DISCRETIZE_COLUMN}")
    print(f"Bordes aprendidos con train: {[round(valor, 2) for valor in bordes]}")
    print(rangos.value_counts().reindex(etiquetas, fill_value=0).to_string())
    return rangos, bordes


def aplicar_pca(
    df: pd.DataFrame, train_indices: pd.Index, output_dir: Path
) -> tuple[pd.DataFrame, dict[str, Any]]:
    escalador = StandardScaler()
    X_train_std = escalador.fit_transform(df.loc[train_indices, NUMERIC_COLUMNS])
    X_completo_std = escalador.transform(df[NUMERIC_COLUMNS])

    pca_completo = PCA()
    pca_completo.fit(X_train_std)
    varianza = pca_completo.explained_variance_ratio_
    acumulada = varianza.cumsum()
    n_80 = int(np.searchsorted(acumulada, 0.80) + 1)
    n_90 = int(np.searchsorted(acumulada, 0.90) + 1)

    pca_reducido = PCA(n_components=n_90)
    pca_reducido.fit(X_train_std)
    componentes = pca_reducido.transform(X_completo_std)
    nombres = [f"PC{i}" for i in range(1, n_90 + 1)]
    X_pca = pd.DataFrame(componentes, columns=nombres, index=df.index)
    X_pca.to_csv(output_dir / "X_pca.csv", index=False)

    varianza_df = pd.DataFrame(
        {
            "componente": [f"PC{i}" for i in range(1, len(varianza) + 1)],
            "varianza_explicada": varianza,
            "varianza_acumulada": acumulada,
        }
    )
    varianza_df.to_csv(output_dir / "pca_varianza.csv", index=False)
    resumen = {
        "componentes_originales": len(NUMERIC_COLUMNS),
        "componentes_para_80_por_ciento": n_80,
        "componentes_para_90_por_ciento": n_90,
        "varianza_acumulada_conservada": float(
            pca_reducido.explained_variance_ratio_.sum()
        ),
    }
    print("\n--- PCA sobre numéricas estandarizadas ---")
    print(f"Varianza acumulada: {np.round(acumulada, 4).tolist()}")
    print(f"Componentes para >=80%: {n_80}")
    print(f"Componentes para >=90%: {n_90}")
    return X_pca, resumen


def guardar_y_resumen(
    df: pd.DataFrame,
    X_final: pd.DataFrame,
    X_pca: pd.DataFrame,
    rangos: pd.Series,
    output_dir: Path,
    diagnostico: dict[str, float],
    pca_resumen: dict[str, Any],
    train_indices: pd.Index,
    test_indices: pd.Index,
) -> None:
    y = df[TARGET].astype(int).rename(TARGET)
    y.to_csv(output_dir / "y_revenue.csv", index=False)
    X_final.assign(Gasto_Historico_Rango=rangos).to_csv(
        output_dir / "X_transformada_con_discretizacion.csv", index=False
    )

    resumen = {
        "filas_entrada": int(len(df)),
        "columnas_entrada": int(df.shape[1]),
        "filas_train": int(len(train_indices)),
        "filas_test": int(len(test_indices)),
        "columnas_X_transformada": int(X_final.shape[1]),
        "columnas_X_pca": int(X_pca.shape[1]),
        "objetivo": TARGET,
        "discretizacion": {
            "variable": DISCRETIZE_COLUMN,
            "estrategia": "quantile",
            "numero_de_bins": 4,
            "etiquetas": ["Bajo", "Medio-bajo", "Medio-alto", "Alto"],
        },
        "diagnostico_distancias": diagnostico,
        "pca": pca_resumen,
        "decisiones": [
            "Session_ID se excluye porque identifica la fila y no representa un patrón.",
            "Revenue se conserva separado en y_revenue.csv para evitar fuga de información.",
            "Las numéricas se estandarizan con StandardScaler para la matriz de modelado.",
            "Las categorías nominales se codifican con OneHotEncoder y no con LabelEncoder.",
            "PCA se ajusta únicamente con train y usa solo variables numéricas estandarizadas.",
        ],
    }
    (output_dir / "reporte_transformacion.json").write_text(
        json.dumps(resumen, indent=2, ensure_ascii=False), encoding="utf-8"
    )


def ejecutar(args: argparse.Namespace) -> None:
    output_dir = args.output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    df = cargar_y_validar(args.input.resolve())

    train_indices, test_indices = train_test_split(
        df.index,
        test_size=args.test_size,
        random_state=args.random_state,
        stratify=df[TARGET],
    )
    train_indices = pd.Index(train_indices)
    test_indices = pd.Index(test_indices)
    X_train_numericas = df.loc[train_indices, NUMERIC_COLUMNS]

    print(f"Dataset de entrada: {df.shape}")
    print(f"Train: {len(train_indices)} | Test: {len(test_indices)}")
    diagnostico = mostrar_diagnostico_distancias(X_train_numericas)
    comparar_escaladores(X_train_numericas, output_dir)
    X_final, _, _ = transformar_matriz(df, train_indices, output_dir)
    rangos, _ = discretizar_variable(df, train_indices, output_dir)
    X_pca, pca_resumen = aplicar_pca(df, train_indices, output_dir)
    guardar_y_resumen(
        df,
        X_final,
        X_pca,
        rangos,
        output_dir,
        diagnostico,
        pca_resumen,
        train_indices,
        test_indices,
    )

    print("\n--- Matrices listas para las siguientes sesiones ---")
    print(f"X transformada: {X_final.shape} | y: {(len(df), 1)}")
    print(f"X reducida con PCA: {X_pca.shape}")
    print(f"Resultados guardados en: {output_dir}")


if __name__ == "__main__":
    ejecutar(parse_args())
