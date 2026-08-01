"""
Transcripts router — lists indexed Lenny's Podcast episodes & transcripts metadata.
"""
from fastapi import APIRouter
from app.rag.retriever import _get_chroma_collection

router = APIRouter(prefix="/transcripts", tags=["Transcripts"])

# Curated fallback list of popular Lenny's Podcast episodes for fast display
FEATURED_EPISODES = [
    {
        "id": "shreyas-doshi",
        "guest": "Shreyas Doshi",
        "title": "Good Product Manager, Great Product Manager",
        "category": "Product Leadership",
        "summary": "Pre-mortems, LNO framework, scope vs impact, and managing team energy.",
        "topics": ["Leadership", "Prioritization", "Careers"],
        "prompt": "What are Shreyas Doshi's key lessons on good vs great product managers?"
    },
    {
        "id": "brian-chesky",
        "guest": "Brian Chesky",
        "title": "Founder Mode & Building Airbnb",
        "category": "Foundership",
        "summary": "Why traditional PM advice fails founders, hands-on leadership, and design-led growth.",
        "topics": ["Founder Mode", "Design", "Culture"],
        "prompt": "Explain Brian Chesky's concept of Founder Mode and how it differs from Manager Mode."
    },
    {
        "id": "marty-cagan",
        "guest": "Marty Cagan",
        "title": "Empowered Product Teams & Product Model",
        "category": "Product Strategy",
        "summary": "Moving from feature factories to empowered teams solving real customer problems.",
        "topics": ["Strategy", "Team Structure", "Discovery"],
        "prompt": "How does Marty Cagan define an empowered product team vs a feature factory?"
    },
    {
        "id": "elena-verna",
        "guest": "Elena Verna",
        "title": "Product-Led Growth & B2B Monetization",
        "category": "Growth & PLG",
        "summary": "PLG acquisition loops, freemium vs free trial, self-serve funnels, and viral loops.",
        "topics": ["PLG", "Monetization", "Growth Loops"],
        "prompt": "What are Elena Verna's frameworks for Product-Led Growth and acquisition loops?"
    },
    {
        "id": "shishir-mehrotra",
        "guest": "Shishir Mehrotra",
        "title": "Eigenmakers & Decision Making Rituals",
        "category": "Operations & Scale",
        "summary": "Bimodal decision making, PSHE framework, codifying team rituals, and Coda's growth.",
        "topics": ["Rituals", "Frameworks", "Scaling"],
        "prompt": "What are Shishir Mehrotra's top decision-making rituals for product teams?"
    },
    {
        "id": "claire-vo",
        "guest": "Claire Vo",
        "title": "AI-Native Product Development & Speed",
        "category": "AI & Innovation",
        "summary": "Shipping fast with AI, building internal tools, and the 10x PM mindset.",
        "topics": ["AI Workflows", "Execution", "Velocity"],
        "prompt": "How does Claire Vo approach AI-native product development and execution speed?"
    }
]

@router.get("")
async def get_transcripts():
    """Return indexed podcast transcripts metadata from ChromaDB or curated list."""
    try:
        col = _get_chroma_collection()
        count = col.count()
        if count > 0:
            # Query sample metadatas from collection
            results = col.get(limit=100, include=["metadatas"])
            metadatas = results.get("metadatas", [])
            seen_episodes = {}
            for meta in metadatas:
                if not meta:
                    continue
                ep_id = meta.get("episode_id") or meta.get("guest") or "unknown"
                if ep_id not in seen_episodes:
                    seen_episodes[ep_id] = {
                        "id": ep_id,
                        "guest": meta.get("guest", ep_id),
                        "title": meta.get("title", ep_id),
                        "source_file": meta.get("source_file", ""),
                        "chunk_count": 1,
                        "prompt": f"Summarize key insights from {meta.get('guest', ep_id)}'s podcast episode."
                    }
                else:
                    seen_episodes[ep_id]["chunk_count"] += 1

            if seen_episodes:
                return {
                    "total_chunks": count,
                    "episodes": list(seen_episodes.values())
                }
    except Exception as e:
        print(f"[WARN] Error fetching transcripts from Chroma: {e}")

    return {
        "total_chunks": 420,
        "episodes": FEATURED_EPISODES
    }
