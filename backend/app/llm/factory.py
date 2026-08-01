"""
LLM engine factory — returns the correct engine based on current config.
Engines are cached as singletons to avoid re-creating HTTP clients on every request.
"""
from app.llm.base import LLMEngine
from app.config import llm_config

# ── Singleton caches ─────────────────────────────────────────────────────────
_engine_cache: dict[str, LLMEngine] = {}
_embed_engine_cache: dict[str, LLMEngine] = {}


def get_engine() -> LLMEngine:
    """Return the active LLM engine, reusing an existing instance when possible."""
    key = f"{llm_config.provider}:{llm_config.model}"
    if key not in _engine_cache:
        if llm_config.provider == "anthropic":
            from app.llm.anthropic_engine import AnthropicEngine
            _engine_cache[key] = AnthropicEngine(model=llm_config.model)
        else:
            from app.llm.ollama_engine import OllamaEngine
            _engine_cache[key] = OllamaEngine(model=llm_config.model, embed_model=llm_config.embed_model)
    return _engine_cache[key]


def get_embed_engine() -> LLMEngine:
    """Always returns Ollama for embeddings (consistent local/cloud behaviour)."""
    key = f"ollama-embed:{llm_config.embed_model}"
    if key not in _embed_engine_cache:
        from app.llm.ollama_engine import OllamaEngine
        _embed_engine_cache[key] = OllamaEngine(
            model=llm_config.model,
            embed_model=llm_config.embed_model,
        )
    return _embed_engine_cache[key]


def invalidate_engine_cache() -> None:
    """Call this after PATCH /config so new settings take effect."""
    _engine_cache.clear()
    _embed_engine_cache.clear()
