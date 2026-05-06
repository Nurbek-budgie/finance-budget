from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.domain.services.transaction_service import TransactionService
from app.infrastructure.database.connection import get_db
from app.infrastructure.persistence.transaction_repository_impl import TransactionRepositoryImpl

router = APIRouter(prefix="/analytics", tags=["analytics"])


def get_service(db: Session = Depends(get_db)) -> TransactionService:
    return TransactionService(TransactionRepositoryImpl(db))


@router.get("/summary")
def get_summary(service: TransactionService = Depends(get_service)):
    return service.get_summary()


@router.get("/balance")
def get_balance(service: TransactionService = Depends(get_service)):
    return {"balance": service.get_balance()}
