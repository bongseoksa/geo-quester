import { useGeoPath } from '@/hooks/use-geo-path';
import type { GeoJSONFeature } from '@/hooks/use-geo-store';
import { useGeoStore } from '@/hooks/use-geo-store';
import {
  closestCenter,
  DndContext,
  DragCancelEvent,
  DragEndEvent,
  DragMoveEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import React, { useState } from 'react';
import DraggableItem from './DraggableItem';
import DropZone from './DropZone';

interface MapDnDProps {
  className?: string;
}

/**
 * 메인 드래그앤드롭 컨테이너 컴포넌트
 * - DndContext로 전체 DnD 이벤트 관리
 * - DragOverlay로 드래그 중 시각화
 * - 드롭 시 지역별 스냅핑 처리
 */
export const MapDnD: React.FC<MapDnDProps> = ({ className = 'flex' }) => {
  const {
    features,
    selectedName,
    setSelectedName,
    markMatched,
    setInteractionEnabled,
    setItemPosition,
    clearItemPosition,
    regionSnapPoints,
  } = useGeoStore();

  const pathGenerator = useGeoPath(features, 800, 600);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeFeature, setActiveFeature] = useState<GeoJSONFeature | null>(null);
  const [dragOverRegion, setDragOverRegion] = useState<string | null>(null);

  // 드래그 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px 이상 이동해야 드래그 시작
      },
    }),
  );

  /**
   * 드래그 시작 시 호출
   * - 활성 아이템 정보 저장
   * - DragOverlay용 데이터 준비
   */
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);

    // 드래그 중인 아이템의 feature 찾기
    const itemName = (active.id as string).replace(/^puzzle-/, '');
    const feature = features.find((f) => f.properties?.NAME_1 === itemName);
    setActiveFeature(feature || null);
  };

  /**
   * 드래그 종료 시 호출
   * - 드롭 위치 판별
   * - 지역별 스냅핑 처리
   * - 매칭 상태 업데이트
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeId = active.id as string;
    const overId = over?.id as string;

    console.log('Drag end - activeId:', activeId, 'overId:', overId);

    // 드롭이 DropZone 밖에 있으면 자유 배치
    if (overId !== 'map-drop-zone') {
      console.log('Dropped outside drop zone');
      setActiveId(null);
      setActiveFeature(null);
      return;
    }

    // 드래그 종료 시점의 마우스 좌표 가져오기
    const dropX = event.activatorEvent?.clientX || 0;
    const dropY = event.activatorEvent?.clientY || 0;
    console.log('Drop coordinates:', dropX, dropY);

    // SVG 좌표계로 변환
    const svgElement = document.querySelector('.map-wrapper svg') as SVGSVGElement;
    if (!svgElement) {
      console.warn('SVG element not found');
      setActiveId(null);
      setActiveFeature(null);
      return;
    }

    // SVG의 bounding box 가져오기
    const svgRect = svgElement.getBoundingClientRect();
    const svgX = dropX - svgRect.left;
    const svgY = dropY - svgRect.top;

    console.log('SVG coordinates:', svgX, svgY);

    // document.elementFromPoint로 정확한 드롭 위치 찾기
    const elementBelow = document.elementFromPoint(dropX, dropY);
    console.log('Element below cursor:', elementBelow);

    let targetRegion = null;

    // 1. 직접 path 요소에 드롭된 경우
    if (elementBelow && elementBelow.tagName === 'path') {
      targetRegion = elementBelow.getAttribute('data-region');
      console.log('Direct path drop - region:', targetRegion);
    } else {
      // 2. path 요소가 아닌 경우, 가장 가까운 지역 찾기
      const paths = svgElement.querySelectorAll('path[data-region]');
      let closestRegion = null;
      let minDistance = Infinity;

      paths.forEach((path) => {
        const regionName = path.getAttribute('data-region');
        if (!regionName) return;

        const snapPoint = regionSnapPoints[regionName];
        if (!snapPoint) return;

        const distance = Math.sqrt(
          Math.pow(svgX - snapPoint.x, 2) + Math.pow(svgY - snapPoint.y, 2),
        );

        if (distance < minDistance) {
          minDistance = distance;
          closestRegion = regionName;
        }
      });

      // 150px 이내의 거리에 있는 지역만 스냅핑 허용
      if (closestRegion && minDistance < 150) {
        targetRegion = closestRegion;
        console.log('Closest region:', targetRegion, 'distance:', minDistance);
      }
    }

    // 스냅핑 처리
    if (targetRegion) {
      const snapPoint = regionSnapPoints[targetRegion];
      if (snapPoint) {
        console.log('Snapping to:', targetRegion, 'at:', snapPoint);

        // 아이템을 스냅 좌표로 이동
        setItemPosition(activeId, snapPoint);

        // 매칭 상태 업데이트
        const itemName = activeId.replace(/^puzzle-/, '');
        if (itemName === targetRegion) {
          console.log('Perfect match!');
          markMatched(itemName);
          setInteractionEnabled(false);
          setTimeout(() => setInteractionEnabled(true), 500);
        }
      }
    } else {
      console.log('No valid region found for snapping');
    }

    setActiveId(null);
    setActiveFeature(null);
    setDragOverRegion(null);
  };

  /**
   * 드래그 오버 시 호출
   * - 드래그 중인 지역 감지
   */
  const handleDragMove = (event: DragMoveEvent) => {
    const { active, over } = event;

    if (over?.id === 'map-drop-zone') {
      // 마우스 좌표로 현재 드래그 오버 지역 감지
      const mouseX = event.activatorEvent?.clientX || 0;
      const mouseY = event.activatorEvent?.clientY || 0;
      const deltaX = event.delta?.x || 0;
      const deltaY = event.delta?.y || 0;

      const svgElement = document.querySelector('.map-wrapper svg') as SVGSVGElement;
      if (svgElement) {
        const svgRect = svgElement.getBoundingClientRect();
        const svgX = mouseX + deltaX - svgRect.left;
        const svgY = mouseY + deltaY - svgRect.top;

        // 가장 가까운 지역 찾기
        const paths = svgElement.querySelectorAll('path[data-region]');
        let closestRegion = null;
        let minDistance = Infinity;

        paths.forEach((path) => {
          const regionName = path.getAttribute('data-region');
          if (!regionName) return;

          const snapPoint = regionSnapPoints[regionName];
          if (!snapPoint) return;

          const distance = Math.sqrt(
            Math.pow(svgX - snapPoint.x, 2) + Math.pow(svgY - snapPoint.y, 2),
          );

          if (distance < minDistance && distance < 100) {
            minDistance = distance;
            closestRegion = regionName;
            if (regionName.toLowerCase() === 'busan')
              console.log(event, regionName, 'mouseX', distance);
          }
        });

        setDragOverRegion(closestRegion);
      }
    } else {
      setDragOverRegion(null);
    }
  };

  /**
   * 드래그 취소 시 호출
   * - 상태 초기화
   */
  const handleDragCancel = (event: DragCancelEvent) => {
    setActiveId(null);
    setActiveFeature(null);
    setDragOverRegion(null);
  };

  /**
   * DragOverlay용 렌더링 함수
   * - 드래그 중에만 표시되는 오버레이
   */
  const renderDragOverlay = () => {
    if (!activeFeature || !pathGenerator) return null;

    return (
      <div
        style={{
          width: '200px',
          height: '150px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          opacity: 0.8,
          transform: 'rotate(5deg)', // 드래그 중 시각적 효과
        }}
      >
        <svg width={200} height={150} viewBox="0 0 800 600">
          <path
            d={pathGenerator(activeFeature.geometry) || ''}
            fill="#F53"
            stroke="#2980B9"
            strokeWidth={2}
          />
        </svg>
        <span
          style={{
            fontSize: '14px',
            marginTop: '4px',
            fontWeight: 'bold',
            color: '#F53',
          }}
        >
          {activeFeature.properties.NAME_1}
        </span>
      </div>
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className={className}>
        {/* 지도 DropZone */}
        <DropZone
          className="map-wrapper relative"
          dragOverRegion={dragOverRegion}
          activeFeature={activeFeature}
        />

        {/* 퍼즐 아이템 리스트 */}
        <div
          className="puzzle-items-wrapper"
          style={{
            width: '250px',
            padding: '10px',
            borderLeft: '1px solid #ccc',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}
        >
          <h3 style={{ marginBottom: '8px' }}>퍼즐조각</h3>
          {features.map((feature, index) => (
            <DraggableItem
              key={`${feature.properties.NAME_1}-${index}`}
              feature={feature}
              pathGenerator={pathGenerator}
              selected={selectedName === feature.properties.NAME_1}
              onClick={() => setSelectedName(feature.properties.NAME_1)}
            />
          ))}
        </div>
      </div>

      {/* 드래그 중 오버레이 */}
      <DragOverlay>{activeId ? renderDragOverlay() : null}</DragOverlay>
    </DndContext>
  );
};

export default MapDnD;
