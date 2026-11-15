import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Pause, Play, RotateCcw, SkipForward, StepForward } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Panel } from '../components/ui/Panel';
import { ErrorStateView } from '../components/ui/StateViews';
import { SIMULATOR_PRESETS, getPresetById } from '../constants/presets';
import { trackAnalyticsEvent } from '../content/analyticsClient';
import { useContentStore } from '../content/useContentStore';
import { CpuSceneCanvas } from '../scene/CpuSceneCanvas';
import { useSimulatorStore } from '../stores/useSimulatorStore';
import type { ExecutionStage, VisualizationMode } from '../types/models';

const STAGES: ExecutionStage[] = [
  'FETCH',
  'DECODE',
  'REGISTER_READ',
  'EXECUTE',
  'MEMORY_ACCESS',
  'WRITE_BACK',
];

const STAGE_LABELS: Record<ExecutionStage, string> = {
  FETCH: '1. Fetch',
  DECODE: '2. Decode',
  REGISTER_READ: '3. Reg Read',
  EXECUTE: '4. Execute',
  MEMORY_ACCESS: '5. Mem Access',
  WRITE_BACK: '6. Write Back',
};

function formatHex32(val: number): string {
  return '0x' + (val >>> 0).toString(16).toUpperCase().padStart(8, '0');
}

