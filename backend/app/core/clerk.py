from __future__ import annotations

import json
import urllib.request
from typing import Any, Dict

from jose import jwt, JWTError
from loguru import logger

from app.core.config import get_settings

settings = get_settings()

_jwks_cache: Dict[str, Any] | None = None
_jwks_cache_timestamp: float = 0


def get_jwks(force_refresh: bool = False) -> Dict[str, Any]:
    """Fetch Clerk JWKS with caching and optional force refresh."""
    global _jwks_cache, _jwks_cache_timestamp
    import time
    
    # Use cache if fresh (< 1 hour)
    if _jwks_cache is not None and not force_refresh:
        if (time.time() - _jwks_cache_timestamp) < 3600:
            return _jwks_cache
    
    if not settings.CLERK_JWKS_URL:
        logger.warning("CLERK_JWKS_URL not set - Clerk verification disabled")
        return {"keys": []}

    try:
        with urllib.request.urlopen(settings.CLERK_JWKS_URL, timeout=10) as response:
            _jwks_cache = json.loads(response.read().decode())
            _jwks_cache_timestamp = time.time()
            logger.debug("Successfully fetched Clerk JWKS")
        return _jwks_cache
    except urllib.error.URLError as e:
        logger.error(f"Failed to fetch Clerk JWKS (network error): {e}")
        return {"keys": []}
    except Exception as e:
        logger.error(f"Failed to fetch Clerk JWKS: {e}")
        return {"keys": []}


def verify_clerk_token(token: str) -> Dict[str, Any] | None:
    """
    Verifies a Clerk JWT and returns the payload.
    Returns None if verification fails.
    """
    if not token:
        logger.warning("Empty token provided")
        return None
    
    try:
        jwks = get_jwks()
        if not jwks.get("keys"):
            logger.warning("No JWKS keys available for verification")
            return None
        
        # Decode without verification first to extract header
        unverified_header = jwt.get_unverified_header(token)
        
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            issuer=settings.CLERK_ISSUER if settings.CLERK_ISSUER else None,
            options={"verify_aud": False},
        )
        
        logger.debug(f"Successfully verified Clerk token for user {payload.get('sub')}")
        return payload
    
    except JWTError as e:
        logger.warning(f"Clerk JWT verification failed: {type(e).__name__}: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error during Clerk token verification: {e}")
        return None
