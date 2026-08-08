from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import Field, field_validator
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

    # CORS / hosts (Stored as string to prevent pydantic_settings JSONDecodeError)
    ALLOWED_ORIGINS: str = Field(default="http://localhost:3000")
    ALLOWED_HOSTS: str = Field(default="*")

    @property
    def parsed_allowed_origins(self) -> List[str]:
        return self._parse_list_var(self.ALLOWED_ORIGINS)

    @property
    def parsed_allowed_hosts(self) -> List[str]:
        return self._parse_list_var(self.ALLOWED_HOSTS)

    def _parse_list_var(self, v: str) -> List[str]:
        import json
        v = v.strip()
        v = v.replace("'", '"')
        if v.startswith("[") and v.endswith("]"):
            try:
                return json.loads(v)
            except Exception:
                pass
        return [i.strip() for i in v.split(",") if i.strip()]

    # Clerk Auth
    CLERK_SECRET_KEY: str = ""
    CLERK_JWKS_URL: str = ""
    CLERK_ISSUER: str = ""
    CLERK_WEBHOOK_SECRET: str = ""

    # PayU Configuration
    PAYU_MERCHANT_KEY: str = ""
    PAYU_MERCHANT_SALT: str = ""
    PAYU_BASE_URL: str = "https://test.payu.in/_payment"

    # Rate limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW_SECONDS: int = 60

    # ── Security Middleware (Production Engine) ─────────────────────────────────
    # Shadow mode default=True here (fail-safe for new deployments).
    # render.yaml sets False for production (per explicit user instruction).
    SECURITY_SHADOW_MODE: bool = True
    # Fail-open: pass through on middleware internal error
    SECURITY_FAIL_OPEN: bool = True
    # Max body bytes inspected (remainder forwarded uninspected, never dropped)
    SECURITY_MAX_BODY_BYTES: int = 65_536
    # Comma-separated paths that bypass middleware entirely
    SECURITY_SKIP_PATHS: str = "/health,/metrics,/"
    # Score threshold to block the request (0–100)
    SECURITY_BLOCK_SCORE_THRESHOLD: float = 80.0
    # Score threshold to emit a warning log without blocking
    SECURITY_WARN_SCORE_THRESHOLD: float = 50.0
    # Number of detected attacks before IP is auto-banned
    SECURITY_AUTO_BAN_THRESHOLD: int = 3
    # Sliding window for attack counting (seconds)
    SECURITY_BAN_WINDOW_SECONDS: int = 3600
    # How long a ban lasts (seconds)
    SECURITY_BAN_TTL_SECONDS: int = 3600

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
