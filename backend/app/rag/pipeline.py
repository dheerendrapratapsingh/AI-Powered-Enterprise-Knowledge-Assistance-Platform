from app.rag.retriever import retrieve_relevant_chunks
from app.rag.prompt_builder import build_prompt
from app.rag.llm_client import generate_response
from app.rag.intent import classify_query_intent, QueryIntent, is_draft_email_intent
from app.models.user import User

FALLBACK_MESSAGE = "The requested information is not available in the official university documents provided. Please contact your School Dean or Course Coordinator for official assistance and clarification."

def answer_question(question: str, user: User, conversation_history: list = None) -> dict:
    """
    Orchestrates intent-classified question answering.
    Greetings & general conversation bypass FAISS vector retrieval.
    University inquiries are strictly grounded in retrieved documents.
    """
    intent = classify_query_intent(question)
    org_name = user.organization.name if (user and user.organization) else "VIT-AP University"

    # 1. Path A: Greetings & General Conversation (Bypass FAISS)
    if intent in (QueryIntent.GREETING, QueryIntent.GENERAL_CONVERSATION):
        prompt = build_prompt(question, [], conversation_history=conversation_history, intent=intent, org_name=org_name)
        response_data = generate_response(prompt)
        response_data["retrieved_chunks"] = []
        response_data["sources"] = []
        response_data["confidence"] = 1.0
        response_data["response_type"] = "greeting"
        return response_data

    # 2. Path B: Out of Scope Non-University Inquiries (Bypass FAISS)
    if intent == QueryIntent.OUT_OF_SCOPE:
        prompt = build_prompt(question, [], conversation_history=conversation_history, intent=intent, org_name=org_name)
        response_data = generate_response(prompt)
        response_data["retrieved_chunks"] = []
        response_data["sources"] = []
        response_data["confidence"] = 1.0
        response_data["response_type"] = "out_of_scope"
        return response_data

    # 3. Path C: University Knowledge, Document Search & Staff Directory
    chunks = retrieve_relevant_chunks(question, organization_id=user.organization_id if user else None)
    
    allowed_chunks = []
    user_role = (user.role or "STUDENT").upper()
    for c in chunks:
        access = str(c.get("metadata", {}).get("access_level", "student")).lower()
        if user_role == "STUDENT" and access not in ["student", "all"]:
            continue
        allowed_chunks.append(c)
        
    # Handle low confidence or no results
    if not allowed_chunks:
        if not is_draft_email_intent(question):
            fallback = f"The requested information is not available in the official {org_name} documents provided. Please contact your School Dean or Course Coordinator for official assistance and clarification."
            return {
                "answer": fallback,
                "response_type": "insufficient_information",
                "sources": [],
                "retrieved_chunks": [],
                "confidence": 0.0
            }
        
    # Build Context & Grounded RAG Prompt
    prompt = build_prompt(question, allowed_chunks, conversation_history=conversation_history, intent=intent, org_name=org_name)
    
    # Generate Answer
    response_data = generate_response(prompt)
    
    # Attach chunks and compute confidence
    response_data["retrieved_chunks"] = allowed_chunks
    scores = [c["score"] for c in allowed_chunks[:3]]
    response_data["confidence"] = sum(scores) / len(scores) if scores else 0.0
    
    return response_data
