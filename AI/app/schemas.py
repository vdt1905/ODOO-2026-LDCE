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
    # `summary` is what the widget prints as prose, whichever branch ran: the
    # one-line introduction to a set of suggestions, or the whole conversational
    # answer. `reply` carries only the latter, and `intent` says which happened,
    # so the client can lay a conversation out differently from a result set.
    summary: str
    reply: str = ""
    intent: str = "plan"
    suggestions: list[SuggestionItemOut]
    languageCode: str
    scriptCode: str
