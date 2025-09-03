import type { GeoJSONFeature } from '@/hooks/use-geo-store';
import { useGeoStore } from '@/hooks/use-geo-store';
import { useDraggable } from '@dnd-kit/core';
import * as d3Geo from 'd3-geo';
import React from 'react';

interface Props {
  feature: GeoJSONFeature;
  pathGenerator: d3Geo.GeoPath<any, d3.GeoPermissibleObjects> | null;
  selected: boolean;
  onClick: () => void;
}

export const PuzzleItem: React.FC<Props> = ({ feature, pathGenerator, selected, onClick }) => {
  const { matchedNames } = useGeoStore();
  const isMatched = matchedNames.has(feature.properties.NAME_1);
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `puzzle-${feature.properties.NAME_1}`,
    disabled: isMatched,
  });
  return (
    <div
      className="puzzle-item"
      ref={setNodeRef}
      {...(!isMatched ? listeners : {})}
      {...attributes}
      onClick={!isMatched ? onClick : undefined}
      style={{
        marginBottom: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: isMatched ? 'default' : 'grab',
        opacity: isMatched ? 0.3 : 1,
      }}
    >
      <svg width={200} height={150} viewBox="0 0 800 600">
        {pathGenerator && feature && (
          <path
            d={pathGenerator(feature.geometry) || ''}
            fill={selected ? '#F53' : '#D6EAF8'}
            stroke="#2980B9"
            strokeWidth={1}
          />
        )}
      </svg>
      <span
        style={{ fontSize: '14px', marginTop: '4px', fontWeight: selected ? 'bold' : 'normal' }}
      >
        {feature.properties.NAME_1}
      </span>
    </div>
  );
};

export default PuzzleItem;
