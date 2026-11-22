import csv
import json
import math
import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parent
DATASET = ROOT / "data" / "online_shoppers_intention.csv"
METRICS = ROOT / "assets" / "evidencias" / "metricas_modelos.csv"
DATA_COLUMNS = (
    "Administrative", "Administrative_Duration", "Informational",
    "Informational_Duration", "ProductRelated", "ProductRelated_Duration",
    "BounceRates", "ExitRates", "PageValues", "SpecialDay", "Month",
    "OperatingSystems", "Browser", "Region", "TrafficType",
    "VisitorType", "Weekend", "Revenue",
)


def parse_bool(value):
    normalized = value.strip().lower()
    if normalized in {"true", "1"}:
        return True
    if normalized in {"false", "0"}:
        return False
    raise ValueError(f"Valor booleano inválido: {value!r}")


def load_stats(dataset_path=DATASET, metrics_path=METRICS):
    with dataset_path.open(newline="", encoding="utf-8-sig") as dataset_file:
        reader = csv.DictReader(dataset_file)
        missing = set(DATA_COLUMNS) - set(reader.fieldnames or ())
        if missing:
            raise ValueError("Faltan columnas requeridas: " + ", ".join(sorted(missing)))

        seen_rows = set()
        purchases = 0
        duration_total = 0.0
        for row in reader:
            identity = tuple(row[column] for column in DATA_COLUMNS)
            if identity in seen_rows:
                continue
            seen_rows.add(identity)
            purchases += parse_bool(row["Revenue"])
            duration = float(row["ProductRelated_Duration"])
            if not math.isfinite(duration):
                raise ValueError("ProductRelated_Duration debe ser un número finito")
            duration_total += duration

    total = len(seen_rows)
    if total == 0:
        raise ValueError("El dataset no contiene registros")

    models = []
    with metrics_path.open(newline="", encoding="utf-8-sig") as metrics_file:
        reader = csv.DictReader(metrics_file)
        required_metrics = {"name", "accuracy", "f1"}
        missing_metrics = required_metrics - set(reader.fieldnames or ())
        if missing_metrics:
            raise ValueError("Faltan columnas de métricas: " + ", ".join(sorted(missing_metrics)))
        for row in reader:
            models.append({
                "name": row["name"],
                "accuracy": float(row["accuracy"]),
                "f1": float(row["f1"]),
            })

    return {
        "total": total,
        "purchases": purchases,
        "conversion": purchases / total,
        "avg_duration": duration_total / total,
        "models": models,
    }


def handler_for(stats):
    class ShopPredictHandler(SimpleHTTPRequestHandler):
        def do_GET(self):
            if urlsplit(self.path).path != "/api/stats":
                return super().do_GET()

            body = json.dumps(stats, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)

    return ShopPredictHandler


def main():
    stats = load_stats()
    port = int(os.environ.get("PORT", "3000"))
    server = ThreadingHTTPServer(
        ("0.0.0.0", port),
        partial(handler_for(stats), directory=str(ROOT)),
    )
    print(f"ShopPredict listo en el puerto {port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
