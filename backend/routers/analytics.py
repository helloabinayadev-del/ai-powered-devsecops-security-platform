from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.database.models import ScanHistory
from backend.auth.dependencies import get_current_user

router = APIRouter(
    prefix="/api/v1/analytics",
    tags=["Analytics"]
)


@router.get("/")
def analytics_dashboard(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    scans = db.query(ScanHistory).filter(ScanHistory.user_id == user["id"]).all()

    total_scans = len(scans)

    safe = 0
    low = 0
    medium = 0
    high = 0
    critical = 0

    total_issues = 0

    for scan in scans:

        risk = scan.risk_level.lower()

        total_issues += scan.issues

        if risk == "safe":
            safe += 1

        elif risk == "low":
            low += 1

        elif risk == "medium":
            medium += 1

        elif risk == "high":
            high += 1

        elif risk == "critical":
            critical += 1

    if total_scans == 0:

        average_issues = 0

        security_score = 100

    else:

        average_issues = round(
            total_issues / total_scans,
            2
        )

        risky = critical + high + medium

        security_score = max(
            0,
            round(
                100 - ((risky / total_scans) * 100)
            )
        )

    recommendations = []

    if critical > 0:

        recommendations.append(
            "Immediate remediation required for Critical vulnerabilities."
        )

    if high > 0:

        recommendations.append(
            "Review High-risk findings as soon as possible."
        )

    if medium > 0:

        recommendations.append(
            "Resolve Medium-risk vulnerabilities to improve security."
        )

    if low > 0:

        recommendations.append(
            "Low-risk findings can be scheduled for future fixes."
        )

    if total_issues > 20:

        recommendations.append(
            "Large number of issues detected. Perform a complete security review."
        )

    if len(recommendations) == 0:

        recommendations.append(
            "Excellent! No major security vulnerabilities detected."
        )

    return {

        "logged_in_user": user["sub"],

        "security_score": security_score,

        "summary": {

            "total_scans": total_scans,

            "total_issues": total_issues,

            "average_issues_per_scan": average_issues

        },

        "risk_distribution": {

            "critical": critical,

            "high": high,

            "medium": medium,

            "low": low,

            "safe": safe

        },

        "recommendations": recommendations

    }
