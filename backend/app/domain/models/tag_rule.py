from typing import Optional


class TagRule:
    def __init__(
        self,
        keyword: str,
        category: str,
        priority: int = 5,
        is_active: bool = True,
        id: Optional[str] = None,
    ):
        self.id = id
        self.keyword = keyword
        self.category = category
        self.priority = priority
        self.is_active = is_active
