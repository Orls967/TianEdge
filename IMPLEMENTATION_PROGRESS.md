# TIANEDGE Implementation Progress Tracker

**Project:** TIANEDGE — Semiconductor & Microprocessor Exploration Platform  
**Repository:** `https://github.com/Orls967/TianEdge.git` (Branch: `main`)  
**Baseline Phase 0 Commit:** `3be0b51b150c6beceda03749c9991e9bd214f996`  
**Live Site:** https://orls967.github.io/TianEdge/  
**Last Updated:** 2026-11-16

---

## 1. Current Status Overview

- **Current Phase:** v1 complete — Phases 0–10 plus post-release milestones L10 (UI polish, README) and L11 (3D model upgrade)
- **Deployment Status:** Live on GitHub Pages; `ci.yml` and `deploy.yml` green on every push to `main`
- **Phase 0 records:** moved to [`docs/history/`](./docs/history/) (historical, no longer updated)

---

## 2. Phase Completion Matrix

| Phase | Title | Status | Notes |
|---|---|---|---|
| Phase 0 | Documentation & Specs | Completed | `3be0b51` |
| Phase 1 | Repository & Application Foundation | Completed | `apps/web`, `crates/tianedge-cpu`, `services/api`, `.github/workflows/ci.yml` |
| Phase 2 | Design System & App Shell | Completed | Canonical TS models (`DATA_MODEL.md`), dark graphite/cyan/gold design tokens, accessible `AppShell`, UI primitives |
| Phase 3 | Interactive 3D Chip Anatomy & Metadata | Completed | 36 components, `.glb` assets + procedural fallbacks, 6 visualization modes (assets upgraded in L11: 24,027 tris) |
| Phase 4 | Idle & Guided Animation System | Completed | Category A (`Idle`) & Category B (`Guided`) animation controllers, `cubicOut` 650ms camera rig, clipping planes |
| Phase 5 | CPU Execution Engine (`TIAN-ISA v1` Rust) | Completed | `isa.rs`, `parser.rs`, `alu.rs`, `cpu.rs`, `snapshot.rs`, `lib.rs` (9/9 Rust tests, `TC-CPU-01..08` verified) |
| Phase 6 | WASM & Web Worker Integration | Completed | `wasm-pack` target built, `cpu-worker.ts`, `CpuWorkerClient.ts`, `presets.ts`, `useSimulatorStore.ts` |
| Phase 7 | Overview, Anatomy, Journey & Simulator | Completed | `/`, `/anatomy` (36-component tree + 15-field dossier), `/journey` (WASM-backed + simulator handoff), `/simulator` (live worker + editor) |
| Phase 8 | Engineering Insights (13 Topics) | Completed | All 13 topics, KaTeX equations, SVG diagrams, general-vs-vendor boundary callouts, 3D & preset cross-links |
| Phase 9 | Technical Library & FastAPI Backend | Completed | All 7 modules + citations (`searchLibraryHybrid`), Pydantic v2 FastAPI `/api/v1/*` service (`extra="forbid"` zero-PII), `Dockerfile` |
| Phase 10 | QA, Performance Optimization & Release | Completed | Playwright E2E (4/4), `axe-core` WCAG scan (0 violations), live WebGL telemetry (`0` fallbacks; L11 figures: `23` drawCalls, `20,383` tris), GH Pages `deploy.yml` |

---

## 3. Build & Test Verification Ledger

- `cargo test --manifest-path crates/tianedge-cpu/Cargo.toml`: **PASS** (9/9 unit tests covering `TC-CPU-01..08` + WASM JSON roundtrip)
- `cargo check --manifest-path crates/tianedge-cpu/Cargo.toml --target wasm32-unknown-unknown`: **PASS**
- `npm --prefix apps/web run build:wasm`: **PASS** (`75.26 kB` compiled `.wasm`)
- `services/api/.venv/bin/pytest services/api -v`: **PASS** (5/5 API contract + zero-PII tests)
- `npm --prefix apps/web run typecheck`: **PASS** (`tsc -b --pretty false`)
- `npm --prefix apps/web run lint`: **PASS** (0 errors, 0 warnings)
- `npm --prefix apps/web run test`: **PASS** (4 files, 18/18 tests, incl. simulator preset → insight cross-link check)
- `npm --prefix apps/web run build`: **PASS** (`dist/404.html` generated)
- `VITE_BASE_PATH="/TianEdge/" npm --prefix apps/web run build`: **PASS** (`dist/404.html` with `keepSegments=1`, assets under `/TianEdge/assets/`)
- `npm --prefix apps/web run test:e2e`: **PASS** (4/4 Playwright specs: WebGL `.glb` telemetry `drawCalls=23`, `triangles=20383`, `fallbackAssets=0`; WASM canonical parity + `/journey` -> `/simulator` handoff; `1024x768` & `390x844` zero horizontal overflow; `axe-core` 0 critical/serious WCAG violations across all 6 routes)

