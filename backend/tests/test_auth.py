"""
Authentication tests.
"""

import pytest
from backend.auth.jwt_handler import create_access_token
from backend.middleware.rate_limiter import reset_rate_limiter


def test_login_success(client, db_session):
    """Test successful login."""
    reset_rate_limiter()
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin", "password": "admin123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_credentials(client, db_session):
    """Test login with invalid credentials."""
    reset_rate_limiter()
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "wrong", "password": "wrong"}
    )
    assert response.status_code == 401
    assert "Invalid username or password" in response.json()["detail"]


def test_login_wrong_password_uses_generic_error(client, db_session):
    """Authentication failures must not expose whether an account exists."""
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin", "password": "wrong"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid username or password"


def test_token_creation():
    """Test JWT token creation."""
    token = create_access_token({"sub": "admin", "role": "admin"})
    assert token is not None
    assert isinstance(token, str)


def test_login_rate_limit(client, db_session):
    """Test login rate limiting."""
    reset_rate_limiter()
    # Make 11 login attempts (limit is 10)
    for i in range(11):
        response = client.post(
            "/api/v1/auth/login",
            data={"username": "admin", "password": "wrong"}
        )
    
    # Last request should be rate limited
    assert response.status_code == 429
    assert "too many" in response.json()["detail"].lower() or "rate limit" in response.json()["detail"].lower()

