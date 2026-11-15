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
import app.models.cache
import app.models.crawler

from app.database.connection import engine
from app.database.base import Base

# Ensure all database tables exist
Base.metadata.create_all(bind=engine)

# Ensure organization_id columns exist on legacy tables
def apply_light_migrations():
    try:
        with engine.connect() as conn:
            cols_user = [row[1] for row in conn.execute(text("PRAGMA table_info(users)")).fetchall()]
            if "organization_id" not in cols_user:
                conn.execute(text("ALTER TABLE users ADD COLUMN organization_id VARCHAR"))
                conn.commit()

            cols_doc = [row[1] for row in conn.execute(text("PRAGMA table_info(documents)")).fetchall()]
            if "organization_id" not in cols_doc:
                conn.execute(text("ALTER TABLE documents ADD COLUMN organization_id VARCHAR"))
                conn.commit()
            if "access_level" not in cols_doc:
                conn.execute(text("ALTER TABLE documents ADD COLUMN access_level VARCHAR DEFAULT 'STUDENT'"))
                conn.commit()
            if "source_url" not in cols_doc:
                conn.execute(text("ALTER TABLE documents ADD COLUMN source_url VARCHAR"))
                conn.commit()
            if "content_hash" not in cols_doc:
                conn.execute(text("ALTER TABLE documents ADD COLUMN content_hash VARCHAR"))
                conn.commit()
            if "is_active" not in cols_doc:
                conn.execute(text("ALTER TABLE documents ADD COLUMN is_active INTEGER DEFAULT 1"))
                conn.commit()
            if "error_message" not in cols_doc:
                conn.execute(text("ALTER TABLE documents ADD COLUMN error_message VARCHAR"))
                conn.commit()
    except Exception:
        pass

apply_light_migrations()

from app.routers import auth, chat, documents, platform, crawler
from app.services.crawler.scheduler import scheduler

app = FastAPI(title="AI-Powered Enterprise Knowledge Assistance Platform", version="1.1.0")

@app.on_event("startup")
def startup_event():
    try:
        scheduler.start()
    except Exception as e:
        print(f"Failed to start crawler scheduler: {e}")

@app.on_event("shutdown")
def shutdown_event():
    try:
        scheduler.stop()
    except Exception:
        pass

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
app.include_router(crawler.router)

@app.get("/health")
def health_check():
    return {"status": "ok", "platform": "healthy"}
