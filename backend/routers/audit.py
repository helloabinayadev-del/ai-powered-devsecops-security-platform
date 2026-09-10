from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

from backend.database.database import get_db

from backend.database.models import AuditLog

from backend.auth.roles import admin_required


router = APIRouter(

    prefix="/api/v1/audit",

    tags=["Audit"]

)


# =====================================================
# Get All Audit Logs
# =====================================================

@router.get("/")
def get_audit_logs(

    db: Session = Depends(get_db),

    user=Depends(admin_required)

):

    logs = (

        db.query(AuditLog)

        .order_by(AuditLog.id.desc())

        .all()

    )

    return logs


# =====================================================
# Dashboard Audit Summary
# =====================================================

@router.get("/summary")
def audit_summary(

    db: Session = Depends(get_db),

    user=Depends(admin_required)

):

    logs = db.query(AuditLog).all()

    total_logs = len(logs)

    success = 0

    failed = 0

    actions = {}

    for log in logs:

        if log.status == "Success":

            success += 1

        else:

            failed += 1

        if log.action not in actions:

            actions[log.action] = 0

        actions[log.action] += 1

    return {

        "total_logs": total_logs,

        "successful_actions": success,

        "failed_actions": failed,

        "actions": actions

    }
