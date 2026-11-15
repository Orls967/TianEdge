import type { AnalyticsEventRequest } from '../types/models';
import { useAppStore } from '../stores/useAppStore';

let cachedSessionId: string | null = null;

function getSessionId(): string {
  if (cachedSessionId) return cachedSessionId;
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    cachedSessionId = crypto.randomUUID();
  } else {
    cachedSessionId = `sess-${Math.random().toString(36).slice(2, 10)}`;
  }
  return cachedSessionId;
}

export function trackAnalyticsEvent(
  eventType: AnalyticsEventRequest['eventType'],
  section: AnalyticsEventRequest['section'],
  targetId: string,
): void {
  const apiBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');
  const backendStatus = useAppStore.getState().backendStatus;
  if (!apiBase || backendStatus !== 'online_synced') {
    return;
  }

  const payload: AnalyticsEventRequest = {
    eventType,
    section,
    targetId,
    sessionId: getSessionId(),
    timestampUtc: new Date().toISOString(),
  };

  void fetch(`${apiBase}/api/v1/analytics/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // Non-fatal optional telemetry — keep offline UX unaffected.
  });
}
