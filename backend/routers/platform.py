from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Organization, User, Document, AIConfigModel
from schemas import OrgCreate, OrgResponse
from routers.auth import get_current_user

router = APIRouter(prefix="/platform", tags=["Platform Admin"])

def require_platform_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "platform_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Platform Admin privileges required"
        )
    return current_user

@router.get("/orgs", response_model=List[OrgResponse])
def list_organizations(
    db: Session = Depends(get_db),
    _: User = Depends(require_platform_admin)
):
    orgs = db.query(Organization).all()
    results = []
    for org in orgs:
        doc_count = db.query(Document).filter(Document.org_id == org.id).count()
        user_count = db.query(User).filter(User.org_id == org.id).count()
        results.append(
            OrgResponse(
                id=org.id,
                name=org.name,
                slug=org.slug,
                plan=org.plan,
                status=org.status,
                created_at=org.created_at,
                doc_count=doc_count,
                user_count=user_count
            )
        )
    return results

@router.post("/orgs", response_model=OrgResponse, status_code=status.HTTP_201_CREATED)
def create_organization(
    payload: OrgCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_platform_admin)
):
    existing = db.query(Organization).filter(Organization.slug == payload.slug.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Organization with slug '{payload.slug}' already exists."
        )
    
    org = Organization(
        name=payload.name,
        slug=payload.slug.lower(),
        plan=payload.plan or "Enterprise",
        status="active"
    )
    db.add(org)
    db.commit()
    db.refresh(org)

    # Auto-initialize default AI config for this org
    ai_config = AIConfigModel(org_id=org.id)
    db.add(ai_config)
    db.commit()

    return OrgResponse(
        id=org.id,
        name=org.name,
        slug=org.slug,
        plan=org.plan,
        status=org.status,
        created_at=org.created_at,
        doc_count=0,
        user_count=0
    )

@router.get("/metrics")
def get_platform_metrics(
    db: Session = Depends(get_db),
    _: User = Depends(require_platform_admin)
):
    total_tenants = db.query(Organization).count()
    active_tenants = db.query(Organization).filter(Organization.status == "active").count()
    total_users = db.query(User).count()
    total_docs = db.query(Document).count()
    
    return {
        "total_tenants": total_tenants,
        "active_tenants": active_tenants,
        "total_users": total_users,
        "total_documents": total_docs,
        "cluster_status": "Healthy",
        "gpu_utilization_pct": 28.5,
        "active_llm_model": "qwen3:8b",
        "avg_query_latency_ms": 320
    }
