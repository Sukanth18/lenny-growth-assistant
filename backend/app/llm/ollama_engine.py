"""
Ollama engine implementation — fully local, zero cloud dependency.
Default model: llama3.2  |  Default embed model: nomic-embed-text
"""
from typing import AsyncGenerator
import ollama as ollama_sdk

from app.llm.base import LLMEngine
from app.config import OLLAMA_BASE_URL


class OllamaEngine(LLMEngine):
    def __init__(
        self,
        model:       str = "llama3.2",
        embed_model: str = "nomic-embed-text",
    ) -> None:
        self.model       = model
        self.embed_model = embed_model
        self.client      = ollama_sdk.AsyncClient(host=OLLAMA_BASE_URL)

    async def stream(
        self,
        system_prompt: str,
        messages:      list[dict],
        max_tokens:    int   = 4096,
        temperature:   float = 0.7,
    ) -> AsyncGenerator[str, None]:
        """Yield tokens from local Ollama model with streaming."""
        full_messages = [{"role": "system", "content": system_prompt}, *messages]
        response = await self.client.chat(
            model=self.model,
            messages=full_messages,
            stream=True,
            options={"num_predict": max_tokens, "temperature": temperature},
        )
        async for chunk in response:
            if chunk.get("message", {}).get("content"):
                yield chunk["message"]["content"]

    async def embed(self, text: str) -> list[float]:
        """Return embedding vector using nomic-embed-text or configured embed model.

        nomic-embed-text has an ~8192 token context window (~7000 chars).
        Truncate to avoid ResponseError: the input length exceeds the context length.
        """
        MAX_CHARS = 7000
        if len(text) > MAX_CHARS:
            text = text[:MAX_CHARS]
        response = await self.client.embeddings(
            model=self.embed_model,
            prompt=text,
        )
        return response["embedding"]

    async def health_check(self) -> bool:
        try:
            models = await self.client.list()
            return True
        except Exception:
            return False
