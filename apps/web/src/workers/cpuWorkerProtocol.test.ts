import { describe, expect, it } from 'vitest';
import { CpuWorkerClient } from './CpuWorkerClient';
import type { WorkerPortLike, WorkerRequest, WorkerResponse } from './protocol';
import { DEFAULT_CPU_SNAPSHOT } from '../stores/useSimulatorStore';

class MockCpuWorker implements WorkerPortLike {
  onmessage: ((event: MessageEvent<WorkerResponse>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  received: WorkerRequest[] = [];
  terminated = false;

  postMessage(message: WorkerRequest): void {
    this.received.push(message);
    queueMicrotask(() => {
      if (!this.onmessage) return;
      if (message.type === 'INIT_WASM') {
        this.onmessage({
          data: {
            requestId: message.requestId,
            type: 'WASM_READY',
            snapshot: { ...DEFAULT_CPU_SNAPSHOT },
            maxCyclesPerRun: 10000,
          },
        } as MessageEvent<WorkerResponse>);
      } else if (message.type === 'LOAD_PROGRAM') {
        this.onmessage({
          data: {
            requestId: message.requestId,
            type: 'PROGRAM_LOADED',
            result: {
              ok: true,
              instructionCount: 1,
              snapshot: { ...DEFAULT_CPU_SNAPSHOT, status: 'ready' },
            },
          },
        } as MessageEvent<WorkerResponse>);
      } else if (message.type === 'STEP_STAGE') {
        this.onmessage({
          data: {
            requestId: message.requestId,
            type: 'SNAPSHOT',
            snapshot: {
              ...DEFAULT_CPU_SNAPSHOT,
              status: 'ready',
              stage: 'FETCH',
              stageActive: true,
              clockCycles: 1,
            },
          },
        } as MessageEvent<WorkerResponse>);
      }
    });
  }

  terminate(): void {
    this.terminated = true;
  }
}

describe('TC-INT-01: CpuWorkerClient RPC protocol', () => {
  it('routes monotonic requestIds and resolves typed snapshots without blocking main thread', async () => {
    const mockWorker = new MockCpuWorker();
    const client = new CpuWorkerClient(() => mockWorker);
    const updates: number[] = [];
    const unsubscribe = client.onSnapshot((snap) => {
      updates.push(snap.clockCycles);
    });

    const initSnap = await client.init();
    expect(initSnap.status).toBe('idle');

    const loadRes = await client.loadProgram('LOAD R1, 10');
    expect(loadRes.ok).toBe(true);
    expect(loadRes.instructionCount).toBe(1);

    const stepSnap = await client.stepStage();
    expect(stepSnap.clockCycles).toBe(1);
    expect(stepSnap.stage).toBe('FETCH');
    expect(updates).toEqual([0, 1]);

    expect(mockWorker.received.map((r) => r.requestId)).toEqual([1, 2, 3]);

    unsubscribe();
    client.dispose();
    expect(mockWorker.terminated).toBe(true);
  });

  it('surfaces WASM initialization failure explicitly without faking execution', async () => {
    const failingWorker: WorkerPortLike = {
      onmessage: null,
      onerror: null,
      postMessage(message) {
        queueMicrotask(() => {
          this.onmessage?.({
            data: {
              requestId: message.requestId,
              type: 'WASM_INIT_FAILED',
              message: 'Failed to instantiate tianedge_cpu_bg.wasm',
            },
          } as MessageEvent<WorkerResponse>);
        });
      },
      terminate() {},
    };

    const client = new CpuWorkerClient(() => failingWorker);
    await expect(client.init()).rejects.toThrow('Failed to instantiate tianedge_cpu_bg.wasm');
  });
});
