import uuid
from datetime import date, datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from app.domain.models.transaction import Transaction
from app.domain.repositories.transaction_repository import TransactionRepository
from app.infrastructure.database.models import TransactionORM


def _to_domain(orm: TransactionORM) -> Transaction:
    return Transaction(
        id=orm.id,
        date=orm.date,
        description=orm.description,
        amount=orm.amount,
        transaction_type=orm.transaction_type,
        category=orm.category,
    )


def _to_orm(transaction: Transaction, external_id: Optional[str] = None) -> TransactionORM:
    return TransactionORM(
        id=transaction.id or str(uuid.uuid4()),
        date=transaction.date,
        description=transaction.description,
        amount=transaction.amount,
        transaction_type=transaction.transaction_type,
        category=transaction.category,
        external_id=external_id or getattr(transaction, "_external_id", None),
    )


class TransactionRepositoryImpl(TransactionRepository):
    def __init__(self, db: Session):
        self.db = db

    def create(self, transaction: Transaction) -> Transaction:
        orm = _to_orm(transaction)
        self.db.add(orm)
        self.db.commit()
        self.db.refresh(orm)
        return _to_domain(orm)

    def create_many(self, transactions: List[Transaction]) -> List[Transaction]:
        orm_objects = [_to_orm(t) for t in transactions]
        self.db.add_all(orm_objects)
        self.db.commit()
        return [_to_domain(o) for o in orm_objects]

    def get_all(self, limit: int = 100, offset: int = 0, search: Optional[str] = None) -> List[Transaction]:
        q = self.db.query(TransactionORM)
        if search:
            q = q.filter(TransactionORM.description.ilike(f"%{search}%"))
        rows = q.order_by(TransactionORM.date.desc()).limit(limit).offset(offset).all()
        return [_to_domain(r) for r in rows]

    def get_by_date_range(
        self, start: date, end: date, limit: int = 100_000, search: Optional[str] = None
    ) -> List[Transaction]:
        start_dt = datetime.combine(start, datetime.min.time())
        end_dt = datetime.combine(end, datetime.max.time())
        q = (
            self.db.query(TransactionORM)
            .filter(TransactionORM.date >= start_dt, TransactionORM.date <= end_dt)
        )
        if search:
            q = q.filter(TransactionORM.description.ilike(f"%{search}%"))
        rows = q.order_by(TransactionORM.date.desc()).limit(limit).all()
        return [_to_domain(r) for r in rows]

    def count(
        self,
        start: Optional[date] = None,
        end: Optional[date] = None,
        search: Optional[str] = None,
    ) -> int:
        q = self.db.query(TransactionORM)
        if start and end:
            start_dt = datetime.combine(start, datetime.min.time())
            end_dt = datetime.combine(end, datetime.max.time())
            q = q.filter(TransactionORM.date >= start_dt, TransactionORM.date <= end_dt)
        if search:
            q = q.filter(TransactionORM.description.ilike(f"%{search}%"))
        return q.count()

    def get_by_id(self, transaction_id: str) -> Optional[Transaction]:
        row = self.db.query(TransactionORM).filter(TransactionORM.id == transaction_id).first()
        return _to_domain(row) if row else None

    def create_many_with_external_ids(self, transactions: List[Transaction]) -> List[Transaction]:
        orm_objects = [_to_orm(t) for t in transactions]
        self.db.add_all(orm_objects)
        self.db.commit()
        return [_to_domain(o) for o in orm_objects]

    def exists_by_external_id(self, external_id: str) -> bool:
        return (
            self.db.query(TransactionORM.id)
            .filter(TransactionORM.external_id == external_id)
            .first()
        ) is not None

    def delete(self, transaction_id: str) -> bool:
        row = self.db.query(TransactionORM).filter(TransactionORM.id == transaction_id).first()
        if not row:
            return False
        self.db.delete(row)
        self.db.commit()
        return True
