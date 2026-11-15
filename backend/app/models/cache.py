import uuid
from sqlalchemy import Column, String, Text, Integer, Float, DateTime
from sqlalchemy.sql import func
from app.database.base import Base

class ResponseCache(Base):
    __tablename__ = "response_cache"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    normalized_query = Column(String, index=True, nullable=False)
    query_text = Column(String, nullable=False)
    embedding_json = Column(Text, nullable=False) # Serialized list of floats
    answer = Column(Text, nullable=False)
    response_type = Column(String, default="answer")
    sources_json = Column(Text, default="[]") # Serialized list of source objects
    hit_count = Column(Integer, default=0)
    organization_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

