"""
Config router — view and hot-swap the active LLM provider/model.
"""
from fastapi import APIRouter, HTTPException

from app.config import llm_config, ANTHROPIC_API_KEY, OLLAMA_BASE_URL
from app.schemas import LLMConfigOut, LLMConfigUpdate
from app.llm.factory import invalidate_engine_cache

router = APIRouter(prefix="/config", tags=["Config"])


@router.get("", response_model=LLMConfigOut)
async def get_config():
    """Return the current active LLM configuration."""
    return LLMConfigOut(**llm_config.as_dict())


@router.patch("", response_model=LLMConfigOut)
async def update_config(body: LLMConfigUpdate):
    """
    Hot-swap the LLM provider or model without restarting the server.
    Changes take effect on the next request.
    """
    if body.provider == "anthropic" and not ANTHROPIC_API_KEY:
        raise HTTPException(
            status_code=400,
            detail="ANTHROPIC_API_KEY is not configured. Add it to your .env file.",
        )
    llm_config.update(provider=body.provider, model=body.model)
    invalidate_engine_cache()   # drop stale singleton so next request picks up new settings
    return LLMConfigOut(**llm_config.as_dict())


@router.get("/models")
async def list_available_models():
    """List models available in the current provider."""
    if llm_config.provider == "ollama":
        try:
            import ollama as ollama_sdk
            from app.config import OLLAMA_BASE_URL
            client = ollama_sdk.AsyncClient(host=OLLAMA_BASE_URL)
            models_resp = await client.list()
            names = [m["name"] for m in models_resp.get("models", [])]
            return {"provider": "ollama", "models": names}
        except Exception as e:
            return {"provider": "ollama", "models": [], "error": str(e)}
    else:
        return {
            "provider": "anthropic",
            "models": [
                "claude-3-5-sonnet-20241022",
                "claude-3-5-haiku-20241022",
                "claude-3-opus-20240229",
            ],
        }
