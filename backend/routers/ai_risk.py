from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.auth.dependencies import get_current_user
from backend.database.database import get_db
from backend.database.models import ScanHistory
from backend.schemas.ai_schemas import RiskHistoryResponse, RiskScoreResponse
from backend.services.risk_engine import RiskEngine
from backend.utils.audit_logger import create_audit_log

router = APIRouter(
    prefix="/api/v1/ai/risk",
    tags=["Risk Scoring"],
)


def _verify_scan_ownership(db: Session, scan_id: int, user: dict):
    scan = db.query(ScanHistory).filter(ScanHistory.id == scan_id).first()
    if not scan or (scan.user_id != user["id"] and user["role"].upper() != "ADMIN"):
        raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found.")
    return scan


@router.get(
    "/score/{scan_id}",
    response_model=RiskScoreResponse,
    summary="Calculate risk score for a scan",
    description=(
        "Analyze vulnerabilities, severity levels, and scan history trends "
        "to produce a security score (0-100) and risk level."
    ),
)
def get_scan_risk_score(
    scan_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    _verify_scan_ownership(db, scan_id, user)
    try:
        engine = RiskEngine(db)
        result = engine.calculate_for_scan(scan_id)

        create_audit_log(db, user["sub"], f"Risk Score (scan {scan_id})", "Success")
        return result

    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        create_audit_log(db, user["sub"], f"Risk Score (scan {scan_id})", "Failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get(
    "/score",
    response_model=RiskScoreResponse,
    summary="Calculate overall platform risk score",
    description="Aggregate risk score across all scans and vulnerability findings.",
)
def get_overall_risk_score(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    engine = RiskEngine(db)
    result = engine.calculate_overall(user_id=user["id"])
    create_audit_log(db, user["sub"], "Overall Risk Score", "Success")
    return result


@router.get(
    "/history",
    response_model=RiskHistoryResponse,
    summary="Get risk score history",
    description="Retrieve persisted risk scores from previous scan analyses.",
)
def get_risk_history(
    limit: int = 20,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    if limit < 1 or limit > 100:
        raise HTTPException(status_code=400, detail="Limit must be between 1 and 100.")

    engine = RiskEngine(db)
    history = engine.get_risk_history(limit=limit, user_id=user["id"])
    return {"total": len(history), "history": history}

