import sys
sys.path.insert(0, 'c:/Users/Hello/ai-devsecops-platform')

from backend.database.database import SessionLocal
from backend.database.models import User
from backend.auth.password import hash_password, verify_password

db = SessionLocal()

user = db.query(User).filter(User.username == "admin").first()

if user:
    print(f"=== Testing Password Verification ===")
    print(f"Username: {user.username}")
    print(f"Current hash: {user.password}")
    
    test_passwords = ["admin123", "Admin@123", "admin", "password"]
    for pwd in test_passwords:
        result = verify_password(pwd, user.password)
        print(f"Password '{pwd}': {'✅ Valid' if result else '❌ Invalid'}")
    
    # Hash the new default password
    print(f"\n=== Hashing New Default Password ===")
    new_hash = hash_password("Admin@123")
    print(f"New hash for 'Admin@123': {new_hash}")
    
    # Verify the new hash
    print(f"\n=== Verifying New Hash ===")
    print(f"Verify 'Admin@123' against new hash: {'✅ Valid' if verify_password('Admin@123', new_hash) else '❌ Invalid'}")
    
    # Update user password
    print(f"\n=== Updating Admin Password ===")
    user.password = new_hash
    db.commit()
    print(f"✅ Admin password updated to 'Admin@123'")
    
    # Verify after update
    print(f"\n=== Verifying Updated Password ===")
    db.refresh(user)
    print(f"Verify 'Admin@123' after update: {'✅ Valid' if verify_password('Admin@123', user.password) else '❌ Invalid'}")

db.close()
