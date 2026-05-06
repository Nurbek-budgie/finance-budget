from fastapi import APIRouter
from app.api.v1 import transactions, analytics

router = APIRouter(prefix="/api/v1")
router.include_router(transactions.router)
router.include_router(analytics.router)
