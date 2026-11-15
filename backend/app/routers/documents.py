from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from app.database.connection import get_db, SessionLocal
from app.models.user import User
from app.models.document import Document
from app.routers.auth import require_admin
from app.config import settings
from app.services.ingestion.pipeline import IngestionService
import os
import shutil
import uuid

router = APIRouter(prefix="/api/admin/documents", tags=["admin-documents"])

ALLOWED_EXTENSIONS = {
    ".pdf", ".docx", ".doc", ".txt", ".md", ".csv", ".xlsx", ".xls", ".pptx", ".ppt", ".html", ".htm"
}

def process_document_background(doc_id: str, file_path: str):
    db = SessionLocal()
    try:
        IngestionService.ingest_file(doc_id=doc_id, file_path=file_path, db=db)
    except Exception as e:
        print(f"Error in background ingestion for doc {doc_id}: {e}")
        try:
            doc = db.query(Document).filter(Document.id == doc_id).first()
            if doc:
                doc.status = "FAILED"
                doc.error_message = str(e)
                db.commit()
        except Exception:
            pass
    finally:
        db.close()


@router.post("/upload")
def upload_document(
    background_tasks: BackgroundTasks,
    name: str = Form(...),
    category: str = Form("General"),
    department: str = Form(None),
    source_type: str = Form("manual"),
    version: str = Form("1.0"),
    access_level: str = Form("STUDENT"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file_ext}'. Allowed formats: PDF, DOCX, TXT, MD, CSV, XLSX, PPTX, HTML."
        )

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    safe_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    doc = Document(
        name=name or file.filename,
        filename=file.filename,
        category=category or "General",
        department=department,
        source_type=source_type or "manual",
        version=version or "1.0",
        access_level=access_level,
        file_path=file_path,
        uploaded_by=current_user.id,
        status="PENDING",
        is_active=True
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    background_tasks.add_task(process_document_background, doc.id, file_path)

    return doc


@router.post("/{document_id}/reprocess")
def reprocess_document(
    document_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not doc.file_path or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=400, detail="Source file no longer exists on disk")

    doc.status = "PROCESSING"
    doc.error_message = None
    db.commit()

    def run_reprocess(d_id: str):
        s = SessionLocal()
        try:
            IngestionService.reprocess_document(d_id, s)
        finally:
            s.close()

    background_tasks.add_task(run_reprocess, doc.id)

    return {"status": "reprocessing_started", "document_id": doc.id}


@router.post("/{document_id}/replace")
def replace_document(
    document_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file_ext}")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    safe_filename = f"{uuid.uuid4()}{file_ext}"
    new_file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    with open(new_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    doc.status = "PROCESSING"
    db.commit()

    def run_replace(d_id: str, f_path: str, orig_name: str):
        s = SessionLocal()
        try:
            IngestionService.replace_document(d_id, f_path, orig_name, s)
        finally:
            s.close()

    background_tasks.add_task(run_replace, doc.id, new_file_path, file.filename)

    return {"status": "replacement_started", "document_id": doc.id}


@router.get("")
def list_documents(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return db.query(Document).filter(Document.is_active == True).order_by(Document.created_at.desc()).all()


@router.delete("/{document_id}")
def delete_document(document_id: str, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        from app.rag.retriever import index_manager
        # Remove from FAISS index
        index_manager.delete_document(document_id)

        # Remove file from disk if it exists
        if doc.file_path and os.path.exists(doc.file_path):
            try:
                os.remove(doc.file_path)
            except Exception:
                pass

        # Remove from database (cascades to chunks)
        db.delete(doc)
        db.commit()
        return {"status": "success", "message": "Document deleted"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
