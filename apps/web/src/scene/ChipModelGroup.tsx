import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ChipComponent, VisualizationMode } from '../types/models';
import {
  computeComponentExplodedOffset,
  computeComponentVisibility,
  computeIdleMotionFrame,
  computeSectionPlaneConstant,
  lerpNumber,
} from './animationMath';
import type { GlbAssetName, LoadedGlbEntry } from './useGlbAssets';

interface ChipModelGroupProps {
  components: ChipComponent[];
  assets: Partial<Record<GlbAssetName, LoadedGlbEntry>>;
  mode: VisualizationMode;
  sliceOffset: number;
  selectedComponentId: string | null;
  hoveredComponentId: string | null;
  activeComponentIds: string[];
  hiddenComponents: Record<string, boolean>;
  hiddenGroups: Record<string, boolean>;
  reducedMotion: boolean;
  tabHidden: boolean;
  isUserInteracting: boolean;
  isOverviewHero: boolean;
  onSelectComponent: (component: ChipComponent) => void;
  onHoverComponent: (componentId: string | null) => void;
}

const PROCEDURAL_BOUNDS: Record<string, { pos: [number, number, number]; size: [number, number, number]; color: string }> = {
  'comm-internal-buses': { pos: [0, 0.2, -0.35], size: [1.1, 0.015, 0.05], color: '#00E5FF' },
  'comm-data-paths': { pos: [-0.42, 0.21, -0.46], size: [0.22, 0.014, 0.05], color: '#38bdf8' },
  'comm-control-signals': { pos: [-0.55, 0.215, -0.36], size: [0.05, 0.014, 0.25], color: '#FBBF24' },
  'comm-clock-distribution': { pos: [0, 0.21, 0], size: [0.04, 0.012, 1.35], color: '#A78BFA' },
  'comm-interconnect-network': { pos: [0, 0.2, 0.08], size: [1.45, 0.014, 0.05], color: '#00E5FF' },
};

function getFallbackBoxForComponent(comp: ChipComponent): {
  pos: [number, number, number];
  size: [number, number, number];
  color: string;
} {
  if (PROCEDURAL_BOUNDS[comp.id]) {
    return PROCEDURAL_BOUNDS[comp.id];
  }
  const [tx, ty, tz] = comp.modelReference.cameraPreset.target;
  if (comp.groupId === 'cpu-package') {
    return { pos: [tx, ty, tz], size: [2.4, 0.1, 2.4], color: '#334155' };
  }
  if (comp.groupId === 'digital-logic') {
    return { pos: [tx, 0.22, tz], size: [0.42, 0.14, 0.42], color: '#0ea5e9' };
  }
  return { pos: [tx, Math.max(0.16, ty), tz], size: [0.24, 0.06, 0.22], color: '#1e293b' };
}

