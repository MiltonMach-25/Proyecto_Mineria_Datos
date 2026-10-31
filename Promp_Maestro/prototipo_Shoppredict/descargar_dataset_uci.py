from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
import requests
from ucimlrepo import fetch_ucirepo


PROJECT_DIR = Path(__file__).resolve().parent
DEFAULT_OUTPUT = PROJECT_DIR / "online_shoppers_intention_uci.csv"
UCI_DATASET_URL = (
    "https://archive.ics.uci.edu/dataset/468/"
    "online+shoppers+purchasing+intention+dataset"
)
KAGGLE_DATASET_URL = (
    "https://www.kaggle.com/datasets/imakash3011/"
    "online-shoppers-purchasing-intention-dataset"
)


def download_dataset(output: Path, overwrite: bool = False) -> tuple[Path, Path]:
    metadata_path = output.with_suffix(".metadata.json")
    if (output.exists() or metadata_path.exists()) and not overwrite:
        raise FileExistsError(
            f"{output} o {metadata_path} ya existe. Elige otro --output o usa "
            "--overwrite para reemplazarlos."
        )

    dataset = fetch_ucirepo(id=468)
    features = dataset.data.features
    targets = dataset.data.targets
    if features is None or targets is None or len(targets.columns) != 1:
        raise ValueError("UCI returned an unexpected feature/target structure.")
    target_name = targets.columns[0]
    if target_name != "Revenue":
        targets = targets.rename(columns={target_name: "Revenue"})

    data = pd.concat([features, targets], axis=1)
    if "Revenue" not in data.columns or len(data) == 0:
        raise ValueError("UCI response does not contain usable Revenue records.")

    output.parent.mkdir(parents=True, exist_ok=True)
    data.to_csv(output, index=False)
    metadata = {
        "dataset": dataset.metadata.name,
        "uci_id": dataset.metadata.uci_id,
        "dataset_doi": dataset.metadata.dataset_doi,
        "fetched_at_utc": datetime.now(timezone.utc).isoformat(),
        "rows": len(data),
        "columns": len(data.columns),
        "target": "Revenue",
        "uci_source": UCI_DATASET_URL,
        "kaggle_mirror": KAGGLE_DATASET_URL,
        "note": (
            "Fetched live from UCI via ucimlrepo. Kaggle is a mirror reference; "
            "this script does not use Kaggle credentials or claim a Kaggle API download."
        ),
    }
    metadata_path.write_text(
        json.dumps(metadata, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    return output, metadata_path


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Descarga Online Shoppers Purchasing Intention desde la API/repositorio UCI."
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help=f"CSV de salida (por defecto: {DEFAULT_OUTPUT.name}).",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Permite reemplazar explícitamente el CSV de salida.",
    )
    args = parser.parse_args()
    try:
        output, metadata_path = download_dataset(args.output, args.overwrite)
    except (FileExistsError, OSError, ValueError, requests.exceptions.RequestException) as error:
        print(f"No se pudo descargar el dataset: {error}", file=sys.stderr)
        return 1

    print(f"Dataset descargado: {output}")
    print(f"Metadatos de origen: {metadata_path}")
    print("Fuente consultada: repositorio/API oficial UCI, dataset ID 468.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
