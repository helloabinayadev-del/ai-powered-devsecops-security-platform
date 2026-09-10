"""
Upload service tests using in-memory database test client.
"""

import pytest


def test_upload_success(client, auth_headers):
    """Test successful file upload."""
    test_content = "print('hello world')"
    
    response = client.post(
        "/api/v1/upload/",
        headers=auth_headers,
        files={"file": ("test.py", test_content, "text/plain")}
    )
    
    assert response.status_code == 200  # nosec B101
    data = response.json()
    assert data["success"] is True  # nosec B101
    assert "filename" in data  # nosec B101
    assert "status" in data  # nosec B101


def test_upload_invalid_file_type(client, auth_headers):
    """Test upload with invalid file type."""
    test_content = "not a python file"
    
    response = client.post(
        "/api/v1/upload/",
        headers=auth_headers,
        files={"file": ("test.txt", test_content, "text/plain")}
    )
    
    assert response.status_code == 200  # nosec B101
    data = response.json()
    assert data["success"] is False  # nosec B101
    assert "Only Python (.py) files are allowed" in data["message"]  # nosec B101


def test_upload_empty_file(client, auth_headers):
    """Test upload with empty file."""
    response = client.post(
        "/api/v1/upload/",
        headers=auth_headers,
        files={"file": ("empty.py", b"", "text/plain")}
    )
    
    assert response.status_code == 200  # nosec B101
    data = response.json()
    assert data["success"] is False  # nosec B101
    assert "empty" in data["message"].lower()  # nosec B101


def test_upload_unauthorized(client):
    """Test upload without authentication."""
    test_content = "print('hello')"
    
    response = client.post(
        "/api/v1/upload/",
        files={"file": ("test.py", test_content, "text/plain")}
    )
    
    assert response.status_code == 401  # nosec B101


def test_upload_rate_limit(client, auth_headers, monkeypatch):
    """Test rate limiting without repeatedly invoking the scanner."""
    monkeypatch.setattr(
        "backend.routers.upload.process_upload",
        lambda **_: {"success": True, "filename": "test.py", "status": "Completed"},
    )
    test_content = "print('hello')"
    
    # Make 21 upload attempts (limit is 20)
    for i in range(21):
        response = client.post(
            "/api/v1/upload/",
            headers=auth_headers,
            files={"file": (f"test{i}.py", test_content, "text/plain")}
        )
    
    # Last request should be rate limited
    assert response.status_code == 429  # nosec B101
    assert "rate limit" in response.json()["detail"].lower()  # nosec B101
