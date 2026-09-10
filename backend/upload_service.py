from typing import Optional
from fastapi import UploadFile, BackgroundTasks
from sqlalchemy.orm import Session
from werkzeug.utils import secure_filename

import os

from backend.logger import logger
from backend.scanner import scan_python_file
from backend.config import UPLOAD_FOLDER, MAX_FILE_SIZE
from backend.database.models import ScanHistory
from backend.services.report_generator import ReportGenerator


def _save_upload_with_size_limit(file: UploadFile, destination: str) -> int:
    """Stream an upload to disk while enforcing the configured byte limit."""
    bytes_written = 0
    chunk_size = 1024 * 1024

    with open(destination, "wb") as buffer:
        while chunk := file.file.read(chunk_size):
            bytes_written += len(chunk)
            if bytes_written > MAX_FILE_SIZE:
                raise ValueError("FILE_TOO_LARGE")
            buffer.write(chunk)

    return bytes_written


# =====================================================
# Background Task
# =====================================================

def save_scan_log(filename: str):
    logger.info(
        f"Background Task Completed : {filename}"
    )


# =====================================================
# Upload Processing Service
# =====================================================

def process_upload(
    file: UploadFile,
    background_tasks: BackgroundTasks,
    db: Session,
    user_id: Optional[int] = None
):
    try:
        # ------------------------------------------
        # Validate filename
        # ------------------------------------------

        if file.filename is None or file.filename.strip() == "":
            return {
                "success": False,
                "message": "Filename is missing."
            }

        # ------------------------------------------
        # Allow only Python files
        # ------------------------------------------

        if not file.filename.lower().endswith(".py"):
            return {
                "success": False,
                "message": "Only Python (.py) files are allowed."
            }

        # ------------------------------------------
        # Secure filename
        # ------------------------------------------

        filename = secure_filename(file.filename)

        # ------------------------------------------
        # Create Upload Folder
        # ------------------------------------------

        os.makedirs(UPLOAD_FOLDER, exist_ok=True)

        file_path = os.path.join(UPLOAD_FOLDER, filename)

        # ------------------------------------------
        # Save uploaded file
        # ------------------------------------------

        try:
            file_size = _save_upload_with_size_limit(file, file_path)
        except ValueError as error:
            if os.path.exists(file_path):
                os.remove(file_path)
            if str(error) == "FILE_TOO_LARGE":
                return {
                    "success": False,
                    "message": f"File size exceeds {MAX_FILE_SIZE / (1024 * 1024):.0f} MB."
                }
            raise

        # ------------------------------------------
        # Empty file validation
        # ------------------------------------------

        if file_size == 0:
            os.remove(file_path)
            return {
                "success": False,
                "message": "Uploaded file is empty."
            }

        # ------------------------------------------
        # Log upload
        # ------------------------------------------

        logger.info(f"File Uploaded : {filename}")

        # ------------------------------------------
        # Scan File
        # ------------------------------------------

        result = scan_python_file(file_path)

        history = ScanHistory(
            user_id=user_id,
            filename=result["filename"],
            status="Completed",
            report_name=os.path.basename(result["json_report"]),
            issues=result["issues_found"],
            risk_level=result["status"]
        )

        db.add(history)
        db.commit()
        db.refresh(history)

        # A completed scan must have its AI analysis/report available to the
        # repository immediately. The report is stored in the scan JSON while
        # preserving Bandit's original ``results`` array.
        ReportGenerator(db).generate_report(history.id)

        # ------------------------------------------
        # Background Task
        # ------------------------------------------

        background_tasks.add_task(
            save_scan_log,
            filename
        )

        # ------------------------------------------
        # Response
        # ------------------------------------------

        return {
            "success": True,
            "message": "File scanned successfully.",
            "filename": result["filename"],
            "status": "Completed",
            "risk_level": result["status"],
            "issues": result["issues_found"],
            "report_name": history.report_name,
            "scan_time": result["scan_time"]
        }

    except Exception as e:
        logger.exception("Upload processing failed")
        return {
            "success": False,
            "message": "Unable to process the uploaded file."
        }
