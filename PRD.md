# Product Requirements Document (PRD) — TIANEDGE

**Document ID:** `TIANEDGE-PRD-001`  
**Product Name:** TIANEDGE — Semiconductor & Microprocessor Exploration Platform  
**Tagline:** *Explore the Architecture. Understand the Intelligence.*  
**Status:** Approved Specification Baseline  
**Platform Target:** Web-Based, Desktop-First Interactive Engineering Application  

---

## 1. Purpose and Scope

This Product Requirements Document (PRD) defines the vision, scope, functional requirements, non-functional requirements, prioritization boundaries, and acceptance criteria for **TIANEDGE**. It serves as the authoritative product contract aligning the 3D visualization experience, educational content system, deterministic CPU instruction simulator, and supporting backend services.

TIANEDGE is **not** a semiconductor CAD tool, a physical silicon fabrication simulator, or a transistor-level electrical circuit simulator (such as SPICE). It is an **interactive engineering learning platform** designed to make microprocessor architecture visible, inspectable, and intelligible from the outer CPU package down to logical circuits and instruction execution.

---

## 2. Product Identity & Philosophy

### 2.1 Official Identity

| Attribute | Definition |
|---|---|
| **Official Project Name** | `TIANEDGE` |
| **Full Product Title** | TIANEDGE — Semiconductor & Microprocessor Exploration Platform |
| **Domain** | Semiconductor Technology & Computer Architecture Engineering |
| **Primary Focus** | CPU and Microprocessor Architecture |
| **Application Type** | Interactive 3D Engineering Explorer + Single Educational CPU Simulator |
| **Target Audience** | University engineering students, computer science learners, systems developers, and technical educators |
| **Ambition Tier** | Advanced Educational Engineering Platform |

### 2.2 Three Core Principles

1. **Explore:** Dissect the physical packaging, silicon die regions, processing core subsystems, memory hierarchy, digital logic foundations, and internal communication paths through interactive 3D inspection.
2. **Understand:** Study the engineering purpose, operating mechanism, system relationships, parameters, and real-world context of every CPU component using structured, citation-backed technical documentation.
3. **Experience:** Witness how instructions are fetched, decoded, read from registers, executed by the ALU, routed through memory, and written back through one integrated, deterministic CPU simulator.

---

## 3. Core Product Scope & Experience Pillars

TIANEDGE delivers **two primary experiences** with strict scope discipline:

### 3.1 Experience A — Interactive Engineering Exploration (Dominant Experience)

Interactive exploration represents the largest and most prominent part of the platform. Users inspect a multi-layered 3D microprocessor model, manipulate visualization modes (`Full Assembly`, `Exploded View`, `Section Cut`, `Component Isolation`, `Internal Architecture`, `Signal Flow`), select individual components, read 15-field engineering breakdowns, walk through guided instruction stages, and explore deeper computer architecture topics.

### 3.2 Experience B — CPU Instruction Execution Simulation (One Primary Simulation)

TIANEDGE includes **one and only one** executable simulation: the **CPU Instruction Execution Simulator**. Users load or enter educational assembly instructions (`TIAN-ISA v1`), control execution (`Run`, `Pause`, `Step Forward`, `Reset`, `Execution Speed`), and observe live deterministic updates to the Program Counter (`PC`), registers, ALU operations, flags, data memory, clock-cycle counters, active 3D components, and animated data paths.

**Explicit Scope Rule:** No secondary independent simulators (such as a separate GPU architecture simulator, physics thermal fluid simulator, or transistor-level analog circuit simulator) shall be added. Guided animations and the `Instruction Journey` walkthrough are synchronized educational visualizations rather than separate simulation engines.

---

## 4. Application Information Architecture (6 Primary Sections)

TIANEDGE organizes all user workflows into six top-level sections:

