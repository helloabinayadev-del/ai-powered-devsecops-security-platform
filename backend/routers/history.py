from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.database.models import ScanHistory

from backend.auth.dependencies import get_current_user

router = APIRouter(
    prefix="/api/v1/history",
    tags=["History"]
)


# =====================================================
# Get Scan History (Protected API)
# =====================================================

@router.get("/")
def get_scan_history(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    history = (
        db.query(ScanHistory)
        .filter(ScanHistory.user_id == user["id"])
        .order_by(ScanHistory.id.desc())
        .all()
    )

    results = []

    for scan in history:

        results.append({
            "id": scan.id,
            "filename": scan.filename,
            "status": scan.status,
            "report_name": scan.report_name,
            "risk_level": scan.risk_level,
            "issues": scan.issues,
            "scan_time": scan.scan_time
        })

    return {
        "logged_in_user": user["sub"],
        "total_scans": len(results),
        "history": results
    }
