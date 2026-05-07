from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Enum as SQLEnum, Float, Integer, String
from sqlalchemy.orm import DeclarativeBase

from app.domain.models.staged_transaction import StagedStatus
from app.domain.models.transaction import TransactionType


class Base(DeclarativeBase):
    pass


class TransactionORM(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, index=True)
    date = Column(DateTime, nullable=False, index=True)
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    transaction_type = Column(SQLEnum(TransactionType), nullable=False)
    category = Column(String, nullable=True)
    external_id = Column(String, nullable=True, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class TagRuleORM(Base):
    __tablename__ = "tag_rules"

    id = Column(String, primary_key=True, index=True)
    keyword = Column(String, nullable=False)
    category = Column(String, nullable=False)
    priority = Column(Integer, nullable=False, default=5)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class BudgetORM(Base):
    __tablename__ = "budgets"

    id = Column(String, primary_key=True, index=True)
    category = Column(String, nullable=False)
    limit_amount = Column(Float, nullable=False)
    period = Column(String, nullable=False, default="monthly")
    created_at = Column(DateTime, default=datetime.utcnow)


class StagedTransactionORM(Base):
    __tablename__ = "staged_transactions"

    id = Column(String, primary_key=True, index=True)
    date = Column(DateTime, nullable=False, index=True)
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    transaction_type = Column(SQLEnum(TransactionType), nullable=False)
    external_id = Column(String, nullable=True, index=True)
    source_file = Column(String, nullable=True)
    suggested_category = Column(String, nullable=True)
    confidence_score = Column(Float, nullable=False, default=0.0)
    status = Column(
        SQLEnum(StagedStatus, values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=StagedStatus.PENDING,
    )
    staged_at = Column(DateTime, default=datetime.utcnow)
