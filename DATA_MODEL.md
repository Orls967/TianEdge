# Canonical Data Models & Serialization Contract — TIANEDGE

**Document ID:** `TIANEDGE-DATA-001`  
**Product Name:** TIANEDGE — Semiconductor & Microprocessor Exploration Platform  
**Serialization Format:** UTF-8 JSON (`camelCase` in TypeScript & API JSON wire format; Rust structs annotated with `#[serde(rename_all = "camelCase")]`; Python Pydantic v2 models using alias generator `to_camel` so one canonical wire format governs all three languages).  

---

## 1. Purpose and Single-Source-of-Truth Policy

This specification defines the canonical data structures shared across **TypeScript** (Frontend & 3D), **Rust/WASM** (CPU Execution Engine), and **Python/FastAPI** (Backend & Content Validation).

- **Wire Parity:** All cross-boundary JSON payloads (Worker <-> UI, WASM <-> Worker, FastAPI <-> UI) use identical `camelCase` field names and strict enum string literals.
- **No Duplicated Authoritative Prose:** 3D scene definitions store only `componentId` and spatial/animation parameters (`Model3DReference`); educational prose lives exclusively in `ChipComponent` records.

---

## 2. Chip Anatomy & 3D Component Schemas (TypeScript & JSON)

### 2.1 Component Group & Representation Enums

```typescript
export type ComponentGroupId =
  | "cpu-package"
  | "silicon-die"
  | "processing-core"
  | "memory-hierarchy"
  | "digital-logic"
  | "communication-control";

export type RepresentationType =
  | "physical_package"
  | "architectural_block"
  | "logical_subsystem"
  | "conceptual_enlarged"
  | "signal_overlay";

export type VisualizationMode =
  | "full_assembly"
  | "exploded_view"
  | "section_cut"
  | "component_isolation"
  | "internal_architecture"
  | "signal_flow";
```

### 2.2 Canonical `ChipComponent` & Relationships

```typescript
export interface TechnicalParameter {
  key: string;
  label: string;
  value: string;
  unit?: string;
  note?: string;
}

export interface ComponentRelationship {
  targetComponentId: string; // Must exist in canonical 36-component registry
  relationType:
    | "contains"
    | "contained_by"
    | "connects_to"
    | "controlled_by"
    | "controls"
    | "supplies_power"
    | "dissipates_heat"
    | "implements_logic"
    | "architectural_mirror";
  description: string;
}

export interface Model3DReference {
  meshPrefix: string; // Canonical: "tianedge__<componentId>"
  assetFile: "cpu_package_v1.glb" | "cpu_die_core_v1.glb" | "logic_foundation_v1.glb" | "procedural";
  defaultVisibleModes: VisualizationMode[];
  explodedOffset: [number, number, number];
  cameraPreset: {
    position: [number, number, number];
    target: [number, number, number];
  };
  highlightColorHex: string; // Default "#00E5FF" or "#FBBF24"
}

export interface ChipComponent {
  id: string; // Stable kebab-case ID (e.g., "core-alu")
  name: string;
  groupId: ComponentGroupId;
  representationType: RepresentationType;
  scaleDisclaimer?: string; // Mandatory when representationType === "conceptual_enlarged"

  // Structured 15-field educational breakdown (mapped cleanly from CHIP_ANATOMY_SPEC)
  definition: string;
  primaryFunction: string;
  engineeringPrinciples: string;
  construction: string;
  operation: string;
  internalStructure: string[];
  inputs: string[];
  outputs: string[];
  relationships: ComponentRelationship[];
  parameters: TechnicalParameter[];
  realWorldContext: string;

  // Cross-section integration & provenance
  modelReference: Model3DReference;
  relatedInsightIds: string[];   // Topic IDs from ENGINEERING_CONTENT_SPEC (13 topics)
  citationIds: string[];         // Reference IDs resolved in citations.json
}
```

### 2.3 Validation Rules for `ChipComponent`

- `id` matches `^[a-z0-9]+(-[a-z0-9]+)+$` and is one of the 36 canonical component IDs.
- `scaleDisclaimer` is **required and non-empty** whenever `representationType === "conceptual_enlarged"`.
- Every `relationships[].targetComponentId` must resolve inside `components.json`.
- `citationIds` array must contain `>= 1` valid citation key.

---

## 3. Animation & Data-Path Edge Schemas

