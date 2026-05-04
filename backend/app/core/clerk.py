from __future__ import annotations

import json
import urllib.request
from typing import Any, Dict

from jose import jwt
from loguru import logger

from app.core.config import get_settings

settings = get_settings()

_jwks_cache: Dict[str, Any] | None = None


def get_jwks() -> Dict[str, Any]:
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache

    if not settings.CLERK_JWKS_URL:
        logger.warning("CLERK_JWKS_URL not set")
        return {"keys": []}

    try:
        with urllib.request.urlopen(settings.CLERK_JWKS_URL) as response:
            _jwks_cache = json.loads(response.read().decode())
        return _jwks_cache
    except Exception as e:
        logger.error(f"Failed to fetch Clerk JWKS: {e}")
        return {"keys": []}


def verify_clerk_token(token: str) -> Dict[str, Any] | None:
    """Verifies a Clerk JWT and returns the payload."""
    try:
        jwks = get_jwks()
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            issuer=settings.CLERK_ISSUER if settings.CLERK_ISSUER else None,
            options={"verify_aud": False},
        )
        return payload
    except Exception as e:
        logger.warning(f"Clerk token verification failed: {e}")
        return None