| # | Section Name | Route | Role in Product | Primary Spec Reference |
|---|---|---|---|---|
| **01** | **Overview** | `/` | Platform entry point, cinematic 3D CPU hero, architecture summary, learning entry points | [DESIGN.md](./DESIGN.md) |
| **02** | **Chip Anatomy** | `/anatomy` | Core 3D component exploration across 6 groups (36 components), 6 visualization modes, inspection drawer | [CHIP_ANATOMY_SPEC.md](./CHIP_ANATOMY_SPEC.md) |
| **03** | **Instruction Journey** | `/journey` | Guided, stage-by-stage educational walkthrough of the 6 instruction processing stages | [INSTRUCTION_JOURNEY_SPEC.md](./INSTRUCTION_JOURNEY_SPEC.md) |
| **04** | **CPU Simulator** | `/simulator` | Interactive deterministic `TIAN-ISA v1` execution workspace driven by Rust/WASM in a Web Worker | [SIMULATION_SPEC.md](./SIMULATION_SPEC.md) |
| **05** | **Engineering Insights** | `/insights` | Deep technical modules (13 topics) linking architectural concepts directly to 3D components and simulator behavior | [ENGINEERING_CONTENT_SPEC.md](./ENGINEERING_CONTENT_SPEC.md) |
| **06** | **Technical Library** | `/library` | Component encyclopedia, glossary, semiconductor fundamentals, reference formulas, diagrams, and learning paths | [ENGINEERING_CONTENT_SPEC.md](./ENGINEERING_CONTENT_SPEC.md) |

---

## 5. Detailed Functional Requirements

### 5.1 Section 01 — Overview (`/`)

- **FR-OVR-01:** Render a real-time interactive 3D hero microprocessor model with restrained idle animation (slow rotation, subtle circuit signal illumination, thermal airflow cues).
- **FR-OVR-02:** Present the three product principles (`Explore`, `Understand`, `Experience`) with direct navigation triggers to `Chip Anatomy`, `Instruction Journey`, and `CPU Simulator`.
- **FR-OVR-03:** Provide a concise high-level architectural map explaining how package, die, core, cache hierarchy, digital logic, and interconnect layers relate.
- **FR-OVR-04:** Display engine readiness status (WASM engine loaded locally; optional backend status indicator that never blocks core features).

### 5.2 Section 02 — Chip Anatomy (`/anatomy`)

- **FR-ANT-01:** Support all **6 visualization modes**: `Full Assembly`, `Exploded View`, `Section Cut`, `Component Isolation`, `Internal Architecture`, and `Signal Flow`.
- **FR-ANT-02:** Expose all **36 canonical CPU components** across 6 groups (`CPU Package`, `Silicon Die`, `Processing Core`, `Memory Hierarchy`, `Digital Logic Foundation`, `Communication and Control`) via a hierarchical tree and 3D scene selection.
- **FR-ANT-03:** Support camera orbit (`360°`), zoom, pan, reset camera, guided camera focus onto selected components, hover highlighting, click-to-inspect, and per-component visibility toggles.
- **FR-ANT-04:** Link every selectable 3D mesh via a stable `componentId` to structured engineering metadata containing all required documentation dimensions (`Overview`, `Function`, `Engineering Principle`, `Internal Structure`, `Operation`, `System Relationship`, `Parameters`, `Real-world Context`, plus representation classification and references).
- **FR-ANT-05:** Clearly distinguish physical package parts, architectural die blocks, logical subsystems, and enlarged conceptual models (`logic-transistors`, `logic-gates`, etc.) in both 3D presentation and UI badges so learners never mistake conceptual models for literal physical scale.

### 5.3 Section 03 — Instruction Journey (`/journey`)

- **FR-JRN-01:** Walk learners through the **6 canonical instruction stages**: `1. Fetch`, `2. Decode`, `3. Register Read`, `4. Execute`, `5. Memory Access`, `6. Write Back`.
- **FR-JRN-02:** Provide guided controls: `Next Stage`, `Previous Stage`, `Play / Pause Auto-Advance`, `Reset`, and direct stage jump selection.
- **FR-JRN-03:** Synchronize each stage with a guided 3D camera transition, active component highlights, animated data/control signal pulses, and contextual engineering commentary.
- **FR-JRN-04:** Allow launching the `Instruction Journey` sample instruction directly inside the `CPU Simulator` for interactive experimentation, ensuring identical stage definitions and data-path semantics.

### 5.4 Section 04 — CPU Simulator (`/simulator`)

