# TIANEDGE Documentation Progress Tracker

**Project:** TIANEDGE — Semiconductor & Microprocessor Exploration Platform  
**Repository:** `https://github.com/Orls967/TianEdge.git` (Branch: `main`)  
**Phase:** Phase 0 — Complete Documentation Engineering & Specification Authoring  
**Status:** In Progress (`L2` Complete → Moving to `L3`)  
**Last Updated:** 2026-11-16

---

## 1. Documentation Completion Matrix

| # | Document | Milestone | Status | Notes |
|---|---|---|---|---|
| 0 | `.gitignore` | L1 | Completed | Adapted for macOS, TypeScript/Vite, Rust/WASM, Python/FastAPI |
| 1 | `DOCUMENTATION_PROGRESS.md` | L1 | Active | Maintained across every milestone |
| 2 | `PRD.md` | L2 | Completed | Product requirements, 6 sections, scope, acceptance criteria |
| 3 | `ARCHITECTURE.md` | L2 | Completed | TS/Rust-WASM/Python architecture, workers, fallback strategy |
| 4 | `constraints.md` | L2 | Completed | 15 core engineering constraints + 5 derived engineering decisions |
| 5 | `flow.md` | L2 | Completed | 10-phase implementation roadmap & dependency graph |
| 6 | `CHIP_ANATOMY_SPEC.md` | L3 | Pending | 6 groups, 36 components, 15-field schema each |
| 7 | `DESIGN.md` | L3 | Pending | Visual direction, tokens, UI layout, accessibility |
| 8 | `ASSET_GUIDELINES.md` | L3 | Pending | GLB/glTF, PBR materials, conceptual vs physical geometry |
| 9 | `ANIMATION_SPEC.md` | L3 | Pending | Idle & guided animations, reduced-motion, state coupling |
| 10 | `SIMULATION_SPEC.md` | L4 | Pending | TIAN-ISA v1, 6-stage deterministic CPU engine, WASM interface |
| 11 | `INSTRUCTION_JOURNEY_SPEC.md` | L4 | Pending | Guided 6-stage walkthrough aligned with CPU simulator |
| 12 | `ENGINEERING_CONTENT_SPEC.md` | L4 | Pending | 13 Engineering Insights topics + Technical Library specs |
| 13 | `DATA_MODEL.md` | L5 | Pending | Canonical TypeScript, Rust, and Pydantic/JSON schemas |
| 14 | `API_CONTRACT.md` | L5 | Pending | FastAPI endpoints, payloads, errors, offline fallback |
| 15 | `TEST_PLAN.md` | L5 | Pending | 3D, Rust CPU engine, animation, integration, UX/a11y tests |
| 16 | `DEPLOYMENT.md` | L5 | Pending | GitHub Pages + WASM bundle + FastAPI container deployment |
| 17 | `DOCUMENTATION_AUDIT.md` | L6 | Pending | Cross-document audit report & readiness verification |
| 18 | `README.md` | L6 | Pending | Project overview & complete documentation navigation |

---

## 2. Canonical Architectural Decisions (Locked Before Authoring)

1. **Official Name:** `TIANEDGE — Semiconductor & Microprocessor Exploration Platform` (Tagline: *Explore the Architecture. Understand the Intelligence.*).
2. **Six Canonical Pages:** `Overview`, `Chip Anatomy`, `Instruction Journey`, `CPU Simulator`, `Engineering Insights`, `Technical Library`.
3. **One Primary Simulator:** Only the educational CPU Instruction Execution Simulator (`TIAN-ISA v1`), running locally via Rust/WASM inside a Web Worker without requiring the Python backend.
4. **Canonical 6-Stage Execution Model:** `FETCH` → `DECODE` → `REGISTER_READ` → `EXECUTE` → `MEMORY_ACCESS` → `WRITE_BACK`, shared consistently between `Instruction Journey` and `CPU Simulator` (with explicit contrast against hardware pipelining).
5. **Modified Harvard Educational Memory Model:** Separate Instruction Memory (`PC` indexed `0..255`) and Data Memory (`256` 32-bit signed word cells `0..255`), preventing self-modifying instruction hazards while supporting `LOAD R1, 10` (immediate), `LOAD Rd, [addr]` / `LOADM` (memory read), `ADD R3, R1, R2`, and `STORE R3, 100`.
6. **Canonical 36-Component Taxonomy:** Stable kebab-case IDs across 6 groups (`cpu-package`, `silicon-die`, `processing-core`, `memory-hierarchy`, `digital-logic`, `communication-control`).
7. **RepresentationHonesty:** Physical package parts, architectural floorplan blocks, logical subsystems, and enlarged conceptual models (`logic-transistors`, `logic-gates`, etc.) are explicitly distinguished; no fabricated CAD accuracy or commercial ISA claims.
8. **Offline-First Core Experience:** Static JSON educational bundles ship with the frontend so Chip Anatomy, Instruction Journey, and CPU Simulator remain 100% functional even if the Python FastAPI backend is offline.

---

## 3. Research & Technical Reference Baseline

Authoritative textbooks and official technical references used throughout specifications (only verified, real technical references):
- Hennessy, J. L., & Patterson, D. A. *Computer Architecture: A Quantitative Approach* (6th ed., Morgan Kaufmann).
- Patterson, D. A., & Hennessy, J. L. *Computer Organization and Design* (RISC-V / MIPS editions, Morgan Kaufmann).
- Harris, D. M., & Harris, S. L. *Digital Design and Computer Architecture* (Morgan Kaufmann).
- Bryant, R. E., & O'Hallaron, D. R. *Computer Systems: A Programmer's Perspective* (CS:APP, 3rd ed., Pearson).
- Weste, N. H. E., & Harris, D. M. *CMOS VLSI Design: A Circuits and Systems Perspective* (4th ed., Addison-Wesley).
- Khronos Group *glTF 2.0 Specification* & Three.js / React Three Fiber documentation.
- WebAssembly Core Specification (W3C) & `wasm-bindgen` / Rust `wasm32-unknown-unknown` documentation.
- FastAPI & Pydantic v2 official documentation.

---

## 4. Commit & Push Log

| Milestone | Commit Hash | Message | Push Status |
|---|---|---|---|
| L1 | `5e1a2b7` | `chore: initialize TIANEDGE gitignore and progress tracker` | Pushed to `origin/main` |
| L2 | Pending | `docs: define product requirements, architecture, constraints, and roadmap` | Pending |

---

## 5. Next Actions

1. Author L3 documents: `CHIP_ANATOMY_SPEC.md`, `DESIGN.md`, `ASSET_GUIDELINES.md`, and `ANIMATION_SPEC.md`.
2. Update `DOCUMENTATION_PROGRESS.md`, commit, and push L3 milestone.
