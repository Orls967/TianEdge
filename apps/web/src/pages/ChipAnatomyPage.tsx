import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronRight, Eye, EyeOff, RotateCcw, Search } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Panel } from '../components/ui/Panel';
import { RepresentationBadge } from '../components/ui/RepresentationBadge';
import { ErrorStateView, LoadingStateView } from '../components/ui/StateViews';
import { trackAnalyticsEvent } from '../content/analyticsClient';
import { useContentStore } from '../content/useContentStore';
import { CpuSceneCanvas } from '../scene/CpuSceneCanvas';
import { useAnatomyStore } from '../stores/useAnatomyStore';
import type { ChipComponent, ComponentGroupId, VisualizationMode } from '../types/models';

const GROUP_LABELS: Record<ComponentGroupId, string> = {
  'cpu-package': 'A. CPU Package',
  'silicon-die': 'B. Silicon Die Floorplan',
  'processing-core': 'C. Processing Core',
  'memory-hierarchy': 'D. Memory Hierarchy',
  'digital-logic': 'E. Digital Logic Foundations',
  'communication-control': 'F. Communication & Control',
};

const GROUP_ORDER: ComponentGroupId[] = [
  'cpu-package',
  'silicon-die',
  'processing-core',
  'memory-hierarchy',
  'digital-logic',
  'communication-control',
];

const MODE_OPTIONS: { id: VisualizationMode; label: string }[] = [
  { id: 'full_assembly', label: 'Full Assembly' },
  { id: 'exploded_view', label: 'Exploded View' },
  { id: 'section_cut', label: 'Section Cut' },
  { id: 'component_isolation', label: 'Isolate' },
  { id: 'internal_architecture', label: 'Internal Architecture' },
  { id: 'signal_flow', label: 'Signal Flow' },
];

