from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ChatRequest(BaseModel):
    question: str
    conversation_id: Optional[str] = None

class Source(BaseModel):
    document_id: str
    document_name: str
    page: Optional[int] = None
    relevance_score: Optional[float] = None

class ChatResponse(BaseModel):
    answer: str
    response_type: str
    sources: List[Source] = []
    conversation_id: str
    message_id: str

class FeedbackRequest(BaseModel):
    message_id: str
    rating: int
    feedback_type: Optional[str] = None
    comment: Optional[str] = None

class MessageOut(BaseModel):
    id: str
    role: str
    content: str
    response_type: Optional[str] = None
    created_at: Optional[datetime] = None
    sources: List[Source] = []

    class Config:
        from_attributes = True

class ConversationOut(BaseModel):
    id: str
    title: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
