import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "NexaAI Enterprise Platform"
    APP_VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./nexaai.db")
    
    # JWT Authentication
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-nexaai-jwt-signing-key-32chars-min")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # AI / Ollama Inference
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    DEFAULT_LLM_MODEL: str = os.getenv("DEFAULT_LLM_MODEL", "qwen3:8b")
    EMBEDDING_MODEL_NAME: str = os.getenv("EMBEDDING_MODEL_NAME", "BAAI/bge-small-en-v1.5")
    
    # Storage
    STORAGE_DIR: str = os.getenv("STORAGE_DIR", "./storage")
    VECTOR_STORE_DIR: str = os.getenv("VECTOR_STORE_DIR", "./storage/vector_indices")

    class Config:
        env_file = ".env"

settings = Settings()
