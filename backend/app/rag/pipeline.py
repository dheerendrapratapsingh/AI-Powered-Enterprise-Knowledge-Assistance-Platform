from app.rag.retriever import retrieve_relevant_chunks
from app.rag.prompt_builder import build_prompt
from app.rag.ollama_client import generate_response
from app.models.user import User

FALLBACK_MESSAGE = "The requested information is not available in the official university documents provided. Please contact your School Dean or Course Coordinator for official assistance and clarification."

def is_draft_email_intent(question: str) -> bool:
    q_lower = question.lower()
    return any(k in q_lower for k in [
        "draft an email", "compose an email", "write an email", 
        "draft email", "compose email", "write email", "send an email",
        "email template", "mail template", "draft a mail", "compose a mail"
    ])

def answer_question(question: str, user: User, conversation_history: list = None) -> dict:
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
        if not is_draft_email_intent(question):
            return {
                "answer": FALLBACK_MESSAGE,
                "response_type": "insufficient_information",
                "sources": [],
                "retrieved_chunks": [],
                "confidence": 0.0
            }
        
    # 4. Build Context & Prompt
    prompt = build_prompt(question, allowed_chunks, conversation_history=conversation_history)
    
    # 5. Generate
    response_data = generate_response(prompt)
    
    # 6. Format and attach chunks
    response_data["retrieved_chunks"] = allowed_chunks
    scores = [c["score"] for c in allowed_chunks[:3]]
    response_data["confidence"] = sum(scores) / len(scores) if scores else 0.0
    
    return response_data
