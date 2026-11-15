import { CSSProperties, ReactNode } from 'react';

interface PanelProps {
  children: ReactNode;
  glass?: boolean;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
}

export function Panel({ children, glass = false, className = '', style, ariaLabel }: PanelProps) {
  return (
    <div
      className={`${glass ? 'panel-glass' : 'panel'} ${className}`.trim()}
      style={style}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}
