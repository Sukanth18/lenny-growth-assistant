"""
Embedder — converts transcript chunks into vectors and upserts into ChromaDB.
Uses nomic-embed-text via Ollama for 100% local operation.
"""
import asyncio
import chromadb
from chromadb.config import Settings

from app.config import CHROMA_PERSIST_DIR, CHROMA_COLLECTION
from app.rag.ingestor import TranscriptChunk
from app.llm.factory import get_embed_engine


def _get_chroma_collection() -> chromadb.Collection:
    """Return (or create) the persistent ChromaDB collection."""
    client = chromadb.PersistentClient(
        path=CHROMA_PERSIST_DIR,
        settings=Settings(anonymized_telemetry=False),
    )
    collection = client.get_or_create_collection(
        name=CHROMA_COLLECTION,
        metadata={"hnsw:space": "cosine"},
    )
    return collection


async def embed_and_store(chunks: list[TranscriptChunk], batch_size: int = 32) -> None:
    """
    Embed all chunks in batches and upsert to ChromaDB.
    Idempotent: uses chunk ID as document ID so re-running is safe.
    """
    collection = _get_chroma_collection()
    engine     = get_embed_engine()

    print(f"[Embedder] Embedding {len(chunks)} chunks in batches of {batch_size}...")

    for batch_start in range(0, len(chunks), batch_size):
        batch = chunks[batch_start: batch_start + batch_size]

        import urllib.parse
        ids        = [f"{urllib.parse.quote_plus(c.source_file)}__chunk_{c.chunk_index}" for c in batch]
        documents  = [c.text for c in batch]
        metadatas  = [c.metadata for c in batch]

        # Embed concurrently within batch
        embeddings = await asyncio.gather(
            *[engine.embed(c.text) for c in batch]
        )

        collection.upsert(
            ids=ids,
            documents=documents,
            embeddings=list(embeddings),
            metadatas=metadatas,
        )
        print(f"[Embedder] Upserted batch {batch_start // batch_size + 1} "
              f"({batch_start + len(batch)}/{len(chunks)})")

    print(f"[OK] Done. Collection '{CHROMA_COLLECTION}' has "
          f"{collection.count()} documents.")
