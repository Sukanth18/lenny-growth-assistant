"""
Artifact Skill — generates complete HTML/CSS or Markdown artifacts.
The LLM wraps its output in <artifact type="..."> tags.
The streaming endpoint parses these tags and routes content to the artifact viewer.
"""
from pathlib import Path
from typing import AsyncGenerator

from app.rag.retriever import retrieve, format_context
from app.llm.base import LLMEngine

_PROMPT_FILE = Path(__file__).parent.parent / "prompts" / "artifact_system.txt"
_PROMPT_TEMPLATE = _PROMPT_FILE.read_text(encoding="utf-8")


def _detect_artifact_type(message: str) -> str:
    """Hint to the LLM what type of artifact to generate."""
    msg_lower = message.lower()
    if any(kw in msg_lower for kw in ["html", "webpage", "web page", "ui", "dashboard", "css"]):
        return "html"
    if any(kw in msg_lower for kw in ["markdown", "doc", "document", "report", "template"]):
        return "markdown"
    return "html"  # default to HTML for richness


async def run(
    message:  str,
    history:  list[dict],
    engine:   LLMEngine,
) -> AsyncGenerator[str, None]:
    """
    Generate a self-contained HTML or Markdown artifact, streamed token by token.
    Frontend detects <artifact ...> delimiters to split chat text from artifact content.
    """
    try:
        # 1. Retrieve relevant context
        chunks = await retrieve(message, top_k=4)
        context_str = format_context(chunks)

        # 2. Build system prompt
        system_prompt = _PROMPT_TEMPLATE.format(context=context_str)

        # 3. Hint the artifact type in the message
        artifact_type = _detect_artifact_type(message)
        augmented_message = (
            f"{message}\n"
            f"[Hint: Generate a {artifact_type.upper()} artifact. "
            "Wrap it in <artifact type=\"" + artifact_type + "\"> tags as instructed.]"
        )

        # 4. Stream — frontend parser handles <artifact> tag splitting
        async for token in engine.stream(
            system_prompt=system_prompt,
            messages=history + [{"role": "user", "content": augmented_message}],
            max_tokens=4096,
            temperature=0.6,
        ):
            yield token
    except Exception as e:
        print(f"[ERROR] artifact_skill error: {e}")
        yield f"Error generating artifact: {e}"
