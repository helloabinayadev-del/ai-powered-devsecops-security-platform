"""Regression tests for authentication and file-handling security controls."""

import pytest

from backend.routers.email import _report_path as email_report_path
from backend.routers.reports import _report_path


@pytest.mark.parametrize("filename", ["../.env", "nested/report.json", "report.txt", ""])
def test_report_paths_reject_traversal_and_wrong_extensions(filename):
    with pytest.raises(Exception) as report_error:
        _report_path(filename)
    assert report_error.value.status_code == 400

    with pytest.raises(Exception) as email_error:
        email_report_path(filename)
    assert email_error.value.status_code == 400


def test_cleanup_rejects_unsafe_retention_period(client, auth_headers):
    response = client.post("/api/v1/reports/cleanup?days=0", headers=auth_headers)
    assert response.status_code == 422


def test_smtp_diagnostics_require_administrator(client):
    response = client.get("/api/v1/email/test-connection")
    assert response.status_code == 401


def test_login_errors_do_not_disclose_account_existence(client):
    unknown_user = client.post(
        "/api/v1/auth/login", data={"username": "missing", "password": "wrong"}
    )
    wrong_password = client.post(
        "/api/v1/auth/login", data={"username": "admin", "password": "wrong"}
    )
    assert unknown_user.status_code == wrong_password.status_code == 401
    assert unknown_user.json()["detail"] == wrong_password.json()["detail"]
