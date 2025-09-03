import type { GeoJSONFeature } from '@/hooks/use-geo-store';
import * as d3Geo from 'd3-geo';
import { useMemo } from 'react';

export const useGeoPath = (features: GeoJSONFeature[], width = 800, height = 600) => {
  return useMemo(() => {
    if (!features || features.length === 0)
      return null as unknown as d3Geo.GeoPath<any, d3.GeoPermissibleObjects> | null;
    const geojson = { type: 'FeatureCollection', features } as any;
    const projection = d3Geo.geoMercator().fitSize([width, height], geojson);
    const path = d3Geo.geoPath().projection(projection as any);
    return path as d3Geo.GeoPath<any, d3.GeoPermissibleObjects>;
  }, [features, width, height]);
};
