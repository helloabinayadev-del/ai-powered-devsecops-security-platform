from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Get database URL from environment or use SQLite default
DATABASE_TYPE = os.getenv("DATABASE_TYPE", "").lower()
DATABASE_URL = os.getenv("DATABASE_URL", "")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if DATABASE_TYPE == "postgresql" or DATABASE_URL.startswith("postgresql://"):
    if not DATABASE_URL:
        DATABASE_URL = "postgresql://ai_devsecops:ai_devsecops@localhost:5432/ai_devsecops"
    engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_size=10, max_overflow=20)
else:
    if not DATABASE_URL:
        DATABASE_URL = "sqlite:///./ai_devsecops.db"
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


from backend.database import models
from backend.database.schema_sync import sync_sqlite_schema

sync_sqlite_schema(engine)
Base.metadata.create_all(bind=engine)
