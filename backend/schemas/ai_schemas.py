from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


# =====================================================
# Vulnerability Analysis
# =====================================================

class VulnerabilityInput(BaseModel):
    """Direct vulnerability input for analysis without a stored scan."""

    vulnerability_type: str | None = Field(
        None,
        examples=["Hardcoded Password"],
        description="Type or name of the vulnerability",
    )
    test_id: str | None = Field(None, examples=["B105"])
    test_name: str | None = Field(None, examples=["hardcoded_password_string"])
    severity: str = Field(..., examples=["HIGH"])
    confidence: str | None = Field("MEDIUM", examples=["MEDIUM"])
    filename: str | None = Field(None, examples=["app.py"])
    line_number: int | None = Field(None, examples=[42])
    issue_text: str = Field(
        ...,
        examples=["Possible hardcoded password: 'admin123'"],
    )
    code_snippet: str | None = Field(None, examples=['password = "admin123"'])
    cwe_id: int | None = Field(None, examples=[259])

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "vulnerability_type": "Hardcoded Password",
                    "test_id": "B105",
                    "severity": "LOW",
                    "confidence": "MEDIUM",
                    "filename": "vulnerable.py",
                    "line_number": 1,
                    "issue_text": "Possible hardcoded password: 'admin123'",
                    "code_snippet": 'password = "admin123"',
                    "cwe_id": 259,
                }
            ]
        }
    }


class VulnerabilityAnalysisResponse(BaseModel):
    vulnerability_id: str
    vulnerability_type: str | None = None
    severity: str
    confidence: str | None = None
    filename: str | None = None
    line_number: int | None = None
    issue_text: str | None = None
    simple_explanation: str
    technical_explanation: str
    business_impact: str
    attack_scenario: str
    risk_reasoning: str
    recommended_remediation: str
    secure_coding_example: str
    analysis_mode: str


class ScanAnalysisResponse(BaseModel):
    scan_id: int
    filename: str
    report_name: str | None = None
    total_vulnerabilities: int
    analyses: list[dict[str, Any]]
    analysis_mode: str
    message: str | None = None


# =====================================================
# Security Assistant
# =====================================================

class SecurityAssistantRequest(BaseModel):
    question: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        examples=["How do I fix SQL Injection?"],
    )
    session_id: str | None = Field(
        None,
        description="Optional session ID for conversation continuity",
    )
    scan_id: int | None = Field(
        None,
        description="Optional scan ID for context-aware answers",
    )
    vulnerability_id: str | None = Field(
        None,
        description="Optional vulnerability ID (requires scan_id)",
        examples=["B105_L1"],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "question": "How do I fix SQL Injection?",
                },
                {
                    "question": "Why is this vulnerability dangerous?",
                    "scan_id": 1,
                    "vulnerability_id": "B105_L1",
                },
            ]
        }
    }


class SecurityAssistantResponse(BaseModel):
    session_id: str
    answer: str
    recommendations: list[str]
    analysis_mode: str
    context_used: str | None = None


# =====================================================
# Risk Scoring
# =====================================================

class RiskScoreResponse(BaseModel):
    scan_id: int | None = None
    filename: str | None = None
    score: float = Field(..., ge=0, le=100, examples=[72.5])
    risk_level: str = Field(..., examples=["Medium"])
    explanation: str
    severity_breakdown: dict[str, int] | None = None
    total_issues: int | None = None
    trend: dict[str, Any] | None = None


class RiskHistoryResponse(BaseModel):
    total: int
    history: list[dict[str, Any]]


# =====================================================
# AI Reports
# =====================================================

class AIReportResponse(BaseModel):
    report_type: str
    generated_at: str
    scan_id: int
    filename: str
    report_name: str | None = None
    analysis_mode: str
    executive_summary: str
    security_score: dict[str, Any]
    overall_security_status: str
    vulnerability_summary: dict[str, Any]
    critical_findings: list[dict[str, Any]]
    medium_findings: list[dict[str, Any]]
    ai_explanation: str
    business_impact: list[str]
    attack_scenarios: list[dict[str, Any]]
    risk_analysis: dict[str, Any]
    priority_recommendations: list[str]
    secure_coding_suggestions: list[str]
    developer_notes: list[str]
    next_steps: list[str]
    detailed_analyses: list[dict[str, Any]]


class PDFReportStructureResponse(BaseModel):
    title: str
    scan_id: int
    filename: str
    generated_at: str
    sections: list[dict[str, str]]
    metadata: dict[str, Any]
