from abc import ABC, abstractmethod
from typing import List, Optional

from app.domain.models.tag_rule import TagRule


class TagRuleRepository(ABC):
    @abstractmethod
    def get_active_rules(self) -> List[TagRule]: ...

    @abstractmethod
    def get_all(self) -> List[TagRule]: ...

    @abstractmethod
    def get_by_id(self, rule_id: str) -> Optional[TagRule]: ...

    @abstractmethod
    def create(self, rule: TagRule) -> TagRule: ...

    @abstractmethod
    def delete(self, rule_id: str) -> bool: ...
