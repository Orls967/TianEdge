import { create } from 'zustand';
import { getPresetById } from '../constants/presets';
import type { CpuSnapshot, JourneyScenarioId, JourneyStageSpec } from '../types/models';
import { getSharedCpuClient } from '../workers/CpuWorkerClient';
import { DEFAULT_CPU_SNAPSHOT } from './useSimulatorStore';
import { useAppStore } from './useAppStore';

export interface JourneyScenarioMeta {
  id: JourneyScenarioId;
  title: string;
  presetId: string;
  preSteps: number; // cycles before featured instruction starts
  programSource: string;
  featuredInstruction: string;
  summary: string;
  stages: JourneyStageSpec[];
}

export const JOURNEY_SCENARIOS: Record<JourneyScenarioId, JourneyScenarioMeta> = {
  add_register_flow: {
    id: 'add_register_flow',
    title: 'Register-to-Register Addition (ADD R3, R1, R2)',
    presetId: 'canonical-addition',
    preSteps: 12, // Completes LOAD R1, 10 and LOAD R2, 20; stops ready for ADD R3, R1, R2 (Cycle 13..18)
    programSource: getPresetById('canonical-addition').source,
    featuredInstruction: 'ADD R3, R1, R2',
    summary:
      'Follow how an arithmetic instruction moves from Program Counter & L1 I-Cache through Decode, Register Read (R1=10, R2=20), ALU Execute (30), bypasses Data Memory cleanly, and writes R3 = 30 back to the Register File.',
    stages: [
      {
        stage: 'FETCH',
        stepNumber: 1,
        title: 'Stage 1 — Instruction Fetch (Cycle 13)',
        educationalObjective: 'Read the next machine instruction addressed by PC=2 into the Instruction Register.',
        technicalExplanation:
          'The Control Unit asserts memRead and irWrite while sending PC=2 along the internal address bus to L1 Instruction Cache. "ADD R3, R1, R2" latches into IR.',
        activeComponentIds: ['core-control-unit', 'mem-l1-icache', 'comm-internal-buses'],
        controlHighlightedIds: ['core-control-unit'],
        activePathEdges: ['pc_to_l1i', 'l1i_to_ir'],
        cameraPreset: { position: [1.4, 1.35, 1.4], target: [-0.62, 0.23, -0.5] },
        dataPayloadSummary: { PC: 2, IR: 'ADD R3, R1, R2', controlSignal: 'irWrite=1, memRead=1' },
        stageBypassed: false,
      },
      {
        stage: 'DECODE',
        stepNumber: 2,
        title: 'Stage 2 — Decode & Control Setup (Cycle 14)',
        educationalObjective: 'Identify opcode ADD, source operands R1/R2, destination R3, and arm ALU control.',
        technicalExplanation:
          'The Instruction Decoder parses the opcode bits inside IR and sends aluOp=ADD micro-control signals to the Control Unit sequencer.',
        activeComponentIds: ['core-control-unit', 'core-instruction-decoder'],
        controlHighlightedIds: ['core-control-unit', 'core-instruction-decoder'],
        activePathEdges: ['ir_to_decoder', 'decoder_to_cu'],
        cameraPreset: { position: [1.2, 1.2, 1.25], target: [-0.58, 0.23, -0.45] },
        dataPayloadSummary: { opcode: 'ADD', destination: 'R3', sources: 'R1, R2' },
        stageBypassed: false,
      },
      {
        stage: 'REGISTER_READ',
        stepNumber: 3,
        title: 'Stage 3 — Dual-Port Register Read (Cycle 15)',
        educationalObjective: 'Read operands R1 (10) and R2 (20) simultaneously from the Register File.',
        technicalExplanation:
          'Dual combinational read ports output R1=10 onto Operand A and R2=20 onto Operand B toward the ALU input latches without waiting for off-core memory.',
        activeComponentIds: ['core-registers', 'core-control-unit'],
        controlHighlightedIds: ['core-control-unit'],
        activePathEdges: ['regs_to_alu_opA', 'regs_to_alu_opB'],
        cameraPreset: { position: [1.15, 1.15, 1.15], target: [-0.4, 0.23, -0.46] },
        dataPayloadSummary: { operandA: 'R1 = 10', operandB: 'R2 = 20' },
        stageBypassed: false,
      },
      {
        stage: 'EXECUTE',
        stepNumber: 4,
        title: 'Stage 4 — ALU Execution & Flags Update (Cycle 16)',
        educationalObjective: 'Compute 10 + 20 = 30 inside the combinational adder and latch Z/N/C/V flags.',
        technicalExplanation:
          'The Arithmetic Logic Unit adds Operand A and Operand B into Result=30 and evaluates Zero=false, Negative=false, Carry=false, Overflow=false.',
        activeComponentIds: ['core-alu', 'core-execution-units', 'core-control-unit'],
        controlHighlightedIds: ['core-control-unit'],
        activePathEdges: ['alu_compute_internal', 'alu_to_flags'],
        cameraPreset: { position: [1.1, 1.1, 1.15], target: [-0.48, 0.23, -0.48] },
        dataPayloadSummary: { aluOp: 'ADD', calculation: '10 + 20 = 30', flags: 'Z:0 N:0 C:0 V:0' },
        stageBypassed: false,
      },
      {
        stage: 'MEMORY_ACCESS',
        stepNumber: 5,
        title: 'Stage 5 — Memory Access Bypassed (Cycle 17)',
        educationalObjective: 'Preserve uniform 6-stage deterministic timing while bypassing Data Memory.',
        technicalExplanation:
          'Because ADD is a register-to-register instruction, memRead and memWrite remain 0. The ALU result flows around L1 D-Cache cleanly so CPI stays predictable.',
        activeComponentIds: ['core-control-unit'],
        controlHighlightedIds: ['core-control-unit'],
        activePathEdges: ['alu_bypass_mem'],
        cameraPreset: { position: [1.3, 1.25, 1.3], target: [-0.36, 0.22, -0.36] },
        dataPayloadSummary: { memRead: 0, memWrite: 0, bypass: 'Data Memory skipped' },
        stageBypassed: true,
      },
      {
        stage: 'WRITE_BACK',
        stepNumber: 6,
        title: 'Stage 6 — Register Write-Back & PC Advance (Cycle 18)',
        educationalObjective: 'Commit Result=30 into R3 and increment PC from 2 to 3.',
        technicalExplanation:
          'The Control Unit asserts regWrite=1 and pcWrite=1 on the rising clock edge, storing 30 in R3 and advancing PC to fetch the next instruction.',
        activeComponentIds: ['core-registers', 'comm-internal-buses', 'core-control-unit'],
        controlHighlightedIds: ['core-control-unit'],
        activePathEdges: ['alu_to_wb_regs'],
        cameraPreset: { position: [1.15, 1.15, 1.15], target: [-0.35, 0.23, -0.45] },
        dataPayloadSummary: { regWrite: 1, destination: 'R3 <- 30', nextPC: 3 },
        stageBypassed: false,
      },
    ],
  },
  store_memory_flow: {
    id: 'store_memory_flow',
    title: 'Register-to-Memory Store (STORE R1, 100)',
    presetId: 'journey-store-memory',
    preSteps: 6, // Completes LOAD R1, 42; stops ready for STORE R1, 100 (Cycle 7..12)
    programSource: getPresetById('journey-store-memory').source,
    featuredInstruction: 'STORE R1, 100',
    summary:
      'Trace how STORE moves an operand through the Memory Data Register (MDR), computes MAR=100, and drives a real Memory Access write cycle into Data Memory.',
    stages: [
      {
        stage: 'FETCH',
        stepNumber: 1,
        title: 'Stage 1 — Instruction Fetch (Cycle 7)',
        educationalObjective: 'Fetch STORE R1, 100 from instruction address PC=1.',
        technicalExplanation:
          'PC=1 addresses L1 Instruction Cache and loads "STORE R1, 100" into the Instruction Register.',
        activeComponentIds: ['core-control-unit', 'mem-l1-icache', 'comm-internal-buses'],
        controlHighlightedIds: ['core-control-unit'],
        activePathEdges: ['pc_to_l1i', 'l1i_to_ir'],
        cameraPreset: { position: [1.4, 1.35, 1.4], target: [-0.62, 0.23, -0.5] },
        dataPayloadSummary: { PC: 1, IR: 'STORE R1, 100' },
        stageBypassed: false,
      },
      {
        stage: 'DECODE',
        stepNumber: 2,
        title: 'Stage 2 — Decode STORE Control Signals (Cycle 8)',
        educationalObjective: 'Decode memory store opcode, source register R1, and target address 100.',
        technicalExplanation:
          'The Instruction Decoder identifies STORE and configures the Load/Store path rather than an arithmetic write-back.',
        activeComponentIds: ['core-control-unit', 'core-instruction-decoder'],
        controlHighlightedIds: ['core-control-unit', 'core-instruction-decoder'],
        activePathEdges: ['ir_to_decoder', 'decoder_to_cu'],
        cameraPreset: { position: [1.2, 1.2, 1.25], target: [-0.58, 0.23, -0.45] },
        dataPayloadSummary: { opcode: 'STORE', sourceReg: 'R1', targetAddr: 100 },
        stageBypassed: false,
      },
      {
        stage: 'REGISTER_READ',
        stepNumber: 3,
        title: 'Stage 3 — Read R1 into MDR (Cycle 9)',
        educationalObjective: 'Fetch R1=42 from the Register File and latch it into the Memory Data Register.',
        technicalExplanation:
          'Register R1 drives 42 onto the internal data bus, populating MDR=42 ready for the Load/Store Unit.',
        activeComponentIds: ['core-registers', 'core-control-unit'],
        controlHighlightedIds: ['core-control-unit'],
        activePathEdges: ['regs_to_alu_opA', 'lsu_to_l1d'],
        cameraPreset: { position: [1.2, 1.2, 1.25], target: [-0.28, 0.23, -0.35] },
        dataPayloadSummary: { R1: 42, MDR: 42 },
        stageBypassed: false,
      },
      {
        stage: 'EXECUTE',
        stepNumber: 4,
        title: 'Stage 4 — Effective Address into MAR (Cycle 10)',
        educationalObjective: 'Load target word address 100 into the Memory Address Register (MAR).',
        technicalExplanation:
          'The ALU / Load-Store address generator validates effective address 100 and latches MAR=100.',
        activeComponentIds: ['core-alu', 'core-control-unit'],
        controlHighlightedIds: ['core-control-unit'],
        activePathEdges: ['lsu_to_l1d'],
        cameraPreset: { position: [1.3, 1.25, 1.35], target: [-0.35, 0.23, -0.35] },
        dataPayloadSummary: { MAR: 100, MDR: 42 },
        stageBypassed: false,
      },
      {
        stage: 'MEMORY_ACCESS',
        stepNumber: 5,
        title: 'Stage 5 — Commit Data Memory Write (Cycle 11)',
        educationalObjective: 'Write MDR (42) into MEM[100] via L1 D-Cache & Memory Controller.',
        technicalExplanation:
          'memWrite=1 activates L1 D-Cache, the Load/Store Unit, Memory Controller, and Main Memory Interface, storing 42 at word address 100.',
        activeComponentIds: [
          'mem-l1-dcache',
          'core-load-store-unit',
          'die-memory-controller',
          'mem-main-interface',
          'comm-memory-interface',
        ],
        controlHighlightedIds: ['core-control-unit'],
        activePathEdges: ['lsu_to_l1d', 'l1d_to_mem_if'],
        cameraPreset: { position: [1.7, 1.45, 2.0], target: [-0.05, 0.2, 0.35] },
        dataPayloadSummary: { memWrite: 1, address: 'MEM[100]', storedValue: 42 },
        stageBypassed: false,
      },
      {
        stage: 'WRITE_BACK',
        stepNumber: 6,
        title: 'Stage 6 — Advance PC Without Register Write (Cycle 12)',
        educationalObjective: 'Update PC from 1 to 2 while leaving the Register File unmodified.',
        technicalExplanation:
          'Because STORE writes to memory rather than a CPU register, regWrite remains 0 and pcWrite increments PC to 2.',
        activeComponentIds: ['mem-l1-dcache', 'core-control-unit', 'comm-memory-interface'],
        controlHighlightedIds: ['core-control-unit'],
        activePathEdges: ['l1d_to_mem_if'],
        cameraPreset: { position: [1.5, 1.35, 1.7], target: [-0.15, 0.22, 0.05] },
        dataPayloadSummary: { regWrite: 0, pcWrite: 1, nextPC: 2, mem100: 42 },
        stageBypassed: false,
      },
    ],
  },
};

