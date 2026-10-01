from pydantic import BaseModel
from typing import List, Optional

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
