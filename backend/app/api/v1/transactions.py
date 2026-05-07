from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.domain.models.staged_transaction import StagedTransaction
from app.domain.models.transaction import Transaction
from app.domain.services.ingestion_service import IngestionService
from app.domain.services.tagger_service import TaggerService
from app.domain.services.transaction_service import TransactionService
from app.infrastructure.database.connection import get_db
from app.infrastructure.parsers.parser_factory import UnsupportedFormatError, get_parser
from app.infrastructure.persistence.staged_transaction_repository_impl import StagedTransactionRepositoryImpl
from app.infrastructure.persistence.tag_rule_repository_impl import TagRuleRepositoryImpl
from app.infrastructure.persistence.transaction_repository_impl import TransactionRepositoryImpl

router = APIRouter(prefix="/transactions", tags=["transactions"])


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class TransactionResponse(BaseModel):
    id: str
    date: datetime
    description: str
    amount: float
    transaction_type: str
    category: Optional[str] = None


class StagedTransactionResponse(BaseModel):
    id: str
    date: datetime
    description: str
    amount: float
    transaction_type: str
    suggested_category: Optional[str] = None
    confidence_score: float
    status: str
    source_file: Optional[str] = None


class PaginatedTransactions(BaseModel):
    items: List[TransactionResponse]
    total: int


class ApproveRequest(BaseModel):
    ids: Optional[List[str]] = None
    approve_all: bool = False


class RejectRequest(BaseModel):
    ids: List[str]


# ── Dependency helpers ────────────────────────────────────────────────────────

def get_service(db: Session = Depends(get_db)) -> TransactionService:
    return TransactionService(TransactionRepositoryImpl(db))


def get_ingestion_service(db: Session = Depends(get_db)) -> IngestionService:
    tx_repo = TransactionRepositoryImpl(db)
    staged_repo = StagedTransactionRepositoryImpl(db)
    tag_rule_repo = TagRuleRepositoryImpl(db)
    return IngestionService(
        parser=None,  # set per-request in the endpoint after file is known
        transaction_repo=tx_repo,
        staged_repo=staged_repo,
        tag_rule_repo=tag_rule_repo,
        tagger=TaggerService(),
    )


# ── Response mappers ──────────────────────────────────────────────────────────

def _to_response(t: Transaction) -> TransactionResponse:
    return TransactionResponse(
        id=t.id,
        date=t.date,
        description=t.description,
        amount=t.amount,
        transaction_type=t.transaction_type.value,
        category=t.category,
    )


def _staged_to_response(s: StagedTransaction) -> StagedTransactionResponse:
    return StagedTransactionResponse(
        id=s.id,
        date=s.date,
        description=s.description,
        amount=s.amount,
        transaction_type=s.transaction_type.value,
        suggested_category=s.suggested_category,
        confidence_score=s.confidence_score,
        status=s.status.value,
        source_file=s.source_file,
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/upload")
def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    filename = file.filename or ""
    content = file.file.read()
    try:
        parser = get_parser(filename, content)
    except UnsupportedFormatError as e:
        raise HTTPException(status_code=400, detail=str(e))

    svc = IngestionService(
        parser=parser,
        transaction_repo=TransactionRepositoryImpl(db),
        staged_repo=StagedTransactionRepositoryImpl(db),
        tag_rule_repo=TagRuleRepositoryImpl(db),
        tagger=TaggerService(),
    )

    result = svc.ingest(content, filename)

    return {
        "committed": result.committed,
        "staged": result.staged,
        "skipped_duplicates": result.skipped_duplicates,
        "errors": result.errors,
    }


@router.get("/staged", response_model=List[StagedTransactionResponse])
def list_staged(
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    repo = StagedTransactionRepositoryImpl(db)
    return [_staged_to_response(s) for s in repo.get_pending(limit=limit, offset=offset)]


@router.post("/staged/approve")
def approve_staged(
    body: ApproveRequest,
    db: Session = Depends(get_db),
):
    repo = StagedTransactionRepositoryImpl(db)
    if body.approve_all:
        # Load all pending IDs then approve
        pending = repo.get_pending(limit=10_000)
        ids = [s.id for s in pending]
    elif body.ids:
        ids = body.ids
    else:
        raise HTTPException(status_code=400, detail="Provide 'ids' or set 'approve_all': true")

    promoted = repo.approve_many(ids)
    return {"approved": len(promoted)}


@router.post("/staged/reject")
def reject_staged(
    body: RejectRequest,
    db: Session = Depends(get_db),
):
    repo = StagedTransactionRepositoryImpl(db)
    count = repo.reject_many(body.ids)
    return {"rejected": count}


@router.get("/", response_model=PaginatedTransactions)
def list_transactions(
    limit: int = 50,
    offset: int = 0,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    search: Optional[str] = Query(None),
    service: TransactionService = Depends(get_service),
):
    repo = service.repository
    if start_date and end_date:
        transactions = repo.get_by_date_range(start_date, end_date, limit=limit, search=search)
    else:
        transactions = repo.get_all(limit=limit, offset=offset, search=search)
    total = repo.count(start=start_date, end=end_date, search=search)
    return PaginatedTransactions(items=[_to_response(t) for t in transactions], total=total)


@router.delete("/{transaction_id}")
def delete_transaction(
    transaction_id: str,
    service: TransactionService = Depends(get_service),
):
    deleted = service.repository.delete(transaction_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"deleted": True}
