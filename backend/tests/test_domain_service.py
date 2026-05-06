"""Unit tests for TransactionService — no database involved."""
from datetime import datetime
from typing import List, Optional

import pytest

from app.domain.models.transaction import Transaction, TransactionType
from app.domain.repositories.transaction_repository import TransactionRepository
from app.domain.services.transaction_service import TransactionService


class InMemoryTransactionRepository(TransactionRepository):
    """Minimal in-memory repository for unit testing."""

    def __init__(self):
        self._store: List[Transaction] = []

    def create(self, transaction: Transaction) -> Transaction:
        self._store.append(transaction)
        return transaction

    def create_many(self, transactions: List[Transaction]) -> List[Transaction]:
        self._store.extend(transactions)
        return transactions

    def get_all(self, limit: int = 100, offset: int = 0) -> List[Transaction]:
        return self._store[offset : offset + limit]

    def get_by_id(self, transaction_id: str) -> Optional[Transaction]:
        return next((t for t in self._store if t.id == transaction_id), None)

    def delete(self, transaction_id: str) -> bool:
        before = len(self._store)
        self._store = [t for t in self._store if t.id != transaction_id]
        return len(self._store) < before


def make_transaction(amount: float, type_: TransactionType, id_: str = "1") -> Transaction:
    return Transaction(
        id=id_,
        date=datetime(2024, 1, 1),
        description="test",
        amount=amount,
        transaction_type=type_,
    )


@pytest.fixture
def service():
    return TransactionService(InMemoryTransactionRepository())


class TestGetSummary:
    def test_empty_store_returns_zeros(self, service):
        summary = service.get_summary()
        assert summary == {
            "total_income": 0,
            "total_expenses": 0,
            "balance": 0,
            "transaction_count": 0,
        }

    def test_income_only(self, service):
        service.create_transaction(make_transaction(1000.0, TransactionType.INCOME))
        summary = service.get_summary()
        assert summary["total_income"] == 1000.0
        assert summary["total_expenses"] == 0
        assert summary["balance"] == 1000.0
        assert summary["transaction_count"] == 1

    def test_expense_only(self, service):
        service.create_transaction(make_transaction(200.0, TransactionType.EXPENSE))
        summary = service.get_summary()
        assert summary["total_income"] == 0
        assert summary["total_expenses"] == 200.0
        assert summary["balance"] == -200.0

    def test_mixed_transactions(self, service):
        service.create_many([
            make_transaction(5000.0, TransactionType.INCOME, "1"),
            make_transaction(1200.0, TransactionType.INCOME, "2"),
            make_transaction(85.5, TransactionType.EXPENSE, "3"),
            make_transaction(120.0, TransactionType.EXPENSE, "4"),
        ])
        summary = service.get_summary()
        assert summary["total_income"] == 6200.0
        assert summary["total_expenses"] == 205.5
        assert summary["balance"] == pytest.approx(5994.5)
        assert summary["transaction_count"] == 4


class TestGetBalance:
    def test_balance_matches_summary(self, service):
        service.create_many([
            make_transaction(3000.0, TransactionType.INCOME, "1"),
            make_transaction(500.0, TransactionType.EXPENSE, "2"),
        ])
        assert service.get_balance() == service.get_summary()["balance"]

    def test_balance_can_be_negative(self, service):
        service.create_transaction(make_transaction(50.0, TransactionType.EXPENSE))
        assert service.get_balance() == -50.0


class TestCreateTransaction:
    def test_create_persists(self, service):
        t = make_transaction(100.0, TransactionType.INCOME)
        service.create_transaction(t)
        assert service.get_summary()["transaction_count"] == 1

    def test_create_many_persists_all(self, service):
        txns = [
            make_transaction(100.0, TransactionType.INCOME, "1"),
            make_transaction(200.0, TransactionType.EXPENSE, "2"),
            make_transaction(300.0, TransactionType.INCOME, "3"),
        ]
        service.create_many(txns)
        assert service.get_summary()["transaction_count"] == 3
