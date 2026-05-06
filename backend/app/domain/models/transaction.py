from datetime import datetime
from enum import Enum
from typing import Optional


class TransactionType(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"


class Transaction:
    def __init__(
        self,
        date: datetime,
        description: str,
        amount: float,
        transaction_type: TransactionType,
        id: Optional[str] = None,
        category: Optional[str] = None,
    ):
        self.id = id
        self.date = date
        self.description = description
        self.amount = amount
        self.transaction_type = transaction_type
        self.category = category

    def is_income(self) -> bool:
        return self.transaction_type == TransactionType.INCOME

    def is_expense(self) -> bool:
        return self.transaction_type == TransactionType.EXPENSE
