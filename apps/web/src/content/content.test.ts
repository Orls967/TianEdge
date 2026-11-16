import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ContentBundle, validateContentBundle } from './validators';
import { searchBundleLocally } from './search';

function loadDiskBundle(): ContentBundle {
  const dataDir = resolve(process.cwd(), 'public/data');
  const read = <T,>(name: string): T =>
    JSON.parse(readFileSync(resolve(dataDir, name), 'utf8')) as T;
  return {
    components: read('components.json'),
    insights: read('insights.json'),
    glossary: read('glossary.json'),
    fundamentals: read('fundamentals.json'),
    references: read('references.json'),
    diagrams: read('diagrams.json'),
    formulas: read('formulas.json'),
    learningPaths: read('learning_paths.json'),
    citations: read('citations.json'),
  };
}

describe('Educational Content Bundle Integrity & Local Search', () => {
  const bundle = loadDiskBundle();

  it('validates all 36 components, 13 insights, 6 formulas, 48 glossary terms, and cross-references', () => {
    const report = validateContentBundle(bundle);
    expect(report.errors).toEqual([]);
    expect(report.valid).toBe(true);
    expect(bundle.glossary.length).toBe(48);
    expect(bundle.fundamentals.length).toBe(5);
    expect(bundle.references.length).toBe(3);
    expect(bundle.diagrams.length).toBe(6);
    expect(bundle.learningPaths.length).toBe(4);
  });

  it('ensures every Group E digital-logic component carries conceptual_enlarged + scaleDisclaimer', () => {
    const logicComponents = bundle.components.filter((c) => c.groupId === 'digital-logic');
    expect(logicComponents).toHaveLength(7);
    for (const c of logicComponents) {
      expect(c.representationType).toBe('conceptual_enlarged');
      expect(c.scaleDisclaimer).toBeTruthy();
    }
  });

  it('performs deterministic local search across components, insights, glossary, and formulas', () => {
    const cacheResults = searchBundleLocally(bundle, 'cache', 'all', 20);
    expect(cacheResults.total).toBeGreaterThan(0);
    expect(cacheResults.results.some((r) => r.kind === 'insight' && r.id === 'cache-hierarchy')).toBe(true);

    const aluResults = searchBundleLocally(bundle, 'alu', 'component', 10);
    expect(aluResults.results[0]?.id).toBe('core-alu');
  });
});

describe('simulator preset cross-links', () => {
  it('every relatedInsightId on a simulator preset resolves to a real Engineering Insights topic', async () => {
    const { SIMULATOR_PRESETS } = await import('../constants/presets');
    const topicIds = new Set(loadDiskBundle().insights.map((t) => t.id));
    const broken = SIMULATOR_PRESETS.flatMap((p) =>
      p.relatedInsightIds.filter((id) => !topicIds.has(id)).map((id) => `${p.id} -> ${id}`),
    );
    expect(broken).toEqual([]);
  });
});
