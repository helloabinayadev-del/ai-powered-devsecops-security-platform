import os
import smtplib
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email import encoders
from datetime import datetime, timezone
import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import EmailStr

from backend.auth.dependencies import get_current_user
from backend.auth.roles import admin_required
from backend.database.database import get_db
from backend.database.models import EmailHistory, ScanHistory
from backend.config import REPORTS_FOLDER
from backend.utils.audit_logger import create_audit_log

from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/email",
    tags=["Email"]
)


def _report_path(filename: str) -> str:
    if not filename or os.path.basename(filename) != filename or not filename.endswith(".json"):
        raise HTTPException(status_code=400, detail="Invalid report filename")
    return os.path.join(REPORTS_FOLDER, filename)


def reload_env():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    root_dir = os.path.dirname(base_dir)
    load_dotenv(os.path.join(base_dir, ".env"))
    load_dotenv(os.path.join(root_dir, ".env"))
    load_dotenv()


def check_email_config() -> dict:
    """Check email configuration status."""
    reload_env()
    email_address = os.getenv("EMAIL_ADDRESS")
    email_password = os.getenv("EMAIL_PASSWORD")

    email_smtp_server = os.getenv("EMAIL_SMTP_SERVER", os.getenv("EMAIL_HOST", "smtp.gmail.com"))
    email_smtp_port = os.getenv("EMAIL_SMTP_PORT", os.getenv("EMAIL_PORT", "587"))
    
    logger.info(f"=== Email Configuration Check ===")
    logger.info(f"SMTP Server: {email_smtp_server}")
    logger.info(f"SMTP Port: {email_smtp_port}")
    logger.info(f"Email Address: {email_address}")
    logger.info(f"Email Password Loaded: {'Yes' if email_password else 'No'}")
    
    if not email_address or not email_password:
        logger.warning("Email credentials not configured")
        return {
            "status": "not_configured",
            "message": "Email credentials not configured in environment variables",
            "smtp_server": email_smtp_server,
            "smtp_port": email_smtp_port
        }
    
    logger.info("Email credentials configured successfully")
    return {
        "status": "configured",
        "message": "Email credentials configured",
        "email_address": email_address,
        "smtp_server": email_smtp_server,
        "smtp_port": email_smtp_port
    }


def test_smtp_connection() -> dict:
    """Test SMTP connection."""
    logger.info("=== Testing SMTP Connection ===")
    config = check_email_config()
    if config["status"] == "not_configured":
        logger.warning("Cannot test connection - credentials not configured")
        return config
    
    try:
        email_smtp_server = os.getenv("EMAIL_SMTP_SERVER", os.getenv("EMAIL_HOST", "smtp.gmail.com"))
        email_smtp_port = int(os.getenv("EMAIL_SMTP_PORT", os.getenv("EMAIL_PORT", "587")))
        email_address = os.getenv("EMAIL_ADDRESS")
        
        logger.info(f"Connecting to {email_smtp_server}:{email_smtp_port}")
        
        with smtplib.SMTP(email_smtp_server, email_smtp_port, timeout=10) as server:
            logger.info("SMTP connection established")
            logger.info("Starting TLS encryption")
            server.starttls()
            logger.info("TLS started successfully")
            logger.info(f"Authenticating as {email_address}")
            server.login(email_address, os.getenv("EMAIL_PASSWORD"))
            logger.info("Authentication successful")
        
        logger.info("=== SMTP Connection Test: SUCCESS ===")
        return {
            "status": "connected",
            "message": "SMTP connection successful",
            "smtp_server": email_smtp_server,
            "smtp_port": email_smtp_port
        }
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP Authentication Failed: {str(e)}")
        logger.error("Possible causes: Wrong password, need App Password, 2FA enabled")
        return {
            "status": "auth_failed",
            "message": "SMTP authentication failed - check credentials",
            "smtp_server": email_smtp_server,
            "error": str(e)
        }
    except smtplib.SMTPException as e:
        logger.error(f"SMTP Error: {str(e)}")
        return {
            "status": "smtp_error",
            "message": f"SMTP error: {str(e)}",
            "smtp_server": email_smtp_server,
            "error": str(e)
        }
    except Exception as e:
        logger.error(f"SMTP connection error: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        return {
            "status": "connection_failed",
            "message": f"SMTP connection failed: {str(e)}",
            "smtp_server": email_smtp_server,
            "error": str(e)
        }


@router.get("/status")
def get_email_status(
    user=Depends(get_current_user)
):
    """Get email service status."""
    config = check_email_config()
    if config["status"] == "not_configured":
        return config
    
    # Test connection
    connection_status = test_smtp_connection()
    return connection_status


@router.get("/test-connection")
def test_email_connection(user=Depends(admin_required)):
    """Test SMTP connectivity for an authorized administrator."""
    logger.info("=== Test Email Connection Endpoint Called ===")
    config = check_email_config()
    if config["status"] == "not_configured":
        return config
    
    connection_status = test_smtp_connection()
    return connection_status