- **FR-SIM-01:** Execute documented educational assembly programs (`TIAN-ISA v1`), supporting the canonical baseline program (`LOAD R1, 10`, `LOAD R2, 20`, `ADD R3, R1, R2`, `STORE R3, 100`) alongside memory-load (`LOAD Rd, [addr]` / `LOADM`), arithmetic/logic (`ADD`, `SUB`, `MUL`, `AND`, `OR`, `XOR`, `CMP`), control-flow (`JMP`, `JZ`, `JNZ`), `MOV`, `NOP`, and `HALT`.
- **FR-SIM-02:** Run all parsing, decoding, register updates, ALU execution, memory operations, and cycle counting inside the compiled **Rust/WASM** engine inside a dedicated **Web Worker**.
- **FR-SIM-03:** Operate 100% locally in the browser without requiring the Python FastAPI backend.
- **FR-SIM-04:** Provide execution controls: `Run`, `Pause`, `Step Forward` (single micro-stage step or instruction step), `Reset`, `Execution Speed` slider, and `Instruction Selection` (preset programs + custom editor with syntax diagnostics).
- **FR-SIM-05:** Display live deterministic outputs: Program Counter (`PC`), General-Purpose Registers (`R0`–`R7`), Special Registers (`IR`, `MAR`, `MDR`), `FLAGS` (`Z`, `N`, `C`, `V`), active ALU operation, Data Memory state (`MEM[0..255]`), simulated clock-cycle counter, execution status, current instruction, current stage (`FETCH`..`WRITE_BACK`), and synchronized 3D active-component / data-path visualization.

### 5.5 Section 05 — Engineering Insights (`/insights`)

- **FR-INS-01:** Provide structured technical deep dives for all **13 required architecture topics**: `Von Neumann Architecture`, `Harvard Architecture`, `RISC and CISC`, `Instruction Set Architecture`, `CPU Pipelining`, `Branch Prediction`, `Cache Hierarchy`, `Clock Frequency`, `Instructions Per Cycle`, `Parallel Processing`, `Multi-core Architecture`, `Power Consumption`, and `Thermal Management`.
- **FR-INS-02:** Link each insight article to relevant `componentId` entries (enabling "Inspect in 3D" jumps directly to `Chip Anatomy` with those components focused/isolated) and relevant simulator presets where applicable.
- **FR-INS-03:** Explicitly differentiate general computer architecture theory from vendor-specific commercial implementations.

### 5.6 Section 06 — Technical Library (`/library`)

- **FR-LIB-01:** Provide searchable access to the `Component Encyclopedia`, `Engineering Glossary`, `Semiconductor Fundamentals`, `CPU Architecture References`, `Technical Diagrams`, `Engineering Formulas & Equations`, and curated `Learning Paths`.
- **FR-LIB-02:** Display verifiable source attributions for every entry, formula, and architectural diagram.
- **FR-LIB-03:** Fetch enriched/searchable library resources from the Python FastAPI backend when configured and reachable, while seamlessly falling back to the bundled static JSON dataset when offline or deployed statically.

---

## 6. Non-Functional Requirements

| Category | Requirement ID | Target & Verification Basis |
|---|---|---|
| **Determinism** | `NFR-DET-01` | Identical initial state and `TIAN-ISA v1` program must produce bit-identical register, memory, flag, and cycle states across runs and browsers. |
| **Offline Core** | `NFR-OFF-01` | `Overview`, `Chip Anatomy`, `Instruction Journey`, `CPU Simulator`, `Engineering Insights`, and `Technical Library` static baselines must work with zero backend connectivity. |
| **3D Performance** | `NFR-PRF-01` | Target 60 FPS on modern desktop WebGL2 GPUs, <= 120 draw calls in standard assembly view, <= 150k triangles total across active package/die/core geometry, lazy loading for optional detail assets. |
| **WASM Latency** | `NFR-PRF-02` | WASM module initialization <= 500 ms on broadband; single simulation step round-trip across Web Worker <= 16 ms. |
| **Responsiveness** | `NFR-UX-01` | Desktop-first layout (`>= 1280px` optimal split pane) with functional tablet/mobile fallback layout (`>= 360px` width without overlapping controls). |
| **Accessibility** | `NFR-A11-01` | Keyboard navigation for all 6 sections, component list, and simulator controls; WCAG 2.1 AA text contrast (`>= 4.5:1`); full `prefers-reduced-motion` support disabling idle camera orbit and pulsing effects. |
| **Engineering Honesty** | `NFR-HON-01` | Conceptual models and educational ISA abstractions must be explicitly labeled; zero fabricated vendor benchmarks or unverified CAD accuracy claims. |