export function ChipModelGroup({
  components,
  assets,
  mode,
  sliceOffset,
  selectedComponentId,
  hoveredComponentId,
  activeComponentIds,
  hiddenComponents,
  hiddenGroups,
  reducedMotion,
  tabHidden,
  isUserInteracting,
  isOverviewHero,
  onSelectComponent,
  onHoverComponent,
}: ChipModelGroupProps) {
  const activeSet = useMemo(() => new Set(activeComponentIds), [activeComponentIds]);
  const meshGroupRefs = useRef<Record<string, THREE.Group | null>>({});

  const sectionPlane = useMemo(() => {
    const constant = computeSectionPlaneConstant(sliceOffset);
    return new THREE.Plane(new THREE.Vector3(-1, 0, -0.35).normalize(), constant);
  }, [sliceOffset]);

  const clippingPlanes = useMemo(() => {
    return mode === 'section_cut' ? [sectionPlane] : [];
  }, [mode, sectionPlane]);

  // Smooth exploded-view / architectural cutaway Y-offset & Category A pulse animation
  useFrame(({ clock }, delta) => {
    const elapsed = clock.getElapsedTime();
    const idle = computeIdleMotionFrame(elapsed, {
      reducedMotion,
      tabHidden,
      isUserInteracting,
      hasActiveSimulation: activeComponentIds.length > 0,
      isOverviewHero,
    });

    const alpha = reducedMotion ? 1 : Math.min(1, delta * 8);

    components.forEach((comp, idx) => {
      const grp = meshGroupRefs.current[comp.id];
      if (!grp) return;
      const [tx, ty, tz] = computeComponentExplodedOffset(comp, mode);
      grp.position.x = lerpNumber(grp.position.x, tx, alpha);
      grp.position.y = lerpNumber(grp.position.y, ty, alpha);
      grp.position.z = lerpNumber(grp.position.z, tz, alpha);

      // Subtle staggered emissive idle pulse for silicon core zones when not disabled
      if (!reducedMotion && !tabHidden && comp.groupId === 'processing-core') {
        const pulse = Math.max(0, Math.sin(elapsed * 2.1 + idx * 0.65) * 0.5 + 0.5) * idle.corePulseScale;
        grp.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
            const isHighlighted =
              comp.id === selectedComponentId ||
              comp.id === hoveredComponentId ||
              activeSet.has(comp.id);
            if (!isHighlighted) {
              child.material.emissiveIntensity = pulse;
            }
          }
        });
      }
    });
  });

  return (
    <group name="tianedge__chip-assembly">
      {components.map((comp) => {
        const vis = computeComponentVisibility(
          comp,
          mode,
          selectedComponentId,
          hiddenComponents,
          hiddenGroups,
        );
        if (!vis.visible) return null;

        const isSelected = comp.id === selectedComponentId;
        const isHovered = comp.id === hoveredComponentId;
        const isSimActive = activeSet.has(comp.id);
        const highlightHex = isSimActive || isSelected ? comp.modelReference.highlightColorHex : '#38bdf8';

        const glbEntry =
          comp.modelReference.assetFile !== 'procedural'
            ? assets[comp.modelReference.assetFile as GlbAssetName]
            : undefined;
        const prefix = comp.modelReference.meshPrefix + '__';
        const matchedMeshes = glbEntry
          ? Object.entries(glbEntry.meshes)
              .filter(([nodeName]) => nodeName.startsWith(prefix))
              .map(([nodeName, mesh]) => ({ nodeName, mesh }))
          : [];

        return (
          <group
            key={comp.id}
            ref={(el) => {
              meshGroupRefs.current[comp.id] = el;
            }}
            name={`tianedge__group__${comp.id}`}
          >
            {matchedMeshes.length > 0 ? (
              matchedMeshes.map(({ nodeName, mesh }) => {
                const origMat = mesh.material as THREE.MeshStandardMaterial | undefined;
                const baseColor = origMat?.color ? `#${origMat.color.getHexString()}` : '#475569';
                // Large flat package surfaces (IHS lid, substrate) blow out to white under a strong
                // emissive tint, so they get a softer highlight; ghosted shells get none at all.
                const isLargeSurface = comp.groupId === 'cpu-package';
                const highlightScale = vis.ghosted ? 0 : isLargeSurface ? 0.35 : 1;
                const emissiveIntensity =
                  (isSimActive ? 0.95 : isSelected ? 0.72 : isHovered ? 0.35 : 0) * highlightScale;
                const isTransparent = vis.ghosted || vis.opacity < 1;
                return (
                  <mesh
                    key={nodeName}
                    name={nodeName}
                    geometry={mesh.geometry}
                    castShadow={false}
                    receiveShadow={false}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectComponent(comp);
                    }}
                    onPointerOver={(e) => {
                      e.stopPropagation();
                      document.body.style.cursor = 'pointer';
                      onHoverComponent(comp.id);
                    }}
                    onPointerOut={() => {
                      document.body.style.cursor = 'auto';
                      onHoverComponent(null);
                    }}
                  >
                    <meshStandardMaterial
                      // three.js only recompiles the shader for a `transparent` flip when the
                      // material is recreated, so key on it (otherwise ghosted shells render opaque).
                      key={isTransparent ? 'transparent' : 'opaque'}
                      color={baseColor}
                      metalness={origMat?.metalness ?? 0.45}
                      roughness={origMat?.roughness ?? 0.38}
                      emissive={isSimActive || isSelected || isHovered ? highlightHex : '#000000'}
                      emissiveIntensity={emissiveIntensity}
                      transparent={isTransparent}
                      depthWrite={!isTransparent}
                      opacity={vis.opacity}
                      wireframe={vis.ghosted && mode === 'component_isolation'}
                      clippingPlanes={clippingPlanes}
                      clipShadows={false}
                      side={mode === 'section_cut' ? THREE.DoubleSide : THREE.FrontSide}
                    />
                  </mesh>
                );
              })
            ) : (
              (() => {
                const fb = getFallbackBoxForComponent(comp);
                const emissiveIntensity = isSimActive ? 1.0 : isSelected ? 0.7 : isHovered ? 0.35 : 0.15;
                return (
                  <mesh
                    name={`${comp.modelReference.meshPrefix}__procedural`}
                    position={fb.pos}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectComponent(comp);
                    }}
                    onPointerOver={(e) => {
                      e.stopPropagation();
                      document.body.style.cursor = 'pointer';
                      onHoverComponent(comp.id);
                    }}
                    onPointerOut={() => {
                      document.body.style.cursor = 'auto';
                      onHoverComponent(null);
                    }}
                  >
                    <boxGeometry args={fb.size} />
                    <meshStandardMaterial
                      key={vis.ghosted || vis.opacity < 1 ? 'transparent' : 'opaque'}
                      color={fb.color}
                      metalness={0.5}
                      roughness={0.35}
                      emissive={isSimActive || isSelected || isHovered ? highlightHex : fb.color}
                      emissiveIntensity={emissiveIntensity}
                      transparent={vis.ghosted || vis.opacity < 1}
                      opacity={vis.opacity}
                      clippingPlanes={clippingPlanes}
                    />
                  </mesh>
                );
              })()
            )}
          </group>
        );
      })}
    </group>
  );
}
