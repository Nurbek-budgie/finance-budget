import uuid
from typing import List

from sqlalchemy.orm import Session

from app.domain.models.staged_transaction import StagedStatus, StagedTransaction
from app.domain.models.transaction import Transaction, TransactionType
from app.domain.repositories.staged_transaction_repository import StagedTransactionRepository
from app.infrastructure.database.models import StagedTransactionORM, TransactionORM


def _to_domain(orm: StagedTransactionORM) -> StagedTransaction:
    return StagedTransaction(
        id=orm.id,
        date=orm.date,
        description=orm.description,
        amount=orm.amount,
        transaction_type=orm.transaction_type,
        external_id=orm.external_id,
        source_file=orm.source_file,
        suggested_category=orm.suggested_category,
        confidence_score=orm.confidence_score,
        status=orm.status,
        staged_at=orm.staged_at,
    )


class StagedTransactionRepositoryImpl(StagedTransactionRepository):
    def __init__(self, db: Session):
        self.db = db

    def create_many(self, items: List[StagedTransaction]) -> None:
        orm_objects = [
            StagedTransactionORM(
                id=item.id or str(uuid.uuid4()),
                date=item.date,
                description=item.description,
                amount=item.amount,
                transaction_type=item.transaction_type,
                external_id=item.external_id,
                source_file=item.source_file,
                suggested_category=item.suggested_category,
                confidence_score=item.confidence_score,
                status=item.status,
                staged_at=item.staged_at,
            )
            for item in items
        ]
        self.db.add_all(orm_objects)
        self.db.commit()

    def get_pending(self, limit: int = 100, offset: int = 0) -> List[StagedTransaction]:
        rows = (
            self.db.query(StagedTransactionORM)
            .filter(StagedTransactionORM.status == StagedStatus.PENDING)
            .order_by(StagedTransactionORM.date.desc())
            .limit(limit)
            .offset(offset)
            .all()
        )
        return [_to_domain(r) for r in rows]

    def approve_many(self, ids: List[str]) -> List[Transaction]:
        rows = (
            self.db.query(StagedTransactionORM)
            .filter(
                StagedTransactionORM.id.in_(ids),
                StagedTransactionORM.status == StagedStatus.PENDING,
            )
            .all()
        )

        promoted: List[Transaction] = []
        for staged in rows:
            staged.status = StagedStatus.APPROVED
            tx_orm = TransactionORM(
                id=str(uuid.uuid4()),
                date=staged.date,
                description=staged.description,
                amount=staged.amount,
                transaction_type=staged.transaction_type,
                category=staged.suggested_category,
                external_id=staged.external_id,
            )
            self.db.add(tx_orm)
            promoted.append(
                Transaction(
                    id=tx_orm.id,
                    date=tx_orm.date,
                    description=tx_orm.description,
                    amount=tx_orm.amount,
                    transaction_type=tx_orm.transaction_type,
                    category=tx_orm.category,
                )
            )

        self.db.commit()
        return promoted

    def exists_by_external_id(self, external_id: str) -> bool:
        return (
            self.db.query(StagedTransactionORM.id)
            .filter(StagedTransactionORM.external_id == external_id)
            .first()
        ) is not None

    def reject_many(self, ids: List[str]) -> int:
        rows = (
            self.db.query(StagedTransactionORM)
            .filter(
                StagedTransactionORM.id.in_(ids),
                StagedTransactionORM.status == StagedStatus.PENDING,
            )
            .all()
        )
        for row in rows:
            row.status = StagedStatus.REJECTED
        self.db.commit()
        return len(rows)
