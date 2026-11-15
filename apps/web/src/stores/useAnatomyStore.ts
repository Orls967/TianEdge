import { create } from 'zustand';
import type { CameraPreset, VisualizationMode } from '../types/models';

export const DEFAULT_ISOMETRIC_CAMERA: CameraPreset = {
  position: [3.6, 2.7, 3.8],
  target: [0, 0.08, 0],
};

interface AnatomyState {
  selectedComponentId: string | null;
  hoveredComponentId: string | null;
  visualizationMode: VisualizationMode;
  sliceOffset: number;
  hiddenComponents: Record<string, boolean>;
  hiddenGroups: Record<string, boolean>;
  cameraTargetPreset: CameraPreset;
  resetCameraNonce: number;
  highlightComponentIds: string[];
  highlightPaths: string[];
  isUserInteracting: boolean;
  logicPodNoticeDismissed: boolean;

  selectComponent: (componentId: string | null, cameraPreset?: CameraPreset, autoIsolateIfLogic?: boolean) => void;
  hoverComponent: (componentId: string | null) => void;
  setVisualizationMode: (mode: VisualizationMode) => void;
  setSliceOffset: (offset: number) => void;
  toggleComponentVisibility: (componentId: string) => void;
  toggleGroupVisibility: (groupId: string) => void;
  showAllComponents: () => void;
  resetCamera: () => void;
  setSimulationHighlights: (componentIds: string[], paths: string[]) => void;
  setUserInteracting: (interacting: boolean) => void;
  focusPreset: (preset: CameraPreset) => void;
  dismissLogicPodNotice: () => void;
}

export const useAnatomyStore = create<AnatomyState>((set) => ({
  selectedComponentId: null,
  hoveredComponentId: null,
  visualizationMode: 'full_assembly',
  sliceOffset: 0.5,
  hiddenComponents: {},
  hiddenGroups: {},
  cameraTargetPreset: DEFAULT_ISOMETRIC_CAMERA,
  resetCameraNonce: 0,
  highlightComponentIds: [],
  highlightPaths: [],
  isUserInteracting: false,
  logicPodNoticeDismissed: false,

  selectComponent: (componentId, cameraPreset, autoIsolateIfLogic = true) =>
    set((state) => {
      const isLogic = componentId?.startsWith('logic-') ?? false;
      const nextMode =
        isLogic && autoIsolateIfLogic && state.visualizationMode !== 'component_isolation'
          ? 'component_isolation'
          : state.visualizationMode;
      return {
        selectedComponentId: componentId,
        visualizationMode: nextMode,
        cameraTargetPreset: cameraPreset ?? state.cameraTargetPreset,
        resetCameraNonce: cameraPreset ? state.resetCameraNonce + 1 : state.resetCameraNonce,
      };
    }),

  hoverComponent: (hoveredComponentId) => set({ hoveredComponentId }),

  setVisualizationMode: (visualizationMode) =>
    set((state) => ({
      visualizationMode,
      cameraTargetPreset:
        visualizationMode === 'full_assembly'
          ? DEFAULT_ISOMETRIC_CAMERA
          : state.cameraTargetPreset,
    })),

  setSliceOffset: (offset) =>
    set({ sliceOffset: Math.max(0, Math.min(1, offset)) }),

  toggleComponentVisibility: (componentId) =>
    set((state) => ({
      hiddenComponents: {
        ...state.hiddenComponents,
        [componentId]: !state.hiddenComponents[componentId],
      },
    })),

  toggleGroupVisibility: (groupId) =>
    set((state) => ({
      hiddenGroups: {
        ...state.hiddenGroups,
        [groupId]: !state.hiddenGroups[groupId],
      },
    })),

  showAllComponents: () => set({ hiddenComponents: {}, hiddenGroups: {} }),

  resetCamera: () =>
    set((state) => ({
      cameraTargetPreset: DEFAULT_ISOMETRIC_CAMERA,
      resetCameraNonce: state.resetCameraNonce + 1,
    })),

  setSimulationHighlights: (highlightComponentIds, highlightPaths) =>
    set({ highlightComponentIds, highlightPaths }),

  setUserInteracting: (isUserInteracting) => set({ isUserInteracting }),

  focusPreset: (cameraTargetPreset) =>
    set((state) => ({
      cameraTargetPreset,
      resetCameraNonce: state.resetCameraNonce + 1,
    })),

  dismissLogicPodNotice: () => set({ logicPodNoticeDismissed: true }),
}));
