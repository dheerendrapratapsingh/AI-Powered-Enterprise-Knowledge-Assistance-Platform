import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./copilot.db")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "your_jwt_secret_key_here")
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "qwen2.5:7b")
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    TOP_K: int = int(os.getenv("TOP_K", "2"))
    SIMILARITY_THRESHOLD: float = float(os.getenv("SIMILARITY_THRESHOLD", "0.35"))
    MAX_CONTEXT_CHUNKS: int = int(os.getenv("MAX_CONTEXT_CHUNKS", "5"))
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./data/documents")
    FAISS_DIR: str = os.getenv("FAISS_DIR", "./data/indexes")

    class Config:
        env_file = "../.env" # Adjust relative to where it's run from

settings = Settings()
