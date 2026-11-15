import { ReactNode } from 'react';

export type BadgeTone = 'neutral' | 'cyan' | 'gold' | 'warning' | 'error' | 'success';

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = 'neutral', children, className = '' }: BadgeProps) {
  const toneClass = tone === 'neutral' ? '' : `badge-${tone}`;
  return <span className={`badge ${toneClass} ${className}`.trim()}>{children}</span>;
}
