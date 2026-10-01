from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message, MessageSource
from app.schemas.chat import ChatRequest, ChatResponse, Source
from app.routers.auth import get_current_user
from app.rag.pipeline import answer_question

router = APIRouter(prefix="/api", tags=["chat"])

@router.post("/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if request.conversation_id:
        conversation = db.query(Conversation).filter(
            Conversation.id == request.conversation_id,
            Conversation.user_id == current_user.id
        ).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conversation = Conversation(user_id=current_user.id, title=request.question[:50])
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    user_msg = Message(conversation_id=conversation.id, role="user", content=request.question)
    db.add(user_msg)
    
    rag_result = answer_question(request.question, current_user)
    
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

from app.models.feedback import Feedback
from app.schemas.chat import FeedbackRequest

@router.post("/chat/feedback")
def submit_feedback(request: FeedbackRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify the message exists
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
