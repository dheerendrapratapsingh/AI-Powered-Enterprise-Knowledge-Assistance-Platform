from sqlalchemy import Column, String, DateTime, ForeignKey, Float, Integer
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.base import Base
import uuid

class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String, ForeignKey("conversations.id"))
    role = Column(String, nullable=False) # 'user' or 'assistant'
    content = Column(String, nullable=False)
    response_type = Column(String, nullable=True) # 'answer', 'workflow', 'clarification', 'insufficient_information'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    conversation = relationship("Conversation", back_populates="messages")
    sources = relationship("MessageSource", back_populates="message", cascade="all, delete-orphan")

class MessageSource(Base):
    __tablename__ = "message_sources"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    message_id = Column(String, ForeignKey("messages.id"))
    document_id = Column(String, ForeignKey("documents.id"))
    page_number = Column(Integer, nullable=True)
    relevance_score = Column(Float, nullable=True)

    message = relationship("Message", back_populates="sources")
    document = relationship("Document")
