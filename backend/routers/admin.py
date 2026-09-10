from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.auth.roles import admin_required
from backend.auth.user_service import (
    list_all_users,
    get_user_by_id,
    update_user_status,
    update_user_role,
)
from backend.database.database import get_db
from backend.utils.audit_logger import create_audit_log

router = APIRouter(
    prefix="/api/v1/admin",
    tags=["Admin Management"],
)


class UserStatusUpdate(BaseModel):
    is_active: bool


class UserRoleUpdate(BaseModel):
    role: str


@router.get("/users")
def get_all_users(
    db: Session = Depends(get_db),
    admin_user=Depends(admin_required),
):
    users = list_all_users(db)
    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at,
            "updated_at": u.updated_at,
        }
        for u in users
    ]


@router.patch("/users/{user_id}/status")
def toggle_user_status(
    user_id: int,
    data: UserStatusUpdate,
    db: Session = Depends(get_db),
    admin_user=Depends(admin_required),
):
    target = get_user_by_id(db, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent admin from deactivating themselves
    if target.id == admin_user["id"] and not data.is_active:
        raise HTTPException(
            status_code=400,
            detail="Administrators cannot deactivate their own account"
        )

    updated = update_user_status(db, user_id, data.is_active)
    create_audit_log(
        db,
        admin_user["sub"],
        f"Updated status for user {target.username} to {'active' if data.is_active else 'inactive'}",
        "Success",
    )

    return {
        "message": f"User status updated to {'active' if data.is_active else 'inactive'}",
        "user": {
            "id": updated.id,
            "username": updated.username,
            "email": updated.email,
            "role": updated.role,
            "is_active": updated.is_active,
        },
    }


@router.patch("/users/{user_id}/role")
def change_user_role(
    user_id: int,
    data: UserRoleUpdate,
    db: Session = Depends(get_db),
    admin_user=Depends(admin_required),
):
    target = get_user_by_id(db, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    new_role = data.role.strip().upper()
    if new_role not in ["ADMIN", "USER"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be ADMIN or USER")

    if target.id == admin_user["id"] and new_role != "ADMIN":
        raise HTTPException(
            status_code=400,
            detail="Administrators cannot demote themselves"
        )

    updated = update_user_role(db, user_id, new_role)
    create_audit_log(
        db,
        admin_user["sub"],
        f"Changed role for user {target.username} to {new_role}",
        "Success",
    )

    return {
        "message": f"User role updated to {new_role}",
        "user": {
            "id": updated.id,
            "username": updated.username,
            "email": updated.email,
            "role": updated.role,
            "is_active": updated.is_active,
        },
    }
