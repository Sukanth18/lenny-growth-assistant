"""
Abstract base class for all LLM engine implementations.
Every engine must implement async streaming and optional embedding.
"""
from abc import ABC, abstractmethod
from typing import AsyncGenerator


class LLMEngine(ABC):
    """Pluggable LLM engine interface. Swap Anthropic ↔ Ollama without touching agent code."""

    @abstractmethod
    async def stream(
        self,
        system_prompt: str,
        messages: list[dict],
        max_tokens: int = 4096,
        temperature: float = 0.7,
    ) -> AsyncGenerator[str, None]:
        """Yield response text tokens one by one."""
        ...

    @abstractmethod
    async def embed(self, text: str) -> list[float]:
        """Return embedding vector for a given text."""
        ...

    @abstractmethod
    async def health_check(self) -> bool:
        """Return True if the engine is reachable and ready."""
        ...
