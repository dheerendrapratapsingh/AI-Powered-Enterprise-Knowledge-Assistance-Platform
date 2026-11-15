# VIT-AP AI Copilot: Comprehensive Codebase & Architecture Guide

> **Target Audience:** Developers, Maintainers, AI Engineers, and Evaluators  
> **Last Updated:** November 2026  
> **Active Git Branch:** `dheeru-v1`  
> **Primary Technology Stack:** FastAPI (Python 3.10+), React 18 + TypeScript + Vite, SQLite (SQLAlchemy), FAISS Vector Index, SentenceTransformers, Google Gemini 2.0 Flash & Local Ollama (qwen2.5:1.5b).

---

## Table of Contents
1. [System Overview & High-Level Architecture](#1-system-overview--high-level-architecture)
2. [Complete Project Directory Structure](#2-complete-project-directory-structure)
3. [Database Schema & Data Models](#3-database-schema--data-models)
4. [Document Ingestion Pipeline (Upload to Vector Index)](#4-document-ingestion-pipeline)
5. [RAG Query & Inference Pipeline](#5-rag-query--inference-pipeline)
6. [API Endpoints & Communication Contracts](#6-api-endpoints--communication-contracts)
7. [Frontend Architecture & UI Portals](#7-frontend-architecture--ui-portals)
8. [Configuration & Environment Variables (`.env`)](#8-configuration--environment-variables)
9. [Developer Cookbook: Recipes for Making Changes](#9-developer-cookbook-recipes-for-making-changes)
   - [Recipe 1: Add a New Document File Type / Parser](#recipe-1-add-a-new-document-file-type--parser)
   - [Recipe 2: Add or Tweak System Prompts, Guardrails & Intent Handlers](#recipe-2-add-or-tweak-system-prompts-guardrails--intent-handlers)
   - [Recipe 3: Add a New Backend REST Endpoint](#recipe-3-add-a-new-backend-rest-endpoint)
   - [Recipe 4: Add a New Database Field or Table (Light Migrations)](#recipe-4-add-a-new-database-field-or-table)
   - [Recipe 5: Add a New Frontend Page, Route, or Sidebar Link](#recipe-5-add-a-new-frontend-page-route-or-sidebar-link)
   - [Recipe 6: Modify LLM Provider, Temperature, or Model Weights](#recipe-6-modify-llm-provider-temperature-or-model-weights)
   - [Recipe 7: Tune Semantic Cache Threshold & Cache Invalidation](#recipe-7-tune-semantic-cache-threshold--cache-invalidation)
   - [Recipe 8: Run Tests, Evaluation Benchmarks (Ragas) & Re-indexing](#recipe-8-run-tests-evaluation-benchmarks--re-indexing)
   - [Recipe 9: Run Full Stack Locally (Windows / Linux / Docker)](#recipe-9-run-full-stack-locally)
10. [Troubleshooting, Known Quirks & Safety Rules](#10-troubleshooting-known-quirks--safety-rules)

---

## 1. System Overview & High-Level Architecture

The **VIT-AP AI Copilot** is a multi-tenant, enterprise knowledge assistance platform built to serve students, faculty, and administrative staff. It solves the critical challenges inherent to university and enterprise documentation:
1. **Multi-degree curriculum overlap**: Preventing cross-curricular contamination between distinct branches (e.g., `B.Tech CSE Core` vs `B.Tech CSBS`).
2. **Complex document structures**: Accurately extracting two-column tabular PDF syllabi, CSV/Excel faculty directories, and DOCX hostel rules without interleaving data.
3. **Hardware constraints & latency**: Utilizing a **Hybrid LLM engine** where Google Gemini 2.0 Flash delivers cloud tokens at 100+ tokens/sec with zero local GPU load, while local Ollama (`qwen2.5:1.5b`) provides offline backup.
4. **Instant query turnaround**: Sub-70 millisecond response times via SQLite-backed **Semantic Response Caching** with cosine similarity vector matching ($\ge 0.95$).

```
                           +-----------------------------------------------+
                           |        Client Layer (Browser / SPA)           |
                           |  React 18 + TypeScript + Vite + SSE Client    |
                           +-----------------------+-----------------------+
                                                   |
                         HTTP JSON Requests / SSE Token Streams
                                                   |
                                                   v
                           +-----------------------------------------------+
                           |        Backend API Layer (FastAPI)            |
                           |   /api/auth  |  /api/chat  |  /api/admin      |
                           +-----------------------+-----------------------+
                                                   |
                   +-------------------------------+-------------------------------+
                   |                               |                               |
                   v                               v                               v
    +------------------------------+ +------------------------------+ +------------------------------+
    |  Storage & Relational Layer  | |    Vector Indexing (FAISS)   | |     Hybrid AI / LLM Engine   |
    |  SQLite Database: copilot.db | |  IndexFlatIP (384 Dimensions)| |  1. Google Gemini 2.0 Flash  |
    |  Users, Orgs, Chats, Chunks  | |  all-MiniLM-L6-v2 Embeddings | |  2. Local Ollama Fallback    |
    |  Semantic Response Cache     | |  Degree & Role-Filtered Top-K| |  3. Ground-Truth Guardrails  |
    +------------------------------+ +------------------------------+ +------------------------------+
```

---

## 2. Complete Project Directory Structure

Below is the complete file-by-file directory map of the repository, including the exact role and responsibility of each component:

```
Capstone/
├── .env                              # Active environment configuration (API keys, models, DB URL)
├── .env.example                      # Documented template for environment setup
├── .gitignore                        # Git exclusion rules (venv, node_modules, logs, .db)
├── CODEBASE_AND_ARCHITECTURE_GUIDE.md# This comprehensive master architecture and developer guide
├── PROJECT_SUMMARY_AND_ROADMAP.md    # Executive roadmap, historical bugs fixed, and milestone tracker
├── README.md                         # Project introductory overview and quickstart guide
├── docker-compose.yml                # Multi-container orchestration (FastAPI backend + Vite frontend)
├── run.ps1                           # PowerShell startup script for automated dev environment launch
│
├── backend/                          # FastAPI Backend Application Root
│   ├── Dockerfile                    # Container definition for Python backend
│   ├── alembic.ini                   # Database migration configuration
│   ├── copilot.db                    # Primary SQLite database (users, chats, docs, semantic cache)
│   ├── evaluate_ragas.py             # Automated Ragas benchmark script for IEEE research evaluation
│   ├── reindex.py                    # Utility to re-chunk and re-embed all documents in copilot.db
│   ├── requirements.txt              # Python package dependencies
│   ├── seed_users.py                 # Seeds default organizations and demo accounts (Admin/Org/Student)
│   │
│   ├── alembic/                      # Alembic database migration scripts
│   │   ├── env.py
│   │   └── versions/
│   │       └── ca0f1dc1e199_initial_migration.py
│   │
│   ├── app/                          # Main Application Module
│   │   ├── config.py                 # Pydantic Settings reading .env (LLM keys, FAISS paths, flags)
│   │   ├── main.py                   # FastAPI initialization, CORS, routers, and light DB migrations
│   │   │
│   │   ├── database/                 # SQLAlchemy Database Layer
│   │   │   ├── base.py               # DeclarativeBase instance
│   │   │   └── connection.py         # Engine and SessionLocal session factory
│   │   │
│   │   ├── models/                   # SQLAlchemy ORM Table Definitions
│   │   │   ├── __init__.py           # Package exporter
│   │   │   ├── cache.py              # ResponseCache model (normalized query, embedding, hit count)
│   │   │   ├── chunk.py              # DocumentChunk model (text, page, chunk_index, metadata_json)
│   │   │   ├── conversation.py       # Conversation session model (user_id, title, timestamps)
│   │   │   ├── document.py           # Document model (name, filename, category, status, access_level)
│   │   │   ├── feedback.py           # Feedback model (user rating, comments, message_id)
│   │   │   ├── message.py            # Message & MessageSource models (role, content, citations)
│   │   │   ├── organization.py       # Organization multi-tenant model (name, slug, domain)
│   │   │   └── user.py               # User model (name, email, password_hash, role, student_id)
│   │   │
│   │   ├── rag/                      # RAG (Retrieval-Augmented Generation) Pipeline Core
│   │   │   ├── cache.py              # Semantic response caching logic (exact match & cosine similarity)
│   │   │   ├── chunker.py            # Academic section chunker (#, ##, max words, sub-part headers)
│   │   │   ├── cleaner.py            # Whitespace and non-printable control character sanitizer
│   │   │   ├── embedder.py           # Thread-safe, lazy-loaded SentenceTransformer (all-MiniLM-L6-v2)
│   │   │   ├── extractor.py          # Universal coordinate PDF parser (x=295 split), CSV, XLSX, DOCX
│   │   │   ├── index_manager.py      # FAISS IndexFlatIP manager (add, search, delete, save, load)
│   │   │   ├── llm_client.py         # Unified LLM engine: Google Gemini 2.0 Flash + Ollama fallback
│   │   │   ├── ollama_client.py      # Local Ollama client & JSON parser fallback
│   │   │   ├── pipeline.py           # Orchestrator: retrieve -> filter RBAC -> build prompt -> generate
│   │   │   ├── prompt_builder.py     # Anti-hallucination prompts, strict rules, email drafting intent
│   │   │   └── retriever.py          # Degree/domain filtering + FAISS query execution
│   │   │
│   │   ├── routers/                  # REST API Route Handlers
│   │   │   ├── auth.py               # User registration, login, JWT token issue, require_admin
│   │   │   ├── chat.py               # /api/chat (JSON), /api/chat/stream (SSE), history, feedback
│   │   │   ├── documents.py          # Document upload, background indexing, list, delete, status
│   │   │   └── platform.py           # Multi-tenant organization CRUD and platform-wide statistics
│   │   │
│   │   ├── schemas/                  # Pydantic Request & Response Data Transfer Objects (DTOs)
│   │   │   ├── auth.py               # UserCreate, UserLogin, Token, UserOut
│   │   │   └── chat.py               # ChatRequest, ChatResponse, Source, FeedbackRequest
│   │   │
│   │   └── utils/                    # Utility Functions
│   │       └── security.py           # Password hashing (bcrypt) and JWT encoding/decoding
│   │
│   ├── data/                         # Local Data Directory
│   │   ├── benchmarks/               # Ragas benchmark outputs (JSON results, IEEE LaTeX tables)
│   │   │   ├── benchmark_results.json
│   │   │   └── ieee_benchmark_table.tex
│   │   ├── documents/                # Stored raw uploaded files (PDFs, DOCX, XLSX)
│   │   └── indexes/                  # Serialized FAISS index (.index) and metadata (.json)
│   │       ├── vitap.index
│   │       └── vitap_metadata.json
│   │
│   └── tests/                        # Automated Unit Tests
│       └── test_backend.py           # Unit tests for cleaner, chunker, auth, security, and extraction
│
└── frontend/                         # React 18 + TypeScript + Vite Application Root
    ├── Dockerfile                    # Container definition for frontend (multi-stage Nginx build)
    ├── index.html                    # Single Page Application entry HTML
    ├── nginx.conf                    # Nginx reverse proxy configuration for production container
    ├── package.json                  # Frontend dependencies and npm scripts
    ├── tsconfig.json                 # TypeScript compiler configuration
    ├── vite.config.ts                # Vite dev server configuration (proxy /api to port 8000)
    │
    ├── src/                          # Application Source Code
    │   ├── App.tsx                   # Top-level router and role-based route guard
    │   ├── index.css                 # Global CSS variables, reset, and dark theme palette
    │   ├── main.tsx                  # React DOM root entry point
    │   │
    │   ├── layouts/                  # Layout Wrappers
    │   │   ├── MainLayout.tsx        # Common layout wrapper with top header and sidebar navigation
    │   │   └── Sidebar.tsx           # Role-aware sidebar (Chat, Knowledge Base, Orgs, Settings)
    │   │
    │   ├── pages/                    # Views / Portals
    │   │   ├── EmployeeChat.tsx      # Student / Staff Chat view with Markdown, SSE stream, citations
    │   │   ├── Login.tsx             # Role selector portal, sign in/sign up toggle, demo login pills
    │   │   ├── OrgAdmin.tsx          # Org Admin knowledge portal: document upload, status, re-index
    │   │   └── PlatformAdmin.tsx     # Platform Admin dashboard: multi-org stats, tenants management
    │   │
    │   └── services/                 # API Client Service Layer
    │       ├── admin.ts              # Document upload and admin endpoints
    │       ├── api.ts                # Base Axios instance with automatic JWT Bearer token interceptor
    │       ├── auth.ts               # Login, register, getCurrentUser, and logout
    │       ├── chat.ts               # Synchronous chat, conversation history, feedback
    │       └── platform.ts           # Platform statistics and organization listing/creation
```

---

## 3. Database Schema & Data Models

The platform uses SQLite (`backend/copilot.db`) via SQLAlchemy ORM. All tables are automatically initialized on startup via `Base.metadata.create_all(bind=engine)` in `backend/app/main.py`.

### Entity Relationship Diagram
```
+-------------------+       +-------------------+       +-----------------------+
|   Organization    | 1   * |       User        | 1   * |     Conversation      |
|-------------------|-------|-------------------|-------|-----------------------|
| id (PK)           |       | id (PK)           |       | id (PK)               |
| name              |       | email (UNIQUE)    |       | user_id (FK: User)    |
| slug (UNIQUE)     |       | password_hash     |       | title                 |
| domain            |       | role              |       | created_at            |
| status            |       | organization_id   |       +-----------+-----------+
+---------+---------+       +---------+---------+                   | 1
          | 1                         |                             |
          |                           |                             | *
          | *                         | *               +-----------v-----------+
+---------v---------+       +---------v---------+       |        Message        |
|     Document      |       |     Feedback      |       |-----------------------|
|-------------------|       |-------------------|       | id (PK)               |
| id (PK)           |       | id (PK)           |       | conversation_id (FK)  |
| name              |       | message_id (FK)   |       | role (user/assistant) |
| filename          |       | user_id (FK: User)|       | content               |
| category          |       | rating (1 / -1)   |       | response_type         |
| access_level      |       | comment           |       +-----------+-----------+
| status            |       +-------------------+                   | 1
| organization_id   |                                               |
+---------+---------+                                               | *
          | 1                                           +-----------v-----------+
          |                                             |     MessageSource     |
          | *                                           |-----------------------|
+---------v---------+                                   | id (PK)               |
|   DocumentChunk   |                                   | message_id (FK)       |
|-------------------|                                   | document_id (FK)      |
| id (PK)           |                                   | page_number           |
| document_id (FK)  |                                   +-----------------------+
| chunk_index       |
| page_number       |                                   +-----------------------+
| text              |                                   |     ResponseCache     |
| metadata_json     |                                   |-----------------------|
+-------------------+                                   | id (PK)               |
                                                        | query_text            |
                                                        | normalized_query (IDX)|
                                                        | answer                |
                                                        | embedding_json        |
                                                        | hit_count             |
                                                        | organization_id       |
                                                        +-----------------------+
```

### Table Details
1. **`organizations`**: Multi-tenant isolation.
   - `id`: UUID string primary key.
   - `slug`: Human-readable identifier (e.g., `vitap`, `acme-corp`).
   - `domain`: Associated email domain (e.g., `vitap.ac.in`) for automatic registrant routing.
2. **`users`**: Platform actors.
   - `role`: One of `ADMIN` (Platform Admin), `ORG_ADMIN` (University/Tenant Admin), or `STUDENT` (Student/Employee).
   - `student_id`: Optional registration number (e.g., `21BCE1001`).
3. **`documents`**: Tracked knowledge files.
   - `access_level`: Role-based access control tag (`STUDENT`, `FACULTY`, `ADMIN`).
   - `status`: Processing state (`PENDING`, `PROCESSING`, `INDEXING`, `READY`, `FAILED`).
4. **`document_chunks`**: Individual parsed passages.
   - `metadata_json`: Stored JSON containing `category`, `document_id`, `document_name`, `page`, and `access_level`.
5. **`conversations` & `messages`**: Multi-turn dialogue persistence.
   - `messages.role`: Either `"user"` or `"assistant"`.
   - `message_sources`: Citations linking each AI message to specific document pages.
6. **`response_cache`**: High-performance semantic query cache.
   - `normalized_query`: Stripped, lowercase text for exact string index lookup.
   - `embedding_json`: 384-dimensional vector serialized as JSON for cosine similarity scanning.
   - `hit_count`: Monotonically increasing counter for cache usage analytics.

---

## 4. Document Ingestion Pipeline

The document ingestion pipeline is 100% dynamic: no course syllabi or policies are hardcoded. Admins upload documents through the UI or REST endpoint `/api/admin/documents/upload`.

```
Uploaded File (PDF, XLSX, CSV, DOCX, TXT, MD)
                     │
                     ▼
          [1. Extraction Layer]
      app/rag/extractor.py: extract_text()
   • PDF: Universal 2-column coordinate parser (split at x=295)
   • CSV/TSV: Natural language structured record builder
   • XLSX: Multi-sheet openpyxl row iterator
   • DOCX: Paragraphs + structured table cells
                     │
                     ▼
           [2. Cleaning Layer]
       app/rag/cleaner.py: clean_text()
   • Normalizes \r\n to \n
   • Preserves markdown headings (#, ##) and newlines
   • Strips ASCII non-printable control chars (\x00-\x1f)
                     │
                     ▼
           [3. Chunking Layer]
    app/rag/chunker.py: process_document_to_chunks()
   • Splits along academic section headings (## Programme Core)
   • Sub-chunks sections exceeding 250 words with "(Part N)" tags
   • Fallback: 250-word sliding window with 40-word overlap
                     │
                     ▼
          [4. Embedding Layer]
    app/rag/embedder.py: generate_embeddings_for_chunks()
   • Lazy-loaded SentenceTransformer: all-MiniLM-L6-v2
   • Produces 384-dimensional dense vectors
                     │
                     ▼
       [5. Indexing & Storage Layer]
   • app/rag/index_manager.py: L2-normalizes & inserts into FAISS IndexFlatIP
   • Persists chunk metadata to vitap_metadata.json & vitap.index
   • Inserts raw chunks into SQLite document_chunks table
   • Updates document.status = "READY"
```

### Key Technical Mechanisms
- **Coordinate-Based PDF Column Isolation:** Standard text extractors read horizontally across two columns, corrupting course codes. In `extractor.py`, pages are divided at $x = 295.0$. Words on the left are processed top-to-bottom first, then words on the right are processed top-to-bottom, mathematically preventing syllabus interleaving.
- **Academic Section-Aware Chunking:** Rather than splitting across arbitrary word limits, `chunk_text()` splits on `\n## `. If a curriculum section contains 60 courses, it splits the lines into 250-word sub-blocks, prepending `## Section Name (Part 2)` to retain context across vector boundaries.

---

## 5. RAG Query & Inference Pipeline

When a user asks a question via `/api/chat` or `/api/chat/stream`, the request executes through an optimized 6-stage pipeline:

```
User Query: "What are the Programme Core courses for B.Tech CSE Core?"
                                │
                                ▼
           [Stage 1: Semantic Response Cache Lookup]
                     app/rag/cache.py
   1. Check normalized query string match (sub-millisecond)
   2. Compute cosine similarity with cached queries (Threshold: >= 0.95)
   ───► If HIT: Return cached answer + citations immediately (< 70ms)
                                │
                          (Cache Miss)
                                ▼
               [Stage 2: FAISS Vector Retrieval]
                    app/rag/retriever.py
   • Generate 384-d vector for question via all-MiniLM-L6-v2
   • Query FAISS IndexFlatIP for Top-K candidate chunks (default K=2)
   • Filter candidates exceeding similarity threshold (score >= 0.20)
                                │
                                ▼
            [Stage 3: Degree & RBAC Security Filtering]
   • Degree Filter: If query specifies "CSE Core", suppress CSBS chunks
   • Role Filter: If user is "STUDENT", suppress chunks with access_level "FACULTY" or "ADMIN"
                                │
                                ▼
          [Stage 4: Prompt Engineering & Intent Detection]
                 app/rag/prompt_builder.py
   • Intent Check: Detect "draft an email" queries (compose structured email template)
   • Context Construction: Attach sources, categories, and recent conversation turns
   • Guardrails: Ground truth takes 100% precedence over chat history
   • Fallback Rule: If context lacks requested data, return strict official fallback
                                │
                                ▼
               [Stage 5: Hybrid LLM Engine Execution]
                    app/rag/llm_client.py
   • Primary: Google Gemini 2.0 Flash via HTTP SSE stream (Cloud, Fast, 0 GPU load)
   • Fallback: Local Ollama (qwen2.5:1.5b) if Gemini key is missing or network fails
                                │
                                ▼
              [Stage 6: Output & Cache Population]
   • Save Message and MessageSource citations to SQLite
   • If answer is confident, save to ResponseCache for instant future queries
   • Return ChatResponse JSON or stream Server-Sent Events to frontend
```

---

## 6. API Endpoints & Communication Contracts

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Self-register student/user; auto-routes domain to organization | None |
| `POST` | `/api/auth/login` | Returns JWT Bearer token | None |
| `POST` | `/api/auth/token` | OAuth2 password flow compatibility | None |
| `GET` | `/api/auth/me` | Returns current user profile, role, and organization ID | Bearer Token |

### Chat & Dialogue (`/api`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/chat` | Synchronous RAG query. Returns complete JSON answer & sources | Bearer Token |
| `POST` | `/api/chat/stream` | **Server-Sent Events (SSE)** stream. Yields live tokens | Bearer Token |
| `GET` | `/api/chat/conversations`| Lists past conversations for current user | Bearer Token |
| `GET` | `/api/chat/conversations/{id}`| Retrieves full message history and citations for a conversation | Bearer Token |
| `POST` | `/api/chat/feedback`| Submits positive/negative feedback (+1 / -1) on an answer | Bearer Token |

#### SSE Event Protocol for `/api/chat/stream`:
```
data: {"type": "metadata", "conversation_id": "...", "message_id": "...", "sources": [{"document_name": "...", "page": 1}]}

data: {"type": "token", "token": "Programme "}
data: {"type": "token", "token": "Core "}
data: {"type": "token", "token": "courses..."}

data: {"type": "done"}
```

### Knowledge Management (`/api/admin/documents`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/admin/documents/upload`| Upload file (multipart/form-data) with background indexing | Admin / Org Admin |
| `GET` | `/api/admin/documents` | Lists all documents, processing status, pages, chunks | Admin / Org Admin |
| `DELETE`| `/api/admin/documents/{id}` | Deletes document, chunks, and FAISS index vectors | Admin / Org Admin |

### Platform Multi-Tenancy (`/api/platform`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/platform/stats` | Global system statistics (total orgs, users, queries, uptime)| Platform Admin |
| `GET` | `/api/platform/organizations`| Lists all university / company tenants | Platform Admin |
| `POST`| `/api/platform/organizations`| Creates a new tenant organization | Platform Admin |

---

## 7. Frontend Architecture & UI Portals

The frontend is a single-page application built with **React 18**, **TypeScript**, and **Vite**, structured around three role-based portals:

### 1. Role-Based Portals
- **Student / Employee Portal (`/chat`):**
  - Live token streaming via native `fetch()` and `ReadableStream`.
  - Mid-stream cancellation using `AbortController` ("Stop Generating" button).
  - Rich Markdown rendering with `react-markdown` (bolding, tables, code blocks, lists).
  - Collapsible source citations displaying document name and exact page numbers.
  - Interactive starter prompt pills for fast querying.
- **Organization Admin Portal (`/org`):**
  - Document upload zone with drag-and-drop support.
  - Document management table showing processing status (`READY`, `INDEXING`, `FAILED`).
  - Total chunks and page count telemetry.
- **Platform Admin Dashboard (`/platform`):**
  - Global overview metrics: total organizations, total queries served, active users.
  - Organization provisioning panel.

### 2. State & Network Layer
- **`src/services/api.ts`:** Axios client configured with an interceptor that automatically attaches `Authorization: Bearer <token>` from `localStorage`.
- **`src/services/auth.ts`:** Handles token storage, user session validation, login, and registration.
- **`src/services/chat.ts` & `EmployeeChat.tsx`:** Custom SSE reader that parses JSON packets from the SSE stream and appends incoming tokens to the active message in real time.

---

## 8. Configuration & Environment Variables

All settings are managed via the root `.env` file and loaded through `backend/app/config.py`:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `sqlite:///./copilot.db` | SQLAlchemy database connection string |
| `JWT_SECRET` | `your_jwt_secret_key_here` | Secret key used to sign and verify JWT tokens |
| `GEMINI_API_KEY` | *(empty string)* | Google Gemini API Key. If provided, enables Gemini 2.0 Flash primary |
| `GEMINI_MODEL` | `gemini-2.0-flash` | Google Gemini model identifier |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Endpoint for local Ollama daemon |
| `OLLAMA_MODEL` | `qwen2.5:1.5b` | Local Ollama model name (lightweight fallback) |
| `ENABLE_SEMANTIC_CACHE`| `true` | Enables sub-70ms response caching |
| `CACHE_SIMILARITY_THRESHOLD`| `0.95` | Cosine similarity cutoff for semantic cache hits |
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | SentenceTransformer embedding model name |
| `TOP_K` | `2` | Number of chunks retrieved from FAISS per query |
| `SIMILARITY_THRESHOLD` | `0.20` | Minimum vector similarity score to accept a chunk |
| `MAX_CONTEXT_CHUNKS` | `5` | Maximum number of chunks injected into the LLM prompt |
| `UPLOAD_DIR` | `./data/documents` | Directory where uploaded files are stored |
| `FAISS_DIR` | `./data/indexes` | Directory where FAISS index and metadata are saved |

---

## 9. Developer Cookbook: Recipes for Making Changes

This section provides step-by-step instructions for any modification or feature you may want to add in the future.

---

### Recipe 1: Add a New Document File Type / Parser
**Scenario:** You want to support a new document format (e.g., PowerPoint `.pptx` or HTML files).

1. **Install required library (if any):**
   Add the library to `backend/requirements.txt` (e.g., `python-pptx`):
   ```powershell
   backend\venv\Scripts\pip.exe install python-pptx
   ```
2. **Add extraction function in `backend/app/rag/extractor.py`:**
   ```python
   def extract_text_from_pptx(file_path: str) -> list:
       from pptx import Presentation
       prs = Presentation(file_path)
       slides_data = []
       for idx, slide in enumerate(prs.slides):
           text_runs = []
           for shape in slide.shapes:
               if shape.has_text_frame:
                   text_runs.append(shape.text)
           slides_data.append({"page_number": idx + 1, "text": "\n".join(text_runs)})
       return slides_data
   ```
3. **Register extension in `extract_text()` in `extractor.py`:**
   ```python
   elif ext in [".pptx", ".ppt"]:
       return extract_text_from_pptx(file_path)
   ```
4. **Update Frontend upload accept list:**
   In `frontend/src/pages/OrgAdmin.tsx`, add `.pptx` to the file input `accept` attribute:
   ```tsx
   accept=".pdf,.docx,.txt,.csv,.xlsx,.pptx"
   ```

---

### Recipe 2: Add or Tweak System Prompts, Guardrails & Intent Handlers
**Scenario:** You want to add a new intent handler (e.g., "Calculate CGPA" or "Hostel Grievance Draft") or modify the assistant's persona.

1. **Add intent detection function in `backend/app/rag/pipeline.py` or `prompt_builder.py`:**
   ```python
   def is_hostel_grievance_intent(question: str) -> bool:
       q = question.lower()
       return any(k in q for k in ["hostel complaint", "warden grievance", "room issue", "mess complaint"])
   ```
2. **Update prompts in `backend/app/rag/prompt_builder.py`:**
   - Modify `build_prompt()` (for JSON responses) and `build_streaming_prompt()` (for SSE streaming).
   - Under `Rules:`, add your new behavioral constraint or template instructions.
3. **Handle intent in `pipeline.py` and `routers/chat.py`:**
   - In `answer_question()` and `chat_stream_endpoint()`, check your intent detector to bypass or augment fallback messages when chunks are sparse.

---

### Recipe 3: Add a New Backend REST Endpoint
**Scenario:** You want to add a new endpoint, e.g., `GET /api/student/grades`.

1. **Define Pydantic schema in `backend/app/schemas/`:**
   Create or edit schema in `backend/app/schemas/chat.py` (or create a new schema file).
2. **Implement endpoint in appropriate router in `backend/app/routers/`:**
   ```python
   from fastapi import APIRouter, Depends
   from app.routers.auth import get_current_user
   from app.models.user import User

   @router.get("/student/grades")
   def get_student_grades(current_user: User = Depends(get_current_user)):
       return {"student_id": current_user.student_id, "grades": []}
   ```
3. **Register new router (if creating a brand new router file):**
   In `backend/app/main.py`:
   ```python
   from app.routers import grades
   app.include_router(grades.router)
   ```

---

### Recipe 4: Add a New Database Field or Table
**Scenario:** You want to add a `phone_number` field to the `User` model.

1. **Update SQLAlchemy model in `backend/app/models/user.py`:**
   ```python
   phone_number = Column(String, nullable=True)
   ```
2. **Add light migration in `backend/app/main.py`:**
   Add a safe column check inside `apply_light_migrations()`:
   ```python
   cols_user = [row[1] for row in conn.execute(text("PRAGMA table_info(users)")).fetchall()]
   if "phone_number" not in cols_user:
       conn.execute(text("ALTER TABLE users ADD COLUMN phone_number VARCHAR"))
       conn.commit()
   ```
3. **Update Pydantic schemas in `backend/app/schemas/auth.py`:**
   Add `phone_number: Optional[str] = None` to `UserCreate` and `UserOut`.

---

### Recipe 5: Add a New Frontend Page, Route, or Sidebar Link
**Scenario:** You want to add a "Settings" page for users.

1. **Create the component:**
   Create `frontend/src/pages/Settings.tsx`:
   ```tsx
   export function Settings() {
     return <div style={{ padding: '2rem', color: '#fff' }}><h2>User Settings</h2></div>;
   }
   ```
2. **Add route in `frontend/src/App.tsx`:**
   ```tsx
   import { Settings } from './pages/Settings';
   // Inside <Routes>:
   <Route path="/settings" element={<MainLayout role="employee" />}>
     <Route index element={<Settings />} />
   </Route>
   ```
3. **Add sidebar link in `frontend/src/layouts/Sidebar.tsx`:**
   Add a navigation button or link targeting `/settings`.

---

### Recipe 6: Modify LLM Provider, Temperature, or Model Weights
**Scenario:** You want to change the cloud model to `gemini-1.5-pro` or adjust local Ollama settings.

1. **Change via `.env`:**
   ```env
   GEMINI_MODEL=gemini-1.5-pro
   OLLAMA_MODEL=qwen2.5:3b
   ```
2. **Adjust temperature or system parameters in `backend/app/rag/llm_client.py`:**
   Inside `_stream_gemini_tokens` or `generate_response`:
   ```python
   payload = {
       "contents": [{"parts": [{"text": prompt}]}],
       "generationConfig": {
           "temperature": 0.2,       # Lower = more deterministic
           "topP": 0.8,
           "maxOutputTokens": 2048
       }
   }
   ```

---

### Recipe 7: Tune Semantic Cache Threshold & Cache Invalidation
**Scenario:** The cache is matching too loosely or you want to clear obsolete cached responses.

1. **Adjust sensitivity in `.env`:**
   ```env
   # Increase to 0.98 for stricter matches; decrease to 0.92 for broader matches
   CACHE_SIMILARITY_THRESHOLD=0.98
   ```
2. **Clear or invalidate cache entries:**
   Run a short script with `backend/venv/Scripts/python.exe`:
   ```python
   from app.database.connection import SessionLocal
   from app.models.cache import ResponseCache
   db = SessionLocal()
   db.query(ResponseCache).delete()
   db.commit()
   print("Semantic cache flushed.")
   ```

---

### Recipe 8: Run Tests, Evaluation Benchmarks & Re-indexing
**Scenario:** You updated the extractor or chunker and want to verify performance.

1. **Run Unit Tests:**
   ```powershell
   backend\venv\Scripts\python.exe -m unittest tests/test_backend.py
   ```
2. **Re-index Existing Knowledge Base:**
   ```powershell
   backend\venv\Scripts\python.exe reindex.py
   ```
3. **Run IEEE Ragas Benchmark Suite:**
   ```powershell
   backend\venv\Scripts\python.exe evaluate_ragas.py
   ```
   *Outputs:*
   - `backend/data/benchmarks/benchmark_results.json`
   - `backend/data/benchmarks/ieee_benchmark_table.tex` (ready for paper inclusion).

---

### Recipe 9: Run Full Stack Locally

#### Option A: Native Processes (Recommended for Development)
1. **Ollama (Optional local fallback):**
   ```powershell
   ollama serve
   ```
2. **Backend (FastAPI):**
   ```powershell
   cd backend
   .\venv\Scripts\Activate.ps1
   $env:HF_HUB_OFFLINE="1"
   uvicorn app.main:app --port 8000 --reload
   ```
3. **Frontend (Vite):**
   ```powershell
   cd frontend
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

#### Option B: Docker Compose
```powershell
docker-compose up --build
```

---

## 10. Troubleshooting, Known Quirks & Safety Rules

### 1. SQLite Database Path Consistency
- **Rule:** Always execute backend scripts with current working directory set to `backend/`, or ensure `DATABASE_URL=sqlite:///./copilot.db` points to `backend/copilot.db`. If run from the repository root, SQLite will create a separate empty `copilot.db` at the root.

### 2. SentenceTransformer Initialization Lag
- PyTorch CPU initialization takes 10–15 seconds when SentenceTransformers first loads.
- **Solution:** `app/rag/embedder.py` uses thread-safe lazy loading via `get_embedding_model()`. The model only loads upon the first embedding request, keeping server startup instantaneous.

### 3. Windows Terminal & Process Execution
- Background daemon processes (Ollama, Uvicorn, Vite) must be managed cleanly. Do not spawn duplicate instances on the same port (`8000`, `5173`, `11434`).
- Use `npm --prefix frontend run build` to verify frontend TypeScript compilation without starting a server.

### 4. Ground Truth Override & Anti-Hallucination
- If the AI answers that "information is not available in official university documents", it indicates that retrieved chunks either lacked the information or were filtered out by degree/domain isolation. Check `backend/data/indexes/vitap_metadata.json` to verify the document was indexed.
