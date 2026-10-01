import os
import sys
sys.path.append(os.path.dirname(__file__))

from app.database.connection import SessionLocal
from app.models.user import User
from app.utils.security import get_password_hash

def seed_admin():
    db = SessionLocal()
    admin_email = "admin@vitap.ac.in"
    if not db.query(User).filter(User.email == admin_email).first():
        admin = User(
            name="System Admin",
            email=admin_email,
            password_hash=get_password_hash("admin123"),
            role="ADMIN"
        )
        db.add(admin)
        db.commit()
        print("Admin user created: admin@vitap.ac.in / admin123")
    else:
        print("Admin user already exists.")
        
    student_email = "student@vitap.ac.in"
    if not db.query(User).filter(User.email == student_email).first():
        student = User(
            name="Test Student",
            email=student_email,
            password_hash=get_password_hash("student123"),
            role="STUDENT"
        )
        db.add(student)
        db.commit()
        print("Student user created: student@vitap.ac.in / student123")
    else:
        print("Student user already exists.")
        
    db.close()

if __name__ == "__main__":
    seed_admin()
