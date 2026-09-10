from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import os

from backend.database.database import get_db
from backend.database.models import ScanHistory, AIAnalysis, RiskHistory
from backend.auth.dependencies import get_current_user
from backend.config import UPLOAD_FOLDER, REPORTS_FOLDER
from backend.utils.audit_logger import create_audit_log

router = APIRouter(
    prefix="/api/v1/files",
    tags=["Files"]
)


@router.get("/")
def list_files(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    scans = (
        db.query(ScanHistory)
        .filter(ScanHistory.user_id == user["id"])
        .order_by(ScanHistory.id.desc())
        .all()
    )

    files = []
    for scan in scans:
        files.append({
            "id": scan.id,
            "filename": scan.filename,
            "status": scan.status,
            "risk_level": scan.risk_level,
            "issues": scan.issues,
            "scan_time": scan.scan_time,
            "report_name": scan.report_name
        })

    return {
        "logged_in_user": user["sub"],
        "total_files": len(files),
        "files": files
    }


@router.delete("/{file_id}")
def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    # Get scan record from database
    scan = db.query(ScanHistory).filter(ScanHistory.id == file_id).first()
    
    if not scan or (scan.user_id != user["id"] and user["role"].upper() != "ADMIN"):
        raise HTTPException(status_code=404, detail="File not found")
    
    # Delete uploaded file
    uploaded_file_path = os.path.join(UPLOAD_FOLDER, scan.filename)
    if os.path.exists(uploaded_file_path):
        try:
            os.remove(uploaded_file_path)
        except Exception as e:
            print(f"Error deleting uploaded file: {e}")
    
    # Delete generated reports (JSON, TXT, PDF, HTML)
    if scan.report_name:
        base_name = os.path.splitext(scan.report_name)[0]
        for ext in ['.json', '.txt', '.pdf', '.html']:
            report_path = os.path.join(REPORTS_FOLDER, base_name + ext)
            if os.path.exists(report_path):
                try:
                    os.remove(report_path)
                except Exception as e:
                    print(f"Error deleting report {report_path}: {e}")
    
    # Delete associated AI Analysis and Risk History records
    try:
        db.query(AIAnalysis).filter(AIAnalysis.scan_id == file_id).delete()
        db.query(RiskHistory).filter(RiskHistory.scan_id == file_id).delete()
    except Exception as e:
        print(f"Error deleting child records: {e}")

    # Delete from database
    db.delete(scan)
    db.commit()
    
    # Log audit
    create_audit_log(
        db,
        user["sub"],
        f"File Deleted: {scan.filename}",
        "Success"
    )
    
    return {
        "message": "File deleted successfully",
        "filename": scan.filename
    }
