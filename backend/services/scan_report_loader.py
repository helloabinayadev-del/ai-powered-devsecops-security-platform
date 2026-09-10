import json
import os
from typing import Any

from backend.config import REPORTS_FOLDER
from backend.logger import logger


def vulnerability_key(finding: dict, index: int) -> str:
    """Build a stable identifier for a Bandit finding."""
    test_id = finding.get("test_id", "UNKNOWN")
    line = finding.get("line_number", index)
    return f"{test_id}_L{line}"


def normalize_finding(finding: dict, index: int) -> dict[str, Any]:
    """Extract normalized vulnerability fields from a Bandit result."""
    filename = finding.get("filename", "")
    return {
        "vulnerability_id": vulnerability_key(finding, index),
        "test_id": finding.get("test_id"),
        "test_name": finding.get("test_name"),
        "severity": finding.get("issue_severity", "UNKNOWN"),
        "confidence": finding.get("issue_confidence", "UNKNOWN"),
        "issue_text": finding.get("issue_text", ""),
        "filename": os.path.basename(filename.replace("\\", "/")),
        "line_number": finding.get("line_number"),
        "code_snippet": finding.get("code", "").strip(),
        "cwe_id": finding.get("issue_cwe", {}).get("id"),
        "cwe_link": finding.get("issue_cwe", {}).get("link"),
        "more_info": finding.get("more_info"),
    }


def load_bandit_report(report_name: str) -> dict[str, Any]:
    """Load and parse a Bandit JSON report from the reports folder."""
    if not report_name:
        raise FileNotFoundError("Report name is missing for this scan.")

    report_path = os.path.join(REPORTS_FOLDER, report_name)
    if not os.path.isfile(report_path):
        raise FileNotFoundError(f"Report file not found: {report_name}")

    with open(report_path, "r", encoding="utf-8") as handle:
        data = json.load(handle)

    logger.info("Loaded Bandit report: %s", report_name)
    return data


def get_findings_from_report(report_name: str) -> list[dict[str, Any]]:
    """Return normalized findings from a Bandit JSON report."""
    report = load_bandit_report(report_name)
    results = report.get("results", [])
    return [normalize_finding(item, idx) for idx, item in enumerate(results)]


def get_finding_by_id(report_name: str, vulnerability_id: str) -> dict[str, Any] | None:
    """Look up a single normalized finding by vulnerability_id."""
    for finding in get_findings_from_report(report_name):
        if finding["vulnerability_id"] == vulnerability_id:
            return finding
    return None
