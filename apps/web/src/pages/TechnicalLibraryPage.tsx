import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, BookMarked, Cpu, FileText, GitCommit, Layers, Search } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { KatexFormula } from '../components/ui/KatexFormula';
import { Panel } from '../components/ui/Panel';
import { RepresentationBadge } from '../components/ui/RepresentationBadge';
import { ErrorStateView, LoadingStateView } from '../components/ui/StateViews';
import { searchLibraryHybrid } from '../content/contentService';
import type { SearchCategory } from '../content/search';
import { useContentStore } from '../content/useContentStore';
import { useAppStore } from '../stores/useAppStore';
import type { LibrarySearchItem } from '../types/models';

type LibraryTab =
  | 'components'
  | 'glossary'
  | 'fundamentals'
  | 'references'
  | 'diagrams'
  | 'formulas'
  | 'paths'
  | 'citations';

const TABS: { id: LibraryTab; label: string }[] = [
  { id: 'components', label: 'Encyclopedia (36)' },
  { id: 'glossary', label: 'Glossary (48)' },
  { id: 'fundamentals', label: 'Fundamentals (5)' },
  { id: 'references', label: 'References (3)' },
  { id: 'diagrams', label: 'Diagrams (6)' },
  { id: 'formulas', label: 'Formulas (6)' },
  { id: 'paths', label: 'Learning Paths (4)' },
  { id: 'citations', label: 'Citations & Assets' },
];

