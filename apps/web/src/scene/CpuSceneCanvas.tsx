import { Component, type ReactNode, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import type { ChipComponent, VisualizationMode } from '../types/models';
import { useAppStore } from '../stores/useAppStore';
import { useAnatomyStore } from '../stores/useAnatomyStore';
import { CameraRig } from './CameraRig';
import { ChipModelGroup } from './ChipModelGroup';
import { SelectionLabel } from './SelectionLabel';
import {
  SignalFlowOverlay,
  ThermalAirflowRibbons,
} from './ProceduralSubassemblies';
import { useGlbAssets } from './useGlbAssets';

export interface SceneRuntimeMetrics {
  drawCalls: number;
  triangles: number;
  fallbackAssets: number;
  mode: VisualizationMode;
  activeComponentsCount: number;
}

declare global {
  interface Window {
    __TIANEDGE_SCENE_METRICS__?: SceneRuntimeMetrics;
  }
}

interface CpuSceneCanvasProps {
  components: ChipComponent[];
  activeComponentIds?: string[];
  activePaths?: string[];
  isOverviewHero?: boolean;
  autoCameraEnabled?: boolean;
  modeOverride?: VisualizationMode;
  onSelectComponent?: (component: ChipComponent) => void;
  heightClassName?: string;
}

function MetricsReporter({
  mode,
  fallbackCount,
  activeComponentsCount,
}: {
  mode: VisualizationMode;
  fallbackCount: number;
  activeComponentsCount: number;
}) {
  const { gl } = useThree();
  useFrame(() => {
    window.__TIANEDGE_SCENE_METRICS__ = {
      drawCalls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      fallbackAssets: fallbackCount,
      mode,
      activeComponentsCount,
    };
  });
  return null;
}

class SceneErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function supportsWebGL(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

function Schematic2DFallback({
  components,
  selectedId,
  activeComponentIds,
  onSelect,
}: {
  components: ChipComponent[];
  selectedId: string | null;
  activeComponentIds: string[];
  onSelect?: (component: ChipComponent) => void;
}) {
  const activeSet = new Set(activeComponentIds);
  const coreBlocks = components.filter(
    (c) => c.groupId === 'processing-core' || c.groupId === 'memory-hierarchy',
  );

  return (
    <div
      className="te-schematic-fallback"
      role="region"
      aria-label="Interactive 2D CPU Schematic Fallback"
    >
      <div className="te-schematic-header">
        <span>2D Architecture Schematic (WebGL Fallback Active)</span>
      </div>
      <div className="te-schematic-grid">
        {coreBlocks.map((comp) => {
          const isSelected = comp.id === selectedId;
          const isActive = activeSet.has(comp.id);
          return (
            <button
              key={comp.id}
              type="button"
              className={`te-schematic-node ${isSelected ? 'is-selected' : ''} ${
                isActive ? 'is-active' : ''
              }`}
              onClick={() => onSelect?.(comp)}
            >
              <strong>{comp.name}</strong>
              <span>{comp.groupId}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WebGLStage({
  components,
  activeComponentIds,
  activePaths,
  isOverviewHero,
  autoCameraEnabled,
  effectiveMode,
  onSelect,
  onSelectById,
  onContextLost,
  onContextRestored,
}: {
  components: ChipComponent[];
  activeComponentIds: string[];
  activePaths: string[];
  isOverviewHero: boolean;
  autoCameraEnabled: boolean;
  effectiveMode: VisualizationMode;
  onSelect: (comp: ChipComponent) => void;
  onSelectById: (componentId: string) => void;
  onContextLost: () => void;
  onContextRestored: () => void;
}) {
  const { reducedMotion, tabHidden } = useAppStore();
  const {
    selectedComponentId,
    hoveredComponentId,
    sliceOffset,
    hiddenComponents,
    hiddenGroups,
    cameraTargetPreset,
    resetCameraNonce,
    isUserInteracting,
    hoverComponent,
    setUserInteracting,
  } = useAnatomyStore();

  const { assets, fallbackCount } = useGlbAssets();

  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [3.6, 2.7, 3.8], fov: 42, near: 0.1, far: 80 }}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        localClippingEnabled: true,
      }}
      onCreated={({ gl }) => {
        const canvas = gl.domElement;
        canvas.addEventListener(
          'webglcontextlost',
          (e) => {
            e.preventDefault();
            onContextLost();
          },
          false,
        );
        canvas.addEventListener('webglcontextrestored', onContextRestored, false);
      }}
      onPointerMissed={() => {
        hoverComponent(null);
      }}
    >
      <color attach="background" args={['#090d16']} />
      <ambientLight intensity={0.62} />
      <directionalLight position={[5, 8, 6]} intensity={1.25} color="#f8fafc" />
      <directionalLight position={[-5, 4, -5]} intensity={0.55} color="#38bdf8" />
      <pointLight position={[0, 2.2, 0]} intensity={0.45} color="#fbbf24" />
      {/* Procedural studio reflections (no HDR download): metals such as the nickel lid,
          gold bumps and LGA pads need something to reflect or they render near-black. */}
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={1.6} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[8, 8, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#7dd3fc" position={[-5, 2, 0]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
        <Lightformer form="rect" intensity={0.6} color="#fde68a" position={[5, 1.5, 2]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} />
      </Environment>

      <gridHelper args={[10, 20, '#1e293b', '#0f172a']} position={[0, -0.36, 0]} />

      <CameraRig
        preset={cameraTargetPreset}
        resetNonce={resetCameraNonce}
        reducedMotion={reducedMotion}
        tabHidden={tabHidden}
        hasActiveSimulation={activeComponentIds.length > 0}
        isOverviewHero={isOverviewHero}
        autoCameraEnabled={autoCameraEnabled}
        closeUp={effectiveMode === 'component_isolation' && !selectedComponentId?.startsWith('logic-')}
        onUserInteractingChange={setUserInteracting}
      />

      <ChipModelGroup
        components={components}
        assets={assets}
        mode={effectiveMode}
        sliceOffset={sliceOffset}
        selectedComponentId={selectedComponentId}
        hoveredComponentId={hoveredComponentId}
        activeComponentIds={activeComponentIds}
        hiddenComponents={hiddenComponents}
        hiddenGroups={hiddenGroups}
        reducedMotion={reducedMotion}
        tabHidden={tabHidden}
        isUserInteracting={isUserInteracting}
        isOverviewHero={isOverviewHero}
        onSelectComponent={onSelect}
        onHoverComponent={hoverComponent}
      />

      {!isOverviewHero && (
        <SelectionLabel
          component={components.find((c) => c.id === selectedComponentId)}
          mode={effectiveMode}
        />
      )}

      <SignalFlowOverlay
        mode={effectiveMode}
        activePaths={activePaths}
        reducedMotion={reducedMotion}
        tabHidden={tabHidden}
        onSelectComponent={onSelectById}
      />

      <ThermalAirflowRibbons
        visible={isOverviewHero || effectiveMode === 'full_assembly'}
        reducedMotion={reducedMotion}
        tabHidden={tabHidden}
      />

      <MetricsReporter
        mode={effectiveMode}
        fallbackCount={fallbackCount}
        activeComponentsCount={activeComponentIds.length}
      />
    </Canvas>
  );
}

export function CpuSceneCanvas({
  components,
  activeComponentIds = [],
  activePaths = [],
  isOverviewHero = false,
  autoCameraEnabled = true,
  modeOverride,
  onSelectComponent,
  heightClassName = 'te-canvas-frame',
}: CpuSceneCanvasProps) {
  const { selectedComponentId, visualizationMode, selectComponent } = useAnatomyStore();
  const [webglReady] = useState(() => supportsWebGL());
  const [contextLost, setContextLost] = useState(false);

  const effectiveMode = modeOverride ?? visualizationMode;

  const handleSelect = (comp: ChipComponent) => {
    selectComponent(comp.id, comp.modelReference.cameraPreset);
    onSelectComponent?.(comp);
  };

  const handleSelectById = (componentId: string) => {
    const found = components.find((c) => c.id === componentId);
    if (found) handleSelect(found);
  };

  const fallbackView = (
    <Schematic2DFallback
      components={components}
      selectedId={selectedComponentId}
      activeComponentIds={activeComponentIds}
      onSelect={handleSelect}
    />
  );

  if (!webglReady || contextLost) {
    return <div className={heightClassName}>{fallbackView}</div>;
  }

  return (
    <div className={heightClassName} data-testid="cpu-scene-canvas-wrapper">
      <SceneErrorBoundary fallback={fallbackView}>
        <WebGLStage
          components={components}
          activeComponentIds={activeComponentIds}
          activePaths={activePaths}
          isOverviewHero={isOverviewHero}
          autoCameraEnabled={autoCameraEnabled}
          effectiveMode={effectiveMode}
          onSelect={handleSelect}
          onSelectById={handleSelectById}
          onContextLost={() => setContextLost(true)}
          onContextRestored={() => setContextLost(false)}
        />
      </SceneErrorBoundary>
    </div>
  );
}
