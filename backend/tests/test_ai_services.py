"""
AI services tests.
"""

import pytest
from backend.auth.jwt_handler import create_access_token
from backend.database.models import ScanHistory
from backend.middleware.rate_limiter import reset_rate_limiter


@pytest.fixture
def auth_token():
    """Create authentication token for tests."""
    return create_access_token({"sub": "admin", "role": "Admin"})


@pytest.fixture
def sample_scan(db_session):
    """Create a sample scan for testing."""
    scan = ScanHistory(
        filename="test.py",
        status="Completed",
        report_name="test_report.json",
        risk_level="Low",
        issues=0
    )
    db_session.add(scan)
    db_session.commit()
    db_session.refresh(scan)
    return scan


def test_risk_score_for_scan(client, auth_token, sample_scan):
    """Test risk score calculation for a scan."""
    response = client.get(
        f"/api/v1/ai/risk/score/{sample_scan.id}",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == 200  # nosec B101
    data = response.json()
    assert "score" in data  # nosec B101
    assert "risk_level" in data  # nosec B101
    assert 0 <= data["score"] <= 100  # nosec B101


def test_overall_risk_score(client, auth_token):
    """Test overall platform risk score."""
    response = client.get(
        "/api/v1/ai/risk/score",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == 200  # nosec B101
    data = response.json()
    assert "score" in data  # nosec B101
    assert "risk_level" in data  # nosec B101


def test_risk_history(client, auth_token):
    """Test risk score history retrieval."""
    response = client.get(
        "/api/v1/ai/risk/history?limit=10",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == 200  # nosec B101
    data = response.json()
    assert "history" in data  # nosec B101
    assert "total" in data  # nosec B101


def test_security_assistant_chat(client, auth_token):
    """Test security assistant chat."""
    response = client.post(
        "/api/v1/security-assistant/chat",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={
            "question": "What is SQL Injection?",
            "session_id": "test-session"
        }
    )
    
    assert response.status_code == 200  # nosec B101
    data = response.json()
    assert "answer" in data  # nosec B101
    assert "session_id" in data  # nosec B101


def test_security_assistant_rate_limit(client, auth_token):
    """Test security assistant rate limiting."""
    reset_rate_limiter()
    # Make 31 chat attempts (limit is 30)
    for i in range(31):
        response = client.post(
            "/api/v1/security-assistant/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "question": f"Test question {i}",
                "session_id": "test-session"
            }
        )
    
    # Last request should be rate limited
    assert response.status_code == 429  # nosec B101
    assert "rate limit" in response.json()["detail"].lower()  # nosec B101


def test_invalid_scan_id(client, auth_token):
    """Test with invalid scan ID."""
    response = client.get(
        "/api/v1/ai/risk/score/99999",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == 404  # nosec B101
