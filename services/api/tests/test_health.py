"""Skeleton health tests for TIANEDGE FastAPI service."""

from fastapi.testclient import TestClient

from tianedge_api.main import app


def test_health_endpoint_returns_ok() -> None:
    client = TestClient(app)
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
    payload = resp.json()
    assert payload["status"] == "ok"
    assert payload["service"] == "tianedge-api"
    assert "datasetCounts" in payload
