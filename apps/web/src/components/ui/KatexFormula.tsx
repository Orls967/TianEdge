import { useMemo } from 'react';
import katex from 'katex';

interface KatexFormulaProps {
  latex: string;
  displayMode?: boolean;
  ariaLabel?: string;
}

export function KatexFormula({
  latex,
  displayMode = true,
  ariaLabel,
}: KatexFormulaProps) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(latex, {
        displayMode,
        throwOnError: false,
        strict: false,
      });
    } catch {
      return null;
    }
  }, [latex, displayMode]);

  if (!html) {
    return (
      <code className="mono" style={{ display: 'block', padding: '8px' }}>
        {latex}
      </code>
    );
  }

  return (
    <div
      className="te-katex-block"
      role="math"
      aria-label={ariaLabel ?? latex}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
