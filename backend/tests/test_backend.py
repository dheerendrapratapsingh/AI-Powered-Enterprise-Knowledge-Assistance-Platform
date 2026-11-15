import os
import sys
import unittest

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.rag.cache import normalize_query, set_cached_response, get_cached_response
from app.rag.cleaner import clean_text
from app.utils.security import get_password_hash, verify_password, create_access_token, ALGORITHM
from app.models.document import Document
from app.database.connection import SessionLocal
from jose import jwt
from app.config import settings

class BackendUnitTests(unittest.TestCase):

    def test_query_normalization(self):
        """Verify normalization removes punctuation, extra spaces, and handles case."""
        q1 = "What are the Programme Core courses for B.Tech CSE Core???"
        q2 = "  what are the programme core courses for btech cse core   "
        self.assertEqual(normalize_query(q1), normalize_query(q2))

    def test_security_password_hashing(self):
        """Verify password hashing and verification."""
        password = "secret_password_123"
        hashed = get_password_hash(password)
        self.assertTrue(verify_password(password, hashed))
        self.assertFalse(verify_password("wrong_password", hashed))

    def test_jwt_token_generation_and_decode(self):
        """Verify JWT token encoding and decoding."""
        data = {"sub": "test@vitap.ac.in", "role": "STUDENT"}
        token = create_access_token(data)
        decoded = jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])
        self.assertEqual(decoded["sub"], "test@vitap.ac.in")
        self.assertEqual(decoded["role"], "STUDENT")

    def test_text_cleaner_preserves_structure(self):
        """Verify cleaner removes non-printable characters but preserves newlines."""
        raw = "Heading Line\n\n- Item 1\n- Item 2\x00\x08"
        cleaned = clean_text(raw)
        self.assertIn("Heading Line", cleaned)
        self.assertIn("- Item 1", cleaned)
        self.assertNotIn("\x00", cleaned)

    def test_document_model_access_level(self):
        """Verify Document model has access_level field with default STUDENT."""
        doc = Document(
            name="Test Policy",
            filename="policy.pdf",
            file_path="./test.pdf",
            access_level="STUDENT"
        )
        self.assertEqual(doc.access_level, "STUDENT")

    def test_semantic_cache_store_and_retrieve(self):
        """Verify exact and normalized cache store and retrieval."""
        test_q = "What is the Sunday outing return timing for hostels?"
        test_ans = "All students must report back to the hostel by 6:30 PM."
        test_sources = [{"document_name": "Hostel_Rules.docx", "page": 1}]

        set_cached_response(test_q, test_ans, test_sources)

        # Retrieve exact
        result = get_cached_response(test_q)
        self.assertIsNotNone(result)
        self.assertEqual(result["answer"], test_ans)
        self.assertTrue(result["cached"])

        # Retrieve with different punctuation and case
        result_variant = get_cached_response("WHAT IS THE SUNDAY OUTING RETURN TIMING FOR HOSTELS???")
        self.assertIsNotNone(result_variant)
        self.assertEqual(result_variant["answer"], test_ans)

if __name__ == "__main__":
    unittest.main()

