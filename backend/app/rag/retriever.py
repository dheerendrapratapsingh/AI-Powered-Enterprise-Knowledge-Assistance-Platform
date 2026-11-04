from app.rag.embedder import generate_embedding
from app.rag.index_manager import IndexManager
from app.config import settings
import numpy as np
import faiss

index_manager = IndexManager()

def retrieve_relevant_chunks(question: str, top_k: int = None) -> list:
    if top_k is None:
        top_k = settings.TOP_K

    if index_manager.index.ntotal == 0:
        return []

    query_embedding = generate_embedding(question)
    query_np = np.array([query_embedding]).astype('float32')
    faiss.normalize_L2(query_np)

    k_to_search = min(top_k * 3, index_manager.index.ntotal)
    distances, indices = index_manager.index.search(query_np, k_to_search)

    candidates = []
    for dist, idx in zip(distances[0], indices[0]):
        if idx == -1:
            continue

        chunk_data = index_manager.metadata.get(str(idx))
        if not chunk_data:
            continue

        item = chunk_data.copy()
        item["score"] = float(dist)
        candidates.append(item)

    q_lower = question.lower()

    # 1. Faculty / Directory query detection
    faculty_keywords = ["cabin", "faculty", "professor", "prof", "dr.", "dr ", "emp no", "employee", "contact", "who is", "where is", "department of", "apc"]
    is_faculty_query = any(k in q_lower for k in faculty_keywords)
    if is_faculty_query:
        fac_candidates = [
            c for c in candidates 
            if any(term in c.get("metadata", {}).get("document_name", "").lower() for term in ["faculty", "contact", "employee", "scope", "apc"])
            or "directory:" in c.get("text", "").lower()
        ]
        if fac_candidates:
            candidates = fac_candidates

    # 2. Specific Degree program disambiguation
    elif "b.com" in q_lower or "commerce" in q_lower:
        deg = [c for c in candidates if "b.com" in c.get("metadata", {}).get("document_name", "").lower() or "commerce" in c.get("text", "").lower()]
        if deg: candidates = deg
    elif "bba" in q_lower or "business administration" in q_lower:
        deg = [c for c in candidates if "bba" in c.get("metadata", {}).get("document_name", "").lower() or "business administration" in c.get("text", "").lower()]
        if deg: candidates = deg
    elif "dual degree in arts" in q_lower or "b.a" in q_lower or "m.a" in q_lower or "arts" in q_lower:
        deg = [c for c in candidates if any(t in c.get("metadata", {}).get("document_name", "").lower() for t in ["b.a", "m.a", "arts"])]
        if deg: candidates = deg
    elif "csbs" in q_lower or "business systems" in q_lower:
        deg = [c for c in candidates if "csbs" in c.get("metadata", {}).get("document_name", "").lower() or "business systems" in c.get("text", "").lower()]
        if deg: candidates = deg
    elif ("cse core" in q_lower or "cse" in q_lower or "computer science and engineering" in q_lower) and "csbs" not in q_lower:
        deg = [
            c for c in candidates 
            if "cse" in c.get("metadata", {}).get("document_name", "").lower() 
            and "csbs" not in c.get("metadata", {}).get("document_name", "").lower()
        ]
        if deg: candidates = deg
    elif "hostel" in q_lower or "outing" in q_lower or "mess" in q_lower or "curfew" in q_lower:
        hostel = [c for c in candidates if "hostel" in c.get("metadata", {}).get("document_name", "").lower() or "hostel" in c.get("text", "").lower()]
        if hostel: candidates = hostel

    results = []
    for item in candidates:
        if item["score"] >= settings.SIMILARITY_THRESHOLD:
            results.append(item)
            if len(results) >= top_k:
                break

    if not results and candidates:
        if candidates[0]["score"] >= 0.16:
            results.append(candidates[0])

    return results
