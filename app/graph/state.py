from typing import Optional, TypedDict


class SuggestionItem(TypedDict):
    title: str  # must exactly match a `name` from the fetched MongoDB catalog entries
    description: str
    type: str  # 'city' | 'activity'
    estimatedCost: Optional[float]


class SuggestionState(TypedDict, total=False):
    prompt: str
    user_id: Optional[str]
    trip_id: Optional[str]

    language_code: str
    script_code: str

    context: dict

    raw_response: str
    suggestions: list[SuggestionItem]
    summary: str

    retry_count: int
    error: Optional[str]
