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
}));
