"""Static canonical JSON educational content loader and search index."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from tianedge_api.schemas import DatasetCounts, LibrarySearchItem


def resolve_data_dir() -> Path:
    env_dir = os.getenv("TIANEDGE_DATA_DIR", "").strip()
    if env_dir:
        return Path(env_dir)
    # Auto-discover workspace apps/web/public/data relative to services/api/src/tianedge_api/
    repo_root = Path(__file__).resolve().parents[4]
    candidate = repo_root / "apps" / "web" / "public" / "data"
    if candidate.exists():
        return candidate
    local_data = Path(__file__).resolve().parents[2] / "data"
    return local_data


class ContentRepository:
    def __init__(self, data_dir: Path | None = None) -> None:
        self.data_dir = data_dir or resolve_data_dir()
        self.components: list[dict[str, Any]] = self._load_json("components.json")
        self.insights: list[dict[str, Any]] = sorted(
            self._load_json("insights.json"),
            key=lambda x: x.get("order", 0),
        )
        self.glossary: list[dict[str, Any]] = self._load_json("glossary.json")
        self.fundamentals: list[dict[str, Any]] = self._load_json("fundamentals.json")
        self.references: list[dict[str, Any]] = self._load_json("references.json")
        self.diagrams: list[dict[str, Any]] = self._load_json("diagrams.json")
        self.formulas: list[dict[str, Any]] = self._load_json("formulas.json")
        self.learning_paths: list[dict[str, Any]] = self._load_json("learning_paths.json")
        self.citations: list[dict[str, Any]] = self._load_json("citations.json")

        self._components_by_id = {c["id"]: c for c in self.components}
        self._insights_by_id = {t["id"]: t for t in self.insights}

    def _load_json(self, filename: str) -> list[dict[str, Any]]:
        path = self.data_dir / filename
        if not path.exists():
            return []
        return json.loads(path.read_text(encoding="utf-8"))

    def dataset_counts(self) -> DatasetCounts:
        return DatasetCounts(
            components=len(self.components),
            insights=len(self.insights),
            glossaryTerms=len(self.glossary),
            fundamentals=len(self.fundamentals),
            references=len(self.references),
            diagrams=len(self.diagrams),
            formulas=len(self.formulas),
            learningPaths=len(self.learning_paths),
        )

    def list_components(
        self,
        group: str | None = None,
        mode: str | None = None,
        q: str | None = None,
    ) -> list[dict[str, Any]]:
        items = self.components
        if group:
            items = [c for c in items if c.get("groupId") == group]
        if mode:
            items = [
                c
                for c in items
                if mode in (c.get("modelReference", {}).get("defaultVisibleModes") or [])
            ]
        if q:
            needle = q.strip().lower()
            items = [
                c
                for c in items
                if needle in c.get("name", "").lower()
                or needle in c.get("definition", "").lower()
                or needle in c.get("id", "").lower()
            ]
        return items

    def get_component(self, component_id: str) -> dict[str, Any] | None:
        return self._components_by_id.get(component_id)

    def get_insight(self, topic_id: str) -> dict[str, Any] | None:
        return self._insights_by_id.get(topic_id)

    def search_library(
        self,
        query: str,
        category: str = "all",
        limit: int = 20,
    ) -> list[LibrarySearchItem]:
        needle = query.strip().lower()
        if not needle:
            return []

        results: list[LibrarySearchItem] = []

        def score_fields(*fields: str) -> int:
            score = 0
            for idx, field in enumerate(fields):
                low = field.lower()
                if needle in low:
                    score += 10 if idx == 0 else 4
                if low.startswith(needle):
                    score += 6
            return score

        if category in ("all", "components"):
            for comp in self.components:
                s = score_fields(comp["name"], comp["definition"], comp["primaryFunction"])
                if s > 0:
                    results.append(
                        LibrarySearchItem(
                            kind="component",
                            id=comp["id"],
                            title=comp["name"],
                            snippet=comp["definition"],
                            route=f"/anatomy?component={comp['id']}",
                            relatedComponentIds=[comp["id"]],
                            score=s,
                        )
                    )

        if category in ("all", "insights"):
            for topic in self.insights:
                s = score_fields(
                    topic["title"],
                    topic["technicalDefinition"],
                    topic["engineeringExplanation"],
                )
                if s > 0:
                    results.append(
                        LibrarySearchItem(
                            kind="insight",
                            id=topic["id"],
                            title=topic["title"],
                            snippet=topic["technicalDefinition"],
                            route=f"/insights?topic={topic['id']}",
                            relatedComponentIds=topic.get("relatedComponentIds", []),
                            score=s,
                        )
                    )

        if category in ("all", "glossary"):
            for term in self.glossary:
                s = score_fields(
                    term["term"],
                    term.get("acronym", ""),
                    term["conciseDefinition"],
                )
                if s > 0:
                    results.append(
                        LibrarySearchItem(
                            kind="glossary",
                            id=term["id"],
                            title=term["term"],
                            snippet=term["conciseDefinition"],
                            route="/library?tab=glossary",
                            relatedComponentIds=term.get("relatedComponentIds", []),
                            score=s,
                        )
                    )

        if category in ("all", "formulas"):
            for f in self.formulas:
                s = score_fields(f["name"], f["applicability"], f["workedExample"])
                if s > 0:
                    results.append(
                        LibrarySearchItem(
                            kind="formula",
                            id=f["id"],
                            title=f["name"],
                            snippet=f["applicability"],
                            route="/library?tab=formulas",
                            relatedComponentIds=[],
                            score=s,
                        )
                    )

        if category in ("all", "fundamentals"):
            for p in self.fundamentals:
                s = score_fields(p["title"], p["summary"])
                if s > 0:
                    results.append(
                        LibrarySearchItem(
                            kind="fundamental",
                            id=p["id"],
                            title=p["title"],
                            snippet=p["summary"],
                            route="/library?tab=fundamentals",
                            relatedComponentIds=p.get("relatedComponentIds", []),
                            score=s,
                        )
                    )

        results.sort(key=lambda item: item.score, reverse=True)
        return results[:limit]
