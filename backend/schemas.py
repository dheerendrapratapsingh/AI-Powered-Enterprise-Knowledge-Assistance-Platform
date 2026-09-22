from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr

# Auth Schemas
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class LoginRequest(BaseModel):
    email: str
    password: str

# User Schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str
    org_id: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserInviteRequest(BaseModel):
    name: str
    email: EmailStr
    role: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    status: str
    org_id: Optional[str] = None
    org_name: Optional[str] = None
    avatar_initial: str
    created_at: datetime

    class Config:
        from_attributes = True

# Organization Schemas
class OrgCreate(BaseModel):
    name: str
    slug: str
    plan: Optional[str] = "Enterprise"

class OrgResponse(BaseModel):
    id: str
    name: str
    slug: str
    plan: str
    status: str
    created_at: datetime
    doc_count: Optional[int] = 0
    user_count: Optional[int] = 0

    class Config:
        from_attributes = True

# Document Schemas
class DocumentResponse(BaseModel):
    id: str
    org_id: str
    title: str
    original_filename: str
    file_size_bytes: int
    mime_type: str
    status: str
    chunk_count: int
    vector_count: int
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# RAG & Chat Schemas
class CitationSchema(BaseModel):
    id: str
    docTitle: str
    page: Optional[int] = None
    snippet: str
    relevanceScore: Optional[float] = None

class WorkflowStepSchema(BaseModel):
    stepNumber: int
    title: str = ""
    description: str
    actionUrl: Optional[str] = None
    actionLabel: Optional[str] = None

class WorkflowSchema(BaseModel):
    title: str
    steps: List[WorkflowStepSchema]

class ChatQueryRequest(BaseModel):
    query: str
    session_id: Optional[str] = None
    org_id: Optional[str] = None

class ChatQueryResponse(BaseModel):
    session_id: str
    message_id: str
    content: str
    citations: List[CitationSchema] = []
    workflow: Optional[WorkflowSchema] = None
    related_questions: List[str] = []

class FeedbackRequest(BaseModel):
    message_id: str
    feedback: str  # "like" | "dislike"

class SearchResultItem(BaseModel):
    id: str
    title: str
    docType: str
    dept: str
    matchedChunk: str
    similarity: float
    updatedAt: str
    highlights: List[str] = []

# AI Config Schemas
class AIConfigSchema(BaseModel):
    model: str = "qwen3:8b"
    temperature: float = 0.3
    max_tokens: int = 1024
    language: str = "English"
    citation_mode: str = "always"
    workflow_detection: bool = True
    related_questions: bool = True
    strict_grounding: bool = True
    top_k: int = 5
    chunk_size: int = 500

    class Config:
        from_attributes = True
