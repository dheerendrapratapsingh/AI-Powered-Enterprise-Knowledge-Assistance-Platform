import os
import sys
import time
import logging
from typing import List, Set
from urllib.parse import urlparse

from app.database.connection import SessionLocal
from app.models.crawler import CrawlConfig, CrawlJob, CrawledPage
from app.models.document import Document
from app.services.crawler.crawler_service import WebsiteCrawler, append_job_log, _crawler_controls, _crawler_logs
from app.services.crawler.webpage_extractor import normalize_url

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("DeepCrawl")

SEED_URLS = [
    "https://vitap.ac.in/",
    "https://vitap.ac.in/allprograms",
    "https://vitap.ac.in/allschools",
    "https://vitap.ac.in/hostels",
    "https://vitap.ac.in/policies",
    "https://vitap.ac.in/academic-research",
    "https://vitap.ac.in/academiccalender",
    "https://vitap.ac.in/fees-and-scholarships",
    "https://vitap.ac.in/transport"
]

def run_deep_crawl(max_pages: int = 50, max_depth: int = 3):
    db = SessionLocal()
    print("=" * 70)
    print("      VIT-AP UNIVERSITY OFFICIAL WEBSITE DEEP CRAWLER & RAG INGESTION")
    print("=" * 70)
    print(f"Target Primary Domain : https://vitap.ac.in/")
    print(f"Max Pages Limit       : {max_pages}")
    print(f"Max Depth Limit       : {max_depth}")
    print(f"Discovery Seeds       : {len(SEED_URLS)} sections")
    print("=" * 70)

    # 1. Ensure or update crawl config
    config = db.query(CrawlConfig).first()
    if not config:
        config = CrawlConfig(
            name="VIT-AP Official Deep Crawler",
            seed_url="https://vitap.ac.in/",
            allowed_domains=["vitap.ac.in"],
            max_depth=max_depth,
            max_pages=max_pages,
            discover_pdfs=True,
            discover_docs=True,
            rate_limit_delay=0.8,
            is_active=True
        )
        db.add(config)
        db.commit()
        db.refresh(config)
    else:
        config.max_pages = max_pages
        config.max_depth = max_depth
        config.discover_pdfs = True
        config.discover_docs = True
        config.rate_limit_delay = 0.8
        db.commit()

    # 2. Create Crawl Job
    job = CrawlJob(
        config_id=config.id,
        status="RUNNING"
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    job_id = job.id
    _crawler_controls[job_id] = {"paused": False, "stopped": False}
    _crawler_logs[job_id] = []

    print(f"\n[+] Created Crawl Job ID: {job_id}")
    print("[+] Initializing crawler worker...")

    crawler = WebsiteCrawler(job_id)
    
    print("[+] Starting recursive crawler and RAG embedding pipeline...\n")
    crawler.run(initial_seeds=SEED_URLS)

    # Refresh job results
    db.refresh(job)
    print("\n" + "=" * 70)
    print("                     DEEP CRAWL SUMMARY RESULTS")
    print("=" * 70)
    print(f"Status             : {job.status}")
    print(f"URLs Discovered    : {job.urls_discovered}")
    print(f"Web Pages Crawled  : {job.pages_crawled}")
    print(f"Documents Indexed  : {job.documents_indexed}")
    print(f"Failed / Skipped   : {job.failed_urls}")
    print(f"Completed At       : {job.finished_at}")
    print("=" * 70)

    # Print top ingested crawled pages
    crawled_docs = db.query(Document).filter(Document.source_type == "crawler").order_by(Document.created_at.desc()).limit(15).all()
    print(f"\nTop Crawled Documents & Web Pages Now In RAG Index ({len(crawled_docs)} shown):")
    for idx, doc in enumerate(crawled_docs, 1):
        print(f"  {idx}. [{doc.status}] {doc.name[:50]} (Chunks: {doc.chunk_count}, URL: {doc.source_url})")

    db.close()

if __name__ == "__main__":
    pages = 50
    if len(sys.argv) > 1:
        try:
            pages = int(sys.argv[1])
        except ValueError:
            pass
    run_deep_crawl(max_pages=pages)
