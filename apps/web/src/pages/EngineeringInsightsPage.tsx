import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, Cpu, Layers, Search } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { KatexFormula } from '../components/ui/KatexFormula';
import { Panel } from '../components/ui/Panel';
import { ErrorStateView, LoadingStateView } from '../components/ui/StateViews';
import { trackTelemetryEvent } from '../content/contentService';
import { useContentStore } from '../content/useContentStore';
import { useAppStore } from '../stores/useAppStore';
import { useSimulatorStore } from '../stores/useSimulatorStore';

function resolveAssetPath(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${cleanBase}${path.startsWith('/') ? path : `/${path}`}`;
}

export function EngineeringInsightsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { bundle, loading, error, initContent } = useContentStore();
  const backendOnline = useAppStore((s) => s.backendStatus === 'online_synced');
  const selectPreset = useSimulatorStore((s) => s.selectPreset);

  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    void initContent();
  }, [initContent]);

  const insights = useMemo(() => bundle?.insights ?? [], [bundle]);
  const componentsById = useMemo(
    () => new Map((bundle?.components ?? []).map((c) => [c.id, c])),
    [bundle],
  );
  const diagramsById = useMemo(
    () => new Map((bundle?.diagrams ?? []).map((d) => [d.id, d])),
    [bundle],
  );
  const formulasById = useMemo(
    () => new Map((bundle?.formulas ?? []).map((f) => [f.id, f])),
    [bundle],
  );
  const citationsById = useMemo(
    () => new Map((bundle?.citations ?? []).map((c) => [c.id, c])),
    [bundle],
  );

  const requestedId = searchParams.get('topic');
  const selectedTopic = useMemo(() => {
    if (insights.length === 0) return null;
    if (requestedId) {
      const exact = insights.find((t) => t.id === requestedId);
      if (exact) return exact;
    }
    return insights[0];
  }, [insights, requestedId]);

  useEffect(() => {
    if (selectedTopic) {
      trackTelemetryEvent('insight_opened', 'insights', selectedTopic.id, backendOnline);
    }
  }, [selectedTopic, backendOnline]);

  const filteredTopics = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return insights;
    return insights.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.technicalDefinition.toLowerCase().includes(q) ||
        t.learningObjective.toLowerCase().includes(q),
    );
  }, [insights, filterText]);

  const handleOpenSimulatorPreset = async (presetId: string) => {
    await selectPreset(presetId);
    navigate('/simulator');
  };

  if (loading && !bundle) {
    return <LoadingStateView label="Loading 13 Engineering Insights topics..." />;
  }

  if (error) {
    return (
      <div className="te-page-container">
        <ErrorStateView message={error} onRetry={() => void initContent()} />
      </div>
    );
  }

  const diagram = selectedTopic?.diagramId ? diagramsById.get(selectedTopic.diagramId) : undefined;
  const topicFormulas = (selectedTopic?.formulaIds ?? [])
    .map((fid) => formulasById.get(fid))
    .filter((f): f is NonNullable<typeof f> => Boolean(f));

  return (
    <div className="te-page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <Badge tone="gold">STRUCTURED CONCEPTUAL FOUNDATION</Badge>
          <h1 style={{ fontSize: '1.65rem', marginTop: '6px' }}>
            Engineering Insights ({insights.length} Core Topics)
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Bridging silicon physics, hardware microarchitecture, and instruction execution with
            verified mathematical models and 3D hardware inspection links.
          </p>
        </div>
      </div>

      <div className="te-two-col-rail">
        {/* Topic Index Rail */}
        <Panel
          className="te-scroll-pane"
          style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}
          ariaLabel="13 Engineering Insights Topic Selector"
        >
          <label style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search
              size={14}
              style={{ position: 'absolute', left: '9px', color: 'var(--text-muted)' }}
              aria-hidden="true"
            />
            <input
              type="search"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter 13 engineering topics..."
              aria-label="Filter engineering insights topics"
              style={{
                width: '100%',
                padding: '6px 10px 6px 28px',
                background: 'var(--bg-canvas)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
              }}
            />
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {filteredTopics.map((topic) => {
              const active = topic.id === selectedTopic?.id;
              return (
                <button
                  key={topic.id}
                  type="button"
                  aria-current={active ? 'true' : undefined}
                  onClick={() => setSearchParams({ topic: topic.id })}
                  className="te-btn"
                  style={{
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    padding: '8px 10px',
                    borderColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
                    background: active ? 'rgba(0, 229, 255, 0.14)' : 'rgba(13, 17, 25, 0.7)',
                    color: active ? '#E0FAFF' : 'var(--text-secondary)',
                  }}
                >
                  <span className="mono" style={{ color: 'var(--accent-warm-gold)', minWidth: '24px' }}>
                    {String(topic.order).padStart(2, '0')}
                  </span>
                  <span style={{ fontSize: '0.83rem' }}>{topic.title}</span>
                </button>
              );
            })}
          </div>
        </Panel>

        {/* Detailed Engineering Article */}
        {selectedTopic ? (
          <Panel
            style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}
            ariaLabel={selectedTopic.title}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <Badge tone="cyan">
                TOPIC {selectedTopic.order} OF {insights.length}
              </Badge>
              <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {selectedTopic.id}
              </span>
            </div>

            <h2 style={{ fontSize: '1.45rem' }}>{selectedTopic.title}</h2>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                borderLeft: '3px solid var(--accent-primary)',
                background: 'rgba(0, 229, 255, 0.08)',
              }}
            >
              <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--accent-primary)' }}>
                LEARNING OBJECTIVE
              </div>
              <p style={{ marginTop: '4px', fontSize: '0.92rem' }}>
                {selectedTopic.learningObjective}
              </p>
            </div>

            <section style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <h3 style={{ fontSize: '0.92rem', color: 'var(--accent-primary)' }}>
                Technical Definition
              </h3>
              <p style={{ fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                {selectedTopic.technicalDefinition}
              </p>
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <h3 style={{ fontSize: '0.92rem', color: 'var(--accent-primary)' }}>
                Engineering Explanation
              </h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                {selectedTopic.engineeringExplanation}
              </p>
            </section>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(251, 191, 36, 0.45)',
                background: 'rgba(251, 191, 36, 0.08)',
              }}
            >
              <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--accent-warm-gold)' }}>
                GENERAL PRINCIPLE VS. PROPRIETARY VENDORS
              </div>
              <p style={{ marginTop: '4px', fontSize: '0.86rem', color: '#FDE68A' }}>
                {selectedTopic.generalVsVendorNote}
              </p>
            </div>

            {diagram && (
              <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h3 style={{ fontSize: '0.92rem', color: 'var(--accent-primary)' }}>
                  Schematic Diagram — {diagram.title}
                </h3>
                <div
                  style={{
                    background: '#080c14',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    padding: '12px',
                  }}
                >
                  <img
                    src={resolveAssetPath(diagram.svgAssetPath)}
                    alt={diagram.title}
                    style={{ width: '100%', maxHeight: '340px', objectFit: 'contain' }}
                  />
                  <p style={{ marginTop: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {diagram.caption}
                  </p>
                </div>
              </section>
            )}

            {topicFormulas.length > 0 && (
              <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '0.92rem', color: 'var(--accent-primary)' }}>
                  Quantitative Engineering Relationships
                </h3>
                {topicFormulas.map((formula) => (
                  <Panel
                    key={formula.id}
                    style={{ padding: '14px', background: 'rgba(13, 17, 25, 0.8)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '0.95rem' }}>{formula.name}</strong>
                      <Link to="/library?tab=formulas" className="te-btn te-btn-sm">
                        Full Derivation &amp; Units
                      </Link>
                    </div>
                    <KatexFormula latex={formula.latex} ariaLabel={formula.name} />
                    <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                      <strong>Worked Example:</strong> {formula.workedExample}
                    </p>
                  </Panel>
                ))}
              </section>
            )}

            <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h3 style={{ fontSize: '0.92rem', color: 'var(--accent-primary)' }}>
                Connected Hardware &amp; Live Workbench
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedTopic.relatedComponentIds.map((compId) => {
                  const comp = componentsById.get(compId);
                  return (
                    <Link
                      key={compId}
                      to={`/anatomy?component=${encodeURIComponent(compId)}`}
                      className="te-btn te-btn-sm"
                    >
                      <Layers size={13} aria-hidden="true" />
                      <span>Inspect {comp ? comp.name : compId}</span>
                    </Link>
                  );
                })}
                {selectedTopic.simulatorPresetId && (
                  <button
                    type="button"
                    className="te-btn te-btn-sm te-btn-primary"
                    onClick={() =>
                      void handleOpenSimulatorPreset(selectedTopic.simulatorPresetId!)
                    }
                  >
                    <Cpu size={13} aria-hidden="true" />
                    <span>Launch Related Simulator Preset</span>
                  </button>
                )}
              </div>
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <h3 style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Primary Academic References
              </h3>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {selectedTopic.citationIds.map((cid) => {
                  const cite = citationsById.get(cid);
                  if (!cite) return <li key={cid}>{cid}</li>;
                  return (
                    <li key={cid}>
                      <strong>{cite.authors}</strong> ({cite.year}). <em>{cite.title}</em>.{' '}
                      {cite.publication}
                      {cite.sectionOrChapter ? ` (${cite.sectionOrChapter})` : ''}.
                    </li>
                  );
                })}
              </ul>
              <Link to="/library?tab=citations" className="te-btn te-btn-sm" style={{ alignSelf: 'flex-start' }}>
                <BookOpen size={13} aria-hidden="true" />
                <span>View Complete Bibliography</span>
              </Link>
            </section>
          </Panel>
        ) : (
          <Panel style={{ padding: '24px' }}>No matching topics found.</Panel>
        )}
      </div>
    </div>
  );
}