interface JourneyState {
  scenarioId: JourneyScenarioId;
  currentStepIndex: number; // 0..5 corresponding to stages 1..6
  isAutoPlaying: boolean;
  autoCameraEnabled: boolean;
  snapshot: CpuSnapshot;
  loading: boolean;
  error: string | null;

  loadScenario: (scenarioId: JourneyScenarioId, targetStepIndex?: number) => Promise<void>;
  goToStep: (stepIndex: number) => Promise<void>;
  nextStep: () => Promise<void>;
  prevStep: () => Promise<void>;
  setAutoPlaying: (playing: boolean) => void;
  setAutoCameraEnabled: (enabled: boolean) => void;
}

export const useJourneyStore = create<JourneyState>((set, get) => ({
  scenarioId: 'add_register_flow',
  currentStepIndex: 0,
  isAutoPlaying: false,
  autoCameraEnabled: true,
  snapshot: DEFAULT_CPU_SNAPSHOT,
  loading: false,
  error: null,

  loadScenario: async (scenarioId, targetStepIndex = 0) => {
    const scenario = JOURNEY_SCENARIOS[scenarioId];
    const clampedStep = Math.max(0, Math.min(5, targetStepIndex));
    set({
      scenarioId,
      currentStepIndex: clampedStep,
      isAutoPlaying: false,
      loading: true,
      error: null,
    });
    const client = getSharedCpuClient();
    const appStore = useAppStore.getState();
    try {
      await client.init();
      appStore.setWasmStatus('ready', null);
      await client.loadProgram(scenario.programSource);
      const totalCycles = scenario.preSteps + clampedStep + 1;
      const snapshot = await client.stepMany(totalCycles);
      set({ snapshot, loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to step Instruction Journey WASM engine.';
      appStore.setWasmStatus('error', message);
      set({ loading: false, error: message });
    }
  },

  goToStep: async (stepIndex) => {
    const clamped = Math.max(0, Math.min(5, stepIndex));
    const current = get().currentStepIndex;
    const scenarioId = get().scenarioId;
    if (clamped === current + 1 && !get().loading) {
      try {
        const snapshot = await getSharedCpuClient().stepStage();
        set({ currentStepIndex: clamped, snapshot });
        return;
      } catch {
        // fallback to full seek
      }
    }
    await get().loadScenario(scenarioId, clamped);
  },

  nextStep: async () => {
    const current = get().currentStepIndex;
    if (current >= 5) {
      set({ isAutoPlaying: false });
      return;
    }
    await get().goToStep(current + 1);
  },

  prevStep: async () => {
    const current = get().currentStepIndex;
    if (current <= 0) return;
    await get().goToStep(current - 1);
  },

  setAutoPlaying: (isAutoPlaying) => set({ isAutoPlaying }),
  setAutoCameraEnabled: (autoCameraEnabled) => set({ autoCameraEnabled }),
}));
