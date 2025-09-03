import type { GeoJSONData } from '@/hooks/use-geo-store';
import { supabase } from '../lib/supabase';

async function fetchGeoJson(): Promise<GeoJSONData | null> {
  const { data, error } = await supabase.storage
    .from('geojson') // bucket 이름
    .download('gadm41_KOR_1.geojson'); // 파일 경로

  if (error) {
    console.error('Supabase storage download error:', error.message);
    return null;
  }

  if (!data) return null;

  const text = await data.text();
  try {
    const json = JSON.parse(text) as GeoJSONData;
    return json;
  } catch (e) {
    console.error('Failed to parse geojson:', e);
    return null;
  }
}

export { fetchGeoJson };
