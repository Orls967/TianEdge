# TIANEDGE — Semiconductor & Microprocessor Exploration Platform

**Explore the Architecture. Understand the Intelligence.**

TIANEDGE is an interactive web-based, desktop-first engineering learning platform designed to make semiconductor technology and microprocessor architecture visible, inspectable, and intelligible—from outer CPU packaging down to silicon die blocks, digital logic concepts, and deterministic instruction execution.

> **Current Project Stage:** **Phase 0 Complete — Specification & Documentation Baseline**  
> All architectural, 3D modeling, simulation, API, testing, and deployment specifications are authored and cross-audited. Application source implementation begins in Phase 1 per [flow.md](./flow.md).

---

## Core Product Pillars

1. **Explore (Dominant Experience — 3D Chip Anatomy):** Dissect a multi-layered CPU across **6 component groups** (**36 canonical components**) using **6 visualization modes** (`Full Assembly`, `Exploded View`, `Section Cut`, `Component Isolation`, `Internal Architecture`, `Signal Flow`).
2. **Understand (Walkthrough, Insights & Technical Library):** Follow the 6-stage `Instruction Journey`, study 13 computer architecture deep dives (`Engineering Insights`), and browse the citation-backed `Technical Library`.
3. **Experience (One Primary CPU Simulator):** Execute deterministic `TIAN-ISA v1` assembly programs inside a **Rust/WebAssembly** CPU execution engine running locally in a **Web Worker**, synchronized frame-by-frame with 3D active components and signal paths.

---

## Six Application Sections

| # | Section | Route | Primary Purpose | Specification |
|---|---|---|---|---|
| 01 | **Overview** | `/` | Platform hero 3D CPU visualization, architecture overview, and entry points | [PRD.md](./PRD.md), [DESIGN.md](./DESIGN.md) |
| 02 | **Chip Anatomy** | `/anatomy` | Interactive 3D exploration across all 36 components & 6 visualization modes | [CHIP_ANATOMY_SPEC.md](./CHIP_ANATOMY_SPEC.md) |
| 03 | **Instruction Journey** | `/journey` | Guided 6-stage instruction walkthrough (`Fetch` -> `Write Back`) | [INSTRUCTION_JOURNEY_SPEC.md](./INSTRUCTION_JOURNEY_SPEC.md) |
| 04 | **CPU Simulator** | `/simulator` | The single deterministic educational CPU simulator (`TIAN-ISA v1`) | [SIMULATION_SPEC.md](./SIMULATION_SPEC.md) |
| 05 | **Engineering Insights** | `/insights` | 13 computer architecture & semiconductor topics linked to 3D views | [ENGINEERING_CONTENT_SPEC.md](./ENGINEERING_CONTENT_SPEC.md) |
| 06 | **Technical Library** | `/library` | Encyclopedia, glossary, fundamentals, references, diagrams, formulas, paths | [ENGINEERING_CONTENT_SPEC.md](./ENGINEERING_CONTENT_SPEC.md) |

---

## Technology Stack Summary

- **Frontend & 3D Visualization (`TypeScript`):** React, Vite, Three.js / React Three Fiber, Zustand, Web Worker RPC client.
- **CPU Simulation Engine (`Rust` -> `WebAssembly`):** `tianedge-cpu` crate (`TIAN-ISA v1` parser, decoder, 32-bit ALU, registers, Modified Harvard memory) running locally in the browser with **zero backend requirement**.
- **Supporting Content & Analytics Service (`Python`):** Optional FastAPI + Pydantic v2 REST service (`/api/v1/*`) with seamless static JSON fallback when offline or deployed to GitHub Pages.

---

## Documentation Navigation Map

| Document | Purpose |
|---|---|
| [PRD.md](./PRD.md) | Product requirements, experience boundaries, functional/non-functional specs, acceptance criteria |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 7-layer software architecture, state ownership, Worker/WASM & offline fallback protocols |
| [DESIGN.md](./DESIGN.md) | Semiconductor Lab + Technology Museum visual direction, tokens, UI layouts, accessibility |
| [CHIP_ANATOMY_SPEC.md](./CHIP_ANATOMY_SPEC.md) | Complete 6-group / 36-component taxonomy with 15 structured engineering fields each |
| [INSTRUCTION_JOURNEY_SPEC.md](./INSTRUCTION_JOURNEY_SPEC.md) | Stage-by-stage educational walkthrough synchronized with 3D camera & pulses |
| [SIMULATION_SPEC.md](./SIMULATION_SPEC.md) | `TIAN-ISA v1` instruction set, 24-cycle baseline trace, Rust/WASM API, error guards |
| [DATA_MODEL.md](./DATA_MODEL.md) | Canonical TypeScript, Rust `serde`, JSON, and API transport schemas |
| [API_CONTRACT.md](./API_CONTRACT.md) | FastAPI `/api/v1/*` endpoint specifications, validation, and offline degradation matrix |
| [ASSET_GUIDELINES.md](./ASSET_GUIDELINES.md) | GLB/glTF & procedural 3D strategy, mesh naming (`tianedge__<id>__*`), PBR & draw-call budgets |
| [ENGINEERING_CONTENT_SPEC.md](./ENGINEERING_CONTENT_SPEC.md) | All 13 `Engineering Insights` deep dives + 7 `Technical Library` modules & formulas |
| [ANIMATION_SPEC.md](./ANIMATION_SPEC.md) | Category A (Idle) and Category B (Guided state-driven) animations + reduced motion |
| [TEST_PLAN.md](./TEST_PLAN.md) | Verification suites (`cargo test`, `pytest`, `Vitest`, `Playwright` + `axe-core`) |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Static GitHub Pages + WASM bundle and containerized FastAPI deployment guidelines |
| [flow.md](./flow.md) | 10-phase implementation roadmap with dependencies and completion gates |
| [constraints.md](./constraints.md) | Non-negotiable architectural invariants (`C-01`–`C-15`) and engineering decisions (`ED-01`–`ED-05`) |
| [DOCUMENTATION_AUDIT.md](./DOCUMENTATION_AUDIT.md) | Cross-document consistency audit report and resolved findings |
| [DOCUMENTATION_PROGRESS.md](./DOCUMENTATION_PROGRESS.md) | Phase 0 tracking log, technical baseline, and milestone commit/push ledger |
