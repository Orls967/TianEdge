"""FastAPI application entrypoint for TIANEDGE educational backend."""

from __future__ import annotations

import os
from collections import deque
from pathlib import Path

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from tianedge_api.repository import ContentRepository
from tianedge_api.schemas import (
    AnalyticsEventAck,
    AnalyticsEventRequest,
    HealthResponse,
    LibrarySearchResponse,
)


def _error_response(status_code: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"error": {"code": code, "message": message, "details": None}},
    )


def create_app(data_dir: Path | None = None) -> FastAPI:
    """Create and configure the TIANEDGE FastAPI application."""
    app = FastAPI(
        title="TIANEDGE Educational Content API",
        version="1.0.0",
        description="Optional educational metadata, library search, and zero-PII telemetry API.",
    )

    repo = ContentRepository(data_dir=data_dir)
    analytics_ring: deque[dict[str, str]] = deque(maxlen=1000)

    raw_origins = os.getenv(
        "ALLOWED_ORIGINS",
        "https://orls967.github.io,http://localhost:5173,http://127.0.0.1:5173",
    )
    allowed_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type"],
    )

    @app.get("/api/v1/health", response_model=HealthResponse)
    def health() -> HealthResponse:
        counts = repo.dataset_counts()
        status = "ok" if counts.components >= 36 and counts.insights >= 13 else "degraded"
        return HealthResponse(
            status=status,
            service="tianedge-api",
            version="1.0.0",
            datasetCounts=counts,
        )

    @app.get("/api/v1/components")
    def list_components(
        group: str | None = None,
        mode: str | None = None,
        q: str | None = None,
    ) -> dict[str, object]:
        items = repo.list_components(group=group, mode=mode, q=q)
        return {"total": len(items), "components": items}

    @app.get("/api/v1/components/{component_id}")
    def get_component(component_id: str):
        comp = repo.get_component(component_id)
        if comp is None:
            return _error_response(
                404,
                "COMPONENT_NOT_FOUND",
                f"Component '{component_id}' was not found in TIANEDGE metadata.",
            )
        return comp

    @app.get("/api/v1/insights")
    def list_insights() -> dict[str, object]:
        return {"total": len(repo.insights), "insights": repo.insights}

    @app.get("/api/v1/insights/{topic_id}")
    def get_insight(topic_id: str):
        topic = repo.get_insight(topic_id)
        if topic is None:
            return _error_response(
                404,
                "INSIGHT_NOT_FOUND",
                f"Engineering Insight '{topic_id}' was not found.",
            )
        return topic

    @app.get("/api/v1/library/search", response_model=LibrarySearchResponse)
    def search_library(
        q: str = Query(..., min_length=1, max_length=120),
        category: str = Query(
            "all",
            pattern="^(all|components|insights|glossary|formulas|fundamentals)$",
        ),
        limit: int = Query(20, ge=1, le=50),
    ) -> LibrarySearchResponse:
        results = repo.search_library(query=q, category=category, limit=limit)
        return LibrarySearchResponse(query=q, total=len(results), results=results)

    @app.get("/api/v1/library/glossary")
    def list_glossary(category: str | None = None) -> dict[str, object]:
        items = (
            [g for g in repo.glossary if g.get("category") == category]
            if category
            else repo.glossary
        )
        return {"total": len(items), "terms": items}

    @app.get("/api/v1/library/fundamentals")
    def list_fundamentals() -> dict[str, object]:
        return {"total": len(repo.fundamentals), "fundamentals": repo.fundamentals}

    @app.get("/api/v1/library/references")
    def list_references() -> dict[str, object]:
        return {"total": len(repo.references), "references": repo.references}

    @app.get("/api/v1/library/diagrams")
    def list_diagrams() -> dict[str, object]:
        return {"total": len(repo.diagrams), "diagrams": repo.diagrams}

    @app.get("/api/v1/library/formulas")
    def list_formulas() -> dict[str, object]:
        return {"total": len(repo.formulas), "formulas": repo.formulas}

    @app.get("/api/v1/library/learning-paths")
    def list_learning_paths() -> dict[str, object]:
        return {"total": len(repo.learning_paths), "learningPaths": repo.learning_paths}

    @app.get("/api/v1/library/citations")
    def list_citations() -> dict[str, object]:
        return {"total": len(repo.citations), "citations": repo.citations}

    @app.post("/api/v1/analytics/events", status_code=202, response_model=AnalyticsEventAck)
    def post_analytics_event(payload: AnalyticsEventRequest) -> AnalyticsEventAck:
        analytics_ring.append(payload.model_dump())
        return AnalyticsEventAck(
            accepted=True,
            eventType=payload.eventType,
            recordedEventsTotal=len(analytics_ring),
        )

    return app


app = create_app()
