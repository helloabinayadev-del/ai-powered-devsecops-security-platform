from sqlalchemy import Column, Integer, String, DateTime, Float, Text, ForeignKey, Boolean
from datetime import datetime, timezone

from backend.database.database import Base


# =====================================================
# User
# =====================================================

class User(Base):

    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    username = Column(
        String,
        unique=True,
        nullable=False
    )

    email = Column(
        String,
        unique=True,
        nullable=True,
        index=True
    )

    password = Column(
        String,
        nullable=False
    )

    role = Column(
        String,
        default="user"
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc)
    )

    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )


# =====================================================
# Scan History
# =====================================================

class ScanHistory(Base):

    __tablename__ = "scan_history"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
        index=True
    )

    filename = Column(
        String,
        nullable=False
    )

    status = Column(
        String,
        default="Completed"
    )

    report_name = Column(
        String,
        nullable=True
    )

    risk_level = Column(
        String,
        nullable=False
    )

    issues = Column(
        Integer,
        default=0
    )

    scan_time = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc)
    )


# =====================================================
# Email History
# =====================================================

class EmailHistory(Base):

    __tablename__ = "email_history"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
        index=True
    )

    receiver = Column(
        String,
        nullable=False
    )

    report_name = Column(
        String,
        nullable=False
    )

    sent_by = Column(
        String,
        nullable=False
    )

    sent_time = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc)
    )


# =====================================================
# Audit Logs
# =====================================================

class AuditLog(Base):

    __tablename__ = "audit_logs"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
        index=True
    )

    username = Column(
        String,
        nullable=False
    )

    action = Column(
        String,
        nullable=False
    )

    status = Column(
        String,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc)
    )


# =====================================================
# AI Analysis (Phase 3)
# =====================================================

class AIAnalysis(Base):

    __tablename__ = "ai_analysis"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    scan_id = Column(
        Integer,
        ForeignKey("scan_history.id"),
        nullable=False,
        index=True
    )

    vulnerability_id = Column(
        String,
        nullable=False
    )

    explanation = Column(
        Text,
        nullable=False
    )

    recommendation = Column(
        Text,
        nullable=False
    )

    risk_score = Column(
        Float,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc)
    )


# =====================================================
# Risk History (Phase 3)
# =====================================================

class RiskHistory(Base):

    __tablename__ = "risk_history"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    scan_id = Column(
        Integer,
        ForeignKey("scan_history.id"),
        nullable=False,
        index=True
    )

    score = Column(
        Float,
        nullable=False
    )

    risk_level = Column(
        String,
        nullable=False
    )

    explanation = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc)
    )
