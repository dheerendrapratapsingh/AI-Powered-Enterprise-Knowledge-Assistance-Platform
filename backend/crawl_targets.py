import os
import sys
import time
import shutil
import requests
from urllib.parse import urljoin, urlparse

# Ensure backend root is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.connection import SessionLocal
from app.models.document import Document
from app.services.crawler.webpage_extractor import extract_webpage_content
from app.services.ingestion.pipeline import IngestionService
from app.rag.index_manager import IndexManager

VITAP_ORG_ID = "cfb91311-2e8c-40bb-a1a0-c3e751c3bd96"

TARGET_MAP = {
    "https://vitap.ac.in/allschools": "VIT-AP All Schools & Academic Divisions",
    "https://vitap.ac.in/cdc-overview": "VIT-AP Career Development Centre (CDC) Overview",
    "https://vitap.ac.in/clubs-and-chapters": "VIT-AP Student Clubs and Chapters",
    "https://vitap.ac.in/cafeteria": "VIT-AP Cafeteria, Food Outlets & Dining Facilities",
    "https://vitap.ac.in/vchance": "VIT-AP V-CHANCE Flexible Curriculum System",
    "https://vitap.ac.in/cdc-statistics": "VIT-AP CDC Placement Statistics & Highlights",
    "https://vitap.ac.in/ecs": "VIT-AP Engineering Clinics & Studio (ECS) Programme"
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
}

def crawl_and_index():
    db = SessionLocal()
    download_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "crawler_downloads")
    os.makedirs(download_dir, exist_ok=True)

    print("=== Starting Crawl & Ingestion for VIT-AP Targets ===")
    total_pages = 0
    total_docs = 0

    for url, fallback_title in TARGET_MAP.items():
        print(f"\n[Crawling Webpage]: {url}")
        try:
            resp = requests.get(url, headers=HEADERS, timeout=20, verify=True)
            if resp.status_code != 200:
                print(f"  ❌ Failed with HTTP {resp.status_code}")
                continue

            extracted = extract_webpage_content(resp.text, url)
            title = fallback_title
            content_text = extracted.clean_markdown or extracted.raw_text
            print(f"  Title: {title}")
            print(f"  Text length: {len(content_text)} chars, Discovered doc links: {len(extracted.document_links)}")

            # Check if Document already exists
            existing_doc = db.query(Document).filter(
                Document.source_url == url,
                Document.organization_id == VITAP_ORG_ID
            ).first()

            if not existing_doc:
                existing_doc = Document(
                    name=title,
                    filename=f"web_{int(time.time())}_{url.rstrip('/').split('/')[-1]}.md",
                    source_type="crawler",
                    source_url=url,
                    file_path=url,
                    organization_id=VITAP_ORG_ID,
                    category="Website Knowledge",
                    access_level="STUDENT",
                    status="INDEXING"
                )
                db.add(existing_doc)
                db.commit()
                db.refresh(existing_doc)
            else:
                existing_doc.name = title
                existing_doc.status = "INDEXING"
                db.commit()

            metadata_override = {
                "document_name": title,
                "category": "Website Knowledge",
                "access_level": "STUDENT",
                "source_url": url,
                "source_type": "crawler",
                "organization_id": VITAP_ORG_ID
            }

            # Ingest webpage text into RAG index
            res = IngestionService.ingest_direct_text(
                doc_id=existing_doc.id,
                text_content=content_text,
                metadata_override=metadata_override,
                db=db
            )
            print(f"  ✅ Webpage Indexed: success={res.success}, chunks={res.chunk_count}")
            total_pages += 1

            # Ingest discovered PDFs/docs on this page (up to 5 per page)
            for doc_link in list(extracted.document_links)[:5]:
                full_doc_url = urljoin(url, doc_link)
                if not any(full_doc_url.lower().endswith(ext) for ext in [".pdf", ".docx", ".xlsx"]):
                    continue
                
                doc_filename = os.path.basename(urlparse(full_doc_url).path)
                if not doc_filename:
                    continue

                local_path = os.path.join(download_dir, doc_filename)
                print(f"    [Discovered Document]: {full_doc_url}")
                try:
                    doc_resp = requests.get(full_doc_url, headers=HEADERS, timeout=25, stream=True)
                    if doc_resp.status_code == 200:
                        with open(local_path, "wb") as f:
                            for chunk in doc_resp.iter_content(chunk_size=16384):
                                f.write(chunk)
                        
                        pdf_doc = db.query(Document).filter(
                            Document.source_url == full_doc_url,
                            Document.organization_id == VITAP_ORG_ID
                        ).first()

                        if not pdf_doc:
                            pdf_doc = Document(
                                name=doc_filename.replace("_", " ").replace(".pdf", ""),
                                filename=doc_filename,
                                source_type="crawler",
                                source_url=full_doc_url,
                                file_path=local_path,
                                organization_id=VITAP_ORG_ID,
                                category="Institutional Documents",
                                access_level="STUDENT",
                                status="INDEXING"
                            )
                            db.add(pdf_doc)
                            db.commit()
                            db.refresh(pdf_doc)

                        pdf_res = IngestionService.ingest_file(pdf_doc.id, local_path, db=db)
                        print(f"    ✅ PDF/Doc Indexed: {doc_filename} (chunks={pdf_res.chunk_count})")
                        total_docs += 1
                except Exception as ex_pdf:
                    print(f"    ⚠️ Could not ingest PDF {full_doc_url}: {ex_pdf}")

        except Exception as e:
            print(f"  ❌ Error crawling {url}: {e}")

    db.close()
    print(f"\n=== Finished Crawling: {total_pages} pages, {total_docs} PDFs indexed. ===")

    # Sync copilot.db to root
    backend_db = os.path.join(os.path.dirname(os.path.abspath(__file__)), "copilot.db")
    root_db = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "copilot.db")
    if os.path.exists(backend_db):
        shutil.copy2(backend_db, root_db)
        print("✅ Synced backend/copilot.db to root copilot.db")

if __name__ == "__main__":
    crawl_and_index()
