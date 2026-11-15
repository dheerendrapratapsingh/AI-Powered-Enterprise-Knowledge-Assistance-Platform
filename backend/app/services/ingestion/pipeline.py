import os
import hashlib
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.database.connection import SessionLocal
from app.models.document import Document
from app.models.chunk import DocumentChunk
from app.rag.extractor import extract_text
from app.rag.chunker import process_document_to_chunks
from app.rag.embedder import generate_embeddings_for_chunks
from app.rag.retriever import index_manager

class IngestionResult:
    def __init__(self, success: bool, document_id: str, chunk_count: int = 0, is_duplicate: bool = False, message: str = ""):
        self.success = success
        self.document_id = document_id
        self.chunk_count = chunk_count
        self.is_duplicate = is_duplicate
        self.message = message

def compute_sha256(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()

def compute_text_sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8", errors="replace")).hexdigest()

class IngestionService:
    @staticmethod
    def ingest_file(
        doc_id: str,
        file_path: str,
        db: Optional[Session] = None
    ) -> IngestionResult:
        """
        Shared ingestion worker for files on disk (manual uploads or downloaded crawler documents).
        Executes text extraction, deduplication, chunking, embedding, and FAISS indexing.
        """
        close_db = False
        if db is None:
            db = SessionLocal()
            close_db = True

        try:
            doc = db.query(Document).filter(Document.id == doc_id).first()
            if not doc:
                return IngestionResult(False, doc_id, message="Document not found")

            doc.status = "PROCESSING"
            db.commit()

            # 1. Compute Content Hash for Deduplication
            with open(file_path, "rb") as f:
                content_bytes = f.read()
            file_hash = compute_sha256(content_bytes)
            doc.content_hash = file_hash

            # Check if an identical active document already exists in this organization
            existing_duplicate = db.query(Document).filter(
                Document.content_hash == file_hash,
                Document.id != doc.id,
                Document.is_active == 1,
                Document.status == "READY"
            ).first()

            if existing_duplicate:
                doc.status = "READY"
                doc.chunk_count = existing_duplicate.chunk_count
                doc.page_count = existing_duplicate.page_count
                doc.error_message = f"Deduplicated: matches existing document '{existing_duplicate.name}'"
                db.commit()
                return IngestionResult(True, doc.id, chunk_count=doc.chunk_count, is_duplicate=True, message="Document deduplicated")

            # 2. Extract Text & Structure
            pages_data = extract_text(file_path)
            doc.page_count = len(pages_data)

            metadata_template = {
                "document_id": doc.id,
                "document_name": doc.name,
                "source_type": doc.source_type or "manual",
                "source_url": doc.source_url or doc.name,
                "category": doc.category or "General",
                "access_level": doc.access_level or "STUDENT",
                "version": doc.version or "1.0"
            }

            # 3. Intelligent Chunking
            chunks = process_document_to_chunks(pages_data, metadata_template)
            doc.chunk_count = len(chunks)
            doc.status = "INDEXING"
            db.commit()

            # 4. Dense Embeddings & FAISS Indexing
            embeddings = generate_embeddings_for_chunks(chunks)
            index_manager.add_chunks(chunks, embeddings)

            # 5. Persist Chunks in SQL
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
            doc.error_message = None
            db.commit()

            return IngestionResult(True, doc.id, chunk_count=len(chunks), message="Successfully ingested and indexed")

        except Exception as e:
            try:
                doc = db.query(Document).filter(Document.id == doc_id).first()
                if doc:
                    doc.status = "FAILED"
                    doc.error_message = str(e)
                    db.commit()
            except Exception:
                pass
            return IngestionResult(False, doc_id, message=f"Ingestion failed: {str(e)}")
        finally:
            if close_db:
                db.close()

    @staticmethod
    def ingest_direct_text(
        doc_id: str,
        text_content: str,
        metadata_override: Dict[str, Any],
        db: Optional[Session] = None
    ) -> IngestionResult:
        """
        Shared ingestion worker for crawled HTML web pages.
        Directly ingests structured markdown without requiring disk writes.
        """
        close_db = False
        if db is None:
            db = SessionLocal()
            close_db = True

        try:
            doc = db.query(Document).filter(Document.id == doc_id).first()
            if not doc:
                return IngestionResult(False, doc_id, message="Document not found")

            doc.status = "PROCESSING"
            text_hash = compute_text_sha256(text_content)
            doc.content_hash = text_hash

            pages_data = [{"page_number": 1, "text": text_content}]
            doc.page_count = 1

            metadata_template = {
                "document_id": doc.id,
                "document_name": doc.name,
                "source_type": doc.source_type or "crawler",
                "source_url": doc.source_url or doc.name,
                "category": doc.category or "Website",
                "access_level": doc.access_level or "STUDENT",
                "version": doc.version or "1.0"
            }
            metadata_template.update(metadata_override)

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
            doc.error_message = None
            db.commit()

            return IngestionResult(True, doc.id, chunk_count=len(chunks), message="Successfully ingested and indexed")

        except Exception as e:
            try:
                doc = db.query(Document).filter(Document.id == doc_id).first()
                if doc:
                    doc.status = "FAILED"
                    doc.error_message = str(e)
                    db.commit()
            except Exception:
                pass
            return IngestionResult(False, doc_id, message=f"Direct ingestion failed: {str(e)}")
        finally:
            if close_db:
                db.close()

    @staticmethod
    def reprocess_document(doc_id: str, db: Session) -> IngestionResult:
        """
        Safely removes old chunks from FAISS & DB, then reprocesses from source file.
        """
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if not doc:
            return IngestionResult(False, doc_id, message="Document not found")

        # 1. Clean existing FAISS chunks
        index_manager.delete_document(doc.id)

        # 2. Delete existing DB chunks
        db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).delete()
        db.commit()

        # 3. Re-run ingestion
        if doc.file_path and os.path.exists(doc.file_path):
            return IngestionService.ingest_file(doc.id, doc.file_path, db=db)
        else:
            return IngestionResult(False, doc.id, message="Source file path not found for reprocessing")

    @staticmethod
    def replace_document(doc_id: str, new_file_path: str, new_filename: str, db: Session) -> IngestionResult:
        """
        Replaces document file with a new version, removes stale chunks, and re-indexes.
        """
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if not doc:
            return IngestionResult(False, doc_id, message="Document not found")

        # Increment version
        try:
            cur_ver = float(doc.version or 1.0)
            doc.version = f"{cur_ver + 0.1:.1f}"
        except Exception:
            doc.version = "2.0"

        # Remove previous file if different
        if doc.file_path and doc.file_path != new_file_path and os.path.exists(doc.file_path):
            try:
                os.remove(doc.file_path)
            except Exception:
                pass

        doc.file_path = new_file_path
        doc.filename = new_filename

        # Remove old chunks
        index_manager.delete_document(doc.id)
        db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).delete()
        db.commit()

        return IngestionService.ingest_file(doc.id, new_file_path, db=db)
