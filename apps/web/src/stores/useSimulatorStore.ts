import { create } from 'zustand';
import { SIMULATOR_PRESETS, getPresetById } from '../constants/presets';
import type { CpuSnapshot, ParseError } from '../types/models';
import { getSharedCpuClient } from '../workers/CpuWorkerClient';
import { useAppStore } from './useAppStore';

export const DEFAULT_CPU_SNAPSHOT: CpuSnapshot = {
  status: 'idle',
  stage: 'FETCH',
  stageActive: false,
  pc: 0,
  currentInstructionLine: null,
  ir: null,
  mar: null,
  mdr: null,
  registers: [0, 0, 0, 0, 0, 0, 0, 0],
  changedRegisters: [],
  flags: { zero: false, negative: false, carry: false, overflow: false },
  alu: { operation: 'NONE', operandA: null, operandB: null, result: null },
  controlSignals: {
    pcWrite: false,
    irWrite: false,
    regWrite: false,
    memRead: false,
    memWrite: false,
    aluOp: null,
    branchTaken: false,
  },
  clockCycles: 0,
  executedInstructions: 0,
  nonZeroMemory: [],
  lastModifiedMemoryAddr: null,
  activeComponentIds: [],
  activePaths: [],
  fault: null,
};

interface SimulatorState {
  selectedPresetId: string;
  sourceCode: string;
  snapshot: CpuSnapshot;
  parseErrors: ParseError[];
  isRunning: boolean;
  speedMs: number;
  initialized: boolean;
  initError: string | null;
  unsubscribeSnapshot: (() => void) | null;

  initialize: () => Promise<void>;
  setSourceCode: (source: string) => void;
  setSpeedMs: (delayMs: number) => void;
  selectPreset: (presetId: string) => Promise<void>;
  assembleAndLoad: (source?: string) => Promise<boolean>;
  stepStage: () => Promise<void>;
  stepInstruction: () => Promise<void>;
  run: () => Promise<void>;
  pause: () => Promise<void>;
  reset: () => Promise<void>;
  setMemoryWord: (address: number, value: number) => Promise<void>;
  handoffFromJourney: (source: string, presetId?: string) => Promise<void>;
}

const initialPreset = SIMULATOR_PRESETS[0];

export const useSimulatorStore = create<SimulatorState>((set, get) => ({
  selectedPresetId: initialPreset.id,
  sourceCode: initialPreset.source,
  snapshot: DEFAULT_CPU_SNAPSHOT,
  parseErrors: [],
  isRunning: false,
  speedMs: 220,
  initialized: false,
  initError: null,
  unsubscribeSnapshot: null,

  initialize: async () => {
    if (get().initialized) return;
    const client = getSharedCpuClient();
    const appStore = useAppStore.getState();
    appStore.setWasmStatus('initializing');

    const prevUnsub = get().unsubscribeSnapshot;
    if (prevUnsub) prevUnsub();

    const unsub = client.onSnapshot((snapshot, running) => {
      set({ snapshot, isRunning: running });
    });
    set({ unsubscribeSnapshot: unsub });

    try {
      await client.init();
      appStore.setWasmStatus('ready', null);
      set({ initialized: true, initError: null });
      await get().assembleAndLoad(get().sourceCode);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to initialize WASM CPU engine.';
      appStore.setWasmStatus('error', msg);
      set({ initialized: false, initError: msg });
    }
  },

  setSourceCode: (sourceCode) => set({ sourceCode }),
  setSpeedMs: (speedMs) => set({ speedMs }),

  selectPreset: async (presetId) => {
    const preset = getPresetById(presetId);
    set({ selectedPresetId: preset.id, sourceCode: preset.source, parseErrors: [] });
    await get().assembleAndLoad(preset.source);
  },

  assembleAndLoad: async (overrideSource) => {
    const source = overrideSource ?? get().sourceCode;
    const client = getSharedCpuClient();
    const result = await client.loadProgram(source);
    if (result.ok && result.snapshot) {
      set({
        snapshot: result.snapshot,
        parseErrors: [],
        isRunning: false,
      });
      return true;
    }
    set({
      parseErrors: result.errors ?? [],
      isRunning: false,
    });
    return false;
  },

  stepStage: async () => {
    await get().initialize();
    const snapshot = await getSharedCpuClient().stepStage();
    set({ snapshot, isRunning: false });
  },

  stepInstruction: async () => {
    await get().initialize();
    const snapshot = await getSharedCpuClient().stepInstruction();
    set({ snapshot, isRunning: false });
  },

  run: async () => {
    await get().initialize();
    if (get().parseErrors.length > 0) return;
    set({ isRunning: true });
    await getSharedCpuClient().run(get().speedMs);
  },

  pause: async () => {
    const snapshot = await getSharedCpuClient().pause();
    set({ snapshot, isRunning: false });
  },

  reset: async () => {
    await get().initialize();
    const snapshot = await getSharedCpuClient().reset();
    set({ snapshot, isRunning: false, parseErrors: [] });
  },

  setMemoryWord: async (address, value) => {
    await get().initialize();
    const snapshot = await getSharedCpuClient().setMemoryWord(address, value);
    set({ snapshot });
  },

  handoffFromJourney: async (source, presetId) => {
    set({
      sourceCode: source,
      selectedPresetId: presetId ?? 'custom',
      parseErrors: [],
    });
    await get().initialize();
    await get().assembleAndLoad(source);
  },
}));
