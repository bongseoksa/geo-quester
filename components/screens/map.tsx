import MapWrapper from '@/components/MapWrapper';
import PuzzleItemsWrapper from '@/components/PuzzleItemsWrapper';
import { useGeoStore } from '@/hooks/use-geo-store';
import { fetchGeoJson } from '@/utils/fetchGeoJson';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { useEffect } from 'react';

const Map = () => {
  const { setFeatures, markMatched, setInteractionEnabled, features } = useGeoStore();

  useEffect(() => {
    const loadGeo = async () => {
      const json = await fetchGeoJson();
      console.log('json', json);
      if (!json) return;
      setFeatures(json.features);
    };
    loadGeo();
  }, [setFeatures]);

  const handleDragEnd = (event: DragEndEvent) => {
    const activeId = event.active?.id as string | undefined;
    const overId = event.over?.id as string | undefined;
    if (!activeId || !overId) return;
    if (overId !== 'map-drop-zone') return;
    const nameFromItem = activeId.replace(/^puzzle-/, '');
    const hasMatch = features.some(
      (f) => (f.properties?.NAME_1 || '').toLowerCase() === nameFromItem.toLowerCase(),
    );
    if (!hasMatch) return;
    markMatched(nameFromItem);
    setInteractionEnabled(false);
    setTimeout(() => setInteractionEnabled(true), 500);
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex">
        <MapWrapper className="map-wrapper relative" />
        <PuzzleItemsWrapper className="puzzle-items-wrapper" />
      </div>
    </DndContext>
  );
};

export default Map;
