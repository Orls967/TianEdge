import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Camera, Cpu, Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Panel } from '../components/ui/Panel';
import { ErrorStateView } from '../components/ui/StateViews';
import { trackAnalyticsEvent } from '../content/analyticsClient';
import { useContentStore } from '../content/useContentStore';
import { CpuSceneCanvas } from '../scene/CpuSceneCanvas';
import { useAnatomyStore } from '../stores/useAnatomyStore';
import { useAppStore } from '../stores/useAppStore';
import { JOURNEY_SCENARIOS, useJourneyStore } from '../stores/useJourneyStore';
import { useSimulatorStore } from '../stores/useSimulatorStore';
import type { JourneyScenarioId } from '../types/models';


const STAGE_SHORT_LABEL: Record<string, string> = {
  FETCH: 'Fetch',
  DECODE: 'Decode',
  REGISTER_READ: 'Reg Read',
  EXECUTE: 'Execute',
  MEMORY_ACCESS: 'Memory',
  WRITE_BACK: 'Write',
};

export function InstructionJourneyPage() {
  const navigate = useNavigate();
  const { bundle, initContent } = useContentStore();
  const { reducedMotion } = useAppStore();
  const { focusPreset } = useAnatomyStore();
  const handoffFromJourney = useSimulatorStore((s) => s.handoffFromJourney);

  const {
    scenarioId,
    currentStepIndex,
    isAutoPlaying,
    autoCameraEnabled,
    snapshot,
    loading,
    error,
    loadScenario,
    goToStep,
    nextStep,
    prevStep,
    setAutoPlaying,
    setAutoCameraEnabled,
  } = useJourneyStore();

  const scenario = JOURNEY_SCENARIOS[scenarioId];
  const currentStage = scenario.stages[currentStepIndex];

  useEffect(() => {
    void initContent();
    void loadScenario(scenarioId, currentStepIndex);
    trackAnalyticsEvent('section_viewed', 'journey', scenarioId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Synchronize camera preset cleanly with active Journey step
  useEffect(() => {
    if (autoCameraEnabled && currentStage) {
      focusPreset(currentStage.cameraPreset);
    }
  }, [autoCameraEnabled, currentStage, focusPreset]);

  // Auto-play progression loop respecting reducedMotion
  useEffect(() => {
    if (!isAutoPlaying || reducedMotion) return;
    const timer = setInterval(() => {
      if (currentStepIndex >= 5) {
        setAutoPlaying(false);
        trackAnalyticsEvent('journey_completed', 'journey', scenarioId);
      } else {
        void nextStep();
      }
    }, 1800);
    return () => clearInterval(timer);
  }, [isAutoPlaying, reducedMotion, currentStepIndex, nextStep, setAutoPlaying, scenarioId]);

  const handleOpenInSimulator = async () => {
    await handoffFromJourney(scenario.programSource, scenario.presetId);
    navigate('/simulator');
  };

  if (error) {
    return (
      <div className="te-page-container">
        <ErrorStateView
          message={error}
          onRetry={() => void loadScenario(scenarioId, currentStepIndex)}
        />
      </div>
    );
  }

  return (
    <div className="te-journey-shell">
      {/* Left Narration & Live WASM State Column */}
      <Panel
        className="te-scroll-pane"
        style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}
        ariaLabel="Instruction Journey Controls and Narration"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <Badge tone="cyan">GUIDED EXECUTION WALKTHROUGH</Badge>
            <Badge tone="gold">RUST/WASM SYNCHRONIZED</Badge>
          </div>
          <h1 style={{ fontSize: '1.25rem' }}>Instruction Journey</h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
            {scenario.summary}
          </p>
        </div>

        {/* Scenario Switcher */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            ACTIVE WALKTHROUGH SCENARIO
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(['add_register_flow', 'store_memory_flow'] as JourneyScenarioId[]).map((id) => (
              <button
                key={id}
                type="button"
                className={`te-btn te-btn-sm ${scenarioId === id ? 'te-btn-primary' : ''}`}
                onClick={() => void loadScenario(id, 0)}
              >
                {id === 'add_register_flow' ? 'ADD R3, R1, R2' : 'STORE R1, 100'}
              </button>
            ))}
          </div>
        </div>

        {/* 6-Step Progress Ribbon */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
          {scenario.stages.map((st, idx) => {
            const isCurrent = idx === currentStepIndex;
            const isPast = idx < currentStepIndex;
            return (
              <button
                key={st.stage}
                type="button"
                aria-current={isCurrent ? 'step' : undefined}
                onClick={() => void goToStep(idx)}
                className={`te-btn te-btn-sm ${isCurrent ? 'te-btn-primary' : ''}`}
                style={{
                  padding: '6px 4px',
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-mono)',
                  borderColor: isPast ? 'rgba(16,185,129,0.5)' : undefined,
                  opacity: st.stageBypassed && !isCurrent ? 0.72 : 1,
                }}
                title={st.title}
              >
                {idx + 1}. {STAGE_SHORT_LABEL[st.stage] ?? st.stage}
              </button>
            );
          })}
        </div>

        {/* Transport Controls */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className="te-btn te-btn-sm"
            onClick={() => void prevStep()}
            disabled={currentStepIndex === 0 || loading}
          >
            <SkipBack size={14} aria-hidden="true" />
            <span>Prev</span>
          </button>

          <button
            type="button"
            className="te-btn te-btn-sm te-btn-primary"
            onClick={() => setAutoPlaying(!isAutoPlaying)}
            disabled={reducedMotion}
            title={reducedMotion ? 'Auto-play disabled under Reduced Motion' : 'Toggle Auto-Walk'}
          >
            {isAutoPlaying ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
            <span>{isAutoPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            type="button"
            className="te-btn te-btn-sm"
            onClick={() => void nextStep()}
            disabled={currentStepIndex >= 5 || loading}
          >
            <span>Next</span>
            <SkipForward size={14} aria-hidden="true" />
          </button>

          <button
            type="button"
            className="te-btn te-btn-sm"
            onClick={() => void loadScenario(scenarioId, 0)}
          >
            <RotateCcw size={13} aria-hidden="true" />
            <span>Restart</span>
          </button>

          <button
            type="button"
            className={`te-btn te-btn-sm ${autoCameraEnabled ? 'te-btn-gold' : ''}`}
            onClick={() => setAutoCameraEnabled(!autoCameraEnabled)}
            aria-pressed={autoCameraEnabled}
          >
            <Camera size={13} aria-hidden="true" />
            <span>Auto Camera: {autoCameraEnabled ? 'On' : 'Off'}</span>
          </button>
        </div>

        {/* Current Stage Narration */}
        <Panel
          style={{
            padding: '14px',
            background: 'rgba(15, 23, 42, 0.75)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Badge tone="cyan">{currentStage.stage}</Badge>
            {currentStage.stageBypassed && (
              <Badge tone="warning">MEMORY ACCESS BYPASSED (NO RAM READ/WRITE)</Badge>
            )}
          </div>
          <h2 style={{ fontSize: '1.04rem' }}>{currentStage.title}</h2>
          <p style={{ fontSize: '0.86rem', color: '#E0FAFF' }}>
            <strong>Objective:</strong> {currentStage.educationalObjective}
          </p>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
            {currentStage.technicalExplanation}
          </p>
        </Panel>

        {/* Live Rust/WASM Hardware Readout */}
        <Panel style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>
              LIVE WASM SNAPSHOT READOUT
            </span>
            <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Cycle {snapshot.clockCycles} | IR: {snapshot.ir ?? '—'}
            </span>
          </div>

          <div
            className="mono"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: '6px',
              fontSize: '0.75rem',
            }}
          >
            <div>PC: {snapshot.pc}</div>
            <div>MAR: {snapshot.mar ?? '—'}</div>
            <div>MDR: {snapshot.mdr ?? '—'}</div>
            <div>ALU: {snapshot.alu.result ?? '—'}</div>
            <div>R1: {snapshot.registers[1]}</div>
            <div>R2: {snapshot.registers[2]}</div>
            <div>R3: {snapshot.registers[3]}</div>
            <div>
              MEM[100]:{' '}
              {snapshot.nonZeroMemory.find((m) => m.address === 100)?.value ?? 0}
            </div>
          </div>
        </Panel>

        <button
          type="button"
          className="te-btn te-btn-primary"
          onClick={() => void handleOpenInSimulator()}
        >
          <Cpu size={15} aria-hidden="true" />
          <span>Open in CPU Simulator</span>
          <ArrowRight size={14} aria-hidden="true" />
        </button>
      </Panel>

      {/* Right Interactive Synchronized 3D Viewport */}
      <div style={{ position: 'relative', minHeight: '540px' }}>
        <CpuSceneCanvas
          components={bundle?.components ?? []}
          activeComponentIds={
            snapshot.activeComponentIds.length > 0
              ? snapshot.activeComponentIds
              : currentStage.activeComponentIds
          }
          activePaths={
            snapshot.activePaths.length > 0
              ? snapshot.activePaths
              : currentStage.activePathEdges
          }
          modeOverride="signal_flow"
          autoCameraEnabled={autoCameraEnabled}
        />
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            pointerEvents: 'none',
          }}
        >
          <Badge tone="cyan">
            Step {currentStage.stepNumber} / 6 — {scenario.featuredInstruction}
          </Badge>
          {currentStage.stageBypassed && (
            <Badge tone="warning">Signal bypasses L1 Data Cache</Badge>
          )}
        </div>
      </div>
    </div>
  );
}
