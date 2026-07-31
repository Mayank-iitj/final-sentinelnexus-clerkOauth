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
    # redis is None in app.state
    app.state.redis = None
    response = client.get("/api/v1/security/telemetry")
    assert response.status_code == 503
    assert "Redis is not available" in response.text


@pytest.mark.asyncio
async def test_security_telemetry_with_redis():
    # Because we're using TestClient (synchronous) to test an async endpoint
    # that uses an async mock, we need to mock the endpoint's internals or use AsyncClient.
    # Alternatively, just inject a mocked redis into app.state and use TestClient.
    mock_redis = AsyncMock()
    
    import time
    now = time.time()
    mock_event = {
        "event": "block",
        "primary_kind": "sqli",
        "decision": "block",
        "timestamp": now,
    }
    
    mock_redis.lrange = AsyncMock(return_value=[json.dumps(mock_event).encode("utf-8")])
    mock_redis.smembers = AsyncMock(return_value=[b"1.2.3.4"])
    
    app.state.redis = mock_redis
    
    with TestClient(app) as c:
        response = c.get("/api/v1/security/telemetry")
        
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
