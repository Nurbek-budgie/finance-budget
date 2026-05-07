import uuid
from typing import List, Optional

from sqlalchemy.orm import Session

from app.domain.models.budget import Budget
from app.domain.repositories.budget_repository import BudgetRepository
from app.infrastructure.database.models import BudgetORM


def _to_domain(orm: BudgetORM) -> Budget:
    return Budget(
        id=orm.id,
        category=orm.category,
        limit_amount=orm.limit_amount,
        period=orm.period,
        created_at=orm.created_at,
    )


class BudgetRepositoryImpl(BudgetRepository):
    def __init__(self, db: Session):
        self.db = db

    def list(self) -> List[Budget]:
        rows = self.db.query(BudgetORM).order_by(BudgetORM.category).all()
        return [_to_domain(r) for r in rows]

    def get(self, budget_id: str) -> Optional[Budget]:
        row = self.db.query(BudgetORM).filter(BudgetORM.id == budget_id).first()
        return _to_domain(row) if row else None

    def create(self, budget: Budget) -> Budget:
        orm = BudgetORM(
            id=budget.id or str(uuid.uuid4()),
            category=budget.category,
            limit_amount=budget.limit_amount,
            period=budget.period,
        )
        self.db.add(orm)
        self.db.commit()
        self.db.refresh(orm)
        return _to_domain(orm)

    def update(
        self,
        budget_id: str,
        category: Optional[str],
        limit_amount: Optional[float],
        period: Optional[str],
    ) -> Optional[Budget]:
        row = self.db.query(BudgetORM).filter(BudgetORM.id == budget_id).first()
        if not row:
            return None
        if category is not None:
            row.category = category
        if limit_amount is not None:
            row.limit_amount = limit_amount
        if period is not None:
            row.period = period
        self.db.commit()
        self.db.refresh(row)
        return _to_domain(row)

    def delete(self, budget_id: str) -> bool:
        row = self.db.query(BudgetORM).filter(BudgetORM.id == budget_id).first()
        if not row:
            return False
        self.db.delete(row)
        self.db.commit()
        return True
