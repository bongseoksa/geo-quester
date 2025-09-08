import type { GeoJSONFeature } from '@/hooks/use-geo-store';
import { useGeoStore } from '@/hooks/use-geo-store';
import { useDraggable } from '@dnd-kit/core';
import React from 'react';

interface DraggableItemProps {
  feature: GeoJSONFeature;
  pathGenerator: any;
  selected: boolean;
  onClick: () => void;
  className?: string;
}

/**
 * 드래그 가능한 퍼즐 아이템 컴포넌트
 * - 원본 아이템은 제자리에 유지
 * - 드래그 중에는 DragOverlay로 시각화
 * - 매칭된 아이템은 비활성화 상태
 */
export const DraggableItem: React.FC<DraggableItemProps> = ({
  feature,
  pathGenerator,
  selected,
  onClick,
  className = 'puzzle-item',
}) => {
  const { matchedNames, itemPositions } = useGeoStore();
  const isMatched = matchedNames.has(feature.properties.NAME_1);
  const itemId = `puzzle-${feature.properties.NAME_1}`;
  const position = itemPositions[itemId];

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: itemId,
    disabled: isMatched,
  });

  // 드래그 중이거나 위치가 설정된 경우 transform 적용
  const style = {
    transform: isDragging
      ? `translate3d(${transform?.x || 0}px, ${transform?.y || 0}px, 0)`
      : position
        ? `translate3d(${position.x}px, ${position.y}px, 0)`
        : undefined,
    opacity: isMatched ? 0.3 : 1,
    cursor: isMatched ? 'default' : 'grab',
    transition: isDragging ? 'none' : 'transform 0.2s ease-out',
  };

  return (
    <div
      ref={setNodeRef}
      className={className}
      style={{
        marginBottom: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        ...style,
      }}
      {...(!isMatched ? listeners : {})}
      {...attributes}
      onClick={!isMatched ? onClick : undefined}
    >
      {/* 미니맵 SVG */}
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

      {/* 지역명 텍스트 */}
      <span
        style={{
          fontSize: '14px',
          marginTop: '4px',
          fontWeight: selected ? 'bold' : 'normal',
        }}
      >
        {feature.properties.NAME_1}
      </span>
    </div>
  );
};

export default DraggableItem;
