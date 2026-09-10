"""
Database model tests.
"""

import pytest
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.database.database import Base
from backend.database.models import User, ScanHistory, AIAnalysis, RiskHistory

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_database():
    """Create and drop test database for each test."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    """Provide database session for tests."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_create_user(db):
    """Test user creation."""
    user = User(
        username="testuser",
        password="hashedpassword",
        role="user"
    )
    db.add(user)
    db.commit()
    
    retrieved_user = db.query(User).filter(User.username == "testuser").first()
    assert retrieved_user is not None
    assert retrieved_user.username == "testuser"
    assert retrieved_user.role == "user"


def test_create_scan_history(db):
    """Test scan history creation."""
    scan = ScanHistory(
        filename="test.py",
        status="Completed",
        report_name="test_report.json",
        risk_level="Low",
        issues=0
    )
    db.add(scan)
    db.commit()
    
    retrieved_scan = db.query(ScanHistory).filter(ScanHistory.filename == "test.py").first()
    assert retrieved_scan is not None
    assert retrieved_scan.status == "Completed"
    assert retrieved_scan.risk_level == "Low"


def test_create_ai_analysis(db):
    """Test AI analysis creation."""
    # First create a scan
    scan = ScanHistory(
        filename="test.py",
        status="Completed",
        report_name="test_report.json",
        risk_level="Low",
        issues=0
    )
    db.add(scan)
    db.commit()
    
    # Then create AI analysis
    analysis = AIAnalysis(
        scan_id=scan.id,
        vulnerability_id="B101",
        explanation="Test explanation",
        recommendation="Test recommendation",
        risk_score=5.0
    )
    db.add(analysis)
    db.commit()
    
    retrieved_analysis = db.query(AIAnalysis).filter(AIAnalysis.scan_id == scan.id).first()
    assert retrieved_analysis is not None
    assert retrieved_analysis.vulnerability_id == "B101"
    assert retrieved_analysis.risk_score == 5.0


def test_create_risk_history(db):
    """Test risk history creation."""
    # First create a scan
    scan = ScanHistory(
        filename="test.py",
        status="Completed",
        report_name="test_report.json",
        risk_level="Low",
        issues=0
    )
    db.add(scan)
    db.commit()
    
    # Then create risk history
    risk = RiskHistory(
        scan_id=scan.id,
        score=85.0,
        risk_level="Low",
        explanation="Test explanation"
    )
    db.add(risk)
    db.commit()
    
    retrieved_risk = db.query(RiskHistory).filter(RiskHistory.scan_id == scan.id).first()
    assert retrieved_risk is not None
    assert retrieved_risk.score == 85.0
    assert retrieved_risk.risk_level == "Low"


def test_user_unique_constraint(db):
    """Test that username must be unique."""
    user1 = User(username="testuser", password="pass1", role="user")
    user2 = User(username="testuser", password="pass2", role="user")
    
    db.add(user1)
    db.commit()
    
    db.add(user2)
    # This should fail due to unique constraint
    with pytest.raises(Exception):
        db.commit()
