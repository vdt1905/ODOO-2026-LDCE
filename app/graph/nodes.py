import json
import re

from bson import ObjectId
from langchain_core.messages import HumanMessage, SystemMessage

from app import db
from app.graph.state import SuggestionState
from app.groq_client import get_chat_model
from app.sarvam_client import identify_language, language_name

MAX_RETRIES = 1

# Internal/binary Mongo fields the LLM never needs. Everything else on a city/activity
# document — including any new field you add later, like a longer `description` — is
# passed through automatically, so the catalog schema can grow without touching this file.
_EXCLUDE_FIELDS = {"_id", "imageUrl", "__v", "createdAt", "updatedAt"}

SYSTEM_PROMPT = """You are the trip-planning assistant for GlobeTrotter, a multi-city travel \
itinerary app. Given a traveler's request and a catalog context pulled from the app's own \
MongoDB (a list of "cities" and a list of "activities"), suggest concrete next steps for \
their trip.

STRICT RULE: you may suggest ONLY entries that literally appear in the context's "cities" or \
"activities" arrays below. Copy each suggestion's "title" character-for-character from a \
context entry's "name" field. Never invent, generalize, or suggest a city/activity that is \
not in the context, even if the context looks sparse or unrelated to the request — in that \
case, pick the closest entries that ARE present instead of making something up.

Respond in {language}, using {language} script, regardless of what language this instruction \
is written in.

Respond with ONLY a JSON object (no markdown fences, no commentary) matching this shape:
{{
  "summary": "one short sentence introducing the suggestions",
  "suggestions": [
    {{"title": "<exact name from context>", "description": "...", "type": "city|activity"}}
  ]
}}
Return 3 to 6 suggestions, type "city" for entries from the cities array and "activity" for \
entries from the activities array."""


async def identify_language_node(state: SuggestionState) -> dict:
    result = await identify_language(state["prompt"])
    return {"language_code": result["language_code"], "script_code": result["script_code"]}


def _serialize_catalog_doc(doc: dict, extra_exclude: frozenset = frozenset()) -> dict:
    return {
        key: value
        for key, value in doc.items()
        if key not in _EXCLUDE_FIELDS
        and key not in extra_exclude
        and not isinstance(value, ObjectId)
    }


async def fetch_context_node(state: SuggestionState) -> dict:
    context: dict = {}

    trip_id = state.get("trip_id")
    if trip_id:
        trip_context = await db.get_trip_context(trip_id)
        if trip_context:
            context["trip"] = trip_context

    cities = await db.search_cities([state["prompt"]], limit=5)
    city_name_by_id = {c["_id"]: c["name"] for c in cities}
    context["cities"] = [_serialize_catalog_doc(c) for c in cities]

    activities = await db.search_activities(list(city_name_by_id.keys()), [state["prompt"]], limit=8)
    context["activities"] = [
        {**_serialize_catalog_doc(a, extra_exclude=frozenset({"city"})), "city": city_name_by_id.get(a.get("city"))}
        for a in activities
    ]

    return {"context": context}


def _extract_json(raw_text: str) -> dict:
    cleaned = re.sub(r"^```(?:json)?|```$", "", raw_text.strip(), flags=re.MULTILINE).strip()
    return json.loads(cleaned)


def _catalog_lookup(context: dict) -> dict:
    """Maps lowercased catalog name -> the real DB fields for that entry, so the model's
    output can be checked against (and its cost overridden by) the actual database row."""
    lookup: dict = {}
    for city in context.get("cities", []):
        lookup[city["name"].strip().lower()] = {
            "title": city["name"],
            "type": "city",
            "estimatedCost": city.get("costIndex"),
        }
    for activity in context.get("activities", []):
        lookup[activity["name"].strip().lower()] = {
            "title": activity["name"],
            "type": "activity",
            "estimatedCost": activity.get("cost"),
        }
    return lookup


def _ground_suggestions(raw_suggestions: list, lookup: dict) -> list:
    """Drops any suggestion whose title isn't an exact (case-insensitive) match against the
    fetched catalog, and replaces type/estimatedCost with the real DB values — the model's
    prose (description) is kept, but never its claim about what exists or what it costs."""
    grounded = []
    seen = set()
    for item in raw_suggestions:
        title = str(item.get("title", "")).strip()
        match = lookup.get(title.lower())
        if not match or title.lower() in seen:
            continue
        seen.add(title.lower())
        grounded.append(
            {
                "title": match["title"],
                "description": str(item.get("description", "")).strip(),
                "type": match["type"],
                "estimatedCost": match["estimatedCost"],
            }
        )
    return grounded


def _fallback_from_context(context: dict, limit: int = 6) -> list:
    """Deterministic, LLM-free suggestions built straight from the catalog — used when
    generation fails entirely or produces nothing that matches the database."""
    items = []
    for city in context.get("cities", []):
        items.append(
            {
                "title": city["name"],
                "description": f"Catalog destination in {city.get('country', 'its region')}.",
                "type": "city",
                "estimatedCost": city.get("costIndex"),
            }
        )
    for activity in context.get("activities", []):
        items.append(
            {
                "title": activity["name"],
                "description": f"Catalog {activity.get('type') or 'activity'}.",
                "type": "activity",
                "estimatedCost": activity.get("cost"),
            }
        )
    return items[:limit]


async def generate_suggestions_node(state: SuggestionState) -> dict:
    model = get_chat_model()
    context = state.get("context", {})
    system = SYSTEM_PROMPT.format(language=language_name(state.get("language_code")))
    user_content = (
        f"Traveler's request: {state['prompt']}\n\n"
        f"Catalog context (JSON): {json.dumps(context)}"
    )

    response = await model.ainvoke(
        [SystemMessage(content=system), HumanMessage(content=user_content)]
    )
    raw_text = response.content if isinstance(response.content, str) else str(response.content)

    try:
        parsed = _extract_json(raw_text)
    except (json.JSONDecodeError, AttributeError):
        return {
            "raw_response": raw_text,
            "error": "unparseable_json",
            "retry_count": state.get("retry_count", 0) + 1,
        }

    lookup = _catalog_lookup(context)
    grounded = _ground_suggestions(parsed.get("suggestions", []), lookup)
    if not grounded:
        grounded = _fallback_from_context(context)

    return {
        "raw_response": raw_text,
        "summary": parsed.get("summary", ""),
        "suggestions": grounded,
        "error": None,
    }


def route_after_generate(state: SuggestionState) -> str:
    if state.get("error") and state.get("retry_count", 0) <= MAX_RETRIES:
        return "retry"
    return "finalize"


async def finalize_node(state: SuggestionState) -> dict:
    suggestions = state.get("suggestions") or []
    summary = state.get("summary") or ""

    # Both generation attempts failed to parse — fall back to catalog entries directly
    # rather than surfacing an error or any non-database text.
    if state.get("error") or not suggestions:
        suggestions = _fallback_from_context(state.get("context", {}))
        summary = summary or "Here are some catalog picks for your trip:"

    await db.log_suggestion(
        {
            "prompt": state["prompt"],
            "userId": state.get("user_id"),
            "tripId": state.get("trip_id"),
            "languageCode": state.get("language_code"),
            "suggestions": suggestions,
            "failedToParse": bool(state.get("error")),
        }
    )

    return {"summary": summary, "suggestions": suggestions}
