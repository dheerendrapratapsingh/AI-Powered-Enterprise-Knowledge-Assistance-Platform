from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

# Pre-load models to register with SQLAlchemy Base before routing
import app.models.organization
import app.models.chunk
import app.models.user
import app.models.document
import app.models.conversation
import app.models.message
import app.models.feedback

from app.database.connection import engine
from app.database.base import Base

# Ensure all database tables exist
Base.metadata.create_all(bind=engine)

# Ensure organization_id columns exist on legacy tables
def apply_light_migrations():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN organization_id VARCHAR"))
            conn.commit()
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE documents ADD COLUMN organization_id VARCHAR"))
            conn.commit()
        except Exception:
            pass

apply_light_migrations()

from app.routers import auth, chat, documents, platform

app = FastAPI(title="AI-Powered Enterprise Knowledge Assistance Platform", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(documents.router)
app.include_router(platform.router)

@app.get("/health")
def health_check():
    return {"status": "ok", "platform": "healthy"}
