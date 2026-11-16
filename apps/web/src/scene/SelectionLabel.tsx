import { Html } from '@react-three/drei';
import type { ChipComponent, VisualizationMode } from '../types/models';
import { computeComponentExplodedOffset } from './animationMath';

interface SelectionLabelProps {
  component: ChipComponent | undefined;
  mode: VisualizationMode;
}

/**
 * Floating name tag pinned above the selected component. It follows the same exploded /
 * cutaway offsets as the mesh group, so the tag stays attached in every visualization mode.
 * Purely visual: the dossier panel carries the accessible name.
 */
export function SelectionLabel({ component, mode }: SelectionLabelProps) {
  if (!component) return null;
  const [tx, ty, tz] = component.modelReference.cameraPreset.target;
  const [ox, oy, oz] = computeComponentExplodedOffset(component, mode);
  // Package-level parts are large: lift the tag clear of their top surface.
  const lift = component.groupId === 'cpu-package' ? 0.32 : 0.14;

  return (
    <Html
      position={[tx + ox, ty + oy + lift, tz + oz]}
      center
      zIndexRange={[20, 0]}
      style={{ pointerEvents: 'none' }}
    >
      <div className="te-scene-label" aria-hidden="true">
        <span className="te-scene-label__dot" />
        {component.name}
      </div>
    </Html>
  );
}