@router.post("/send")
def send_report(
    receiver_email: EmailStr,
    filename: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """Send security report via email with attachment support."""
    logger.info("=== Email Send Request ===")
    logger.info(f"Receiver: {receiver_email}")
    logger.info(f"Report Filename: {filename}")
    logger.info(f"Sent by: {user['sub']}")

    base_name = os.path.splitext(filename)[0]
    scan = db.query(ScanHistory).filter(
        (ScanHistory.report_name == filename) |
        (ScanHistory.report_name == base_name + ".json")
    ).first()

    if not scan or (scan.user_id != user["id"] and user["role"].upper() != "ADMIN"):
        return JSONResponse(
            status_code=404,
            content={
                "success": False,
                "message": "Report not found."
            }
        )

    try:
        reload_env()
        email_address = os.getenv("EMAIL_ADDRESS")
        email_password = os.getenv("EMAIL_PASSWORD")
        email_smtp_server = os.getenv("EMAIL_SMTP_SERVER", os.getenv("EMAIL_HOST", "smtp.gmail.com"))
        email_smtp_port = int(os.getenv("EMAIL_SMTP_PORT", os.getenv("EMAIL_PORT", "587")))

        
        logger.info(f"SMTP Server: {email_smtp_server}:{email_smtp_port}")
        logger.info(f"Sender: {email_address}")
        logger.info(f"Password Loaded: {'Yes' if email_password else 'No'}")
        
        if not email_address or not email_password:
            logger.warning("Email credentials not configured")
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": "Email credentials are not configured."
                }
            )
        
        report_path = _report_path(filename)
        logger.info(f"Report path: {report_path}")
        
        if not os.path.exists(report_path):
            logger.warning(f"Report not found: {report_path}")
            return JSONResponse(
                status_code=404,
                content={
                    "success": False,
                    "message": "Report not found."
                }
            )
        
        logger.info(f"Report file exists, size: {os.path.getsize(report_path)} bytes")
        
        # Create multipart message
        message = MIMEMultipart()
        message["Subject"] = "AI-Powered DevSecOps Security Report"
        message["From"] = email_address
        message["To"] = receiver_email
        
        # Email body
        body = f"""
Hello,

Your AI-Powered DevSecOps Security Report has been generated.

Generated By: {user["sub"]}
Attached Report: {filename}

Please review the report.

Regards,
AI-Powered DevSecOps Security Platform
"""
        message.attach(MIMEText(body, "plain"))
        
        # Attach file
        logger.info("Attaching report file...")
        with open(report_path, "rb") as report:
            part = MIMEBase("application", "octet-stream")
            part.set_payload(report.read())
            encoders.encode_base64(part)
            part.add_header(
                "Content-Disposition",
                f"attachment; filename= {filename}"
            )
            message.attach(part)
        
        logger.info("File attached successfully")
        
        # Send email
        logger.info(f"Connecting to SMTP server {email_smtp_server}:{email_smtp_port}")
        with smtplib.SMTP(email_smtp_server, email_smtp_port, timeout=30) as smtp:
            logger.info("SMTP connection established")
            logger.info("Starting TLS...")
            smtp.starttls()
            logger.info("TLS started successfully")
            logger.info(f"Authenticating as {email_address}")
            smtp.login(email_address, email_password)
            logger.info("Authentication successful")
            logger.info(f"Sending email to {receiver_email}")
            smtp.send_message(message)
            logger.info("Email sent successfully via SMTP")
        
        logger.info("=== Email Send: SUCCESS ===")
        
        # Save email history
        history = EmailHistory(
            user_id=user["id"],
            receiver=receiver_email,
            report_name=filename,
            sent_by=user["sub"],
            sent_time=datetime.now(timezone.utc)
        )

        db.add(history)
        db.commit()
        logger.info("Email history saved to database")
        
        # Audit log
        create_audit_log(db, user["sub"], "Email Report Sent", "Success")
        logger.info("Audit log created")
        
        return {
            "success": True,
            "message": "Security report emailed successfully.",
            "receiver": receiver_email,
            "report": filename,
            "sent_by": user["sub"]
        }
        
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP Authentication Failed: {str(e)}")
        logger.error("Possible causes: Wrong password, need App Password, 2FA enabled")
        create_audit_log(db, user["sub"], "Email Report Sent", "Failed")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "SMTP authentication failed. Check your email credentials.",
                "error": "SMTP authentication failed"
            }
        )
    except smtplib.SMTPException as e:
        logger.error(f"SMTP Error: {str(e)}")
        create_audit_log(db, user["sub"], "Email Report Sent", "Failed")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "SMTP error occurred.",
                "error": "SMTP operation failed"
            }
        )
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        logger.error(f"Full traceback:", exc_info=True)
        create_audit_log(db, user["sub"], "Email Report Sent", "Failed")
        
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Failed to send email.",
                "error": "Internal email delivery error"
            }
        )


@router.get("/history")
def email_history(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """Get email history."""
    history = (
        db.query(EmailHistory)
        .filter(EmailHistory.user_id == user["id"])
        .order_by(EmailHistory.id.desc())
        .limit(50)
        .all()
    )
    
    res = []
    for h in history:
        raw_time = h.sent_time.isoformat() if h.sent_time else None
        formatted_time = h.sent_time.strftime("%d %b %Y %I:%M %p UTC") if h.sent_time else "N/A"
        res.append({
            "id": h.id,
            "receiver": h.receiver,
            "report_name": h.report_name,
            "sent_by": h.sent_by,
            "sent_time": raw_time,
            "sent_at": raw_time,
            "formatted_sent_time": formatted_time
        })
    return res
