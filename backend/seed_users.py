import os
import sys
sys.path.append(os.path.dirname(__file__))

from app.database.connection import SessionLocal, engine
from app.database.base import Base
from app.models.organization import Organization
from app.models.chunk import DocumentChunk
from app.models.user import User
from app.models.document import Document
from app.utils.security import get_password_hash

# Ensure all tables are created
Base.metadata.create_all(bind=engine)

def seed_database():
    db = SessionLocal()

    # 1. Seed Default Organizations
    default_org = db.query(Organization).filter(Organization.slug == "vitap").first()
    if not default_org:
        default_org = Organization(
            name="VIT-AP University",
            slug="vitap",
            domain="vitap.ac.in",
            status="Active"
        )
        db.add(default_org)
        db.commit()
        db.refresh(default_org)
        print("Default organization created: VIT-AP University")
    else:
        print("Default organization already exists.")

    acme_org = db.query(Organization).filter(Organization.slug == "acme-corp").first()
    if not acme_org:
        acme_org = Organization(
            name="Acme Corporation",
            slug="acme-corp",
            domain="acme.com",
            status="Active"
        )
        db.add(acme_org)
        db.commit()

    # 2. Seed Users
    admin_email = "admin@vitap.ac.in"
    admin = db.query(User).filter(User.email == admin_email).first()
    if not admin:
        admin = User(
            name="Platform Admin",
            email=admin_email,
            password_hash=get_password_hash("admin123"),
            role="ADMIN",
            organization_id=default_org.id
        )
        db.add(admin)
        db.commit()
        print("Admin user created: admin@vitap.ac.in / admin123")
    else:
        if not admin.organization_id:
            admin.organization_id = default_org.id
            db.commit()
        print("Admin user already exists.")
        
    student_email = "student@vitap.ac.in"
    student = db.query(User).filter(User.email == student_email).first()
    if not student:
        student = User(
            name="Test Student",
            email=student_email,
            password_hash=get_password_hash("student123"),
            role="STUDENT",
            organization_id=default_org.id
        )
        db.add(student)
        db.commit()
        print("Student user created: student@vitap.ac.in / student123")
    else:
        if not student.organization_id:
            student.organization_id = default_org.id
            db.commit()
        print("Student user already exists.")
        
    org_email = "org@vitap.ac.in"
    org_user = db.query(User).filter(User.email == org_email).first()
    if not org_user:
        org_user = User(
            name="Org Admin",
            email=org_email,
            password_hash=get_password_hash("org123"),
            role="ORG_ADMIN",
            organization_id=default_org.id
        )
        db.add(org_user)
        db.commit()
        print("Org user created: org@vitap.ac.in / org123")
    else:
        if not org_user.organization_id:
            org_user.organization_id = default_org.id
            db.commit()
        print("Org user already exists.")

    # 3. Associate existing documents with default organization
    docs = db.query(Document).filter(Document.organization_id.is_(None)).all()
    for doc in docs:
        doc.organization_id = default_org.id
    if docs:
        db.commit()
        print(f"Updated {len(docs)} documents with organization_id.")

    db.close()

if __name__ == "__main__":
    seed_database()
