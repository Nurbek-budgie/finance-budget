from datetime import datetime

from sqlalchemy import Column, DateTime, Enum as SQLEnum, Float, String
from sqlalchemy.orm import DeclarativeBase

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
    created_at = Column(DateTime, default=datetime.utcnow)
