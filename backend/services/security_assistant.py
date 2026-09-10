"""
AI Security Assistant service.
Answers security questions using structured knowledge and optional scan context.
"""

import uuid
from typing import Any

from sqlalchemy.orm import Session

from backend.database.models import ScanHistory
from backend.logger import logger
from backend.services.ai_service import AIService
from backend.services.scan_report_loader import get_findings_from_report
from backend.services.security_knowledge_base import (
    get_profile_for_vulnerability,
    match_assistant_topic,
)
from backend.services.vulnerability_analyzer import VulnerabilityAnalyzer

# In-memory conversation store (session_id -> list of messages)
_conversations: dict[str, list[dict[str, str]]] = {}


class SecurityAssistant:
    """AI-powered security assistant with optional conversation context."""

    MAX_HISTORY = 10

    def __init__(self, db: Session) -> None:
        self.db = db
        self.ai = AIService()
        self.analyzer = VulnerabilityAnalyzer(db)

    def chat(
        self,
        question: str,
        session_id: str | None = None,
        scan_id: int | None = None,
        vulnerability_id: str | None = None,
    ) -> dict[str, Any]:
        """Process a security question and return structured answer."""
        if not question or not question.strip():
            raise ValueError("Question cannot be empty.")
        if len(question) > 2000:
            raise ValueError("Question exceeds maximum length of 2000 characters.")

        session_id = session_id or str(uuid.uuid4())
        history = _conversations.setdefault(session_id, [])

        answer_data = self._build_answer(question, scan_id, vulnerability_id)
        history.append({"role": "user", "content": question.strip()})
        history.append({"role": "assistant", "content": answer_data["answer"]})

        if len(history) > self.MAX_HISTORY * 2:
            _conversations[session_id] = history[-(self.MAX_HISTORY * 2):]

        logger.info("Security assistant answered question (session=%s)", session_id)

        return {
            "session_id": session_id,
            "answer": answer_data["answer"],
            "recommendations": answer_data["recommendations"],
            "analysis_mode": answer_data.get("analysis_mode", "knowledge_base"),
            "context_used": answer_data.get("context_used"),
        }

    def _build_answer(
        self,
        question: str,
        scan_id: int | None,
        vulnerability_id: str | None,
    ) -> dict[str, Any]:
        """Build answer from scan context, topic matching, or general guidance."""
        if scan_id and vulnerability_id:
            return self._answer_about_vulnerability(scan_id, vulnerability_id, question)

        if scan_id:
            return self._answer_about_scan(scan_id, question)

        topic = match_assistant_topic(question)
        if topic:
            return {
                **topic,
                "analysis_mode": "knowledge_base",
                "context_used": "topic_knowledge_base",
            }

        return self._general_answer(question)

    def _answer_about_vulnerability(
        self,
        scan_id: int,
        vulnerability_id: str,
        question: str,
    ) -> dict[str, Any]:
        try:
            analysis = self.analyzer.analyze_single(scan_id, vulnerability_id)
        except ValueError as exc:
            raise ValueError(str(exc)) from exc

        q = question.lower()
        if "fix" in q or "remediat" in q:
            answer = analysis["recommended_remediation"]
            recs = [analysis.get("secure_coding_example", "")]
        elif "danger" in q or "why" in q:
            answer = (
                f"{analysis['simple_explanation']} "
                f"{analysis['business_impact']}"
            )
            recs = [analysis["recommended_remediation"]]
        elif "severity" in q:
            answer = analysis["risk_reasoning"]
            recs = [analysis["recommended_remediation"]]
        elif "attack" in q:
            answer = analysis["attack_scenario"]
            recs = [analysis["recommended_remediation"]]
        else:
            answer = (
                f"{analysis['simple_explanation']}\n\n"
                f"Technical detail: {analysis['technical_explanation']}"
            )
            recs = [
                analysis["recommended_remediation"],
                analysis.get("secure_coding_example", ""),
            ]

        return {
            "answer": answer.strip(),
            "recommendations": [r for r in recs if r],
            "analysis_mode": analysis.get("analysis_mode", "knowledge_base"),
            "context_used": f"scan:{scan_id}/vulnerability:{vulnerability_id}",
        }

    def _answer_about_scan(self, scan_id: int, question: str) -> dict[str, Any]:
        scan = self.db.query(ScanHistory).filter(ScanHistory.id == scan_id).first()
        if not scan:
            raise ValueError(f"Scan {scan_id} not found.")

        findings = []
        if scan.report_name:
            try:
                findings = get_findings_from_report(scan.report_name)
            except FileNotFoundError:
                pass

        if not findings:
            return {
                "answer": (
                    f"Scan '{scan.filename}' (ID {scan_id}) has no reported vulnerabilities."
                ),
                "recommendations": [
                    "Continue following secure coding practices.",
                    "Run periodic scans to detect new issues.",
                ],
                "analysis_mode": "knowledge_base",
                "context_used": f"scan:{scan_id}",
            }

        high = [f for f in findings if f.get("severity") == "HIGH"]
        answer = (
            f"Scan '{scan.filename}' has {len(findings)} finding(s)"
            + (f", including {len(high)} HIGH severity." if high else ".")
        )

        recs = []
        for finding in findings[:3]:
            profile = get_profile_for_vulnerability(finding)
            recs.append(profile["remediation"])

        return {
            "answer": answer,
            "recommendations": recs,
            "analysis_mode": "knowledge_base",
            "context_used": f"scan:{scan_id}",
        }

    def _general_answer(self, question: str) -> dict[str, Any]:
        return {
            "answer": (
                "I can help explain vulnerabilities, remediation steps, severity reasoning, "
                "and general security improvements. Try asking about specific topics such as "
                "'SQL Injection', 'hardcoded password', or 'how can I improve security?'. "
                "For scan-specific answers, include scan_id and vulnerability_id in your request."
            ),
            "recommendations": [
                "Provide scan_id and vulnerability_id for context-specific guidance.",
                "Ask about specific vulnerability types for detailed remediation.",
                "Use /api/v1/ai/analyze/{scan_id} to generate full vulnerability analysis.",
            ],
            "analysis_mode": "knowledge_base",
            "context_used": "general",
        }
