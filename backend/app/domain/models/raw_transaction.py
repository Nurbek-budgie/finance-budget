from dataclasses import dataclass
from typing import Optional


@dataclass
class RawTransaction:
    external_id: Optional[str]  # operation # from bank; None for CSV sources
    date_str: str      # raw date string exactly as it appears in the file
    sender: str        # counterparty / beneficiary name
    description: str   # free-text narration
    amount: float      # signed: positive = income, negative = expense
    source: str        # "kicb_excel" | "csv"
