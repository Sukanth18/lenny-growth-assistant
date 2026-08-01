# Agent Transcripts — Session 1: RAG Pipeline Setup

**Date:** 2026-07-30  
**Model Used:** Claude Sonnet 4.6  
**Task:** Build the RAG ingestion pipeline for Lenny's transcript corpus

---

## Attempt 1 — FAILED: LangChain approach

**Prompt to agent:**
> "Set up a LangChain-based RAG pipeline that ingests markdown files and stores them in ChromaDB"

**What happened:**
- LangChain added significant complexity — `LangchainChroma` wrapper conflicted with ChromaDB's native Python client version
- Dependency conflicts between `langchain-community==0.2.x` and `chromadb==0.5.x`
- The `DirectoryLoader` couldn't parse YAML frontmatter correctly out of the box
- Error: `ImportError: cannot import name 'Chroma' from 'langchain_community.vectorstores'`

**Fix applied:**
Decided to drop LangChain entirely and use ChromaDB's native Python client directly. This eliminated all version conflicts and reduced the codebase by ~200 lines. The custom `ingestor.py` gave us full control over frontmatter parsing and chunking strategy.

**Lesson:** Don't add framework abstractions for simple pipelines. Raw ChromaDB client is simpler and more reliable.

---

## Attempt 2 — FAILED: Embedding model mismatch

**Problem:** First ingestion run used `sentence-transformers/all-MiniLM-L6-v2` (384-dim), but a second run attempted with `nomic-embed-text` (768-dim). ChromaDB threw:

```
InvalidDimensionException: Embedding dimension 768 does not match collection dimension 384
```

**Fix applied:**
- Added a check in `embedder.py`: if the collection already exists, verify the embedding model matches before upserting
- Documented in README: always delete `./chroma_db` before re-ingesting with a different model
- Committed to `nomic-embed-text` as the single supported local embed model

**Lesson:** Vector store collections are dimension-locked. Document this clearly.

---

## Attempt 3 — SUCCESS

- Switched to `nomic-embed-text` via Ollama throughout
- Custom paragraph-preserving chunker worked correctly
- 500+ episode files chunked into ~12,000 documents
- ChromaDB persisted to `./chroma_db`
- Test query: "how did Figma achieve product-market fit?" → returned 5 relevant chunks from 3 different episodes

---

# Agent Transcripts — Session 2: SSE Streaming + Artifact Parser

**Task:** Build the SSE streaming endpoint and frontend artifact parser

---

## Attempt 1 — FAILED: FastAPI StreamingResponse + asyncio conflict

**Problem:** Initial implementation used `asyncio.Queue` to pass tokens from the LLM to the SSE generator. Under load, the queue would occasionally deadlock when the Ollama client raised a timeout exception inside the coroutine.

**Error:**
```
RuntimeError: Task attached to a different loop
asyncio.exceptions.CancelledError
```

**Fix applied:**
Replaced queue-based approach with direct `async for token in engine.stream(...)` pattern. The streaming generator now directly yields SSE events without any intermediate queue. Much simpler and no deadlock risk.

---

## Attempt 2 — FAILED: Artifact tag detection race condition

**Problem:** The frontend stream parser was splitting on complete `<artifact>` tags, but since these arrive character-by-character, the tag detection was unreliable. When `<artifact type="html">` arrived split across two SSE chunks, the parser missed it.

**Fix applied:**
Moved the tag-detection state machine to the **backend** `chat.py` router. The backend now buffers tokens and only emits `artifact_start`, `artifact_chunk`, and `artifact_end` events — pre-parsed. The frontend receives clean typed events and never sees raw `<artifact>` tags.

**Lesson:** Don't make the frontend parse raw streaming text for structured content. Emit semantic events from the backend.

---

## Attempt 3 — SUCCESS

Clean SSE event protocol. Frontend state machine handles 5 event types cleanly. Artifact renders in under 500ms after stream completes.

---

# Agent Transcripts — Session 3: Ollama Timeout Debugging

**Task:** Handle Ollama connection failures gracefully

---

## Problem observed

When Ollama wasn't running, the `OllamaEngine.stream()` method would hang indefinitely — no timeout, no error — until the user killed the browser tab.

## Fix applied

Added connection timeout via `httpx` client settings in the Ollama client initialization:
```python
self.client = ollama_sdk.AsyncClient(
    host=OLLAMA_BASE_URL,
    timeout=120.0,  # 2 minute timeout for slow hardware
)
```

Also added a `/health` endpoint that pings the LLM engine and returns its status. Frontend shows a toast if health check fails.

## Result

Clear error message: "Cannot connect to Ollama. Make sure it's running: `ollama serve`"