function resolveAssetPath(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${cleanBase}${path.startsWith('/') ? path : `/${path}`}`;
}

export function TechnicalLibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { bundle, loading, error, initContent } = useContentStore();
  const backendOnline = useAppStore((s) => s.backendStatus === 'online_synced');

  const requestedTab = (searchParams.get('tab') as LibraryTab | null) ?? 'components';
  const activeTab: LibraryTab = TABS.some((t) => t.id === requestedTab) ? requestedTab : 'components';

  const [query, setQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState<SearchCategory>('all');
  const [searchResults, setSearchResults] = useState<LibrarySearchItem[]>([]);
  const [glossaryFilter, setGlossaryFilter] = useState<string>('all');

  useEffect(() => {
    void initContent();
  }, [initContent]);

  useEffect(() => {
    if (!bundle) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    void searchLibraryHybrid(bundle, trimmed, searchCategory, 20, backendOnline).then((res) => {
      if (!cancelled) {
        setSearchResults(res.results);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [bundle, query, searchCategory, backendOnline]);

  const setTab = (tab: LibraryTab) => {
    setSearchParams({ tab }, { replace: true });
  };

  if (loading && !bundle) {
    return <LoadingStateView label="Loading Technical Library encyclopedia, formulas, and glossary..." />;
  }

  if (error || !bundle) {
    return (
      <div className="te-page-container">
        <ErrorStateView
          message={error ?? 'Educational dataset bundle unavailable.'}
          onRetry={() => void initContent()}
        />
      </div>
    );
  }

  const filteredGlossary =
    glossaryFilter === 'all'
      ? bundle.glossary
      : bundle.glossary.filter((g) => g.category === glossaryFilter);

  return (
    <div className="te-page-container">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Badge tone="cyan">OFFLINE-FIRST TECHNICAL KNOWLEDGE BASE</Badge>
        <h1 style={{ fontSize: '1.65rem' }}>Technical Library</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          Search across all {bundle.components.length} chip components, {bundle.insights.length}{' '}
          engineering insights, {bundle.glossary.length} glossary entries,{' '}
          {bundle.formulas.length} quantitative formulas, technical diagrams, and guided curricula.
        </p>
      </div>

      {/* Unified Offline/Hybrid Search Bar */}
      <Panel style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <label style={{ flex: 1, minWidth: '240px', position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '10px', color: 'var(--accent-primary)' }}
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search components, CMOS, ALU, cache, pipelining, formulas..."
              aria-label="Search Technical Library"
              style={{
                width: '100%',
                padding: '9px 12px 9px 34px',
                background: 'var(--bg-canvas)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
              }}
            />
          </label>
          <select
            aria-label="Filter search category"
            value={searchCategory}
            onChange={(e) => setSearchCategory(e.target.value as SearchCategory)}
            style={{
              padding: '8px 12px',
              background: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.84rem',
            }}
          >
            <option value="all">All Categories</option>
            <option value="components">Components</option>
            <option value="insights">Insights</option>
            <option value="glossary">Glossary</option>
            <option value="formulas">Formulas</option>
            <option value="fundamentals">Fundamentals</option>
          </select>
        </div>

        {query.trim().length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {searchResults.length} search match(es) ({backendOnline ? 'API + local fallback' : 'Offline local index'})
            </div>
            {searchResults.length === 0 ? (
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                No matches found for &ldquo;{query.trim()}&rdquo;.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
                {searchResults.map((hit) => (
                  <Link
                    key={`${hit.kind}-${hit.id}`}
                    to={hit.route}
                    className="panel"
                    style={{
                      padding: '10px 12px',
                      textDecoration: 'none',
                      color: 'inherit',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Badge tone="cyan">{hit.kind.toUpperCase()}</Badge>
                      <ArrowRight size={13} aria-hidden="true" />
                    </div>
                    <strong style={{ fontSize: '0.88rem' }}>{hit.title}</strong>
                    <span style={{ fontSize: '0.79rem', color: 'var(--text-secondary)' }}>
                      {hit.snippet.slice(0, 120)}...
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </Panel>

      {/* Module Tabs */}
      <div role="tablist" aria-label="Technical Library Modules" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={activeTab === tab.id}
            onClick={() => setTab(tab.id)}
            className={`te-btn te-btn-sm ${activeTab === tab.id ? 'te-btn-primary' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content Panels */}
      {activeTab === 'components' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '12px' }}>
          {bundle.components.map((comp) => (
            <Panel key={comp.id} style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' }}>
                <RepresentationBadge type={comp.representationType} />
                <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {comp.id}
                </span>
              </div>
              <h2 style={{ fontSize: '1.02rem' }}>{comp.name}</h2>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', flex: 1 }}>
                {comp.definition}
              </p>
              <Link
                to={`/anatomy?component=${encodeURIComponent(comp.id)}`}
                className="te-btn te-btn-sm"
                style={{ alignSelf: 'flex-start' }}
              >
                <Layers size={13} aria-hidden="true" />
                <span>Inspect in 3D Anatomy</span>
              </Link>
            </Panel>
          ))}
        </div>
      )}

      {activeTab === 'glossary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['all', 'architecture', 'semiconductor', 'memory', 'digital_logic', 'packaging'].map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setGlossaryFilter(cat)}
                  className={`te-btn te-btn-sm ${glossaryFilter === cat ? 'te-btn-gold' : ''}`}
                >
                  {cat.replace('_', ' ').toUpperCase()}
                </button>
              ),
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '10px' }}>
            {filteredGlossary.map((item) => (
              <Panel key={item.id} style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.96rem' }}>
                    {item.term} {item.acronym ? `(${item.acronym})` : ''}
                  </strong>
                  <Badge>{item.category}</Badge>
                </div>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                  {item.conciseDefinition}
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {item.technicalContext}
                </p>
              </Panel>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'fundamentals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {bundle.fundamentals.map((primer) => (
            <Panel key={primer.id} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
                <h2 style={{ fontSize: '1.18rem' }}>{primer.title}</h2>
              </div>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)' }}>{primer.summary}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                {primer.sections.map((sec) => (
                  <div
                    key={sec.heading}
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(13, 17, 25, 0.7)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--accent-warm-gold)', marginBottom: '6px' }}>
                      {sec.heading}
                    </h3>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>{sec.body}</p>
                  </div>
                ))}
              </div>
              <div>
                <strong style={{ fontSize: '0.82rem', color: 'var(--accent-primary)' }}>
                  Key Takeaways:
                </strong>
                <ul style={{ margin: '4px 0 0', paddingLeft: '18px', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  {primer.keyTakeaways.map((kt) => (
                    <li key={kt}>{kt}</li>
                  ))}
                </ul>
              </div>
            </Panel>
          ))}
        </div>
      )}

      {activeTab === 'references' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {bundle.references.map((ref) => {
            const columns = ref.comparisonRows[0] ? Object.keys(ref.comparisonRows[0]) : [];
            return (
              <Panel key={ref.id} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h2 style={{ fontSize: '1.15rem' }}>{ref.title}</h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{ref.summary}</p>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr>
                        {columns.map((col) => (
                          <th
                            key={col}
                            style={{
                              textAlign: 'left',
                              padding: '8px 10px',
                              borderBottom: '1px solid var(--border-active)',
                              color: 'var(--accent-primary)',
                            }}
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ref.comparisonRows.map((row, rIdx) => (
                        <tr key={rIdx}>
                          {columns.map((col) => (
                            <td
                              key={col}
                              style={{
                                padding: '8px 10px',
                                borderBottom: '1px solid var(--border-subtle)',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              {row[col]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#FDE68A' }}>
                  <strong>Scope Disclaimer:</strong> {ref.scopeDisclaimer}
                </p>
              </Panel>
            );
          })}
        </div>
      )}

      {activeTab === 'diagrams' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '16px' }}>
          {bundle.diagrams.map((diag) => (
            <Panel key={diag.id} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h2 style={{ fontSize: '1.05rem' }}>{diag.title}</h2>
              <div
                style={{
                  background: '#080c14',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  padding: '10px',
                }}
              >
                <img
                  src={resolveAssetPath(diag.svgAssetPath)}
                  alt={diag.title}
                  style={{ width: '100%', maxHeight: '280px', objectFit: 'contain' }}
                />
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>{diag.caption}</p>
              {diag.interactiveCallouts && diag.interactiveCallouts.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {diag.interactiveCallouts.map((c) =>
                    c.componentId ? (
                      <Link
                        key={c.label}
                        to={`/anatomy?component=${encodeURIComponent(c.componentId)}`}
                        className="te-btn te-btn-sm"
                        title={c.description}
                      >
                        {c.label}
                      </Link>
                    ) : (
                      <Badge key={c.label}>{c.label}</Badge>
                    ),
                  )}
                </div>
              )}
            </Panel>
          ))}
        </div>
      )}

      {activeTab === 'formulas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {bundle.formulas.map((f) => (
            <Panel key={f.id} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.15rem' }}>{f.name}</h2>
                <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  {f.id}
                </span>
              </div>
              <KatexFormula latex={f.latex} ariaLabel={f.name} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                {f.variables.map((v) => (
                  <div
                    key={v.symbol}
                    style={{
                      padding: '8px',
                      borderRadius: '4px',
                      background: 'rgba(13, 17, 25, 0.7)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.8rem',
                    }}
                  >
                    <strong className="mono" style={{ color: 'var(--accent-primary)' }}>
                      {v.symbol}
                    </strong>{' '}
                    ({v.name}, <span className="mono">{v.unit}</span>): {v.description}
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                <strong>Assumptions:</strong> {f.assumptions}
              </p>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                <strong>Applicability:</strong> {f.applicability}
              </p>
              <p style={{ fontSize: '0.84rem', color: '#6EE7B7' }}>
                <strong>Worked Example:</strong> {f.workedExample}
              </p>
            </Panel>
          ))}
        </div>
      )}

      {activeTab === 'paths' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
          {bundle.learningPaths.map((path) => (
            <Panel key={path.id} style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Badge tone="gold">{path.difficulty.toUpperCase()}</Badge>
                <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  ~{path.estimatedMinutes} min
                </span>
              </div>
              <h2 style={{ fontSize: '1.12rem' }}>{path.title}</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{path.summary}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {path.steps.map((st) => {
                  const dest =
                    st.targetId && st.targetRoute === '/anatomy'
                      ? `/anatomy?component=${encodeURIComponent(st.targetId)}`
                      : st.targetId && st.targetRoute === '/insights'
                        ? `/insights?topic=${encodeURIComponent(st.targetId)}`
                        : st.targetRoute;
                  return (
                    <Link
                      key={st.stepOrder}
                      to={dest}
                      className="te-btn te-btn-sm"
                      style={{ justifyContent: 'space-between', textAlign: 'left' }}
                    >
                      <span>
                        <strong>{st.stepOrder}.</strong> {st.title}
                      </span>
                      <GitCommit size={13} aria-hidden="true" />
                    </Link>
                  );
                })}
              </div>
            </Panel>
          ))}
        </div>
      )}

      {activeTab === 'citations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Panel style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookMarked size={18} style={{ color: 'var(--accent-warm-gold)' }} aria-hidden="true" />
              <h2 style={{ fontSize: '1.15rem' }}>
                Verified Technical Bibliography ({bundle.citations.length} Sources)
              </h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Every architectural explanation and formula in TIANEDGE references published textbooks,
              IEEE standards, or peer-reviewed literature. No invented or benchmark-fabricated claims
              are included.
            </p>
            <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {bundle.citations.map((cite) => (
                <li key={cite.id}>
                  <span className="mono" style={{ color: 'var(--accent-primary)' }}>
                    [{cite.id}]
                  </span>{' '}
                  <strong>{cite.authors}</strong> ({cite.year}). <em>{cite.title}</em>.{' '}
                  {cite.publication}
                  {cite.sectionOrChapter ? ` — ${cite.sectionOrChapter}` : ''}.
                </li>
              ))}
            </ol>
          </Panel>

          <Panel style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={16} style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
              <h2 style={{ fontSize: '1.05rem' }}>3D &amp; Technical Asset Provenance</h2>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              Original low-poly binary glTF 2.0 assets (<code>cpu_package_v1.glb</code>,{' '}
              <code>cpu_die_core_v1.glb</code>, <code>logic_foundation_v1.glb</code>) and vector
              SVG architectural schematics authored procedurally for TIANEDGE under the repository
              pipeline (`apps/web/scripts/generate_models.py`). All geometry is strictly conceptual
              for educational clarity.
            </p>
          </Panel>
        </div>
      )}
    </div>
  );
}
