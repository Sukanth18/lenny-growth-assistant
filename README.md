# The Lenny Growth Assistant — README

## 🎙️ What is this?

**The Lenny Growth Assistant** is a full-stack, AI-powered conversational web application built with **React 18 & FastAPI** that ingests transcripts from [Lenny's Podcast](https://www.lennyspodcast.com/), allows you to ask complex product management and growth questions, and generates highly specific, formatted content—including Ship30for30-style essays and live HTML/Markdown artifacts—rendered natively in a ChatGPT-like workspace.

---

## 🏗️ Architecture Overview

```
Frontend (React 18 + Vite + TailwindCSS + Zustand)
  │  REST + SSE streaming
  ▼
FastAPI Backend
  ├── Session Router  → PostgreSQL (session/message persistence)
  ├── Config Router   → Hot-swap LLM provider (Ollama ↔ Anthropic)
  └── Chat Router     → Agent Router → Skills
                             ├── Q&A Skill     ← RAG (ChromaDB)
                             ├── Ship30 Skill  ← RAG + essay prompt
                             └── Artifact Skill ← RAG + structured output
                       LLM Engine (Ollama | Anthropic)
                       Vector Store (ChromaDB, local)
                       PostgreSQL (Supabase / Railway / local Docker)
```

**Key design decisions:**
- **LLM Engine Abstraction:** A `BaseLLMEngine` interface with `AnthropicEngine` and `OllamaEngine` implementations. Swap providers via `PATCH /config` without restarting the server.
- **RAG Pipeline:** Transcripts are chunked (800 words, 100 overlap) and embedded with `nomic-embed-text` via Ollama into ChromaDB. Fully offline.
- **Agentic Routing:** A regex keyword classifier routes messages to the correct skill (Q&A / Ship30for30 / Artifact) with zero additional LLM calls.
- **SSE Streaming:** The chat endpoint streams structured JSON events. The frontend state machine parses `<artifact>` delimiters mid-stream to split chat text and artifact content in real time.

---

## 🚀 Quick Start (Local with Ollama)

### Prerequisites
- Python 3.11+
- Docker Desktop (for PostgreSQL) — or a Supabase/Railway account
- [Ollama](https://ollama.com) installed and running
- Git

### Step 1: Clone & Setup

```bash
git clone https://github.com/YOUR_USERNAME/lenny-growth-assistant.git
cd lenny-growth-assistant
cp .env.example .env
```

### Step 2: Pull Ollama Models

```bash
# Main chat model
ollama pull llama3.2

# Embedding model (REQUIRED for RAG)
ollama pull nomic-embed-text
```

### Step 3: Start PostgreSQL

```bash
docker-compose up -d
```

Or use your Supabase/Railway DATABASE_URL in `.env`.

### Step 4: Install Python Dependencies

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

### Step 5: Ingest Lenny's Transcripts

```bash
cd ..
python scripts/ingest_transcripts.py
```

This will:
1. Clone `ChatPRD/lennys-podcast-transcripts` automatically
2. Parse and chunk all transcripts
3. Build the ChromaDB vector index (takes 5-15 min depending on your machine)

### Step 6: Start the Backend

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 7: Start the Frontend

**Option A: React App (Recommended — Modern UI)**
```bash
cd frontend-react
npm install
npm run dev
```
Then visit `http://localhost:5173`

**Option B: Vanilla Static Frontend**
```bash
cd frontend
python -m http.server 5500
```
Then visit `http://localhost:5500`

---

## ☁️ Switching to Anthropic Claude

1. Add your key to `.env`:
   ```
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```
2. Either set `LLM_PROVIDER=anthropic` in `.env`, or click **Claude** in the UI toggle.

---

## 🔑 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | `ollama` | `ollama` or `anthropic` |
| `LLM_MODEL` | `llama3.2` | Model name for the active provider |
| `EMBED_MODEL` | `nomic-embed-text` | Embedding model (Ollama) |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `ANTHROPIC_API_KEY` | — | Required only for Anthropic provider |
| `DATABASE_URL` | local postgres | PostgreSQL async connection string |
| `CHROMA_PERSIST_DIR` | `./chroma_db` | ChromaDB storage directory |
| `TRANSCRIPT_DIR` | `./transcripts` | Path to Lenny transcript markdown files |
| `RAG_TOP_K` | `5` | Number of transcript chunks to retrieve |

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check + active LLM config |
| `POST` | `/sessions` | Create new chat session |
| `GET` | `/sessions` | List all sessions |
| `GET` | `/sessions/{id}` | Get session + full message history |
| `DELETE` | `/sessions/{id}` | Delete session (cascades messages) |
| `POST` | `/sessions/{id}/chat` | Stream chat response (SSE) |
| `GET` | `/config` | Get current LLM config |
| `PATCH` | `/config` | Hot-swap LLM provider/model |
| `GET` | `/config/models` | List available models |
| `GET` | `/docs` | Swagger UI |

---

## 🧪 Testing

```bash
cd backend
pip install pytest pytest-asyncio httpx
pytest tests/ -v
```

---

## 📁 Project Structure

```
lenny-growth-assistant/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI entry point
│   │   ├── config.py          # LLM config + env vars
│   │   ├── database.py        # SQLAlchemy async setup
│   │   ├── models.py          # DB ORM models
│   │   ├── schemas.py         # Pydantic schemas
│   │   ├── routers/           # API routes
│   │   ├── agents/            # Skills + router
│   │   ├── llm/               # Engine abstractions
│   │   └── rag/               # Ingestion, embedding, retrieval
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── scripts/
│   └── ingest_transcripts.py
├── docs/
│   ├── PRD.md
│   ├── architecture.md
│   ├── design.md
│   └── agent_transcripts/
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🎥 Demo Video

[Watch the Demo on YouTube](https://youtu.be/pkreoRgLJfw)

---

## 📄 License

MIT
