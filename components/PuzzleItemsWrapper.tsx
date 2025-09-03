import PuzzleItem from '@/components/PuzzleItem';
import { useGeoPath } from '@/hooks/use-geo-path';
import { useGeoStore } from '@/hooks/use-geo-store';
import React from 'react';

interface Props {
  className?: string;
}

export const PuzzleItemsWrapper: React.FC<Props> = ({ className }) => {
  const { features, selectedName, setSelectedName } = useGeoStore();
  const pathGenerator = useGeoPath(features, 800, 600);
  return (
    <div
      className={className}
      style={{
        width: '250px',
        padding: '10px',
        borderLeft: '1px solid #ccc',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}
    >
      <h3 style={{ marginBottom: '8px' }}>퍼즐조각</h3>
      {features.map((f, i) => (
        <PuzzleItem
          key={`${f.properties.NAME_1}-${i}`}
          feature={f}
          pathGenerator={pathGenerator}
          selected={selectedName === f.properties.NAME_1}
          onClick={() => setSelectedName(f.properties.NAME_1)}
        />
      ))}
    </div>
  );
};

export default PuzzleItemsWrapper;
