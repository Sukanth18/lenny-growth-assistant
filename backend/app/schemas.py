"""
Pydantic schemas for request/response validation.
"""
import uuid
from datetime import datetime
from typing import Optional, Literal

from pydantic import BaseModel, Field


# ── LLM Config ───────────────────────────────────────────────────────────────

class LLMConfigOut(BaseModel):
    provider:    str
    model:       str
    embed_model: str

class LLMConfigUpdate(BaseModel):
    provider: Optional[Literal["anthropic", "ollama"]] = None
    model:    Optional[str] = None


# ── User ─────────────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id:         uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True


# ── Session ───────────────────────────────────────────────────────────────────

class SessionCreate(BaseModel):
    title:        str = Field(default="New Chat", max_length=255)
    llm_provider: Literal["anthropic", "ollama"] = "ollama"
    llm_model:    str = "llama3.2"

class SessionOut(BaseModel):
    id:           uuid.UUID
    title:        str
    llm_provider: str
    llm_model:    str
    created_at:   datetime
    updated_at:   datetime

    class Config:
        from_attributes = True

class SessionWithMessages(SessionOut):
    messages: list["MessageOut"] = []


# ── Message ───────────────────────────────────────────────────────────────────

class MessageOut(BaseModel):
    id:               uuid.UUID
    session_id:       uuid.UUID
    role:             str
    content:          str
    skill_used:       Optional[str]
    artifact_type:    Optional[str]
    artifact_content: Optional[str]
    created_at:       datetime

    class Config:
        from_attributes = True


# ── Chat Request ──────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message:      str = Field(..., min_length=1, max_length=10_000)
    force_skill:  Optional[Literal["qa", "ship30", "artifact"]] = None


# ── Health ────────────────────────────────────────────────────────────────────

class HealthOut(BaseModel):
    status:   str = "ok"
    version:  str = "1.0.0"
    llm:      LLMConfigOut


SessionWithMessages.model_rebuild()
