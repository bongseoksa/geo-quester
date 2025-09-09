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
  const [currentMousePos, setCurrentMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  // dropZoneFeatures 제거 - 중앙 집중식 features 사용

  // 드래그 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px 이상 이동해야 드래그 시작
      },
    }),
  );

  // 마우스 위치 추적을 위한 이벤트 리스너
  React.useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setCurrentMousePos({ x: event.clientX, y: event.clientY });
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  /**
   * 드래그 시작 시 호출
   * - 활성 아이템 정보 저장
   * - DragOverlay용 데이터 준비
   */
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);

    // 드래그 중인 아이템의 feature 찾기 (중앙 집중식 features 사용)
    const itemName = (active.id as string).replace(/^puzzle-/, '');
    const feature = features.find((f: GeoJSONFeature) => f.properties?.NAME_1 === itemName);
    setActiveFeature(feature || null);
  };

  /**
   * 드래그 종료 시 호출 - 간소화된 로직
   * 1. 드래그 중인 아이템의 지역명을 기억
   * 2. 포인터 위치의 feature를 정확히 판별
   * 3. 드롭존 외부이거나 feature 외부면 상태 초기화
   * 4. 매칭 성공시 아이템을 투명하게 만들고 클릭 차단
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeId = active.id as string;
    const overId = over?.id as string;

    console.log('Drag end - activeId:', activeId, 'overId:', overId);

    // 1. 드래그 중인 아이템의 지역명 추출
    const draggedRegionName = activeId.replace(/^puzzle-/, '');
    console.log('Dragged region:', draggedRegionName);

    // 2. 드롭이 DropZone 밖에 있으면 상태 초기화
    if (overId !== 'map-drop-zone') {
      console.log('Dropped outside drop zone - resetting state');
      setActiveId(null);
      setActiveFeature(null);
      setDragOverRegion(null);
      return;
    }

    // 3. geojson 기반 순차 검증 로직
    console.log('=== GeoJSON 기반 드롭 검증 시작 ===');
    console.log(`📍 드래그 아이템 지역명: "${draggedRegionName}"`);

    // 3-1. 포인터 위치 확인
    const dropX = currentMousePos.x;
    const dropY = currentMousePos.y;
    console.log(`🎯 마우스 포인터 위치: (${dropX}, ${dropY})`);

    // 유효한 좌표인지 확인
    if (dropX <= 0 || dropY <= 0) {
      console.log('❌ 유효하지 않은 포인터 위치 - 드롭 취소');
      setActiveId(null);
      setActiveFeature(null);
      setDragOverRegion(null);
      return;
    }

    // 3-2. 안정적인 드롭존 feature 탐지
    console.log('🔍 드롭존 feature 탐지 중...');

    // 드래그 오버레이가 방해하지 않도록 잠시 숨기고 elementFromPoint 호출
    const dragOverlay = document.querySelector('[data-dnd-kit-drag-overlay]') as HTMLElement;
    const originalPointerEvents = dragOverlay?.style.pointerEvents;
    if (dragOverlay) {
      dragOverlay.style.pointerEvents = 'none';
    }

    // 다중 탐지 방식으로 안정성 향상
    let targetRegionName: string | null = null;
    let isValidDropZoneFeature = false;
    let detectionMethod = '';

    // 방법 1: 직접 elementFromPoint 탐지
    const elementBelow = document.elementFromPoint(dropX, dropY);
    console.log(
      `   방법1 - elementBelow:`,
      elementBelow?.tagName,
      elementBelow?.getAttribute?.('data-region'),
    );

    if (elementBelow && elementBelow.tagName === 'path') {
      const regionFromPath = elementBelow.getAttribute('data-region');
      if (regionFromPath) {
        const matchingFeature = features.find(
          (f: GeoJSONFeature) => f.properties?.NAME_1 === regionFromPath,
        );
        if (matchingFeature) {
          targetRegionName = regionFromPath;
          isValidDropZoneFeature = true;
          detectionMethod = '직접 path 탐지';
        }
      }
    }

    // 방법 2: SVG 컨테이너 내부에서 모든 path 요소 검사 (fallback)
    if (!isValidDropZoneFeature) {
      console.log('   방법2 - SVG 내부 path 요소들 검사 중...');
      const svgElement = document.querySelector('.map-wrapper svg') as SVGElement;

      if (svgElement) {
        const rect = svgElement.getBoundingClientRect();
        const relativeX = dropX - rect.left;
        const relativeY = dropY - rect.top;

        console.log(`   SVG 상대 좌표: (${relativeX}, ${relativeY})`);

        // SVG 내부의 모든 path 요소 검사
        const pathElements = svgElement.querySelectorAll('path[data-region]');
        console.log(`   검사할 path 요소 수: ${pathElements.length}`);

        for (const pathElement of pathElements) {
          const regionFromPath = pathElement.getAttribute('data-region');

          if (regionFromPath) {
            // 안전한 bbox 검사 방식 사용 (브라우저 호환성 보장)
            try {
              const bbox = (pathElement as SVGPathElement).getBBox();

              // bbox 검사로 포인트가 path 영역 내부에 있는지 확인
              if (
                relativeX >= bbox.x &&
                relativeX <= bbox.x + bbox.width &&
                relativeY >= bbox.y &&
                relativeY <= bbox.y + bbox.height
              ) {
                console.log(`   bbox 검사 통과한 지역: "${regionFromPath}"`);

                // 추가 검증: geojson features에서 해당 지역 확인
                const matchingFeature = features.find(
                  (f: GeoJSONFeature) => f.properties?.NAME_1 === regionFromPath,
                );

                if (matchingFeature) {
                  // 더 정확한 검사를 위해 SVG point-in-fill 시도 (선택적)
                  let isMoreAccurate = false;
                  try {
                    if ('createSVGPoint' in svgElement && 'isPointInFill' in pathElement) {
                      const svgSvgElement = svgElement as SVGSVGElement;
                      const point = svgSvgElement.createSVGPoint();
                      point.x = relativeX;
                      point.y = relativeY;

                      const isInside = (pathElement as SVGPathElement).isPointInFill(point);
                      if (isInside) {
                        isMoreAccurate = true;
                        console.log(`   point-in-fill 검사도 통과: "${regionFromPath}"`);
                      }
                    }
                  } catch (pointError) {
                    // point-in-fill 실패해도 bbox 검사 결과 사용
                    console.log(`   point-in-fill 검사 실패, bbox 결과 사용: "${regionFromPath}"`);
                  }

                  targetRegionName = regionFromPath;
                  isValidDropZoneFeature = true;
                  detectionMethod = isMoreAccurate ? 'SVG point-in-fill 검사' : 'SVG bbox 검사';
                  break;
                }
              }
            } catch (bboxError) {
              console.log(`   bbox 검사 실패: ${regionFromPath}`, bboxError);
              // bbox 검사도 실패하면 해당 path는 건너뛰기
              continue;
            }
          }
        }
      }
    }

    // 드래그 오버레이 복원
    if (dragOverlay && originalPointerEvents !== undefined) {
      dragOverlay.style.pointerEvents = originalPointerEvents;
    }

    // 3-3. 탐지 결과 로깅
    if (isValidDropZoneFeature && targetRegionName) {
      console.log(`✅ 드롭존 feature 탐지 성공: "${targetRegionName}" (${detectionMethod})`);
    } else {
      console.log('❌ 드롭존 feature 탐지 실패');
      console.log(`   - elementBelow: ${elementBelow?.tagName || 'null'}`);
      console.log(`   - data-region: ${elementBelow?.getAttribute?.('data-region') || 'none'}`);
      console.log(`   - SVG 검사 결과: ${isValidDropZoneFeature ? '성공' : '실패'}`);
    }

    // 3-4. 드롭존 외부 처리
    if (!isValidDropZoneFeature || !targetRegionName) {
      console.log('🚫 드롭 실패: 드롭존 외부 또는 유효하지 않은 feature');
      setActiveId(null);
      setActiveFeature(null);
      setDragOverRegion(null);
      return;
    }

    // 4. 지역 일치 검증 및 드롭 규칙 적용
    console.log('🔄 지역 일치 검증 중...');
    console.log(`📋 드래그 아이템 지역명: "${draggedRegionName}"`);
    console.log(`🎯 드롭존 feature 지역명: "${targetRegionName}"`);
    console.log(`📍 마우스 포인터 위치: (${dropX}, ${dropY})`);

    if (draggedRegionName === targetRegionName) {
      console.log('🎉 드롭 성공! 동일한 지역 매칭 완료');
      console.log(`✅ 드롭 성공 상태: 지역명 일치 확인됨`);

      // geojson 기반 매칭 성공 처리
      markMatched(draggedRegionName);
      console.log(`🔄 "${draggedRegionName}" 지역 매칭 상태로 변경 완료`);

      // 스냅 좌표로 이동 (centroid 기반)
      const snapPoint = regionSnapPoints[targetRegionName];
      if (snapPoint) {
        setItemPosition(activeId, snapPoint);
        console.log(`📍 아이템을 centroid 좌표로 이동: (${snapPoint.x}, ${snapPoint.y})`);
      } else {
        console.log(`⚠️ "${targetRegionName}" 지역의 스냅 좌표를 찾을 수 없음`);
      }

      // 시각적 피드백
      setInteractionEnabled(false);
      setTimeout(() => setInteractionEnabled(true), 500);

      console.log('🏆 드롭 완료 처리 성공');
    } else {
      console.log('❌ 드롭 실패: 지역 불일치');
      console.log(`❌ 드롭 실패 상태: 지역명 불일치`);
      console.log(`   - 드래그 아이템: "${draggedRegionName}"`);
      console.log(`   - 드롭존 feature: "${targetRegionName}"`);
      console.log(`   - 실패 원인: 지역명이 일치하지 않음`);
    }

    console.log('=== GeoJSON 기반 드롭 검증 완료 ===');

    // 상태 초기화
    setActiveId(null);
    setActiveFeature(null);
    setDragOverRegion(null);
  };

  /**
   * 드래그 오버 시 호출
   * - 드래그 중인 지역 감지 (드롭과 동일한 로직 사용)
   */
  const handleDragMove = (event: DragMoveEvent) => {
    const { over } = event;

    if (over?.id === 'map-drop-zone') {
      // 실시간 추적된 마우스 위치 사용 (드롭과 동일한 방식)
      const mouseX = currentMousePos.x;
      const mouseY = currentMousePos.y;

      // 드래그 오버레이가 방해하지 않도록 잠시 숨기고 elementFromPoint 호출
      const dragOverlay = document.querySelector('[data-dnd-kit-drag-overlay]') as HTMLElement;
      const originalPointerEvents = dragOverlay?.style.pointerEvents;
      if (dragOverlay) {
        dragOverlay.style.pointerEvents = 'none';
      }

      const elementBelow = document.elementFromPoint(mouseX, mouseY);

      // 드래그 오버레이 복원
      if (dragOverlay && originalPointerEvents !== undefined) {
        dragOverlay.style.pointerEvents = originalPointerEvents;
      }

      if (elementBelow && elementBelow.tagName === 'path') {
        const regionName = elementBelow.getAttribute('data-region');
        setDragOverRegion(regionName);
      } else {
        setDragOverRegion(null);
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
