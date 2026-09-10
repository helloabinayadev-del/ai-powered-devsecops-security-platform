from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from backend.auth.jwt_handler import create_access_token, create_refresh_token
from backend.auth.password import verify_password, hash_password
from backend.auth.user_service import get_user, get_user_by_email, create_user
from backend.auth.dependencies import get_current_user
from backend.database.database import get_db
from backend.utils.audit_logger import create_audit_log
from backend.middleware.rate_limiter import check_rate_limit


router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Authentication"]
)


class RegisterSchema(BaseModel):
    username: str
    password: str
    email: Optional[str] = None


@router.post("/register")
def register(
    request: Request,
    data: RegisterSchema,
    db: Session = Depends(get_db)
):
    if not check_rate_limit(request, limit=10):
        raise HTTPException(
            status_code=429,
            detail="Too many registration attempts. Please try again later."
        )

    username = data.username.strip() if data.username else ""
    if not username:
        raise HTTPException(status_code=400, detail="Username is required")

    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")

    if get_user(db, username):
        raise HTTPException(status_code=400, detail="Username already exists")

    email = data.email.strip().lower() if data.email else None
    if email and get_user_by_email(db, email):
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = create_user(
        db=db,
        username=username,
        password=data.password,
        email=email,
        role="USER",
        is_active=True
    )

    access_token = create_access_token(
        {
            "sub": new_user.username,
            "role": new_user.role,
            "user_id": new_user.id
        }
    )
    refresh_token = create_refresh_token(
        {
            "sub": new_user.username,
            "role": new_user.role,
            "user_id": new_user.id
        }
    )

    create_audit_log(db, new_user.username, "User Registration", "Success")

    return {
        "message": "User registered successfully",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "role": new_user.role
        }
    }


@router.post("/login")
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # Apply rate limiting to login endpoint (10 requests per minute)
    if not check_rate_limit(request, limit=10):
        raise HTTPException(
            status_code=429,
            detail="Too many login attempts. Please try again later."
        )

    # Lookup user in database
    user = get_user(db, form_data.username)
    
    if not user:
        create_audit_log(
            db,
            form_data.username,
            "User Login",
            "Failed"
        )
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    if not user.is_active:
        create_audit_log(
            db,
            user.username,
            "User Login",
            "Failed - Inactive Account"
        )
        raise HTTPException(
            status_code=401,
            detail="User account is inactive"
        )
    
    # Verify password
    if not verify_password(form_data.password, user.password):
        create_audit_log(
            db,
            form_data.username,
            "User Login",
            "Failed"
        )
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    # Generate JWT tokens
    access_token = create_access_token(
        {
            "sub": user.username,
            "role": user.role,
            "user_id": user.id
        }
    )
    refresh_token = create_refresh_token(
        {
            "sub": user.username,
            "role": user.role,
            "user_id": user.id
        }
    )

    create_audit_log(
        db,
        user.username,
        "User Login",
        "Success"
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role
        }
    }


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return current_user


@router.post("/refresh")
def refresh_token_endpoint(
    body: dict,
    db: Session = Depends(get_db)
):
    refresh_tok = body.get("refresh_token")
    if not refresh_tok:
        raise HTTPException(status_code=400, detail="refresh_token is required")
    try:
        from backend.auth.jwt_handler import decode_token
        payload = decode_token(refresh_tok)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=400, detail="Invalid token type for refresh")
        username = payload.get("sub")
        role = payload.get("role")
        user = get_user(db, username)
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="User not found or inactive")
        
        new_access_token = create_access_token({"sub": username, "role": role, "user_id": user.id})
        new_refresh_token = create_refresh_token({"sub": username, "role": role, "user_id": user.id})
        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role
            }
        }
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")


@router.post("/change-password")
def change_password(
    body: dict,
    request: Request,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    username = current_user.get("sub")
    current_pw = body.get("current_password")
    new_pw = body.get("new_password")

    if not current_pw or not new_pw:
        raise HTTPException(status_code=400, detail="Current password and new password are required")

    if len(new_pw) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters long")

    user = get_user(db, username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(current_pw, user.password):
        create_audit_log(db, username, "Change Password", "Failed - Invalid current password")
        raise HTTPException(status_code=400, detail="Incorrect current password")

    user.password = hash_password(new_pw)
    db.commit()

    create_audit_log(db, username, "Change Password", "Success")

    return {"message": "Password changed successfully"}


