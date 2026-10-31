import os

import email_validator
import pytest

email_validator.TEST_ENVIRONMENT = True
email_validator.CHECK_DELIVERABILITY = False
from collections.abc import Generator

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

os.environ["APP_ENV"] = "testing"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["GEMINI_API_KEY"] = "mock_test_key"
os.environ["JWT_SECRET_KEY"] = "test_jwt_secret_key_1234567890123456"

from app.core.config import settings

settings.APP_ENV = "testing"
settings.GEMINI_API_KEY = "mock_test_key"
settings.DATABASE_URL = "sqlite:///:memory:"

from app.db.base import Base
from app.db.session import get_db
from app.main import app

# Create test engine using in-memory SQLite with StaticPool so all connections share the same memory DB
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session() -> Generator[Session, None, None]:
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers(client: TestClient) -> dict:
    register_payload = {
        "name": "Alex Developer",
        "email": "alex@example.com",
        "password": "StrongPassword123!",
    }
    res = client.post("/api/v1/auth/register", json=register_payload)
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def second_user_auth_headers(client: TestClient) -> dict:
    register_payload = {
        "name": "Sam Engineer",
        "email": "sam@example.com",
        "password": "AnotherPassword456!",
    }
    res = client.post("/api/v1/auth/register", json=register_payload)
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