export function CpuSimulatorPage() {
  const { bundle, initContent } = useContentStore();
  const {
    selectedPresetId,
    sourceCode,
    snapshot,
    parseErrors,
    isRunning,
    speedMs,
    initError,
    initialize,
    setSourceCode,
    setSpeedMs,
    selectPreset,
    assembleAndLoad,
    stepStage,
    stepInstruction,
    run,
    pause,
    reset,
    setMemoryWord,
  } = useSimulatorStore();

  const [sceneMode, setSceneMode] = useState<VisualizationMode>('signal_flow');
  const [memFilter, setMemFilter] = useState<'nonzero' | 'range'>('nonzero');
  const [memStartAddr, setMemStartAddr] = useState(0);
  const [editAddr, setEditAddr] = useState('100');
  const [editVal, setEditVal] = useState('0');
  const [assembleBanner, setAssembleBanner] = useState<string | null>(null);

  useEffect(() => {
    void initContent();
    void initialize();
    trackAnalyticsEvent('section_viewed', 'simulator', selectedPresetId);
  }, [initContent, initialize, selectedPresetId]);

  // Keyboard shortcuts for fast lab stepping
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inEditable = target?.tagName === 'TEXTAREA' || target?.tagName === 'INPUT' || target?.tagName === 'SELECT';
      if (inEditable) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (isRunning) void pause();
        else void run();
      } else if (e.key === 'F10' || (e.shiftKey && e.key === 'ArrowRight')) {
        e.preventDefault();
        void stepInstruction();
      } else if (e.shiftKey && e.key === 'ArrowDown') {
        e.preventDefault();
        void stepStage();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isRunning, pause, run, stepInstruction, stepStage]);

  const activePreset = useMemo(() => getPresetById(selectedPresetId), [selectedPresetId]);
  const lineList = useMemo(() => sourceCode.split('\n'), [sourceCode]);

  const nonZeroMap = useMemo(() => {
    const map = new Map<number, number>();
    for (const cell of snapshot.nonZeroMemory) {
      map.set(cell.address, cell.value);
    }
    return map;
  }, [snapshot.nonZeroMemory]);

  const visibleMemoryRows = useMemo(() => {
    if (memFilter === 'nonzero') {
      return snapshot.nonZeroMemory;
    }
    const start = Math.max(0, Math.min(240, memStartAddr));
    return Array.from({ length: 16 }, (_, offset) => {
      const address = start + offset;
      return { address, value: nonZeroMap.get(address) ?? 0 };
    });
  }, [memFilter, memStartAddr, nonZeroMap, snapshot.nonZeroMemory]);

  const handleAssemble = async () => {
    const ok = await assembleAndLoad();
    setAssembleBanner(ok ? 'Program assembled & loaded at PC = 0.' : null);
  };

  const handleRunToggle = async () => {
    if (isRunning) {
      await pause();
    } else {
      trackAnalyticsEvent('simulator_preset_run', 'simulator', selectedPresetId);
      await run();
    }
  };

  const handleWriteMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    const addr = Number.parseInt(editAddr, 10);
    const val = Number.parseInt(editVal, 10);
    if (Number.isNaN(addr) || Number.isNaN(val)) return;
    await setMemoryWord(addr, val);
  };

  if (initError) {
    return (
      <div className="te-page-container">
        <ErrorStateView
          title="WebAssembly CPU Core Initialization Failed"
          message={initError}
          onRetry={() => void initialize()}
        />
      </div>
    );
  }

  const changedSet = new Set(snapshot.changedRegisters);

  return (
    <div className="te-simulator-shell">
      {/* Left Pane: Presets + Assembly Editor + Parse Errors */}
      <Panel
        className="te-scroll-pane"
        style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}
        ariaLabel="TIAN-ISA v1 Program Editor and Controls"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '1.05rem' }}>TIAN-ISA v1 CPU Simulator</h1>
          <Badge tone={snapshot.status === 'fault' ? 'error' : snapshot.status === 'halted' ? 'success' : 'cyan'}>
            {snapshot.status.toUpperCase()}
          </Badge>
        </div>

        {/* Preset Selector */}
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            PRESET WORKBENCH PROGRAMS
          </span>
          <select
            aria-label="Select preset program"
            value={selectedPresetId}
            onChange={(e) => {
              setAssembleBanner(null);
              void selectPreset(e.target.value);
            }}
            style={{
              padding: '7px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-canvas)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.84rem',
            }}
          >
            {SIMULATOR_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
            {selectedPresetId === 'custom' && <option value="custom">Custom / Journey Program</option>}
          </select>
        </label>

        <p style={{ fontSize: '0.79rem', color: 'var(--text-secondary)' }}>
          {activePreset.description}{' '}
          <span className="mono" style={{ color: '#6EE7B7' }}>
            Expected: {activePreset.expectedOutcome}
          </span>
        </p>

        {/* Transport Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          <button
            type="button"
            className="te-btn te-btn-sm te-btn-primary"
            onClick={() => void handleAssemble()}
          >
            Assemble &amp; Load
          </button>
          <button
            type="button"
            className="te-btn te-btn-sm"
            onClick={() => void stepStage()}
            disabled={isRunning || snapshot.status === 'halted' || snapshot.status === 'fault'}
            title="Advance 1 clock cycle (Shift+Down)"
          >
            <StepForward size={14} aria-hidden="true" />
            <span>Step Stage</span>
          </button>
          <button
            type="button"
            className="te-btn te-btn-sm"
            onClick={() => void stepInstruction()}
            disabled={isRunning || snapshot.status === 'halted' || snapshot.status === 'fault'}
            title="Complete 1 instruction (F10)"
          >
            <SkipForward size={14} aria-hidden="true" />
            <span>Step Instr</span>
          </button>
          <button
            type="button"
            className={`te-btn te-btn-sm ${isRunning ? 'te-btn-gold' : 'te-btn-primary'}`}
            onClick={() => void handleRunToggle()}
            disabled={!isRunning && (snapshot.status === 'halted' || snapshot.status === 'fault')}
          >
            {isRunning ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
            <span>{isRunning ? 'Pause' : 'Run'}</span>
          </button>
          <button
            type="button"
            className="te-btn te-btn-sm"
            onClick={() => {
              setAssembleBanner(null);
              void reset();
            }}
          >
            <RotateCcw size={13} aria-hidden="true" />
            <span>Reset</span>
          </button>
        </div>

        {/* Speed Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label htmlFor="sim-speed-slider" className="mono" style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
            Cycle Delay: {speedMs === 0 ? 'Fast (Batch)' : `${speedMs} ms`}
          </label>
          <input
            id="sim-speed-slider"
            type="range"
            min={0}
            max={600}
            step={20}
            value={speedMs}
            onChange={(e) => setSpeedMs(Number(e.target.value))}
            style={{ flex: 1 }}
          />
        </div>

        {/* Fault / Watchdog / Assemble Banner */}
        {snapshot.fault && (
          <div
            role="alert"
            style={{
              padding: '10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(239, 68, 68, 0.55)',
              background: 'rgba(239, 68, 68, 0.14)',
              fontSize: '0.8rem',
              color: '#FCA5A5',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
              <AlertTriangle size={15} aria-hidden="true" />
              <span>
                {snapshot.fault.code}
                {snapshot.fault.line ? ` (Line ${snapshot.fault.line})` : ''}
              </span>
            </div>
            <span>{snapshot.fault.message}</span>
          </div>
        )}

        {assembleBanner && parseErrors.length === 0 && (
          <div
            style={{
              padding: '7px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(16, 185, 129, 0.45)',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#6EE7B7',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <CheckCircle2 size={14} aria-hidden="true" />
            <span>{assembleBanner}</span>
          </div>
        )}

        {parseErrors.length > 0 && (
          <div
            role="alert"
            style={{
              padding: '10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(239, 68, 68, 0.55)',
              background: 'rgba(239, 68, 68, 0.12)',
              fontSize: '0.79rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <strong style={{ color: '#FCA5A5' }}>Assembler Errors ({parseErrors.length})</strong>
            {parseErrors.map((err, i) => (
              <div key={i} className="mono" style={{ fontSize: '0.75rem', color: '#FECACA' }}>
                Line {err.line} [{err.code}]: {err.message}
              </div>
            ))}
          </div>
        )}

        {/* Active Line Gutter Indicator + Code Editor */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '38px minmax(0, 1fr)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            background: '#080b12',
            overflow: 'hidden',
          }}
        >
          <div
            className="mono"
            aria-hidden="true"
            style={{
              padding: '8px 4px',
              background: '#0b101b',
              borderRight: '1px solid var(--border-subtle)',
              fontSize: '0.76rem',
              lineHeight: 1.55,
              textAlign: 'right',
              userSelect: 'none',
            }}
          >
            {lineList.map((_, idx) => {
              const lineNo = idx + 1;
              const active = snapshot.currentInstructionLine === lineNo;
              const hasErr = parseErrors.some((pe) => pe.line === lineNo);
              return (
                <div
                  key={lineNo}
                  style={{
                    paddingRight: '6px',
                    color: hasErr ? '#F87171' : active ? '#00E5FF' : '#64748B',
                    fontWeight: active ? 700 : 400,
                    background: active ? 'rgba(0,229,255,0.14)' : 'transparent',
                  }}
                >
                  {lineNo}
                </div>
              );
            })}
          </div>
          <textarea
            aria-label="TIAN-ISA v1 Assembly Source Editor"
            value={sourceCode}
            onChange={(e) => {
              setAssembleBanner(null);
              setSourceCode(e.target.value);
            }}
            spellCheck={false}
            rows={Math.max(12, lineList.length + 1)}
            className="mono"
            style={{
              width: '100%',
              padding: '8px 10px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.78rem',
              lineHeight: 1.55,
              resize: 'vertical',
              outline: 'none',
            }}
          />
        </div>
      </Panel>

      {/* Center Pane: 6-Stage Ribbon + Synchronized 3D Processor Stage + ALU/Control Telemetry */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '540px' }}>
        <Panel style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              SEQUENTIAL 6-STAGE EXECUTION PIPELINE (CPI = 6)
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className={`te-btn te-btn-sm ${sceneMode === 'signal_flow' ? 'te-btn-primary' : ''}`}
                onClick={() => setSceneMode('signal_flow')}
              >
                Signal Flow
              </button>
              <button
                type="button"
                className={`te-btn te-btn-sm ${sceneMode === 'internal_architecture' ? 'te-btn-primary' : ''}`}
                onClick={() => setSceneMode('internal_architecture')}
              >
                Die Architecture
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: '6px' }}>
            {STAGES.map((stage) => {
              const active = snapshot.stageActive && snapshot.stage === stage;
              return (
                <div
                  key={stage}
                  data-stage={stage}
                  data-active={active}
                  className="mono"
                  style={{
                    padding: '7px 6px',
                    borderRadius: 'var(--radius-sm)',
                    textAlign: 'center',
                    fontSize: '0.72rem',
                    border: active
                      ? '1px solid var(--accent-primary)'
                      : '1px solid var(--border-subtle)',
                    background: active ? 'rgba(0, 229, 255, 0.16)' : 'rgba(15, 23, 42, 0.65)',
                    color: active ? '#E0FAFF' : 'var(--text-muted)',
                    fontWeight: active ? 700 : 500,
                  }}
                >
                  {STAGE_LABELS[stage]}
                </div>
              );
            })}
          </div>
        </Panel>

        <div style={{ flex: 1, minHeight: '340px' }}>
          <CpuSceneCanvas
            components={bundle?.components ?? []}
            activeComponentIds={snapshot.activeComponentIds}
            activePaths={snapshot.activePaths}
            modeOverride={sceneMode}
          />
        </div>

        {/* ALU & Control Signals Live Strip */}
        <Panel style={{ padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
          <div>
            <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              ACTIVE INSTRUCTION (IR)
            </div>
            <div className="mono" style={{ fontSize: '0.86rem', color: 'var(--accent-primary)' }}>
              {snapshot.ir ?? '—'}
            </div>
          </div>
          <div>
            <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              ALU DATAPATH
            </div>
            <div className="mono" style={{ fontSize: '0.82rem' }}>
              {snapshot.alu.operation} ({snapshot.alu.operandA ?? '—'},{' '}
              {snapshot.alu.operandB ?? '—'}) =&gt;{' '}
              <strong style={{ color: 'var(--accent-warm-gold)' }}>
                {snapshot.alu.result ?? '—'}
              </strong>
            </div>
          </div>
          <div>
            <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              CONTROL SIGNALS
            </div>
            <div className="mono" style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              irW:{Number(snapshot.controlSignals.irWrite)} regW:
              {Number(snapshot.controlSignals.regWrite)} memR:
              {Number(snapshot.controlSignals.memRead)} memW:
              {Number(snapshot.controlSignals.memWrite)} br:
              {Number(snapshot.controlSignals.branchTaken)}
            </div>
          </div>
        </Panel>
      </div>

      {/* Right Pane: Registers, Flags, Cycles & Data Memory */}
      <Panel
        className="te-scroll-pane"
        style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}
        ariaLabel="CPU Telemetry: Registers, Flags, and Data Memory"
      >
        {/* Counters & Special Registers */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h2 style={{ fontSize: '0.9rem', color: 'var(--accent-primary)' }}>
            Cycle &amp; Control Registers
          </h2>
          <div className="mono" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', fontSize: '0.78rem' }}>
            <div className="panel" style={{ padding: '7px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>CYCLES</div>
              <div data-testid="sim-clock-cycles">{snapshot.clockCycles}</div>
            </div>
            <div className="panel" style={{ padding: '7px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>INSTR</div>
              <div data-testid="sim-executed-instr">{snapshot.executedInstructions}</div>
            </div>
            <div className="panel" style={{ padding: '7px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>PC</div>
              <div>{snapshot.pc}</div>
            </div>
            <div className="panel" style={{ padding: '7px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>MAR</div>
              <div>{snapshot.mar ?? '—'}</div>
            </div>
            <div className="panel" style={{ padding: '7px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>MDR</div>
              <div>{snapshot.mdr ?? '—'}</div>
            </div>
            <div className="panel" style={{ padding: '7px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>LINE</div>
              <div>{snapshot.currentInstructionLine ?? '—'}</div>
            </div>
          </div>
        </section>

        {/* ALU Flags */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h2 style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>Processor Flags</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
            {(
              [
                ['Z (Zero)', snapshot.flags.zero],
                ['N (Neg)', snapshot.flags.negative],
                ['C (Carry)', snapshot.flags.carry],
                ['V (Ovfl)', snapshot.flags.overflow],
              ] as const
            ).map(([label, active]) => (
              <div
                key={label}
                className="mono"
                style={{
                  padding: '6px',
                  borderRadius: '4px',
                  textAlign: 'center',
                  fontSize: '0.73rem',
                  border: active
                    ? '1px solid var(--accent-warm-gold)'
                    : '1px solid var(--border-subtle)',
                  background: active ? 'rgba(251, 191, 36, 0.16)' : 'rgba(15, 23, 42, 0.65)',
                  color: active ? '#FDE68A' : 'var(--text-muted)',
                }}
              >
                {label}: {active ? '1' : '0'}
              </div>
            ))}
          </div>
        </section>

        {/* Register File R0..R7 */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h2 style={{ fontSize: '0.86rem', color: 'var(--accent-primary)' }}>
            General Purpose Registers (R0–R7)
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {snapshot.registers.map((val, idx) => {
              const changed = changedSet.has(idx);
              return (
                <div
                  key={idx}
                  data-testid={`reg-row-R${idx}`}
                  className="mono"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '5px 8px',
                    borderRadius: '4px',
                    fontSize: '0.78rem',
                    border: changed
                      ? '1px solid rgba(16, 185, 129, 0.7)'
                      : '1px solid var(--border-subtle)',
                    background: changed ? 'rgba(16, 185, 129, 0.14)' : 'rgba(15, 23, 42, 0.6)',
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>R{idx}</span>
                  <span>
                    <strong style={{ color: changed ? '#6EE7B7' : 'var(--text-primary)' }}>{val}</strong>{' '}
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                      ({formatHex32(val)})
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Filterable Data Memory */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '0.86rem', color: 'var(--accent-primary)' }}>
              Data Memory (256 Words)
            </h2>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                className={`te-btn te-btn-sm ${memFilter === 'nonzero' ? 'te-btn-primary' : ''}`}
                onClick={() => setMemFilter('nonzero')}
              >
                Non-Zero ({snapshot.nonZeroMemory.length})
              </button>
              <button
                type="button"
                className={`te-btn te-btn-sm ${memFilter === 'range' ? 'te-btn-primary' : ''}`}
                onClick={() => setMemFilter('range')}
              >
                Window
              </button>
            </div>
          </div>

          {memFilter === 'range' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label htmlFor="mem-window-start" className="mono" style={{ fontSize: '0.72rem' }}>
                Start Addr:
              </label>
              <input
                id="mem-window-start"
                type="number"
                min={0}
                max={240}
                value={memStartAddr}
                onChange={(e) => setMemStartAddr(Number(e.target.value) || 0)}
                style={{
                  width: '72px',
                  padding: '4px 6px',
                  background: 'var(--bg-canvas)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '4px',
                }}
              />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '180px', overflowY: 'auto' }}>
            {visibleMemoryRows.length === 0 ? (
              <div className="mono" style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                All 256 words initialized to 0.
              </div>
            ) : (
              visibleMemoryRows.map((cell) => {
                const isLast = snapshot.lastModifiedMemoryAddr === cell.address;
                return (
                  <div
                    key={cell.address}
                    data-testid={`mem-cell-${cell.address}`}
                    className="mono"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.76rem',
                      border: isLast
                        ? '1px solid var(--accent-warm-gold)'
                        : '1px solid var(--border-subtle)',
                      background: isLast ? 'rgba(251, 191, 36, 0.14)' : 'rgba(15, 23, 42, 0.5)',
                    }}
                  >
                    <span>MEM[{cell.address}]</span>
                    <strong>{cell.value}</strong>
                  </div>
                );
              })
            )}
          </div>

          <form
            onSubmit={(e) => void handleWriteMemory(e)}
            style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
          >
            <input
              type="number"
              min={0}
              max={255}
              value={editAddr}
              onChange={(e) => setEditAddr(e.target.value)}
              aria-label="Memory address to edit"
              style={{
                width: '66px',
                padding: '4px 6px',
                background: 'var(--bg-canvas)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                fontSize: '0.76rem',
              }}
            />
            <input
              type="number"
              value={editVal}
              onChange={(e) => setEditVal(e.target.value)}
              aria-label="Signed integer memory value"
              style={{
                flex: 1,
                padding: '4px 6px',
                background: 'var(--bg-canvas)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                fontSize: '0.76rem',
              }}
            />
            <button type="submit" className="te-btn te-btn-sm">
              Set Word
            </button>
          </form>

          {activePreset.relatedInsightIds.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', paddingTop: '4px' }}>
              {activePreset.relatedInsightIds.map((id) => (
                <Link key={id} to={`/insights?topic=${encodeURIComponent(id)}`} className="te-btn te-btn-sm">
                  Study Concept
                </Link>
              ))}
            </div>
          )}
        </section>
      </Panel>
    </div>
  );
}
