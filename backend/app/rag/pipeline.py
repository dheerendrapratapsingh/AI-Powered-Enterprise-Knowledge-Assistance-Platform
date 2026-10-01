from app.rag.retriever import retrieve_relevant_chunks
from app.rag.prompt_builder import build_prompt
from app.rag.ollama_client import generate_response
from app.models.user import User

def answer_question(question: str, user: User) -> dict:
    # 1. Retrieve chunks
    chunks = retrieve_relevant_chunks(question)
    
    # 2. Filter by role access
    allowed_chunks = []
    for c in chunks:
        access = c.get("metadata", {}).get("access_level", "student")
        if user.role == "STUDENT" and access != "student":
            continue
        allowed_chunks.append(c)
        
    # 3. Handle low confidence or no results
    if not allowed_chunks:
        return {
            "answer": "I couldn't find sufficient information about this in the available VIT-AP knowledge base. Please check the relevant official documents.",
            "response_type": "insufficient_information",
            "sources": [],
            "retrieved_chunks": [],
            "confidence": 0.0
        }
        
    # 4. Build Context & Prompt
    prompt = build_prompt(question, allowed_chunks)
    
    # 5. Generate
    response_data = generate_response(prompt)
    
    # 6. Format and attach chunks
    response_data["retrieved_chunks"] = allowed_chunks
    scores = [c["score"] for c in allowed_chunks[:3]]
    response_data["confidence"] = sum(scores) / len(scores) if scores else 0.0
    
    return response_data
