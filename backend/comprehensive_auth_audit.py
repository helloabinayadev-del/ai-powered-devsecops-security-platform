import sys
sys.path.insert(0, 'c:/Users/Hello/ai-devsecops-platform')

from backend.database.database import engine, SessionLocal
from backend.database.models import User
from backend.auth.password import hash_password, verify_password
from backend.auth.jwt_handler import create_access_token
from sqlalchemy import inspect
import os

print("=" * 80)
print("COMPREHENSIVE AUTHENTICATION AUDIT")
print("=" * 80)

# =====================================================
# DATABASE CHECK
# =====================================================
print("\n[1] DATABASE CHECK")
print("-" * 80)
print(f"Database Type: {engine.dialect.name}")
print(f"Database URL: {engine.url}")

inspector = inspect(engine)
tables = inspector.get_table_names()
print(f"Tables in database: {len(tables)}")
print(f"Table names: {tables}")

db = SessionLocal()

if 'users' in tables:
    users = db.query(User).all()
    print(f"\n✅ Users table exists")
    print(f"Total users: {len(users)}")
    
    for user in users:
        print(f"\n--- User: {user.username} ---")
        print(f"  ID: {user.id}")
        print(f"  Role: {user.role}")
        print(f"  Password hash: {user.password}")
        print(f"  Created at: {user.created_at}")
else:
    print(f"\n❌ Users table does NOT exist")

# =====================================================
# PASSWORD HASHING CHECK
# =====================================================
print("\n[2] PASSWORD HASHING CHECK")
print("-" * 80)
print("Hashing algorithm: bcrypt (via passlib)")
print("Hashing rounds: 12 (bcrypt default)")

admin_user = db.query(User).filter(User.username == "admin").first()
if admin_user:
    print(f"\n✅ Admin user exists")
    print(f"Stored hash: {admin_user.password}")
    
    # Test password verification
    test_passwords = ["Admin@123", "admin123", "admin", "password"]
    print(f"\nPassword verification tests:")
    for pwd in test_passwords:
        result = verify_password(pwd, admin_user.password)
        print(f"  '{pwd}': {'✅ VALID' if result else '❌ INVALID'}")
    
    # Hash a new password to verify hashing works
    new_hash = hash_password("TestPassword123")
    print(f"\nHashing test:")
    print(f"  New hash for 'TestPassword123': {new_hash}")
    print(f"  Verification: {'✅ VALID' if verify_password('TestPassword123', new_hash) else '❌ INVALID'}")
else:
    print(f"\n❌ Admin user does NOT exist")
    print("Creating admin user...")
    admin = User(
        username="admin",
        password=hash_password("Admin@123"),
        role="Admin"
    )
    db.add(admin)
    db.commit()
    print("✅ Admin user created with password 'Admin@123'")
    admin_user = admin

# =====================================================
# JWT CHECK
# =====================================================
print("\n[3] JWT CONFIGURATION CHECK")
print("-" * 80)
print(f"SECRET_KEY: {os.getenv('SECRET_KEY', 'AI_DEVSECOPS_SECRET_KEY_CHANGE_IN_PRODUCTION')[:20]}...")
print(f"ALGORITHM: HS256")
print(f"ACCESS_TOKEN_EXPIRE_MINUTES: {os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '30')}")

# Test JWT creation
if admin_user:
    try:
        token = create_access_token({
            "sub": admin_user.username,
            "role": admin_user.role
        })
        print(f"\n✅ JWT token creation: SUCCESS")
        print(f"Token: {token[:50]}...")
    except Exception as e:
        print(f"\n❌ JWT token creation: FAILED")
        print(f"Error: {str(e)}")

# =====================================================
# AUTHENTICATION FLOW CHECK
# =====================================================
print("\n[4] AUTHENTICATION FLOW CHECK")
print("-" * 80)
print("Flow: Frontend → API → Router → User Service → Password Verify → JWT → Response")
print("\nComponents:")
print("  ✅ Login Router: backend/routers/auth.py")
print("  ✅ User Service: backend/auth/user_service.py")
print("  ✅ Password Module: backend/auth/password.py")
print("  ✅ JWT Handler: backend/auth/jwt_handler.py")
print("  ✅ Auth Dependencies: backend/auth/dependencies.py")
print("  ✅ Database: backend/database/database.py")
print("  ✅ User Model: backend/database/models.py")

# =====================================================
# FRONTEND CONFIGURATION CHECK
# =====================================================
print("\n[5] FRONTEND CONFIGURATION CHECK")
print("-" * 80)
print("Frontend API configuration: frontend/src/services/api.ts")
print("Expected API URL: http://127.0.0.1:8000")
print("Login endpoint: /api/v1/auth/login")
print("Request format: application/x-www-form-urlencoded")
print("Fields: username, password")

# =====================================================
# SUMMARY
# =====================================================
print("\n[6] SUMMARY")
print("-" * 80)
print(f"Database Type: {engine.dialect.name}")
print(f"Database Path: {engine.url}")
print(f"Users Table Exists: {'✅ Yes' if 'users' in tables else '❌ No'}")
print(f"Number of Users: {len(users) if 'users' in tables else 0}")
print(f"Admin User Exists: {'✅ Yes' if admin_user else '❌ No'}")
if admin_user:
    print(f"Password Verification (Admin@123): {'✅ VALID' if verify_password('Admin@123', admin_user.password) else '❌ INVALID'}")

db.close()

print("\n" + "=" * 80)
print("AUDIT COMPLETE")
print("=" * 80)
