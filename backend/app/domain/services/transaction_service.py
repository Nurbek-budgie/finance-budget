from collections import defaultdict
from datetime import date, datetime, timedelta
from typing import List, Optional

from app.domain.models.transaction import Transaction
from app.domain.repositories.transaction_repository import TransactionRepository


class TransactionService:
    def __init__(self, repository: TransactionRepository):
        self.repository = repository

    def create_transaction(self, transaction: Transaction) -> Transaction:
        return self.repository.create(transaction)

    def create_many(self, transactions: List[Transaction]) -> List[Transaction]:
        return self.repository.create_many(transactions)

    def _summarise(self, transactions: List[Transaction]) -> dict:
        total_income = sum(t.amount for t in transactions if t.is_income())
        total_expenses = sum(t.amount for t in transactions if t.is_expense())
        return {
            "total_income": total_income,
            "total_expenses": total_expenses,
            "balance": total_income - total_expenses,
            "transaction_count": len(transactions),
        }

    def get_summary(self, start: Optional[date] = None, end: Optional[date] = None) -> dict:
        if start and end:
            transactions = self.repository.get_by_date_range(start, end)
        else:
            transactions = self.repository.get_all(limit=100_000)
        return self._summarise(transactions)

    def get_balance(self) -> float:
        return self.get_summary()["balance"]

    def get_daily_trend(self, start: date, end: date) -> List[dict]:
        transactions = self.repository.get_by_date_range(start, end)

        # Build a dict keyed by date string so every day in range appears
        income_by_day: dict[str, float] = defaultdict(float)
        expenses_by_day: dict[str, float] = defaultdict(float)

        for t in transactions:
            day = t.date.strftime("%Y-%m-%d")
            if t.is_income():
                income_by_day[day] += t.amount
            else:
                expenses_by_day[day] += t.amount

        # Fill every calendar day in range (even days with no transactions)
        result = []
        current = start
        while current <= end:
            day = current.strftime("%Y-%m-%d")
            result.append({
                "date": day,
                "income": round(income_by_day[day], 2),
                "expenses": round(expenses_by_day[day], 2),
            })
            current += timedelta(days=1)

        return result

    def get_category_breakdown(
        self,
        start: Optional[date] = None,
        end: Optional[date] = None,
        transaction_type: Optional[str] = None,
    ) -> List[dict]:
        if start and end:
            transactions = self.repository.get_by_date_range(start, end)
        else:
            transactions = self.repository.get_all(limit=100_000)

        # Default: expense-only (legacy behaviour); "income" or "all" broaden the filter
        if transaction_type == "income":
            filtered = [t for t in transactions if t.is_income()]
        elif transaction_type == "all":
            filtered = transactions
        else:
            filtered = [t for t in transactions if t.is_expense()]

        totals: dict[Optional[str], float] = defaultdict(float)
        counts: dict[Optional[str], int] = defaultdict(int)
        types: dict[Optional[str], str] = {}

        for t in filtered:
            totals[t.category] += t.amount
            counts[t.category] += 1
            types[t.category] = t.transaction_type.value

        return [
            {
                "category": cat,
                "total": round(total, 2),
                "count": counts[cat],
                "transaction_type": types[cat],
            }
            for cat, total in sorted(totals.items(), key=lambda x: -x[1])
        ]
