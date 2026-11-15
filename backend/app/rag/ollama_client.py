"""
Backward-compatible wrapper re-exporting from the hybrid llm_client.
"""
from app.rag.llm_client import (
    check_ollama_health,
    check_gemini_configured,
    generate_response,
    stream_response_tokens
)

__all__ = [
    "check_ollama_health",
    "check_gemini_configured",
    "generate_response",
    "stream_response_tokens"
]
