from abc import ABC, abstractmethod
from datetime import date
from typing import List, Optional

from app.domain.models.transaction import Transaction


class TransactionRepository(ABC):
    @abstractmethod
    def create(self, transaction: Transaction) -> Transaction: ...

    @abstractmethod
    def create_many(self, transactions: List[Transaction]) -> List[Transaction]: ...

    @abstractmethod
    def create_many_with_external_ids(self, transactions: List[Transaction]) -> List[Transaction]: ...

    @abstractmethod
    def get_all(self, limit: int = 100, offset: int = 0) -> List[Transaction]: ...

    @abstractmethod
    def get_by_date_range(
        self, start: date, end: date, limit: int = 100_000
    ) -> List[Transaction]: ...

    @abstractmethod
    def get_by_id(self, transaction_id: str) -> Optional[Transaction]: ...

    @abstractmethod
    def delete(self, transaction_id: str) -> bool: ...

    @abstractmethod
    def exists_by_external_id(self, external_id: str) -> bool: ...
