from fastapi import Depends, HTTPException

from backend.auth.dependencies import get_current_user


def admin_required(
    user=Depends(get_current_user)
):

    if user["role"].lower() != "admin":

        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    return user
