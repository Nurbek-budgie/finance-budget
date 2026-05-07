from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.domain.services.transaction_service import TransactionService
from app.infrastructure.database.connection import get_db
from app.infrastructure.persistence.transaction_repository_impl import TransactionRepositoryImpl

router = APIRouter(prefix="/analytics", tags=["analytics"])


def get_service(db: Session = Depends(get_db)) -> TransactionService:
    return TransactionService(TransactionRepositoryImpl(db))


@router.get("/summary")
def get_summary(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    service: TransactionService = Depends(get_service),
):
    return service.get_summary(start=start_date, end=end_date)


@router.get("/balance")
def get_balance(service: TransactionService = Depends(get_service)):
    return {"balance": service.get_balance()}


@router.get("/daily-trend")
def get_daily_trend(
    start_date: date = Query(...),
    end_date: date = Query(...),
    service: TransactionService = Depends(get_service),
):
    return service.get_daily_trend(start=start_date, end=end_date)


@router.get("/categories")
def get_categories(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    type: Optional[str] = Query(None, description="expense (default) | income | all"),
    service: TransactionService = Depends(get_service),
):
    return service.get_category_breakdown(start=start_date, end=end_date, transaction_type=type)
