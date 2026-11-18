import sys
import os
sys.path.append(os.path.abspath("backend"))

from app.rag.retriever import retrieve_relevant_chunks

benchmarks = [
    "tell me about vit's transport things",
    "What courses are in B.Tech Mechanical Engineering core?",
    "What are the Sunday outing and night curfew timings in hostel?",
    "What are the 2X CTC criteria in placement norms 2027 batch?",
    "What is the minimum attendance percentage required for exams?"
]

print("=== BENCHMARK RETRIEVAL ACCURACY TEST ===")
for q in benchmarks:
    chunks = retrieve_relevant_chunks(q, top_k=2)
    print(f"\n[Query]: {q}")
    for i, c in enumerate(chunks, 1):
        meta = c.get("metadata", {})
        name = meta.get("document_name", "Unknown")
        cat = meta.get("category", "Unknown")
        score = c.get("score", 0)
        snippet = c.get("text", "").replace("\n", " ")[:130]
        print(f"  #{i} [{name}] ({cat}) -> Score: {score:.4f}")
        print(f"     \"{snippet}...\"")
