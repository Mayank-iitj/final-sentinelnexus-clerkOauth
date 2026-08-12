from __future__ import annotations

import json
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, Request
from redis.asyncio import Redis

from app.api.v1.deps import get_current_active_user

router = APIRouter(prefix="/security", tags=["security-telemetry"])


def get_redis(request: Request) -> Redis | None:
    return getattr(request.app.state, "redis", None)


@router.get("/telemetry")
async def security_telemetry(
    request: Request,
    redis: Redis | None = Depends(get_redis),
    user=Depends(get_current_active_user),
) -> Dict[str, Any]:
    """
    Returns security telemetry data from the Phase 1 Security Middleware.
    This includes recent blocks/warnings, top attack vectors, and currently banned IPs.
    When Redis is unavailable, returns an empty-but-valid response so the UI degrades
    gracefully instead of showing an error.
    """
    if not redis:
        return {
            "total_blocks_24h": 0,
            "active_banned_ips": 0,
            "top_attack_vector": "None",
            "threat_distribution": [],
            "recent_events": [],
            "banned_ips_list": [],
            "redis_available": False,
        }

    # Fetch recent security events
    raw_events = await redis.lrange("sec:events", 0, 999)

    events: List[Dict[str, Any]] = []
    vector_counts: Dict[str, int] = {}
    total_blocks_24h = 0
    import time
    now = time.time()

    for raw in raw_events:
        try:
            event = json.loads(raw)
            events.append(event)

            # Count vectors (only primary for simplicity)
            kind = event.get("primary_kind", "unknown")
            if kind != "none":
                vector_counts[kind] = vector_counts.get(kind, 0) + 1

            # Count blocks in last 24h
            event_time = event.get("timestamp", 0)
            if event.get("decision") == "block" and (now - event_time) <= 86400:
                total_blocks_24h += 1

        except (json.JSONDecodeError, TypeError):
            continue

    # Fetch active banned IPs
    # Note: Redis is initialised with decode_responses=True so smembers returns str, not bytes.
    banned_ips_raw = await redis.smembers("sec:banned")
    banned_ips = [{"ip": ip} for ip in banned_ips_raw]

    # Prepare Top Attack Vectors sorted by count
    sorted_vectors = sorted(
        [{"vector": k, "count": v} for k, v in vector_counts.items()],
        key=lambda x: x["count"],
        reverse=True
    )

    return {
        "total_blocks_24h": total_blocks_24h,
        "active_banned_ips": len(banned_ips),
        "top_attack_vector": sorted_vectors[0]["vector"] if sorted_vectors else "None",
        "threat_distribution": sorted_vectors,
        "recent_events": events[:100],  # Return latest 100 for the activity feed
        "banned_ips_list": banned_ips,
        "redis_available": True,
    }
