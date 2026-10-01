from sqlalchemy import Column, String, DateTime, ForeignKey, Integer
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.base import Base
import uuid

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    message_id = Column(String, ForeignKey("messages.id"))
    user_id = Column(String, ForeignKey("users.id"))
    rating = Column(Integer, nullable=False) # e.g., 1 for helpful, -1 for not helpful
    feedback_type = Column(String, nullable=True) # HELPFUL, NOT_HELPFUL, INCORRECT, OUTDATED, MISSING_INFORMATION, WRONG_SOURCE, OTHER
    comment = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    message = relationship("Message")
    user = relationship("User")
