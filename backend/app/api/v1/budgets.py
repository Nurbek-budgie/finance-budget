from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.domain.models.budget import Budget
from app.infrastructure.database.connection import get_db
from app.infrastructure.persistence.budget_repository_impl import BudgetRepositoryImpl

router = APIRouter(prefix="/budgets", tags=["budgets"])


class BudgetResponse(BaseModel):
    id: str
    category: str
    limit_amount: float
    period: str
    created_at: datetime


class CreateBudgetRequest(BaseModel):
    category: str
    limit_amount: float
    period: str = "monthly"


class UpdateBudgetRequest(BaseModel):
    category: Optional[str] = None
    limit_amount: Optional[float] = None
    period: Optional[str] = None


def _to_response(b: Budget) -> BudgetResponse:
    return BudgetResponse(
        id=b.id,
        category=b.category,
        limit_amount=b.limit_amount,
        period=b.period,
        created_at=b.created_at,
    )


def get_repo(db: Session = Depends(get_db)) -> BudgetRepositoryImpl:
    return BudgetRepositoryImpl(db)


@router.get("/", response_model=List[BudgetResponse])
def list_budgets(repo: BudgetRepositoryImpl = Depends(get_repo)):
    return [_to_response(b) for b in repo.list()]


@router.post("/", response_model=BudgetResponse, status_code=201)
def create_budget(body: CreateBudgetRequest, repo: BudgetRepositoryImpl = Depends(get_repo)):
    budget = Budget(category=body.category, limit_amount=body.limit_amount, period=body.period)
    return _to_response(repo.create(budget))


@router.put("/{budget_id}", response_model=BudgetResponse)
def update_budget(
    budget_id: str,
    body: UpdateBudgetRequest,
    repo: BudgetRepositoryImpl = Depends(get_repo),
):
    updated = repo.update(budget_id, body.category, body.limit_amount, body.period)
    if not updated:
        raise HTTPException(status_code=404, detail="Budget not found")
    return _to_response(updated)


@router.delete("/{budget_id}")
def delete_budget(budget_id: str, repo: BudgetRepositoryImpl = Depends(get_repo)):
    deleted = repo.delete(budget_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Budget not found")
    return {"deleted": True}
