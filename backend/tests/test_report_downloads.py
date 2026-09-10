"""Regression coverage for the upload-to-AI-report repository flow."""

import json
import os

from backend.config import REPORTS_FOLDER


def test_report_downloads_include_ai_report(client, auth_headers, sample_scan):
    """AI generation persists data and every repository export is downloadable."""
    generated = client.get(
        f"/api/v1/ai/reports/{sample_scan.id}", headers=auth_headers
    )
    assert generated.status_code == 200  # nosec B101
    assert generated.json()["scan_id"] == sample_scan.id  # nosec B101

    json_response = client.get(
        f"/api/v1/reports/json/{sample_scan.report_name}", headers=auth_headers
    )
    assert json_response.status_code == 200  # nosec B101
    assert json_response.headers["content-type"].startswith("application/json")  # nosec B101
    assert json_response.json()["ai_report"]["scan_id"] == sample_scan.id  # nosec B101

    text_response = client.get(
        f"/api/v1/reports/text/{sample_scan.report_name}", headers=auth_headers
    )
    assert text_response.status_code == 200  # nosec B101
    assert text_response.headers["content-type"].startswith("text/plain")  # nosec B101
    assert "AI EXECUTIVE SUMMARY" in text_response.text  # nosec B101

    pdf_response = client.get(
        f"/api/v1/reports/pdf/{sample_scan.report_name}", headers=auth_headers
    )
    assert pdf_response.status_code == 200  # nosec B101
    assert pdf_response.headers["content-type"].startswith("application/pdf")  # nosec B101
    assert pdf_response.content.startswith(b"%PDF")  # nosec B101


def test_upload_generates_and_exports_ai_report(client, auth_headers, monkeypatch):
    """A successful scan creates the stored AI report and all exports."""
    report_name = "workflow_20260806_000000.json"
    report_path = os.path.join(REPORTS_FOLDER, report_name)

    def fake_scan(_file_path):
        os.makedirs(REPORTS_FOLDER, exist_ok=True)
        with open(report_path, "w", encoding="utf-8") as handle:
            json.dump({"results": []}, handle)
        return {
            "filename": "workflow.py",
            "status": "Safe",
            "issues_found": 0,
            "json_report": report_path,
            "txt_report": report_path.replace(".json", ".txt"),
            "scan_time": "20260806_000000",
        }

    monkeypatch.setattr("backend.upload_service.scan_python_file", fake_scan)
    upload = client.post(
        "/api/v1/upload/",
        headers=auth_headers,
        files={"file": ("workflow.py", "print('safe')", "text/x-python")},
    )
    assert upload.status_code == 200  # nosec B101
    assert upload.json()["success"] is True  # nosec B101

    listed = client.get("/api/v1/files/", headers=auth_headers)
    scan = next(item for item in listed.json()["files"] if item["report_name"] == report_name)
    assert scan["id"] > 0  # nosec B101

    for report_type, expected_content_type in (
        ("json", "application/json"),
        ("text", "text/plain"),
        ("pdf", "application/pdf"),
    ):
        response = client.get(
            f"/api/v1/reports/{report_type}/{report_name}", headers=auth_headers
        )
        assert response.status_code == 200  # nosec B101
        assert response.headers["content-type"].startswith(expected_content_type)  # nosec B101
