from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func
from app.database.base import Base
import uuid

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="STUDENT")
    student_id = Column(String, nullable=True)
    department = Column(String, nullable=True)
    program = Column(String, nullable=True)
    batch = Column(String, nullable=True)
    semester = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
