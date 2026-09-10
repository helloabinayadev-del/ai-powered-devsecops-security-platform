from typing import Optional
from sqlalchemy.orm import Session
from backend.database.models import AuditLog, User


def create_audit_log(
    db: Session,
    username: str,
    action: str,
    status: str,
    user_id: Optional[int] = None
):
    try:
        if user_id is None and username:
            user = db.query(User).filter(User.username == username).first()
            if user:
                user_id = user.id

        log = AuditLog(
            user_id=user_id,
            username=username,
            action=action,
            status=status
        )
        db.add(log)
        db.commit()
    except Exception:
        db.rollback()

