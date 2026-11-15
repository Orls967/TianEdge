import { Component, type ReactNode, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import type { ChipComponent, VisualizationMode } from '../types/models';
import { useAppStore } from '../stores/useAppStore';
import { useAnatomyStore } from '../stores/useAnatomyStore';
import { CameraRig } from './CameraRig';
import { ChipModelGroup } from './ChipModelGroup';
import {
  HardwareInstancedArrays,
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
  const { reducedMotion, tabHidden } = useAppStore();
  const {
    selectedComponentId,
    hoveredComponentId,
    visualizationMode,
    sliceOffset,
    hiddenComponents,
    hiddenGroups,
    cameraTargetPreset,
    resetCameraNonce,
    isUserInteracting,
    selectComponent,
    hoverComponent,
    setUserInteracting,
  } = useAnatomyStore();

  const { assets, fallbackCount } = useGlbAssets();
  const [webglReady, setWebglReady] = useState(() => supportsWebGL());
  const [contextLost, setContextLost] = useState(false);

  const effectiveMode = modeOverride ?? visualizationMode;

  useEffect(() => {
    setWebglReady(supportsWebGL());
  }, []);

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
                setContextLost(true);
              },
              false,
            );
            canvas.addEventListener(
              'webglcontextrestored',
              () => {
                setContextLost(false);
              },
              false,
            );
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

          <gridHelper args={[10, 20, '#1e293b', '#0f172a']} position={[0, -0.36, 0]} />

          <CameraRig
            preset={cameraTargetPreset}
            resetNonce={resetCameraNonce}
            reducedMotion={reducedMotion}
            tabHidden={tabHidden}
            hasActiveSimulation={activeComponentIds.length > 0}
            isOverviewHero={isOverviewHero}
            autoCameraEnabled={autoCameraEnabled}
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
            onSelectComponent={handleSelect}
            onHoverComponent={hoverComponent}
          />

          <HardwareInstancedArrays
            showSolderBumps={
              !hiddenComponents['pkg-solder-bumps'] &&
              !hiddenGroups['cpu-package'] &&
              effectiveMode !== 'component_isolation'
            }
            showLgaPads={
              !hiddenComponents['pkg-electrical-contacts'] &&
              !hiddenGroups['cpu-package'] &&
              effectiveMode !== 'component_isolation'
            }
            explodedMode={effectiveMode === 'exploded_view'}
          />

          <SignalFlowOverlay
            mode={effectiveMode}
            activePaths={activePaths}
            reducedMotion={reducedMotion}
            tabHidden={tabHidden}
            onSelectComponent={handleSelectById}
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
      </SceneErrorBoundary>
    </div>
  );
}
