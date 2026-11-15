import {
  AnalyticsEventRequest,
  ArchitectureReference,
  ChipComponent,
  CitationEntry,
  EngineeringInsightTopic,
  FormulaEntry,
  GlossaryTerm,
  HealthResponse,
  LearningPath,
  LibrarySearchResponse,
  SemiconductorPrimer,
  TechnicalDiagramEntry,
} from '../types/models';
import { ContentBundle, validateContentBundle } from './validators';
import { SearchCategory, searchBundleLocally } from './search';

const HEALTH_TIMEOUT_MS = 1500;
const CONTENT_TIMEOUT_MS = 2500;

function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
}

async function fetchJsonWithTimeout<T>(url: string, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { signal: controller.signal });
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status} for ${url}`);
    }
    return (await resp.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

async function loadStaticJson<T>(fileName: string): Promise<T> {
  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const resp = await fetch(`${normalizedBase}data/${fileName}`);
  if (!resp.ok) {
    throw new Error(`Failed to load static bundle file data/${fileName}: ${resp.status}`);
  }
  return (await resp.json()) as T;
}

export async function loadStaticBundle(): Promise<ContentBundle> {
  const [
    components,
    insights,
    glossary,
    fundamentals,
    references,
    diagrams,
    formulas,
    learningPaths,
    citations,
  ] = await Promise.all([
    loadStaticJson<ChipComponent[]>('components.json'),
    loadStaticJson<EngineeringInsightTopic[]>('insights.json'),
    loadStaticJson<GlossaryTerm[]>('glossary.json'),
    loadStaticJson<SemiconductorPrimer[]>('fundamentals.json'),
    loadStaticJson<ArchitectureReference[]>('references.json'),
    loadStaticJson<TechnicalDiagramEntry[]>('diagrams.json'),
    loadStaticJson<FormulaEntry[]>('formulas.json'),
    loadStaticJson<LearningPath[]>('learning_paths.json'),
    loadStaticJson<CitationEntry[]>('citations.json'),
  ]);

  const bundle: ContentBundle = {
    components,
    insights: [...insights].sort((a, b) => a.order - b.order),
    glossary,
    fundamentals,
    references,
    diagrams,
    formulas,
    learningPaths,
    citations,
  };

  const report = validateContentBundle(bundle);
  if (!report.valid) {
    throw new Error(`Invalid bundled content dataset: ${report.errors.join('; ')}`);
  }

  return bundle;
}

export async function probeBackendHealth(): Promise<boolean> {
  const apiBase = getApiBaseUrl();
  if (!apiBase) return false;
  try {
    const health = await fetchJsonWithTimeout<HealthResponse>(
      `${apiBase}/api/v1/health`,
      HEALTH_TIMEOUT_MS,
    );
    return health.status === 'ok';
  } catch {
    return false;
  }
}

export async function searchLibraryHybrid(
  bundle: ContentBundle,
  query: string,
  category: SearchCategory = 'all',
  limit = 20,
  backendOnline = false,
): Promise<LibrarySearchResponse> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { query: '', total: 0, results: [] };
  }
  const apiBase = getApiBaseUrl();
  if (apiBase && backendOnline) {
    try {
      const params = new URLSearchParams({
        q: trimmed,
        category,
        limit: String(limit),
      });
      return await fetchJsonWithTimeout<LibrarySearchResponse>(
        `${apiBase}/api/v1/library/search?${params.toString()}`,
        CONTENT_TIMEOUT_MS,
      );
    } catch {
      // Graceful fallback to deterministic local search
    }
  }
  return searchBundleLocally(bundle, trimmed, category, limit);
}

let anonSessionId: string | null = null;
function getAnonSessionId(): string {
  if (!anonSessionId) {
    anonSessionId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `anon-${Math.random().toString(36).slice(2, 10)}`;
  }
  return anonSessionId;
}

export function trackTelemetryEvent(
  eventType: AnalyticsEventRequest['eventType'],
  section: AnalyticsEventRequest['section'],
  targetId: string,
  backendOnline: boolean,
): void {
  const apiBase = getApiBaseUrl();
  if (!apiBase || !backendOnline) return;

  const payload: AnalyticsEventRequest = {
    eventType,
    section,
    targetId,
    sessionId: getAnonSessionId(),
    timestampUtc: new Date().toISOString(),
  };

  void fetch(`${apiBase}/api/v1/analytics/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // Fire-and-forget: never surface errors when backend is unavailable
  });
}
