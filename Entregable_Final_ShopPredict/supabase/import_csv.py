#!/usr/bin/env python3
import hashlib
import os
import sys
from pathlib import Path

import pandas as pd
from supabase import create_client

PACKAGE = Path(__file__).resolve().parents[1]
DEFAULT_CSV = PACKAGE / "data" / "online_shoppers_intention.csv"

EXPECTED = [
    "Administrative", "Administrative_Duration", "Informational",
    "Informational_Duration", "ProductRelated", "ProductRelated_Duration",
    "BounceRates", "ExitRates", "PageValues", "SpecialDay", "Month",
    "OperatingSystems", "Browser", "Region", "TrafficType",
    "VisitorType", "Weekend", "Revenue"
]


def bool_value(value):
    if isinstance(value, bool):
        return value
    text = str(value).strip().lower()
    if text in {"true", "1"}:
        return True
    if text in {"false", "0"}:
        return False
    raise ValueError(f"Revenue inválido: {value}")


def row_hash(row):
    canonical = "|".join("" if pd.isna(row[name]) else str(row[name]) for name in EXPECTED)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def main():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("ERROR: define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.")
        return 2

    csv_path = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else DEFAULT_CSV
    if not csv_path.exists():
        print(f"ERROR: no existe {csv_path}")
        return 2

    df = pd.read_csv(csv_path)
    missing = [name for name in EXPECTED if name not in df.columns]
    if missing:
        print("ERROR: faltan columnas: " + ", ".join(missing))
        return 2

    deduplicated = df.drop_duplicates(subset=EXPECTED).copy()
    records = []
    for _, row in deduplicated.iterrows():
        records.append({
            "row_hash": row_hash(row),
            "administrative": int(row["Administrative"]),
            "administrative_duration": float(row["Administrative_Duration"]),
            "informational": int(row["Informational"]),
            "informational_duration": float(row["Informational_Duration"]),
            "product_related": int(row["ProductRelated"]),
            "product_related_duration": float(row["ProductRelated_Duration"]),
            "bounce_rates": float(row["BounceRates"]),
            "exit_rates": float(row["ExitRates"]),
            "page_values": float(row["PageValues"]),
            "special_day": float(row["SpecialDay"]),
            "month": str(row["Month"]),
            "operating_systems": int(row["OperatingSystems"]),
            "browser": int(row["Browser"]),
            "region": int(row["Region"]),
            "traffic_type": int(row["TrafficType"]),
            "visitor_type": str(row["VisitorType"]),
            "weekend": bool_value(row["Weekend"]),
            "revenue": bool_value(row["Revenue"])
        })

    client = create_client(url, key)
    inserted = 0
    for start in range(0, len(records), 500):
        batch = records[start:start + 500]
        client.table("shoppredict_sessions").upsert(
            batch,
            on_conflict="row_hash"
        ).execute()
        inserted += len(batch)

    print(f"OK: {inserted} registros únicos procesados.")
    print(f"Fuente: {csv_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
