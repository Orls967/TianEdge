import { ReactNode, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Cpu, Keyboard, Pause, Play } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { Modal } from '../ui/Modal';

import { PRIMARY_ROUTES } from '../../constants/routes';

export function AppShell({ children }: { children: ReactNode }) {
  const {
    reducedMotion,
    toggleReducedMotion,
    setSystemReducedMotion,
    wasmStatus,
    backendStatus,
    shortcutsOpen,
    setShortcutsOpen,
    setTabHidden,
  } = useAppStore();

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const onChange = (ev: MediaQueryListEvent) => setSystemReducedMotion(ev.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, [setSystemReducedMotion]);

  useEffect(() => {
    const onVis = () => setTabHidden(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [setTabHidden]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inInput =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      if (!inInput && e.key === '?') {
        e.preventDefault();
        setShortcutsOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setShortcutsOpen]);

  const wasmLabel =
    wasmStatus === 'ready'
      ? 'WASM Ready'
      : wasmStatus === 'error'
        ? 'WASM Fault'
        : 'WASM Loading';
  const wasmDotClass =
    wasmStatus === 'ready' ? 'success' : wasmStatus === 'error' ? 'error' : 'warning';

  const syncLabel =
    backendStatus === 'online_synced'
      ? 'API Synced'
      : backendStatus === 'probing'
        ? 'Syncing...'
        : 'Local Mode';
  const syncDotClass = backendStatus === 'online_synced' ? 'success' : 'warning';

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <header className="top-nav">
        <NavLink to="/" className="brand-link" aria-label="TIANEDGE Home">
          <span className="brand-emblem" aria-hidden="true">
            <Cpu size={14} />
          </span>
          <span>TIANEDGE</span>
        </NavLink>

        <nav className="nav-links" aria-label="Primary navigation">
          {PRIMARY_ROUTES.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav-utilities">
          <span className="status-pill hide-compact" title="Rust/WASM CPU engine runtime status">
            <span className={`status-dot ${wasmDotClass}`} aria-hidden="true" />
            <span>{wasmLabel}</span>
          </span>

          <span
            className="status-pill hide-compact"
            title="Educational content delivery status (100% functional offline)"
          >
            <span className={`status-dot ${syncDotClass}`} aria-hidden="true" />
            <span>{syncLabel}</span>
          </span>

          <button
            type="button"
            className="btn btn-sm"
            onClick={toggleReducedMotion}
            aria-pressed={reducedMotion}
            aria-label={reducedMotion ? 'Resume animations (motion paused)' : 'Pause animations (reduced motion)'}
            title="Toggle reduced motion (pauses idle rotation and signal pulsing)"
          >
            {reducedMotion ? <Play size={13} /> : <Pause size={13} />}
            <span className="hide-compact">{reducedMotion ? 'Motion Paused' : 'Motion Active'}</span>
          </button>

          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => setShortcutsOpen(true)}
            aria-label="Keyboard shortcuts help"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard size={15} />
          </button>
        </div>
      </header>

      <main id="main-content" className="main-content" tabIndex={-1}>
        {children}
      </main>

      <Modal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} title="Keyboard Shortcuts">
        <div style={{ display: 'grid', gap: '12px', fontSize: '0.875rem' }}>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            Navigate TIANEDGE exploration and simulation views efficiently using keyboard controls:
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {[
                ['?', 'Open this Keyboard Shortcuts reference'],
                ['Esc', 'Close modals or clear component isolation'],
                ['Space', 'Run / Pause CPU Simulator (when editor is unfocused)'],
                ['F10 / Shift+S', 'Step one canonical stage in CPU Simulator'],
                ['Shift+R', 'Reset CPU Simulator state'],
                ['Arrow Left / Right', 'Step Backward / Forward in Instruction Journey'],
              ].map(([key, desc]) => (
                <tr key={key} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '8px 4px', width: '150px' }}>
                    <kbd className="badge badge-cyan">{key}</kbd>
                  </td>
                  <td style={{ padding: '8px 4px', color: 'var(--text-secondary)' }}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}
