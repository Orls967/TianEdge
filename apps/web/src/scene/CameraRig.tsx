import { useEffect, useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { CameraPreset } from '../types/models';
import { computeIdleMotionFrame, cubicOut } from './animationMath';

interface CameraRigProps {
  preset: CameraPreset;
  resetNonce: number;
  reducedMotion: boolean;
  tabHidden: boolean;
  hasActiveSimulation: boolean;
  isOverviewHero: boolean;
  autoCameraEnabled?: boolean;
  onUserInteractingChange: (interacting: boolean) => void;
}

const TRANSITION_DURATION_SEC = 0.65;

export function CameraRig({
  preset,
  resetNonce,
  reducedMotion,
  tabHidden,
  hasActiveSimulation,
  isOverviewHero,
  autoCameraEnabled = true,
  onUserInteractingChange,
}: CameraRigProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const { camera, size } = useThree();
  // Narrow / portrait viewports cut off the package horizontally: dolly out proportionally.
  const aspect = size.width / Math.max(1, size.height);
  const distanceScale = Math.min(2.1, Math.max(1, 1.45 / aspect));
  const isInteractingRef = useRef(false);

  const transitionRef = useRef<{
    active: boolean;
    elapsed: number;
    fromPos: THREE.Vector3;
    toPos: THREE.Vector3;
    fromTarget: THREE.Vector3;
    toTarget: THREE.Vector3;
  }>({
    active: false,
    elapsed: 0,
    fromPos: new THREE.Vector3(...preset.position),
    toPos: new THREE.Vector3(...preset.position),
    fromTarget: new THREE.Vector3(...preset.target),
    toTarget: new THREE.Vector3(...preset.target),
  });

  useEffect(() => {
    if (!autoCameraEnabled) return;
    const toTarget = new THREE.Vector3(...preset.target);
    const offset = new THREE.Vector3(...preset.position).sub(toTarget);
    // Only whole-package framings (distance > 3.2) need the dolly-out; close-ups of small
    // blocks such as the ALU would otherwise shrink to a speck.
    if (offset.length() > 3.2) offset.multiplyScalar(distanceScale);
    const toPos = offset.add(toTarget);

    if (reducedMotion) {
      camera.position.copy(toPos);
      if (controlsRef.current) {
        controlsRef.current.target.copy(toTarget);
        controlsRef.current.update();
      }
      transitionRef.current.active = false;
      return;
    }

    const currentTarget = controlsRef.current
      ? controlsRef.current.target.clone()
      : new THREE.Vector3(0, 0, 0);

    transitionRef.current = {
      active: true,
      elapsed: 0,
      fromPos: camera.position.clone(),
      toPos,
      fromTarget: currentTarget,
      toTarget,
    };
  }, [preset, resetNonce, autoCameraEnabled, reducedMotion, camera, distanceScale]);

  useFrame((_, delta) => {
    const tr = transitionRef.current;
    if (tr.active && !isInteractingRef.current) {
      tr.elapsed += delta;
      const progress = Math.min(1, tr.elapsed / TRANSITION_DURATION_SEC);
      const eased = cubicOut(progress);

      camera.position.lerpVectors(tr.fromPos, tr.toPos, eased);
      if (controlsRef.current) {
        controlsRef.current.target.lerpVectors(tr.fromTarget, tr.toTarget, eased);
        controlsRef.current.update();
      }
      if (progress >= 1) {
        tr.active = false;
      }
      return;
    }

    const idle = computeIdleMotionFrame(0, {
      reducedMotion,
      tabHidden,
      isUserInteracting: isInteractingRef.current,
      hasActiveSimulation,
      isOverviewHero,
    });

    if (idle.orbitAngularSpeed > 0 && controlsRef.current) {
      const target = controlsRef.current.target;
      const offset = camera.position.clone().sub(target);
      const angle = idle.orbitAngularSpeed * delta;
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
      camera.position.copy(target).add(offset);
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={1.1}
      maxDistance={12}
      maxPolarAngle={Math.PI * 0.85}
      minPolarAngle={0.12}
      onStart={() => {
        isInteractingRef.current = true;
        transitionRef.current.active = false;
        onUserInteractingChange(true);
      }}
      onEnd={() => {
        isInteractingRef.current = false;
        onUserInteractingChange(false);
      }}
    />
  );
}
