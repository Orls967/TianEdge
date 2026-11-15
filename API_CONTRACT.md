# Backend API Contract — TIANEDGE

**Document ID:** `TIANEDGE-API-001`  
**Service:** Optional Python 3.11+ / FastAPI Content, Search & Analytics Service (`services/api/`)  
**Base Prefix:** `/api/v1`  
**Core Rule (`C-04`):** The Python backend serves educational metadata, unified search, and optional anonymous analytics. It **must never** execute CPU simulation instructions (owned exclusively by Rust/WASM). Frontend features remain 100% functional via bundled static JSON if this API is unreachable.  

---

## 1. General Conventions & Cross-Origin Rules

- **Content-Type:** `application/json; charset=utf-8`
- **Field Naming:** `camelCase` JSON payloads (generated via Pydantic v2 `alias_generator=to_camel`, `populate_by_name=True`) matching [DATA_MODEL.md](./DATA_MODEL.md).
- **CORS:** Explicit allowlist configured via `ALLOWED_ORIGINS` (e.g., `https://<user>.github.io`, `http://localhost:5173`), never wildcard `*` with credentials.
- **Timeouts on Client:** Frontend API calls enforce a strict `1,500 ms` timeout on initial health probes and `2,500 ms` on content fetches before cleanly switching to static bundled JSON fallback.

### Standard Error Response Schema (`ApiErrorResponse`)

All `4xx` / `5xx` errors return a uniform envelope:

```json
{
  "error": {
    "code": "COMPONENT_NOT_FOUND",
    "message": "No ChipComponent found with id 'core-unknown'.",
    "details": null
  }
}
```

---

## 2. Endpoint Specifications

### 2.1 Health Check

- **Method & Path:** `GET /api/v1/health`
- **Purpose:** Verify API availability, loaded educational dataset version, and schema validation integrity.
- **Request:** None.
- **Status Codes:** `200 OK`, `503 Service Unavailable` (if startup dataset validation failed).
- **Response Schema (`200 OK`):**

```json
{
  "status": "ok",
  "service": "tianedge-api",
  "version": "1.0.0",
  "datasetCounts": {
    "components": 36,
    "insights": 13,
    "glossaryTerms": 48,
    "fundamentals": 5,
    "references": 3,
    "diagrams": 6,
    "formulas": 6,
    "learningPaths": 4
  }
}
```

---

### 2.2 List CPU Components

- **Method & Path:** `GET /api/v1/components`
- **Purpose:** Retrieve all 36 canonical `ChipComponent` definitions with optional filtering by architectural group or representation scale.
- **Query Parameters:**
  - `groupId` (optional `ComponentGroupId`: `cpu-package | silicon-die | processing-core | memory-hierarchy | digital-logic | communication-control`)
  - `representationType` (optional `RepresentationType`)
- **Validation:** Invalid `groupId` or `representationType` returns `422 Unprocessable Entity`.
- **Response (`200 OK`):**

```json
{
  "total": 5,
  "items": [
    {
      "id": "pkg-ihs",
      "name": "Integrated Heat Spreader (IHS)",
      "groupId": "cpu-package",
      "representationType": "physical_package",
      "definition": "A thermally conductive metallic lid mounted atop the silicon die...",
      "primaryFunction": "Conduct heat away from fragile silicon die hotspots...",
      "modelReference": {
        "meshPrefix": "tianedge__pkg-ihs",
        "assetFile": "cpu_package_v1.glb",
        "defaultVisibleModes": ["full_assembly", "exploded_view", "section_cut", "component_isolation"],
        "explodedOffset": [0, 1.4, 0],
        "cameraPreset": { "position": [3.2, 2.4, 3.2], "target": [0, 0.4, 0] },
        "highlightColorHex": "#00E5FF"
      },
      "relatedInsightIds": ["thermal-management", "power-consumption"],
      "citationIds": ["hennessy_patterson_6e", "jedec_thermal"]
    }
  ]
}
```

---

### 2.3 Get Single CPU Component

- **Method & Path:** `GET /api/v1/components/{component_id}`
- **Purpose:** Fetch complete 15-field specification for one `component_id`.
- **Path Validation:** `component_id` matching `^[a-z0-9-]+$`.
- **Status Codes:** `200 OK`, `404 Not Found` (`COMPONENT_NOT_FOUND`), `422 Unprocessable Entity`.

---

### 2.4 List & Get Engineering Insights

- **Method & Path:** `GET /api/v1/insights`
- **Purpose:** Return all 13 `EngineeringInsightTopic` items sorted by `order` (`1..13`).
- **Response (`200 OK`):** `{ "total": 13, "items": [ EngineeringInsightTopic, ... ] }`

- **Method & Path:** `GET /api/v1/insights/{topic_id}`
- **Purpose:** Fetch complete deep-dive topic content, linked 3D `relatedComponentIds`, `formulaIds`, and citations.
- **Status Codes:** `200 OK`, `404 Not Found` (`INSIGHT_NOT_FOUND`).

