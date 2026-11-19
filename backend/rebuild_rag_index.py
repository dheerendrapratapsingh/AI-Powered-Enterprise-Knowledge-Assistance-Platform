import os
import sys
import json
import sqlite3
import numpy as np
import faiss

# Ensure backend root is in sys.path
sys.path.append(os.path.abspath("backend"))

from app.config import settings
from app.rag.embedder import get_embedding_model

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
INDEX_DIR = os.path.abspath(settings.FAISS_DIR)
INDEX_PATH = os.path.join(INDEX_DIR, "vitap.index")
METADATA_PATH = os.path.join(INDEX_DIR, "vitap_metadata.json")
DB_PATH = os.path.join(BACKEND_DIR, "copilot.db")

print("==================================================")
print("STARTING HIGH-ACCURACY RAG RE-INDEXING & REBUILD")
print(f"Database: {DB_PATH}")
print(f"FAISS Index Path: {INDEX_PATH}")
print("==================================================")

def clean_and_normalize_metadata():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # 1. Remove obsolete test records with null/policy source type
    cur.execute("""
        DELETE FROM documents 
        WHERE id IN ('ce7c7b16-dc7e-4c9c-bfd3-234362618959', 'b5f34c8b-68b0-4d09-a830-959dd3321a5f', '08b402f4-5dc8-4089-8bc0-ca3f8f587393')
    """)
    cur.execute("""
        DELETE FROM document_chunks 
        WHERE document_id IN ('ce7c7b16-dc7e-4c9c-bfd3-234362618959', 'b5f34c8b-68b0-4d09-a830-959dd3321a5f', '08b402f4-5dc8-4089-8bc0-ca3f8f587393')
    """)

    # 2. Harmonize any null categories
    cur.execute("UPDATE documents SET category = 'Academic Syllabi' WHERE category IS NULL AND (name LIKE '%B.Tech%' OR name LIKE '%B.Sc%' OR name LIKE '%M.Tech%')")
    cur.execute("UPDATE documents SET category = 'Student Regulations' WHERE category IS NULL")
    cur.execute("UPDATE documents SET category = 'Hostel & Residential Life' WHERE category IN ('Hostel Policy', 'Hostel Rules')")
    cur.execute("UPDATE documents SET category = 'Institutional Documents' WHERE category = 'General Institutional'")

    # Clean titles
    cur.execute("UPDATE documents SET name = REPLACE(name, '+', ' ') WHERE name LIKE '%+%'")
    cur.execute("UPDATE documents SET name = REPLACE(name, 'Vitap', 'VIT-AP') WHERE name LIKE '%Vitap%'")
    cur.execute("UPDATE documents SET name = REPLACE(name, 'Vit Ap', 'VIT-AP') WHERE name LIKE '%Vit Ap%'")

    conn.commit()
    conn.close()
    print("[1/5] Metadata cleaned and harmonized in SQLite.")

def rebuild_index():
    clean_and_normalize_metadata()

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Fetch all active documents and their chunks
    cur.execute("""
        SELECT 
            c.id, c.document_id, c.chunk_index, c.page_number, c.text,
            d.name, d.category, d.department, d.source_type, d.source_url, d.access_level, d.version
        FROM document_chunks c
        JOIN documents d ON c.document_id = d.id
        WHERE d.is_active = 1
        ORDER BY d.category, d.name, c.chunk_index
    """)
    rows = cur.fetchall()
    conn.close()

    print(f"[2/5] Retrieved {len(rows)} verified chunks across all active documents.")

    texts_to_embed = []
    metadata_map = {}

    for idx, r in enumerate(rows):
        chunk_id, doc_id, chunk_index, page_num, raw_text, doc_name, cat, dept, src_type, src_url, access_lvl, ver = r

        # Ensure text is not empty
        clean_text = (raw_text or "").strip()
        if not clean_text:
            continue

        # Format context-enriched text for high-accuracy semantic search
        header = f"# {cat or 'General'} > {doc_name}\n"
        if dept:
            header += f"**Department / School**: {dept}\n"
        if src_url and src_url.startswith("http"):
            header += f"**Source URL**: {src_url}\n"
        header += "---\n"

        # If the raw text already contains a markdown header, don't duplicate excessively
        if not clean_text.startswith("#"):
            enriched_text = f"{header}{clean_text}"
        else:
            enriched_text = f"Category: {cat or 'General'} | Source: {doc_name}\n\n{clean_text}"

        texts_to_embed.append(enriched_text)

        metadata_map[str(idx)] = {
            "chunk_id": chunk_id,
            "document_id": doc_id,
            "chunk_index": chunk_index,
            "page_number": page_num or 1,
            "text": clean_text,
            "metadata": {
                "document_id": doc_id,
                "document_name": doc_name,
                "category": cat or "General",
                "department": dept or "University Administration",
                "source_type": src_type or "manual",
                "source_url": src_url or doc_name,
                "access_level": access_lvl or "STUDENT",
                "version": ver or "1.0",
                "page": page_num or 1
            }
        }

    total_chunks = len(texts_to_embed)
    print(f"[3/5] Computing 384-dimensional dense embeddings for {total_chunks} chunks using sentence-transformers...")

    embedder = get_embedding_model()
    # Batch encode with progress bar
    embeddings = embedder.encode(
        texts_to_embed, 
        batch_size=64, 
        show_progress_bar=True, 
        convert_to_numpy=True,
        normalize_embeddings=True
    ).astype("float32")

    print(f"[4/5] Building FAISS IndexIDMap(IndexFlatIP(384))...")
    dim = embeddings.shape[1]
    base_index = faiss.IndexFlatIP(dim)
    index = faiss.IndexIDMap(base_index)
    ids = np.arange(0, len(embeddings)).astype("int64")
    index.add_with_ids(embeddings, ids)

    # Save to canonical backend path
    os.makedirs(INDEX_DIR, exist_ok=True)
    faiss.write_index(index, INDEX_PATH)
    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata_map, f, indent=2, ensure_ascii=False)

    # Mirror to workspace root data/indexes
    root_index_dir = os.path.abspath("data/indexes")
    os.makedirs(root_index_dir, exist_ok=True)
    faiss.write_index(index, os.path.join(root_index_dir, "vitap.index"))
    with open(os.path.join(root_index_dir, "vitap_metadata.json"), "w", encoding="utf-8") as f:
        json.dump(metadata_map, f, indent=2, ensure_ascii=False)

    print(f"[5/5] FAISS Index rebuilt successfully! Total Vectors: {index.ntotal}")

    # Synchronize database to root
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    # Update chunk counts in document table
    cur.execute("""
        UPDATE documents 
        SET chunk_count = (SELECT COUNT(*) FROM document_chunks WHERE document_id = documents.id),
            status = 'READY'
        WHERE is_active = 1
    """)
    conn.commit()
    conn.close()

    root_db = os.path.abspath(os.path.join(BACKEND_DIR, "..", "copilot.db"))
    if os.path.abspath(DB_PATH) != os.path.abspath(root_db):
        import shutil
        shutil.copy2(DB_PATH, root_db)
        print("Database synchronized to workspace root copilot.db.")

    print("\n==================================================")
    print("RE-INDEXING COMPLETE:")
    print(f"  Total Chunks Embedded: {total_chunks}")
    print(f"  Total FAISS Vectors:   {index.ntotal}")
    print(f"  Saved Index Files:     {INDEX_PATH}")
    print("==================================================")

if __name__ == "__main__":
    rebuild_index()
