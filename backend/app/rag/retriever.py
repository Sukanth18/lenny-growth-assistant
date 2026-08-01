"""
Retriever — semantic search over embedded Lenny transcripts.
Returns the top-k most relevant chunks for a given query.
"""
from dataclasses import dataclass
import chromadb
from chromadb.config import Settings

from app.config import CHROMA_PERSIST_DIR, CHROMA_COLLECTION, RAG_TOP_K
from app.llm.factory import get_embed_engine
from app.rag.embed_cache import get_cached_embedding, set_cached_embedding


@dataclass
class RetrievedChunk:
    text:       str
    episode_id: str
    guest:      str
    title:      str
    score:      float       # cosine similarity (higher = more relevant)
    source_file: str


_client = None
_collection = None


def _get_chroma_collection() -> chromadb.Collection:
    global _client, _collection
    if _collection is None:
        _client = chromadb.PersistentClient(
            path=CHROMA_PERSIST_DIR,
            settings=Settings(anonymized_telemetry=False),
        )
        _collection = _client.get_or_create_collection(
            name=CHROMA_COLLECTION,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


async def retrieve(query: str, top_k: int = RAG_TOP_K) -> list[RetrievedChunk]:
    """
    Embed the query and return the top_k most semantically similar transcript chunks.
    Returns empty list if the collection is empty (not yet ingested) or on error.
    """
    try:
        collection = _get_chroma_collection()

        if collection.count() == 0:
            return []

        # Check the LRU cache before hitting Ollama (saves ~10-12 s on cache hits)
        query_vec = get_cached_embedding(query)
        if query_vec is None:
            engine    = get_embed_engine()
            query_vec = await engine.embed(query)
            set_cached_embedding(query, query_vec)

        results = collection.query(
            query_embeddings=[query_vec],
            n_results=min(top_k, collection.count()),
            include=["documents", "metadatas", "distances"],
        )

        chunks: list[RetrievedChunk] = []
        for doc, meta, dist in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
        ):
            # ChromaDB cosine distance: 0 = identical, 2 = opposite
            # Convert to similarity score 0→1
            score = 1.0 - (dist / 2.0)
            chunks.append(RetrievedChunk(
                text=doc,
                episode_id=meta.get("episode_id", "unknown"),
                guest=meta.get("guest", "unknown"),
                title=meta.get("title", "unknown"),
                score=score,
                source_file=meta.get("source_file", ""),
            ))

        # Sort by score descending
        chunks.sort(key=lambda c: c.score, reverse=True)
        return chunks
    except Exception as e:
        print(f"[WARN] Retrieval error: {e}")
        return []


def format_context(chunks: list[RetrievedChunk]) -> str:
    """Format retrieved chunks into a structured context block for the LLM."""
    if not chunks:
        return "No relevant transcript context found."

    parts = []
    for i, chunk in enumerate(chunks, 1):
        parts.append(
            f"[Source {i}] Guest: {chunk.guest} | Episode: {chunk.title}\n"
            f"{chunk.text}"
        )
    return "\n\n---\n\n".join(parts)
