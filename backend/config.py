import os
from dotenv import load_dotenv

# Load .env from backend directory and root directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)

load_dotenv(os.path.join(BASE_DIR, ".env"))
load_dotenv(os.path.join(ROOT_DIR, ".env"))
load_dotenv()

# =====================================================
# Security Configuration
# =====================================================

ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()
DEFAULT_DEV_SECRET = "ai_devsecops_secure_jwt_secret_key_2026_prod_ready"

SECRET_KEY = os.getenv("SECRET_KEY", DEFAULT_DEV_SECRET)
if ENVIRONMENT == "production" and (not SECRET_KEY or SECRET_KEY == DEFAULT_DEV_SECRET):
    raise ValueError(
        "CRITICAL SECURITY ERROR: SECRET_KEY must be explicitly set to a strong random value in production mode."
    )

ALGORITHM = os.getenv("ALGORITHM", "HS256")

# =====================================================
# Base Folders
# =====================================================

# These locations must not depend on whether Uvicorn is started from the
# repository root or from ``backend/``.  The scanner, AI services, and report
# download router all use the same absolute locations.
UPLOAD_FOLDER = os.path.join(ROOT_DIR, "uploads")
REPORTS_FOLDER = os.path.join(ROOT_DIR, "reports")
LOG_FOLDER = os.path.join(ROOT_DIR, "logs")

# =====================================================
# Files
# =====================================================

HISTORY_FILE = os.path.join(REPORTS_FOLDER, "history.json")
LOG_FILE = os.path.join(LOG_FOLDER, "app.log")

# =====================================================
# AI Configuration
# =====================================================

AI_ENABLED = os.getenv("AI_ENABLED", "false").lower() == "true"
AI_PROVIDER = os.getenv("AI_PROVIDER", "knowledge_base")
AI_API_KEY = os.getenv("AI_API_KEY", "")
AI_API_BASE_URL = os.getenv(
    "AI_API_BASE_URL",
    "https://api.openai.com/v1",
)
AI_MODEL = os.getenv("AI_MODEL", "gpt-3.5-turbo")
AI_REQUEST_TIMEOUT = int(os.getenv("AI_REQUEST_TIMEOUT", "30"))

# =====================================================
# Upload Configuration
# =====================================================

MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", "5242880"))  # 5MB default

# =====================================================
# Rate Limiting
# =====================================================

RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))

# =====================================================
# Risk Scoring Weights
# =====================================================

SEVERITY_WEIGHTS = {
    "HIGH": 15,
    "MEDIUM": 8,
    "LOW": 3,
}

CONFIDENCE_MULTIPLIER = {
    "HIGH": 1.0,
    "MEDIUM": 0.75,
    "LOW": 0.5,
}

# =====================================================
# Create Required Folders Automatically
# =====================================================

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(REPORTS_FOLDER, exist_ok=True)
os.makedirs(LOG_FOLDER, exist_ok=True)
