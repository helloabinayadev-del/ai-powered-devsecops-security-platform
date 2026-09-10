import sys
sys.path.insert(0, 'c:/Users/Hello/ai-devsecops-platform')

from backend.database.database import SessionLocal, engine
from backend.database.models import User
from sqlalchemy import inspect

print("=== Database Connection Check ===")
print(f"Database URL: {engine.url}")

# Check if tables exist
inspector = inspect(engine)
tables = inspector.get_table_names()
print(f"Tables in database: {tables}")

db = SessionLocal()

# Check users table
if 'users' in tables:
    users = db.query(User).all()
    print(f"\n=== Users in database ===")
    print(f"Total users: {len(users)}")
    for user in users:
        print(f"  - Username: {user.username}")
        print(f"    Role: {user.role}")
        print(f"    Password hash: {user.password[:50]}...")
        print(f"    Created at: {user.created_at}")
else:
    print("\n❌ 'users' table does not exist in database")

db.close()
