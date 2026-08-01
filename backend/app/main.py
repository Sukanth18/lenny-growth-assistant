"""
FastAPI application entry point — The Lenny Growth Assistant backend.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from app.config import ALLOWED_ORIGINS, llm_config
from app.database import init_db
from app.routers import sessions, chat, config_router
from app.schemas import HealthOut, LLMConfigOut


# ── Lifespan ─────────────────────────────────────────────────────────────────

import asyncio

async def _warmup_models() -> None:
    """
    Pre-load both Ollama models into VRAM so the first user request
    doesn't pay the cold-start penalty (~15-25 s).
    Runs concurrently in the background immediately after startup.
    """
    from app.llm.factory import get_engine, get_embed_engine
    from app.config import llm_config

    if llm_config.provider != "ollama":
        return  # cloud providers (Anthropic) have no local cold-start

    async def _ping_embed():
        try:
            engine = get_embed_engine()
            await engine.embed("warmup")
            print("[OK] Embed model warmed up (nomic-embed-text)")
        except Exception as e:
            print(f"[WARN] Embed warmup failed: {e}")

    async def _ping_llm():
        try:
            engine = get_engine()
            # Consume one token to trigger model load — then discard
            async for _ in engine.stream("You are a helpful assistant.", [{"role": "user", "content": "Hi"}], max_tokens=1):
                break
            print(f"[OK] LLM warmed up ({llm_config.model})")
        except Exception as e:
            print(f"[WARN] LLM warmup failed: {e}")

    # Run both warm-ups concurrently
    await asyncio.gather(_ping_embed(), _ping_llm())


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database tables and pre-warm Ollama models on startup."""
    print("[INFO] Starting Lenny Growth Assistant...")
    await init_db()
    print("[OK] Database tables initialized")
    print(f"[OK] LLM Provider: {llm_config.provider} | Model: {llm_config.model}")

    # Kick off model warm-up in the background (non-blocking)
    asyncio.create_task(_warmup_models())
    print("[INFO] Model warm-up started in background...")

    yield
    print("[INFO] Shutting down...")



# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="The Lenny Growth Assistant API",
    description=(
        "AI-powered conversational assistant grounded in Lenny's Podcast transcripts. "
        "Features: RAG Q&A, Ship30for30 essays, and live artifact generation."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routers import sessions, chat, config_router, transcripts

# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(sessions.router)
app.include_router(chat.router)
app.include_router(config_router.router)
app.include_router(transcripts.router)



# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthOut, tags=["Health"])
async def health():
    return HealthOut(
        status="ok",
        version="1.0.0",
        llm=LLMConfigOut(**llm_config.as_dict()),
    )


# ── Serve frontend static files ───────────────────────────────────────────────

_FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "frontend")

if os.path.exists(_FRONTEND_DIR):
    app.mount("/static", StaticFiles(directory=_FRONTEND_DIR), name="static")

    @app.get("/", include_in_schema=False)
    async def serve_frontend():
        return FileResponse(os.path.join(_FRONTEND_DIR, "index.html"))
