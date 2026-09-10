from fastapi import APIRouter, UploadFile, File, Depends, BackgroundTasks, Request, HTTPException
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.upload_service import process_upload
from backend.auth.dependencies import get_current_user
from backend.utils.audit_logger import create_audit_log
from backend.middleware.rate_limiter import check_rate_limit

router = APIRouter(
    prefix="/api/v1/upload",
    tags=["Upload"]
)


@router.post("/")
async def upload_file(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    # Apply rate limiting to upload endpoint (20 requests per minute)
    if not check_rate_limit(request, limit=20):
        raise HTTPException(
            status_code=429,
            detail="Upload rate limit exceeded. Please try again later."
        )

    try:
        result = process_upload(
            file=file,
            background_tasks=background_tasks,
            db=db,
            user_id=user["id"]
        )

        if result["success"]:
            result["uploaded_by"] = user["sub"]
            create_audit_log(
                db,
                user["sub"],
                "File Uploaded",
                "Success"
            )
            create_audit_log(
                db,
                user["sub"],
                "Security Scan",
                "Success"
            )
        else:
            create_audit_log(
                db,
                user["sub"],
                "File Uploaded",
                "Failed"
            )

        return result

    except Exception:
        create_audit_log(
            db,
            user["sub"],
            "File Uploaded",
            "Failed"
        )
        create_audit_log(
            db,
            user["sub"],
            "Security Scan",
            "Failed"
        )
        raise

