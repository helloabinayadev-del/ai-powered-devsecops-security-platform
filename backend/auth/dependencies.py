from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from backend.auth.jwt_handler import SECRET_KEY, ALGORITHM
from backend.database.database import get_db
from backend.database.models import User

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login"
)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> dict:
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        username = payload.get("sub")

        if username is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid Token"
            )

        # Lookup user in DB to verify existence and active status
        db_user = db.query(User).filter(User.username == username).first()
        if not db_user:
            raise HTTPException(
                status_code=401,
                detail="User not found"
            )

        if not db_user.is_active:
            raise HTTPException(
                status_code=401,
                detail="User account is inactive"
            )

        return {
            "id": db_user.id,
            "user_id": db_user.id,
            "sub": db_user.username,
            "username": db_user.username,
            "email": db_user.email,
            "role": db_user.role,
            "is_active": db_user.is_active
        }

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Could not validate credentials"
        )

