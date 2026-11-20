from app.rag.embedder import generate_embedding
from app.rag.index_manager import IndexManager
from app.config import settings
from app.database.connection import SessionLocal
from app.models.document import Document
from app.models.organization import Organization
import numpy as np
import faiss

index_manager = IndexManager()

def retrieve_relevant_chunks(question: str, top_k: int = None, organization_id: str = None) -> list:
    index_manager.ensure_fresh()
    if top_k is None:
        top_k = settings.TOP_K

    if index_manager.index.ntotal == 0:
        return []

    q_lower = question.lower()

    # Determine tenant organization context if present
    org_name = "VIT-AP University"
    org_doc_ids = None
    if organization_id:
        db = SessionLocal()
        try:
            org = db.query(Organization).filter(Organization.id == organization_id).first()
            if org:
                org_name = org.name
            active_docs = db.query(Document.id).filter(
                Document.organization_id == organization_id,
                Document.is_active == True
            ).all()
            org_doc_ids = {d[0] for d in active_docs}
        finally:
            db.close()

    # Contextualize ambiguous location/campus queries lacking university mentions
    search_q = question
    if any(k in q_lower for k in ["address", "location", "where is it", "reach it", "situated", "pincode"]):
        if not any(k in q_lower for k in ["vit", "vit-ap", "vitap", "srm", "university"]):
            search_q = f"{org_name} {question}"

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

        # Strict Multi-Tenant Isolation
        chunk_doc_id = chunk_data.get("metadata", {}).get("document_id") or chunk_data.get("document_id")
        chunk_org_id = chunk_data.get("metadata", {}).get("organization_id")

        if organization_id is not None:
            if chunk_org_id and chunk_org_id != organization_id:
                continue
            if org_doc_ids is not None and chunk_doc_id not in org_doc_ids:
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

        # Exact faculty name matching & noise reduction for SLMs (prevents blending multiple faculty names)
        query_words = [w for w in re.findall(r'\b[a-zA-Z]{3,}\b', q_lower) if w not in {
            'tell', 'about', 'what', 'where', 'who', 'faculty', 'professor', 'cabin', 
            'number', 'give', 'details', 'info', 'information', 'university', 'please'
        }]
        if query_words:
            def name_score(chunk):
                t = chunk.get("text", "").lower()
                return sum(1 for w in query_words if w in t)
            
            matching = [c for c in candidates if name_score(c) > 0]
            if matching:
                matching.sort(key=name_score, reverse=True)
                candidates = matching[:2]

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
