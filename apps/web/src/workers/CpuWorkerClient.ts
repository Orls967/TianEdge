import type { CpuSnapshot, LoadProgramResult } from '../types/models';
import type {
  WorkerPortLike,
  WorkerRequest,
  WorkerRequestPayload,
  WorkerResponse,
} from './protocol';

interface PendingCall {
  resolve: (res: WorkerResponse) => void;
  reject: (err: Error) => void;
}

export type WorkerFactory = () => WorkerPortLike;

export class CpuWorkerClient {
  private worker: WorkerPortLike | null = null;
  private factory: WorkerFactory;
  private nextRequestId = 1;
  private pending = new Map<number, PendingCall>();
  private snapshotListeners = new Set<(snapshot: CpuSnapshot, running: boolean) => void>();
  private initPromise: Promise<CpuSnapshot> | null = null;

  constructor(factory?: WorkerFactory) {
    this.factory =
      factory ??
      (() =>
        new Worker(new URL('./cpu-worker.ts', import.meta.url), {
          type: 'module',
        }));
  }

  private ensureWorker(): WorkerPortLike {
    if (this.worker) return this.worker;
    const worker = this.factory();
    worker.onmessage = (event) => {
      const msg = event.data;
      if (!msg) return;

      if (msg.requestId === 0) {
        if (msg.type === 'SNAPSHOT') {
          this.emitSnapshot(msg.snapshot, true);
        } else if (msg.type === 'RUN_STOPPED') {
          this.emitSnapshot(msg.snapshot, false);
        }
        return;
      }

      const pendingCall = this.pending.get(msg.requestId);
      if (pendingCall) {
        this.pending.delete(msg.requestId);
        pendingCall.resolve(msg);
      }
    };
    worker.onerror = (event) => {
      const err = new Error(event.message || 'CPU Web Worker error');
      for (const [, call] of this.pending) {
        call.reject(err);
      }
      this.pending.clear();
    };
    this.worker = worker;
    return worker;
  }

  private emitSnapshot(snapshot: CpuSnapshot, running: boolean): void {
    for (const listener of this.snapshotListeners) {
      listener(snapshot, running);
    }
  }

  private send(payload: WorkerRequestPayload): Promise<WorkerResponse> {
    const worker = this.ensureWorker();
    const requestId = this.nextRequestId++;
    const req: WorkerRequest = { ...payload, requestId };
    return new Promise<WorkerResponse>((resolve, reject) => {
      this.pending.set(requestId, { resolve, reject });
      worker.postMessage(req);
    });
  }

  onSnapshot(listener: (snapshot: CpuSnapshot, running: boolean) => void): () => void {
    this.snapshotListeners.add(listener);
    return () => {
      this.snapshotListeners.delete(listener);
    };
  }

  async init(): Promise<CpuSnapshot> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = (async () => {
      const res = await this.send({ type: 'INIT_WASM' });
      if (res.type === 'WASM_READY') {
        return res.snapshot;
      }
      if (res.type === 'WASM_INIT_FAILED' || res.type === 'ERROR') {
        this.initPromise = null;
        throw new Error(res.message);
      }
      throw new Error(`Unexpected response to INIT_WASM: ${res.type}`);
    })();
    return this.initPromise;
  }

  async loadProgram(source: string): Promise<LoadProgramResult> {
    await this.init();
    const res = await this.send({ type: 'LOAD_PROGRAM', source });
    if (res.type === 'PROGRAM_LOADED') {
      if (res.result.snapshot) {
        this.emitSnapshot(res.result.snapshot, false);
      }
      return res.result;
    }
    if (res.type === 'ERROR') {
      throw new Error(res.message);
    }
    throw new Error(`Unexpected response to LOAD_PROGRAM: ${res.type}`);
  }

  async stepStage(): Promise<CpuSnapshot> {
    await this.init();
    const res = await this.send({ type: 'STEP_STAGE' });
    if (res.type === 'SNAPSHOT') {
      this.emitSnapshot(res.snapshot, false);
      return res.snapshot;
    }
    if (res.type === 'ERROR') throw new Error(res.message);
    throw new Error(`Unexpected response to STEP_STAGE: ${res.type}`);
  }

  async stepInstruction(): Promise<CpuSnapshot> {
    await this.init();
    const res = await this.send({ type: 'STEP_INSTRUCTION' });
    if (res.type === 'SNAPSHOT') {
      this.emitSnapshot(res.snapshot, false);
      return res.snapshot;
    }
    if (res.type === 'ERROR') throw new Error(res.message);
    throw new Error(`Unexpected response to STEP_INSTRUCTION: ${res.type}`);
  }

  async stepMany(maxSteps: number): Promise<CpuSnapshot> {
    await this.init();
    const res = await this.send({ type: 'STEP_MANY', maxSteps });
    if (res.type === 'SNAPSHOT') {
      this.emitSnapshot(res.snapshot, false);
      return res.snapshot;
    }
    if (res.type === 'ERROR') throw new Error(res.message);
    throw new Error(`Unexpected response to STEP_MANY: ${res.type}`);
  }

  async run(delayMs: number): Promise<CpuSnapshot> {
    await this.init();
    const res = await this.send({ type: 'RUN', delayMs });
    if (res.type === 'SNAPSHOT') {
      this.emitSnapshot(res.snapshot, true);
      return res.snapshot;
    }
    if (res.type === 'ERROR') throw new Error(res.message);
    throw new Error(`Unexpected response to RUN: ${res.type}`);
  }

  async pause(): Promise<CpuSnapshot> {
    await this.init();
    const res = await this.send({ type: 'PAUSE' });
    if (res.type === 'RUN_STOPPED' || res.type === 'SNAPSHOT') {
      this.emitSnapshot(res.snapshot, false);
      return res.snapshot;
    }
    if (res.type === 'ERROR') throw new Error(res.message);
    throw new Error(`Unexpected response to PAUSE: ${res.type}`);
  }

  async reset(): Promise<CpuSnapshot> {
    await this.init();
    const res = await this.send({ type: 'RESET' });
    if (res.type === 'SNAPSHOT') {
      this.emitSnapshot(res.snapshot, false);
      return res.snapshot;
    }
    if (res.type === 'ERROR') throw new Error(res.message);
    throw new Error(`Unexpected response to RESET: ${res.type}`);
  }

  async setMemoryWord(address: number, value: number): Promise<CpuSnapshot> {
    await this.init();
    const res = await this.send({ type: 'SET_MEMORY_WORD', address, value });
    if (res.type === 'SNAPSHOT') {
      this.emitSnapshot(res.snapshot, false);
      return res.snapshot;
    }
    if (res.type === 'ERROR') throw new Error(res.message);
    throw new Error(`Unexpected response to SET_MEMORY_WORD: ${res.type}`);
  }

  dispose(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.initPromise = null;
    this.pending.clear();
  }
}

let sharedClient: CpuWorkerClient | null = null;

export function getSharedCpuClient(): CpuWorkerClient {
  if (!sharedClient) {
    sharedClient = new CpuWorkerClient();
  }
  return sharedClient;
}
