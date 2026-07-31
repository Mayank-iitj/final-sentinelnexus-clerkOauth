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
    """
    if not redis:
        raise HTTPException(status_code=503, detail="Redis is not available")

    # Fetch recent security events
    raw_events = await redis.lrange("sec:events", 0, 999)
    
    events = []
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
    banned_ips_bytes = await redis.smembers("sec:banned")
    banned_ips = []
    for ip_b in banned_ips_bytes:
        ip = ip_b.decode("utf-8")
        # Fetch TTL
        ttl = await redis.ttl(f"sec:banned") # note: we don't track TTL per IP in the set, just the set TTL, but wait: 
        # Actually in rate_limiter.py we set expiry on the set itself.
        banned_ips.append({"ip": ip})

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
        "banned_ips_list": banned_ips
    }
