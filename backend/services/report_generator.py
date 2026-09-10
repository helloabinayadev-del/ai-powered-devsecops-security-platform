"""
AI Security Report Generator.
Builds structured reports integrating vulnerability analysis and risk scores.
"""

from datetime import datetime, timezone
from typing import Any
import json
import os

from sqlalchemy.orm import Session

from backend.database.models import ScanHistory
from backend.config import REPORTS_FOLDER
from backend.services.risk_engine import RiskEngine
from backend.services.scan_report_loader import get_findings_from_report
from backend.services.security_knowledge_base import get_profile_for_vulnerability
from backend.services.vulnerability_analyzer import VulnerabilityAnalyzer



class ReportGenerator:
    """Generate AI-enhanced security reports."""

    def __init__(self, db: Session) -> None:
        self.db = db
        self.analyzer = VulnerabilityAnalyzer(db)
        self.risk_engine = RiskEngine(db)

    def generate_report(self, scan_id: int) -> dict[str, Any]:
        """Generate a full AI security report for a scan."""
        scan = self.db.query(ScanHistory).filter(ScanHistory.id == scan_id).first()
        if not scan:
            raise ValueError(f"Scan {scan_id} not found.")

        analysis_result = self.analyzer.analyze_scan(scan_id)
        risk_result = self.risk_engine.calculate_for_scan(scan_id)

        findings = []
        if scan.report_name:
            try:
                findings = get_findings_from_report(scan.report_name)
            except FileNotFoundError:
                pass

        critical = [
            a for a in analysis_result.get("analyses", [])
            if a.get("severity") == "HIGH"
        ]
        medium = [
            a for a in analysis_result.get("analyses", [])
            if a.get("severity") == "MEDIUM"
        ]

        business_impacts = list({
            a.get("business_impact", "")
            for a in analysis_result.get("analyses", [])
            if a.get("business_impact")
        })

        recommendations = list({
            a.get("recommended_remediation", "")
            for a in analysis_result.get("analyses", [])
            if a.get("recommended_remediation")
        })

        secure_coding = list({
            a.get("secure_coding_example", "")
            for a in analysis_result.get("analyses", [])
            if a.get("secure_coding_example")
        })

        # Generate attack scenarios based on critical findings
        attack_scenarios = self._generate_attack_scenarios(critical, scan.filename)

        report = {
            "report_type": "ai_security_report",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "scan_id": scan_id,

            "filename": scan.filename,
            "report_name": scan.report_name,
            "analysis_mode": analysis_result.get("analysis_mode", "knowledge-base"),
            "executive_summary": self._executive_summary(scan, risk_result, findings),
            "security_score": {
                "score": risk_result["score"],
                "risk_level": risk_result["risk_level"],
                "explanation": risk_result["explanation"],
                "trend": risk_result.get("trend", {}),
            },
            "overall_security_status": self._get_security_status(risk_result["score"]),
            "vulnerability_summary": self._vulnerability_summary(findings, risk_result),
            "critical_findings": critical,
            "medium_findings": medium,
            "ai_explanation": self._ai_explanation(analysis_result),
            "business_impact": business_impacts,
            "attack_scenarios": attack_scenarios,
            "risk_analysis": self._risk_analysis(risk_result, findings),
            "priority_recommendations": self._priority_recommendations(critical, medium),
            "secure_coding_suggestions": secure_coding,
            "developer_notes": self._developer_notes(scan, findings),
            "next_steps": self._next_steps(risk_result, critical),
            "detailed_analyses": analysis_result.get("analyses", []),
        }

        self._store_report(scan.report_name, report)
        return report

    @staticmethod
    def _store_report(report_name: str | None, report: dict[str, Any]) -> None:
        """Persist AI output inside its scan JSON without changing Bandit fields.

        ``results`` remains untouched so the existing risk engine and scan
        report loader continue to consume the original Bandit structure.
        """
        if not report_name or os.path.basename(report_name) != report_name:
            return

        report_path = os.path.join(REPORTS_FOLDER, report_name)
        if not os.path.isfile(report_path):
            return

        with open(report_path, "r", encoding="utf-8") as handle:
            scan_report = json.load(handle)

        scan_report["ai_report"] = report
        with open(report_path, "w", encoding="utf-8") as handle:
            json.dump(scan_report, handle, indent=2, default=str)

    def generate_pdf_structure(self, scan_id: int) -> dict[str, Any]:
        """Return PDF-ready hierarchical report structure."""
        report = self.generate_report(scan_id)
        sections = []

        sections.append({
            "title": "Executive Summary",
            "content": report["executive_summary"],
        })
        sections.append({
            "title": "Security Score",
            "content": (
                f"Score: {report['security_score']['score']}/100\n"
                f"Risk Level: {report['security_score']['risk_level']}\n"
                f"Overall Status: {report['overall_security_status']}\n"
                f"{report['security_score']['explanation']}"
            ),
        })
        sections.append({
            "title": "Vulnerability Summary",
            "content": (
                f"Total Issues: {report['vulnerability_summary']['total_issues']}\n"
                f"Breakdown: {report['vulnerability_summary']['severity_breakdown']}"
            ),
        })

        if report["critical_findings"]:
            critical_text = "\n\n".join(
                f"- {f.get('vulnerability_type')}: {f.get('issue_text')} "
                f"(Line {f.get('line_number')})"
                for f in report["critical_findings"]
            )
            sections.append({"title": "Critical Findings", "content": critical_text})

        if report["attack_scenarios"]:
            attack_text = "\n\n".join(
                f"Vulnerability: {s['vulnerability']}\n"
                f"Scenario: {s['scenario']}\n"
                f"Likelihood: {s['likelihood']}\n"
                f"Impact: {s['impact']}\n"
                f"Mitigation: {s['mitigation']}"
                for s in report["attack_scenarios"]
            )
            sections.append({"title": "Attack Scenarios", "content": attack_text})

        if report["ai_explanation"]:
            sections.append({"title": "AI Analysis Explanation", "content": report["ai_explanation"]})

        if report["business_impact"]:
            sections.append({
                "title": "Business Impact",
                "content": "\n".join(f"- {item}" for item in report["business_impact"]),
            })

        if report["priority_recommendations"]:
            sections.append({
                "title": "Priority Recommendations",
                "content": "\n".join(f"- {item}" for item in report["priority_recommendations"]),
            })

        if report["secure_coding_suggestions"]:
            sections.append({
                "title": "Secure Coding Suggestions",
                "content": "\n\n".join(report["secure_coding_suggestions"][:3]),
            })

        if report["developer_notes"]:
            sections.append({
                "title": "Developer Notes",
                "content": "\n".join(f"- {note}" for note in report["developer_notes"]),
            })

        if report["next_steps"]:
            sections.append({
                "title": "Next Steps",
                "content": "\n".join(f"- {step}" for step in report["next_steps"]),
            })

        return {
            "title": "AI-Powered DevSecOps Security Report",
            "scan_id": scan_id,
            "filename": report["filename"],
            "generated_at": report["generated_at"],
            "sections": sections,
            "metadata": {
                "analysis_mode": report["analysis_mode"],
                "security_score": report["security_score"]["score"],
                "risk_level": report["security_score"]["risk_level"],
                "overall_status": report["overall_security_status"],
            },
        }

    def _executive_summary(
        self,
        scan: ScanHistory,
        risk: dict[str, Any],
        findings: list[dict[str, Any]],
    ) -> str:
        total = len(findings)
        if total == 0:
            return (
                f"Security analysis of '{scan.filename}' found no vulnerabilities. "
                f"The security score is {risk['score']}/100 ({risk['risk_level']} risk). "
                "Continue maintaining secure coding practices."
            )

        high_count = sum(1 for f in findings if f.get("severity") == "HIGH")
        if high_count > 0:
            return (
                f"Security analysis of '{scan.filename}' identified {total} "
                f"vulnerability/vulnerabilities including {high_count} HIGH severity "
                f"finding(s). Security score: {risk['score']}/100 ({risk['risk_level']} risk). "
                "Immediate remediation is recommended before deployment."
            )

        return (
            f"Security analysis of '{scan.filename}' identified {total} "
            f"vulnerability/vulnerabilities. Security score: {risk['score']}/100 "
            f"({risk['risk_level']} risk). Review and remediate findings before release."
        )

    def _get_security_status(self, score: int) -> str:
        """Determine overall security status based on score."""
        if score >= 90:
            return "Secure"
        elif score >= 70:
            return "Moderate Risk"
        elif score >= 50:
            return "High Risk"
        else:
            return "Critical Risk"

    def _vulnerability_summary(self, findings: list[dict[str, Any]], risk: dict[str, Any]) -> dict[str, Any]:
        """Generate vulnerability summary."""
        return {
            "total_issues": len(findings),
            "severity_breakdown": risk.get("severity_breakdown", {}),
            "findings": findings,
        }

    def _ai_explanation(self, analysis_result: dict[str, Any]) -> str:
        """Generate AI explanation of the analysis."""
        mode = analysis_result.get("analysis_mode", "knowledge-base")
        if mode == "knowledge-base":
            return "This analysis was performed using a comprehensive security knowledge base that maps vulnerability patterns to known security issues, business impacts, and remediation strategies."
        else:
            return "This analysis was performed using AI-powered vulnerability detection with contextual understanding of security patterns."

    def _generate_attack_scenarios(self, critical: list[dict[str, Any]], filename: str) -> list[dict[str, Any]]:
        """Generate potential attack scenarios based on critical findings."""
        scenarios = []
        for finding in critical[:5]:  # Limit to top 5 critical findings
            vuln_type = finding.get("vulnerability_type", "Unknown")
            scenarios.append({
                "vulnerability": vuln_type,
                "scenario": f"An attacker could exploit the {vuln_type} vulnerability in {filename} to gain unauthorized access or cause system compromise.",
                "likelihood": "High",
                "impact": "Critical",
                "mitigation": finding.get("recommended_remediation", "Apply security patches and follow secure coding practices.")
            })
        return scenarios

    def _risk_analysis(self, risk: dict[str, Any], findings: list[dict[str, Any]]) -> dict[str, Any]:
        """Generate detailed risk analysis."""
        return {
            "current_score": risk["score"],
            "risk_level": risk["risk_level"],
            "trend": risk.get("trend", {}),
            "factors": {
                "vulnerability_count": len(findings),
                "critical_count": sum(1 for f in findings if f.get("severity") == "HIGH"),
                "medium_count": sum(1 for f in findings if f.get("severity") == "MEDIUM"),
            }
        }

    def _priority_recommendations(self, critical: list[dict[str, Any]], medium: list[dict[str, Any]]) -> list[str]:
        """Generate prioritized recommendations."""
        recommendations = []
        for finding in critical[:3]:
            recommendations.append(f"[CRITICAL] {finding.get('recommended_remediation', 'Remediate immediately')}")
        for finding in medium[:2]:
            recommendations.append(f"[MEDIUM] {finding.get('recommended_remediation', 'Remediate soon')}")
        return recommendations

    def _developer_notes(self, scan: ScanHistory, findings: list[dict[str, Any]]) -> list[str]:
        """Generate developer-specific notes."""
        notes = [
            f"File '{scan.filename}' was scanned on {scan.scan_time.strftime('%Y-%m-%d %H:%M:%S')}",
            f"Total vulnerabilities found: {len(findings)}",
            "Review the detailed analyses section for specific code locations and remediation steps.",
            "Consider implementing automated security testing in CI/CD pipeline.",
        ]
        return notes

    def _next_steps(self, risk: dict[str, Any], critical: list[dict[str, Any]]) -> list[str]:
        """Generate next steps for remediation."""
        steps = []
        if risk["score"] < 70:
            steps.append("Immediate: Address all critical vulnerabilities before deployment")
        if critical:
            steps.append("Short-term: Patch critical security issues")
        steps.append("Medium-term: Implement security best practices")
        steps.append("Long-term: Establish continuous security monitoring")
        return steps
