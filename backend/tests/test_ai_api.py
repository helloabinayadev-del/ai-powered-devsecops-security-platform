"""API integration tests for Phase 3 AI endpoints."""


class TestAIAnalysisAPI:
    def test_analyze_vulnerability_input(self, client, auth_headers):
        response = client.post(
            "/api/v1/ai/analyze/vulnerability",
            json={
                "severity": "LOW",
                "issue_text": "Possible hardcoded password: 'admin123'",
                "test_id": "B105",
                "filename": "app.py",
                "line_number": 1,
            },
            headers=auth_headers,
        )
        assert response.status_code == 200  # nosec B101
        data = response.json()
        assert data["simple_explanation"]  # nosec B101
        assert data["recommended_remediation"]  # nosec B101
        assert data["analysis_mode"] == "knowledge_base"  # nosec B101

    def test_analyze_vulnerability_invalid_input(self, client, auth_headers):
        response = client.post(
            "/api/v1/ai/analyze/vulnerability",
            json={"severity": "HIGH"},
            headers=auth_headers,
        )
        assert response.status_code in (400, 422)  # nosec B101

    def test_analyze_scan(self, client, auth_headers, sample_scan):
        response = client.post(
            f"/api/v1/ai/analyze/{sample_scan.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200  # nosec B101
        data = response.json()
        assert data["scan_id"] == sample_scan.id  # nosec B101
        assert data["total_vulnerabilities"] > 0  # nosec B101

    def test_analyze_scan_not_found(self, client, auth_headers):
        response = client.post(
            "/api/v1/ai/analyze/999",
            headers=auth_headers,
        )
        assert response.status_code == 404  # nosec B101

    def test_unauthenticated_rejected(self, client):
        response = client.post(
            "/api/v1/ai/analyze/vulnerability",
            json={"severity": "HIGH", "issue_text": "test"},
        )
        assert response.status_code == 401  # nosec B101


class TestSecurityAssistantAPI:
    def test_chat(self, client, auth_headers):
        response = client.post(
            "/api/v1/security-assistant/chat",
            json={"question": "How do I fix SQL Injection?"},
            headers=auth_headers,
        )
        assert response.status_code == 200  # nosec B101
        data = response.json()
        assert data["answer"]  # nosec B101
        assert len(data["recommendations"]) >= 1  # nosec B101
        assert data["session_id"]  # nosec B101

    def test_chat_empty_question(self, client, auth_headers):
        response = client.post(
            "/api/v1/security-assistant/chat",
            json={"question": ""},
            headers=auth_headers,
        )
        assert response.status_code == 422  # nosec B101


class TestRiskScoreAPI:
    def test_scan_risk_score(self, client, auth_headers, sample_scan):
        response = client.get(
            f"/api/v1/ai/risk/score/{sample_scan.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200  # nosec B101
        data = response.json()
        assert 0 <= data["score"] <= 100  # nosec B101
        assert data["risk_level"] in ("Low", "Medium", "High", "Critical")  # nosec B101

    def test_overall_risk_score(self, client, auth_headers, sample_scan):
        response = client.get(
            "/api/v1/ai/risk/score",
            headers=auth_headers,
        )
        assert response.status_code == 200  # nosec B101

    def test_risk_history(self, client, auth_headers, sample_scan):
        client.get(
            f"/api/v1/ai/risk/score/{sample_scan.id}",
            headers=auth_headers,
        )
        response = client.get(
            "/api/v1/ai/risk/history",
            headers=auth_headers,
        )
        assert response.status_code == 200  # nosec B101
        assert "history" in response.json()  # nosec B101


class TestAIReportAPI:
    def test_generate_report(self, client, auth_headers, sample_scan):
        response = client.get(
            f"/api/v1/ai/reports/{sample_scan.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200  # nosec B101
        data = response.json()
        assert data["executive_summary"]  # nosec B101
        assert data["security_score"]  # nosec B101

    def test_pdf_structure(self, client, auth_headers, sample_scan):
        response = client.get(
            f"/api/v1/ai/reports/{sample_scan.id}/pdf-structure",
            headers=auth_headers,
        )
        assert response.status_code == 200  # nosec B101
        assert len(response.json()["sections"]) >= 3  # nosec B101


class TestExistingAPIs:
    """Verify backward compatibility with existing endpoints."""

    def test_health(self, client):
        response = client.get("/api/v1/health/")
        assert response.status_code == 200  # nosec B101

    def test_login(self, client):
        response = client.post(
            "/api/v1/auth/login",
            data={"username": "admin", "password": "admin123"},
        )
        assert response.status_code == 200  # nosec B101
        assert "access_token" in response.json()  # nosec B101

    def test_ai_summary_still_works(self, client, auth_headers, sample_scan):
        response = client.get(
            "/api/v1/ai/summary",
            headers=auth_headers,
        )
        assert response.status_code == 200  # nosec B101
        data = response.json()
        assert "overall_summary" in data  # nosec B101
        assert "statistics" in data  # nosec B101

    def test_statistics(self, client, auth_headers):
        response = client.get("/api/v1/statistics/", headers=auth_headers)
        assert response.status_code == 200  # nosec B101
