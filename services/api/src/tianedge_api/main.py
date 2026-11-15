"""FastAPI application entrypoint for TIANEDGE educational backend."""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def create_app() -> FastAPI:
    """Create and configure the TIANEDGE FastAPI application."""
    app = FastAPI(
        title="TIANEDGE Educational Content API",
        version="1.0.0",
        description="Optional educational metadata, library search, and zero-PII telemetry API.",
    )

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

    @app.get("/api/v1/health")
    def health() -> dict[str, object]:
        return {
            "status": "ok",
            "service": "tianedge-api",
            "version": "1.0.0",
            "datasetCounts": {
                "components": 0,
                "insights": 0,
                "glossaryTerms": 0,
                "fundamentals": 0,
                "references": 0,
                "diagrams": 0,
                "formulas": 0,
                "learningPaths": 0,
            },
        }

    return app


app = create_app()
