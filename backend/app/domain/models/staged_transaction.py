from datetime import datetime
from enum import Enum
from typing import Optional

from app.domain.models.transaction import TransactionType


class StagedStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class StagedTransaction:
    def __init__(
        self,
        date: datetime,
        description: str,
        amount: float,
        transaction_type: TransactionType,
        external_id: str,
        source_file: str,
        suggested_category: Optional[str] = None,
        confidence_score: float = 0.0,
        status: StagedStatus = StagedStatus.PENDING,
        staged_at: Optional[datetime] = None,
        id: Optional[str] = None,
    ):
        self.id = id
        self.date = date
        self.description = description
        self.amount = amount
        self.transaction_type = transaction_type
        self.external_id = external_id
        self.source_file = source_file
        self.suggested_category = suggested_category
        self.confidence_score = confidence_score
        self.status = status
        self.staged_at = staged_at or datetime.utcnow()
