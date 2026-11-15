# Project Constraints & Engineering Decisions — TIANEDGE

**Document ID:** `TIANEDGE-CONST-001`  
**Product Name:** TIANEDGE — Semiconductor & Microprocessor Exploration Platform  
**Status:** Mandatory Architecture & Delivery Guardrails  

---

## 1. Purpose

This document establishes the non-negotiable architectural constraints, scope boundaries, scientific/engineering honesty standards, and foundational design decisions governing **TIANEDGE**. Future engineering contributors and automated implementation agents must treat these constraints as invariants enforced during code reviews, CI checks, and acceptance testing.

---

## 2. Core Mandatory Constraints (C-01 through C-15)

| ID | Constraint | Engineering Rationale | Verification Rule |
|---|---|---|---|
| **C-01** | **Only One Primary Simulator** | TIANEDGE prioritizes visual architectural exploration. Introducing multiple disconnected simulators fragments UX and dilutes engineering depth. | Exactly one simulator route (`/simulator`) and one WASM engine (`tianedge-cpu`) exist. `Instruction Journey` (`/journey`) is a guided walkthrough sharing the same 6-stage definitions, not a second engine. |
| **C-02** | **Educational and Deterministic Simulator** | Learners must be able to predict, step through, pause, reset, and reproduce every instruction outcome without nondeterministic timing jitter. | Given identical initial register/memory states and `TIAN-ISA v1` program, Rust/WASM produces bit-identical `CpuSnapshot` outputs on every step and platform. |
| **C-03** | **Rust/WASM Owns CPU Execution** | Isolating parsing, decoding, register file, ALU, memory, and cycle stepping in Rust guarantees type safety, zero-cost determinism, native unit testing (`cargo test`), and clear architectural separation. | Zero instruction execution or ALU logic may exist in TypeScript or Python. TypeScript only forwards user commands and renders `CpuSnapshot` results. |
| **C-04** | **Python Is Not Required for Core Local Simulation** | Static hosting (e.g., GitHub Pages) and offline classroom use require the explorer and simulator to work reliably even when no backend server is running. | Disconnecting or stopping the FastAPI server must leave `Overview`, `Chip Anatomy`, `Instruction Journey`, `CPU Simulator`, and bundled educational content 100% functional. |
| **C-05** | **TypeScript Owns Frontend and Visualization** | React, state stores, Three.js / React Three Fiber rendering, interaction, animation orchestration, and Web Worker RPC belong in strict TypeScript. | All UI, 3D scene components, camera controllers, and Worker adapters are implemented in TypeScript with `strict: true`. |
| **C-06** | **3D Components Must Connect to Educational Metadata** | 3D geometry is an educational instrument, not passive decoration. Every selectable mesh must inspect into real technical explanation. | Every selectable mesh carries a canonical `componentId` validated by tests against the 36-entry `ChipComponent` registry; zero hardcoded technical prose inside 3D mesh TSX files. |
| **C-07** | **Idle Animations Must Not Impair Performance or Readability** | Ambient animations enrich laboratory atmosphere but must never trigger frame drops, GPU overheating, or visual clutter while reading text. | Idle animation caps GPU usage, pauses on tab blur, respects `prefers-reduced-motion`, and avoids overlapping text panels. |
| **C-08** | **Guided Animations Must Reflect Real Application States** | Fake or decoupled animations confuse learners about what the CPU is actually doing. | Camera moves, highlighted `componentId` sets, and signal-flow pulses in `Instruction Journey` and `CPU Simulator` derive directly from canonical `stage` and `CpuSnapshot.activeComponentIds` / `activePaths`. |
| **C-09** | **Physical and Logical Representations Must Be Distinguished** | A silicon die floorplan, an abstract bus topology, a physical heat spreader, and an enlarged MOSFET gate operate at radically different scales and abstraction levels. | Every component carries an explicit `representationType` (`physical_package`, `architectural_block`, `logical_subsystem`, `conceptual_enlarged`, `signal_overlay`) displayed in the UI. |
| **C-10** | **No Fabricated Commercial CPU Specifications** | Claiming exact compatibility with proprietary commercial microarchitectures without verified implementation is misleading and technically indefensible. | Simulator explicitly documents `TIAN-ISA v1` (educational ISA) and Modified Harvard 256-word memory; commercial references in `Engineering Insights` and `Technical Library` cite verified architectural concepts only. |
| **C-11** | **No Unverified CAD Accuracy Claims** | Procedural geometry and simplified educational GLBs represent architectural structure, not manufacturing CAD blueprints. | Documentation and UI captions explicitly describe 3D assets as conceptual engineering reconstructions unless backed by a verified open hardware CAD source with provenance. |
| **C-12** | **No Unnecessary Independent Simulation Systems** | Avoid thermal CFD, electrical SPICE, or separate GPU simulators that divert engineering budget from core CPU exploration. | No secondary simulation engines or physics solvers may be added outside the single `tianedge-cpu` engine. |
| **C-13** | **Assets Must Have Documented Provenance and Licensing** | Every external GLB, texture, font, or icon must be legally distributable and auditable. | `ASSET_GUIDELINES.md` and an asset manifest file track source, author, license (MIT/CC0/CC-BY/Apache-2.0), and modification notes for every third-party asset. |
| **C-14** | **All Technical Claims Must Be Defensible** | Every equation, parameter range, latency order of magnitude, and definition must align with peer-reviewed textbooks or official vendor/standards specifications. | All formulas declare variables, units, and assumptions; `Engineering Insights` and `Technical Library` entries cite verifiable literature. |
| **C-15** | **Architecture Must Remain Maintainable and Testable** | Clean boundaries enable parallel development and automated verification across TS, Rust, and Python. | Rust core tests without DOM, Python FastAPI tests without browser, and TS unit/component tests without live backend must all pass independently in CI. |

