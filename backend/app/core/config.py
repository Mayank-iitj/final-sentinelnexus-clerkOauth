from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Core
    APP_NAME: str = "SentinelNexus Guard"
    APP_VERSION: str = "1.0.0"
    ENV: str = "development"  # development|staging|production
    DEBUG: bool = True

    # Database / Redis
    DATABASE_URL: str
    REDIS_URL: str

    # Security / JWT
    SECRET_KEY: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS / hosts
    ALLOWED_ORIGINS: List[str] = Field(default_factory=lambda: ["http://localhost:3000"])
    ALLOWED_HOSTS: List[str] = Field(default_factory=lambda: ["localhost", "127.0.0.1"])

    # Clerk Auth
    CLERK_SECRET_KEY: str = ""
    CLERK_JWKS_URL: str = ""
    CLERK_ISSUER: str = ""

    # Rate limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW_SECONDS: int = 60

    # Frontend redirect targets (used by OAuth callbacks)
    FRONTEND_BASE_URL: str = "http://localhost:3000"
    BACKEND_BASE_URL: str = "http://localhost:8000"

    @property
    def is_production(self) -> bool:
        return self.ENV.lower() == "production"

    def validate_settings(self) -> None:
        """Perform environment validation for production deployments.

        This method raises RuntimeError if required sensitive settings are
        missing when running in production. In development these checks are
        relaxed.
        """
        if not self.is_production:
            return
        missing = []
        for name in ("DATABASE_URL", "SECRET_KEY", "JWT_SECRET_KEY", "FRONTEND_BASE_URL", "BACKEND_BASE_URL"):
            if not getattr(self, name, None):
                missing.append(name)
        if missing:
            raise RuntimeError(f"Missing required production settings: {', '.join(missing)}")


@lru_cache
def get_settings() -> Settings:
    s = Settings()
    # Validate when loaded so the application fails fast on misconfiguration
    try:
        s.validate_settings()
    except Exception:
        # Re-raise for the caller to handle; fail-fast behavior is desired
        raise
    return s
