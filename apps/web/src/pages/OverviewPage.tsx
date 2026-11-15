import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Compass, Cpu, GitBranch, Layers } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Panel } from '../components/ui/Panel';
import { trackAnalyticsEvent } from '../content/analyticsClient';
import { useContentStore } from '../content/useContentStore';
import { CpuSceneCanvas } from '../scene/CpuSceneCanvas';
import type { VisualizationMode } from '../types/models';

export function OverviewPage() {
  const navigate = useNavigate();
  const { bundle, initContent } = useContentStore();
  const [heroMode, setHeroMode] = useState<VisualizationMode>('full_assembly');

  useEffect(() => {
    void initContent();
    trackAnalyticsEvent('section_viewed', 'overview', 'landing');
  }, [initContent]);

  const components = bundle?.components ?? [];
  const insightCount = bundle?.insights.length ?? 13;

  return (
    <div className="te-page-container lab-grid-bg">
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '24px',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Badge tone="cyan">SEMICONDUCTOR &amp; PROCESSOR EXPLORER</Badge>
            <Badge tone="gold">TIAN-ISA v1 EDUCATIONAL ARCHITECTURE</Badge>
          </div>

          <h1 style={{ fontSize: 'clamp(1.9rem, 3.2vw, 2.75rem)', lineHeight: 1.15 }}>
            Explore the Architecture.
            <br />
            <span style={{ color: 'var(--accent-primary)' }}>Understand the Intelligence.</span>
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', maxWidth: '58ch' }}>
            TIANEDGE connects an interactive 3D hardware dissection workbench, structured engineering
            explanations, and a deterministic Rust/WebAssembly CPU execution engine into one unified
            offline-ready engineering platform.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '4px' }}>
            <Link to="/anatomy" className="te-btn te-btn-primary">
              <Layers size={16} aria-hidden="true" />
              <span>Explore 3D Chip Anatomy</span>
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <Link to="/journey" className="te-btn te-btn-gold">
              <GitBranch size={16} aria-hidden="true" />
              <span>Follow Instruction Journey</span>
            </Link>
            <Link to="/simulator" className="te-btn">
              <Cpu size={16} aria-hidden="true" />
              <span>Open CPU Simulator</span>
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '10px',
              marginTop: '8px',
            }}
          >
            <Panel style={{ padding: '10px 12px' }}>
              <div className="mono" style={{ fontSize: '1.15rem', color: 'var(--accent-primary)' }}>
                {components.length || 36}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                3D Components &amp; Subsystems
              </div>
            </Panel>
            <Panel style={{ padding: '10px 12px' }}>
              <div className="mono" style={{ fontSize: '1.15rem', color: 'var(--accent-warm-gold)' }}>
                6-Stage
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                Rust/WASM Sequential Core
              </div>
            </Panel>
            <Panel style={{ padding: '10px 12px' }}>
              <div className="mono" style={{ fontSize: '1.15rem', color: '#6EE7B7' }}>
                {insightCount}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                Engineering Insights Topics
              </div>
            </Panel>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <CpuSceneCanvas
              components={components}
              isOverviewHero
              modeOverride={heroMode}
              heightClassName="te-canvas-hero"
              onSelectComponent={(comp) => {
                navigate(`/anatomy?component=${encodeURIComponent(comp.id)}`);
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                right: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                pointerEvents: 'none',
              }}
            >
              <Badge tone="cyan">INTERACTIVE 3D STAGE — CLICK ANY COMPONENT</Badge>
              <div style={{ display: 'flex', gap: '6px', pointerEvents: 'auto' }}>
                <button
                  type="button"
                  className={`te-btn te-btn-sm ${heroMode === 'full_assembly' ? 'te-btn-primary' : ''}`}
                  onClick={() => setHeroMode('full_assembly')}
                >
                  Assembled
                </button>
                <button
                  type="button"
                  className={`te-btn te-btn-sm ${heroMode === 'exploded_view' ? 'te-btn-primary' : ''}`}
                  onClick={() => setHeroMode('exploded_view')}
                >
                  Exploded Layers
                </button>
              </div>
            </div>
          </div>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Conceptual educational microprocessor model (not a proprietary vendor CAD layout or
            transistor-level SPICE simulator). Drag to orbit, scroll to zoom.
          </p>
        </div>
      </section>

      <section
        aria-label="Core platform pillars"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        <Panel style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)' }}>
            <Compass size={18} aria-hidden="true" />
            <h2 style={{ fontSize: '1.08rem' }}>1. Explore — 3D Dissection</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', flex: 1 }}>
            Peel back the nickel IHS lid, flip-chip C4 solder bumps, silicon die floorplan, core
            execution units, memory hierarchy, and conceptual digital logic primitives.
          </p>
          <Link to="/anatomy" className="te-btn te-btn-sm" style={{ alignSelf: 'flex-start' }}>
            Open Chip Anatomy
          </Link>
        </Panel>

        <Panel style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-warm-gold)' }}>
            <BookOpen size={18} aria-hidden="true" />
            <h2 style={{ fontSize: '1.08rem' }}>2. Understand — Grounded Theory</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', flex: 1 }}>
            Study 13 sequenced Engineering Insights, 6 quantitative semiconductor &amp; performance
            equations with KaTeX notation, 48 glossary definitions, and technical SVG schematics.
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link to="/insights" className="te-btn te-btn-sm">
              Engineering Insights
            </Link>
            <Link to="/library" className="te-btn te-btn-sm">
              Technical Library
            </Link>
          </div>
        </Panel>

        <Panel style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6EE7B7' }}>
            <Cpu size={18} aria-hidden="true" />
            <h2 style={{ fontSize: '1.08rem' }}>3. Experience — Live Execution</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', flex: 1 }}>
            Write and assemble TIAN-ISA v1 programs inside a dedicated Web Worker backed by pure
            Rust/WebAssembly, watching registers, ALU flags, memory, and 3D signal packets advance
            stage-by-stage.
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link to="/journey" className="te-btn te-btn-sm">
              Instruction Journey
            </Link>
            <Link to="/simulator" className="te-btn te-btn-sm">
              CPU Simulator
            </Link>
          </div>
        </Panel>
      </section>
    </div>
  );
}
