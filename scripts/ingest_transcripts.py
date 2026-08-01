#!/usr/bin/env python3
"""
One-time transcript ingestion script.
Run this ONCE to clone Lenny's transcripts and build the ChromaDB vector store.

Usage:
  python scripts/ingest_transcripts.py
  python scripts/ingest_transcripts.py --dir ./my_transcripts
  python scripts/ingest_transcripts.py --skip-clone
"""
import asyncio
import argparse
import subprocess
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from app.rag.ingestor import ingest_directory
from app.rag.embedder import embed_and_store
from app.config import TRANSCRIPT_DIR

TRANSCRIPT_REPO = "https://github.com/ChatPRD/lennys-podcast-transcripts"


def clone_transcripts(target_dir: str) -> None:
    """Clone the Lenny transcripts repo if not already present."""
    path = Path(target_dir)
    if path.exists() and any(path.iterdir()):
        print(f"[Setup] Transcript directory already exists: {target_dir}")
        return

    print(f"[Setup] Cloning {TRANSCRIPT_REPO} -> {target_dir}")
    result = subprocess.run(
        ["git", "clone", "--depth=1", TRANSCRIPT_REPO, target_dir],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f"[Setup] ERROR cloning repo:\n{result.stderr}")
        print("[Setup] You can manually download transcripts and pass --dir <path>")
        sys.exit(1)
    print("[Setup] ✓ Transcripts cloned successfully")


async def main(transcript_dir: str, skip_clone: bool) -> None:
    if not skip_clone:
        clone_transcripts(transcript_dir)

    print(f"\n[Step 1/2] Parsing and chunking transcripts from: {transcript_dir}")
    chunks = ingest_directory(transcript_dir)

    if not chunks:
        print("[Error] No chunks produced. Check that the transcript directory has .md files.")
        sys.exit(1)

    print(f"\n[Step 2/2] Embedding {len(chunks)} chunks into ChromaDB...")
    print("  (Using nomic-embed-text via Ollama — make sure Ollama is running)")
    await embed_and_store(chunks)

    print("\n[DONE] Ingestion complete! You can now start the backend and ask questions.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest Lenny's Podcast transcripts into ChromaDB")
    parser.add_argument("--dir", default=TRANSCRIPT_DIR, help="Path to transcripts directory")
    parser.add_argument("--skip-clone", action="store_true", help="Skip git clone if already downloaded")
    args = parser.parse_args()

    asyncio.run(main(args.dir, args.skip_clone))
