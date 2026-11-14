import sys, os
sys.path.append(os.path.dirname(__file__))

from app.database.connection import SessionLocal
from app.models.document import Document
from app.models.chunk import DocumentChunk
from app.rag.retriever import index_manager
from app.routers.documents import process_document_background

db = SessionLocal()
docs = db.query(Document).all()
doc_info = [(d.id, d.name, d.file_path) for d in docs]
print(f"Found {len(doc_info)} documents to re-index...")

# Clean existing chunks and index
for doc_id, name, path in doc_info:
    index_manager.delete_document(doc_id)
db.query(DocumentChunk).delete()
db.commit()
db.close()

for doc_id, name, file_path in doc_info:
    print(f"Re-indexing {name} ({file_path})...")
    process_document_background(doc_id, file_path)

db = SessionLocal()
print("Total chunks in DB now:", db.query(DocumentChunk).count())
print("Total vectors in FAISS now:", index_manager.index.ntotal)
db.close()
print("All documents re-indexed successfully with column-aware parser!")
