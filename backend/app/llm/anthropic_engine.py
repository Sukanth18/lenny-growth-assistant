"""
Anthropic Claude engine implementation.
Supports streaming text generation and embeddings via Voyage AI (Anthropic's partner).
Falls back to Ollama embeddings if EMBED_MODEL is set to nomic-embed-text.
"""
from typing import AsyncGenerator
import anthropic

from app.llm.base import LLMEngine
from app.config import ANTHROPIC_API_KEY


class AnthropicEngine(LLMEngine):
    def __init__(self, model: str = "claude-3-5-sonnet-20241022") -> None:
        if not ANTHROPIC_API_KEY:
            raise ValueError(
                "ANTHROPIC_API_KEY is not set. "
                "Please add it to your .env file or switch to Ollama provider."
            )
        self.model  = model
        self.client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)

    async def stream(
        self,
        system_prompt: str,
        messages: list[dict],
        max_tokens:  int   = 4096,
        temperature: float = 0.7,
    ) -> AsyncGenerator[str, None]:
        """Yield text tokens from Claude using streaming message API."""
        async with self.client.messages.stream(
            model=self.model,
            max_tokens=max_tokens,
            temperature=temperature,
            system=system_prompt,
            messages=messages,
        ) as stream:
            async for text in stream.text_stream:
                yield text

    async def embed(self, text: str) -> list[float]:
        """
        Anthropic doesn't offer native embeddings.
        We delegate to the Ollama engine for embeddings (nomic-embed-text).
        This keeps local + cloud mode consistent.
        """
        from app.llm.ollama_engine import OllamaEngine
        from app.config import llm_config
        ollama = OllamaEngine(model=self.model, embed_model=llm_config.embed_model)
        return await ollama.embed(text)

    async def health_check(self) -> bool:
        try:
            # Minimal call to verify API key is valid
            await self.client.messages.create(
                model=self.model,
                max_tokens=1,
                messages=[{"role": "user", "content": "ping"}],
            )
            return True
        except Exception:
            return False
