import pytest

from backend.services.risk_engine import RiskEngine


class TestRiskEngine:
    def test_empty_findings_max_score(self, db_session):
        engine = RiskEngine(db_session)
        result = engine.calculate_score_for_findings([])

        assert result["score"] == 100.0  # nosec B101
        assert result["risk_level"] == "Low"  # nosec B101
        assert result["total_issues"] == 0  # nosec B101

    def test_high_severity_lowers_score(self, db_session):
        engine = RiskEngine(db_session)
        findings = [
            {"severity": "HIGH", "confidence": "HIGH"},
            {"severity": "HIGH", "confidence": "MEDIUM"},
        ]
        result = engine.calculate_score_for_findings(findings)

        assert result["score"] < 100.0  # nosec B101
        assert result["severity_breakdown"]["HIGH"] == 2  # nosec B101
        assert result["risk_level"] in ("Low", "Medium", "High", "Critical")  # nosec B101

    def test_score_never_below_zero(self, db_session):
        engine = RiskEngine(db_session)
        findings = [{"severity": "HIGH", "confidence": "HIGH"}] * 20
        result = engine.calculate_score_for_findings(findings)
        assert result["score"] >= 0.0  # nosec B101

    def test_calculate_for_scan(self, db_session, sample_scan):
        engine = RiskEngine(db_session)
        result = engine.calculate_for_scan(sample_scan.id)

        assert result["scan_id"] == sample_scan.id  # nosec B101
        assert 0 <= result["score"] <= 100  # nosec B101
        assert result["risk_level"] in ("Low", "Medium", "High", "Critical")  # nosec B101
        assert result["explanation"]  # nosec B101

    def test_calculate_for_scan_not_found(self, db_session):
        engine = RiskEngine(db_session)
        with pytest.raises(ValueError, match="Scan 999 not found"):
            engine.calculate_for_scan(999)

    def test_calculate_overall_no_scans(self, db_session):
        engine = RiskEngine(db_session)
        result = engine.calculate_overall()
        assert result["score"] == 100.0  # nosec B101
        assert result["total_scans"] == 0  # nosec B101

    def test_risk_history_persisted(self, db_session, sample_scan):
        engine = RiskEngine(db_session)
        engine.calculate_for_scan(sample_scan.id)
        history = engine.get_risk_history()

        assert len(history) >= 1  # nosec B101
        assert history[0]["scan_id"] == sample_scan.id  # nosec B101

    def test_risk_level_mapping(self, db_session):
        engine = RiskEngine(db_session)
        assert engine._score_to_risk_level(95) == "Low"  # nosec B101
        assert engine._score_to_risk_level(70) == "Medium"  # nosec B101
        assert engine._score_to_risk_level(50) == "High"  # nosec B101
        assert engine._score_to_risk_level(30) == "Critical"  # nosec B101
