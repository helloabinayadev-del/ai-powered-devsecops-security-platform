from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.database.models import ScanHistory

from backend.auth.dependencies import get_current_user

from backend.utils.audit_logger import create_audit_log


router = APIRouter(
    prefix="/api/v1/ai",
    tags=["AI Summary"]
)


@router.get("/summary")
def ai_summary(

    db: Session = Depends(get_db),

    user=Depends(get_current_user)

):

    try:

        scans = (
            db.query(ScanHistory)
            .filter(ScanHistory.user_id == user["id"])
            .order_by(ScanHistory.id.desc())
            .all()
        )

        summaries = []

        safe = 0
        low = 0
        medium = 0
        high = 0

        total_issues = 0

        for scan in scans:

            total_issues += scan.issues

            risk = scan.risk_level.lower()

            if risk == "safe":

                safe += 1

                summary = (
                    "No security vulnerabilities were detected."
                )

                recommendation = (
                    "Continue following secure coding practices."
                )

            elif risk == "low":

                low += 1

                summary = (
                    "Minor security issues detected."
                )

                recommendation = (
                    "Review the code and improve security."
                )

            elif risk == "medium":

                medium += 1

                summary = (
                    "Moderate vulnerabilities found."
                )

                recommendation = (
                    "Fix insecure coding practices before deployment."
                )

            else:

                high += 1

                summary = (
                    "Critical vulnerabilities detected."
                )

                recommendation = (
                    "Resolve all vulnerabilities immediately."
                )

            summaries.append({

                "filename": scan.filename,

                "risk_level": scan.risk_level,

                "issues": scan.issues,

                "summary": summary,

                "recommendation": recommendation,

                "scan_time": scan.scan_time

            })

        overall_summary = (

            f"AI analyzed {len(scans)} scan(s). "

            f"Detected {high} High, "

            f"{medium} Medium, "

            f"{low} Low and "

            f"{safe} Safe files. "

            f"Total issues identified: {total_issues}."

        )

        if high > 0:

            overall_recommendation = (

                "Immediate remediation is recommended before deployment."

            )

        elif medium > 0:

            overall_recommendation = (

                "Fix medium-risk issues to strengthen application security."

            )

        elif low > 0:

            overall_recommendation = (

                "Minor improvements are recommended."

            )

        else:

            overall_recommendation = (

                "Excellent! Your project currently appears secure."

            )

        # ==========================================
        # Audit Log
        # ==========================================

        create_audit_log(

            db,

            user["sub"],

            "AI Summary Generated",

            "Success"

        )

        return {

            "user": user["sub"],

            "overall_summary": overall_summary,

            "overall_recommendation": overall_recommendation,

            "statistics": {

                "total_reports": len(scans),

                "safe": safe,

                "low": low,

                "medium": medium,

                "high": high,

                "total_issues": total_issues

            },

            "results": summaries

        }

    except Exception:

        create_audit_log(

            db,

            user["sub"],

            "AI Summary Generated",

            "Failed"

        )

        raise
