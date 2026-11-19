from app.rag.retriever import retrieve_relevant_chunks
from app.rag.prompt_builder import build_prompt
from app.rag.llm_client import generate_response
from app.rag.intent import classify_query_intent, QueryIntent
from app.models.user import User

FALLBACK_MESSAGE = "The requested information is not available in the official university documents provided. Please contact your School Dean or Course Coordinator for official assistance and clarification."

import re

def is_draft_email_intent(question: str) -> bool:
    q_lower = question.lower().strip()
    
    # Exclude questions, complaints, or negative expressions about emails
    negative_patterns = [
        "why", "what i want", "don't want", "dont want", "did not ask", "didn't ask", 
        "no email", "stop writing", "not an email", "why did you", "what did you", "who told you"
    ]
    if any(neg in q_lower for neg in negative_patterns):
        return False
        
    imperative_patterns = [
        r"\b(draft|compose|write|generate|prepare|send)\s+(a\s+|an\s+)?(formal\s+)?(email|mail)\b",
        r"\b(email|mail)\s+(template|draft)\b",
        r"^(draft|compose|write)\s+(an?\s+)?email"
    ]
    return any(re.search(pat, q_lower) for pat in imperative_patterns)

def answer_question(question: str, user: User, conversation_history: list = None) -> dict:
    """
    Orchestrates intent-classified question answering.
    Greetings & general conversation bypass FAISS vector retrieval.
    University inquiries are strictly grounded in retrieved documents.
    """
    intent = classify_query_intent(question)

    # 1. Path A: Greetings & General Conversation (Bypass FAISS)
    if intent in (QueryIntent.GREETING, QueryIntent.GENERAL_CONVERSATION):
        prompt = build_prompt(question, [], conversation_history=conversation_history, intent=intent)
        response_data = generate_response(prompt)
        response_data["retrieved_chunks"] = []
        response_data["sources"] = []
        response_data["confidence"] = 1.0
        response_data["response_type"] = "greeting"
        return response_data

    # 2. Path B: Out of Scope Non-University Inquiries (Bypass FAISS)
    if intent == QueryIntent.OUT_OF_SCOPE:
        prompt = build_prompt(question, [], conversation_history=conversation_history, intent=intent)
        response_data = generate_response(prompt)
        response_data["retrieved_chunks"] = []
        response_data["sources"] = []
        response_data["confidence"] = 1.0
        response_data["response_type"] = "out_of_scope"
        return response_data

    # 3. Path C: University Knowledge, Document Search & Staff Directory
    chunks = retrieve_relevant_chunks(question)
    
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
            return {
                "answer": FALLBACK_MESSAGE,
                "response_type": "insufficient_information",
                "sources": [],
                "retrieved_chunks": [],
                "confidence": 0.0
            }
        
    # Build Context & Grounded RAG Prompt
    prompt = build_prompt(question, allowed_chunks, conversation_history=conversation_history, intent=intent)
    
    # Generate Answer
    response_data = generate_response(prompt)
    
    # Resilient Extractive Fallback: If LLM is rate-limited, offline, or returns service errors,
    # synthesize a grounded answer directly from allowed_chunks
    ans_text = response_data.get("answer", "").strip()
    is_service_error = (
        not ans_text 
        or "currently unavailable" in ans_text.lower()
        or "ai service unavailable" in ans_text.lower()
        or "exhausted" in ans_text.lower()
        or "error (" in ans_text.lower()
    )
    if is_service_error and allowed_chunks:
        # Anti-Hallucination Guard: Ensure retrieved chunks actually contain relevant query keywords
        q_words = [w for w in question.lower().replace("?", "").replace(".", "").split() if len(w) > 3 and w not in ["what", "which", "where", "when", "tell", "about", "details", "explain", "give", "show", "syllabus", "credit", "structure", "courses", "year"]]
        chunk_texts = " ".join([c.get("text", "").lower() for c in allowed_chunks[:3]])
        has_overlap = any(w in chunk_texts for w in q_words)
        top_score = allowed_chunks[0].get("score", 0.0)

        if not has_overlap or top_score < 0.38:
            return {
                "answer": FALLBACK_MESSAGE,
                "response_type": "insufficient_information",
                "sources": [],
                "retrieved_chunks": allowed_chunks,
                "confidence": top_score
            }

        excerpts = []
        for idx, c in enumerate(allowed_chunks[:3], 1):
            name = c.get("metadata", {}).get("document_name", "Official University Document")
            text = c.get("text", "").strip()
            lines = [l.strip() for l in text.split("\n") if l.strip()]
            key_text = "\n".join(lines[:10])
            excerpts.append(f"**From {name}:**\n{key_text}")
            
        extractive_answer = (
            "Based on official university records:\n\n"
            + "\n\n".join(excerpts)
        )
        response_data = {
            "answer": extractive_answer,
            "response_type": "answer",
            "sources": [
                {
                    "document_id": c.get("metadata", {}).get("document_id", ""),
                    "document_name": c.get("metadata", {}).get("document_name", "Unknown"),
                    "page": c.get("metadata", {}).get("page")
                }
                for c in allowed_chunks[:3]
            ]
        }

    # Attach chunks and compute confidence
    response_data["retrieved_chunks"] = allowed_chunks
    scores = [c["score"] for c in allowed_chunks[:3]]
    response_data["confidence"] = sum(scores) / len(scores) if scores else 0.0
    
    return response_data
