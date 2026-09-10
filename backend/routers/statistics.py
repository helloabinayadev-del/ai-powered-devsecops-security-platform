from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.database.models import ScanHistory

from backend.auth.dependencies import get_current_user

router = APIRouter(
    prefix="/api/v1/statistics",
    tags=["Statistics"]
)


@router.get("/")
def statistics(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    scans = db.query(ScanHistory).filter(ScanHistory.user_id == user["id"]).all()

    total_scans = len(scans)

    safe_files = 0
    risky_files = 0
    total_issues = 0

    for scan in scans:

        if scan.risk_level == "Safe":
            safe_files += 1
        else:
            risky_files += 1

        total_issues += scan.issues

    return {
        "total_scans": total_scans,
        "safe_files": safe_files,
        "risky_files": risky_files,
        "total_issues": total_issues
    }
