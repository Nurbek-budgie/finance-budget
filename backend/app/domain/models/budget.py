from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class Budget:
    category: str
    limit_amount: float
    period: str  # "monthly" | "weekly" | "yearly"
    id: Optional[str] = None
    created_at: Optional[datetime] = field(default=None)
