from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from backend.auth.dependencies import get_current_user
from backend.database.database import get_db
from backend.schemas.ai_schemas import (
    SecurityAssistantRequest,
    SecurityAssistantResponse,
)
from backend.services.security_assistant import SecurityAssistant
from backend.utils.audit_logger import create_audit_log
from backend.middleware.rate_limiter import check_rate_limit

router = APIRouter(
    prefix="/api/v1/security-assistant",
    tags=["Security Assistant"],
)


@router.post(
    "/chat",
    response_model=SecurityAssistantResponse,
    summary="Ask the AI Security Assistant",
    description=(
        "Ask security questions about vulnerabilities, remediation, severity, "
        "or general security improvements. Supports optional conversation sessions "
        "and scan/vulnerability context."
    ),
)
def security_assistant_chat(
    request: Request,
    request_data: SecurityAssistantRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    # Apply rate limiting to AI assistant endpoint (30 requests per minute)
    if not check_rate_limit(request, limit=30):
        raise HTTPException(
            status_code=429,
            detail="AI assistant rate limit exceeded. Please try again later."
        )
    try:
        assistant = SecurityAssistant(db)
        result = assistant.chat(
            question=request_data.question,
            session_id=request_data.session_id,
            scan_id=request_data.scan_id,
            vulnerability_id=request_data.vulnerability_id,
        )

        create_audit_log(db, user["sub"], "Security Assistant Chat", "Success")
        return result

    except ValueError as exc:
        create_audit_log(db, user["sub"], "Security Assistant Chat", "Failed")
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        create_audit_log(db, user["sub"], "Security Assistant Chat", "Failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc
