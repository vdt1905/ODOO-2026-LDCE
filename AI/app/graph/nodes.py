import json
import re

from langchain_core.messages import HumanMessage, SystemMessage

from app import db
from app.graph.state import SuggestionState
from app.groq_client import get_chat_model
from app.sarvam_client import identify_language, language_name

MAX_RETRIES = 1

AGENT_NAME = "Triplie"

# The one description of who the agent is. Both branches of the graph open with
# it so the voice does not change depending on which path a message took.
PERSONA = f"""You are {AGENT_NAME}, the travel assistant built into TRIPORA — a multi-city \
itinerary planner. People use TRIPORA to plan a trip across several cities, give each city a \
date range and a budget, hang activities off each day, watch the cost add up per day, per city \
and per category, and publish the finished trip to a link anyone can open and copy.

You are warm, brief and concrete. You never pad an answer, never open with "Certainly!" or \
"Great question", and never pretend to have done something you cannot do."""


# --------------------------------------------------------------------------
# Routing
# --------------------------------------------------------------------------

ROUTER_PROMPT = f"""{PERSONA}

Your only job right now is to classify the traveller's latest message. Answer with ONLY a \
JSON object (no markdown fences, no commentary):
{{{{"intent": "chat" | "plan"}}}}

Use "plan" when the message asks for destinations, things to do, an itinerary, costs, or \
advice about a specific place or trip — anything you would answer by pointing at real cities \
or activities.
  examples: "3 days in Kyoto under 40k", "what else should I add?", "somewhere warm in \
December", "cheaper alternatives to Paris", "what can I do in Bali"

Use "chat" for everything else: greetings, small talk, thanks, goodbyes, questions about you \
or about how TRIPORA works, requests to explain something you just said, and anything \
unrelated to choosing a destination.
  examples: "who are you", "hi", "what can you do", "how do I share a trip", "are you \
ChatGPT", "thanks!", "what is the capital of France"

When genuinely torn, choose "chat" — answering a question with an unwanted list of cities is \
worse than answering it in a sentence."""


async def classify_intent_node(state: SuggestionState) -> dict:
    """Decides whether this turn is conversation or a planning request.

    Failure here is not fatal: an unparseable or unexpected answer settles on
    "chat", which is the branch that can respond sensibly to anything. The old
    graph had no router at all and sent every message down the catalog branch,
    which is why "who are you?" came back as Paris, Bali and a museum.
    """
    model = get_chat_model(temperature=0)

    try:
        response = await model.ainvoke(
            [
                SystemMessage(content=ROUTER_PROMPT),
                HumanMessage(content=f"Traveller's message: {state['prompt']}"),
            ]
        )
        raw = response.content if isinstance(response.content, str) else str(response.content)
        intent = str(_extract_json(raw).get("intent", "")).strip().lower()
    except (json.JSONDecodeError, AttributeError, KeyError, TypeError):
        intent = ""

    return {"intent": intent if intent in {"chat", "plan"} else "chat"}


def route_on_intent(state: SuggestionState) -> str:
    return "plan" if state.get("intent") == "plan" else "chat"


# --------------------------------------------------------------------------
# Conversation branch
# --------------------------------------------------------------------------

CHAT_PROMPT = f"""{PERSONA}

Reply to the traveller in plain prose — two or three sentences, four at the very most. No \
markdown, no bullet lists, no headings, no JSON.

What you can actually do, if they ask:
  · suggest cities and activities from TRIPORA's own catalog, with real costs attached
  · read the trip they currently have open and answer against its cities and budget
  · talk through pacing, timing, and where a budget is going

What you must not do:
  · invent a city, an activity, a price or an opening time — if you do not know, say so
  · claim to have edited, booked, saved or changed anything; you only advise, the traveller \
edits the trip themselves in the builder
  · pretend to be a general-purpose assistant. If the message is nothing to do with travel, \
say plainly that travel planning is what you are for, and offer to help with the trip.

If you are asked who or what you are: you are {AGENT_NAME}, TRIPORA's travel assistant. Do not \
name the company that trained the underlying model, and do not claim to be a human.

Reply in {{language}}, using {{language}} script, regardless of the language this instruction \
is written in."""


