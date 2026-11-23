import asyncio
import io
import unittest
from types import SimpleNamespace

import pandas as pd
from fastapi import HTTPException

from backend.api_shoppredict import (
    EXPECTED_COLUMNS,
    NUMERIC_COLUMNS,
    sample_csv,
    stats,
    validate_dataset,
)


class UploadedFile:
    def __init__(self, content: bytes):
        self.content = content

    async def read(self, size: int = -1) -> bytes:
        return self.content[:size]

    async def close(self) -> None:
        return None


class ApiTests(unittest.TestCase):
    def test_stats_uses_clean_training_rows_and_verified_model_metrics(self):
        request = SimpleNamespace(
            app=SimpleNamespace(
                state=SimpleNamespace(
                    features=pd.DataFrame(
                        {"ProductRelated_Duration": [10.0, 20.0, 30.0]}
                    ),
                    target=pd.Series([False, True, True]),
                    model_metrics=[{"name": "Árbol", "accuracy": 0.8, "f1": 0.6}],
                )
            )
        )

        result = stats(request)

        self.assertEqual(result["total"], 3)
        self.assertEqual(result["purchases"], 2)
        self.assertAlmostEqual(result["conversion"], 2 / 3)
        self.assertEqual(result["avg_duration"], 20.0)
        self.assertEqual(result["models"][0]["name"], "Árbol")

    def test_stats_filters_kpis_but_keeps_model_metrics_global(self):
        request = SimpleNamespace(
            app=SimpleNamespace(
                state=SimpleNamespace(
                    features=pd.DataFrame(
                        {
                            "ProductRelated_Duration": [10.0, 20.0, 30.0],
                            "Month": ["Feb", "Jan", "Feb"],
                            "VisitorType": [
                                "New_Visitor",
                                "Returning_Visitor",
                                "Returning_Visitor",
                            ],
                        }
                    ),
                    target=pd.Series([False, True, True]),
                    model_metrics=[{"name": "Árbol", "accuracy": 0.8, "f1": 0.6}],
                )
            )
        )

        result = stats(request, month="Feb")

        self.assertEqual(result["total"], 2)
        self.assertEqual(result["purchases"], 1)
        self.assertEqual(result["avg_duration"], 20.0)
        self.assertIn("holdout global", result["metrics_scope"])
        self.assertEqual(len(result["models"]), 1)
        with self.assertRaises(HTTPException) as error:
            stats(request, month="Unknown")
        self.assertEqual(error.exception.status_code, 422)

    def test_stats_returns_filtered_breakdowns_for_dashboard_charts(self):
        request = SimpleNamespace(
            app=SimpleNamespace(
                state=SimpleNamespace(
                    features=pd.DataFrame(
                        {
                            "ProductRelated_Duration": [10.0, 20.0, 30.0],
                            "Month": ["Jan", "Feb", "Jan"],
                            "VisitorType": [
                                "Returning_Visitor",
                                "New_Visitor",
                                "Returning_Visitor",
                            ],
                            "Weekend": [False, True, True],
                            "PageValues": [0.0, 5.0, 10.0],
                            "BounceRates": [0.1, 0.2, 0.3],
                            "ExitRates": [0.2, 0.3, 0.4],
                            "ProductRelated": [1, 2, 3],
                        }
                    ),
                    target=pd.Series([False, True, True]),
                    model_metrics=[],
                )
            )
        )

        result = stats(request, month="Jan")
        breakdown = result["breakdown"]

        self.assertEqual(breakdown["by_month"][0]["month"], "Jan")
        self.assertEqual(breakdown["by_month"][0]["total"], 2)
        self.assertEqual(breakdown["by_month"][0]["purchases"], 1)
        self.assertEqual(breakdown["by_visitor"][0]["visitor_type"], "Returning_Visitor")
        self.assertEqual(breakdown["page_values_signal"]["zero_total"], 1)
        self.assertEqual(breakdown["page_values_signal"]["positive_total"], 1)
        self.assertAlmostEqual(breakdown["averages"]["product_related"], 2.0)

    def test_sample_csv_contains_both_real_target_classes(self):
        features = pd.DataFrame(
            {
                column: [0, 1, 2, 3]
                for column in EXPECTED_COLUMNS
                if column != "Revenue"
            }
        )
        features["Month"] = ["Jan", "Feb", "Mar", "Apr"]
        features["VisitorType"] = ["New_Visitor", "Returning_Visitor"] * 2
        request = SimpleNamespace(
            app=SimpleNamespace(
                state=SimpleNamespace(
                    features=features,
                    target=pd.Series([True, False, True, False]),
                )
            )
        )

        response = sample_csv(request)
        sample = pd.read_csv(io.StringIO(response.body.decode("utf-8")))

        self.assertEqual(response.media_type, "text/csv")
        self.assertEqual(list(sample.columns), EXPECTED_COLUMNS)
        self.assertEqual(sample["Revenue"].tolist(), [True, True, False, False])

    def test_csv_validation_reports_duplicates_without_persisting_upload(self):
        rows = []
        for index in range(10):
            row = {column: 0 for column in EXPECTED_COLUMNS}
            for column in NUMERIC_COLUMNS:
                row[column] = index
            row["Month"] = "Feb"
            row["VisitorType"] = "Returning_Visitor"
            row["Weekend"] = False
            row["Revenue"] = index % 2 == 0
            rows.append(row)
        rows.append(dict(rows[0]))
        buffer = io.StringIO()
        pd.DataFrame(rows).to_csv(buffer, index=False)
        upload = UploadedFile(buffer.getvalue().encode("utf-8"))

        result = asyncio.run(validate_dataset(upload))

        self.assertTrue(result["valid"])
        self.assertEqual(result["rows"], 11)
        self.assertEqual(result["duplicates"], 1)
        self.assertFalse(result["persisted"])

    def test_csv_validation_reports_missing_required_columns(self):
        upload = UploadedFile(b"Revenue\nTrue\nFalse\n")

        result = asyncio.run(validate_dataset(upload))

        self.assertFalse(result["valid"])
        self.assertIn("Administrative", result["missing_columns"])
        self.assertTrue(result["issues"])

    def test_csv_validation_rejects_unexpected_columns(self):
        rows = []
        for index in range(10):
            row = {column: 0 for column in EXPECTED_COLUMNS}
            row["Month"] = "Feb"
            row["VisitorType"] = "Returning_Visitor"
            row["Weekend"] = False
            row["Revenue"] = index % 2 == 0
            row["Session_ID"] = index
            rows.append(row)
        buffer = io.StringIO()
        pd.DataFrame(rows).to_csv(buffer, index=False)

        result = asyncio.run(
            validate_dataset(UploadedFile(buffer.getvalue().encode("utf-8")))
        )

        self.assertFalse(result["valid"])
        self.assertEqual(result["extra_columns"], ["Session_ID"])


if __name__ == "__main__":
    unittest.main()
