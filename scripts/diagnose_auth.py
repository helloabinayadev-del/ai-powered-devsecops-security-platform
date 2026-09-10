import sys
sys.path.insert(0, 'c:/Users/Hello/ai-devsecops-platform')

from backend.database.database import engine, SessionLocal
from backend.database.models import User
from backend.auth.password import hash_password, verify_password
from sqlalchemy import inspect

print("=== DATABASE CONNECTION DIAGNOSTIC ===")
print(f"Database URL: {engine.url}")
print(f"Database Type: {engine.dialect.name}")

# Check tables
inspector = inspect(engine)
tables = inspector.get_table_names()
print(f"\nTables in database: {tables}")

db = SessionLocal()

# Check users table
if 'users' in tables:
    users = db.query(User).all()
    print(f"\n=== USERS TABLE ANALYSIS ===")
    print(f"Total users: {len(users)}")
    
    for user in users:
        print(f"\n--- User: {user.username} ---")
        print(f"Role: {user.role}")
        print(f"Password hash: {user.password}")
        print(f"Created at: {user.created_at}")
        
        # Test password verification with multiple passwords
        test_passwords = ["Admin@123", "admin123", "admin", "password"]
        print(f"\nPassword verification tests:")
        for pwd in test_passwords:
            result = verify_password(pwd, user.password)
            print(f"  '{pwd}': {'✅ VALID' if result else '❌ INVALID'}")
else:
    print("\n❌ 'users' table does NOT exist in database")
    print("Creating admin user...")
    admin = User(
        username="admin",
        password=hash_password("Admin@123"),
        role="Admin"
    )
    db.add(admin)
    db.commit()
    print("✅ Admin user created with password 'Admin@123'")

# Check if admin exists
admin_user = db.query(User).filter(User.username == "admin").first()
print(f"\n=== ADMIN USER CHECK ===")
print(f"Admin user exists: {'✅ Yes' if admin_user else '❌ No'}")

if admin_user:
    # Test the exact password
    print(f"Testing password 'Admin@123': {'✅ VALID' if verify_password('Admin@123', admin_user.password) else '❌ INVALID'}")
    
    # If invalid, update the password
    if not verify_password('Admin@123', admin_user.password):
        print(f"\nUpdating admin password to 'Admin@123'...")
        admin_user.password = hash_password("Admin@123")
        db.commit()
        print(f"✅ Password updated")
        print(f"Verification after update: {'✅ VALID' if verify_password('Admin@123', admin_user.password) else '❌ INVALID'}")

db.close()

print("\n=== DIAGNOSTIC COMPLETE ===")
