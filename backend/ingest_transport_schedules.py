import os
import sys
import uuid

sys.path.append(os.path.abspath("backend"))

from app.database.connection import SessionLocal
from app.models.document import Document
from app.models.chunk import DocumentChunk
from app.services.ingestion.pipeline import IngestionService
from app.rag.retriever import index_manager

DOCS_DIR = os.path.abspath("backend/data/documents")

schedules = [
    {
        "filename": "Tenali_Bus_Routes_Schedule.md",
        "title": "VIT-AP University Transport: Tenali Bus Routes & Timings",
        "category": "Campus Transport & Routes",
        "dept": "University Transport Department"
    },
    {
        "filename": "Guntur_Bus_Routes_Schedule.md",
        "title": "VIT-AP University Transport: Guntur Bus Routes & Timings (GV-1 to GV-20)",
        "category": "Campus Transport & Routes",
        "dept": "University Transport Department"
    },
    {
        "filename": "Vijayawada_Bus_Routes_Schedule.md",
        "title": "VIT-AP University Transport: Vijayawada Bus Routes & Timings (VV-1 to VV-22)",
        "category": "Campus Transport & Routes",
        "dept": "University Transport Department"
    }
]

def run():
    db = SessionLocal()
    try:
        # 1. Clean up old binary doc entries for bus routes if any
        old_bus_docs = db.query(Document).filter(
            Document.filename.in_(["GUNTUR_BUS.doc", "TENALI_BUS.doc", "VIJAYAWADA_BUS.doc"])
        ).all()
        for old in old_bus_docs:
            print(f"Removing old noisy document: {old.name} ({old.id})")
            index_manager.delete_document(old.id)
            db.delete(old)
        db.commit()

        # 2. Ingest structured markdown schedules
        for item in schedules:
            file_path = os.path.join(DOCS_DIR, item["filename"])
            if not os.path.exists(file_path):
                print(f"File missing: {file_path}")
                continue

            doc = Document(
                id=str(uuid.uuid4()),
                name=item["title"],
                filename=item["filename"],
                category=item["category"],
                department=item["dept"],
                source_type="manual",
                version="2026.1",
                access_level="STUDENT",
                file_path=file_path,
                status="PENDING",
                is_active=True
            )
            db.add(doc)
            db.commit()
            db.refresh(doc)

            res = IngestionService.ingest_file(doc_id=doc.id, file_path=file_path, db=db)
            print(f"Ingested {item['title']}: {res.chunk_count} chunks (Success: {res.success})")

        db.commit()
        print(f"\nTotal Chunks in DB: {db.query(DocumentChunk).count()}")
        print(f"Total FAISS Vectors: {index_manager.index.ntotal}")

    finally:
        db.close()

if __name__ == "__main__":
    run()
