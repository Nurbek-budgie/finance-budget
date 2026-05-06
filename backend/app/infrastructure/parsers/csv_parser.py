from csv import DictReader
from io import StringIO

from app.domain.models.raw_transaction import RawTransaction


class CSVParser:
    """
    Parses the existing CSV format:
    date,description,amount,type[,category]
    The 'type' column (income/expense) maps to signed amount convention here:
    income → positive amount, expense → negative amount.
    """

    def parse(self, content: bytes, filename: str) -> list[RawTransaction]:
        text = content.decode("utf-8")
        reader = DictReader(StringIO(text))
        results: list[RawTransaction] = []

        for row in reader:
            try:
                raw_amount = float(row["amount"].strip())
                tx_type = row.get("type", "").strip().lower()
                # Normalise to signed: expense → negative
                if tx_type == "expense" and raw_amount > 0:
                    raw_amount = -raw_amount

                results.append(
                    RawTransaction(
                        external_id="",
                        date_str=row["date"].strip(),
                        sender="",
                        description=row.get("description", "").strip(),
                        amount=raw_amount,
                        source="csv",
                    )
                )
            except Exception:
                # Row-level errors are surfaced by IngestionService
                continue

        return results
