import os
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from database import get_db
from models import Organization, User, Document, DocumentChunk, AIConfigModel
from schemas import (
    DocumentResponse,
    UserResponse,
    UserInviteRequest,
    AIConfigSchema,
)
from routers.auth import get_current_user, get_password_hash
from services.document_processor import DocumentProcessor
from services.vector_store import VectorStoreManager
from config import settings

router = APIRouter(prefix="/org", tags=["Organization Admin"])

def require_org_admin(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["org_admin", "platform_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization Admin privileges required"
        )
    return current_user

# --- Documents & Knowledge Base ---
@router.get("/documents", response_model=List[DocumentResponse])
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_org_admin)
):
    org_id = current_user.org_id
    if not org_id:
        raise HTTPException(status_code=400, detail="User is not associated with an organization")
    return db.query(Document).filter(Document.org_id == org_id).order_by(Document.created_at.desc()).all()

@router.post("/documents/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_org_admin)
):
    org_id = current_user.org_id
    if not org_id:
        raise HTTPException(status_code=400, detail="User has no assigned organization")

    # Save physical file
    org_dir = os.path.join(settings.STORAGE_DIR, f"org_{org_id}")
    os.makedirs(org_dir, exist_ok=True)
    file_path = os.path.join(org_dir, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(file_path)

    # Create document record
    doc = Document(
        org_id=org_id,
        title=title or file.filename,
        original_filename=file.filename,
        file_size_bytes=file_size,
        mime_type=file.content_type or "application/octet-stream",
        file_path=file_path,
        status="uploaded"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Extract text & chunk
    try:
        pages = DocumentProcessor.extract_text(file_path, doc.mime_type)
        chunks_data = DocumentProcessor.chunk_text(pages)
        
        chunk_models = []
        for c in chunks_data:
            chunk_rec = DocumentChunk(
                document_id=doc.id,
                org_id=org_id,
                chunk_index=c["chunk_index"],
                page_number=c["page_number"],
                content=c["content"],
                token_count=c["token_count"]
            )
            db.add(chunk_rec)
            chunk_models.append(chunk_rec)

        db.commit()

        # Add to FAISS Vector Index
        chunks_for_index = [
            {
                "id": cm.id,
                "document_id": doc.id,
                "doc_title": doc.title,
                "page_number": cm.page_number,
                "content": cm.content
            }
            for cm in chunk_models
        ]
        VectorStoreManager.add_chunks(org_id, chunks_for_index)

        doc.status = "indexed"
        doc.chunk_count = len(chunks_data)
        doc.vector_count = len(chunks_data)
        db.commit()
        db.refresh(doc)

    except Exception as e:
        doc.status = "failed"
        doc.error_message = str(e)
        db.commit()
        db.refresh(doc)

    return doc

@router.delete("/documents/{doc_id}")
def delete_document(
    doc_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_org_admin)
):
    doc = db.query(Document).filter(
        Document.id == doc_id,
        Document.org_id == current_user.org_id
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete physical file
    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except OSError:
            pass

    db.delete(doc)
    db.commit()
    return {"ok": True, "message": "Document deleted successfully"}

# --- Users & Roles ---
@router.get("/users", response_model=List[UserResponse])
def list_org_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_org_admin)
):
    users = db.query(User).filter(User.org_id == current_user.org_id).all()
    org_name = current_user.organization.name if current_user.organization else None
    return [
        UserResponse(
            id=u.id,
            name=u.name,
            email=u.email,
            role=u.role,
            status=u.status,
            org_id=u.org_id,
            org_name=org_name,
            avatar_initial=u.avatar_initial,
            created_at=u.created_at
        )
        for u in users
    ]

@router.post("/users/invite", response_model=UserResponse)
def invite_user(
    payload: UserInviteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_org_admin)
):
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    temp_password = "User@123"
    new_user = User(
        org_id=current_user.org_id,
        name=payload.name,
        email=payload.email.lower(),
        hashed_password=get_password_hash(temp_password),
        role=payload.role,
        status="invited",
        avatar_initial=payload.name[0].upper() if payload.name else "U"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    org_name = current_user.organization.name if current_user.organization else None
    return UserResponse(
        id=new_user.id,
        name=new_user.name,
        email=new_user.email,
        role=new_user.role,
        status=new_user.status,
        org_id=new_user.org_id,
        org_name=org_name,
        avatar_initial=new_user.avatar_initial,
        created_at=new_user.created_at
    )

# --- AI Configuration ---
@router.get("/ai-config", response_model=AIConfigSchema)
def get_ai_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_org_admin)
):
    config = db.query(AIConfigModel).filter(AIConfigModel.org_id == current_user.org_id).first()
    if not config:
        config = AIConfigModel(org_id=current_user.org_id)
        db.add(config)
        db.commit()
        db.refresh(config)
    return config

@router.put("/ai-config", response_model=AIConfigSchema)
def update_ai_config(
    payload: AIConfigSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_org_admin)
):
    config = db.query(AIConfigModel).filter(AIConfigModel.org_id == current_user.org_id).first()
    if not config:
        config = AIConfigModel(org_id=current_user.org_id)
        db.add(config)

    for key, value in payload.model_dump().items():
        setattr(config, key, value)

    db.commit()
    db.refresh(config)
    return config
