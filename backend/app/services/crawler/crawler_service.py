import os
import time
import shutil
import logging
import threading
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser
from typing import Dict, List, Set, Optional, Tuple
import requests

from app.database.connection import SessionLocal
from app.models.crawler import CrawlConfig, CrawlJob, CrawledPage
from app.models.document import Document
from app.services.crawler.security import (
    is_domain_allowed, 
    validate_url_for_ssrf, 
    MAX_FILE_SIZE_BYTES, 
    REQUEST_TIMEOUT_SECONDS
)
from app.services.crawler.webpage_extractor import (
    extract_webpage_content, 
    normalize_url, 
    ExtractedWebPage
)
from app.services.ingestion.pipeline import IngestionService, compute_text_sha256, compute_sha256
from app.config import settings

logger = logging.getLogger(__name__)

# Active background crawling threads & control flags
_crawler_threads: Dict[str, threading.Thread] = {}
_crawler_controls: Dict[str, Dict[str, bool]] = {} # job_id -> {"paused": bool, "stopped": bool}
_crawler_logs: Dict[str, List[str]] = {} # job_id -> list of recent log messages

def append_job_log(job_id: str, message: str):
    timestamp = time.strftime("%H:%M:%S")
    entry = f"[{timestamp}] {message}"
    if job_id not in _crawler_logs:
        _crawler_logs[job_id] = []
    _crawler_logs[job_id].append(entry)
    if len(_crawler_logs[job_id]) > 300:
        _crawler_logs[job_id].pop(0)

