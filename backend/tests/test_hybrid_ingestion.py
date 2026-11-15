import os
import unittest
from datetime import datetime
from app.database.connection import SessionLocal
from app.models.document import Document
from app.models.crawler import CrawlConfig, CrawlJob, CrawledPage
from app.services.crawler.security import (
    validate_url_for_ssrf, 
    is_domain_allowed, 
    is_private_ip
)
from app.services.crawler.webpage_extractor import (
    extract_webpage_content, 
    normalize_url
)
from app.services.ingestion.pipeline import IngestionService, compute_text_sha256
from app.rag.extractor import extract_text, extract_text_from_html, extract_text_from_pptx
from app.rag.retriever import retrieve_relevant_chunks, index_manager
from app.rag.intent import classify_query_intent, QueryIntent

class TestHybridKnowledgeIngestion(unittest.TestCase):
    def setUp(self):
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_ssrf_and_domain_security(self):
        """Test SSRF guardrails and domain allowlisting"""
        # Block private IPv4
        self.assertTrue(is_private_ip("127.0.0.1"))
        self.assertTrue(is_private_ip("10.0.0.1"))
        self.assertTrue(is_private_ip("192.168.1.1"))
        self.assertTrue(is_private_ip("169.254.169.254")) # AWS/GCP metadata IP
        
        # Validate SSRF checks
        safe, err = validate_url_for_ssrf("http://127.0.0.1/admin")
        self.assertFalse(safe)
        
        safe, err = validate_url_for_ssrf("http://169.254.169.254/latest/meta-data/")
        self.assertFalse(safe)
        
        # Allowed domain check
        allowed = ["vitap.ac.in"]
        self.assertTrue(is_domain_allowed("https://vitap.ac.in/academics", allowed))
        self.assertTrue(is_domain_allowed("https://vtop.vitap.ac.in/page", allowed))
        self.assertFalse(is_domain_allowed("https://google.com/", allowed))
        self.assertFalse(is_domain_allowed("https://vitap.ac.in.attacker.com/", allowed))

    def test_html_and_pptx_extractors(self):
        """Test extraction for HTML and PPTX"""
        html_sample = """
        <html>
            <head><title>VIT-AP B.Tech CSE</title></head>
            <body>
                <nav><a href="/home">Home</a></nav>
                <main>
                    <h1>B.Tech Computer Science Core</h1>
                    <p>The B.Tech CSE Core curriculum requires 160 credits for graduation.</p>
                    <table>
                        <tr><th>Course Code</th><th>Course Title</th><th>Credits</th></tr>
                        <tr><td>CSE1001</td><td>Problem Solving and Programming</td><td>3</td></tr>
                        <tr><td>CSE2001</td><td>Data Structures and Algorithms</td><td>4</td></tr>
                    </table>
                </main>
                <footer>VIT-AP University 2026</footer>
            </body>
        </html>
        """
        extracted = extract_text_from_html(html_sample)
        self.assertTrue(len(extracted) > 0)
        self.assertIn("B.Tech Computer Science Core", extracted[0]["text"])
        self.assertIn("CSE2001", extracted[0]["text"])

    def test_shared_ingestion_pipeline_direct_text(self):
        """Test that crawled direct text flows through shared IngestionService and into FAISS"""
        test_doc_id = "test-crawler-doc-001"
        
        # Clean any prior test doc
        existing = self.db.query(Document).filter(Document.id == test_doc_id).first()
        if existing:
            index_manager.delete_document(test_doc_id)
            self.db.delete(existing)
            self.db.commit()

        doc = Document(
            id=test_doc_id,
            name="VIT-AP Sunday Hostel Outing Official Policy",
            filename="https://vitap.ac.in/hostel-rules",
            source_type="crawler",
            source_url="https://vitap.ac.in/hostel-rules",
            file_path="https://vitap.ac.in/hostel-rules",
            category="Hostel Rules",
            version="1.0",
            status="PENDING",
            is_active=True
        )
        self.db.add(doc)
        self.db.commit()

        sample_web_text = """
        VIT-AP University Hostel Regulations - Sunday Outing Timings
        Hostel students are permitted for Sunday outing between 8:00 AM and 6:30 PM.
        All students must scan their biometric ID at the main security gate upon return.
        Late return beyond 6:30 PM without prior Warden permission leads to campus curfew reprimand.
        """
        
        result = IngestionService.ingest_direct_text(
            doc_id=test_doc_id,
            text_content=sample_web_text,
            metadata_override={"source_url": "https://vitap.ac.in/hostel-rules"},
            db=self.db
        )
        
        self.assertTrue(result.success)
        self.assertGreater(result.chunk_count, 0)
        
        # Verify FAISS retrieval on this crawled chunk
        retrieved = retrieve_relevant_chunks("What are the Sunday hostel outing return timings?")
        self.assertTrue(len(retrieved) > 0)
        match = any(c.get("metadata", {}).get("document_id") == test_doc_id for c in retrieved)
        self.assertTrue(match)

        # Cleanup
        index_manager.delete_document(test_doc_id)
        self.db.delete(doc)
        self.db.commit()

    def test_intent_routing_preservation(self):
        """Ensure greeting/conversational queries bypass FAISS and university queries route to RAG"""
        self.assertEqual(classify_query_intent("Hello there!"), QueryIntent.GREETING)
        self.assertEqual(classify_query_intent("How are you today?"), QueryIntent.GENERAL_CONVERSATION)
        self.assertEqual(classify_query_intent("What are the core subjects in B.Tech CSE?"), QueryIntent.UNIVERSITY_KNOWLEDGE)
        self.assertEqual(classify_query_intent("Who is Dr. Hari Seetha?"), QueryIntent.STAFF_DIRECTORY)

if __name__ == "__main__":
    unittest.main()
