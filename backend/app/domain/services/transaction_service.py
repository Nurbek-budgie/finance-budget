from typing import List

from app.domain.models.transaction import Transaction
from app.domain.repositories.transaction_repository import TransactionRepository


class TransactionService:
    def __init__(self, repository: TransactionRepository):
        self.repository = repository

    def create_transaction(self, transaction: Transaction) -> Transaction:
        return self.repository.create(transaction)

    def create_many(self, transactions: List[Transaction]) -> List[Transaction]:
        return self.repository.create_many(transactions)

    def get_summary(self) -> dict:
        transactions = self.repository.get_all(limit=100_000)
        total_income = sum(t.amount for t in transactions if t.is_income())
        total_expenses = sum(t.amount for t in transactions if t.is_expense())
        return {
            "total_income": total_income,
            "total_expenses": total_expenses,
            "balance": total_income - total_expenses,
            "transaction_count": len(transactions),
        }

    def get_balance(self) -> float:
        summary = self.get_summary()
        return summary["balance"]
