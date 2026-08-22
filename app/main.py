from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes.suggestions import router as suggestions_router

app = FastAPI(
    title="GlobeTrotter AI Suggestions Service",
    description="Standalone LangGraph + Sarvam-powered service for prompt-based trip suggestions.",
    version="0.1.0",
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
    return {"service": "globetrotter-ai", "status": "ok"}
