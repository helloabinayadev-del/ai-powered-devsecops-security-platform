import pytest
import io
from backend.database.models import User, ScanHistory
from backend.auth.password import hash_password


@pytest.fixture
def user_a_headers(client):
    reg_resp = client.post("/api/v1/auth/register", json={
        "username": "usera",
        "email": "usera@example.com",
        "password": "password123"
    })
    token = reg_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def user_b_headers(client):
    reg_resp = client.post("/api/v1/auth/register", json={
        "username": "userb",
        "email": "userb@example.com",
        "password": "password123"
    })
    token = reg_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_user_registration_and_login(client):
    # Test registration
    reg_resp = client.post("/api/v1/auth/register", json={
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "password123"
    })
    assert reg_resp.status_code == 200
    assert "access_token" in reg_resp.json()
    assert reg_resp.json()["user"]["username"] == "newuser"

    # Test login
    login_resp = client.post("/api/v1/auth/login", data={
        "username": "newuser",
        "password": "password123"
    })
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()

    # Test duplicate registration block
    dup_resp = client.post("/api/v1/auth/register", json={
        "username": "newuser",
        "password": "password123"
    })
    assert dup_resp.status_code == 400


def test_file_and_scan_isolation(client, user_a_headers, user_b_headers):
    # User A uploads a python file
    file_content = b"password = 'hardcoded_secret'\n"
    file_a = ("test_a.py", io.BytesIO(file_content), "text/x-python")
    
    upload_resp = client.post(
        "/api/v1/upload/",
        files={"file": file_a},
        headers=user_a_headers
    )
    assert upload_resp.status_code == 200
    report_name = upload_resp.json()["report_name"]
    assert report_name is not None

    # User A views files list -> contains test_a.py
    files_a = client.get("/api/v1/files/", headers=user_a_headers).json()
    assert files_a["total_files"] == 1
    user_a_file_id = files_a["files"][0]["id"]

    # User B views files list -> empty (0 files)
    files_b = client.get("/api/v1/files/", headers=user_b_headers).json()
    assert files_b["total_files"] == 0

    # User B attempts to delete User A's file -> 404 DENIED
    del_b = client.delete(f"/api/v1/files/{user_a_file_id}", headers=user_b_headers)
    assert del_b.status_code == 404

    # User A can delete own file
    del_a = client.delete(f"/api/v1/files/{user_a_file_id}", headers=user_a_headers)
    assert del_a.status_code == 200


def test_report_and_download_isolation(client, user_a_headers, user_b_headers):
    # User A uploads a python file
    file_content = b"import os\nos.system('ls')\n"
    file_a = ("sec_test.py", io.BytesIO(file_content), "text/x-python")
    
    upload_resp = client.post(
        "/api/v1/upload/",
        files={"file": file_a},
        headers=user_a_headers
    )
    report_name = upload_resp.json()["report_name"]

    # User A lists reports -> sees report
    reports_a = client.get("/api/v1/reports/", headers=user_a_headers).json()
    assert reports_a["total_reports"] == 1

    # User B lists reports -> 0 reports
    reports_b = client.get("/api/v1/reports/", headers=user_b_headers).json()
    assert reports_b["total_reports"] == 0

    # User B attempts to view User A's JSON report -> 404 DENIED
    assert client.get(f"/api/v1/reports/view/{report_name}", headers=user_b_headers).status_code == 404

    # User B attempts to download User A's JSON report -> 404 DENIED
    assert client.get(f"/api/v1/reports/json/{report_name}", headers=user_b_headers).status_code == 404

    # User B attempts to download User A's TXT report -> 404 DENIED
    assert client.get(f"/api/v1/reports/text/{report_name}", headers=user_b_headers).status_code == 404

    # User B attempts to download User A's PDF report -> 404 DENIED
    assert client.get(f"/api/v1/reports/pdf/{report_name}", headers=user_b_headers).status_code == 404

    # User B attempts to delete User A's report -> 404 DENIED
    assert client.delete(f"/api/v1/reports/{report_name}", headers=user_b_headers).status_code == 404

    # User A can view and download own report
    assert client.get(f"/api/v1/reports/json/{report_name}", headers=user_a_headers).status_code == 200


def test_ai_features_isolation(client, user_a_headers, user_b_headers):
    # User A uploads a python file
    file_content = b"eval('import sys')\n"
    file_a = ("ai_test.py", io.BytesIO(file_content), "text/x-python")
    
    upload_resp = client.post(
        "/api/v1/upload/",
        files={"file": file_a},
        headers=user_a_headers
    )
    
    files_a = client.get("/api/v1/files/", headers=user_a_headers).json()
    scan_id_a = files_a["files"][0]["id"]

    # User B attempts AI scan analysis for User A's scan -> 404 DENIED
    assert client.post(f"/api/v1/ai/analyze/{scan_id_a}", headers=user_b_headers).status_code == 404

    # User B attempts to view stored AI analyses for User A's scan -> 404 DENIED
    assert client.get(f"/api/v1/ai/analyze/{scan_id_a}", headers=user_b_headers).status_code == 404

    # User B attempts to get AI report for User A's scan -> 404 DENIED
    assert client.get(f"/api/v1/ai/reports/{scan_id_a}", headers=user_b_headers).status_code == 404

    # User B attempts to get risk score for User A's scan -> 404 DENIED
    assert client.get(f"/api/v1/ai/risk/score/{scan_id_a}", headers=user_b_headers).status_code == 404

    # User A can generate AI report for own scan
    assert client.get(f"/api/v1/ai/reports/{scan_id_a}", headers=user_a_headers).status_code == 200


def test_email_isolation(client, user_a_headers, user_b_headers):
    file_content = b"import pickle\npickle.loads(b'data')\n"
    file_a = ("email_test.py", io.BytesIO(file_content), "text/x-python")
    
    upload_resp = client.post(
        "/api/v1/upload/",
        files={"file": file_a},
        headers=user_a_headers
    )
    report_name = upload_resp.json()["report_name"]

    # User B attempts to send User A's report -> 404 DENIED
    send_b = client.post(
        f"/api/v1/email/send?receiver_email=target@example.com&filename={report_name}",
        headers=user_b_headers
    )
    assert send_b.status_code == 404

    # User B checks email history -> empty
    history_b = client.get("/api/v1/email/history", headers=user_b_headers).json()
    assert len(history_b) == 0


def test_admin_rbac_and_user_management(client, auth_headers, user_a_headers):
    # Normal user (User A) attempts admin users endpoint -> 403 FORBIDDEN
    assert client.get("/api/v1/admin/users", headers=user_a_headers).status_code == 403

    # Admin user calls admin users endpoint -> 200 PASS
    admin_users_resp = client.get("/api/v1/admin/users", headers=auth_headers)
    assert admin_users_resp.status_code == 200
    user_list = admin_users_resp.json()
    assert len(user_list) >= 2

    # Admin deactivates User A
    usera_id = [u["id"] for u in user_list if u["username"] == "usera"][0]
    deact_resp = client.patch(f"/api/v1/admin/users/{usera_id}/status", json={"is_active": False}, headers=auth_headers)
    assert deact_resp.status_code == 200
    assert deact_resp.json()["user"]["is_active"] is False

    # Deactivated User A attempts to request API using existing token -> 401 UNAUTHORIZED
    assert client.get("/api/v1/files/", headers=user_a_headers).status_code == 401

    # Deactivated User A attempts to login -> 401 UNAUTHORIZED
    login_b = client.post("/api/v1/auth/login", data={"username": "usera", "password": "password123"})
    assert login_b.status_code == 401
