from fastapi import APIRouter
from datetime import datetime
import platform
import os
import psutil
import time
from sqlalchemy import text
from backend.database.database import get_db
from backend.config import AI_ENABLED, UPLOAD_FOLDER, REPORTS_FOLDER, LOG_FOLDER

router = APIRouter(
    prefix="/api/v1/health",
    tags=["Health"]
)


def get_service_status(service_name: str, check_func) -> dict:
    """Helper function to check service status."""
    try:
        result = check_func()
        if result:
            return {"name": service_name, "status": "healthy", "color": "green", "message": "Operational"}
        else:
            return {"name": service_name, "status": "critical", "color": "red", "message": "Service unavailable"}
    except Exception as e:
        return {"name": service_name, "status": "warning", "color": "yellow", "message": str(e)}


def check_database():
    """Check database connectivity."""
    try:
        from backend.database.database import engine
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


def check_uploads():
    """Check uploads folder."""
    return os.path.exists(UPLOAD_FOLDER) and os.access(UPLOAD_FOLDER, os.W_OK)


def check_reports():
    """Check reports folder."""
    return os.path.exists(REPORTS_FOLDER) and os.access(REPORTS_FOLDER, os.W_OK)


def check_logs():
    """Check logs folder."""
    return os.path.exists(LOG_FOLDER) and os.access(LOG_FOLDER, os.W_OK)


def check_ai_service():
    """Check AI service availability."""
    if not AI_ENABLED:
        return True  # AI disabled is not a health issue
    try:
        api_key = os.getenv("AI_API_KEY")
        return bool(api_key and api_key.strip())
    except Exception:
        return False


def scanner_available():
    """Check if Bandit scanner is available."""
    try:
        import subprocess
        result = subprocess.run(["bandit", "--version"], capture_output=True, timeout=5)
        return result.returncode == 0
    except Exception:
        return False


def check_email():
    """Check email service status."""
    email_address = os.getenv("EMAIL_ADDRESS")
    email_password = os.getenv("EMAIL_PASSWORD")
    return bool(email_address and email_password)


@router.get("/")
def health():
    """Detailed health check endpoint with system metrics."""
    
    # Get process start time for uptime calculation
    process = psutil.Process()
    start_time = process.create_time()
    uptime_seconds = time.time() - start_time
    
    # Format uptime
    days = int(uptime_seconds // 86400)
    hours = int((uptime_seconds % 86400) // 3600)
    minutes = int((uptime_seconds % 3600) // 60)
    uptime_str = f"{days}d {hours}h {minutes}m"
    
    # Memory usage
    memory_info = psutil.virtual_memory()
    memory_percent = memory_info.percent
    memory_used = memory_info.used / (1024 ** 3)  # GB
    memory_total = memory_info.total / (1024 ** 3)  # GB
    
    # CPU usage
    cpu_percent = psutil.cpu_percent(interval=1)
    
    # Disk usage
    disk_info = psutil.disk_usage('/')
    disk_percent = disk_info.percent
    disk_used = disk_info.used / (1024 ** 3)  # GB
    disk_total = disk_info.total / (1024 ** 3)  # GB
    
    # Check all services
    services = [
        get_service_status("backend API", lambda: True),
        get_service_status("Database", check_database),
        get_service_status("AI Services", check_ai_service),
        get_service_status("Scanner (Bandit)", scanner_available),
        get_service_status("Email Service", check_email),
        get_service_status("Authentication", lambda: True),
        get_service_status("Reports", check_reports),
        get_service_status("Upload Storage", check_uploads),
        get_service_status("Logs Storage", check_logs),
    ]
    
    # Determine overall status
    critical_count = sum(1 for s in services if s["status"] == "critical")
    warning_count = sum(1 for s in services if s["status"] == "warning")
    
    if critical_count > 0:
        overall_status = "critical"
    elif warning_count > 0:
        overall_status = "warning"
    else:
        overall_status = "healthy"
    
    return {
        "overall_status": overall_status,
        "message": f"AI-Powered DevSecOps Security Platform is {overall_status}",
        "application": {
            "name": "AI-Powered DevSecOps Security Platform",
            "version": "2.0.0",
            "environment": os.getenv("ENVIRONMENT", "development"),
            "server_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "uptime": uptime_str,
            "uptime_seconds": uptime_seconds,
        },
        "system": {
            "python_version": platform.python_version(),
            "operating_system": platform.system(),
            "os_version": platform.version(),
            "architecture": platform.machine(),
            "hostname": platform.node(),
            "cpu_percent": round(cpu_percent, 2),
            "memory_percent": round(memory_percent, 2),
            "memory_used_gb": round(memory_used, 2),
            "memory_total_gb": round(memory_total, 2),
            "disk_percent": round(disk_percent, 2),
            "disk_used_gb": round(disk_used, 2),
            "disk_total_gb": round(disk_total, 2),
        },
        "services": services,
        "configuration": {
            "database_type": os.getenv("DATABASE_TYPE", "sqlite"),
            "ai_enabled": AI_ENABLED,
            "ai_provider": os.getenv("AI_PROVIDER", "knowledge_base"),
            "max_file_size": os.getenv("MAX_FILE_SIZE", "5242880"),
            "rate_limit": os.getenv("RATE_LIMIT_PER_MINUTE", "60"),
        },
        "storage": {
            "uploads_folder": UPLOAD_FOLDER,
            "uploads_accessible": check_uploads(),
            "reports_folder": REPORTS_FOLDER,
            "reports_accessible": check_reports(),
            "logs_folder": LOG_FOLDER,
            "logs_accessible": check_logs(),
        }
    }


# Simple health check for Docker health checks
from fastapi import APIRouter as SimpleRouter

simple_router = SimpleRouter()


@simple_router.get("/health")
def simple_health():
    """Simple health check for Docker health checks."""
    return {"status": "healthy"}
