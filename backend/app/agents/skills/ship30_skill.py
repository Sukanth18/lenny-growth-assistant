"""
Ship30for30 Skill — generates a ~1250 word atomic essay from transcript insights.
Uses the same RAG retrieval as Q&A, but injects the Ship30for30 system prompt.
"""
from pathlib import Path
from typing import AsyncGenerator

from app.rag.retriever import retrieve, format_context
from app.llm.base import LLMEngine

_PROMPT_FILE = Path(__file__).parent.parent / "prompts" / "ship30_system.txt"
_PROMPT_TEMPLATE = _PROMPT_FILE.read_text(encoding="utf-8")


async def run(
    message:  str,
    history:  list[dict],
    engine:   LLMEngine,
) -> AsyncGenerator[str, None]:
    """
    Synthesize insights from Lenny's transcripts into a Ship30for30 style essay.
    The message is treated as the essay topic/prompt.
    """
    try:
        # 1. Retrieve broad context (more chunks for long-form content)
        chunks = await retrieve(message, top_k=8)
        context_str = format_context(chunks)

        # 2. Build system prompt
        system_prompt = _PROMPT_TEMPLATE.format(context=context_str)

        # 3. Augment user message to make the essay intent crystal clear
        augmented_message = (
            f"Write a Ship30for30-style long-form essay (approximately 1250 words) about: {message}\n"
            "Follow the exact format specified in your instructions. "
            "Ground all insights in the provided transcript context."
        )

        # 4. Stream the essay
        async for token in engine.stream(
            system_prompt=system_prompt,
            messages=history + [{"role": "user", "content": augmented_message}],
            max_tokens=4096,
            temperature=0.75,
        ):
            yield token
    except Exception as e:
        print(f"[ERROR] ship30_skill error: {e}")
        yield f"Error generating essay: {e}"
