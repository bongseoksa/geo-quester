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
      ? undefined // 드래그 중에는 원본을 움직이지 않음 (DragOverlay가 대신 표시됨)
      : position
        ? `translate3d(${position.x}px, ${position.y}px, 0)`
        : undefined,
    opacity: isMatched ? 0.3 : isDragging ? 0.5 : 1, // 드래그 중에는 반투명하게
    cursor: isMatched ? 'default' : 'grab',
    transition: isDragging ? 'none' : 'transform 0.2s ease-out',
  };

  return (
    <div
      className={className}
      style={{
        marginBottom: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
      }}
    >
      {/* 드래그 가능한 SVG 컨테이너 */}
      <div
        ref={setNodeRef}
        style={{
          ...style,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
        {...(!isMatched ? listeners : {})}
        {...attributes}
      >
        {/* 미니맵 SVG - 드래그 가능한 영역 */}
        <svg
          width={200}
          height={150}
          viewBox="0 0 800 600"
          onClick={!isMatched ? onClick : undefined}
          style={{
            cursor: isMatched ? 'default' : 'grab',
            pointerEvents: 'auto',
          }}
        >
          {pathGenerator && feature && (
            <path
              d={pathGenerator(feature.geometry) || ''}
              fill={selected ? '#F53' : '#D6EAF8'}
              stroke="#2980B9"
              strokeWidth={1}
            />
          )}
        </svg>
      </div>

      {/* 지역명 텍스트 - 완전히 분리된 영역 */}
      <span
        style={{
          fontSize: '14px',
          marginTop: '4px',
          fontWeight: selected ? 'bold' : 'normal',
          cursor: 'default',
          userSelect: 'none',
          pointerEvents: 'none',
          position: 'absolute',
          bottom: '-20px',
          left: '50%',
          transform: 'translateX(-50%)',
          whiteSpace: 'nowrap',
        }}
      >
        {feature.properties.NAME_1}
      </span>
    </div>
  );
};

export default DraggableItem;
