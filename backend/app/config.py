import os
from pydantic import model_validator
from pydantic_settings import BaseSettings

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CANONICAL_DB_PATH = os.path.join(BACKEND_DIR, 'copilot.db').replace('\\', '/')

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{CANONICAL_DB_PATH}")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "your_jwt_secret_key_here")

    # Cloud LLM Engine (Google Gemini - Zero GPU required)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")

    # Local LLM Fallback (Ollama)
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "qwen2.5:1.5b")

    # Semantic Cache Configuration (< 50ms response for frequent queries)
    ENABLE_SEMANTIC_CACHE: bool = os.getenv("ENABLE_SEMANTIC_CACHE", "true").lower() in ("true", "1", "yes")
    CACHE_SIMILARITY_THRESHOLD: float = float(os.getenv("CACHE_SIMILARITY_THRESHOLD", "0.88"))

    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    TOP_K: int = int(os.getenv("TOP_K", "3"))
    SIMILARITY_THRESHOLD: float = float(os.getenv("SIMILARITY_THRESHOLD", "0.20"))
    MAX_CONTEXT_CHUNKS: int = int(os.getenv("MAX_CONTEXT_CHUNKS", "5"))
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", os.path.join(BACKEND_DIR, "data", "documents"))
    FAISS_DIR: str = os.getenv("FAISS_DIR", os.path.join(BACKEND_DIR, "data", "indexes"))

    @model_validator(mode="after")
    def resolve_paths(self):
        backend_idx = os.path.join(BACKEND_DIR, "data", "indexes")
        if not os.path.exists(os.path.join(self.FAISS_DIR, "vitap.index")) and os.path.exists(os.path.join(backend_idx, "vitap.index")):
            self.FAISS_DIR = backend_idx
        backend_up = os.path.join(BACKEND_DIR, "data", "documents")
        if not os.path.exists(self.UPLOAD_DIR) and os.path.exists(backend_up):
            self.UPLOAD_DIR = backend_up
        if "sqlite:///./" in self.DATABASE_URL:
            db_name = self.DATABASE_URL.split("sqlite:///./")[-1]
            backend_db = os.path.join(BACKEND_DIR, db_name)
            if os.path.exists(backend_db):
                self.DATABASE_URL = f"sqlite:///{backend_db}"
        return self

    class Config:
        env_file = (
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env")),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env")),
            ".env"
        )
        extra = "ignore"

settings = Settings()

# Ensure SQLite URL is always absolute and points to the canonical DB file regardless of execution cwd
if settings.DATABASE_URL.startswith("sqlite:///.") or settings.DATABASE_URL == "sqlite:///copilot.db":
    settings.DATABASE_URL = f"sqlite:///{CANONICAL_DB_PATH}"

# Ensure FAISS_DIR and UPLOAD_DIR are absolute
if not os.path.isabs(settings.FAISS_DIR):
    settings.FAISS_DIR = os.path.abspath(os.path.join(BACKEND_DIR, settings.FAISS_DIR))
if not os.path.isabs(settings.UPLOAD_DIR):
    settings.UPLOAD_DIR = os.path.abspath(os.path.join(BACKEND_DIR, settings.UPLOAD_DIR))
