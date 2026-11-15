import { LibrarySearchItem, LibrarySearchResponse } from '../types/models';
import { ContentBundle } from './validators';

export type SearchCategory =
  | 'all'
  | 'component'
  | 'insight'
  | 'glossary'
  | 'formula'
  | 'fundamental'
  | 'reference'
  | 'diagram';

function scoreMatch(queryLower: string, title: string, body: string): number {
  const t = title.toLowerCase();
  const b = body.toLowerCase();
  if (t === queryLower) return 1.0;
  if (t.startsWith(queryLower)) return 0.96;
  if (t.includes(queryLower)) return 0.9;
  if (b.includes(queryLower)) return 0.72;
  return 0;
}

export function searchBundleLocally(
  bundle: ContentBundle,
  rawQuery: string,
  category: SearchCategory = 'all',
  limit = 20,
): LibrarySearchResponse {
  const query = rawQuery.trim();
  if (!query) {
    return { query: '', total: 0, results: [] };
  }
  const q = query.toLowerCase();
  const items: LibrarySearchItem[] = [];

  if (category === 'all' || category === 'component') {
    for (const c of bundle.components) {
      const score = scoreMatch(q, `${c.name} ${c.id}`, `${c.definition} ${c.primaryFunction} ${c.engineeringPrinciples}`);
      if (score > 0) {
        items.push({
          kind: 'component',
          id: c.id,
          title: c.name,
          snippet: c.definition,
          route: `/anatomy?component=${encodeURIComponent(c.id)}`,
          relatedComponentIds: [c.id],
          score,
        });
      }
    }
  }

  if (category === 'all' || category === 'insight') {
    for (const ins of bundle.insights) {
      const score = scoreMatch(q, `${ins.title} ${ins.id}`, `${ins.technicalDefinition} ${ins.engineeringExplanation}`);
      if (score > 0) {
        items.push({
          kind: 'insight',
          id: ins.id,
          title: ins.title,
          snippet: ins.technicalDefinition,
          route: `/insights?topic=${encodeURIComponent(ins.id)}`,
          relatedComponentIds: ins.relatedComponentIds,
          score,
        });
      }
    }
  }

  if (category === 'all' || category === 'glossary') {
    for (const g of bundle.glossary) {
      const score = scoreMatch(q, `${g.term} ${g.acronym ?? ''}`, `${g.conciseDefinition} ${g.technicalContext}`);
      if (score > 0) {
        items.push({
          kind: 'glossary',
          id: g.id,
          title: g.acronym ? `${g.term} (${g.acronym})` : g.term,
          snippet: g.conciseDefinition,
          route: `/library?tab=glossary&item=${encodeURIComponent(g.id)}`,
          relatedComponentIds: g.relatedComponentIds,
          score,
        });
      }
    }
  }

  if (category === 'all' || category === 'formula') {
    for (const f of bundle.formulas) {
      const score = scoreMatch(q, f.name, `${f.assumptions} ${f.applicability} ${f.workedExample}`);
      if (score > 0) {
        items.push({
          kind: 'formula',
          id: f.id,
          title: f.name,
          snippet: f.applicability,
          route: `/library?tab=formulas&item=${encodeURIComponent(f.id)}`,
          relatedComponentIds: [],
          score,
        });
      }
    }
  }

  if (category === 'all' || category === 'fundamental') {
    for (const p of bundle.fundamentals) {
      const body = p.sections.map((s) => `${s.heading} ${s.body}`).join(' ');
      const score = scoreMatch(q, p.title, `${p.summary} ${body}`);
      if (score > 0) {
        items.push({
          kind: 'fundamental',
          id: p.id,
          title: p.title,
          snippet: p.summary,
          route: `/library?tab=fundamentals&item=${encodeURIComponent(p.id)}`,
          relatedComponentIds: p.relatedComponentIds,
          score,
        });
      }
    }
  }

  if (category === 'all' || category === 'reference') {
    for (const r of bundle.references) {
      const score = scoreMatch(q, r.title, `${r.summary} ${r.scopeDisclaimer}`);
      if (score > 0) {
        items.push({
          kind: 'reference',
          id: r.id,
          title: r.title,
          snippet: r.summary,
          route: `/library?tab=references&item=${encodeURIComponent(r.id)}`,
          relatedComponentIds: [],
          score,
        });
      }
    }
  }

  if (category === 'all' || category === 'diagram') {
    for (const d of bundle.diagrams) {
      const score = scoreMatch(q, d.title, d.caption);
      if (score > 0) {
        items.push({
          kind: 'diagram',
          id: d.id,
          title: d.title,
          snippet: d.caption,
          route: `/library?tab=diagrams&item=${encodeURIComponent(d.id)}`,
          relatedComponentIds: d.relatedComponentIds,
          score,
        });
      }
    }
  }

  items.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  const sliced = items.slice(0, Math.max(1, Math.min(limit, 50)));
  return {
    query,
    total: items.length,
    results: sliced,
  };
}
