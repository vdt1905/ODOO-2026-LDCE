from motor.motor_asyncio import AsyncIOMotorClient

from app.config import settings

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.mongo_uri)
    return _client


def get_db():
    return get_client()[settings.mongo_db_name]


async def search_cities(keywords: list[str], limit: int = 5) -> list[dict]:
    """Read-only lookup against the backend's `cities` collection for grounding."""
    db = get_db()
    query = {"$text": {"$search": " ".join(keywords)}} if keywords else {}
    cursor = db.cities.find(query).sort("popularity", -1).limit(limit)
    cities = await cursor.to_list(length=limit)
    if not cities and keywords:
        # Text index found nothing (e.g. no match) — fall back to top popular cities.
        cursor = db.cities.find({}).sort("popularity", -1).limit(limit)
        cities = await cursor.to_list(length=limit)
    return cities


async def search_activities(city_ids: list, keywords: list[str], limit: int = 8) -> list[dict]:
    """Read-only lookup against the backend's `activities` collection for grounding."""
    db = get_db()
    query: dict = {}
    if city_ids:
        query["city"] = {"$in": city_ids}
    if keywords:
        query["$text"] = {"$search": " ".join(keywords)}
    cursor = db.activities.find(query).sort("rating", -1).limit(limit)
    activities = await cursor.to_list(length=limit)
    if not activities and city_ids:
        cursor = db.activities.find({"city": {"$in": city_ids}}).sort("rating", -1).limit(limit)
        activities = await cursor.to_list(length=limit)
    return activities


async def get_trip_context(trip_id: str) -> dict | None:
    """Best-effort read of a trip + its stops, for personalizing suggestions. Returns
    None silently on any lookup failure — grounding is optional, not required."""
    from bson import ObjectId
    from bson.errors import InvalidId

    db = get_db()
    try:
        trip = await db.trips.find_one({"_id": ObjectId(trip_id)})
    except InvalidId:
        return None
    if not trip:
        return None

    stops_cursor = db.stops.find({"trip": trip["_id"]}).sort("order", 1)
    stops = await stops_cursor.to_list(length=50)
    city_ids = [stop["city"] for stop in stops]
    cities_cursor = db.cities.find({"_id": {"$in": city_ids}})
    cities_by_id = {c["_id"]: c async for c in cities_cursor}

    return {
        "name": trip.get("name"),
        "budgetLimit": trip.get("budgetLimit"),
        "currency": trip.get("currency", "USD"),
        "visitedCities": [
            cities_by_id[cid]["name"] for cid in city_ids if cid in cities_by_id
        ],
    }


async def log_suggestion(document: dict) -> None:
    """Fire-and-forget analytics log in a collection owned by this service —
    additive only, never read or written by the Node backend."""
    db = get_db()
    await db.ai_suggestion_logs.insert_one(document)
