import MapWrapper from '@/components/MapWrapper';
import PuzzleItemsWrapper from '@/components/PuzzleItemsWrapper';
import { useGeoStore } from '@/hooks/use-geo-store';
import { fetchGeoJson } from '@/utils/fetchGeoJson';
import { DndContext } from '@dnd-kit/core';
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

  return (
    <DndContext onDragEnd={() => {}}>
      <div className="flex">
        <MapWrapper className="map-wrapper relative" />
        <PuzzleItemsWrapper className="puzzle-items-wrapper" />
      </div>
    </DndContext>
  );
};

export default Map;
