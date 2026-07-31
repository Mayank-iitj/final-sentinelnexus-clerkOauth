"""
Redis-Backed IP Rate Limiter & Auto-Ban
========================================
Tracks attack attempts per IP using Redis sliding windows.
When an IP exceeds the threshold, it is added to a ban set with a TTL.
All subsequent requests from banned IPs are blocked at the outermost
middleware layer (Layer 0) before any body parsing.

Key schema:
  sec:attacks:{ip}         → INCR counter with TTL window
  sec:banned               → Redis SET of banned IP strings

Config (environment variables):
  SECURITY_AUTO_BAN_THRESHOLD=3    (attacks before ban)
  SECURITY_BAN_WINDOW_SECONDS=3600 (sliding window for attack counting)
  SECURITY_BAN_TTL_SECONDS=3600    (how long a ban lasts)
"""
from __future__ import annotations

import os
from typing import Optional


def _env_int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, ""))
    except (ValueError, TypeError):
        return default


BAN_THRESHOLD: int = _env_int("SECURITY_AUTO_BAN_THRESHOLD", 3)
BAN_WINDOW: int = _env_int("SECURITY_BAN_WINDOW_SECONDS", 3600)
BAN_TTL: int = _env_int("SECURITY_BAN_TTL_SECONDS", 3600)

_KEY_PREFIX = "sec:attacks:"
_BAN_SET = "sec:banned"


def _get_ip(scope: dict) -> str:
    """Extract real client IP from ASGI scope (handles X-Forwarded-For)."""
    headers = dict(scope.get("headers", []))
    # Render (and most reverse proxies) set X-Forwarded-For
    xff = headers.get(b"x-forwarded-for", b"").decode("utf-8", errors="replace")
    if xff:
        return xff.split(",")[0].strip()
    # Fall back to direct connection
    client = scope.get("client")
    if client:
        return client[0]
    return "unknown"


async def is_banned(redis, ip: str) -> bool:
    """Return True if the IP is in the ban set."""
    if redis is None:
        return False
    try:
        return bool(await redis.sismember(_BAN_SET, ip))
    except Exception:
        return False  # fail-open on Redis error


async def record_attack(redis, ip: str) -> int:
    """
    Increment the attack counter for this IP.
    If it reaches BAN_THRESHOLD, add to ban set.
    Returns the new attack count.
    """
    if redis is None:
        return 0
    try:
        key = f"{_KEY_PREFIX}{ip}"
        count = await redis.incr(key)
        if count == 1:
            # Set expiry on first increment
            await redis.expire(key, BAN_WINDOW)
        if count >= BAN_THRESHOLD:
            await redis.sadd(_BAN_SET, ip)
            await redis.expire(_BAN_SET, BAN_TTL)
        return int(count)
    except Exception:
        return 0  # fail-open


async def unban_ip(redis, ip: str) -> bool:
    """Remove an IP from the ban set (admin use)."""
    if redis is None:
        return False
    try:
        removed = await redis.srem(_BAN_SET, ip)
        await redis.delete(f"{_KEY_PREFIX}{ip}")
        return bool(removed)
    except Exception:
        return False


async def get_attack_count(redis, ip: str) -> int:
    """Return the current attack count for an IP (for diagnostics)."""
    if redis is None:
        return 0
    try:
        val = await redis.get(f"{_KEY_PREFIX}{ip}")
        return int(val) if val else 0
    except Exception:
        return 0