---

### 2.5 Technical Library Search

- **Method & Path:** `GET /api/v1/library/search`
- **Purpose:** Perform weighted case-insensitive search across Components, Engineering Insights, Glossary Terms, Formulas, and Semiconductor Fundamentals.
- **Query Parameters:**
  - `q` (required `string`, `minLength=1`, `maxLength=100`)
  - `category` (optional: `all | component | insight | glossary | formula | fundamental | reference | diagram`)
  - `limit` (optional `integer`, default `20`, range `1..50`)
- **Validation:** Empty or whitespace-only `q` returns `400 Bad Request` (`INVALID_SEARCH_QUERY`).
- **Response (`200 OK`):**

```json
{
  "query": "cache",
  "total": 6,
  "results": [
    {
      "kind": "insight",
      "id": "cache-hierarchy",
      "title": "Cache Hierarchy & Locality",
      "snippet": "A multi-level memory pyramid trading capacity for ultra-low access latency...",
      "route": "/insights/cache-hierarchy",
      "relatedComponentIds": ["mem-l1-icache", "mem-l1-dcache", "mem-l2-cache", "mem-l3-cache"],
      "score": 0.98
    }
  ]
}
```

---

### 2.6 Technical Library Sub-Resources

| Method & Path | Purpose | Query Params | Success Response |
|---|---|---|---|
| `GET /api/v1/library/glossary` | Retrieve glossary terms | `category` (opt), `letter` (opt) | `200 OK`: `{ total, items: GlossaryTerm[] }` |
| `GET /api/v1/library/fundamentals` | Retrieve semiconductor fundamentals primers | None | `200 OK`: `{ total, items: SemiconductorPrimer[] }` |
| `GET /api/v1/library/references` | Retrieve CPU architecture reference matrices | None | `200 OK`: `{ total, items: ArchitectureReference[] }` |
| `GET /api/v1/library/diagrams` | Retrieve vector diagram metadata & component callouts | None | `200 OK`: `{ total, items: TechnicalDiagramEntry[] }` |
| `GET /api/v1/library/formulas` | Retrieve canonical equations with variables, units, assumptions | `insightId` (opt) | `200 OK`: `{ total, items: FormulaEntry[] }` |
| `GET /api/v1/library/learning-paths` | Retrieve guided curricula paths | `difficulty` (opt) | `200 OK`: `{ total, items: LearningPath[] }` |
| `GET /api/v1/library/citations` | Retrieve verified source attribution bibliography | None | `200 OK`: `{ total, items: CitationEntry[] }` |

---

### 2.7 Anonymous Educational Telemetry (Supporting Analytics)

- **Method & Path:** `POST /api/v1/analytics/events`
- **Purpose:** Record non-PII aggregate educational usage metrics (e.g., which CPU component or insight topic learners inspect most frequently). Completely optional and fire-and-forget from the frontend.
- **Request Schema:**

```json
{
  "eventType": "component_selected",
  "section": "anatomy",
  "targetId": "core-alu",
  "sessionId": "anon-uuid-v4",
  "timestampUtc": "2026-11-16T00:50:00Z"
}
```

- **Allowed `eventType` values:** `"section_viewed" | "component_selected" | "mode_changed" | "journey_completed" | "simulator_preset_run" | "insight_opened"`
- **Privacy Guard:** Rejects any extra/unexpected fields (`extra="forbid"` in Pydantic) and never logs IP addresses, assembly source code entered by users, or user identities.
- **Status Codes:** `202 Accepted` (`{ "accepted": true }`), `422 Unprocessable Entity` (validation failure).

---

## 3. Backend-Unavailable Graceful Degradation Matrix

| Frontend Operation | Backend Online (`200 OK`) | Backend Offline / Timeout / Disabled |
|---|---|---|
| `CPU Simulator` (`TIAN-ISA v1`) | Runs 100% locally in Rust/WASM Web Worker | Identical — 100% functional locally |
| `Chip Anatomy` (36 components) | Fetches/caches from `/api/v1/components` | Uses bundled `public/data/components.json` |
| `Instruction Journey` | Uses shared stage spec + optional telemetry | Identical — 100% functional locally |
| `Engineering Insights` (13 topics) | Fetches from `/api/v1/insights` | Uses bundled `public/data/insights.json` |
| `Technical Library` Search | Queries `/api/v1/library/search` | Uses local deterministic TypeScript search over static JSON bundle |
| Telemetry Events | Posts fire-and-forget `POST /api/v1/analytics/events` | Silently dropped (`noop`), zero UI errors or console uncaught exceptions |

---

## 4. Cross-Document References

- Canonical Data Schemas: [DATA_MODEL.md](./DATA_MODEL.md)
- Hybrid Fallback Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)
- API Contract Verification Tests: [TEST_PLAN.md](./TEST_PLAN.md)
- Container & CORS Deployment: [DEPLOYMENT.md](./DEPLOYMENT.md)
