/**
 * Canonical TypeScript data models aligned 1:1 with DATA_MODEL.md,
 * SIMULATION_SPEC.md, API_CONTRACT.md, and Rust serde schemas.
 */

export type ComponentGroupId =
  | 'cpu-package'
  | 'silicon-die'
  | 'processing-core'
  | 'memory-hierarchy'
  | 'digital-logic'
  | 'communication-control';

export type RepresentationType =
  | 'physical_package'
  | 'architectural_block'
  | 'logical_subsystem'
  | 'conceptual_enlarged'
  | 'signal_overlay';

export type VisualizationMode =
  | 'full_assembly'
  | 'exploded_view'
  | 'section_cut'
  | 'component_isolation'
  | 'internal_architecture'
  | 'signal_flow';

export interface TechnicalParameter {
  key: string;
  label: string;
  value: string;
  unit?: string;
  note?: string;
}

export type RelationType =
  | 'contains'
  | 'contained_by'
  | 'connects_to'
  | 'controlled_by'
  | 'controls'
  | 'supplies_power'
  | 'dissipates_heat'
  | 'implements_logic'
  | 'architectural_mirror';

export interface ComponentRelationship {
  targetComponentId: string;
  relationType: RelationType;
  description: string;
}

export type AssetFileId =
  | 'cpu_package_v1.glb'
  | 'cpu_die_core_v1.glb'
  | 'logic_foundation_v1.glb'
  | 'procedural';

export interface CameraPreset {
  position: [number, number, number];
  target: [number, number, number];
}

export interface Model3DReference {
  meshPrefix: string;
  assetFile: AssetFileId;
  defaultVisibleModes: VisualizationMode[];
  explodedOffset: [number, number, number];
  cameraPreset: CameraPreset;
  highlightColorHex: string;
}

export interface ChipComponent {
  id: string;
  name: string;
  groupId: ComponentGroupId;
  representationType: RepresentationType;
  scaleDisclaimer?: string;
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
  modelReference: Model3DReference;
  relatedInsightIds: string[];
  citationIds: string[];
}

export type DataPathEdgeId =
  | 'pc_to_l1i'
  | 'l1i_to_ir'
  | 'ir_to_decoder'
  | 'decoder_to_cu'
  | 'regs_to_alu_opA'
  | 'regs_to_alu_opB'
  | 'alu_compute_internal'
  | 'alu_to_flags'
  | 'lsu_to_l1d'
  | 'l1d_to_mem_if'
  | 'alu_to_wb_regs'
  | 'mdr_to_wb_regs'
  | 'alu_bypass_mem';

export interface AnimationDefinition {
  edgeId: DataPathEdgeId;
  sourceComponentId: string;
  targetComponentId: string;
  controlPoints: [number, number, number][];
  signalKind: 'data' | 'address' | 'control';
  colorHex: string;
  defaultDurationMs: number;
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

export type ExecutionStage =
  | 'FETCH'
  | 'DECODE'
  | 'REGISTER_READ'
  | 'EXECUTE'
  | 'MEMORY_ACCESS'
  | 'WRITE_BACK';

export type ExecutionStatus =
  | 'idle'
  | 'ready'
  | 'running'
  | 'paused'
  | 'halted'
  | 'fault';

export type Opcode =
  | 'LOAD_IMM'
  | 'LOAD_MEM'
  | 'LOAD_MEM_INDIRECT'
  | 'STORE'
  | 'STORE_INDIRECT'
  | 'MOV'
  | 'ADD'
  | 'SUB'
  | 'MUL'
  | 'AND'
  | 'OR'
  | 'XOR'
  | 'CMP'
  | 'JMP'
  | 'JZ'
  | 'JNZ'
  | 'NOP'
  | 'HALT';

export interface AluFlags {
  zero: boolean;
  negative: boolean;
  carry: boolean;
  overflow: boolean;
}

export interface ControlSignalsState {
  pcWrite: boolean;
  irWrite: boolean;
  regWrite: boolean;
  memRead: boolean;
  memWrite: boolean;
  aluOp: string | null;
  branchTaken: boolean;
}

export interface AluOperationState {
  operation: string;
  operandA: number | null;
  operandB: number | null;
  result: number | null;
}

export interface MemoryCellSnapshot {
  address: number;
  value: number;
}

export interface CpuFault {
  code: string;
  message: string;
  line: number | null;
}

export interface CpuSnapshot {
  status: ExecutionStatus;
  stage: ExecutionStage;
  stageActive: boolean;
  pc: number;
  currentInstructionLine: number | null;
  ir: string | null;
  mar: number | null;
  mdr: number | null;
  registers: [number, number, number, number, number, number, number, number];
  changedRegisters: number[];
  flags: AluFlags;
  alu: AluOperationState;
  controlSignals: ControlSignalsState;
  clockCycles: number;
  executedInstructions: number;
  nonZeroMemory: MemoryCellSnapshot[];
  lastModifiedMemoryAddr: number | null;
  activeComponentIds: string[];
  activePaths: string[];
  fault: CpuFault | null;
}

export type ParseErrorCode =
  | 'UNKNOWN_OPCODE'
  | 'INVALID_REGISTER'
  | 'SYNTAX_ERROR'
  | 'UNDEFINED_LABEL'
  | 'DUPLICATE_LABEL'
  | 'PROGRAM_TOO_LARGE';

export interface ParseError {
  code: ParseErrorCode;
  line: number;
  column: number;
  token: string;
  message: string;
}

export interface LoadProgramResult {
  ok: boolean;
  instructionCount: number;
  snapshot?: CpuSnapshot;
  errors?: ParseError[];
}

export type JourneyScenarioId = 'add_register_flow' | 'store_memory_flow';

export interface JourneyStageSpec {
  stage: ExecutionStage;
  stepNumber: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  educationalObjective: string;
  technicalExplanation: string;
  activeComponentIds: string[];
  controlHighlightedIds: string[];
  activePathEdges: DataPathEdgeId[];
  cameraPreset: CameraPreset;
  dataPayloadSummary: Record<string, string | number | boolean>;
  stageBypassed: boolean;
}

export interface InstructionJourneyState {
  scenarioId: JourneyScenarioId;
  currentStepIndex: number;
  isAutoPlaying: boolean;
  autoCameraEnabled: boolean;
  stages: JourneyStageSpec[];
}

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
  id: string;
  order: number;
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
  category: 'architecture' | 'semiconductor' | 'memory' | 'digital_logic' | 'packaging';
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
  targetRoute: '/anatomy' | '/journey' | '/simulator' | '/insights' | '/library';
  targetId?: string;
  title: string;
  objective: string;
}

export interface LearningPath {
  id: string;
  title: string;
  difficulty: 'foundational' | 'intermediate' | 'advanced';
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

export interface TechnicalDiagramCallout {
  label: string;
  componentId?: string;
  description: string;
}

export interface TechnicalDiagramEntry {
  id: string;
  title: string;
  svgAssetPath: string;
  caption: string;
  interactiveCallouts?: TechnicalDiagramCallout[];
  relatedComponentIds: string[];
  citationIds: string[];
}

export interface HealthResponse {
  status: 'ok' | 'degraded';
  service: 'tianedge-api';
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
  kind: 'component' | 'insight' | 'glossary' | 'formula' | 'fundamental' | 'reference' | 'diagram';
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
  eventType:
    | 'section_viewed'
    | 'component_selected'
    | 'mode_changed'
    | 'journey_completed'
    | 'simulator_preset_run'
    | 'insight_opened';
  section: 'overview' | 'anatomy' | 'journey' | 'simulator' | 'insights' | 'library';
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
