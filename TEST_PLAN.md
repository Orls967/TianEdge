# Testing & Quality Assurance Plan — TIANEDGE

**Document ID:** `TIANEDGE-TEST-001`  
**Product Name:** TIANEDGE — Semiconductor & Microprocessor Exploration Platform  
**Test Frameworks:** `cargo test` (Rust), `pytest` (Python FastAPI), `Vitest` + `@testing-library/react` (TypeScript unit/component), `Playwright` (Chromium WebGL/WASM E2E & Accessibility `axe-core`)  

---

## 1. Testing Strategy & Independence Guarantee

In alignment with Constraint `C-15`, every architectural layer must be independently testable:

1. **Rust CPU Core (`cargo test`):** Tests parsing, decoding, ALU arithmetic, flags, memory bounds, and 6-stage deterministic state without needing Node, browser, or WebGL.
2. **Python Backend (`pytest`):** Tests Pydantic content validation, search scoring, CORS policies, and error contracts via FastAPI `TestClient` without browser or WASM.
3. **TypeScript Frontend & 3D Scene (`vitest`):** Tests stores, JSON schema/ID parity, state synchronization, and 3D scene graph registration (`three` headless scene traversal).
4. **End-to-End Integration (`playwright`):** Tests real compiled `.wasm` inside `cpu-worker.ts`, WebGL canvas interaction, offline backend-unavailable fallback, responsive layouts, and WCAG accessibility.

---

## 2. Test Coverage Matrix

### 2.1 Group 1 — 3D Visualization & Chip Anatomy (`TC-3D-*`)

| Test ID | Scope | Test Procedure | Expected Result & Acceptance Criterion |
|---|---|---|---|
| `TC-3D-01` | Model Loading & Fallback | Load `Overview` and `Chip Anatomy` with normal `.glb` assets, then simulate `404` on `.glb` asset fetch. | Primary model mounts cleanly; simulated `.glb` failure triggers procedural fallback meshes matching `tianedge__<componentId>__*` without white/blank screen. |
| `TC-3D-02` | Component ID Registry Integrity | Traverse mounted 3D scene graph and compare extracted `<componentId>` tags against canonical 36-component `components.json`. | 100% of 36 components map cleanly; zero unmapped or typo `componentId` values. |
| `TC-3D-03` | Component Selection & Hover | Hover over `core-alu` and click-select `pkg-ihs`; repeat via keyboard in left component tree. | Hover displays tooltip in `<= 50 ms`; click locks `#00E5FF` highlight and updates right Inspector Drawer with matching component's 15-field data. |
| `TC-3D-04` | Camera Controls | Execute orbit drag, wheel zoom, right-drag pan, Guided Focus click, and `Reset Camera`. | Camera smoothly interpolates to `cameraPreset`; `Reset Camera` restores canonical framing cleanly. |
| `TC-3D-05` | Exploded View | Toggle `exploded_view` mode and measure layer Y-positions. | `pkg-ihs` (`+1.40`), `pkg-silicon-die` (`+0.55`), `pkg-solder-bumps` (`+0.18`), `pkg-substrate` (`0.00`), `pkg-electrical-contacts` (`-0.22`) separate cleanly; returning to `full_assembly` collapses offsets back to `0`. |
| `TC-3D-06` | Section Cut | Activate `section_cut` and adjust Slice Slider across `[-2.0, +2.0]`. | WebGL clipping plane slices IHS/substrate layers exposing internal die without console WebGL errors. |
| `TC-3D-07` | Component Isolation | Isolate `logic-transistors` and `core-alu` via `component_isolation`. | Non-selected components dim/hide; `logic-transistors` displays explicit `"Conceptual Enlarged Model — Not to Scale"` banner. |
| `TC-3D-08` | WebGL Performance Budget | Measure triangle count, draw calls (`renderer.info.render.calls`), and frame times during `Full Assembly` and `Internal Architecture`. | Draw calls `<= 120`; active triangles `<= 150,000`; `>= 55–60 FPS` on standard desktop GPU. |

