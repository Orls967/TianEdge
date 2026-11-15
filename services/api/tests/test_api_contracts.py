"""API contract tests for TIANEDGE FastAPI backend (TC-INT-02)."""

from fastapi.testclient import TestClient
from tianedge_api.main import app


client = TestClient(app)


def test_health_reports_canonical_dataset_counts() -> None:
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["datasetCounts"] == {
        "components": 36,
        "insights": 13,
        "glossaryTerms": 48,
        "fundamentals": 5,
        "references": 3,
        "diagrams": 6,
        "formulas": 6,
        "learningPaths": 4,
    }


def test_components_filtering_and_lookup() -> None:
    resp = client.get("/api/v1/components", params={"group": "processing-core"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 6
    assert any(c["id"] == "core-alu" for c in data["components"])

    detail = client.get("/api/v1/components/core-alu")
    assert detail.status_code == 200
    assert detail.json()["id"] == "core-alu"

    missing = client.get("/api/v1/components/does-not-exist")
    assert missing.status_code == 404
    assert missing.json()["error"]["code"] == "COMPONENT_NOT_FOUND"


def test_insights_and_library_endpoints() -> None:
    insights = client.get("/api/v1/insights")
    assert insights.status_code == 200
    assert insights.json()["total"] == 13

    search = client.get("/api/v1/library/search", params={"q": "ALU", "limit": 10})
    assert search.status_code == 200
    assert search.json()["total"] >= 1
    assert any(item["kind"] == "component" for item in search.json()["results"])

    for route in [
        "/api/v1/library/glossary",
        "/api/v1/library/fundamentals",
        "/api/v1/library/references",
        "/api/v1/library/diagrams",
        "/api/v1/library/formulas",
        "/api/v1/library/learning-paths",
        "/api/v1/library/citations",
    ]:
        res = client.get(route)
        assert res.status_code == 200


def test_zero_pii_analytics_event_validation() -> None:
    ok_resp = client.post(
        "/api/v1/analytics/events",
        json={
            "eventType": "component_selected",
            "section": "anatomy",
            "targetId": "core-alu",
            "sessionId": "anon-test-session",
            "timestampUtc": "2026-11-16T02:20:00Z",
        },
    )
    assert ok_resp.status_code == 202
    assert ok_resp.json()["accepted"] is True

    # Reject unknown / PII fields (extra="forbid")
    pii_resp = client.post(
        "/api/v1/analytics/events",
        json={
            "eventType": "component_selected",
            "section": "anatomy",
            "targetId": "core-alu",
            "sessionId": "anon-test-session",
            "timestampUtc": "2026-11-16T02:20:00Z",
            "email": "user@example.com",
        },
    )
    assert pii_resp.status_code == 422
