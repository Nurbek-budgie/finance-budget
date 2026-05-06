from fastapi import APIRouter
from app.api.v1 import analytics, tag_rules, transactions

router = APIRouter(prefix="/api/v1")
router.include_router(transactions.router)
router.include_router(analytics.router)
router.include_router(tag_rules.router)
