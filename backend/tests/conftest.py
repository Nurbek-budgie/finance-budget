import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.infrastructure.database.connection import get_db
from app.infrastructure.database.models import Base, TagRuleORM
from app.main import app

SQLITE_URL = "sqlite:///:memory:"


@pytest.fixture
def db_session():
    engine = create_engine(
        SQLITE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    # Seed tag rules so test CSV rows get committed (not staged)
    for keyword, category in [
        ("salary", "Income"),
        ("freelance", "Income"),
        ("bonus", "Income"),
        ("groceries", "Food & Dining"),
        ("bills", "Utilities"),
    ]:
        session.add(TagRuleORM(
            id=str(uuid.uuid4()),
            keyword=keyword,
            category=category,
            priority=10,
            is_active=True,
        ))
    session.commit()

    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)


@pytest.fixture
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


VALID_CSV = """\
date,description,amount,type
2024-01-15,Salary,5000.00,income
2024-01-20,Groceries,85.50,expense
2024-01-25,Freelance,1200.00,income
"""
