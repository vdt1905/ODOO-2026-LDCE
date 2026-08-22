from fastapi import APIRouter

from app.graph.build import suggestion_graph
from app.schemas import SuggestionRequest, SuggestionResponse

router = APIRouter(prefix="/api/v1", tags=["suggestions"])


@router.post("/suggestions", response_model=SuggestionResponse)
async def create_suggestions(request: SuggestionRequest) -> SuggestionResponse:
    result = await suggestion_graph.ainvoke(
        {
            "prompt": request.prompt,
            "user_id": request.user_id,
            "trip_id": request.trip_id,
            "retry_count": 0,
        }
    )
    return SuggestionResponse(
        summary=result.get("summary", ""),
        reply=result.get("reply", ""),
        intent=result.get("intent", "plan"),
        suggestions=result.get("suggestions", []),
        languageCode=result.get("language_code", "en-IN"),
        scriptCode=result.get("script_code", "Latn"),
    )


@router.get("/health")
async def health() -> dict:
    return {"status": "ok"}
