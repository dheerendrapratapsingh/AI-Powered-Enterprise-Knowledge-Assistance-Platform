from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.user import User
from app.models.document import Document
from app.routers.auth import require_admin
from app.config import settings
import os
import shutil
import uuid

router = APIRouter(prefix="/api/admin/documents", tags=["admin-documents"])

def process_document_background(doc_id: str, file_path: str, db: Session):
    from app.rag.extractor import extract_text
    from app.rag.chunker import process_document_to_chunks
    from app.rag.embedder import generate_embeddings_for_chunks
    from app.rag.retriever import index_manager
    from app.models.chunk import DocumentChunk
    
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        return
        
    try:
        doc.status = "PROCESSING"
        db.commit()
        
        pages_data = extract_text(file_path)
        doc.page_count = len(pages_data)
        
        metadata_template = {
            "document_id": doc.id,
            "document_name": doc.name,
            "category": doc.category,
            "access_level": "student"
        }
        
        chunks = process_document_to_chunks(pages_data, metadata_template)
        doc.chunk_count = len(chunks)
        doc.status = "INDEXING"
        db.commit()
        
        embeddings = generate_embeddings_for_chunks(chunks)
        index_manager.add_chunks(chunks, embeddings)
        
        for chunk in chunks:
            db_chunk = DocumentChunk(
                document_id=doc.id,
                chunk_index=chunk["chunk_index"],
                page_number=chunk["page_number"],
                text=chunk["text"],
                metadata_json=chunk["metadata"]
            )
            db.add(db_chunk)
            
        doc.status = "READY"
        db.commit()
        
    except Exception as e:
        print(f"Error processing document {doc_id}: {e}")
        doc.status = "FAILED"
        db.commit()


@router.post("/upload")
def upload_document(
    background_tasks: BackgroundTasks,
    name: str = Form(...),
    category: str = Form(None),
    department: str = Form(None),
    source_type: str = Form(None),
    version: str = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_ext = os.path.splitext(file.filename)[1]
    safe_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    doc = Document(
        name=name,
        filename=file.filename,
        category=category,
        department=department,
        source_type=source_type,
        version=version,
        file_path=file_path,
        uploaded_by=current_user.id
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    background_tasks.add_task(process_document_background, doc.id, file_path, db)
    
    return doc

@router.get("")
def list_documents(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return db.query(Document).order_by(Document.created_at.desc()).all()

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
            os.remove(doc.file_path)
            
        # Remove from database (cascades to chunks)
        db.delete(doc)
        db.commit()
        return {"status": "success", "message": "Document deleted"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
