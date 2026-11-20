from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime
import re

from app.database.connection import get_db
from app.models.user import User
from app.models.organization import Organization
from app.models.document import Document
from app.models.message import Message
from app.models.chunk import DocumentChunk
from app.routers.auth import get_current_user, require_admin

router = APIRouter(prefix="/api", tags=["platform"])

from app.utils.security import get_password_hash

class OrgCreate(BaseModel):
    name: str
    domain: Optional[str] = None
    admin_emails: Optional[List[str]] = None

class OrgUpdate(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    status: Optional[str] = None
    admin_emails: Optional[List[str]] = None
    admin_passwords: Optional[Dict[str, str]] = None

class SetAdminPasswordRequest(BaseModel):
    email: str
    password: str

class OrgOut(BaseModel):
    id: str
    name: str
    slug: str
    domain: Optional[str] = None
    status: str
    user_count: int
    document_count: int
    admin_emails: List[str] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PlatformStats(BaseModel):
    total_organizations: int
    total_users: int
    total_queries: int
    total_documents: int
    system_uptime: str

class OrgStats(BaseModel):
    document_count: int
    active_users: int
    total_chunks: int
    system_uptime: str

@router.get("/platform/stats", response_model=PlatformStats)
def get_platform_stats(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    total_orgs = db.query(Organization).count()
    total_users = db.query(User).count()
    total_queries = db.query(Message).filter(Message.role == "user").count()
    total_docs = db.query(Document).count()
    
    return PlatformStats(
        total_organizations=max(total_orgs, 1),
        total_users=total_users,
        total_queries=total_queries,
        total_documents=total_docs,
        system_uptime="99.9%"
    )

@router.get("/platform/organizations", response_model=List[OrgOut])
def list_organizations(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    orgs = db.query(Organization).all()
    results = []
    for org in orgs:
        u_count = db.query(User).filter(User.organization_id == org.id).count()
        d_count = db.query(Document).filter(Document.organization_id == org.id).count()
        admin_users = db.query(User).filter(User.organization_id == org.id, User.role == "ORG_ADMIN").all()
        admin_emails = [u.email for u in admin_users]
        results.append(OrgOut(
            id=org.id,
            name=org.name,
            slug=org.slug,
            domain=org.domain,
            status=org.status or "Active",
            user_count=u_count,
            document_count=d_count,
            admin_emails=admin_emails,
            created_at=org.created_at
        ))
    return results

@router.post("/platform/organizations", response_model=OrgOut)
def create_organization(payload: OrgCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", payload.name.strip().lower()).strip("-")
    existing = db.query(Organization).filter((Organization.name == payload.name) | (Organization.slug == slug)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Organization with this name already exists")

    new_org = Organization(
        name=payload.name.strip(),
        slug=slug,
        domain=payload.domain.strip().lower() if payload.domain else None,
        status="Active"
    )
    db.add(new_org)
    db.commit()
    db.refresh(new_org)

    admin_emails_assigned = []
    if payload.admin_emails:
        for raw_email in payload.admin_emails:
            clean_email = raw_email.strip().lower()
            if not clean_email or "@" not in clean_email:
                continue
            admin_emails_assigned.append(clean_email)
            user = db.query(User).filter(User.email == clean_email).first()
            if user:
                user.role = "ORG_ADMIN"
                user.organization_id = new_org.id
            else:
                new_admin = User(
                    name=clean_email.split("@")[0].capitalize() + " Admin",
                    email=clean_email,
                    password_hash=get_password_hash("org123"),
                    role="ORG_ADMIN",
                    organization_id=new_org.id
                )
                db.add(new_admin)
        db.commit()

    return OrgOut(
        id=new_org.id,
        name=new_org.name,
        slug=new_org.slug,
        domain=new_org.domain,
        status=new_org.status,
        user_count=len(admin_emails_assigned),
        document_count=0,
        admin_emails=admin_emails_assigned,
        created_at=new_org.created_at
    )

@router.put("/platform/organizations/{org_id}", response_model=OrgOut)
def update_organization(org_id: str, payload: OrgUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    org = db.query(Organization).filter((Organization.id == org_id) | (Organization.slug == org_id)).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    if payload.name and payload.name.strip():
        org.name = payload.name.strip()
    if payload.domain is not None:
        org.domain = payload.domain.strip().lower() if payload.domain.strip() else None
    if payload.status:
        org.status = payload.status

    db.commit()

    # RBAC: Manage Org Admins
    if payload.admin_emails is not None:
        target_emails = {e.strip().lower() for e in payload.admin_emails if e.strip() and "@" in e}
        
        # 1. Demote any current ORG_ADMIN of this org who is not in the target list
        current_admins = db.query(User).filter(User.organization_id == org.id, User.role == "ORG_ADMIN").all()
        for ca in current_admins:
            if ca.email.lower() not in target_emails:
                ca.role = "STUDENT"
        
        # 2. Assign / Provision target emails as ORG_ADMIN
        for email in target_emails:
            u = db.query(User).filter(User.email == email).first()
            user_pwd = None
            if payload.admin_passwords and email in payload.admin_passwords:
                provided_pwd = payload.admin_passwords[email]
                if provided_pwd and len(provided_pwd.strip()) >= 6:
                    user_pwd = provided_pwd.strip()

            if u:
                u.role = "ORG_ADMIN"
                u.organization_id = org.id
                if user_pwd:
                    u.password_hash = get_password_hash(user_pwd)
            else:
                new_admin = User(
                    name=email.split("@")[0].capitalize() + " Admin",
                    email=email,
                    password_hash=get_password_hash(user_pwd or "org123"),
                    role="ORG_ADMIN",
                    organization_id=org.id
                )
                db.add(new_admin)
        db.commit()

    u_count = db.query(User).filter(User.organization_id == org.id).count()
    d_count = db.query(Document).filter(Document.organization_id == org.id).count()
    admin_users = db.query(User).filter(User.organization_id == org.id, User.role == "ORG_ADMIN").all()
    admin_emails = [u.email for u in admin_users]

    return OrgOut(
        id=org.id,
        name=org.name,
        slug=org.slug,
        domain=org.domain,
        status=org.status or "Active",
        user_count=u_count,
        document_count=d_count,
        admin_emails=admin_emails,
        created_at=org.created_at
    )

@router.post("/platform/organizations/{org_id}/set-password")
def set_org_admin_password(
    org_id: str,
    payload: SetAdminPasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    org = db.query(Organization).filter((Organization.id == org_id) | (Organization.slug == org_id)).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    clean_email = payload.email.strip().lower()
    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")

    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        user = User(
            name=clean_email.split("@")[0].capitalize() + " Admin",
            email=clean_email,
            password_hash=get_password_hash(payload.password),
            role="ORG_ADMIN",
            organization_id=org.id
        )
        db.add(user)
    else:
        user.password_hash = get_password_hash(payload.password)
        user.role = "ORG_ADMIN"
        user.organization_id = org.id

    db.commit()
    return {"detail": f"Password successfully updated for {clean_email}"}

@router.delete("/platform/organizations/{org_id}")
def delete_organization(org_id: str, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    org = db.query(Organization).filter((Organization.id == org_id) | (Organization.slug == org_id)).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization tenant not found")

    # Clean up associated documents & chunks
    docs = db.query(Document).filter(Document.organization_id == org.id).all()
    for doc in docs:
        db.delete(doc)

    # Clean up or detach users
    users = db.query(User).filter(User.organization_id == org.id).all()
    for u in users:
        if u.id == current_user.id:
            u.organization_id = None
        else:
            db.delete(u)

    org_name = org.name
    db.delete(org)
    db.commit()

    return {"detail": f"Tenant organization '{org_name}' has been successfully deleted"}

@router.get("/org/stats", response_model=OrgStats)
def get_org_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Total documents
    doc_count = db.query(Document).count()
    user_count = db.query(User).count()
    chunk_count = db.query(DocumentChunk).count()

    return OrgStats(
        document_count=doc_count,
        active_users=user_count,
        total_chunks=chunk_count,
        system_uptime="100%"
    )
