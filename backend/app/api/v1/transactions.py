from csv import DictReader
from datetime import datetime
from io import StringIO
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.domain.models.transaction import Transaction, TransactionType
from app.domain.services.transaction_service import TransactionService
from app.infrastructure.database.connection import get_db
from app.infrastructure.persistence.transaction_repository_impl import TransactionRepositoryImpl

router = APIRouter(prefix="/transactions", tags=["transactions"])


class TransactionResponse(BaseModel):
    id: str
    date: datetime
    description: str
    amount: float
    transaction_type: str


def get_service(db: Session = Depends(get_db)) -> TransactionService:
    return TransactionService(TransactionRepositoryImpl(db))


@router.post("/upload")
def upload_csv(
    file: UploadFile = File(...),
    service: TransactionService = Depends(get_service),
):
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a .csv")

    content = file.file.read().decode("utf-8")
    reader = DictReader(StringIO(content))

    transactions: list[Transaction] = []
    errors: list[str] = []

    for i, row in enumerate(reader, start=2):
        try:
            transactions.append(
                Transaction(
                    date=datetime.fromisoformat(row["date"].strip()),
                    description=row["description"].strip(),
                    amount=float(row["amount"].strip()),
                    transaction_type=TransactionType(row["type"].strip().lower()),
                )
            )
        except Exception as e:
            errors.append(f"Row {i}: {e}")

    created = service.create_many(transactions) if transactions else []

    return {
        "created": len(created),
        "errors": errors,
        "total_processed": len(created) + len(errors),
    }


@router.get("/", response_model=List[TransactionResponse])
def list_transactions(
    limit: int = 50,
    offset: int = 0,
    service: TransactionService = Depends(get_service),
):
    transactions = service.repository.get_all(limit=limit, offset=offset)
    return [
        TransactionResponse(
            id=t.id,
            date=t.date,
            description=t.description,
            amount=t.amount,
            transaction_type=t.transaction_type.value,
        )
        for t in transactions
    ]


@router.delete("/{transaction_id}")
def delete_transaction(
    transaction_id: str,
    service: TransactionService = Depends(get_service),
):
    deleted = service.repository.delete(transaction_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"deleted": True}