---

## 7. Prioritization & Explicit Non-Goals

### 7.1 Priority Tiers

1. **Highest Priority:** Interactive 3D Chip Anatomy (36-component exploration, visualization modes, metadata binding).
2. **Highest Priority:** CPU Instruction Execution Simulator (Rust/WASM deterministic engine + synchronized 3D & telemetry UI).
3. **High Priority:** Instruction Journey & Animation System (6-stage walkthrough, idle animations, guided transitions).
4. **Medium Priority:** Engineering Insights (13 topics) & Technical Library (encyclopedia, glossary, formulas, learning paths).
5. **Supporting Priority:** Python/FastAPI Backend & Analytics (content API, search, validation, optional telemetry).

### 7.2 Explicitly Out of Scope

- Full transistor-level SPICE or analog/mixed-signal electrical circuit simulation.
- Physical semiconductor lithography, doping, or fabrication process simulation.
- Schematic capture, HDL synthesis (Verilog/VHDL), or full EDA/CAD chip design authoring.
- Separate GPU architecture simulator or unrelated secondary hardware simulators.
- Exact microarchitectural or binary-compatible emulation of commercial x86, ARM, or RISC-V silicon.

---

## 8. Final Product Acceptance Criteria

TIANEDGE is ready for production release only when all 12 acceptance gates are verified:

| Area | Acceptance Criterion |
|---|---|
| **Identity** | Consistent `TIANEDGE` naming, tagline, 3 principles, and laboratory/museum visual identity across all views. |
| **3D** | CPU assembly loads cleanly; all 6 visualization modes and camera controls operate smoothly within performance budgets. |
| **Anatomy** | All 36 components across 6 groups are selectable/inspectable and mapped to complete, non-placeholder metadata. |
| **Animation** | Idle animations run unobtrusively and respect reduced-motion; guided animations accurately follow user/simulation state. |
| **Journey** | All 6 instruction stages progress sequentially with synchronized camera focus, highlights, and data-path pulses. |
| **Simulator** | `TIAN-ISA v1` programs (including the canonical 4-line test) execute deterministically with accurate registers, flags, memory, PC, and cycle counts. |
| **Engineering** | All 13 Insights topics and Technical Library modules contain accurate, source-attributed content with zero contradictions. |
| **Rust** | `tianedge-cpu` compiles to `wasm32-unknown-unknown`, passes unit/property tests, and executes independently of Python. |
| **Python** | FastAPI service passes contract tests, Pydantic validation, and serves content/search/health/analytics cleanly. |
| **TypeScript** | Strict TypeScript build succeeds; React UI, state management, Web Worker bridge, and R3F 3D scene integrate cleanly. |
| **Testing** | Unit, integration, 3D scene, accessibility, and offline-fallback tests defined in [TEST_PLAN.md](./TEST_PLAN.md) pass. |
| **Deployment** | Production static frontend + WASM bundle and containerized FastAPI build validate cleanly per [DEPLOYMENT.md](./DEPLOYMENT.md). |

---

## 9. Cross-Document References

- System & Layer Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)
- Architectural Constraints & Decisions: [constraints.md](./constraints.md)
- Implementation Roadmap: [flow.md](./flow.md)
- Visual & UI/UX System: [DESIGN.md](./DESIGN.md)
- Component Specifications: [CHIP_ANATOMY_SPEC.md](./CHIP_ANATOMY_SPEC.md)
- Primary Simulator Specification: [SIMULATION_SPEC.md](./SIMULATION_SPEC.md)
- Instruction Journey Walkthrough: [INSTRUCTION_JOURNEY_SPEC.md](./INSTRUCTION_JOURNEY_SPEC.md)
- Educational Content Specification: [ENGINEERING_CONTENT_SPEC.md](./ENGINEERING_CONTENT_SPEC.md)
