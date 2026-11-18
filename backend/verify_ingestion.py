import sys
import os
sys.path.append(os.path.abspath("backend"))

from app.rag.retriever import retrieve_relevant_chunks

queries = [
    "What are the curfew and outing rules in the Hostel Policy?",
    "What courses are in B.Tech Mechanical Core curriculum?",
    "What are the Placement Norms for 2027 batch?",
    "Guntur bus transport schedule and stops"
]

print("=== VERIFYING SEMANTIC RETRIEVAL ===")
for q in queries:
    res = retrieve_relevant_chunks(question=q, top_k=2)
    print(f"\nQuery: {q}")
    for item in res:
        meta = item.get("metadata", {})
        name = meta.get("document_name", "Unknown")
        score = item.get("score")
        text = item.get("text", "").replace("\n", " ")[:150]
        print(f"  -> Match: [{name}] (Cosine Sim: {score:.4f})")
        print(f"     Excerpt: {text}...")