async def converse_node(state: SuggestionState) -> dict:
    """Answers a conversational turn as prose, with no catalog lookup.

    The trip the user has open is passed in when there is one, so "what's left
    on my budget?" is answerable without going down the suggestion branch. It is
    the only database read on this path, and a failure to load it is silent —
    the reply is still worth sending without it.
    """
    trip_context = None
    trip_id = state.get("trip_id")
    if trip_id:
        try:
            trip_context = await db.get_trip_context(trip_id)
        except Exception:  # noqa: BLE001 - context is a nicety, never a requirement
            trip_context = None

    system = CHAT_PROMPT.format(language=language_name(state.get("language_code")))
    user_content = state["prompt"]
    if trip_context:
        user_content = (
            f"{user_content}\n\n"
            f"(The trip they have open, for context — do not list it back unless asked: "
            f"{json.dumps(trip_context, default=str)})"
        )

    model = get_chat_model(temperature=0.5)

    try:
        response = await model.ainvoke(
            [SystemMessage(content=system), HumanMessage(content=user_content)]
        )
        raw = response.content if isinstance(response.content, str) else str(response.content)
        reply = _strip_markdown(raw)
    except Exception:  # noqa: BLE001 - the widget gets a usable sentence either way
        reply = ""

    if not reply:
        reply = (
            f"I'm {AGENT_NAME}, the travel assistant built into TRIPORA. Tell me where you're "
            f"headed — or what you'd like to change about the trip you have open — and I'll "
            f"suggest cities and activities with real costs attached."
        )

    return {"reply": reply, "summary": reply, "suggestions": [], "error": None}


# --------------------------------------------------------------------------
# Suggestion branch
# --------------------------------------------------------------------------

SYSTEM_PROMPT = f"""{PERSONA}

Right now you are answering a planning request. You are given the traveller's request and a \
catalog context pulled from TRIPORA's own MongoDB (a list of "cities" and a list of \
"activities"). Suggest concrete next steps for their trip.

STRICT RULE: you may suggest ONLY entries that literally appear in the context's "cities" or \
"activities" arrays below. Copy each suggestion's "title" character-for-character from a \
context entry's "name" field. Never invent, generalize, or suggest a city/activity that is \
not in the context, even if the context looks sparse or unrelated to the request — in that \
case, pick the closest entries that ARE present instead of making something up.

Respond in {{language}}, using {{language}} script, regardless of what language this \
instruction is written in.

Respond with ONLY a JSON object (no markdown fences, no commentary) matching this shape:
{{{{
  "summary": "one short sentence introducing the suggestions, in your own voice",
  "suggestions": [
    {{{{"title": "<exact name from context>", "description": "...", "type": "city|activity"}}}}
  ]
}}}}
Return 3 to 6 suggestions, type "city" for entries from the cities array and "activity" for \
entries from the activities array."""


async def identify_language_node(state: SuggestionState) -> dict:
    result = await identify_language(state["prompt"])
    return {"language_code": result["language_code"], "script_code": result["script_code"]}


async def fetch_context_node(state: SuggestionState) -> dict:
    context: dict = {}

    trip_id = state.get("trip_id")
    if trip_id:
        trip_context = await db.get_trip_context(trip_id)
        if trip_context:
            context["trip"] = trip_context

    cities = await db.search_cities([state["prompt"]], limit=5)
    context["cities"] = [
        {"name": c["name"], "country": c["country"], "costIndex": c.get("costIndex")}
        for c in cities
    ]

    city_ids = [c["_id"] for c in cities]
    activities = await db.search_activities(city_ids, [state["prompt"]], limit=8)
    context["activities"] = [
        {"name": a["name"], "type": a.get("type"), "cost": a.get("cost")} for a in activities
    ]

    return {"context": context}


def _extract_json(raw_text: str) -> dict:
    cleaned = re.sub(r"^```(?:json)?|```$", "", raw_text.strip(), flags=re.MULTILINE).strip()
    return json.loads(cleaned)


def _strip_markdown(raw_text: str) -> str:
    """The chat branch asks for plain prose; some models still reach for a fence
    or a bullet. Flatten it rather than shipping stray syntax into a chat
    bubble that renders as literal text."""
    text = re.sub(r"```[a-z]*\n?|```", "", raw_text or "").strip()
    text = re.sub(r"^\s*[-*•]\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"^#{1,6}\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    return re.sub(r"\n{3,}", "\n\n", text).strip()


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
    intent = state.get("intent", "plan")
    suggestions = state.get("suggestions") or []
    summary = state.get("summary") or ""

    # A conversation has nothing to fall back to and nothing to ground — the
    # reply IS the answer. Running the catalog fallback here is what would put
    # four cities under "who are you?" all over again.
    if intent != "chat":
        # Both generation attempts failed to parse — fall back to catalog entries
        # directly rather than surfacing an error or any non-database text.
        if state.get("error") or not suggestions:
            suggestions = _fallback_from_context(state.get("context", {}))
            summary = summary or "Here are some catalog picks for your trip:"

    await db.log_suggestion(
        {
            "prompt": state["prompt"],
            "userId": state.get("user_id"),
            "tripId": state.get("trip_id"),
            "languageCode": state.get("language_code"),
            "intent": intent,
            "suggestions": suggestions,
            "failedToParse": bool(state.get("error")),
        }
    )

    return {"summary": summary, "suggestions": suggestions, "intent": intent}
