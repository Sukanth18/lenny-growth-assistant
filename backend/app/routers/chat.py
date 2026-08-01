"""
Chat router — the core streaming SSE endpoint.
Dispatches to the correct skill and streams structured events to the frontend.

SSE Event Types:
  {"type": "skill",          "skill": "qa|ship30|artifact"}
  {"type": "text",           "content": "...token..."}
  {"type": "artifact_start", "artifact_type": "html|markdown"}
  {"type": "artifact_chunk", "content": "...token..."}
  {"type": "artifact_end"}
  {"type": "done",           "message_id": "...uuid..."}
  {"type": "error",          "content": "...message..."}
"""
import json
import uuid
import re
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import Session, Message
from app.schemas import ChatRequest
from app.agents.router import classify_intent
from app.agents.skills import qa_skill, ship30_skill, artifact_skill
from app.llm.factory import get_engine

router = APIRouter(prefix="/sessions", tags=["Chat"])

# Regex to detect artifact boundaries in the streamed text
_ARTIFACT_OPEN_RE  = re.compile(r'<artifact\s+type=["\'](\w+)["\']>', re.IGNORECASE)
_ARTIFACT_CLOSE_RE = re.compile(r'</artifact>', re.IGNORECASE)


def _sse(event: dict) -> str:
    """Format a dict as an SSE data line."""
    return f"data: {json.dumps(event)}\n\n"


async def _stream_skill(
    message:    str,
    history:    list[dict],
    skill:      str,
) -> AsyncGenerator[str, None]:
    """Run the appropriate skill and stream structured SSE events."""
    engine = get_engine()

    # Immediately acknowledge receipt so the UI shows a spinner with zero wait
    yield _sse({"type": "thinking"})

    # Announce which skill is being used
    yield _sse({"type": "skill", "skill": skill})


    # Select skill runner
    if skill == "ship30":
        token_gen = ship30_skill.run(message, history, engine)
    elif skill == "artifact":
        token_gen = artifact_skill.run(message, history, engine)
    else:
        token_gen = qa_skill.run(message, history, engine)

    # State machine for artifact parsing with instant token streaming
    in_artifact   = False
    artifact_type = None
    buffer        = ""

    async for token in token_gen:
        buffer += token

        if not in_artifact:
            open_match = _ARTIFACT_OPEN_RE.search(buffer)
            if open_match:
                # Emit text before the tag
                pre_text = buffer[:open_match.start()]
                if pre_text:
                    yield _sse({"type": "text", "content": pre_text})

                artifact_type = open_match.group(1).lower()
                yield _sse({"type": "artifact_start", "artifact_type": artifact_type})
                in_artifact = True
                buffer = buffer[open_match.end():]
            elif "<" not in buffer:
                # Instant flush: no tag start present in buffer
                yield _sse({"type": "text", "content": buffer})
                buffer = ""
            else:
                # Tag start '<' present: flush text prior to '<'
                idx = buffer.find("<")
                if idx > 0:
                    yield _sse({"type": "text", "content": buffer[:idx]})
                    buffer = buffer[idx:]
                # If buffer gets too long without matching <artifact...>, flush safety head
                if len(buffer) > 40:
                    yield _sse({"type": "text", "content": buffer[:1]})
                    buffer = buffer[1:]
        else:
            close_match = _ARTIFACT_CLOSE_RE.search(buffer)
            if close_match:
                artifact_chunk = buffer[:close_match.start()]
                if artifact_chunk:
                    yield _sse({"type": "artifact_chunk", "content": artifact_chunk})
                yield _sse({"type": "artifact_end"})
                in_artifact   = False
                artifact_type = None
                buffer        = buffer[close_match.end():]
            elif "</" not in buffer:
                # Instant flush artifact chunk
                yield _sse({"type": "artifact_chunk", "content": buffer})
                buffer = ""
            else:
                idx = buffer.find("</")
                if idx > 0:
                    yield _sse({"type": "artifact_chunk", "content": buffer[:idx]})
                    buffer = buffer[idx:]
                if len(buffer) > 20:
                    yield _sse({"type": "artifact_chunk", "content": buffer[:1]})
                    buffer = buffer[1:]

    # Flush remaining buffer
    if buffer:
        if in_artifact:
            yield _sse({"type": "artifact_chunk", "content": buffer})
            yield _sse({"type": "artifact_end"})
        else:
            yield _sse({"type": "text", "content": buffer})


@router.post("/{session_id}/chat")
async def chat_stream(
    session_id: uuid.UUID,
    body:       ChatRequest,
    db:         AsyncSession = Depends(get_db),
):
    """
    Main streaming endpoint. Send a user message and receive SSE-streamed response.
    Saves both user and assistant messages to the database after streaming completes.
    """
    # 1. Validate session exists (auto-create if missing)
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        user = await _get_or_create_default_user(db)
        session = Session(
            id=session_id,
            user_id=user.id,
            title=body.message[:80] + ("…" if len(body.message) > 80 else ""),
            llm_provider="ollama",
            llm_model="llama3.2",
        )
        db.add(session)
        await db.commit()

    # 2. Load conversation history (last 20 messages for context window management)
    msgs_result = await db.execute(
        select(Message)
        .where(Message.session_id == session_id)
        .order_by(Message.created_at.desc())
        .limit(20)
    )
    history_rows = list(reversed(msgs_result.scalars().all()))
    history = [{"role": m.role, "content": m.content} for m in history_rows]

    # 3. Determine skill to use
    skill = body.force_skill or classify_intent(body.message)

    # 4. Save user message to DB
    user_msg = Message(
        session_id=session_id,
        role="user",
        content=body.message,
    )
    db.add(user_msg)

    # Auto-set session title from first message
    if not history:
        session.title = body.message[:80] + ("…" if len(body.message) > 80 else "")

    await db.commit()

    # 5. Stream response, collect full text and artifact for DB storage
    async def event_generator() -> AsyncGenerator[str, None]:
        full_text       = []
        artifact_buf    = []
        final_art_type  = None
        collecting_art  = False
        msg_id          = str(uuid.uuid4())

        try:
            async for event_str in _stream_skill(body.message, history, skill):
                yield event_str

                # Parse event for DB storage
                try:
                    ev = json.loads(event_str.removeprefix("data: ").strip())
                    if ev["type"] == "text":
                        full_text.append(ev["content"])
                    elif ev["type"] == "artifact_start":
                        final_art_type = ev["artifact_type"]
                        collecting_art = True
                    elif ev["type"] == "artifact_chunk":
                        artifact_buf.append(ev["content"])
                    elif ev["type"] == "artifact_end":
                        collecting_art = False
                except Exception:
                    pass

            # Emit done event
            yield _sse({"type": "done", "message_id": msg_id})

        except Exception as e:
            yield _sse({"type": "error", "content": str(e)})
            return

        # 6. Persist assistant message to DB (after stream completes)
        assistant_content  = "".join(full_text).strip()
        artifact_content   = "".join(artifact_buf).strip() or None

        async with db.begin_nested():
            assistant_msg = Message(
                id=uuid.UUID(msg_id),
                session_id=session_id,
                role="assistant",
                content=assistant_content,
                skill_used=skill,
                artifact_type=final_art_type,
                artifact_content=artifact_content,
            )
            db.add(assistant_msg)
        await db.commit()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control":     "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
