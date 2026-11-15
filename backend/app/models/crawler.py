from sqlalchemy import Column, String, DateTime, Integer, Boolean, Float, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.base import Base
import uuid

class CrawlConfig(Base):
    __tablename__ = "crawl_configs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=True)
    name = Column(String, nullable=False, default="VIT-AP Official Crawler")
    seed_url = Column(String, nullable=False, default="https://vitap.ac.in/")
    allowed_domains = Column(JSON, nullable=False, default=lambda: ["vitap.ac.in"])
    max_depth = Column(Integer, default=3)
    max_pages = Column(Integer, default=100)
    discover_pdfs = Column(Boolean, default=True)
    discover_docs = Column(Boolean, default=True)
    schedule = Column(String, default="manual") # manual, daily, weekly
    rate_limit_delay = Column(Float, default=1.0) # seconds between requests
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    jobs = relationship("CrawlJob", back_populates="config", cascade="all, delete-orphan")


class CrawlJob(Base):
    __tablename__ = "crawl_jobs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    config_id = Column(String, ForeignKey("crawl_configs.id"), nullable=False)
    status = Column(String, default="PENDING") # PENDING, RUNNING, PAUSED, COMPLETED, FAILED, CANCELLED
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    finished_at = Column(DateTime(timezone=True), nullable=True)
    urls_discovered = Column(Integer, default=0)
    pages_crawled = Column(Integer, default=0)
    documents_found = Column(Integer, default=0)
    documents_indexed = Column(Integer, default=0)
    failed_urls = Column(Integer, default=0)
    error_log = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    config = relationship("CrawlConfig", back_populates="jobs")
    pages = relationship("CrawledPage", back_populates="job", cascade="all, delete-orphan")


class CrawledPage(Base):
    __tablename__ = "crawled_pages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String, ForeignKey("crawl_jobs.id"), nullable=False)
    url = Column(String, nullable=False, index=True)
    canonical_url = Column(String, nullable=True)
    title = Column(String, nullable=True)
    depth = Column(Integer, default=0)
    content_hash = Column(String, nullable=True, index=True)
    etag = Column(String, nullable=True)
    last_modified_header = Column(String, nullable=True)
    http_status = Column(Integer, nullable=True)
    content_type = Column(String, nullable=True)
    extracted_text_preview = Column(Text, nullable=True)
    document_id = Column(String, ForeignKey("documents.id"), nullable=True)
    status = Column(String, default="DISCOVERED") # DISCOVERED, FETCHED, INDEXED, SKIPPED_UNCHANGED, FAILED
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    job = relationship("CrawlJob", back_populates="pages")
    document = relationship("Document")
