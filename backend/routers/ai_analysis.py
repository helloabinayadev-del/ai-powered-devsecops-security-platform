from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.auth.dependencies import get_current_user
from backend.database.database import get_db
from backend.database.models import ScanHistory
from backend.schemas.ai_schemas import (
    ScanAnalysisResponse,
    VulnerabilityAnalysisResponse,
    VulnerabilityInput,
)
from backend.services.vulnerability_analyzer import VulnerabilityAnalyzer
from backend.utils.audit_logger import create_audit_log

router = APIRouter(
    prefix="/api/v1/ai",
    tags=["AI Analysis"],
)


def _verify_scan_ownership(db: Session, scan_id: int, user: dict):
    scan = db.query(ScanHistory).filter(ScanHistory.id == scan_id).first()
    if not scan or (scan.user_id != user["id"] and user["role"].upper() != "ADMIN"):
        raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found.")
    return scan


@router.post(
    "/analyze/vulnerability",
    response_model=VulnerabilityAnalysisResponse,
    summary="Analyze a vulnerability from provided data",
    description=(
        "Generate AI security analysis for vulnerability data without requiring "
        "a stored scan. Uses the security knowledge base mapped to Bandit/CWE identifiers."
    ),
)
def analyze_vulnerability_input(
    vulnerability: VulnerabilityInput,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    try:
        analyzer = VulnerabilityAnalyzer(db)
        result = analyzer.analyze_from_input(vulnerability.model_dump())

        create_audit_log(db, user["sub"], "AI Vulnerability Analysis", "Success")
        return result

    except ValueError as exc:
        create_audit_log(db, user["sub"], "AI Vulnerability Analysis", "Failed")
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        create_audit_log(db, user["sub"], "AI Vulnerability Analysis", "Failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post(
    "/analyze/{scan_id}",
    response_model=ScanAnalysisResponse,
    summary="Analyze all vulnerabilities in a scan",
    description=(
        "Load Bandit findings from the scan report and generate structured "
        "explanations, business impact, and remediation guidance for each finding."
    ),
)
def analyze_scan(
    scan_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    _verify_scan_ownership(db, scan_id, user)
    try:
        analyzer = VulnerabilityAnalyzer(db)
        result = analyzer.analyze_scan(scan_id)

        create_audit_log(db, user["sub"], f"AI Scan Analysis (scan {scan_id})", "Success")
        return result

    except ValueError as exc:
        create_audit_log(db, user["sub"], f"AI Scan Analysis (scan {scan_id})", "Failed")
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except FileNotFoundError as exc:
        create_audit_log(db, user["sub"], f"AI Scan Analysis (scan {scan_id})", "Failed")
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        create_audit_log(db, user["sub"], f"AI Scan Analysis (scan {scan_id})", "Failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get(
    "/analyze/{scan_id}",
    summary="Get stored AI analyses for a scan",
    description="Retrieve previously generated and persisted vulnerability analyses.",
)
def get_scan_analyses(
    scan_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    _verify_scan_ownership(db, scan_id, user)
    analyzer = VulnerabilityAnalyzer(db)
    analyses = analyzer.get_stored_analyses(scan_id)
    return {
        "scan_id": scan_id,
        "total": len(analyses),
        "analyses": analyses,
    }


@router.get(
    "/analyze/{scan_id}/{vulnerability_id}",
    response_model=VulnerabilityAnalysisResponse,
    summary="Analyze a single vulnerability in a scan",
)
def analyze_single_vulnerability(
    scan_id: int,
    vulnerability_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    _verify_scan_ownership(db, scan_id, user)
    try:
        analyzer = VulnerabilityAnalyzer(db)
        result = analyzer.analyze_single(scan_id, vulnerability_id)

        create_audit_log(
            db,
            user["sub"],
            f"AI Vulnerability Analysis ({vulnerability_id})",
            "Success",
        )
        return result

    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

