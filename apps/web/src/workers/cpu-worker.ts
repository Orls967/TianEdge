import initWasm, { WasmCpuHandle } from '../wasm/tianedge_cpu.js';
import type { CpuSnapshot, LoadProgramResult } from '../types/models';
import type { WorkerRequest, WorkerResponse } from './protocol';

const MIN_STREAM_INTERVAL_MS = 34; // <= 30 Hz snapshot emission ceiling
const FAST_RUN_BATCH_CYCLES = 250;

let handle: WasmCpuHandle | null = null;
let runTimer: ReturnType<typeof setTimeout> | null = null;
let isRunning = false;
let currentDelayMs = 200;
let runSessionCycles = 0;

function post(msg: WorkerResponse): void {
  self.postMessage(msg);
}

function clearRunLoop(): void {
  if (runTimer !== null) {
    clearTimeout(runTimer);
    runTimer = null;
  }
  isRunning = false;
}

function parseSnapshot(json: string): CpuSnapshot {
  return JSON.parse(json) as CpuSnapshot;
}

function requireHandle(requestId: number): WasmCpuHandle | null {
  if (!handle) {
    post({
      requestId,
      type: 'ERROR',
      code: 'WASM_NOT_INITIALIZED',
      message: 'CPU WebAssembly core is not initialized yet.',
    });
    return null;
  }
  return handle;
}

function scheduleNextRunTick(): void {
  if (!isRunning || !handle) return;

  const waitMs = Math.max(MIN_STREAM_INTERVAL_MS, currentDelayMs);
  runTimer = setTimeout(() => {
    if (!isRunning || !handle) return;

    const maxCycles = WasmCpuHandle.max_cycles_per_run();
    const isFastBatch = currentDelayMs < MIN_STREAM_INTERVAL_MS;
    const requestedBatch = isFastBatch ? FAST_RUN_BATCH_CYCLES : 1;
    const remainingBudget = Math.max(1, maxCycles - runSessionCycles);
    const steps = Math.min(requestedBatch, remainingBudget);

    const prevSnap = parseSnapshot(handle.get_snapshot());
    const nextSnap = parseSnapshot(
      steps === 1 ? handle.step_stage() : handle.step_many(steps),
    );
    const delta = Math.max(0, nextSnap.clockCycles - prevSnap.clockCycles);
    runSessionCycles += delta;

    if (
      runSessionCycles >= maxCycles &&
      nextSnap.status !== 'halted' &&
      nextSnap.status !== 'fault'
    ) {
      const pausedSnap = parseSnapshot(handle.trigger_watchdog());
      clearRunLoop();
      post({ requestId: 0, type: 'RUN_STOPPED', snapshot: pausedSnap });
      return;
    }

    if (
      nextSnap.status === 'halted' ||
      nextSnap.status === 'fault' ||
      nextSnap.status === 'paused' ||
      nextSnap.status === 'idle'
    ) {
      clearRunLoop();
      post({ requestId: 0, type: 'RUN_STOPPED', snapshot: nextSnap });
      return;
    }

    post({ requestId: 0, type: 'SNAPSHOT', snapshot: nextSnap, stream: true });
    scheduleNextRunTick();
  }, waitMs);
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const req = event.data;

  try {
    switch (req.type) {
      case 'INIT_WASM': {
        if (!handle) {
          await initWasm();
          handle = new WasmCpuHandle();
        }
        const snapshot = parseSnapshot(handle.get_snapshot());
        post({
          requestId: req.requestId,
          type: 'WASM_READY',
          snapshot,
          maxCyclesPerRun: WasmCpuHandle.max_cycles_per_run(),
        });
        return;
      }

      case 'LOAD_PROGRAM': {
        clearRunLoop();
        runSessionCycles = 0;
        const cpu = requireHandle(req.requestId);
        if (!cpu) return;
        const result = JSON.parse(cpu.load_program(req.source)) as LoadProgramResult;
        post({
          requestId: req.requestId,
          type: 'PROGRAM_LOADED',
          result,
        });
        return;
      }

      case 'STEP_STAGE': {
        clearRunLoop();
        const cpu = requireHandle(req.requestId);
        if (!cpu) return;
        const snapshot = parseSnapshot(cpu.step_stage());
        post({ requestId: req.requestId, type: 'SNAPSHOT', snapshot });
        return;
      }

      case 'STEP_INSTRUCTION': {
        clearRunLoop();
        const cpu = requireHandle(req.requestId);
        if (!cpu) return;
        const snapshot = parseSnapshot(cpu.step_instruction());
        post({ requestId: req.requestId, type: 'SNAPSHOT', snapshot });
        return;
      }

      case 'STEP_MANY': {
        clearRunLoop();
        const cpu = requireHandle(req.requestId);
        if (!cpu) return;
        const snapshot = parseSnapshot(cpu.step_many(req.maxSteps));
        post({ requestId: req.requestId, type: 'SNAPSHOT', snapshot });
        return;
      }

      case 'RUN': {
        const cpu = requireHandle(req.requestId);
        if (!cpu) return;
        clearRunLoop();
        currentDelayMs = Math.max(0, req.delayMs);
        runSessionCycles = 0;
        const current = parseSnapshot(cpu.get_snapshot());
        post({ requestId: req.requestId, type: 'SNAPSHOT', snapshot: current });
        if (current.status === 'halted' || current.status === 'fault' || current.status === 'idle') {
          post({ requestId: 0, type: 'RUN_STOPPED', snapshot: current });
          return;
        }
        isRunning = true;
        scheduleNextRunTick();
        return;
      }

      case 'PAUSE': {
        clearRunLoop();
        const cpu = requireHandle(req.requestId);
        if (!cpu) return;
        const snapshot = parseSnapshot(cpu.get_snapshot());
        post({ requestId: req.requestId, type: 'RUN_STOPPED', snapshot });
        return;
      }

      case 'RESET': {
        clearRunLoop();
        runSessionCycles = 0;
        const cpu = requireHandle(req.requestId);
        if (!cpu) return;
        const snapshot = parseSnapshot(cpu.reset());
        post({ requestId: req.requestId, type: 'SNAPSHOT', snapshot });
        return;
      }

      case 'SET_MEMORY_WORD': {
        clearRunLoop();
        const cpu = requireHandle(req.requestId);
        if (!cpu) return;
        const snapshot = parseSnapshot(cpu.set_memory_word(req.address, req.value));
        post({ requestId: req.requestId, type: 'SNAPSHOT', snapshot });
        return;
      }

      case 'GET_SNAPSHOT': {
        const cpu = requireHandle(req.requestId);
        if (!cpu) return;
        const snapshot = parseSnapshot(cpu.get_snapshot());
        post({ requestId: req.requestId, type: 'SNAPSHOT', snapshot });
        return;
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (req.type === 'INIT_WASM') {
      post({
        requestId: req.requestId,
        type: 'WASM_INIT_FAILED',
        message,
      });
    } else {
      post({
        requestId: req.requestId,
        type: 'ERROR',
        code: 'WORKER_RUNTIME_ERROR',
        message,
      });
    }
  }
};
