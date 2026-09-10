from fastapi import APIRouter

router = APIRouter(
    prefix="/api/v1",
    tags=["Home"]
)


# =====================================================
# Home API
# =====================================================

@router.get("/")
def home():

    return {
        "project": "AI-Powered DevSecOps Security Platform",
        "version": "1.0.0",
        "status": "Running",
        "message": "Welcome to the AI-Powered DevSecOps Security Platform API"
    }
