from langchain_openai import ChatOpenAI

from app.config import settings


def get_chat_model(temperature: float = 0.4) -> ChatOpenAI:
    """Groq's chat completions endpoint is OpenAI-compatible, so LangGraph/LangChain
    can talk to it through ChatOpenAI by pointing base_url at Groq. Generation only —
    language detection stays on Sarvam (see sarvam_client.py)."""
    return ChatOpenAI(
        base_url=settings.groq_base_url,
        api_key=settings.groq_api_key,
        model=settings.groq_chat_model,
        temperature=temperature,
    )
