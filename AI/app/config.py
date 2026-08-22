from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Base


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    port: int = 8034
    cors_origins: str = "http://localhost:8000"

    mongo_uri: str
    mongo_db_name: str = "globetrotter"

    sarvam_api_key: str
    sarvam_base_url: str = "https://api.sarvam.ai"

    groq_api_key: str
    groq_base_url: str = "https://api.groq.com/openai/v1"
    groq_chat_model: str = "openai/gpt-oss-20b"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
