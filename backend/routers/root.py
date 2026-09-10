from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def root():
    return {
        "message": "AI-Powered DevSecOps Security Platform API Running"
    }
