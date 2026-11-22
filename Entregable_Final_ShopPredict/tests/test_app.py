import csv
import tempfile
import unittest
from pathlib import Path

from app import DATA_COLUMNS, load_stats


class LoadStatsTests(unittest.TestCase):
    def test_deduplicates_rows_before_calculating_dashboard_metrics(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            directory = Path(temporary_directory)
            dataset_path = directory / "dataset.csv"
            metrics_path = directory / "metrics.csv"

            first = {column: "0" for column in DATA_COLUMNS}
            first.update({
                "ProductRelated_Duration": "10",
                "Revenue": "TRUE",
            })
            second = dict(first)
            second.update({
                "ProductRelated_Duration": "20",
                "Revenue": "FALSE",
            })

            with dataset_path.open("w", newline="", encoding="utf-8") as dataset_file:
                writer = csv.DictWriter(dataset_file, fieldnames=DATA_COLUMNS)
                writer.writeheader()
                writer.writerow(first)
                writer.writerow(first)
                writer.writerow(second)

            with metrics_path.open("w", newline="", encoding="utf-8") as metrics_file:
                writer = csv.DictWriter(metrics_file, fieldnames=("name", "accuracy", "f1"))
                writer.writeheader()
                writer.writerow({"name": "Árbol", "accuracy": "0.8", "f1": "0.6"})

            stats = load_stats(dataset_path, metrics_path)

        self.assertEqual(stats["total"], 2)
        self.assertEqual(stats["purchases"], 1)
        self.assertEqual(stats["conversion"], 0.5)
        self.assertEqual(stats["avg_duration"], 15)
        self.assertEqual(stats["models"][0]["name"], "Árbol")
