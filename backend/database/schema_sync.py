"""
Automatic SQLite Schema Synchronization Helper.

Safely adds missing columns and indexes to existing SQLite database tables on startup
if the SQLite file was created prior to current model additions.
"""

from sqlalchemy.engine import Engine
import sqlite3
import logging

logger = logging.getLogger(__name__)


def sync_sqlite_schema(engine: Engine) -> None:
    """Check and synchronize missing columns in SQLite database tables."""
    if engine.name != "sqlite":
        return

    # Extract raw file path from SQLite engine URL
    db_path = engine.url.database
    if not db_path or db_path == ":memory:":
        return

    try:
        conn = sqlite3.connect(db_path)
        c = conn.cursor()

        # 1. Sync users table
        c.execute("PRAGMA table_info(users)")
        users_cols = [col[1] for col in c.fetchall()]
        if users_cols:
            if "email" not in users_cols:
                logger.info("Migrating SQLite users table: adding email column")
                c.execute("ALTER TABLE users ADD COLUMN email VARCHAR")
                c.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email ON users (email)")

            if "is_active" not in users_cols:
                logger.info("Migrating SQLite users table: adding is_active column")
                c.execute("ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT 1")

            if "updated_at" not in users_cols:
                logger.info("Migrating SQLite users table: adding updated_at column")
                c.execute("ALTER TABLE users ADD COLUMN updated_at DATETIME")

        # 2. Sync scan_history table
        c.execute("PRAGMA table_info(scan_history)")
        scan_cols = [col[1] for col in c.fetchall()]
        if scan_cols and "user_id" not in scan_cols:
            logger.info("Migrating SQLite scan_history table: adding user_id column")
            c.execute("ALTER TABLE scan_history ADD COLUMN user_id INTEGER")
            c.execute("CREATE INDEX IF NOT EXISTS ix_scan_history_user_id ON scan_history (user_id)")

        # 3. Sync email_history table
        c.execute("PRAGMA table_info(email_history)")
        email_cols = [col[1] for col in c.fetchall()]
        if email_cols and "user_id" not in email_cols:
            logger.info("Migrating SQLite email_history table: adding user_id column")
            c.execute("ALTER TABLE email_history ADD COLUMN user_id INTEGER")
            c.execute("CREATE INDEX IF NOT EXISTS ix_email_history_user_id ON email_history (user_id)")

        # 4. Sync audit_logs table
        c.execute("PRAGMA table_info(audit_logs)")
        audit_cols = [col[1] for col in c.fetchall()]
        if audit_cols and "user_id" not in audit_cols:
            logger.info("Migrating SQLite audit_logs table: adding user_id column")
            c.execute("ALTER TABLE audit_logs ADD COLUMN user_id INTEGER")
            c.execute("CREATE INDEX IF NOT EXISTS ix_audit_logs_user_id ON audit_logs (user_id)")

        conn.commit()
        conn.close()
    except Exception as e:
        logger.warning(f"SQLite schema sync note: {e}")
