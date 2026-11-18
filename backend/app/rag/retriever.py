from app.rag.embedder import generate_embedding
from app.rag.index_manager import IndexManager
from app.config import settings
import numpy as np
import faiss

index_manager = IndexManager()

def retrieve_relevant_chunks(question: str, top_k: int = None) -> list:
    index_manager.ensure_fresh()
    if top_k is None:
        top_k = settings.TOP_K

    if index_manager.index.ntotal == 0:
        return []

    q_lower = question.lower()

    # Contextualize ambiguous location/campus queries lacking university mentions
    search_q = question
    if any(k in q_lower for k in ["address", "location", "where is it", "reach it", "situated", "pincode"]) and not any(k in q_lower for k in ["vit", "vit-ap", "vitap", "university"]):
        search_q = f"VIT-AP University {question}"

    query_embedding = generate_embedding(search_q)
    query_np = np.array([query_embedding]).astype('float32')
    faiss.normalize_L2(query_np)

    k_to_search = min(max(top_k * 6, 30), index_manager.index.ntotal)
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

    # 3. Location / Address / Campus Contact detection
    loc_keywords = ["address", "location", "located", "where is", "how to reach", "directions", "city", "amaravati", "situated", "pincode", "postal", "campus address"]
    if any(k in q_lower for k in loc_keywords):
        loc_candidates = [
            c for c in candidates 
            if any(term in c.get("text", "").lower() for term in ["amaravati", "beside ap secretariat", "522241", "andhra pradesh", "inavolu", "contact us"])
        ]
        if loc_candidates:
            candidates = loc_candidates + [c for c in candidates if c not in loc_candidates]

    # 4. Electives / Curriculum / Course categories detection
    curriculum_keywords = ["elective", "electives", "curriculum", "syllabus", "syllabi", "programme elective", "university elective", "open elective"]
    if any(k in q_lower for k in curriculum_keywords):
        curr_candidates = [
            c for c in candidates 
            if any(term in c.get("metadata", {}).get("document_name", "").lower() for term in ["cse", "csbs", "curriculum", "syllabus", "core"])
            or any(term in c.get("text", "").lower() for term in ["programme electives", "university electives", "open electives", "programme core"])
        ]
        if curr_candidates:
            candidates = curr_candidates + [c for c in candidates if c not in curr_candidates]

    # 5. Transport, Bus Routes & Schedules disambiguation
    transport_keywords = ["transport", "bus", "buses", "route", "routes", "commute", "pickup", "stops", "bus stand", "timing", "schedule", "guntur", "vijayawada", "tenali"]
    if any(k in q_lower for k in transport_keywords):
        transport_candidates = [
            c for c in candidates
            if any(term in c.get("metadata", {}).get("document_name", "").lower() for term in ["bus", "transport", "route"])
            or "campus transport" in c.get("text", "").lower()
            or "bus routes" in c.get("text", "").lower()
        ]
        if transport_candidates:
            candidates = transport_candidates + [c for c in candidates if c not in transport_candidates]

    # 6. Placement & Career routing
    placement_keywords = ["placement", "placements", "cdc", "dream offer", "super dream", "ctc", "recruit", "recruiter", "internship"]
    if any(k in q_lower for k in placement_keywords):
        placement_candidates = [
            c for c in candidates
            if any(term in c.get("metadata", {}).get("document_name", "").lower() for term in ["placement", "cdc", "career"])
            or "placement norms" in c.get("text", "").lower()
        ]
        if placement_candidates:
            candidates = placement_candidates + [c for c in candidates if c not in placement_candidates]

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
