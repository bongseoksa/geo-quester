import { create } from 'zustand';

export interface FeatureProperties {
  NAME_1: string;
  [key: string]: any;
}

export interface GeoJSONFeature {
  type: string;
  properties: FeatureProperties;
  geometry: any;
}

export interface GeoJSONData {
  type: string;
  features: GeoJSONFeature[];
}

interface GeoState {
  features: GeoJSONFeature[];
  setFeatures: (features: GeoJSONFeature[]) => void;
  selectedName: string | null;
  setSelectedName: (name: string | null) => void;
  // 매칭/인터랙션 상태
  matchedNames: Set<string>;
  isInteractionEnabled: boolean;
  setInteractionEnabled: (enabled: boolean) => void;
  markMatched: (name: string) => void;
  hoveredName: string | null;
  setHoveredName: (name: string | null) => void;
  // 드래그앤드롭 아이템 위치 관리
  itemPositions: Record<string, { x: number; y: number }>;
  setItemPosition: (id: string, position: { x: number; y: number }) => void;
  clearItemPosition: (id: string) => void;
  // 지역별 스냅 좌표 (centroid 기반)
  regionSnapPoints: Record<string, { x: number; y: number }>;
  setRegionSnapPoints: (points: Record<string, { x: number; y: number }>) => void;
}

export const useGeoStore = create<GeoState>((set) => ({
  features: [],
  setFeatures: (features) => set({ features }),
  selectedName: null,
  setSelectedName: (name) => set({ selectedName: name }),
  matchedNames: new Set<string>(),
  isInteractionEnabled: true,
  setInteractionEnabled: (enabled) => set({ isInteractionEnabled: enabled }),
  markMatched: (name) =>
    set((state) => {
      const next = new Set(state.matchedNames);
      next.add(name);
      return { matchedNames: next };
    }),
  hoveredName: null,
  setHoveredName: (name) => set({ hoveredName: name }),
  itemPositions: {},
  setItemPosition: (id, position) =>
    set((state) => ({
      itemPositions: { ...state.itemPositions, [id]: position },
    })),
  clearItemPosition: (id) =>
    set((state) => {
      const { [id]: _, ...rest } = state.itemPositions;
      return { itemPositions: rest };
    }),
  regionSnapPoints: {},
  setRegionSnapPoints: (points) => set({ regionSnapPoints: points }),
}));
