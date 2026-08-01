"""
Central configuration for The Lenny Growth Assistant.
LLM provider and model can be switched at runtime via PATCH /config.
"""
import os
from dotenv import load_dotenv

load_dotenv()

# ── PostgreSQL ──────────────────────────────────────────────────────────────
DATABASE_URL: str = os.getenv(
    "DATABASE_URL",
    "sqlite+aiosqlite:///./lenny.db"   # SQLite by default — no Docker needed
)

# ── ChromaDB ────────────────────────────────────────────────────────────────
CHROMA_PERSIST_DIR: str = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
CHROMA_COLLECTION:  str = os.getenv("CHROMA_COLLECTION", "lenny_transcripts")

# ── LLM Engine (runtime-mutable) ────────────────────────────────────────────
class LLMConfig:
    """Mutable singleton that holds the active LLM configuration.
    Updated by PATCH /config without restarting the server."""

    def __init__(self) -> None:
        self.provider: str  = os.getenv("LLM_PROVIDER", "ollama")   # "anthropic" | "ollama"
        self.model:    str  = os.getenv("LLM_MODEL",    "llama3.2")
        self.embed_model: str = os.getenv("EMBED_MODEL", "nomic-embed-text")

    def update(self, provider: str | None = None, model: str | None = None) -> None:
        if provider:
            self.provider = provider
        if model:
            self.model = model

    def as_dict(self) -> dict:
        return {
            "provider":    self.provider,
            "model":       self.model,
            "embed_model": self.embed_model,
        }


llm_config = LLMConfig()

# ── Cloud API Keys ───────────────────────────────────────────────────────────
ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
OPENAI_API_KEY:    str = os.getenv("OPENAI_API_KEY", "")       # optional fallback

# ── Ollama ───────────────────────────────────────────────────────────────────
OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

# ── RAG ──────────────────────────────────────────────────────────────────────
RAG_TOP_K:        int = int(os.getenv("RAG_TOP_K", "5"))
TRANSCRIPT_DIR:   str = os.getenv("TRANSCRIPT_DIR", "./transcripts")

# ── CORS ─────────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS: list[str] = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:5500"
).split(",")