export function ChipAnatomyPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { bundle, loading, error, initContent } = useContentStore();
  const {
    selectedComponentId,
    hoveredComponentId,
    visualizationMode,
    sliceOffset,
    hiddenComponents,
    hiddenGroups,
    logicPodNoticeDismissed,
    selectComponent,
    setVisualizationMode,
    setSliceOffset,
    toggleComponentVisibility,
    toggleGroupVisibility,
    showAllComponents,
    resetCamera,
    dismissLogicPodNotice,
  } = useAnatomyStore();

  const [filterText, setFilterText] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    void initContent();
    trackAnalyticsEvent('section_viewed', 'anatomy', 'workbench');
  }, [initContent]);

  const components = useMemo(() => bundle?.components ?? [], [bundle]);
  const insightsById = useMemo(
    () => new Map((bundle?.insights ?? []).map((t) => [t.id, t])),
    [bundle],
  );
  const citationsById = useMemo(
    () => new Map((bundle?.citations ?? []).map((c) => [c.id, c])),
    [bundle],
  );

  // Sync URL query params (?component=...&mode=...) once components are loaded
  useEffect(() => {
    if (components.length === 0) return;
    const requestedComp = searchParams.get('component');
    const requestedMode = searchParams.get('mode') as VisualizationMode | null;

    if (requestedMode && MODE_OPTIONS.some((m) => m.id === requestedMode)) {
      setVisualizationMode(requestedMode);
    }

    if (requestedComp) {
      const target = components.find((c) => c.id === requestedComp);
      if (target && selectedComponentId !== target.id) {
        selectComponent(target.id, target.modelReference.cameraPreset);
      }
    } else if (!selectedComponentId) {
      const defaultComp = components[0];
      if (defaultComp) {
        selectComponent(defaultComp.id, defaultComp.modelReference.cameraPreset, false);
      }
    }
  }, [
    components,
    searchParams,
    selectedComponentId,
    selectComponent,
    setVisualizationMode,
  ]);

  // Keyboard shortcut 'R' resets camera when focus is not inside an input
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'r' || e.key === 'R') {
        resetCamera();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [resetCamera]);

  const selectedComponent = useMemo(
    () => components.find((c) => c.id === selectedComponentId) ?? components[0] ?? null,
    [components, selectedComponentId],
  );

  const hoveredComponent = useMemo(
    () => components.find((c) => c.id === hoveredComponentId) ?? null,
    [components, hoveredComponentId],
  );

  const filteredComponents = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return components;
    return components.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.definition.toLowerCase().includes(q),
    );
  }, [components, filterText]);

  const handleChooseComponent = (comp: ChipComponent) => {
    selectComponent(comp.id, comp.modelReference.cameraPreset);
    setSearchParams({ component: comp.id, mode: visualizationMode }, { replace: true });
    trackAnalyticsEvent('component_selected', 'anatomy', comp.id);
  };

  const handleModeChange = (mode: VisualizationMode) => {
    setVisualizationMode(mode);
    if (selectedComponent) {
      setSearchParams({ component: selectedComponent.id, mode }, { replace: true });
    }
    trackAnalyticsEvent('mode_changed', 'anatomy', mode);
  };

  if (loading && !bundle) {
    return <LoadingStateView label="Loading 36 microprocessor components and 3D assets..." />;
  }

  if (error) {
    return <ErrorStateView message={error} onRetry={() => void initContent()} />;
  }

  const isDigitalLogicActive = selectedComponent?.groupId === 'digital-logic';
  const hiddenCount =
    Object.values(hiddenComponents).filter(Boolean).length +
    Object.values(hiddenGroups).filter(Boolean).length;

  return (
    <div className="te-anatomy-shell">
      {/* Left Navigation Tree */}
      <Panel
        className="te-scroll-pane"
        style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}
        ariaLabel="Hardware Component Hierarchy Tree"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '0.96rem', letterSpacing: '0.02em' }}>
            Chip Anatomy ({components.length})
          </h1>
          {hiddenCount > 0 && (
            <button type="button" className="te-btn te-btn-sm" onClick={showAllComponents}>
              Show All
            </button>
          )}
        </div>

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
            placeholder="Filter 36 components..."
            aria-label="Filter chip components"
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

        <div role="tree" aria-label="Microprocessor components by group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {GROUP_ORDER.map((groupId) => {
            const items = filteredComponents.filter((c) => c.groupId === groupId);
            if (items.length === 0) return null;
            const collapsed = Boolean(collapsedGroups[groupId]);
            const groupHidden = Boolean(hiddenGroups[groupId]);

            return (
              <div
                key={groupId}
                role="treeitem"
                aria-expanded={!collapsed}
                style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(13, 17, 25, 0.7)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    borderBottom: collapsed ? 'none' : '1px solid rgba(148,163,184,0.1)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }))
                    }
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      fontSize: '0.79rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                    <span>{GROUP_LABELS[groupId]}</span>
                    <span className="mono" style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                      ({items.length})
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={groupHidden ? `Show ${GROUP_LABELS[groupId]}` : `Hide ${GROUP_LABELS[groupId]}`}
                    onClick={() => toggleGroupVisibility(groupId)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: groupHidden ? 'var(--text-muted)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      padding: '2px',
                    }}
                  >
                    {groupHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>

                {!collapsed && (
                  <div role="group" style={{ display: 'flex', flexDirection: 'column', padding: '4px' }}>
                    {items.map((comp) => {
                      const isSelected = comp.id === selectedComponent?.id;
                      const isHidden = Boolean(hiddenComponents[comp.id]);
                      return (
                        <div
                          key={comp.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '4px',
                            borderRadius: '4px',
                            background: isSelected ? 'rgba(0, 229, 255, 0.14)' : 'transparent',
                            border: isSelected
                              ? '1px solid rgba(0, 229, 255, 0.45)'
                              : '1px solid transparent',
                          }}
                        >
                          <button
                            type="button"
                            role="treeitem"
                            aria-selected={isSelected}
                            onClick={() => handleChooseComponent(comp)}
                            style={{
                              flex: 1,
                              textAlign: 'left',
                              background: 'transparent',
                              border: 'none',
                              padding: '5px 7px',
                              color: isSelected ? '#e0faff' : 'var(--text-secondary)',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              opacity: isHidden ? 0.45 : 1,
                            }}
                          >
                            {comp.name}
                          </button>
                          <button
                            type="button"
                            aria-label={isHidden ? `Show ${comp.name}` : `Hide ${comp.name}`}
                            onClick={() => toggleComponentVisibility(comp.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: isHidden ? 'var(--text-muted)' : 'var(--text-secondary)',
                              cursor: 'pointer',
                              padding: '4px 6px',
                            }}
                          >
                            {isHidden ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Center Interactive 3D Viewport */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', minHeight: '540px' }}>
        <CpuSceneCanvas
          components={components}
          onSelectComponent={handleChooseComponent}
          heightClassName="te-canvas-frame"
        />

        {/* Floating Visualization Mode Toolbar */}
        <div
          role="toolbar"
          aria-label="3D Visualization Modes"
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            right: '12px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            alignItems: 'center',
            justifyContent: 'space-between',
            pointerEvents: 'none',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', pointerEvents: 'auto' }}>
            {MODE_OPTIONS.map((mode) => (
              <button
                key={mode.id}
                type="button"
                aria-pressed={visualizationMode === mode.id}
                onClick={() => handleModeChange(mode.id)}
                className={`te-btn te-btn-sm ${
                  visualizationMode === mode.id ? 'te-btn-primary' : ''
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="te-btn te-btn-sm"
            style={{ pointerEvents: 'auto' }}
            onClick={resetCamera}
            title="Reset Camera (R)"
          >
            <RotateCcw size={13} aria-hidden="true" />
            <span>Reset View</span>
          </button>
        </div>

        {/* Bottom Floating HUD: Section Cut Slider & Hover Readout */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            right: '12px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            justifyContent: 'space-between',
            alignItems: 'center',
            pointerEvents: 'none',
          }}
        >
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {hoveredComponent && (
              <Badge tone="cyan">Hover: {hoveredComponent.name}</Badge>
            )}
            {isDigitalLogicActive && !logicPodNoticeDismissed && (
              <div
                className="panel-glass"
                style={{
                  pointerEvents: 'auto',
                  padding: '6px 10px',
                  fontSize: '0.76rem',
                  color: '#FDE68A',
                  borderColor: 'rgba(245, 158, 11, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>
                  Digital Logic primitives render inside an enlarged conceptual pod (not at
                  physical nanometer scale).
                </span>
                <button
                  type="button"
                  className="te-btn te-btn-sm"
                  onClick={dismissLogicPodNotice}
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>

          {visualizationMode === 'section_cut' && (
            <Panel
              glass
              style={{
                pointerEvents: 'auto',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <label htmlFor="section-cut-slider" className="mono" style={{ fontSize: '0.75rem' }}>
                Slice Offset: {Math.round(sliceOffset * 100)}%
              </label>
              <input
                id="section-cut-slider"
                type="range"
                min={0}
                max={100}
                value={Math.round(sliceOffset * 100)}
                onChange={(e) => setSliceOffset(Number(e.target.value) / 100)}
              />
            </Panel>
          )}
        </div>
      </div>

      {/* Right Technical Inspector Drawer (15 Canonical Fields) */}
      <Panel
        className="te-scroll-pane"
        style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}
        ariaLabel="Component Technical Dossier"
      >
        {selectedComponent ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                <RepresentationBadge type={selectedComponent.representationType} />
                <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  {selectedComponent.id}
                </span>
              </div>
              <h2 style={{ fontSize: '1.22rem' }}>{selectedComponent.name}</h2>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="te-btn te-btn-sm te-btn-primary"
                  onClick={() => {
                    handleModeChange('component_isolation');
                    selectComponent(
                      selectedComponent.id,
                      selectedComponent.modelReference.cameraPreset,
                    );
                  }}
                >
                  Isolate in 3D
                </button>
                <button
                  type="button"
                  className="te-btn te-btn-sm"
                  onClick={() => handleModeChange('full_assembly')}
                >
                  Show Assembly
                </button>
              </div>
            </div>

            {selectedComponent.scaleDisclaimer && (
              <div
                style={{
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(245, 158, 11, 0.55)',
                  background: 'rgba(245, 158, 11, 0.1)',
                  fontSize: '0.8rem',
                  color: '#FDE68A',
                }}
              >
                <strong>Scale &amp; Abstraction Notice:</strong> {selectedComponent.scaleDisclaimer}
              </div>
            )}

            <section style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <h3 style={{ fontSize: '0.82rem', color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                Definition &amp; Primary Function
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                {selectedComponent.definition}
              </p>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                <strong>Function:</strong> {selectedComponent.primaryFunction}
              </p>
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <h3 style={{ fontSize: '0.82rem', color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                Engineering Principles
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                {selectedComponent.engineeringPrinciples}
              </p>
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <h3 style={{ fontSize: '0.82rem', color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                Construction &amp; Operation
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                <strong>Construction:</strong> {selectedComponent.construction}
              </p>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                <strong>Operation:</strong> {selectedComponent.operation}
              </p>
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <h3 style={{ fontSize: '0.82rem', color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                Internal Structure
              </h3>
              <ul style={{ paddingLeft: '18px', fontSize: '0.83rem', color: 'var(--text-secondary)', margin: 0 }}>
                {selectedComponent.internalStructure.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <h3 style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Inputs
                </h3>
                <ul style={{ paddingLeft: '14px', fontSize: '0.79rem', color: 'var(--text-secondary)', margin: 0 }}>
                  {selectedComponent.inputs.map((inp) => (
                    <li key={inp}>{inp}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Outputs
                </h3>
                <ul style={{ paddingLeft: '14px', fontSize: '0.79rem', color: 'var(--text-secondary)', margin: 0 }}>
                  {selectedComponent.outputs.map((out) => (
                    <li key={out}>{out}</li>
                  ))}
                </ul>
              </div>
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <h3 style={{ fontSize: '0.82rem', color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                Key Parameters
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {selectedComponent.parameters.map((param) => (
                  <div
                    key={param.key}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '8px',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      background: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.8rem',
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>{param.label}</span>
                    <span className="mono" style={{ color: 'var(--text-primary)', textAlign: 'right' }}>
                      {param.value} {param.unit ?? ''}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <h3 style={{ fontSize: '0.82rem', color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                Architectural Relationships
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedComponent.relationships.map((rel) => {
                  const target = components.find((c) => c.id === rel.targetComponentId);
                  return (
                    <button
                      key={`${rel.relationType}-${rel.targetComponentId}`}
                      type="button"
                      onClick={() => target && handleChooseComponent(target)}
                      className="te-btn te-btn-sm"
                      style={{
                        justifyContent: 'space-between',
                        textAlign: 'left',
                        width: '100%',
                        padding: '6px 8px',
                      }}
                    >
                      <span className="mono" style={{ color: 'var(--accent-warm-gold)', fontSize: '0.72rem' }}>
                        {rel.relationType}
                      </span>
                      <span>{target ? target.name : rel.targetComponentId}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <h3 style={{ fontSize: '0.82rem', color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                Real-World Engineering Context
              </h3>
              <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                {selectedComponent.realWorldContext}
              </p>
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <h3 style={{ fontSize: '0.82rem', color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                Related Engineering Insights
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {selectedComponent.relatedInsightIds.map((insightId) => {
                  const topic = insightsById.get(insightId);
                  return (
                    <Link
                      key={insightId}
                      to={`/insights?topic=${encodeURIComponent(insightId)}`}
                      className="te-btn te-btn-sm"
                      style={{ justifyContent: 'flex-start' }}
                    >
                      {topic ? `${topic.order}. ${topic.title}` : insightId}
                    </Link>
                  );
                })}
              </div>
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h3 style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Citations &amp; References
              </h3>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {selectedComponent.citationIds.map((cid) => {
                  const cite = citationsById.get(cid);
                  return (
                    <Link
                      key={cid}
                      to={`/library?tab=citations`}
                      style={{ textDecoration: 'none' }}
                      title={cite ? `${cite.authors}: ${cite.title}` : cid}
                    >
                      <Badge>{cite ? `${cite.authors.split(',')[0]} (${cite.year})` : cid}</Badge>
                    </Link>
                  );
                })}
              </div>
            </section>
          </>
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>Select any chip component to inspect.</p>
        )}
      </Panel>
    </div>
  );
}
