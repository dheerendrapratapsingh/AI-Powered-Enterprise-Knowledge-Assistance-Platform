from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
import json
import uuid

from app.database.connection import get_db, SessionLocal
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message, MessageSource
from app.models.feedback import Feedback
from app.schemas.chat import (
    ChatRequest, 
    ChatResponse, 
    Source, 
    FeedbackRequest,
    ConversationOut,
    MessageOut
)
from app.routers.auth import get_current_user
from app.rag.pipeline import answer_question
from app.rag.retriever import retrieve_relevant_chunks
from app.rag.prompt_builder import build_streaming_prompt
from app.rag.ollama_client import stream_response_tokens

router = APIRouter(prefix="/api", tags=["chat"])

@router.post("/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    history = []
    if request.conversation_id:
        conversation = db.query(Conversation).filter(
            Conversation.id == request.conversation_id,
            Conversation.user_id == current_user.id
        ).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Load recent dialogue turns (up to 10 previous messages)
        prev_msgs = db.query(Message).filter(
            Message.conversation_id == conversation.id
        ).order_by(Message.created_at.asc()).limit(10).all()
        for pm in prev_msgs:
            history.append({"role": pm.role, "content": pm.content})
    else:
        conversation = Conversation(user_id=current_user.id, title=request.question[:50])
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    user_msg = Message(conversation_id=conversation.id, role="user", content=request.question)
    db.add(user_msg)
    
    rag_result = answer_question(request.question, current_user, conversation_history=history)
    
    ai_msg = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=rag_result.get("answer", "Error generating response"),
        response_type=rag_result.get("response_type", "answer")
    )
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg)
    
    sources_out = []
    for s in rag_result.get("sources", []):
        src = MessageSource(
            message_id=ai_msg.id,
            document_id=s.get("document_id"),
            page_number=s.get("page")
        )
        db.add(src)
        sources_out.append(Source(
            document_id=s.get("document_id", ""),
            document_name=s.get("document_name", "Unknown"),
            page=s.get("page")
        ))
    db.commit()
    
    return ChatResponse(
        answer=ai_msg.content,
        response_type=ai_msg.response_type,
        sources=sources_out,
        conversation_id=conversation.id,
        message_id=ai_msg.id
    )

@router.post("/chat/stream")
def chat_stream_endpoint(request: ChatRequest, current_user: User = Depends(get_current_user)):
    user_id = current_user.id
    user_role = current_user.role
    question = request.question
    conversation_id = request.conversation_id

    def event_stream():
        db = SessionLocal()
        try:
            # 1. Manage Conversation
            if conversation_id:
                conv = db.query(Conversation).filter(
                    Conversation.id == conversation_id,
                    Conversation.user_id == user_id
                ).first()
                if not conv:
                    yield f"data: {json.dumps({'type': 'error', 'error': 'Conversation not found'})}\n\n"
                    return
            else:
                conv = Conversation(user_id=user_id, title=question[:50])
                db.add(conv)
                db.commit()
                db.refresh(conv)

            # Record user message
            user_msg = Message(conversation_id=conv.id, role="user", content=question)
            db.add(user_msg)
            db.commit()

            # Retrieve prior dialogue history
            history = []
            prev_msgs = db.query(Message).filter(
                Message.conversation_id == conv.id
            ).order_by(Message.created_at.asc()).limit(10).all()
            for pm in prev_msgs:
                history.append({"role": pm.role, "content": pm.content})

            # 2. Retrieve relevant chunks
            chunks = retrieve_relevant_chunks(question)
            allowed_chunks = []
            for c in chunks:
                access = c.get("metadata", {}).get("access_level", "student")
                if user_role == "STUDENT" and access != "student":
                    continue
                allowed_chunks.append(c)

            sources_list = []
            seen_docs = set()
            for c in allowed_chunks:
                doc_id = c.get("metadata", {}).get("document_id", "")
                doc_name = c.get("metadata", {}).get("document_name", "Unknown")
                page = c.get("metadata", {}).get("page")
                key = (doc_id, page)
                if key not in seen_docs:
                    seen_docs.add(key)
                    sources_list.append({
                        "document_id": doc_id,
                        "document_name": doc_name,
                        "page": page
                    })

            ai_message_id = str(uuid.uuid4())

            # Yield metadata packet with sources immediately
            metadata_packet = {
                "type": "metadata",
                "conversation_id": conv.id,
                "message_id": ai_message_id,
                "sources": sources_list
            }
            yield f"data: {json.dumps(metadata_packet)}\n\n"

            if not allowed_chunks:
                fallback_msg = "I couldn't find sufficient information about this in the available VIT-AP knowledge base. Please check the relevant official documents."
                yield f"data: {json.dumps({'type': 'token', 'token': fallback_msg})}\n\n"
                full_answer = fallback_msg
            else:
                # 3. Build streaming prompt & stream tokens
                prompt = build_streaming_prompt(question, allowed_chunks, conversation_history=history)
                collected_tokens = []
                for token in stream_response_tokens(prompt):
                    collected_tokens.append(token)
                    yield f"data: {json.dumps({'type': 'token', 'token': token})}\n\n"
                full_answer = "".join(collected_tokens)

            # 4. Save AI message to database
            ai_msg = Message(
                id=ai_message_id,
                conversation_id=conv.id,
                role="assistant",
                content=full_answer,
                response_type="answer" if allowed_chunks else "insufficient_information"
            )
            db.add(ai_msg)

            for s in sources_list:
                src = MessageSource(
                    message_id=ai_msg.id,
                    document_id=s.get("document_id") or None,
                    page_number=s.get("page")
                )
                db.add(src)
            db.commit()

            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
        finally:
            db.close()

    return StreamingResponse(event_stream(), media_type="text/event-stream")

@router.get("/conversations", response_model=List[ConversationOut])
def list_conversations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Conversation).filter(
        Conversation.user_id == current_user.id
    ).order_by(Conversation.updated_at.desc()).all()

@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageOut])
def get_conversation_messages(conversation_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    messages = db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.created_at.asc()).all()
    results = []
    for m in messages:
        srcs = []
        for s in m.sources:
            doc_name = s.document.name if s.document else "Document"
            srcs.append(Source(
                document_id=s.document_id or "",
                document_name=doc_name,
                page=s.page_number,
                relevance_score=s.relevance_score
            ))
        results.append(MessageOut(
            id=m.id,
            role=m.role,
            content=m.content,
            response_type=m.response_type,
            created_at=m.created_at,
            sources=srcs
        ))
    return results

@router.delete("/conversations/{conversation_id}")
def delete_conversation(conversation_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.delete(conv)
    db.commit()
    return {"status": "success", "message": "Conversation deleted"}

@router.post("/chat/feedback")
def submit_feedback(request: FeedbackRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    msg = db.query(Message).filter(Message.id == request.message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
        
    feedback = Feedback(
        message_id=request.message_id,
        user_id=current_user.id,
        rating=request.rating,
        feedback_type=request.feedback_type,
        comment=request.comment
    )
    db.add(feedback)
    db.commit()
    return {"status": "success", "message": "Feedback recorded"}
