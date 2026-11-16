import type { ChipComponent, VisualizationMode } from '../types/models';

export function cubicOut(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - clamped, 3);
}

export function lerpNumber(a: number, b: number, alpha: number): number {
  return a + (b - a) * alpha;
}

export function computeSectionPlaneConstant(sliceOffset: number): number {
  // Normalized 0..1 sweeps across +/- 1.85m along X+Z diagonal or X axis
  const clamped = Math.max(0, Math.min(1, sliceOffset));
  return (0.5 - clamped) * 3.7;
}

export function computeComponentExplodedOffset(
  component: ChipComponent,
  mode: VisualizationMode,
): [number, number, number] {
  const [ex, ey, ez] = component.modelReference.explodedOffset;
  switch (mode) {
    case 'exploded_view':
      return [ex, ey, ez];
    case 'internal_architecture':
      // Lift outer IHS lid & die slab partially so inner core blocks sit unobstructed
      if (component.id === 'pkg-ihs') return [0, 1.35, 0];
      if (component.id === 'pkg-silicon-die') return [0, -0.02, 0];
      return [0, 0, 0];
    case 'signal_flow':
      if (component.id === 'pkg-ihs') return [0, 1.45, 0];
      return [0, 0, 0];
    default:
      return [0, 0, 0];
  }
}

export interface ComponentRenderVisibility {
  visible: boolean;
  opacity: number;
  ghosted: boolean;
}

export function computeComponentVisibility(
  component: ChipComponent,
  mode: VisualizationMode,
  selectedComponentId: string | null,
  hiddenComponents: Record<string, boolean>,
  hiddenGroups: Record<string, boolean>,
): ComponentRenderVisibility {
  if (hiddenComponents[component.id] || hiddenGroups[component.groupId]) {
    return { visible: false, opacity: 0, ghosted: false };
  }

  const isLogicGroup = component.groupId === 'digital-logic';
  const selectedIsLogic = selectedComponentId?.startsWith('logic-') ?? false;

  if (mode === 'component_isolation') {
    if (selectedIsLogic) {
      if (component.id === selectedComponentId) {
        return { visible: true, opacity: 1, ghosted: false };
      }
      if (isLogicGroup) {
        return { visible: true, opacity: 0.22, ghosted: true };
      }
      return { visible: false, opacity: 0, ghosted: false };
    }

    if (isLogicGroup) {
      return { visible: false, opacity: 0, ghosted: false };
    }

    if (selectedComponentId && component.id === selectedComponentId) {
      return { visible: true, opacity: 1, ghosted: false };
    }
    // Keep a faint translucent silhouette of the substrate and die for structural context.
    // (Dense arrays such as C4 bumps / LGA pads and the lid are dropped: as ghosts they only add noise.)
    return {
      visible: component.id === 'pkg-substrate' || component.id === 'pkg-silicon-die' || component.groupId === 'silicon-die',
      opacity: 0.1,
      ghosted: true,
    };
  }

  // Digital Logic Group E conceptual pod is hidden in physical package modes unless specifically selected
  if (isLogicGroup) {
    return { visible: false, opacity: 0, ghosted: false };
  }

  if (mode === 'internal_architecture' || mode === 'signal_flow') {
    if (component.id === 'pkg-ihs') {
      return { visible: true, opacity: 0.12, ghosted: true };
    }
    return { visible: true, opacity: 1, ghosted: false };
  }

  if (mode === 'full_assembly') {
    const isPackageOrOuterDie =
      component.groupId === 'cpu-package' || component.id.startsWith('die-');
    return {
      visible: isPackageOrOuterDie || component.id === selectedComponentId,
      opacity: 1,
      ghosted: false,
    };
  }

  return { visible: true, opacity: 1, ghosted: false };
}

export interface IdleMotionParams {
  reducedMotion: boolean;
  tabHidden: boolean;
  isUserInteracting: boolean;
  hasActiveSimulation: boolean;
  isOverviewHero: boolean;
}

export interface IdleMotionFrame {
  orbitAngularSpeed: number;
  corePulseScale: number;
  airflowSpeed: number;
}

export function computeIdleMotionFrame(
  timeSec: number,
  params: IdleMotionParams,
): IdleMotionFrame {
  if (params.reducedMotion || params.tabHidden) {
    return { orbitAngularSpeed: 0, corePulseScale: 0, airflowSpeed: 0 };
  }
  const orbitAngularSpeed =
    params.isOverviewHero && !params.isUserInteracting && !params.hasActiveSimulation
      ? 0.04
      : 0;
  const corePulseScale = 0.08 + 0.06 * Math.sin(timeSec * Math.PI * 1.4);
  const airflowSpeed = 0.25;
  return { orbitAngularSpeed, corePulseScale, airflowSpeed };
}
