import email_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Disable DNS deliverability checks so validation is fast and works offline/in sandboxes
email_validator.CHECK_DELIVERABILITY = False


class Settings(BaseSettings):
    APP_NAME: str = "AI Interview Agent"
    APP_ENV: str = "development"
    API_V1_PREFIX: str = "/api/v1"
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000

    FRONTEND_ORIGIN: str | list[str] = "http://localhost:5173"

    # Database
    DATABASE_URL: str = "sqlite:///./interview_agent.db"

    # Google Gemini GenAI
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"

    # Security / Auth
    JWT_SECRET_KEY: str = "dev_insecure_jwt_secret_key_needs_replacement_in_prod_123"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120

    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"), env_file_encoding="utf-8", extra="ignore"
    )

    @property
    def cors_origins(self) -> list[str]:
        if isinstance(self.FRONTEND_ORIGIN, list):
            return self.FRONTEND_ORIGIN
        return [origin.strip() for origin in self.FRONTEND_ORIGIN.split(",") if origin.strip()]


settings = Settings()
