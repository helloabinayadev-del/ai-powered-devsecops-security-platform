from fastapi import UploadFile, BackgroundTasks
from sqlalchemy.orm import Session
import shutil
import os

from backend.logger import logger
from backend.scanner import scan_python_file
from backend.config import UPLOAD_FOLDER
from backend.database.models import ScanHistory


# =====================================================
# Background Task
# =====================================================

def save_scan_log(filename: str):
    logger.info(f"Background Task Completed for {filename}")


# =====================================================
# Upload Processing Service
# =====================================================

def process_upload(
    file: UploadFile,
    background_tasks: BackgroundTasks,
    db: Session
):

    # ------------------------------
    # Validate filename
    # ------------------------------

    if file.filename is None or file.filename.strip() == "":
        return {
            "success": False,
            "message": "Filename is missing."
        }

    # ------------------------------
    # Allow only Python files
    # ------------------------------

    if not file.filename.endswith(".py"):
        return {
            "success": False,
            "message": "Only Python (.py) files are allowed."
        }

    # ------------------------------
    # Create uploads folder
    # ------------------------------

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    file_path = os.path.join(
        UPLOAD_FOLDER,
        file.filename
    )

    # ------------------------------
    # Save uploaded file
    # ------------------------------

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # ------------------------------
    # Check empty file
    # ------------------------------

    if os.path.getsize(file_path) == 0:

        os.remove(file_path)

        return {
            "success": False,
            "message": "Uploaded file is empty."
        }

    logger.info(f"File uploaded: {file.filename}")

    # ------------------------------
    # Scan file
    # ------------------------------

    result = scan_python_file(file_path)

    risk_level = result["status"]

    history = ScanHistory(
        filename=result["filename"],
        status="Completed",
        report_name=os.path.basename(result["json_report"]),
        issues=result["issues_found"],
        risk_level=risk_level
    )

    db.add(history)
    db.commit()
    db.refresh(history)

    background_tasks.add_task(
        save_scan_log,
        file.filename
    )

    return {
        "success": True,
        "message": "File scanned successfully",
        "filename": result["filename"],
        "status": "Completed",
        "issues": result["issues_found"],
        "risk_level": risk_level,
        "report_name": history.report_name,
        "scan_result": result
    }
