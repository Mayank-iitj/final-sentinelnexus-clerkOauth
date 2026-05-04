"""
Resilient Rate Limiter
========================
Provides a rate-limiter dependency that degrades gracefully when Redis
is unavailable.  When Redis is connected, delegates to fastapi-limiter.
When Redis is down, the dependency is a no-op so routes still work.
"""
from __future__ import annotations

from typing import Any, Callable

from fastapi import Request


# Sentinel set at startup — True when FastAPILimiter.init() succeeded.
_limiter_ready: bool = False


def mark_limiter_ready() -> None:
    global _limiter_ready
    _limiter_ready = True


def is_limiter_ready() -> bool:
    return _limiter_ready


def safe_rate_limiter(*, times: int = 10, seconds: int = 60) -> Callable:
    """
    Returns a FastAPI-compatible dependency callable.

    Usage in routes:
        _rl = Depends(safe_rate_limiter(times=20, seconds=60))

    - If Redis / FastAPILimiter initialised successfully → real rate limiter.
    - Otherwise → no-op dependency (allows the request through).
    """

    async def _dependency(request: Request) -> None:
        if not _limiter_ready:
            return None
        # Lazy import so the module loads even when redis is absent
        from fastapi_limiter.depends import RateLimiter

        limiter = RateLimiter(times=times, seconds=seconds)
        return await limiter(request)

    return _dependency
