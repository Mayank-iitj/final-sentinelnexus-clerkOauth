def test_health_endpoint(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] in ("healthy", "degraded")
    assert data["db"] in ("ok", "error")
    assert data["redis"] in ("ok", "error", "unavailable")

