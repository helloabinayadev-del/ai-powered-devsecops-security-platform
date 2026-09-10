from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import os
import platform

from backend.database.database import get_db
from backend.database.models import ScanHistory, AIAnalysis, RiskHistory
from backend.auth.dependencies import get_current_user
from backend.config import AI_ENABLED

router = APIRouter(
    prefix="/api/v1/dashboard",
    tags=["Dashboard"]
)


@router.get("/")
def dashboard(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    scans = db.query(ScanHistory).filter(ScanHistory.user_id == user["id"]).all()

    total = len(scans)

    safe = 0
    low = 0
    medium = 0
    high = 0
    critical = 0

    total_issues = 0

    recent_scans = []
    critical_vulnerabilities = []
    
    # Track top vulnerability types
    vulnerability_types = {}

    for scan in scans:

        total_issues += scan.issues

        if scan.risk_level == "Safe":
            safe += 1

        elif scan.risk_level == "Low":
            low += 1

        elif scan.risk_level == "Medium":
            medium += 1

        elif scan.risk_level == "High":
            high += 1
        
        elif scan.risk_level == "Critical":
            critical += 1

        recent_scans.append({
            "id": scan.id,
            "filename": scan.filename,
            "risk_level": scan.risk_level,
            "issues": scan.issues,
            "scan_time": scan.scan_time
        })
        
        # Track critical vulnerabilities
        if scan.risk_level in ["Critical", "High"]:
            critical_vulnerabilities.append({
                "id": scan.id,
                "filename": scan.filename,
                "risk_level": scan.risk_level,
                "issues": scan.issues,
                "scan_time": scan.scan_time
            })

    recent_scans = recent_scans[-10:]
    critical_vulnerabilities = critical_vulnerabilities[-5:]

    # Calculate security score
    if total == 0:
        security_score = 100
        risk_level = "Safe"
    else:
        # Weighted score calculation
        safe_weight = safe * 100
        low_weight = low * 75
        medium_weight = medium * 50
        high_weight = high * 25
        critical_weight = critical * 0
        
        security_score = round((safe_weight + low_weight + medium_weight + high_weight + critical_weight) / total, 2)
        
        if security_score >= 90:
            risk_level = "Safe"
        elif security_score >= 70:
            risk_level = "Low"
        elif security_score >= 50:
            risk_level = "Medium"
        elif security_score >= 30:
            risk_level = "High"
        else:
            risk_level = "Critical"

    # Get recent AI analysis
    recent_ai_analysis = (
        db.query(AIAnalysis)
        .join(ScanHistory, AIAnalysis.scan_id == ScanHistory.id)
        .filter(ScanHistory.user_id == user["id"])
        .order_by(AIAnalysis.created_at.desc())
        .limit(5)
        .all()
    )
    ai_analysis_data = [
        {
            "id": analysis.id,
            "scan_id": analysis.scan_id,
            "vulnerability_id": analysis.vulnerability_id,
            "created_at": analysis.created_at
        }
        for analysis in recent_ai_analysis
    ]

    # Get risk history for trends
    risk_history = (
        db.query(RiskHistory)
        .join(ScanHistory, RiskHistory.scan_id == ScanHistory.id)
        .filter(ScanHistory.user_id == user["id"])
        .order_by(RiskHistory.created_at.desc())
        .limit(7)
        .all()
    )
    risk_trend = [
        {
            "score": history.score,
            "risk_level": history.risk_level,
            "created_at": history.created_at
        }
        for history in reversed(risk_history)
    ]

    # Weekly scan trend
    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    week_ago = now_utc - timedelta(days=7)
    weekly_scans = (
        db.query(ScanHistory)
        .filter(ScanHistory.user_id == user["id"], ScanHistory.scan_time >= week_ago)
        .all()
    )
    weekly_trend = []
    
    for i in range(7):
        day = now_utc - timedelta(days=i)
        day_scans = [s for s in weekly_scans if s.scan_time.date() == day.date()]
        weekly_trend.append({
            "day": day.strftime("%a"),
            "scans": len(day_scans),
            "issues": sum(s.issues for s in day_scans)
        })
    
    weekly_trend = list(reversed(weekly_trend))

    # Monthly scan trend
    month_ago = now_utc - timedelta(days=30)
    monthly_scans = (
        db.query(ScanHistory)
        .filter(ScanHistory.user_id == user["id"], ScanHistory.scan_time >= month_ago)
        .all()
    )
    monthly_trend = []
    
    for i in range(4):
        week_start = now_utc - timedelta(weeks=i+1)
        week_end = now_utc - timedelta(weeks=i)
        week_scans = [s for s in monthly_scans if week_start <= s.scan_time < week_end]
        monthly_trend.append({
            "week": f"Week {4-i}",
            "scans": len(week_scans),
            "issues": sum(s.issues for s in week_scans)
        })

    
    monthly_trend = list(reversed(monthly_trend))

    # Activity timeline
    activity_timeline = []
    for scan in scans[-10:]:
        activity_timeline.append({
            "type": "scan",
            "message": f"Scanned {scan.filename}",
            "timestamp": scan.scan_time,
            "risk_level": scan.risk_level
        })

    # Latest reports
    latest_reports = [
        {
            "filename": scan.filename,
            "report_name": scan.report_name,
            "scan_time": scan.scan_time,
            "risk_level": scan.risk_level
        }
        for scan in scans[-5:] if scan.report_name
    ]

    return {
        "user": user["sub"],
        "security_score": security_score,
        "risk_level": risk_level,
        "summary": {
            "total_scans": total,
            "total_issues": total_issues,
            "safe_scans": safe,
            "risky_scans": total - safe
        },
        "risk_distribution": {
            "critical": critical,
            "high": high,
            "medium": medium,
            "low": low,
            "safe": safe
        },
        "severity_distribution": {
            "critical": critical,
            "high": high,
            "medium": medium,
            "low": low
        },
        "recent_scans": recent_scans,
        "critical_vulnerabilities": critical_vulnerabilities,
        "recent_ai_analysis": ai_analysis_data,
        "risk_trend": risk_trend,
        "weekly_scan_trend": weekly_trend,
        "monthly_scan_trend": monthly_trend,
        "activity_timeline": activity_timeline,
        "latest_reports": latest_reports,
        "ai_enabled": AI_ENABLED,
        "vulnerability_types": vulnerability_types
    }
