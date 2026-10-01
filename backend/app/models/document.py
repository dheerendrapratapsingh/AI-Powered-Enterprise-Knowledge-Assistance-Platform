from sqlalchemy import Column, String, DateTime, Integer, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.base import Base
import uuid

class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    filename = Column(String, nullable=False)
    category = Column(String, nullable=True)
    department = Column(String, nullable=True)
    source_type = Column(String, nullable=True)
    version = Column(String, nullable=True)
    file_path = Column(String, nullable=False)
    status = Column(String, default="UPLOADED") # UPLOADED, PROCESSING, INDEXING, READY, FAILED
    uploaded_by = Column(String, ForeignKey("users.id"))
    page_count = Column(Integer, default=0)
    chunk_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    uploader = relationship("User")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")
