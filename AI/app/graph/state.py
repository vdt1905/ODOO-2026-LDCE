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

    # 'chat'  -> the message is talk: a greeting, a question about Triplie
    #            itself, a thank-you, anything that wants prose back.
    # 'plan'  -> the message is a planning request, so the catalog is loaded and
    #            the answer comes back as grounded suggestions.
    # The whole point of routing on this is that the catalog branch is only ever
    # entered when the catalog is what was asked for. Before it existed, "who
    # are you?" was answered with four cities and a price list.
    intent: str

    context: dict

    raw_response: str
    suggestions: list[SuggestionItem]
    summary: str

    # The prose answer for a 'chat' turn. Kept separate from `summary` (which
    # introduces a list of suggestions) so the client can tell a conversation
    # from a result set without inspecting the suggestions array.
    reply: str

    retry_count: int
    error: Optional[str]
