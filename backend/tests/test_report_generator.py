import pytest

from backend.services.report_generator import ReportGenerator


class TestReportGenerator:
    def test_generate_report(self, db_session, sample_scan):
        generator = ReportGenerator(db_session)
        report = generator.generate_report(sample_scan.id)

        assert report["report_type"] == "ai_security_report"  # nosec B101
        assert report["scan_id"] == sample_scan.id  # nosec B101
        assert report["executive_summary"]  # nosec B101
        assert "score" in report["security_score"]  # nosec B101
        assert report["security_score"]["risk_level"]  # nosec B101
        assert report["vulnerability_summary"]["total_issues"] > 0  # nosec B101
        assert report["analysis_mode"] == "knowledge_base"  # nosec B101

    def test_generate_report_not_found(self, db_session):
        generator = ReportGenerator(db_session)
        with pytest.raises(ValueError, match="Scan 999 not found"):
            generator.generate_report(999)

    def test_pdf_structure(self, db_session, sample_scan):
        generator = ReportGenerator(db_session)
        structure = generator.generate_pdf_structure(sample_scan.id)

        assert structure["title"] == "AI-Powered DevSecOps Security Report"  # nosec B101
        assert len(structure["sections"]) >= 3  # nosec B101
        assert structure["metadata"]["security_score"] >= 0  # nosec B101
        section_titles = [s["title"] for s in structure["sections"]]
        assert "Executive Summary" in section_titles  # nosec B101
        assert "Security Score" in section_titles  # nosec B101

    def test_report_empty_scan(self, db_session):
        from backend.database.models import ScanHistory

        scan = ScanHistory(
            filename="clean.py",
            status="Completed",
            report_name=None,
            risk_level="Safe",
            issues=0,
        )
        db_session.add(scan)
        db_session.commit()

        generator = ReportGenerator(db_session)
        report = generator.generate_report(scan.id)
        assert "no vulnerabilities" in report["executive_summary"].lower()  # nosec B101