---

## 3. Additional Derived Engineering Decisions

The following engineering decisions were established during specification design to eliminate cross-document ambiguity:

### ED-01 — Unified 6-Stage Execution Model (`FETCH` .. `WRITE_BACK`)

- **Decision:** Both `Instruction Journey` and `CPU Simulator` use the exact same 6 canonical stages: `1. FETCH`, `2. DECODE`, `3. REGISTER_READ`, `4. EXECUTE`, `5. MEMORY_ACCESS`, `6. WRITE_BACK`.
- **Rationale:** Classic Patterson & Hennessy RISC literature often draws 5 pipeline stages (`IF, ID, EX, MEM, WB`) where register reads occur inside `ID`. Splitting `REGISTER_READ` into its own explicit stage gives learners clear visual separation between control decoding (`core-instruction-decoder`) and register file reading (`mem-register-file` / `core-registers`) before ALU computation (`core-alu`).
- **Consequence:** Documentation explicitly explains this 6-stage educational choice alongside the standard 5-stage hardware pipeline in [INSTRUCTION_JOURNEY_SPEC.md](./INSTRUCTION_JOURNEY_SPEC.md) and [ENGINEERING_CONTENT_SPEC.md](./ENGINEERING_CONTENT_SPEC.md).

### ED-02 — Sequential Non-Pipelined Simulator Semantics vs. Hardware Pipelining

- **Decision:** `CPU Simulator` executes **one instruction sequentially across 6 clock-tick stages** (`CPI = 6` simulated cycles per instruction, with stage-level active/bypassed indicators), rather than overlapping multiple instructions simultaneously in a hardware pipeline.
- **Rationale:** Overlapping 5 instructions simultaneously on a 3D die makes data-path visualization visually ambiguous for first-time architecture learners. Sequential multi-stage stepping maintains 1:1 visual clarity while keeping `CPU Pipelining` deeply covered in `Engineering Insights`.
- **Consequence:** Cycle counter (`clockCycles`) increments by `+1` per stage step (`FETCH`..`WRITE_BACK`), and `SIMULATION_SPEC.md` explicitly states that simulated `IPC = 1/6` reflects educational sequential multi-cycle stepping rather than modern superscalar hardware throughput.

### ED-03 — `TIAN-ISA v1` Operand & Memory Conventions

- **Decision:** `TIAN-ISA v1` uses a **Modified Harvard** educational address space:
  - **Instruction Memory:** `256` instruction slots indexed `0..255` (`PC` increments by `1` per instruction).
  - **Data Memory:** `256` 32-bit signed integer cells indexed `0..255` (`MEM[0..255]`).
  - **Immediate vs. Memory Load Syntax:** `LOAD Rd, <imm>` loads an immediate integer (e.g., `LOAD R1, 10` sets `R1 = 10`), whereas `LOAD Rd, [<addr>]` or `LOADM Rd, <addr>` reads from Data Memory `MEM[addr]`. `STORE Rs, <addr>` (and `[<addr>]`) writes `Rs` to `MEM[addr]` (e.g., `STORE R3, 100`).
- **Rationale:** Ensures the canonical educational program (`LOAD R1, 10`, `LOAD R2, 20`, `ADD R3, R1, R2`, `STORE R3, 100`) executes intuitively (`R3 = 30`, `MEM[100] = 30`) while preventing beginners from accidentally corrupting instruction memory when writing to data memory.

### ED-04 — Hybrid Static-First Content Delivery

- **Decision:** Build-time JSON exports of the 36 `ChipComponent` entries, 13 `EngineeringInsightTopic` entries, and `TechnicalLibrary` entries are bundled directly into `apps/web/public/data/` alongside the FastAPI backend's authoritative dataset.
- **Rationale:** Satisfies **C-04** and GitHub Pages static deployment without duplicating conflicting prose; a single canonical source script validates and emits matching schemas for frontend static fallback and FastAPI serving.

### ED-05 — Strict Naming Convention (`TIANEDGE`)

- **Decision:** Use the exact uppercase project name **`TIANEDGE`** across documentation, UI headers, crate names (`tianedge-cpu`), package titles, and repository identifiers. Former candidate names (`CHIPCORE`, `TIANEX`) are retired and must never appear in product documentation or code.

---

## 4. Cross-Document References

- Product Requirements: [PRD.md](./PRD.md)
- System Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)
- Implementation Roadmap: [flow.md](./flow.md)
- Canonical Data Model: [DATA_MODEL.md](./DATA_MODEL.md)
- Simulator Specification: [SIMULATION_SPEC.md](./SIMULATION_SPEC.md)
