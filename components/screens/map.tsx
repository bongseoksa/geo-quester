import MapDnD from '@/components/MapDnD';
import { useGeoStore } from '@/hooks/use-geo-store';
import { fetchGeoJson } from '@/utils/fetchGeoJson';
import { useEffect } from 'react';

const Map = () => {
  const { setFeatures } = useGeoStore();

  useEffect(() => {
    const loadGeo = async () => {
      const json = await fetchGeoJson();
      console.log('json', json);
      if (!json) return;
      setFeatures(json.features);
    };
    loadGeo();
  }, [setFeatures]);

  return <MapDnD />;
};

export default Map;