```typescript
export type DataPathEdgeId =
  | "pc_to_l1i"
  | "l1i_to_ir"
  | "ir_to_decoder"
  | "decoder_to_cu"
  | "regs_to_alu_opA"
  | "regs_to_alu_opB"
  | "alu_compute_internal"
  | "alu_to_flags"
  | "lsu_to_l1d"
  | "l1d_to_mem_if"
  | "alu_to_wb_regs"
  | "mdr_to_wb_regs"
  | "alu_bypass_mem";

export interface AnimationDefinition {
  edgeId: DataPathEdgeId;
  sourceComponentId: string;
  targetComponentId: string;
  controlPoints: [number, number, number][]; // 3D Catmull-Rom anchor points
  signalKind: "data" | "address" | "control";
  colorHex: string; // "#22D3EE" for data/address, "#FBBF24" for control
  defaultDurationMs: number; // e.g., 450
}

export interface GuidedAnimationCommand {
  mode: VisualizationMode;
  focusedComponentId: string | null;
  highlightedComponentIds: string[];
  controlHighlightedIds: string[];
  activePathEdges: DataPathEdgeId[];
  packetDurationMs: number;
  reducedMotion: boolean;
}
```

---

## 4. CPU Simulator & `TIAN-ISA v1` Schemas (Rust + TypeScript)

