import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.rag.intent import classify_query_intent, QueryIntent
from app.rag.prompt_builder import build_conversational_prompt, build_out_of_scope_prompt, build_streaming_prompt, build_prompt
from app.rag.pipeline import answer_question, FALLBACK_MESSAGE
from app.models.user import User

from unittest.mock import patch

class IntentAndRoutingTests(unittest.TestCase):

    def setUp(self):
        self.mock_user = User(
            id="test-user-id",
            email="student@vitap.ac.in",
            role="STUDENT"
        )

    def test_greetings_classification(self):
        """Verify greetings are classified as GREETING."""
        greetings = [
            "hello", "Hello", "HELLO", "hi", "Hi!", "hey", "Hey there",
            "good morning", "Good morning", "good evening", "Good afternoon", "greetings"
        ]
        for g in greetings:
            intent = classify_query_intent(g)
            self.assertEqual(intent, QueryIntent.GREETING, f"Failed for greeting: '{g}' (got {intent})")

    def test_general_conversation_classification(self):
        """Verify conversational questions are classified as GENERAL_CONVERSATION."""
        conversational = [
            "how are you?", "How are you doing today?", "what can you do?",
            "who are you?", "thank you", "Thanks a lot", "goodbye", "bye"
        ]
        for c in conversational:
            intent = classify_query_intent(c)
            self.assertEqual(intent, QueryIntent.GENERAL_CONVERSATION, f"Failed for conversational: '{c}' (got {intent})")

    def test_university_knowledge_classification(self):
        """Verify university academic/hostel inquiries are classified as UNIVERSITY_KNOWLEDGE."""
        uni_queries = [
            "What are the B.Tech CSE core subjects?",
            "Explain the attendance regulations.",
            "What are the hostel outing rules?",
            "What is the Sunday outing return timing for hostels?",
            "Tell me about the grading system",
            "What are the CSBS programme electives?",
            "How many credits needed for graduation?"
        ]
        for q in uni_queries:
            intent = classify_query_intent(q)
            self.assertEqual(intent, QueryIntent.UNIVERSITY_KNOWLEDGE, f"Failed for university query: '{q}' (got {intent})")

    def test_staff_directory_classification(self):
        """Verify staff/faculty directory inquiries are classified as STAFF_DIRECTORY."""
        staff_queries = [
            "Who is the programme coordinator?",
            "Who is the School Dean?",
            "Where is Dr. Hari Seetha's cabin?",
            "Tell me the contact of the director",
            "faculty cabin list"
        ]
        for s in staff_queries:
            intent = classify_query_intent(s)
            self.assertEqual(intent, QueryIntent.STAFF_DIRECTORY, f"Failed for staff query: '{s}' (got {intent})")

    def test_out_of_scope_classification(self):
        """Verify off-topic non-university queries are classified as OUT_OF_SCOPE."""
        off_topic = [
            "Tell me something unrelated to VIT-AP.",
            "Who won the 2022 FIFA World Cup?",
            "Write a Python script to sort a binary search tree",
            "What is the capital of France?",
            "Explain quantum physics string theory"
        ]
        for o in off_topic:
            intent = classify_query_intent(o)
            self.assertEqual(intent, QueryIntent.OUT_OF_SCOPE, f"Failed for out-of-scope query: '{o}' (got {intent})")

    def test_combined_greeting_and_question_prioritizes_knowledge(self):
        """Verify greeting + question prioritizes the substantive knowledge query."""
        combo = "Hello, what are the B.Tech CSE core subjects?"
        intent = classify_query_intent(combo)
        self.assertEqual(intent, QueryIntent.UNIVERSITY_KNOWLEDGE)

    @patch("app.rag.pipeline.generate_response")
    def test_pipeline_greeting_bypasses_grounding_fallback(self, mock_generate):
        """Verify answering 'Hello' does NOT return the university document fallback message."""
        mock_generate.return_value = {
            "answer": "Hello! Welcome to VIT-AP AI Copilot. How can I help you today?",
            "response_type": "answer",
            "sources": []
        }
        result = answer_question("Hello", self.mock_user)
        self.assertEqual(result.get("response_type"), "greeting")
        self.assertNotEqual(result.get("answer"), FALLBACK_MESSAGE)
        self.assertNotIn("The requested information is not available in the official university documents provided", result.get("answer"))
        self.assertEqual(len(result.get("sources", [])), 0)

    @patch("app.rag.pipeline.generate_response")
    def test_pipeline_what_can_you_do(self, mock_generate):
        """Verify answering 'What can you do?' does NOT return the fallback message."""
        mock_generate.return_value = {
            "answer": "I can help you explore VIT-AP academic regulations, find curriculum information, understand hostel policies, and locate university staff information.",
            "response_type": "answer",
            "sources": []
        }
        result = answer_question("What can you do?", self.mock_user)
        self.assertEqual(result.get("response_type"), "greeting")
        self.assertNotEqual(result.get("answer"), FALLBACK_MESSAGE)
        self.assertNotIn("The requested information is not available in the official university documents provided", result.get("answer"))

    @patch("app.rag.pipeline.generate_response")
    def test_pipeline_out_of_scope_handling(self, mock_generate):
        """Verify out-of-scope query returns out_of_scope response type and polite scoping."""
        mock_generate.return_value = {
            "answer": "I specialize in official VIT-AP university inquiries. You can ask me about academic regulations, curricula, hostel rules, or staff directories.",
            "response_type": "answer",
            "sources": []
        }
        result = answer_question("Tell me something unrelated to VIT-AP.", self.mock_user)
        self.assertEqual(result.get("response_type"), "out_of_scope")
        self.assertNotEqual(result.get("answer"), FALLBACK_MESSAGE)

if __name__ == "__main__":
    unittest.main()
