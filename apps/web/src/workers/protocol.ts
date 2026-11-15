import type { CpuSnapshot, LoadProgramResult } from '../types/models';

export type WorkerRequestPayload =
  | { type: 'INIT_WASM' }
  | { type: 'LOAD_PROGRAM'; source: string }
  | { type: 'STEP_STAGE' }
  | { type: 'STEP_INSTRUCTION' }
  | { type: 'STEP_MANY'; maxSteps: number }
  | { type: 'RUN'; delayMs: number }
  | { type: 'PAUSE' }
  | { type: 'RESET' }
  | { type: 'SET_MEMORY_WORD'; address: number; value: number }
  | { type: 'GET_SNAPSHOT' };

export type WorkerRequest = WorkerRequestPayload & {
  requestId: number;
};

export type WorkerResponsePayload =
  | { type: 'WASM_READY'; snapshot: CpuSnapshot; maxCyclesPerRun: number }
  | { type: 'WASM_INIT_FAILED'; message: string }
  | { type: 'PROGRAM_LOADED'; result: LoadProgramResult }
  | { type: 'SNAPSHOT'; snapshot: CpuSnapshot; stream?: boolean }
  | { type: 'RUN_STOPPED'; snapshot: CpuSnapshot }
  | { type: 'ERROR'; code: string; message: string };

export type WorkerResponse = WorkerResponsePayload & {
  requestId: number;
};

export interface WorkerPortLike {
  postMessage: (message: WorkerRequest) => void;
  terminate: () => void;
  onmessage: ((event: MessageEvent<WorkerResponse>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
}
