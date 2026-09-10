from backend.database.database import SessionLocal
from backend.database.models import User
from backend.auth.password import hash_password, verify_password

db = SessionLocal()

user = db.query(User).filter(User.username == "admin").first()

if user:
    print(f"Admin user found: {user.username}")
    print(f"Role: {user.role}")
    print(f"Password hash: {user.password[:50]}...")
    
    # Test password verification
    test_passwords = ["admin123", "admin", "password"]
    for pwd in test_passwords:
        if verify_password(pwd, user.password):
            print(f"✅ Password '{pwd}' is correct!")
            break
    else:
        print("❌ None of the test passwords matched")
        print("Creating new admin with password 'admin123'...")
        user.password = hash_password("admin123")
        db.commit()
        print("✅ Admin password updated to 'admin123'")
else:
    print("❌ Admin user not found")
    print("Creating admin user...")
    from backend.auth.password import hash_password
    admin = User(
        username="admin",
        password=hash_password("admin123"),
        role="Admin"
    )
    db.add(admin)
    db.commit()
    print("✅ Admin user created with password 'admin123'")

db.close()