---

### 2.2 Group 2 — Rust CPU Execution Engine (`TC-CPU-*`)

| Test ID | Scope | Test Procedure | Expected Result & Acceptance Criterion |
|---|---|---|---|
| `TC-CPU-01` | Instruction Parsing | Parse valid `TIAN-ISA v1` programs (case-insensitive, comments, labels, hex `0x64`, negative literals) and invalid programs (bad opcode, `R8`, missing comma, undefined label, >256 lines). | Valid programs yield `LoadProgramResult { ok: true }`; invalid programs emit exact `ParseError` `line`, `column`, and error code without Rust panic. |
| `TC-CPU-02` | Canonical 4-Line Execution | Load `LOAD R1, 10 / LOAD R2, 20 / ADD R3, R1, R2 / STORE R3, 100` and step stage-by-stage (`24` cycles). | Cycle 6: `R1=10`. Cycle 12: `R2=20`. Cycle 18: `R3=30`. Cycle 24: `MEM[100]=30`, `PC=4`. Next tick transitions to `status = "halted"`. |
| `TC-CPU-03` | Stage Sequence & Bypassing | Inspect `CpuSnapshot.stage` and `stageActive` across `ADD`, `LOAD imm`, `LOAD [addr]`, `STORE`, `JMP`, `NOP`. | Stages advance strictly `FETCH -> DECODE -> REGISTER_READ -> EXECUTE -> MEMORY_ACCESS -> WRITE_BACK`; `stageActive=false` on bypassed stages (e.g., `MEMORY_ACCESS` for `ADD`, `WRITE_BACK` for `STORE`). |
| `TC-CPU-04` | ALU Arithmetic, Bitwise & Flags | Execute `SUB` yielding `0` (`Z=1`), negative result (`N=1`), unsigned borrow/carry (`C`), signed `i32::MAX + 1` overflow (`V=1`), `MUL`, `AND`, `OR`, `XOR`, `CMP`. | 32-bit wrapping arithmetic matches specification and sets exact `Z, N, C, V` flags on every case. |
| `TC-CPU-05` | Memory Read & Bounds Fault | Execute `STORE R3, 100` followed by `LOAD R4, [100]` and indirect `LOADM`; then test `STORE R1, 256`. | Valid loads retrieve `30` into `R4`; address `256` halts cleanly with `fault.code = "MEMORY_OUT_OF_BOUNDS"` without mutating memory. |
| `TC-CPU-06` | Branching & Loops | Execute countdown loop (`LOAD R1, 3 / LOOP: SUB R1, R1, R2 / JNZ LOOP / HALT`). | Jumps cleanly to `LOOP` label until `FLAGS.Z == true`, exits loop, and reaches `Halted`. |
| `TC-CPU-07` | Cycle Watchdog Protection | Execute infinite loop (`LOOP: JMP LOOP`) with `step_many(10_000)`. | Stops cleanly at `CYCLE_LIMIT_REACHED` (`status = "paused"`) without hanging process/thread. |
| `TC-CPU-08` | Determinism | Execute identical program twice in native Rust and inside Chromium WASM Worker, comparing serialized snapshots per cycle. | Byte-identical `CpuSnapshot` JSON at every cycle `1..N`. |

---

### 2.3 Group 3 — Idle & Guided Animation System (`TC-ANIM-*`)

| Test ID | Scope | Test Procedure | Expected Result & Acceptance Criterion |
|---|---|---|---|
| `TC-ANIM-01` | Idle Yield & Tab Blur | Let Overview hero rotate idle, drag canvas with mouse, then emit `visibilitychange` hidden event. | Rotation pauses immediately on mouse drag; animation loop suspends cleanly while tab is hidden. |
| `TC-ANIM-02` | Guided Stage Sync | Step through `Instruction Journey` Stages 1–6 and `CPU Simulator` canonical program. | `activeComponentIds` and `activePaths` trigger matching cyan data pulses and gold control highlights; bypassed stage (`MEMORY_ACCESS` on `ADD`) renders bypass visual rather than false memory write pulse. |
| `TC-ANIM-03` | Reduced Motion Support | Enable CSS `prefers-reduced-motion: reduce` and toggle UI `"Pause Motion"` switch. | Idle rotation, airflow ribbons, and oscillating signal packets halt immediately; instant camera transitions + static high-contrast path indicators remain legible. |

