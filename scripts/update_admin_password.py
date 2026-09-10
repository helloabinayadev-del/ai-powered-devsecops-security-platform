from backend.database.database import SessionLocal
from backend.database.models import User
from backend.auth.password import hash_password

db = SessionLocal()

user = db.query(User).filter(User.username == "admin").first()

if user:
    user.password = hash_password("Admin@123")
    db.commit()
    print("✅ Admin user password updated successfully!")
    print("Username: admin")
    print("Password: Admin@123")
else:
    admin = User(
        username="admin",
        password=hash_password("Admin@123"),
        role="Admin"
    )
    db.add(admin)
    db.commit()
    print("✅ Admin user created successfully!")
    print("Username: admin")
    print("Password: Admin@123")

db.close()
