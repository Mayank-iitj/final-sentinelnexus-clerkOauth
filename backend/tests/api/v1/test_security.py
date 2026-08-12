import json
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.v1.api import api_router
from app.api.v1.deps import get_current_active_user
from app.models.user import User


app = FastAPI()
app.include_router(api_router)


def override_get_current_active_user():
    return User(id="test_user_id", email="admin@example.com")


app.dependency_overrides[get_current_active_user] = override_get_current_active_user


@pytest.fixture
def client():
    return TestClient(app)


def test_security_telemetry_no_redis(client):
    """When Redis is unavailable the endpoint returns 200 with zeroed/empty
    data (graceful degradation) rather than a hard 503."""
    app.state.redis = None
    response = client.get("/api/v1/security/telemetry")
    assert response.status_code == 200
    data = response.json()
    assert data["total_blocks_24h"] == 0
    assert data["active_banned_ips"] == 0
    assert data["top_attack_vector"] == "None"
    assert data["threat_distribution"] == []
    assert data["recent_events"] == []
    assert data["banned_ips_list"] == []
    assert data["redis_available"] is False


def test_security_telemetry_with_redis(client):
    """When Redis is available the endpoint returns live telemetry data.

    NOTE: The real Redis client is initialised with decode_responses=True so
    smembers() returns str values, not bytes.  The mock mirrors that.
    """
    mock_redis = AsyncMock()

    import time
    now = time.time()
    mock_event = {
        "event": "block",
        "primary_kind": "sqli",
        "decision": "block",
        "timestamp": now,
    }

    # lrange returns raw JSON strings (decode_responses=True on real Redis)
    mock_redis.lrange = AsyncMock(return_value=[json.dumps(mock_event)])
    # smembers returns str, not bytes (decode_responses=True)
    mock_redis.smembers = AsyncMock(return_value={"1.2.3.4"})

    app.state.redis = mock_redis

    response = client.get("/api/v1/security/telemetry")

    assert response.status_code == 200
    data = response.json()
    assert data["total_blocks_24h"] == 1
    assert data["active_banned_ips"] == 1
    assert data["top_attack_vector"] == "sqli"
    assert len(data["threat_distribution"]) == 1
    assert data["threat_distribution"][0]["vector"] == "sqli"
    assert data["threat_distribution"][0]["count"] == 1
    assert data["banned_ips_list"] == [{"ip": "1.2.3.4"}]
    assert len(data["recent_events"]) == 1
    assert data["redis_available"] is True
