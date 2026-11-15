import { create } from 'zustand';
import { ContentBundle } from './validators';
import { loadStaticBundle, probeBackendHealth } from './contentService';
import { useAppStore } from '../stores/useAppStore';

interface ContentState {
  bundle: ContentBundle | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  initContent: () => Promise<void>;
}

export const useContentStore = create<ContentState>((set, get) => ({
  bundle: null,
  loading: false,
  error: null,
  initialized: false,
  initContent: async () => {
    if (get().initialized || get().loading) return;
    set({ loading: true, error: null });
    try {
      const bundle = await loadStaticBundle();
      set({ bundle, loading: false, initialized: true });
      const apiBase = (import.meta.env.VITE_API_BASE_URL || '').trim();
      if (apiBase) {
        useAppStore.getState().setBackendStatus('probing');
        const online = await probeBackendHealth();
        useAppStore.getState().setBackendStatus(online ? 'online_synced' : 'local_mode');
      } else {
        useAppStore.getState().setBackendStatus('local_mode');
      }
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load educational bundle',
      });
    }
  },
}));
