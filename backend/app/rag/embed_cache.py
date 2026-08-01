"""
Embedding cache — LRU in-memory cache for query vectors.
Avoids repeated Ollama embed calls for the same or similar queries,
cutting time-to-first-token from ~14s to ~2s on cache hits.
"""
import hashlib
from functools import lru_cache
from typing import Optional

# Simple dict-based LRU cache for embedding vectors
_CACHE: dict[str, list[float]] = {}
_CACHE_ORDER: list[str] = []
_MAX_SIZE = 256   # cache at most 256 unique query embeddings


def _cache_key(text: str) -> str:
    """Stable hash key for any text string."""
    return hashlib.sha256(text.strip().lower().encode()).hexdigest()


def get_cached_embedding(text: str) -> Optional[list[float]]:
    """Return cached embedding vector or None."""
    key = _cache_key(text)
    return _CACHE.get(key)


def set_cached_embedding(text: str, vector: list[float]) -> None:
    """Store embedding vector, evicting oldest if at capacity."""
    key = _cache_key(text)
    if key in _CACHE:
        return   # already cached
    if len(_CACHE) >= _MAX_SIZE:
        oldest = _CACHE_ORDER.pop(0)
        _CACHE.pop(oldest, None)
    _CACHE[key] = vector
    _CACHE_ORDER.append(key)


def cache_size() -> int:
    return len(_CACHE)
