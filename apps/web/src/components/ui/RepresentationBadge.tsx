import { RepresentationType } from '../../types/models';
import { Badge, BadgeTone } from './Badge';

const REP_META: Record<RepresentationType, { label: string; tone: BadgeTone }> = {
  physical_package: { label: 'PHYSICAL PACKAGE', tone: 'neutral' },
  architectural_block: { label: 'ARCHITECTURAL DIE BLOCK', tone: 'cyan' },
  logical_subsystem: { label: 'LOGICAL SUBSYSTEM', tone: 'cyan' },
  conceptual_enlarged: { label: 'CONCEPTUAL MODEL — NOT TO SCALE', tone: 'warning' },
  signal_overlay: { label: 'SIGNAL OVERLAY', tone: 'gold' },
};

export function RepresentationBadge({ type }: { type: RepresentationType }) {
  const meta = REP_META[type];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
