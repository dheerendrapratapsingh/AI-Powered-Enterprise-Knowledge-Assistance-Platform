from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Any
from pydantic import BaseModel
from datetime import datetime

from app.database.connection import get_db
from app.models.user import User
from app.models.crawler import CrawlConfig, CrawlJob, CrawledPage
from app.routers.auth import require_admin
from app.services.crawler.crawler_service import (
    launch_crawl_job,
    pause_crawl_job,
    resume_crawl_job,
    stop_crawl_job,
    get_job_logs
)
from app.services.crawler.security import is_domain_allowed, validate_url_for_ssrf

router = APIRouter(prefix="/api/admin/crawler", tags=["admin-crawler"])

class CrawlConfigRequest(BaseModel):
    name: Optional[str] = "VIT-AP Official Crawler"
    seed_url: str = "https://vitap.ac.in/"
    allowed_domains: List[str] = ["vitap.ac.in"]
    max_depth: int = 3
    max_pages: int = 100
    discover_pdfs: bool = True
    discover_docs: bool = True
    schedule: str = "manual"
    rate_limit_delay: float = 1.0
    is_active: bool = True

@router.get("/config")
def get_or_create_config(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    config = db.query(CrawlConfig).first()
    if not config:
        config = CrawlConfig(
            name="VIT-AP Official Crawler",
            seed_url="https://vitap.ac.in/",
            allowed_domains=["vitap.ac.in"],
            max_depth=3,
            max_pages=100,
            discover_pdfs=True,
            discover_docs=True,
            schedule="manual",
            rate_limit_delay=1.0,
            is_active=True
        )
        db.add(config)
        db.commit()
        db.refresh(config)
    return config

@router.post("/config")
def save_config(req: CrawlConfigRequest, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    # Validate seed URL SSRF & domain
    is_safe, ssrf_err = validate_url_for_ssrf(req.seed_url)
    if not is_safe:
        raise HTTPException(status_code=400, detail=f"Invalid seed URL: {ssrf_err}")

    config = db.query(CrawlConfig).first()
    if not config:
        config = CrawlConfig()
        db.add(config)

    config.name = req.name
    config.seed_url = req.seed_url
    config.allowed_domains = req.allowed_domains
    config.max_depth = max(1, min(req.max_depth, 10))
    config.max_pages = max(1, min(req.max_pages, 1000))
    config.discover_pdfs = req.discover_pdfs
    config.discover_docs = req.discover_docs
    config.schedule = req.schedule
    config.rate_limit_delay = max(0.2, min(req.rate_limit_delay, 10.0))
    config.is_active = req.is_active

    db.commit()
    db.refresh(config)
    return config

@router.post("/start")
def start_crawl(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    # Check if a crawl job is currently running
    active_job = db.query(CrawlJob).filter(CrawlJob.status.in_(["RUNNING", "PENDING"])).first()
    if active_job:
        return {"status": "already_running", "job_id": active_job.id, "message": "A crawl job is already in progress"}

    config = db.query(CrawlConfig).first()
    if not config:
        config = CrawlConfig()
        db.add(config)
        db.commit()
        db.refresh(config)

    job = CrawlJob(
        config_id=config.id,
        status="RUNNING"
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Launch background crawling worker
    launch_crawl_job(job.id)

    return {"status": "started", "job_id": job.id, "job": job}

@router.post("/pause/{job_id}")
def pause_crawl(job_id: str, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    job = db.query(CrawlJob).filter(CrawlJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status == "RUNNING":
        pause_crawl_job(job_id)
        job.status = "PAUSED"
        db.commit()
        return {"status": "paused", "job_id": job_id}

    return {"status": job.status, "job_id": job_id}

@router.post("/resume/{job_id}")
def resume_crawl(job_id: str, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    job = db.query(CrawlJob).filter(CrawlJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status == "PAUSED":
        resume_crawl_job(job_id)
        job.status = "RUNNING"
        db.commit()
        return {"status": "resumed", "job_id": job_id}

    return {"status": job.status, "job_id": job_id}

@router.post("/stop/{job_id}")
def stop_crawl(job_id: str, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    job = db.query(CrawlJob).filter(CrawlJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    stop_crawl_job(job_id)
    job.status = "CANCELLED"
    job.finished_at = datetime.utcnow()
    db.commit()
    return {"status": "cancelled", "job_id": job_id}

@router.get("/jobs")
def list_jobs(limit: int = 15, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return db.query(CrawlJob).order_by(CrawlJob.created_at.desc()).limit(limit).all()

@router.get("/jobs/{job_id}")
def get_job(job_id: str, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    job = db.query(CrawlJob).filter(CrawlJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.get("/jobs/{job_id}/logs")
def get_logs(job_id: str, current_user: User = Depends(require_admin)):
    logs = get_job_logs(job_id)
    return {"job_id": job_id, "logs": logs}

@router.get("/pages")
def list_crawled_pages(
    job_id: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    query = db.query(CrawledPage)
    if job_id:
        query = query.filter(CrawledPage.job_id == job_id)
    if status:
        query = query.filter(CrawledPage.status == status)

    total = query.count()
    pages = query.order_by(CrawledPage.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "pages": pages
    }