class WebsiteCrawler:
    def __init__(self, job_id: str):
        self.job_id = job_id
        self.db = SessionLocal()
        self.job = self.db.query(CrawlJob).filter(CrawlJob.id == job_id).first()
        self.config = self.job.config if self.job else None
        
        # State tracking
        self.visited_urls: Set[str] = set()
        self.discovered_urls: Set[str] = set()
        self.downloaded_doc_hashes: Set[str] = set()
        self.robot_parsers: Dict[str, RobotFileParser] = {}

    def is_paused(self) -> bool:
        ctrl = _crawler_controls.get(self.job_id, {})
        return ctrl.get("paused", False)

    def is_stopped(self) -> bool:
        ctrl = _crawler_controls.get(self.job_id, {})
        return ctrl.get("stopped", False)

    def get_robot_parser(self, base_url: str) -> Optional[RobotFileParser]:
        parsed = urlparse(base_url)
        host_key = f"{parsed.scheme}://{parsed.netloc}"
        if host_key in self.robot_parsers:
            return self.robot_parsers[host_key]

        try:
            robots_url = f"{host_key}/robots.txt"
            rp = RobotFileParser()
            rp.set_url(robots_url)
            rp.read()
            self.robot_parsers[host_key] = rp
            return rp
        except Exception:
            return None

    def can_fetch_url(self, url: str) -> bool:
        rp = self.get_robot_parser(url)
        if not rp:
            return True
        try:
            return rp.can_fetch("VITAP-Copilot-Crawler", url)
        except Exception:
            return True

    def download_document_file(self, doc_url: str, parent_page_url: str) -> Optional[str]:
        """
        Securely downloads discovered PDF/DOCX/XLSX files, validates size,
        and saves into the upload directory for unified pipeline processing.
        """
        valid, msg = validate_url_for_ssrf(doc_url)
        if not valid:
            append_job_log(self.job_id, f"Skipping doc (SSRF check): {doc_url} ({msg})")
            return None

        allowed = is_domain_allowed(doc_url, self.config.allowed_domains)
        if not allowed:
            append_job_log(self.job_id, f"Skipping doc (Disallowed domain): {doc_url}")
            return None

        try:
            headers = {"User-Agent": "VITAP-Copilot-Crawler/1.0 (+https://vitap.ac.in)"}
            with requests.get(doc_url, headers=headers, stream=True, timeout=REQUEST_TIMEOUT_SECONDS) as resp:
                if resp.status_code != 200:
                    return None

                content_len = resp.headers.get("content-length")
                if content_len and int(content_len) > MAX_FILE_SIZE_BYTES:
                    append_job_log(self.job_id, f"Document exceeds 25MB limit: {doc_url}")
                    return None

                filename = os.path.basename(urlparse(doc_url).path)
                if not filename or "." not in filename:
                    filename = f"crawled_{int(time.time())}.pdf"

                ext = os.path.splitext(filename)[1].lower()
                safe_name = f"crawl_{int(time.time())}_{filename}"
                staging_path = os.path.join(settings.UPLOAD_DIR, safe_name)
                os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

                total_downloaded = 0
                with open(staging_path, "wb") as f:
                    for chunk in resp.iter_content(chunk_size=32768):
                        total_downloaded += len(chunk)
                        if total_downloaded > MAX_FILE_SIZE_BYTES:
                            f.close()
                            os.remove(staging_path)
                            append_job_log(self.job_id, f"Download exceeded max limit: {doc_url}")
                            return None
                        f.write(chunk)

                return staging_path
        except Exception as e:
            append_job_log(self.job_id, f"Failed downloading {doc_url}: {e}")
            return None

    def run(self):
        """
        Main crawling loop adhering to depth limit, max pages, rate limiting,
        SSRF controls, and incremental deduplication.
        """
        append_job_log(self.job_id, f"Starting crawl job {self.job_id} for {self.config.seed_url}")
        self.job.status = "RUNNING"
        self.db.commit()

        # Queue items: (url, current_depth)
        queue: List[Tuple[str, int]] = [(normalize_url(self.config.seed_url), 0)]
        self.discovered_urls.add(queue[0][0])
        self.job.urls_discovered = 1
        self.db.commit()

        session = requests.Session()
        session.headers.update({"User-Agent": "VITAP-Copilot-Crawler/1.0 (VIT-AP AI Copilot Ingestion; info@vitap.ac.in)"})

        while queue and len(self.visited_urls) < self.config.max_pages:
            # Check pause / stop controls
            while self.is_paused():
                self.job.status = "PAUSED"
                self.db.commit()
                time.sleep(1)

            if self.is_stopped():
                self.job.status = "CANCELLED"
                append_job_log(self.job_id, "Crawl stopped by administrator.")
                break

            current_url, depth = queue.pop(0)
            if current_url in self.visited_urls:
                continue

            self.visited_urls.add(current_url)

            # 1. Validate SSRF & Domain allowlist
            valid_ssrf, ssrf_msg = validate_url_for_ssrf(current_url)
            if not valid_ssrf:
                append_job_log(self.job_id, f"SSRF Block: {current_url} ({ssrf_msg})")
                continue

            if not is_domain_allowed(current_url, self.config.allowed_domains):
                continue

            # 2. Check robots.txt
            if not self.can_fetch_url(current_url):
                append_job_log(self.job_id, f"Robots.txt disallowed: {current_url}")
                continue

            # 3. Fetch Page with Incremental headers
            crawled_record = self.db.query(CrawledPage).filter(CrawledPage.url == current_url).first()
            headers = {}
            if crawled_record:
                if crawled_record.etag:
                    headers["If-None-Match"] = crawled_record.etag
                if crawled_record.last_modified_header:
                    headers["If-Modified-Since"] = crawled_record.last_modified_header

            append_job_log(self.job_id, f"Fetching [depth={depth}]: {current_url}")

            try:
                resp = session.get(current_url, headers=headers, timeout=REQUEST_TIMEOUT_SECONDS, allow_redirects=True)
            except Exception as e:
                append_job_log(self.job_id, f"Request error for {current_url}: {e}")
                self.job.failed_urls += 1
                self.db.commit()
                continue

            # 4. Handle 304 Not Modified (Incremental Skipping)
            if resp.status_code == 304:
                append_job_log(self.job_id, f"Page unchanged (HTTP 304): {current_url}")
                if crawled_record:
                    crawled_record.status = "SKIPPED_UNCHANGED"
                    self.db.commit()
                continue

            if resp.status_code != 200:
                append_job_log(self.job_id, f"HTTP {resp.status_code} for {current_url}")
                self.job.failed_urls += 1
                self.db.commit()
                continue

            content_type = resp.headers.get("content-type", "").lower()
            etag = resp.headers.get("etag")
            last_mod = resp.headers.get("last-modified")

            # 5. Extract Web Page Content
            if "text/html" in content_type:
                page_data = extract_webpage_content(resp.text, current_url)
                text_hash = compute_text_sha256(page_data.clean_markdown)

                # Check if content has changed since previous crawl
                if crawled_record and crawled_record.content_hash == text_hash:
                    append_job_log(self.job_id, f"Content identical (hash match): {current_url}")
                    crawled_record.status = "SKIPPED_UNCHANGED"
                    self.db.commit()
                else:
                    # Ingest or update document in RAG index
                    # If previously indexed, replace/reprocess
                    doc = None
                    if crawled_record and crawled_record.document_id:
                        doc = self.db.query(Document).filter(Document.id == crawled_record.document_id).first()

                    if not doc:
                        doc = Document(
                            name=page_data.title or current_url,
                            filename=f"web_{int(time.time())}.md",
                            source_type="crawler",
                            source_url=current_url,
                            file_path=current_url,
                            category="Website Knowledge",
                            access_level="STUDENT",
                            status="INDEXING"
                        )
                        self.db.add(doc)
                        self.db.commit()
                        self.db.refresh(doc)
                    else:
                        doc.name = page_data.title or current_url

                    ingest_res = IngestionService.ingest_direct_text(
                        doc.id,
                        page_data.clean_markdown,
                        metadata_override={
                            "document_name": doc.name,
                            "source_url": current_url,
                            "source_type": "crawler"
                        },
                        db=self.db
                    )

                    if not crawled_record:
                        crawled_record = CrawledPage(
                            job_id=self.job_id,
                            url=current_url,
                            canonical_url=page_data.canonical_url,
                            title=page_data.title,
                            depth=depth,
                            content_hash=text_hash,
                            etag=etag,
                            last_modified_header=last_mod,
                            http_status=resp.status_code,
                            content_type=content_type,
                            extracted_text_preview=page_data.clean_markdown[:400],
                            document_id=doc.id,
                            status="INDEXED" if ingest_res.success else "FAILED"
                        )
                        self.db.add(crawled_record)
                    else:
                        crawled_record.title = page_data.title
                        crawled_record.content_hash = text_hash
                        crawled_record.etag = etag
                        crawled_record.last_modified_header = last_mod
                        crawled_record.status = "INDEXED" if ingest_res.success else "FAILED"
                        crawled_record.extracted_text_preview = page_data.clean_markdown[:400]

                    if ingest_res.success:
                        self.job.documents_indexed += 1
                        append_job_log(self.job_id, f"Indexed web page ({ingest_res.chunk_count} chunks): {page_data.title[:45]}")

                    self.job.pages_crawled += 1
                    self.db.commit()

                # 6. Document Link Discovery (PDF, DOCX, XLSX)
                if self.config.discover_pdfs or self.config.discover_docs:
                    for doc_url in page_data.document_links:
                        if doc_url not in self.discovered_urls:
                            self.discovered_urls.add(doc_url)
                            self.job.documents_found += 1
                            self.job.urls_discovered += 1
                            append_job_log(self.job_id, f"Discovered document: {doc_url}")

                            # Download & Ingest Document
                            staged_file = self.download_document_file(doc_url, current_url)
                            if staged_file:
                                doc_name = os.path.basename(urlparse(doc_url).path)
                                new_doc = Document(
                                    name=doc_name,
                                    filename=os.path.basename(staged_file),
                                    source_type="crawler",
                                    source_url=doc_url,
                                    category="Institutional Documents",
                                    access_level="STUDENT",
                                    file_path=staged_file,
                                    status="INDEXING"
                                )
                                self.db.add(new_doc)
                                self.db.commit()
                                self.db.refresh(new_doc)

                                doc_ingest = IngestionService.ingest_file(new_doc.id, staged_file, db=self.db)
                                if doc_ingest.success and not doc_ingest.is_duplicate:
                                    self.job.documents_indexed += 1
                                    append_job_log(self.job_id, f"Indexed document ({doc_ingest.chunk_count} chunks): {doc_name}")
                                elif doc_ingest.is_duplicate:
                                    append_job_log(self.job_id, f"Skipped duplicate doc: {doc_name}")
                                self.db.commit()

                # 7. Add discovered internal links to queue if within depth limit
                if depth + 1 <= self.config.max_depth:
                    for link in page_data.internal_links:
                        if link not in self.discovered_urls and len(self.discovered_urls) < self.config.max_pages * 2:
                            self.discovered_urls.add(link)
                            queue.append((link, depth + 1))
                            self.job.urls_discovered += 1

                self.db.commit()

            # Rate limit delay between requests to be polite to university servers
            time.sleep(self.config.rate_limit_delay or 1.0)

        # Job completed
        if self.job.status != "CANCELLED":
            self.job.status = "COMPLETED"
        self.job.finished_at = time.strftime("%Y-%m-%d %H:%M:%S")
        self.job.error_log = "\n".join(_crawler_logs.get(self.job_id, [])[-50:])
        self.db.commit()
        append_job_log(self.job_id, f"Crawl finished. Pages: {self.job.pages_crawled}, Indexed: {self.job.documents_indexed}")
        self.db.close()


def launch_crawl_job(job_id: str) -> None:
    """Spawns an asynchronous background thread for the crawling job."""
    _crawler_controls[job_id] = {"paused": False, "stopped": False}
    _crawler_logs[job_id] = []

    def worker():
        crawler = WebsiteCrawler(job_id)
        crawler.run()

    thread = threading.Thread(target=worker, daemon=True)
    _crawler_threads[job_id] = thread
    thread.start()

def pause_crawl_job(job_id: str) -> bool:
    if job_id in _crawler_controls:
        _crawler_controls[job_id]["paused"] = True
        return True
    return False

def resume_crawl_job(job_id: str) -> bool:
    if job_id in _crawler_controls:
        _crawler_controls[job_id]["paused"] = False
        return True
    return False

def stop_crawl_job(job_id: str) -> bool:
    if job_id in _crawler_controls:
        _crawler_controls[job_id]["stopped"] = True
        return True
    return False

def get_job_logs(job_id: str) -> List[str]:
    return _crawler_logs.get(job_id, [])
