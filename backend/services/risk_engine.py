"""
Intelligent Risk Scoring Engine.
Calculates security scores from vulnerability data and scan history trends.
"""

from typing import Any

from sqlalchemy.orm import Session

from backend.config import CONFIDENCE_MULTIPLIER, SEVERITY_WEIGHTS
from backend.database.models import RiskHistory, ScanHistory
from backend.logger import logger
from backend.services.scan_report_loader import get_findings_from_report


class RiskEngine:
    """Compute and persist security scores."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def calculate_score_for_findings(
        self,
        findings: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """Calculate score from normalized Bandit findings."""
        if not findings:
            return {
                "score": 100.0,
                "risk_level": "Low",
                "explanation": "No vulnerabilities detected. Security score is at maximum.",
                "severity_breakdown": {"HIGH": 0, "MEDIUM": 0, "LOW": 0},
                "total_issues": 0,
            }

        breakdown = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
        total_deduction = 0.0

        for finding in findings:
            severity = finding.get("severity", "LOW").upper()
            confidence = finding.get("confidence", "MEDIUM").upper()
            breakdown[severity] = breakdown.get(severity, 0) + 1

            base_weight = SEVERITY_WEIGHTS.get(severity, 3)
            multiplier = CONFIDENCE_MULTIPLIER.get(confidence, 0.75)
            total_deduction += base_weight * multiplier

        score = max(0.0, min(100.0, 100.0 - total_deduction))
        risk_level = self._score_to_risk_level(score)
        explanation = self._build_explanation(breakdown, score, total_deduction)

        return {
            "score": round(score, 1),
            "risk_level": risk_level,
            "explanation": explanation,
            "severity_breakdown": breakdown,
            "total_issues": len(findings),
        }

    def calculate_for_scan(self, scan_id: int) -> dict[str, Any]:
        """Calculate and persist risk score for a specific scan."""
        scan = self.db.query(ScanHistory).filter(ScanHistory.id == scan_id).first()
        if not scan:
            raise ValueError(f"Scan {scan_id} not found.")

        findings = []
        if scan.report_name:
            try:
                findings = get_findings_from_report(scan.report_name)
            except FileNotFoundError:
                logger.warning("Report missing for scan %d", scan_id)

        base_result = self.calculate_score_for_findings(findings)
        trend = self._compute_trend(scan_id, base_result["total_issues"])
        base_result["trend"] = trend

        if trend.get("direction") == "worsening":
            adjusted = max(0.0, base_result["score"] - 5.0)
            base_result["score"] = round(adjusted, 1)
            base_result["risk_level"] = self._score_to_risk_level(adjusted)
            base_result["explanation"] += (
                f" Security score decreased because {trend['detail']}."
            )

        self._persist_risk(scan_id, base_result)
        self.db.commit()

        return {
            "scan_id": scan_id,
            "filename": scan.filename,
            **base_result,
        }

    def calculate_overall(self, user_id: Optional[int] = None) -> dict[str, Any]:
        """Aggregate score across all scans (or filtered by user_id)."""
        query = self.db.query(ScanHistory)
        if user_id is not None:
            query = query.filter(ScanHistory.user_id == user_id)
        scans = query.all()

        if not scans:
            return {
                "score": 100.0,
                "risk_level": "SAFE",
                "breakdown": {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0},
                "total_vulnerabilities": 0,
                "total_scans": 0,
                "scan_count": 0,
                "explanation": "No scans available. Overall security posture is optimal.",
                "remediation_priority": [],
            }

        all_findings: list[dict[str, Any]] = []
        for scan in scans:
            if scan.report_name:
                try:
                    all_findings.extend(get_findings_from_report(scan.report_name))
                except FileNotFoundError:
                    continue

        result = self.calculate_score_for_findings(all_findings)
        recent_history = self.get_risk_history(limit=10, user_id=user_id)

        return {
            **result,
            "total_scans": len(scans),
            "recent_history": recent_history,
        }

    def get_risk_history(self, limit: int = 20, user_id: Optional[int] = None) -> list[dict[str, Any]]:
        """Return persisted risk history entries (filtered by user_id if provided)."""
        query = self.db.query(RiskHistory)
        if user_id is not None:
            query = query.join(ScanHistory, RiskHistory.scan_id == ScanHistory.id).filter(ScanHistory.user_id == user_id)

        rows = (
            query.order_by(RiskHistory.id.desc())
            .limit(limit)
            .all()
        )
        return [
            {
                "id": row.id,
                "scan_id": row.scan_id,
                "score": row.score,
                "risk_level": row.risk_level,
                "explanation": row.explanation,
                "created_at": row.created_at,
            }
            for row in rows
        ]

    def _compute_trend(self, scan_id: int, current_issues: int) -> dict[str, Any]:
        """Compare current scan issues with previous scan of same file."""
        scan = self.db.query(ScanHistory).filter(ScanHistory.id == scan_id).first()
        if not scan:
            return {"direction": "stable", "detail": "no prior comparison available"}

        previous = (
            self.db.query(ScanHistory)
            .filter(
                ScanHistory.filename == scan.filename,
                ScanHistory.id < scan_id,
            )
            .order_by(ScanHistory.id.desc())
            .first()
        )

        if not previous:
            return {"direction": "stable", "detail": "first scan for this file"}

        delta = current_issues - previous.issues
        if delta > 0:
            return {
                "direction": "worsening",
                "detail": (
                    f"vulnerability count increased from {previous.issues} "
                    f"to {current_issues} since the last scan"
                ),
                "previous_issues": previous.issues,
                "current_issues": current_issues,
            }
        if delta < 0:
            return {
                "direction": "improving",
                "detail": (
                    f"vulnerability count decreased from {previous.issues} "
                    f"to {current_issues}"
                ),
                "previous_issues": previous.issues,
                "current_issues": current_issues,
            }
        return {
            "direction": "stable",
            "detail": "vulnerability count unchanged from previous scan",
            "previous_issues": previous.issues,
            "current_issues": current_issues,
        }

    def _score_to_risk_level(self, score: float) -> str:
        if score >= 80:
            return "Low"
        if score >= 60:
            return "Medium"
        if score >= 40:
            return "High"
        return "Critical"

    def _build_explanation(
        self,
        breakdown: dict[str, int],
        score: float,
        deduction: float,
    ) -> str:
        high = breakdown.get("HIGH", 0)
        medium = breakdown.get("MEDIUM", 0)
        low = breakdown.get("LOW", 0)
        total = high + medium + low

        if total == 0:
            return "No vulnerabilities detected. Security posture is strong."

        parts = []
        if high:
            parts.append(f"{high} HIGH")
        if medium:
            parts.append(f"{medium} MEDIUM")
        if low:
            parts.append(f"{low} LOW")

        summary = ", ".join(parts)
        return (
            f"Security score is {round(score, 1)}/100 based on {total} finding(s) "
            f"({summary}). Total risk deduction: {round(deduction, 1)} points."
        )

    def _persist_risk(self, scan_id: int, result: dict[str, Any]) -> None:
        existing = (
            self.db.query(RiskHistory)
            .filter(RiskHistory.scan_id == scan_id)
            .first()
        )
        if existing:
            existing.score = result["score"]
            existing.risk_level = result["risk_level"]
            existing.explanation = result["explanation"]
        else:
            self.db.add(RiskHistory(
                scan_id=scan_id,
                score=result["score"],
                risk_level=result["risk_level"],
                explanation=result["explanation"],
            ))
