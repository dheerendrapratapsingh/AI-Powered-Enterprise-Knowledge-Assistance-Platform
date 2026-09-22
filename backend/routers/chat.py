import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import User, ChatSession, ChatMessage, AIConfigModel
from schemas import (
    ChatQueryRequest,
    ChatQueryResponse,
    CitationSchema,
    WorkflowSchema,
    WorkflowStepSchema,
    FeedbackRequest,
    SearchResultItem,
)
from routers.auth import get_current_user
from services.vector_store import VectorStoreManager
from services.llm_service import LLMService

router = APIRouter(prefix="/chat", tags=["Chat & RAG Assistant"])

@router.post("/query", response_model=ChatQueryResponse)
def query_ai(
    payload: ChatQueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    org_id = payload.org_id or current_user.org_id
    if not org_id:
        raise HTTPException(status_code=400, detail="Organization context required for query")

    # Get org AI settings
    ai_config = db.query(AIConfigModel).filter(AIConfigModel.org_id == org_id).first()
    top_k = ai_config.top_k if ai_config else 5
    model_name = ai_config.model if ai_config else "qwen3:8b"
    temperature = ai_config.temperature if ai_config else 0.3
    strict_grounding = ai_config.strict_grounding if ai_config else True

    # 1. Retrieve top-K relevant chunks from tenant FAISS index
    retrieved_chunks = VectorStoreManager.search(org_id, payload.query, top_k=top_k)

    # 2. Call LLM for answer synthesis
    llm_result = LLMService.generate_response(
        query=payload.query,
        context_chunks=retrieved_chunks,
        model=model_name,
        temperature=temperature,
        strict_grounding=strict_grounding
    )

    # 3. Format citations
    citations = []
    for c in retrieved_chunks:
        citations.append(
            CitationSchema(
                id=c.get("chunk_id", str(len(citations))),
                docTitle=c.get("doc_title", "Verified Knowledge Base"),
                page=c.get("page_number", 1),
                snippet=c.get("content", "")[:260],
                relevanceScore=c.get("similarity_score", 0.85)
            )
        )

    # 4. Detect workflow queries
    workflow = None
    q_lower = payload.query.lower()
    if any(k in q_lower for k in ["how to", "how do i", "steps", "procedure", "deploy", "onboard", "apply"]):
        workflow = WorkflowSchema(
            title=f"Workflow: {payload.query.capitalize()}",
            steps=[
                WorkflowStepSchema(stepNumber=1, title="Review Prerequisites", description="Verify permissions and compliance criteria in documentation."),
                WorkflowStepSchema(stepNumber=2, title="Execute Core Action", description="Follow specific instructions outlined in the official SOP."),
                WorkflowStepSchema(stepNumber=3, title="Verification & Sign-off", description="Confirm successful completion and document change log."),
            ]
        )

    # 5. Suggest related questions
    related = [
        f"Who is the point of contact for {payload.query[:25]}?",
        f"Are there exceptions to this standard procedure?",
        f"Where can I find the official template?"
    ]

    # Save chat session & message
    session_id = payload.session_id
    if not session_id:
        session = ChatSession(
            user_id=current_user.id,
            org_id=org_id,
            title=payload.query[:40]
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        session_id = session.id

    msg = ChatMessage(
        session_id=session_id,
        user_id=current_user.id,
        org_id=org_id,
        role="assistant",
        content=llm_result["content"],
        citations_json=json.dumps([c.model_dump() for c in citations]),
        workflow_json=json.dumps(workflow.model_dump()) if workflow else None,
        related_questions_json=json.dumps(related)
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    return ChatQueryResponse(
        session_id=session_id,
        message_id=msg.id,
        content=msg.content,
        citations=citations,
        workflow=workflow,
        related_questions=related
    )

@router.post("/feedback")
def submit_feedback(
    payload: FeedbackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    msg = db.query(ChatMessage).filter(ChatMessage.id == payload.message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    
    msg.feedback = payload.feedback
    db.commit()
    return {"ok": True, "message": "Feedback recorded"}

@router.get("/search", response_model=List[SearchResultItem])
def search_documents(
    query: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    org_id = current_user.org_id
    if not org_id:
        return []

    chunks = VectorStoreManager.search(org_id, query, top_k=10)
    results = []
    for c in chunks:
        results.append(
            SearchResultItem(
                id=c.get("chunk_id", str(len(results))),
                title=c.get("doc_title", "Document"),
                docType="PDF",
                dept="General",
                matchedChunk=c.get("content", ""),
                similarity=c.get("similarity_score", 0.85),
                updatedAt="Recent",
                highlights=[w for w in query.split() if len(w) > 3]
            )
        )
    return results
