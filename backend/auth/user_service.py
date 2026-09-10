from typing import Optional, List
from sqlalchemy.orm import Session
from backend.database.models import User
from backend.auth.password import hash_password


def get_user(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    if not email:
        return None
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def create_user(
    db: Session,
    username: str,
    password: str,
    email: Optional[str] = None,
    role: str = "USER",
    is_active: bool = True
) -> User:
    user = User(
        username=username.strip(),
        email=email.strip().lower() if email else None,
        password=hash_password(password),
        role=role.strip(),
        is_active=is_active
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def list_all_users(db: Session) -> List[User]:
    return db.query(User).order_by(User.id.asc()).all()


def update_user_status(db: Session, user_id: int, is_active: bool) -> Optional[User]:
    user = get_user_by_id(db, user_id)
    if user:
        user.is_active = is_active
        db.commit()
        db.refresh(user)
    return user


def update_user_role(db: Session, user_id: int, role: str) -> Optional[User]:
    user = get_user_by_id(db, user_id)
    if user:
        user.role = role
        db.commit()
        db.refresh(user)
    return user

