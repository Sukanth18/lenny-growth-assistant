"""
Transcript ingestor — parses Lenny's Podcast Markdown transcripts into chunks.
Supports the ChatPRD/lennys-podcast-transcripts repo structure:
  episodes/<guest-name>/transcript.md
Each file has YAML frontmatter with metadata.
"""
import os
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional
import yaml


@dataclass
class TranscriptChunk:
    text:         str
    episode_id:   str
    guest:        str
    title:        str
    chunk_index:  int
    source_file:  str
    metadata: dict = field(default_factory=dict)


def _parse_frontmatter(content: str) -> tuple[dict, str]:
    """Extract YAML frontmatter and remaining body from a markdown file."""
    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            try:
                meta = yaml.safe_load(parts[1]) or {}
                return meta, parts[2]
            except yaml.YAMLError:
                pass
    return {}, content


def _chunk_text(text: str, chunk_size: int = 800, overlap: int = 100) -> list[str]:
    """
    Split text into overlapping chunks respecting paragraph boundaries.
    Target: ~800 words per chunk, ~100 word overlap.
    """
    # Split by double newlines (paragraphs), then re-join up to chunk_size words
    paragraphs = [p.strip() for p in re.split(r"\n\n+", text) if p.strip()]
    chunks: list[str] = []
    current_words: list[str] = []

    for para in paragraphs:
        para_words = para.split()
        if len(current_words) + len(para_words) <= chunk_size:
            current_words.extend(para_words)
        else:
            if current_words:
                chunks.append(" ".join(current_words))
            # Start new chunk with overlap
            current_words = current_words[-overlap:] + para_words

    if current_words:
        chunks.append(" ".join(current_words))

    return chunks


def ingest_directory(transcript_dir: str) -> list[TranscriptChunk]:
    """
    Walk the transcripts directory and return all chunks.
    Expected structure:
      <transcript_dir>/
        <episode-slug>/
          transcript.md     ← or any .md file
    """
    root = Path(transcript_dir)
    all_chunks: list[TranscriptChunk] = []

    if not root.exists():
        raise FileNotFoundError(
            f"Transcript directory not found: {transcript_dir}\n"
            "Run: git clone https://github.com/ChatPRD/lennys-podcast-transcripts transcripts"
        )

    md_files = list(root.rglob("*.md"))
    print(f"[Ingestor] Found {len(md_files)} markdown files in {transcript_dir}")

    for filepath in md_files:
        try:
            content = filepath.read_text(encoding="utf-8", errors="ignore")
            meta, body = _parse_frontmatter(content)

            # Derive episode_id from folder name or filename
            episode_id = filepath.parent.name if filepath.parent != root else filepath.stem
            guest      = meta.get("guest", meta.get("name", episode_id))
            title      = meta.get("title", meta.get("episode", episode_id))

            # Clean body: remove markdown headers for cleaner chunks
            body_clean = re.sub(r"^#{1,6}\s+", "", body, flags=re.MULTILINE)
            body_clean = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", body_clean)  # strip links

            chunks = _chunk_text(body_clean)
            for i, chunk_text in enumerate(chunks):
                all_chunks.append(TranscriptChunk(
                    text=chunk_text,
                    episode_id=episode_id,
                    guest=str(guest),
                    title=str(title),
                    chunk_index=i,
                    source_file=str(filepath.relative_to(root)),
                    metadata={
                        "episode_id":   episode_id,
                        "guest":        str(guest),
                        "title":        str(title),
                        "chunk_index":  i,
                        "source_file":  str(filepath.relative_to(root)),
                    },
                ))

        except Exception as e:
            print(f"[Ingestor] Warning: could not parse {filepath}: {e}")

    print(f"[Ingestor] Total chunks produced: {len(all_chunks)}")
    return all_chunks
