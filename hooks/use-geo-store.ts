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
}

export const useGeoStore = create<GeoState>((set) => ({
  features: [],
  setFeatures: (features) => set({ features }),
  selectedName: null,
  setSelectedName: (name) => set({ selectedName: name }),
}));
