# VIT-AP AI Copilot: Enterprise Knowledge Assistance Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.x-61DAFB.svg?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![FAISS](https://img.shields.io/badge/VectorDB-FAISS-00599C.svg?style=flat)](https://github.com/facebookresearch/faiss)
[![LLM Engine](https://img.shields.io/badge/LLM-Google%20Gemini%202.0%20Flash%20%7C%20Ollama-blue.svg)](https://deepmind.google/technologies/gemini/)

An enterprise-grade, multi-tenant AI Copilot platform built for university students, faculty, and administrators. It delivers high-accuracy question-answering over official academic syllabi, multi-degree curricula, hostel regulations, and campus contact directories without cross-curricular hallucination.

---

## 📚 Key Documentation

- **[Master Codebase & Architecture Guide](CODEBASE_AND_ARCHITECTURE_GUIDE.md):** Complete file-by-file directory index, database schemas, RAG ingestion/retrieval pipeline breakdowns, API contracts, and a step-by-step developer cookbook.
- **[Project Summary & Roadmap](PROJECT_SUMMARY_AND_ROADMAP.md):** Status handover report, historical bug resolutions, and prioritized milestone checklist.

---

## ⚡ Quickstart Guide

### 1. Prerequisites
- **Python 3.10+** (with virtual environment in `backend/venv`)
- **Node.js 18+** & npm
- *(Optional)* **Ollama** if running offline local fallback (`qwen2.5:1.5b`)

### 2. Backend Setup & Startup
```powershell
cd backend
.\venv\Scripts\Activate.ps1
$env:HF_HUB_OFFLINE="1"
uvicorn app.main:app --port 8000 --reload
```
* Interactive API Documentation (Swagger): [http://localhost:8000/docs](http://localhost:8000/docs)
* Health Check: [http://localhost:8000/health](http://localhost:8000/health)

### 3. Frontend Setup & Startup
```powershell
cd frontend
npm install
npm run dev
```
* Application Portal: [http://localhost:5173](http://localhost:5173)

### 4. Default Demo Accounts
| Role | Email | Password | Purpose |
| :--- | :--- | :--- | :--- |
| **Student** | `student@vitap.ac.in` | `student123` | Student query chat with citations and prompt pills |
| **Org Admin** | `org@vitap.ac.in` | `org123` | Dynamic document upload and knowledge base management |
| **Platform Admin** | `admin@vitap.ac.in` | `admin123` | Multi-tenant organization dashboard and global telemetry |

---

## 🏛️ System Features

1. **Coordinate-Based PDF Extraction:** Universal two-column coordinate parser (split at $x = 295$) isolating columns to eliminate course code and title interleaving.
2. **Academic Semantic Chunker:** Heading-preserving chunker (`#`, `##`, `(Part N)`) retaining curriculum boundaries.
3. **Degree & Domain Isolation:** Automatic suppression of cross-degree courses (e.g., preventing CSBS courses from appearing in CSE Core answers).
4. **Hybrid LLM Engine:** Google Gemini 2.0 Flash primary (SSE streaming, 100+ tokens/s, 0 local GPU load) with local Ollama (`qwen2.5:1.5b`) fallback.
5. **Sub-70ms Semantic Cache:** Cosine vector similarity ($\ge 0.95$) caching frequently asked questions.
6. **Streaming & Stop Generation:** Server-Sent Events (SSE) with `AbortController` cancellation in the UI.
