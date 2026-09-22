import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    plan = Column(String(50), default="Enterprise")  # Starter, Pro, Enterprise
    status = Column(String(50), default="active")     # active, onboarding, suspended
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="organization", cascade="all, delete-orphan")
    ai_config = relationship("AIConfigModel", back_populates="organization", uselist=False, cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=True)  # Nullable for platform_admin
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)          # platform_admin, org_admin, employee
    status = Column(String(50), default="active")       # active, invited, suspended
    avatar_initial = Column(String(2), default="U")
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="users")
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    mime_type = Column(String(100), default="application/pdf")
    file_path = Column(String(500), nullable=False)
    status = Column(String(50), default="uploaded")    # uploaded, extracting, chunking, embedding, indexed, failed
    chunk_count = Column(Integer, default=0)
    vector_count = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id"), nullable=False, index=True)
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False)
    page_number = Column(Integer, nullable=True)
    content = Column(Text, nullable=False)
    token_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="chunks")


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    title = Column(String(255), default="New Conversation")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("chat_sessions.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    role = Column(String(20), nullable=False)           # user, assistant
    content = Column(Text, nullable=False)
    citations_json = Column(Text, nullable=True)        # JSON string of sources
    workflow_json = Column(Text, nullable=True)         # JSON string of workflow steps
    related_questions_json = Column(Text, nullable=True)# JSON string of follow-up questions
    feedback = Column(String(20), nullable=True)        # like, dislike
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("ChatSession", back_populates="messages")


class AIConfigModel(Base):
    __tablename__ = "ai_configs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), unique=True, nullable=False)
    model = Column(String(100), default="qwen3:8b")
    temperature = Column(Float, default=0.3)
    max_tokens = Column(Integer, default=1024)
    language = Column(String(50), default="English")
    citation_mode = Column(String(50), default="always")
    workflow_detection = Column(Boolean, default=True)
    related_questions = Column(Boolean, default=True)
    strict_grounding = Column(Boolean, default=True)
    top_k = Column(Integer, default=5)
    chunk_size = Column(Integer, default=500)

    organization = relationship("Organization", back_populates="ai_config")
