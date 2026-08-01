"""
Sessions router — CRUD for chat sessions.
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Session, Message, User
from app.schemas import SessionCreate, SessionOut, SessionWithMessages, MessageOut

router = APIRouter(prefix="/sessions", tags=["Sessions"])


async def _get_or_create_default_user(db: AsyncSession) -> User:
    """Return the single default user (anonymous mode). Creates one if none exists."""
    result = await db.execute(select(User).limit(1))
    user = result.scalar_one_or_none()
    if not user:
        user = User()
        db.add(user)
        await db.commit()
        await db.refresh(user)
    return user


@router.post("", response_model=SessionOut, status_code=status.HTTP_201_CREATED)
async def create_session(body: SessionCreate, db: AsyncSession = Depends(get_db)):
    """Create a new chat session (equivalent to 'New Chat' button)."""
    user = await _get_or_create_default_user(db)
    session = Session(
        user_id=user.id,
        title=body.title,
        llm_provider=body.llm_provider,
        llm_model=body.llm_model,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.get("", response_model=list[SessionOut])
async def list_sessions(db: AsyncSession = Depends(get_db)):
    """List all sessions, newest first."""
    result = await db.execute(
        select(Session).order_by(Session.updated_at.desc())
    )
    return result.scalars().all()


@router.get("/{session_id}", response_model=SessionWithMessages)
async def get_session(session_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Get a session and its full message history."""
    result = await db.execute(
        select(Session)
        .options(selectinload(Session.messages))
        .where(Session.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return session


@router.patch("/{session_id}/title", response_model=SessionOut)
async def update_session_title(
    session_id: uuid.UUID, title: str, db: AsyncSession = Depends(get_db)
):
    """Update session title (auto-set from first user message)."""
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.title = title[:255]
    await db.commit()
    await db.refresh(session)
    return session


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(session_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Delete a session and all its messages (cascade)."""
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    await db.delete(session)
    await db.commit()
