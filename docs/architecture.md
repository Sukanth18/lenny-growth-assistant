# Architecture — The Lenny Growth Assistant

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (HTML/CSS/JS)                        │
│                                                                  │
│  ┌──────────────────┐  ┌────────────────────────────────────┐   │
│  │   Chat Panel     │  │        Artifact Viewer              │   │
│  │  SSE consumer    │  │  HTML → sandboxed iframe            │   │
│  │  marked.js MD    │  │  MD   → marked.js render            │   │
│  │  Stream state    │  │  Code → Prism.js highlight          │   │
│  │  machine         │  │                                     │   │
│  └──────────────────┘  └────────────────────────────────────┘   │
│                                                                  │
│   Session Sidebar │ LLM Toggle Pills │ Suggestion Chips          │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP REST + SSE (text/event-stream)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FASTAPI BACKEND                             │
│                                                                  │
│  ┌────────────────┐  ┌───────────────┐  ┌───────────────────┐  │
│  │ /sessions      │  │ /sessions/    │  │  /config          │  │
│  │ CRUD Router    │  │ {id}/chat     │  │  GET / PATCH      │  │
│  │                │  │ SSE Router    │  │                   │  │
│  └────────────────┘  └──────┬────────┘  └───────────────────┘  │
│                             │                                    │
│                    ┌────────▼────────┐                          │
│                    │  Agent Router   │                          │
│                    │ (keyword regex) │                          │
│                    └────────┬────────┘                          │
│              ┌──────────────┼──────────────┐                   │
│              ▼              ▼              ▼                   │
│        ┌──────────┐  ┌──────────┐  ┌──────────────┐           │
│        │ Q&A      │  │ Ship30   │  │ Artifact     │           │
│        │ Skill    │  │ Skill    │  │ Skill        │           │
│        └─────┬────┘  └─────┬────┘  └──────┬───────┘           │
│              └──────────────┴──────────────┘                   │
│                             │ RAG                              │
│                    ┌────────▼────────┐                          │
│                    │   Retriever     │                          │
│                    │   (ChromaDB)    │                          │
│                    └────────┬────────┘                          │
│                             │                                    │
│                    ┌────────▼────────┐                          │
│                    │  LLM Engine     │                          │
│                    │ Factory         │                          │
│                    └──────┬──────────┘                          │
│                    ┌──────┴──────────┐                          │
│                    ▼                 ▼                          │
│             ┌────────────┐  ┌─────────────┐                   │
│             │ Ollama     │  │ Anthropic   │                   │
│             │ Engine     │  │ Engine      │                   │
│             │ (local)    │  │ (cloud)     │                   │
│             └────────────┘  └─────────────┘                   │
└──────────────────────────────────────────────────────────────────┘
          │                                    │
          ▼                                    ▼
┌──────────────────┐              ┌───────────────────────────┐
│   PostgreSQL     │              │   ChromaDB (local)        │
│   (Supabase /    │              │   nomic-embed-text        │
│    Railway /     │              │   Lenny transcript chunks │
│    Docker)       │              └───────────────────────────┘
│                  │
│  users           │
│  sessions        │
│  messages        │
└──────────────────┘
```

---

## Database Schema

### `users`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | Auto-generated |
| `created_at` | TIMESTAMPTZ | Auto |

### `sessions`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | Auto-generated |
| `user_id` | UUID FK → users | Nullable (anonymous mode) |
| `title` | VARCHAR(255) | Set from first user message |
| `llm_provider` | VARCHAR(50) | `ollama` or `anthropic` |
| `llm_model` | VARCHAR(100) | e.g. `llama3.2`, `claude-3-5-haiku-20241022` |
| `created_at` | TIMESTAMPTZ | Auto |
| `updated_at` | TIMESTAMPTZ | Auto on update |

### `messages`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | Auto-generated |
| `session_id` | UUID FK → sessions | CASCADE delete |
| `role` | VARCHAR(20) | `user`, `assistant`, `system` |
| `content` | TEXT | Full message text |
| `skill_used` | VARCHAR(50) | `qa`, `ship30`, `artifact`, or NULL |
| `artifact_type` | VARCHAR(20) | `html`, `markdown`, or NULL |
| `artifact_content` | TEXT | Extracted artifact body or NULL |
| `created_at` | TIMESTAMPTZ | Auto |

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | None | Status + active LLM config |
| POST | `/sessions` | None | Create new session |
| GET | `/sessions` | None | List sessions (newest first) |
| GET | `/sessions/{id}` | None | Session + message history |
| PATCH | `/sessions/{id}/title` | None | Rename session |
| DELETE | `/sessions/{id}` | None | Delete + cascade messages |
| POST | `/sessions/{id}/chat` | None | **SSE streaming chat** |
| GET | `/config` | None | Current LLM config |
| PATCH | `/config` | None | Hot-swap LLM provider/model |
| GET | `/config/models` | None | List available models |
| GET | `/docs` | None | Swagger UI |

---

## Agentic Routing Logic

```
User Message
     │
     ▼
Keyword Classifier (regex, zero LLM cost)
     │
     ├── SHIP30_PATTERNS: "write an essay", "atomic essay", etc.
     │         └──► Ship30 Skill
     │
     ├── ARTIFACT_PATTERNS: "generate html", "build a dashboard", etc.
     │         └──► Artifact Skill
     │
     └── Default
               └──► Q&A Skill
```

The `force_skill` request param bypasses classification for testing.

---

## LLM Toggle Switch

The `LLMConfig` singleton holds `provider` and `model` as mutable state.  
`PATCH /config` updates this object in memory — no restart needed.  
`get_engine()` factory reads `llm_config.provider` on every request.

```python
# Runtime toggle — takes effect on the NEXT chat request
llm_config.update(provider="anthropic", model="claude-3-5-haiku-20241022")
```

---

## SSE Streaming Protocol

The `/sessions/{id}/chat` endpoint returns `text/event-stream`.  
Each event is a JSON object on a `data:` line:

```
data: {"type": "skill",          "skill": "qa"}
data: {"type": "text",           "content": "According to Lenny..."}
data: {"type": "artifact_start", "artifact_type": "html"}
data: {"type": "artifact_chunk", "content": "<!DOCTYPE..."}
data: {"type": "artifact_end"}
data: {"type": "done",           "message_id": "uuid"}
data: {"type": "error",          "content": "Error message"}
```

The frontend uses a state machine to parse `artifact_start/chunk/end` events and route content to the artifact viewer panel.

---

## RAG Pipeline

```
[Transcript .md files]
        │
        ▼ ingestor.py
[Parse YAML frontmatter + extract body]
        │
        ▼ Recursive paragraph chunker
[800-word chunks, 100-word overlap, with metadata]
        │
        ▼ embedder.py
[Ollama nomic-embed-text → 768-dim vectors]
        │
        ▼ ChromaDB upsert (cosine distance)
[Persistent local vector store]
        │
        ▼ retriever.py (at query time)
[Embed query → cosine similarity search → top-K chunks]
        │
        ▼ format_context()
[Structured context block injected into system prompt]
```
