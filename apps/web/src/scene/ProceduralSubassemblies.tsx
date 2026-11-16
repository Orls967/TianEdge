import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { DataPathEdgeId, VisualizationMode } from '../types/models';
import { DATA_PATH_ROUTES } from './dataPaths';

interface SignalPathsProps {
  mode: VisualizationMode;
  activePaths: string[];
  reducedMotion: boolean;
  tabHidden: boolean;
  onSelectComponent?: (id: string) => void;
}

export function SignalFlowOverlay({
  mode,
  activePaths,
  reducedMotion,
  tabHidden,
  onSelectComponent,
}: SignalPathsProps) {
  const showAllTraces = mode === 'signal_flow' || mode === 'internal_architecture';
  const visibleEdges = useMemo(() => {
    const entries = Object.values(DATA_PATH_ROUTES);
    if (activePaths.length > 0) {
      const set = new Set(activePaths);
      return showAllTraces
        ? entries
        : entries.filter((edge) => set.has(edge.id));
    }
    return showAllTraces ? entries : [];
  }, [activePaths, showAllTraces]);

  const activeSet = useMemo(() => new Set(activePaths), [activePaths]);

  const packetMeshesRef = useRef<Array<THREE.Mesh | null>>([]);
  const curves = useMemo(() => {
    return visibleEdges.map((edge) => ({
      edge,
      curve: new THREE.CatmullRomCurve3(edge.points.map((p) => new THREE.Vector3(...p))),
      active: activeSet.has(edge.id) || mode === 'signal_flow',
    }));
  }, [visibleEdges, activeSet, mode]);

  useFrame(({ clock }) => {
    if (reducedMotion || tabHidden || curves.length === 0) return;
    const tBase = clock.getElapsedTime() * 0.75;
    curves.forEach((item, idx) => {
      const mesh = packetMeshesRef.current[idx];
      if (!mesh || !item.active) return;
      const u = (tBase + idx * 0.17) % 1;
      const pt = item.curve.getPointAt(u);
      mesh.position.copy(pt);
    });
  });

  if (curves.length === 0) return null;

  return (
    <group name="tianedge__signal-flow-overlay">
      {curves.map(({ edge, curve, active }, idx) => (
        <group key={edge.id}>
          <mesh
            name={`tianedge__path__${edge.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelectComponent?.(mapPathToComponent(edge.id));
            }}
          >
            <tubeGeometry args={[curve, 16, active ? 0.011 : 0.006, 6, false]} />
            <meshStandardMaterial
              color={edge.color}
              emissive={edge.color}
              emissiveIntensity={active ? 1.1 : 0.25}
              transparent
              opacity={active ? 0.95 : 0.35}
            />
          </mesh>

          {active && !reducedMotion && (
            <mesh
              ref={(el) => {
                packetMeshesRef.current[idx] = el;
              }}
              name={`tianedge__packet__${edge.id}`}
            >
              <sphereGeometry args={[0.022, 8, 8]} />
              <meshStandardMaterial
                color="#ffffff"
                emissive={edge.color}
                emissiveIntensity={1.6}
              />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

function mapPathToComponent(edgeId: DataPathEdgeId): string {
  switch (edgeId) {
    case 'pc_to_l1i':
    case 'l1i_to_ir':
    case 'alu_to_wb_regs':
    case 'mdr_to_wb_regs':
      return 'comm-data-paths';
    case 'ir_to_decoder':
    case 'decoder_to_cu':
    case 'alu_to_flags':
      return 'comm-control-signals';
    case 'alu_bypass_mem':
      return 'comm-clock-distribution';
    case 'lsu_to_l1d':
    case 'l1d_to_mem_if':
      return 'comm-memory-interface';
    default:
      return 'comm-internal-buses';
  }
}

export function ThermalAirflowRibbons({
  visible,
  reducedMotion,
  tabHidden,
}: {
  visible: boolean;
  reducedMotion: boolean;
  tabHidden: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const ribbons = useMemo(() => {
    return [-0.7, 0.0, 0.7].map((z) =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-2.1, 0.62, z),
        new THREE.Vector3(-0.7, 0.72, z + 0.08),
        new THREE.Vector3(0.7, 0.76, z - 0.06),
        new THREE.Vector3(2.1, 0.85, z),
      ]),
    );
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current || !visible || reducedMotion || tabHidden) return;
    groupRef.current.position.x = Math.sin(clock.getElapsedTime() * 0.9) * 0.06;
  });

  if (!visible) return null;

  return (
    <group ref={groupRef} name="tianedge__idle-thermal-ribbons">
      {ribbons.map((curve, idx) => (
        <mesh key={idx}>
          <tubeGeometry args={[curve, 18, 0.008, 6, false]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0ea5e9"
            emissiveIntensity={0.4}
            transparent
            opacity={0.28}
          />
        </mesh>
      ))}
    </group>
  );
}
