import httpx

from app.config import settings

_LANGUAGE_NAMES = {
    "en-IN": "English",
    "hi-IN": "Hindi",
    "bn-IN": "Bengali",
    "gu-IN": "Gujarati",
    "kn-IN": "Kannada",
    "ml-IN": "Malayalam",
    "mr-IN": "Marathi",
    "od-IN": "Odia",
    "pa-IN": "Punjabi",
    "ta-IN": "Tamil",
    "te-IN": "Telugu",
}


def language_name(language_code: str | None) -> str:
    return _LANGUAGE_NAMES.get(language_code or "", "English")


async def identify_language(text: str) -> dict:
    """Calls Sarvam's Language Identification API. Falls back to English on any
    failure (missing key, network issue, unsupported input) so the graph never
    breaks on this best-effort step."""
    if not text.strip():
        return {"language_code": "en-IN", "script_code": "Latn"}

    url = f"{settings.sarvam_base_url}/text-lid"
    headers = {
        "api-subscription-key": settings.sarvam_api_key,
        "Content-Type": "application/json",
    }
    payload = {"input": text[:1000]}

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            return {
                "language_code": data.get("language_code") or "en-IN",
                "script_code": data.get("script_code") or "Latn",
            }
    except (httpx.HTTPError, ValueError):
        return {"language_code": "en-IN", "script_code": "Latn"}
