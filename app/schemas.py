from typing import Optional

from pydantic import BaseModel, Field


class SuggestionRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=1000)
    user_id: Optional[str] = None
    trip_id: Optional[str] = None


class SuggestionItemOut(BaseModel):
    title: str
    description: str
    type: str
    estimatedCost: Optional[float] = None


class SuggestionResponse(BaseModel):
    summary: str
    suggestions: list[SuggestionItemOut]
    languageCode: str
    scriptCode: str
