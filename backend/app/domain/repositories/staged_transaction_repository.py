from abc import ABC, abstractmethod
from typing import List

from app.domain.models.staged_transaction import StagedTransaction
from app.domain.models.transaction import Transaction


class StagedTransactionRepository(ABC):
    @abstractmethod
    def create_many(self, items: List[StagedTransaction]) -> None: ...

    @abstractmethod
    def get_pending(self, limit: int = 100, offset: int = 0) -> List[StagedTransaction]: ...

    @abstractmethod
    def approve_many(self, ids: List[str]) -> List[Transaction]: ...

    @abstractmethod
    def reject_many(self, ids: List[str]) -> int: ...

    @abstractmethod
    def exists_by_external_id(self, external_id: str) -> bool: ...
