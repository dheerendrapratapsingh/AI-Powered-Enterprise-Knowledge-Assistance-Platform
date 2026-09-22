import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from config import settings
from database import engine, Base, SessionLocal
from models import Organization, User, AIConfigModel
from routers.auth import router as auth_router, get_password_hash
from routers.platform import router as platform_router
from routers.org import router as org_router
from routers.chat import router as chat_router

# Create Database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Multi-tenant Enterprise Knowledge Assistance Platform powered by RAG and Qwen3-8B"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed default mock organizations and users if empty
def seed_initial_data():
    db: Session = SessionLocal()
    try:
        if db.query(Organization).count() == 0:
            # Create Organizations
            acme = Organization(name="Acme Corp", slug="acme-corp", plan="Enterprise", status="active")
            technova = Organization(name="TechNova Inc", slug="technova", plan="Pro", status="active")
            db.add_all([acme, technova])
            db.commit()
            db.refresh(acme)
            db.refresh(technova)

            # AI Configs
            db.add_all([
                AIConfigModel(org_id=acme.id, model="qwen3:8b", top_k=5, strict_grounding=True),
                AIConfigModel(org_id=technova.id, model="qwen3:8b", top_k=5, strict_grounding=True)
            ])
            db.commit()

            # Create Users matching demo login
            users = [
                User(
                    name="Sriram Kumar",
                    email="sriram@nexaai.com",
                    hashed_password=get_password_hash("admin123"),
                    role="platform_admin",
                    avatar_initial="S"
                ),
                User(
                    org_id=acme.id,
                    name="Himanvi Reddy",
                    email="himanvi@acmecorp.com",
                    hashed_password=get_password_hash("admin123"),
                    role="org_admin",
                    avatar_initial="H"
                ),
                User(
                    org_id=acme.id,
                    name="Dheerendra Singh",
                    email="dheerendra@acmecorp.com",
                    hashed_password=get_password_hash("user123"),
                    role="employee",
                    avatar_initial="D"
                ),
                User(
                    org_id=technova.id,
                    name="Narasimha Rao",
                    email="narasimha@technova.com",
                    hashed_password=get_password_hash("user123"),
                    role="employee",
                    avatar_initial="N"
                ),
            ]
            db.add_all(users)
            db.commit()
    finally:
        db.close()

seed_initial_data()

# Register API Routers under /api/v1
app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(platform_router, prefix=settings.API_PREFIX)
app.include_router(org_router, prefix=settings.API_PREFIX)
app.include_router(chat_router, prefix=settings.API_PREFIX)

@app.get("/")
def root():
    return {
        "status": "online",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs_url": "/docs"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "ollama_url": settings.OLLAMA_BASE_URL,
        "active_model": settings.DEFAULT_LLM_MODEL
    }