---

### 2.4 Group 4 — Cross-Layer Integration & Backend Fallback (`TC-INT-*`)

| Test ID | Scope | Test Procedure | Expected Result & Acceptance Criterion |
|---|---|---|---|
| `TC-INT-01` | WASM + Web Worker RPC | Boot `/simulator` in headless Chromium, load program, run at `50 ms` speed, pause midway, step forward, and reset. | WASM initializes in `< 500 ms`; Web Worker executes without dropping UI main-thread responsiveness; `Reset` restores `PC=0, clockCycles=0`. |
| `TC-INT-02` | FastAPI API Contract (`pytest`) | Test all `/api/v1/*` endpoints (`health`, `components`, `insights`, `library/search`, `glossary`, `formulas`, `analytics/events`). | Valid calls return `200`/`202` matching `DATA_MODEL.md`; invalid component IDs return `404`; bad search query returns `400`; PII/extra analytics fields return `422`. |
| `TC-INT-03` | Backend-Unavailable Resilience | Stop FastAPI server (or set invalid `VITE_API_BASE_URL`) and navigate across all 6 pages, execute Simulator program, inspect components, and search Technical Library. | Non-intrusive `"Local Mode"` badge appears; **zero** uncaught errors or broken features; 36 components, 13 insights, library search, and WASM simulator run 100% normally. |
| `TC-INT-04` | Cross-Section Navigation Parity | Click `"View in 3D Anatomy"` inside `Engineering Insights -> Cache Hierarchy` and `"Run in CPU Simulator"` inside `Instruction Journey`. | Opens `/anatomy` focused/isolated on cache components (`mem-l1-icache`..`mem-l3-cache`) and opens `/simulator` preloaded with canonical program respectively. |

---

### 2.5 Group 5 — Application UX, Responsiveness & Accessibility (`TC-APP-*`)

| Test ID | Scope | Test Procedure | Expected Result & Acceptance Criterion |
|---|---|---|---|
| `TC-APP-01` | Route Navigation | Visit `/`, `/anatomy`, `/journey`, `/simulator`, `/insights`, `/library` including direct URL reload under production base path. | All 6 pages render cleanly with zero `404` asset/WASM failures. |
| `TC-APP-02` | Responsive Breakpoints | Test viewports `1440×900`, `1024×768`, and `390×844` across all 6 routes. | No clipped buttons, overlapping HUD drawers, or broken horizontal page scroll. |
| `TC-APP-03` | Keyboard & Screen Reader A11y | Run `axe-core` audit across all 6 routes; navigate Component Tree and Simulator controls using keyboard (`Tab`, `Enter`, `Space`, shortcuts). | Zero critical/serious `axe` WCAG 2.1 AA violations; contrast ratios `>= 4.5:1`; full keyboard reachability. |
| `TC-APP-04` | Production Build Validation | Run `npm run build` (`vite build`) + preview server (`vite preview`) and validate `.wasm`, `.glb`, and static JSON loading. | Zero TypeScript errors, zero missing chunk/WASM MIME errors. |

---

## 3. Release Quality Gates

A build is promoted to release-ready **only** when:
- `100%` of `cargo test` (`TC-CPU-*`) pass.
- `100%` of `pytest` (`TC-INT-02`) pass.
- `100%` of Vitest unit/schema integrity tests (`TC-3D-02`, schema validation) pass.
- `100%` of Playwright E2E critical flows (`TC-CPU-02` in browser WASM, `TC-INT-03` offline resilience, `TC-3D-03/05`, `TC-APP-03`) pass on Chromium without uncaught console/page errors.