### 4.1 Canonical Rust Data Structures (`crates/tianedge-cpu/src/`)

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ExecutionStage {
    Fetch,
    Decode,
    RegisterRead,
    Execute,
    MemoryAccess,
    WriteBack,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ExecutionStatus {
    Idle,
    Ready,
    Running,
    Paused,
    Halted,
    Fault,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum Opcode {
    LoadImm,
    LoadMem,
    LoadMemIndirect,
    Store,
    StoreIndirect,
    Mov,
    Add,
    Sub,
    Mul,
    And,
    Or,
    Xor,
    Cmp,
    Jmp,
    Jz,
    Jnz,
    Nop,
    Halt,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AluFlags {
    pub zero: bool,     // Z
    pub negative: bool, // N
    pub carry: bool,    // C
    pub overflow: bool, // V
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ControlSignalsState {
    pub pc_write: bool,
    pub ir_write: bool,
    pub reg_write: bool,
    pub mem_read: bool,
    pub mem_write: bool,
    pub alu_op: Option<String>,
    pub branch_taken: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AluOperationState {
    pub operation: String, // e.g., "ADD", "SUB", "PASS_IMM", "NONE"
    pub operand_a: Option<i32>,
    pub operand_b: Option<i32>,
    pub result: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoryCellSnapshot {
    pub address: u16,
    pub value: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CpuFault {
    pub code: String,    // e.g., "MEMORY_OUT_OF_BOUNDS", "CYCLE_LIMIT_REACHED"
    pub message: String,
    pub line: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CpuSnapshot {
    pub status: ExecutionStatus,
    pub stage: ExecutionStage,
    pub stage_active: bool,
    pub pc: u16,
    pub current_instruction_line: Option<u32>,
    pub ir: Option<String>,
    pub mar: Option<u16>,
    pub mdr: Option<i32>,
    pub registers: [i32; 8], // R0..R7
    pub changed_registers: Vec<u8>,
    pub flags: AluFlags,
    pub alu: AluOperationState,
    pub control_signals: ControlSignalsState,
    pub clock_cycles: u64,
    pub executed_instructions: u64,
    pub non_zero_memory: Vec<MemoryCellSnapshot>,
    pub last_modified_memory_addr: Option<u16>,
    pub active_component_ids: Vec<String>,
    pub active_paths: Vec<String>,
    pub fault: Option<CpuFault>,
}
```

### 4.2 TypeScript Simulator & Parse Diagnostic Types

```typescript
export interface ParseError {
  code: "UNKNOWN_OPCODE" | "INVALID_REGISTER" | "SYNTAX_ERROR" | "UNDEFINED_LABEL" | "DUPLICATE_LABEL" | "PROGRAM_TOO_LARGE";
  line: number;   // 1-indexed source line
  column: number; // 1-indexed column
  token: string;
  message: string;
}

export interface LoadProgramResult {
  ok: boolean;
  instructionCount: number;
  snapshot?: CpuSnapshot;
  errors?: ParseError[];
}
```

### 4.3 Example `CpuSnapshot` JSON Payload (After `ADD R3, R1, R2` Stage `EXECUTE`)

```json
{
  "status": "ready",
  "stage": "EXECUTE",
  "stageActive": true,
  "pc": 2,
  "currentInstructionLine": 3,
  "ir": "ADD R3, R1, R2",
  "mar": null,
  "mdr": null,
  "registers": [0, 10, 20, 0, 0, 0, 0, 0],
  "changedRegisters": [],
  "flags": { "zero": false, "negative": false, "carry": false, "overflow": false },
  "alu": { "operation": "ADD", "operandA": 10, "operandB": 20, "result": 30 },
  "controlSignals": {
    "pcWrite": false,
    "irWrite": false,
    "regWrite": false,
    "memRead": false,
    "memWrite": false,
    "aluOp": "ADD",
    "branchTaken": false
  },
  "clockCycles": 16,
  "executedInstructions": 2,
  "nonZeroMemory": [],
  "lastModifiedMemoryAddr": null,
  "activeComponentIds": ["core-alu", "core-execution-units", "core-control-unit"],
  "activePaths": ["alu_compute_internal", "alu_to_flags"],
  "fault": null
}
```

---

## 5. Instruction Journey State Schema (TypeScript)

```typescript
export type JourneyScenarioId = "add_register_flow" | "store_memory_flow";

export interface JourneyStageSpec {
  stage: ExecutionStage;
  stepNumber: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  educationalObjective: string;
  technicalExplanation: string;
  activeComponentIds: string[];
  controlHighlightedIds: string[];
  activePathEdges: DataPathEdgeId[];
  cameraPreset: { position: [number, number, number]; target: [number, number, number] };
  dataPayloadSummary: Record<string, string | number | boolean>;
  stageBypassed: boolean;
}

export interface InstructionJourneyState {
  scenarioId: JourneyScenarioId;
  currentStepIndex: number; // 0..5
  isAutoPlaying: boolean;
  autoCameraEnabled: boolean;
  stages: JourneyStageSpec[];
}
```

---

## 6. Educational Content & Technical Reference Schemas

```typescript
export interface CitationEntry {
  id: string;
  authors: string;
  title: string;
  publication: string;
  year: number;
  sectionOrChapter?: string;
  url?: string;
}

export interface EngineeringInsightTopic {
  id: string; // e.g., "cache-hierarchy"
  order: number; // 1..13
  title: string;
  learningObjective: string;
  technicalDefinition: string;
  engineeringExplanation: string;
  generalVsVendorNote: string;
  relatedComponentIds: string[];
  simulatorPresetId?: string;
  diagramId?: string;
  formulaIds: string[];
  citationIds: string[];
}

export interface GlossaryTerm {
  id: string;
  term: string;
  acronym?: string;
  category: "architecture" | "semiconductor" | "memory" | "digital_logic" | "packaging";
  conciseDefinition: string;
  technicalContext: string;
  relatedComponentIds: string[];
  citationIds: string[];
}

export interface FormulaVariable {
  symbol: string;
  name: string;
  unit: string;
  description: string;
}

export interface FormulaEntry {
  id: string;
  name: string;
  latex: string;
  variables: FormulaVariable[];
  assumptions: string;
  applicability: string;
  workedExample: string;
  relatedInsightIds: string[];
  citationIds: string[];
}

export interface LearningPathStep {
  stepOrder: number;
  targetRoute: "/anatomy" | "/journey" | "/simulator" | "/insights" | "/library";
  targetId?: string;
  title: string;
  objective: string;
}

export interface LearningPath {
  id: string;
  title: string;
  difficulty: "foundational" | "intermediate" | "advanced";
  estimatedMinutes: number;
  summary: string;
  steps: LearningPathStep[];
}

export interface SemiconductorPrimer {
  id: string;
  title: string;
  summary: string;
  sections: { heading: string; body: string }[];
  keyTakeaways: string[];
  relatedComponentIds: string[];
  citationIds: string[];
}

export interface ArchitectureReference {
  id: string;
  title: string;
  summary: string;
  comparisonRows: Record<string, string>[];
  scopeDisclaimer: string;
  citationIds: string[];
}

export interface TechnicalDiagramEntry {
  id: string;
  title: string;
  svgAssetPath: string;
  caption: string;
  relatedComponentIds: string[];
  citationIds: string[];
}

// --- API Transport & Telemetry DTOs (aligned with API_CONTRACT.md) ---

export interface HealthResponse {
  status: "ok" | "degraded";
  service: "tianedge-api";
  version: string;
  datasetCounts: {
    components: number;
    insights: number;
    glossaryTerms: number;
    fundamentals: number;
    references: number;
    diagrams: number;
    formulas: number;
    learningPaths: number;
  };
}

export interface LibrarySearchItem {
  kind: "component" | "insight" | "glossary" | "formula" | "fundamental" | "reference" | "diagram";
  id: string;
  title: string;
  snippet: string;
  route: string;
  relatedComponentIds: string[];
  score: number;
}

export interface LibrarySearchResponse {
  query: string;
  total: number;
  results: LibrarySearchItem[];
}

export interface AnalyticsEventRequest {
  eventType: "section_viewed" | "component_selected" | "mode_changed" | "journey_completed" | "simulator_preset_run" | "insight_opened";
  section: "overview" | "anatomy" | "journey" | "simulator" | "insights" | "library";
  targetId: string;
  sessionId: string;
  timestampUtc: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details: unknown | null;
  };
}
```

---

## 7. Cross-Document References

- Backend API Serialization & Endpoints: [API_CONTRACT.md](./API_CONTRACT.md)
- Component Metadata Values: [CHIP_ANATOMY_SPEC.md](./CHIP_ANATOMY_SPEC.md)
- Simulator Engine & ISA Semantics: [SIMULATION_SPEC.md](./SIMULATION_SPEC.md)
- Educational Modules: [ENGINEERING_CONTENT_SPEC.md](./ENGINEERING_CONTENT_SPEC.md)
