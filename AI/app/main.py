from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes.suggestions import router as suggestions_router

app = FastAPI(
    title="Triplie — TRIPORA's travel assistant",
    description=(
        "Standalone LangGraph service behind the Ask Triplie widget. Routes each message "
        "to a conversational branch or a catalog-grounded suggestion branch."
    ),
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(suggestions_router)


@app.get("/")
async def root() -> dict:
    return {"service": "triplie", "agent": "Triplie", "status": "ok"}
