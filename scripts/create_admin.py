from backend.database.database import SessionLocal
from backend.database.models import User
from backend.auth.password import hash_password

db = SessionLocal()

user = db.query(User).filter(User.username == "admin").first()

if not user:
    admin = User(
        username="admin",
        password=hash_password("admin123"),
        role="Admin"
    )
    db.add(admin)
    db.commit()
    print("✅ Admin user created successfully!")
else:
    print("✅ Admin user already exists!")

db.close()
