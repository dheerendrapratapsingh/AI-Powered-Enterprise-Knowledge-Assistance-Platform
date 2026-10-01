from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Pre-load models to register with SQLAlchemy Base before routing
import app.models.user
import app.models.document
import app.models.chunk
import app.models.conversation
import app.models.message
import app.models.feedback

from app.routers import auth, chat, documents

app = FastAPI(title="VIT-AP Student AI Copilot", version="1.0.0")

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

@app.get("/health")
def health_check():
    return {"status": "ok"}
