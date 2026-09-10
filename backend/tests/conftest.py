import pytest
import os
import json
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app import app
from backend.database.database import Base, get_db
from backend.database.models import ScanHistory, User
from backend.auth.password import hash_password
from backend.middleware.rate_limiter import reset_rate_limiter
from backend.config import REPORTS_FOLDER


TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def reset_limiter():
    reset_rate_limiter()
    yield
    reset_rate_limiter()


@pytest.fixture()
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    # Seed default admin user
    admin = User(
        username="admin",
        email="admin@devsecops.local",
        password=hash_password("admin123"),
        role="ADMIN",
        is_active=True
    )
    session.add(admin)
    session.commit()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def auth_headers(client):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin", "password": "admin123"},
    )
    token = response.json().get("access_token", "")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def sample_scan(db_session):
    os.makedirs(REPORTS_FOLDER, exist_ok=True)
    report_filename = "vulnerable_20260712_104515.json"
    report_path = os.path.join(REPORTS_FOLDER, report_filename)
    
    # Create sample report file on disk
    dummy_report = {
        "filename": "vulnerable.py",
        "scan_time": "2026-07-12 10:45:15",
        "total_issues": 1,
        "results": [
            {
                "vulnerability_id": "B105_L1",
                "test_id": "B105",
                "issue_text": "Possible hardcoded password",
                "issue_severity": "HIGH",
                "issue_confidence": "HIGH",
                "line_number": 1,
                "code": "password = 'admin123'",
                "cwe_id": 259
            }
        ]
    }
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(dummy_report, f)

    admin = db_session.query(User).filter(User.username == "admin").first()

    scan = ScanHistory(
        user_id=admin.id if admin else None,
        filename="vulnerable.py",
        status="Completed",
        report_name=report_filename,
        risk_level="High",
        issues=1,
    )
    db_session.add(scan)
    db_session.commit()
    db_session.refresh(scan)
    return scan

