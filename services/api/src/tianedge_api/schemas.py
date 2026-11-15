"""Pydantic v2 canonical API schemas matching API_CONTRACT.md & DATA_MODEL.md."""

from __future__ import annotations

from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class DatasetCounts(BaseModel):
    components: int
    insights: int
    glossaryTerms: int
    fundamentals: int
    references: int
    diagrams: int
    formulas: int
    learningPaths: int


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    service: Literal["tianedge-api"]
    version: str
    datasetCounts: DatasetCounts


class LibrarySearchItem(BaseModel):
    kind: Literal[
        "component",
        "insight",
        "glossary",
        "formula",
        "fundamental",
        "reference",
        "diagram",
    ]
    id: str
    title: str
    snippet: str
    route: str
    relatedComponentIds: list[str]
    score: int


class LibrarySearchResponse(BaseModel):
    query: str
    total: int
    results: list[LibrarySearchItem]


class AnalyticsEventRequest(BaseModel):
    """Strictly validates non-PII analytics telemetry and rejects extra fields."""

    model_config = ConfigDict(extra="forbid")

    eventType: Literal[
        "section_viewed",
        "component_selected",
        "mode_changed",
        "journey_completed",
        "simulator_preset_run",
        "insight_opened",
    ]
    section: Literal["overview", "anatomy", "journey", "simulator", "insights", "library"]
    targetId: str = Field(min_length=1, max_length=120)
    sessionId: str = Field(min_length=1, max_length=120)
    timestampUtc: str = Field(min_length=10, max_length=64)


class AnalyticsEventAck(BaseModel):
    accepted: bool
    eventType: str
    recordedEventsTotal: int


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: dict[str, object] | None = None


class ApiErrorResponse(BaseModel):
    error: ErrorDetail
