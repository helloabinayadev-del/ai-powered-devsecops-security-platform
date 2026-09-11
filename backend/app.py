from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
import os

from backend.database.database import Base, engine, SessionLocal
from backend.database.models import User
from backend.auth.password import hash_password
from backend.middleware.error_handler import (
    global_exception_handler,
    http_exception_handler,
    validation_exception_handler,
    database_exception_handler,
)

# =====================================================
# Create Database Tables
# =====================================================

Base.metadata.create_all(bind=engine)

# =====================================================
# Create Default Admin User on Startup
# =====================================================

def create_default_admin():
    """Ensure a primary administrator exists in the database."""
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            username = os.getenv("BOOTSTRAP_ADMIN_USERNAME", "admin")
            password = os.getenv("BOOTSTRAP_ADMIN_PASSWORD", "admin123")
            print(f"Creating default admin user ({username})...")
            admin = User(
                username=username,
                email="admin@devsecops.local",
                password=hash_password(password),
                role="ADMIN",
                is_active=True
            )
            db.add(admin)
            db.commit()
            print("[+] Default admin user created successfully!")
        else:
            if admin.role.upper() != "ADMIN":
                admin.role = "ADMIN"
                db.commit()
            print("[+] Admin user already exists")
    except Exception as e:
        print(f"[-] Error creating default admin user: {str(e)}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_default_admin()
    print("====================================")
    print("AI-Powered DevSecOps Security Platform Started")
    print("Swagger Docs : http://127.0.0.1:8000/docs")
    print("====================================")
    yield


# =====================================================
# FastAPI App
# =====================================================

app = FastAPI(
    title="AI-Powered DevSecOps Security Platform",
    description=(
        "AI-Powered DevSecOps Security Platform. "
        "Provides vulnerability scanning (Bandit), AI vulnerability analysis, "
        "security assistant, intelligent risk scoring, and AI report generation."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# =====================================================
# CORS Configuration
# =====================================================

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:5175,http://127.0.0.1:5175,http://localhost,http://127.0.0.1"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    path = request.url.path
    if path in ["/docs", "/redoc", "/openapi.json"] or path.startswith("/docs/"):
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "img-src 'self' data: blob: https://fastapi.tiangolo.com https://cdn.jsdelivr.net; "
            "font-src 'self' data: https://cdn.jsdelivr.net; "
            "connect-src 'self' ws: wss: http: https:;"
        )
    else:
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: blob:; "
            "font-src 'self' data:; "
            "connect-src 'self' ws: wss: http: https:;"
        )
    return response

# =====================================================
# Global Exception Handlers
# =====================================================

app.add_exception_handler(Exception, global_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, database_exception_handler)

# =====================================================
# Routers
# =====================================================

from backend.routers import (
    root,
    home,
    health,
    auth,
    upload,
    files,
    dashboard,
    history,
    statistics,
    reports,
    analytics,
    ai_summary,
    ai_analysis,
    ai_risk,
    ai_reports,
    security_assistant,
    email,
    audit,
    admin,
)

# =====================================================
# Register Routers
# =====================================================

app.include_router(root.router)
app.include_router(home.router)
app.include_router(health.router)
app.include_router(health.simple_router)  # Simple health check for Docker
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(upload.router)
app.include_router(files.router)
app.include_router(dashboard.router)
app.include_router(history.router)
app.include_router(statistics.router)
app.include_router(reports.router)
app.include_router(analytics.router)
app.include_router(ai_summary.router)
app.include_router(ai_analysis.router)
app.include_router(ai_risk.router)
app.include_router(ai_reports.router)
app.include_router(security_assistant.router)
app.include_router(email.router)
app.include_router(audit.router)