---

## 4. Post-Release Polish (Milestone L10)

- **GitHub Pages enabled** (source: GitHub Actions); live at https://orls967.github.io/TianEdge/. The first deploy had failed only because Pages was not enabled for the repository.
- **UI fixes:** defined the missing `--space-5` token (page padding/gap had collapsed to 0 on Overview, Insights and Library); added a hamburger drawer below 1100 px; readable Journey stage tabs; `WASM Standby` status before the engine is requested; Simulator "Study" links show topic titles; keyboard-shortcut reference now matches the implemented keys.
- **Bug fix:** simulator preset `relatedInsightIds` pointed to non-existent topic ids; remapped and covered by a regression test.
- **3D fixes:** materials are recreated when transparency toggles (ghosted IHS now renders see-through); softer highlight on large package surfaces; camera dolly-out for whole-package framings on narrow viewports; on stacked layouts the 3D stage is shown before the component tree.
- **README rewritten** with a live-site screenshot gallery (27 images in `docs/screenshots/`) captured by `npm run screenshots` (`apps/web/screenshots/capture.spec.ts`).

## 5. 3D Model Upgrade (Milestone L11)

- `generate_models.py` v2: new `add_cylinder` / `add_frame` / `add_grid` primitives, uint16 index guard, 3 extra PBR materials (MLCC ceramic, laser mark, amber logic).
- Package: IHS flange/top land/marking/pin-1, seal ring, underfill fillet, 44 MLCCs + fiducials, 16x16 C4 bumps, 26x26 LGA lands with land-side capacitor cavity. The old `HardwareInstancedArrays` (which did not follow exploded offsets) was removed; bumps and pads now live in the GLB and move with their component.
- Die and core 0 sub-blocks detailed (bit-sliced ALU + flags, microcode ROM, R0-R7, PLA decoder, SRAM macros, L3 slices, ring stops, channel PHYs, SerDes lanes); cores 1-3 replicated.
- Digital-logic pods given recognisable silhouettes; each logic component's camera preset now targets its own pod.
- Scene: procedural Lightformer environment for metal reflections, floating selection label, translucent (not wireframe) isolation ghosts, isolation close-up for small blocks.
- Assets: 24,027 GLB triangles (was 1,692). `/anatomy` WebGL probe: 23 draw calls, 20,383 triangles (budget 120 / 150,000).

## 6. Repository Housekeeping (Milestone L12)

- Phase 0 records (`DOCUMENTATION_PROGRESS.md`, `DOCUMENTATION_AUDIT.md`) moved to `docs/history/` with a historical-record banner; `DEPLOYMENT.md` and `flow.md` updated to the live, all-phases-complete state.
- Specs that still described `InstancedMesh` bumps/pads (`ASSET_GUIDELINES.md`, `ARCHITECTURE.md`, `CHIP_ANATOMY_SPEC.md`) now describe the merged GLB meshes; broken `scene/overlays/` path fixed; all relative Markdown links verified.
- `ASSET_MANIFEST.json` v2 carries per-asset provenance (author, source, CAD-accuracy claim, triangle count); GLB fallback meshes are now named `__fallback` (intentionally procedural components keep `__procedural`).
- Rust: `rustfmt` applied, clippy `map_entry` fixed; Python: `ruff` added (config in `pyproject.toml`), imports organised. CI now enforces `cargo fmt --check`, `cargo clippy -D warnings`, `ruff check` and `ruff format --check`.
