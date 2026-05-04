from __future__ import annotations

import secrets
from dataclasses import dataclass
from datetime import timedelta

from redis.asyncio import Redis


@dataclass(frozen=True)
class RefreshTokenRecord:
    jti: str


def new_jti() -> str:
    return secrets.token_urlsafe(24)


class RefreshTokenStore:
    """
    Redis-backed refresh-token allowlist for revocation & rotation.

    Keys:
      refresh:{user_id}:{jti} -> "1" with expiry
    """

    def __init__(self, redis: Redis):
        self._redis = redis

    async def allow(self, *, user_id: str, jti: str, ttl: timedelta) -> None:
        key = f"refresh:{user_id}:{jti}"
        await self._redis.set(key, "1", ex=int(ttl.total_seconds()))

    async def is_allowed(self, *, user_id: str, jti: str) -> bool:
        key = f"refresh:{user_id}:{jti}"
        return (await self._redis.get(key)) is not None

    async def revoke(self, *, user_id: str, jti: str) -> None:
        key = f"refresh:{user_id}:{jti}"
        await self._redis.delete(key)

