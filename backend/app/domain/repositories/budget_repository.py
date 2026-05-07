from abc import ABC, abstractmethod
from typing import List, Optional

from app.domain.models.budget import Budget


class BudgetRepository(ABC):
    @abstractmethod
    def list(self) -> List[Budget]: ...

    @abstractmethod
    def get(self, budget_id: str) -> Optional[Budget]: ...

    @abstractmethod
    def create(self, budget: Budget) -> Budget: ...

    @abstractmethod
    def update(self, budget_id: str, category: Optional[str], limit_amount: Optional[float], period: Optional[str]) -> Optional[Budget]: ...

    @abstractmethod
    def delete(self, budget_id: str) -> bool: ...
