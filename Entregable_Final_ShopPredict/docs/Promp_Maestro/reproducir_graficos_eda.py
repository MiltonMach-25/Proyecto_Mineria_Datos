from __future__ import annotations

import argparse
from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns


PACKAGE_DIR = Path(__file__).resolve().parent
DEFAULT_DATASET = (
    PACKAGE_DIR / "prototipo_Shoppredict" / "online_shoppers_intention.csv"
)
DEFAULT_OUTPUT_DIR = PACKAGE_DIR / "evidencias" / "eda"
NUMERIC_FEATURES = [
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
]


def normalize_revenue(values: pd.Series) -> pd.Series:
    if pd.api.types.is_bool_dtype(values):
        result = values.astype(bool)
    elif pd.api.types.is_numeric_dtype(values):
        result = values.map({0: False, 1: True})
    else:
        result = (
            values.astype("string")
            .str.strip()
            .str.lower()
            .map({"true": True, "false": False, "1": True, "0": False})
        )
    if result.isna().any() or result.nunique() != 2:
        raise ValueError("Revenue debe contener las dos clases True/False o 1/0.")
    return result.astype(bool)


def save_figure(figure: plt.Figure, output: Path, filename: str) -> None:
    figure.tight_layout()
    figure.savefig(output / filename, dpi=180, bbox_inches="tight")
    plt.close(figure)
    print(f"Gráfico generado: {output / filename}")


def generate_figures(dataset: Path, output: Path) -> None:
    data = pd.read_csv(dataset)
    required = {
        "Revenue",
        "PageValues",
        "ProductRelated_Duration",
        "BounceRates",
        "ExitRates",
    }
    missing = sorted(required - set(data.columns))
    if missing:
        raise ValueError(f"Faltan columnas requeridas: {', '.join(missing)}.")

    data = data.copy()
    data["Revenue"] = normalize_revenue(data["Revenue"])
    data["Etiqueta_compra"] = data["Revenue"].map(
        {False: "Sin compra", True: "Compra"}
    )
    output.mkdir(parents=True, exist_ok=True)
    sns.set_theme(style="whitegrid", context="notebook")

    zero_share = float(data["PageValues"].eq(0).mean() * 100)
    positive_values = data.loc[data["PageValues"] > 0, "PageValues"]
    if positive_values.empty:
        raise ValueError("PageValues no contiene valores positivos para graficar.")
    figure, axis = plt.subplots(figsize=(8, 5))
    sns.histplot(positive_values, bins=30, kde=len(positive_values) > 1, ax=axis)
    axis.set_title("PageValues positivos; filas en cero: " f"{zero_share:.2f}%")
    axis.set_xlabel("PageValues (valor de página del dataset)")
    axis.set_ylabel("Número de filas")
    save_figure(figure, output, "01_histograma_pagevalues.png")

    figure, axis = plt.subplots(figsize=(8, 5))
    sns.boxplot(
        data=data,
        x="Etiqueta_compra",
        y="ProductRelated_Duration",
        order=["Sin compra", "Compra"],
        hue="Etiqueta_compra",
        hue_order=["Sin compra", "Compra"],
        palette={"Sin compra": "#E11D48", "Compra": "#10B981"},
        legend=False,
        ax=axis,
    )
    axis.set_title("Duración en páginas de productos según Revenue")
    axis.set_xlabel("Resultado de la sesión")
    axis.set_ylabel("Duración (segundos)")
    save_figure(figure, output, "02_boxplot_product_duration.png")

    if "Canal_Origen" in data.columns:
        conversion = (
            data.groupby("Canal_Origen", dropna=False)["Revenue"]
            .mean()
            .mul(100)
            .sort_values()
        )
        figure, axis = plt.subplots(figsize=(8, 5))
        bars = axis.barh(
            conversion.index.astype(str),
            conversion.to_numpy(),
            color="#2563EB",
        )
        axis.bar_label(bars, fmt="%.2f%%", padding=3)
        axis.set_title("Conversión por Canal_Origen (campo sintético)")
        axis.set_xlabel("Sesiones con compra (%)")
        axis.set_ylabel("Canal simulado")
        save_figure(figure, output, "03_conversion_canal_sintetico.png")
        print(
            "Advertencia: Canal_Origen es un campo sintético; estas tasas no "
            "representan canales reales ni respaldan decisiones de negocio."
        )
    else:
        print(
            "No se genera el gráfico por canal: Canal_Origen no existe en el "
            "CSV original. No se inventan canales para completar la figura."
        )

    scatter_data = data.sample(min(len(data), 2000), random_state=42)
    figure, axis = plt.subplots(figsize=(8, 5))
    sns.scatterplot(
        data=scatter_data,
        x="BounceRates",
        y="ExitRates",
        hue="Etiqueta_compra",
        hue_order=["Sin compra", "Compra"],
        alpha=0.55,
        palette={"Sin compra": "#E11D48", "Compra": "#10B981"},
        ax=axis,
    )
    axis.set_title("BounceRates y ExitRates por resultado de sesión")
    axis.set_xlabel("BounceRates")
    axis.set_ylabel("ExitRates")
    save_figure(figure, output, "04_dispersion_bounce_exit.png")

    numeric_columns = [
        column
        for column in NUMERIC_FEATURES
        if column in data.columns and pd.api.types.is_numeric_dtype(data[column])
    ]
    correlation_data = data[numeric_columns].copy()
    correlation_data["Revenue"] = data["Revenue"].astype(int)
    figure, axis = plt.subplots(figsize=(10, 8))
    sns.heatmap(
        correlation_data.corr(),
        annot=True,
        fmt=".2f",
        cmap="coolwarm",
        vmin=-1,
        vmax=1,
        linewidths=0.4,
        ax=axis,
    )
    axis.set_title("Correlaciones de Pearson: variables numéricas y Revenue")
    save_figure(figure, output, "05_heatmap_correlaciones.png")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Reproduce las gráficas EDA a partir de un CSV disponible."
    )
    parser.add_argument(
        "--dataset",
        type=Path,
        default=DEFAULT_DATASET,
        help=f"CSV de entrada (por defecto: {DEFAULT_DATASET}).",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        help=f"Carpeta de salida (por defecto: {DEFAULT_OUTPUT_DIR}).",
    )
    args = parser.parse_args()
    if not args.dataset.is_file():
        parser.error(f"No existe el archivo CSV: {args.dataset}")
    try:
        generate_figures(args.dataset, args.output_dir)
    except (OSError, pd.errors.ParserError, ValueError) as error:
        parser.error(str(error))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
