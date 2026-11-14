from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List, Optional
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

class OrgCreate(BaseModel):
    name: str
    domain: Optional[str] = None

class OrgOut(BaseModel):
    id: str
    name: str
    slug: str
    domain: Optional[str] = None
    status: str
    user_count: int
    document_count: int
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
        results.append(OrgOut(
            id=org.id,
            name=org.name,
            slug=org.slug,
            domain=org.domain,
            status=org.status,
            user_count=u_count,
            document_count=d_count,
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
        name=payload.name,
        slug=slug,
        domain=payload.domain,
        status="Active"
    )
    db.add(new_org)
    db.commit()
    db.refresh(new_org)

    return OrgOut(
        id=new_org.id,
        name=new_org.name,
        slug=new_org.slug,
        domain=new_org.domain,
        status=new_org.status,
        user_count=0,
        document_count=0,
        created_at=new_org.created_at
    )

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
