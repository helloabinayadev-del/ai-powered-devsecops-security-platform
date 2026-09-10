from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.auth.dependencies import get_current_user
from backend.database.database import get_db
from backend.database.models import ScanHistory
from backend.schemas.ai_schemas import AIReportResponse, PDFReportStructureResponse
from backend.services.report_generator import ReportGenerator
from backend.utils.audit_logger import create_audit_log

router = APIRouter(
    prefix="/api/v1/ai/reports",
    tags=["AI Reports"],
)


def _verify_scan_ownership(db: Session, scan_id: int, user: dict):
    scan = db.query(ScanHistory).filter(ScanHistory.id == scan_id).first()
    if not scan or (scan.user_id != user["id"] and user["role"].upper() != "ADMIN"):
        raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found.")
    return scan


@router.get(
    "/{scan_id}",
    response_model=AIReportResponse,
    summary="Generate AI security report",
    description=(
        "Generate a comprehensive AI security report including executive summary, "
        "security score, vulnerability overview, critical findings, business impact, "
        "and recommended actions."
    ),
)
def generate_ai_report(
    scan_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    _verify_scan_ownership(db, scan_id, user)
    try:
        generator = ReportGenerator(db)
        report = generator.generate_report(scan_id)

        create_audit_log(db, user["sub"], f"AI Report (scan {scan_id})", "Success")
        return report

    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        create_audit_log(db, user["sub"], f"AI Report (scan {scan_id})", "Failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get(
    "/{scan_id}/pdf-structure",
    response_model=PDFReportStructureResponse,
    summary="Get PDF-ready report structure",
    description=(
        "Return hierarchical report sections suitable for PDF generation "
        "via ReportLab or similar tools."
    ),
)
def get_pdf_report_structure(
    scan_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    _verify_scan_ownership(db, scan_id, user)
    try:
        generator = ReportGenerator(db)
        structure = generator.generate_pdf_structure(scan_id)
        return structure

    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

