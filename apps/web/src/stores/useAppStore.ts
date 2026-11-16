import { create } from 'zustand';

// 'idle': engine not requested yet (it is lazy-loaded by /journey and /simulator).
export type WasmStatus = 'idle' | 'initializing' | 'ready' | 'error';
export type BackendSyncStatus = 'local_mode' | 'probing' | 'online_synced';

interface AppState {
  reducedMotion: boolean;
  systemReducedMotion: boolean;
  wasmStatus: WasmStatus;
  wasmError: string | null;
  backendStatus: BackendSyncStatus;
  shortcutsOpen: boolean;
  tabHidden: boolean;
  setReducedMotion: (value: boolean) => void;
  toggleReducedMotion: () => void;
  setSystemReducedMotion: (value: boolean) => void;
  setWasmStatus: (status: WasmStatus, error?: string | null) => void;
  setBackendStatus: (status: BackendSyncStatus) => void;
  setShortcutsOpen: (open: boolean) => void;
  setTabHidden: (hidden: boolean) => void;
}

const getInitialReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const useAppStore = create<AppState>((set) => ({
  reducedMotion: getInitialReducedMotion(),
  systemReducedMotion: getInitialReducedMotion(),
  wasmStatus: 'idle',
  wasmError: null,
  backendStatus: import.meta.env.VITE_API_BASE_URL ? 'probing' : 'local_mode',
  shortcutsOpen: false,
  tabHidden: false,
  setReducedMotion: (value) => set({ reducedMotion: value }),
  toggleReducedMotion: () => set((s) => ({ reducedMotion: !s.reducedMotion })),
  setSystemReducedMotion: (value) =>
    set((s) => ({ systemReducedMotion: value, reducedMotion: value || s.reducedMotion })),
  setWasmStatus: (wasmStatus, wasmError = null) => set({ wasmStatus, wasmError }),
  setBackendStatus: (backendStatus) => set({ backendStatus }),
  setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
  setTabHidden: (tabHidden) => set({ tabHidden }),
}));
