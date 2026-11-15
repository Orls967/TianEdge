import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ChipComponent } from '../types/models';
import {
  computeComponentExplodedOffset,
  computeComponentVisibility,
  computeIdleMotionFrame,
  computeSectionPlaneConstant,
} from './animationMath';
import { ALL_DATA_PATH_IDS } from './dataPaths';

const componentsJsonPath = resolve(__dirname, '../../public/data/components.json');
const manifestPath = resolve(__dirname, '../../public/models/ASSET_MANIFEST.json');

const components = JSON.parse(readFileSync(componentsJsonPath, 'utf-8')) as ChipComponent[];
const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as {
  totalTrianglesInGlb: number;
  componentAssetCoverage: number;
  files: Record<string, { nodes: string[]; triangles: number }>;
};

describe('TC-3D & TC-ANIM: 3D Assets, Scene Binding, Modes, and Animation Logic', () => {
  it('TC-3D-01/02: maps all 36 canonical components to GLB nodes or procedural bindings within poly budget', () => {
    expect(components).toHaveLength(36);
    expect(manifest.componentAssetCoverage).toBe(36);
    expect(manifest.totalTrianglesInGlb).toBeLessThan(150_000);

    const allGlbNodes = Object.values(manifest.files).flatMap((f) => f.nodes);
    for (const comp of components) {
      if (comp.modelReference.assetFile !== 'procedural') {
        const expectedPrefix = `${comp.modelReference.meshPrefix}__`;
        expect(allGlbNodes.some((n) => n.startsWith(expectedPrefix))).toBe(true);
      }
    }
  });

  it('TC-3D-05: exploded_view applies distinct Y-layer separation matching DATA_MODEL offsets', () => {
    const ihs = components.find((c) => c.id === 'pkg-ihs')!;
    const die = components.find((c) => c.id === 'pkg-silicon-die')!;
    const sub = components.find((c) => c.id === 'pkg-substrate')!;

    expect(computeComponentExplodedOffset(ihs, 'full_assembly')).toEqual([0, 0, 0]);
    expect(computeComponentExplodedOffset(ihs, 'exploded_view')).toEqual([0, 1.4, 0]);
    expect(computeComponentExplodedOffset(die, 'exploded_view')).toEqual([0, 0.55, 0]);
    expect(computeComponentExplodedOffset(sub, 'exploded_view')).toEqual([0, 0, 0]);
  });

  it('isolates digital-logic components cleanly when selected in component_isolation', () => {
    const logicComp = components.find((c) => c.id === 'logic-transistors')!;
    const hiddenInFull = computeComponentVisibility(logicComp, 'full_assembly', null, {}, {});
    expect(hiddenInFull.visible).toBe(false);

    const visibleInIsolation = computeComponentVisibility(
      logicComp,
      'component_isolation',
      'logic-transistors',
      {},
      {},
    );
    expect(visibleInIsolation.visible).toBe(true);
    expect(visibleInIsolation.opacity).toBe(1);
  });

  it('TC-ANIM-01/03/04: freezes idle animation on reducedMotion, tabHidden, or active drag/simulation', () => {
    const activeHero = computeIdleMotionFrame(1.5, {
      reducedMotion: false,
      tabHidden: false,
      isUserInteracting: false,
      hasActiveSimulation: false,
      isOverviewHero: true,
    });
    expect(activeHero.orbitAngularSpeed).toBeGreaterThan(0);

    const reduced = computeIdleMotionFrame(1.5, {
      reducedMotion: true,
      tabHidden: false,
      isUserInteracting: false,
      hasActiveSimulation: false,
      isOverviewHero: true,
    });
    expect(reduced.orbitAngularSpeed).toBe(0);
    expect(reduced.corePulseScale).toBe(0);
    expect(reduced.airflowSpeed).toBe(0);

    const blurred = computeIdleMotionFrame(1.5, {
      reducedMotion: false,
      tabHidden: true,
      isUserInteracting: false,
      hasActiveSimulation: false,
      isOverviewHero: true,
    });
    expect(blurred.orbitAngularSpeed).toBe(0);
    expect(blurred.airflowSpeed).toBe(0);

    const dragging = computeIdleMotionFrame(1.5, {
      reducedMotion: false,
      tabHidden: false,
      isUserInteracting: true,
      hasActiveSimulation: false,
      isOverviewHero: true,
    });
    expect(dragging.orbitAngularSpeed).toBe(0);
  });

  it('covers all 13 canonical DataPathEdgeId routes and finite section-cut planes', () => {
    expect(ALL_DATA_PATH_IDS).toHaveLength(13);
    expect(computeSectionPlaneConstant(0)).toBeGreaterThan(0);
    expect(computeSectionPlaneConstant(1)).toBeLessThan(0);
  });
});
