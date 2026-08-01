"""
Q&A Skill — answers product/growth questions grounded in Lenny's transcripts.
Uses RAG retrieval to find relevant context, then streams a cited answer.
"""
from pathlib import Path
from typing import AsyncGenerator

from app.rag.retriever import retrieve, format_context
from app.llm.base import LLMEngine

_PROMPT_FILE = Path(__file__).parent.parent / "prompts" / "qa_system.txt"
_PROMPT_TEMPLATE = _PROMPT_FILE.read_text(encoding="utf-8")


async def run(
    message:  str,
    history:  list[dict],
    engine:   LLMEngine,
) -> AsyncGenerator[str, None]:
    """
    Retrieve relevant transcript chunks, build system prompt, stream answer.
    Yields: text tokens, then a final metadata event.
    """
    try:
        # 1. Retrieve context
        chunks = await retrieve(message)
        context_str = format_context(chunks)

        # 2. Build system prompt with injected context
        system_prompt = _PROMPT_TEMPLATE.format(context=context_str)

        # 3. Stream response
        async for token in engine.stream(
            system_prompt=system_prompt,
            messages=history + [{"role": "user", "content": message}],
            max_tokens=2048,
            temperature=0.5,
        ):
            yield token
    except Exception as e:
        print(f"[ERROR] qa_skill error: {e}")
        yield f"Error generating response: {e}"
