"""
Agent Router — classifies user intent and dispatches to the correct skill.

Skill dispatch order:
  1. Keyword/regex fast-path classifier (no LLM call needed)
  2. If ambiguous, falls back to a cheap LLM intent-classification prompt

Skills:
  - qa       → RAG-grounded Q&A from Lenny's transcripts
  - ship30   → Ship30for30 style 1250-word essay
  - artifact → Generate HTML/CSS or Markdown artifact
"""
import re
from typing import Literal

SkillType = Literal["qa", "ship30", "artifact"]

# ── Keyword Trigger Lists ────────────────────────────────────────────────────

_SHIP30_PATTERNS = [
    r"\bwrite (an |a )?essay\b",
    r"\bship30\b",
    r"\batomic essay\b",
    r"\bwrite (a |an )?article\b",
    r"\bcreate (a |an )?post\b",
    r"\bwrite about\b",
    r"\blong.?form\b",
    r"\bformat (as|like) (an |a )?essay\b",
    r"\bgenerate (a |an )?essay\b",
    r"\b1250 words?\b",
]

_ARTIFACT_PATTERNS = [
    r"\bgenerate (a |an |the )?(html|webpage|web page|ui|dashboard|template|doc|document)\b",
    r"\bcreate (a |an |the )?(html|webpage|web page|ui|dashboard|template|page)\b",
    r"\bbuild (a |an |the )?(html|webpage|web page|ui|dashboard|template)\b",
    r"\bmake (a |an |the )?(html|webpage|web page|ui|dashboard|template)\b",
    r"\bgenerate (a |an |the )?markdown\b",
    r"\bcreate (a |an |the )?markdown\b",
    r"\bartifact\b",
    r"\brender\b.*\b(html|markdown)\b",
    r"\bhtml snippet\b",
    r"\bcss component\b",
]


def classify_intent(message: str) -> SkillType:
    """
    Fast keyword-based intent classifier.
    Returns 'ship30', 'artifact', or 'qa' (default).
    Case-insensitive, no LLM call required.
    """
    msg_lower = message.lower()

    for pattern in _SHIP30_PATTERNS:
        if re.search(pattern, msg_lower):
            return "ship30"

    for pattern in _ARTIFACT_PATTERNS:
        if re.search(pattern, msg_lower):
            return "artifact"

    return "qa"
