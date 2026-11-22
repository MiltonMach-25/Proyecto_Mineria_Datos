"""Escalamiento y preparación para modelado del proyecto de e-commerce.

Adapta la Sesión 4 al CSV limpio e integrado de ProyectoMineriaDeDatos.
Ajusta transformadores únicamente con train para evitar fuga de información.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.decomposition import PCA
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import (
    MinMaxScaler,
    OneHotEncoder,
    RobustScaler,
    StandardScaler,
)

PROJECT_DIR = Path(__file__).resolve().parent.parent
DEFAULT_INPUT = PROJECT_DIR / "dataset_limpio_cruce_marketing.csv"
DEFAULT_OUTPUT = Path(__file__).resolve().parent / "resultados"
TARGET = "Revenue"
ID_COLUMN = "Session_ID"

# Son magnitudes o conteos: sus unidades y rangos afectan las distancias.
QUANTITATIVE_COLUMNS = [
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
    "Gasto_Historico_USD",
]

# Aunque algunas estén guardadas como números, son códigos nominales, no magnitudes.
CATEGORICAL_COLUMNS = [
    "Month",
    "OperatingSystems",
    "Browser",
    "Region",
    "TrafficType",
    "VisitorType",
    "Canal_Origen",
    "Nivel_Fidelidad",
]

# Estas columnas ya tienen una escala binaria con significado y no se reescalan.
BINARY_COLUMNS = ["Weekend", "Cupon_Aplicado"]
FEATURE_COLUMNS = QUANTITATIVE_COLUMNS + CATEGORICAL_COLUMNS + BINARY_COLUMNS

SCALERS = {
    "minmax": MinMaxScaler,
    "standard": StandardScaler,
    "robust": RobustScaler,
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Compara y aplica escalamiento al dataset limpio del proyecto."
    )
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT, help="CSV limpio integrado")
    parser.add_argument(
        "--output-dir", type=Path, default=DEFAULT_OUTPUT, help="Carpeta de resultados"
    )
    parser.add_argument("--test-size", type=float, default=0.20, help="Fracción para prueba")
    parser.add_argument("--random-state", type=int, default=42, help="Semilla reproducible")
    return parser.parse_args()


def convertir_a_binaria(serie: pd.Series, nombre: str) -> pd.Series:
    equivalencias = {"true": 1, "false": 0, "1": 1, "0": 0}
    convertida = serie.astype("string").str.strip().str.lower().map(equivalencias)
    if convertida.isna().any():
        raise ValueError(f"La columna {nombre} debe contener solo valores True/False o 1/0.")
    return convertida.astype("int8")


def cargar_y_validar(ruta: Path) -> pd.DataFrame:
    if not ruta.exists():
        raise FileNotFoundError(
            f"No se encontró {ruta}. Primero ejecuta proceso_extraccion_limpieza.py "
            "desde la raíz del proyecto para crear dataset_limpio_cruce_marketing.csv."
        )

    df = pd.read_csv(ruta)
    requeridas = set(FEATURE_COLUMNS + [ID_COLUMN, TARGET])
    faltantes = sorted(requeridas - set(df.columns))
    if faltantes:
        raise ValueError(f"Faltan columnas necesarias en el CSV: {', '.join(faltantes)}")
    if df.empty:
        raise ValueError("El CSV de entrada no contiene registros.")
    if df[ID_COLUMN].isna().any() or df[ID_COLUMN].duplicated().any():
        raise ValueError(f"{ID_COLUMN} debe existir y ser único para cada fila.")

    df = df.copy()
    for columna in QUANTITATIVE_COLUMNS:
        df[columna] = pd.to_numeric(df[columna], errors="coerce")
    df[QUANTITATIVE_COLUMNS] = df[QUANTITATIVE_COLUMNS].replace(
        [np.inf, -np.inf], np.nan
    )
    for columna in BINARY_COLUMNS + [TARGET]:
        df[columna] = convertir_a_binaria(df[columna], columna)

    columnas_con_nulos = df[FEATURE_COLUMNS].columns[df[FEATURE_COLUMNS].isna().any()].tolist()
    if columnas_con_nulos:
        raise ValueError(
            "Hay valores nulos o no numéricos en columnas usadas: "
            + ", ".join(columnas_con_nulos)
        )
    if df[CATEGORICAL_COLUMNS].isna().any().any():
        raise ValueError("Las columnas categóricas requeridas no pueden tener valores nulos.")
    if df[TARGET].nunique() != 2:
        raise ValueError(f"{TARGET} debe contener las dos clases para estratificar train/test.")
    return df


def crear_codificador() -> OneHotEncoder:
    try:
        return OneHotEncoder(
            handle_unknown="ignore", sparse_output=False, dtype=np.int64
        )
    except TypeError:
        return OneHotEncoder(handle_unknown="ignore", sparse=False, dtype=np.int64)


def crear_preprocesador(escalador: Any) -> ColumnTransformer:
    return ColumnTransformer(
        transformers=[
            ("cuantitativas", escalador, QUANTITATIVE_COLUMNS),
            ("categoricas_one_hot", crear_codificador(), CATEGORICAL_COLUMNS),
            ("binarias_sin_escalar", "passthrough", BINARY_COLUMNS),
        ],
        remainder="drop",
        verbose_feature_names_out=False,
    )


def resumen_por_escalador(
    escalador: Any, valores: np.ndarray, nombre: str
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    resumen = {
        "escalador": nombre,
        "media_abs_maxima": float(np.abs(valores.mean(axis=0)).max()),
        "desviacion_minima": float(valores.std(axis=0).min()),
        "desviacion_maxima": float(valores.std(axis=0).max()),
        "mediana_abs_maxima": float(np.abs(np.median(valores, axis=0)).max()),
        "minimo_global": float(valores.min()),
        "maximo_global": float(valores.max()),
    }
    por_variable = []
    for indice, columna in enumerate(QUANTITATIVE_COLUMNS):
        por_variable.append(
            {
                "escalador": nombre,
                "variable": columna,
                "media": float(valores[:, indice].mean()),
                "desviacion_estandar": float(valores[:, indice].std()),
                "mediana": float(np.median(valores[:, indice])),
                "minimo": float(valores[:, indice].min()),
                "maximo": float(valores[:, indice].max()),
            }
        )
    return resumen, por_variable


def diagnosticar_distancias(
    X_train: pd.DataFrame,
    preprocesadores: dict[str, ColumnTransformer],
    output_dir: Path,
) -> dict[str, float]:
    pareja = X_train.iloc[:2][QUANTITATIVE_COLUMNS]
    original = pareja.to_numpy(dtype=float)
    distancias = {"sin_escalar": float(np.linalg.norm(original[0] - original[1]))}
    aportes: list[dict[str, Any]] = []

    for columna_indice, columna in enumerate(QUANTITATIVE_COLUMNS):
        diferencia = float(abs(original[0, columna_indice] - original[1, columna_indice]))
        aporte_cuadratico = float((original[0, columna_indice] - original[1, columna_indice]) ** 2)
        aportes.append(
            {
                "variable": columna,
                "diferencia_absoluta_sin_escalar": diferencia,
                "porcentaje_distancia_cuadratica_sin_escalar": (
                    100.0 * aporte_cuadratico / distancias["sin_escalar"] ** 2
                    if distancias["sin_escalar"]
                    else 0.0
                ),
            }
        )

    for nombre, preprocesador in preprocesadores.items():
        escalador = preprocesador.named_transformers_["cuantitativas"]
        pareja_escalada = escalador.transform(pareja)
        distancia = float(np.linalg.norm(pareja_escalada[0] - pareja_escalada[1]))
        distancias[f"{nombre}_escalada"] = distancia
        for indice, columna in enumerate(QUANTITATIVE_COLUMNS):
            aportes[indice][f"diferencia_absoluta_{nombre}"] = float(
                abs(pareja_escalada[0, indice] - pareja_escalada[1, indice])
            )

    pd.DataFrame(aportes).sort_values(
        "porcentaje_distancia_cuadratica_sin_escalar", ascending=False
    ).to_csv(output_dir / "diagnostico_aportes_distancia.csv", index=False)
    print("\n--- Distancia entre dos registros del conjunto train ---")
    for nombre, distancia in distancias.items():
        print(f"{nombre:<20}: {distancia:.4f}")
    return distancias


def aplicar_pca_standard(
    preprocesador_standard: ColumnTransformer,
    X_train: pd.DataFrame,
    X_test: pd.DataFrame,
    output_dir: Path,
) -> dict[str, Any]:
    escalador = preprocesador_standard.named_transformers_["cuantitativas"]
    train_escalado = escalador.transform(X_train[QUANTITATIVE_COLUMNS])
    test_escalado = escalador.transform(X_test[QUANTITATIVE_COLUMNS])

    pca_completo = PCA().fit(train_escalado)
    varianza = pca_completo.explained_variance_ratio_
    acumulada = varianza.cumsum()
    componentes_80 = min(int(np.searchsorted(acumulada, 0.80) + 1), len(QUANTITATIVE_COLUMNS))
    componentes_90 = min(int(np.searchsorted(acumulada, 0.90) + 1), len(QUANTITATIVE_COLUMNS))

    pca_90 = PCA(n_components=componentes_90).fit(train_escalado)
    X_pca_train = pca_90.transform(train_escalado)
    X_pca_test = pca_90.transform(test_escalado)
    nombres = [f"PC{indice}" for indice in range(1, componentes_90 + 1)]
    pd.DataFrame(X_pca_train, columns=nombres).to_csv(
        output_dir / "X_pca_train.csv", index=False
    )
    pd.DataFrame(X_pca_test, columns=nombres).to_csv(
        output_dir / "X_pca_test.csv", index=False
    )
    pd.DataFrame(
        {
            "componente": [f"PC{indice}" for indice in range(1, len(varianza) + 1)],
            "varianza_explicada": varianza,
            "varianza_acumulada": acumulada,
        }
    ).to_csv(output_dir / "pca_varianza.csv", index=False)
    joblib.dump(pca_90, output_dir / "pca_standard.joblib")

    print("\n--- PCA después de StandardScaler (solo variables cuantitativas) ---")
    print(f"Varianza acumulada: {np.round(acumulada, 4).tolist()}")
    print(f"Componentes para >=80%: {componentes_80}")
    print(f"Componentes para >=90%: {componentes_90}")
    return {
        "variables_entrada": len(QUANTITATIVE_COLUMNS),
        "componentes_para_80_por_ciento": componentes_80,
        "componentes_para_90_por_ciento": componentes_90,
        "varianza_conservada": float(pca_90.explained_variance_ratio_.sum()),
    }


def ejecutar(args: argparse.Namespace) -> None:
    ruta_entrada = args.input.resolve()
    output_dir = args.output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    df = cargar_y_validar(ruta_entrada)

    X = df[FEATURE_COLUMNS]
    y = df[TARGET]
    indices_train, indices_test = train_test_split(
        np.arange(len(df)),
        test_size=args.test_size,
        random_state=args.random_state,
        stratify=y,
    )
    X_train = X.iloc[indices_train].copy()
    X_test = X.iloc[indices_test].copy()
    y_train = y.iloc[indices_train].reset_index(drop=True)
    y_test = y.iloc[indices_test].reset_index(drop=True)

    print(f"Dataset de entrada: {df.shape}")
    print(f"Train: {len(X_train)} | Test: {len(X_test)}")
    print(
        "Características: "
        f"{len(QUANTITATIVE_COLUMNS)} cuantitativas, "
        f"{len(CATEGORICAL_COLUMNS)} categóricas, {len(BINARY_COLUMNS)} binarias."
    )

    preprocesadores: dict[str, ColumnTransformer] = {}
    comparaciones: list[dict[str, Any]] = []
    resumen_variables: list[dict[str, Any]] = []

    for nombre, clase_escalador in SCALERS.items():
        preprocesador = crear_preprocesador(clase_escalador())
        matriz_train = preprocesador.fit_transform(X_train)
        matriz_test = preprocesador.transform(X_test)
        nombres_columnas = preprocesador.get_feature_names_out()

        # El objetivo y el identificador nunca se agregan a las matrices predictoras.
        pd.DataFrame(matriz_train, columns=nombres_columnas).to_csv(
            output_dir / f"X_{nombre}_train.csv", index=False
        )
        pd.DataFrame(matriz_test, columns=nombres_columnas).to_csv(
            output_dir / f"X_{nombre}_test.csv", index=False
        )
        joblib.dump(preprocesador, output_dir / f"preprocesador_{nombre}.joblib")
        preprocesadores[nombre] = preprocesador

        escalador_ajustado = preprocesador.named_transformers_["cuantitativas"]
        valores_escalados_train = escalador_ajustado.transform(
            X_train[QUANTITATIVE_COLUMNS]
        )
        resumen, variables = resumen_por_escalador(
            escalador_ajustado, valores_escalados_train, nombre
        )
        comparaciones.append(resumen)
        resumen_variables.extend(variables)

    y_train.to_frame().to_csv(output_dir / "y_train.csv", index=False)
    y_test.to_frame().to_csv(output_dir / "y_test.csv", index=False)
    pd.DataFrame(
        {
            ID_COLUMN: df.iloc[indices_train][ID_COLUMN].to_numpy(),
            "particion": "train",
        }
    ).to_csv(output_dir / "referencias_train.csv", index=False)
    pd.DataFrame(
        {
            ID_COLUMN: df.iloc[indices_test][ID_COLUMN].to_numpy(),
            "particion": "test",
        }
    ).to_csv(output_dir / "referencias_test.csv", index=False)

    pd.DataFrame(comparaciones).to_csv(
        output_dir / "comparacion_escaladores.csv", index=False
    )
    pd.DataFrame(resumen_variables).to_csv(
        output_dir / "resumen_escaladores_por_variable.csv", index=False
    )
    distancias = diagnosticar_distancias(X_train, preprocesadores, output_dir)
    resumen_pca = aplicar_pca_standard(
        preprocesadores["standard"], X_train, X_test, output_dir
    )

    columnas_transformadas = len(preprocesadores["standard"].get_feature_names_out())
    reporte = {
        "archivo_entrada": ruta_entrada.name,
        "filas_entrada": int(len(df)),
        "columnas_entrada": int(df.shape[1]),
        "filas_train": int(len(X_train)),
        "filas_test": int(len(X_test)),
        "columnas_X_modelado": int(columnas_transformadas),
        "objetivo_separado": TARGET,
        "identificador_excluido_de_X": ID_COLUMN,
        "variables_cuantitativas_escaladas": QUANTITATIVE_COLUMNS,
        "variables_categoricas_codificadas_one_hot": CATEGORICAL_COLUMNS,
        "variables_binarias_conservadas_0_1": BINARY_COLUMNS,
        "escaladores_comparados": list(SCALERS),
        "distancias_euclidianas": distancias,
        "pca_sobre_standard_scaler": resumen_pca,
        "semilla": args.random_state,
        "test_size": args.test_size,
        "ajuste_solo_con_train": True,
        "decisiones": [
            "StandardScaler es la opción principal general y la requerida antes de PCA.",
            "MinMaxScaler lleva las variables cuantitativas al rango [0, 1].",
            "RobustScaler usa mediana e IQR para reducir la influencia de valores extremos.",
            "Los códigos de Browser, Region, OperatingSystems y TrafficType son categorías: se codifican, no se escalan como magnitudes.",
            "Weekend y Cupon_Aplicado ya son binarias y se mantienen 0/1.",
            "Session_ID es identificador y Revenue es objetivo; ninguno se incorpora a X.",
            "Los escaladores, el codificador y PCA se ajustan únicamente con train.",
        ],
    }
    (output_dir / "reporte_escalamiento.json").write_text(
        json.dumps(reporte, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    print("\n--- Resumen de escaladores ---")
    print(pd.DataFrame(comparaciones).round(4).to_string(index=False))
    print("\n--- Salidas ---")
    print(f"X por cada escalador: {len(X_train)} filas train, {len(X_test)} filas test")
    print(f"Columnas en X: {columnas_transformadas} | objetivo y separado")
    print(f"Matrices PCA: {len(QUANTITATIVE_COLUMNS)} -> {resumen_pca['componentes_para_90_por_ciento']} columnas")
    print(f"Resultados guardados en: {output_dir}")


def main() -> None:
    args = parse_args()
    if not 0 < args.test_size < 1:
        raise ValueError("--test-size debe ser mayor que 0 y menor que 1.")
    ejecutar(args)


if __name__ == "__main__":
    main()
