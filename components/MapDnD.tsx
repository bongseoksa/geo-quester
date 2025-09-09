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

interface CandidateRegion {
  regionName: string;
  method: string;
  area: number;
  isExactMatch: boolean;
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
   * 중첩 지역을 고려한 최적의 feature 탐지 함수
   * - 포인터 위치에서 모든 가능한 path 요소를 탐지
   * - 중첩된 경우 가장 작은(구체적인) 지역을 우선 선택
   * - 드래그 아이템과 매칭 가능성을 고려한 우선순위 적용
   */
  const findBestMatchingFeature = (
    dropX: number,
    dropY: number,
    draggedRegionName: string,
  ): { regionName: string | null; method: string } => {
    console.log('🔍 중첩 지역 고려 feature 탐지 시작...');

    const candidateRegions: CandidateRegion[] = [];

    // 방법 1: 직접 elementFromPoint 탐지
    const elementBelow = document.elementFromPoint(dropX, dropY);
    if (elementBelow && elementBelow.tagName === 'path') {
      const regionFromPath = elementBelow.getAttribute('data-region');
      if (regionFromPath) {
        const matchingFeature = features.find(
          (f: GeoJSONFeature) => f.properties?.NAME_1 === regionFromPath,
        );
        if (matchingFeature) {
          candidateRegions.push({
            regionName: regionFromPath,
            method: '직접 elementFromPoint 탐지',
            area: 0, // 가장 높은 우선순위
            isExactMatch: regionFromPath === draggedRegionName,
          });
          console.log(`   후보 추가 (방법1): "${regionFromPath}"`);
        }
      }
    }

    // 방법 2: SVG 내부 모든 path 요소 검사 (중첩 지역 탐지)
    const svgElement = document.querySelector('.map-wrapper svg') as SVGElement;
    if (svgElement) {
      const rect = svgElement.getBoundingClientRect();
      const relativeX = dropX - rect.left;
      const relativeY = dropY - rect.top;

      console.log(`   SVG 상대 좌표: (${relativeX}, ${relativeY})`);

      const pathElements = svgElement.querySelectorAll('path[data-region]');
      console.log(`   검사할 path 요소 수: ${pathElements.length}`);

      for (const pathElement of pathElements) {
        const regionFromPath = pathElement.getAttribute('data-region');
        if (!regionFromPath) continue;

        // 이미 후보에 있는 지역은 건너뛰기
        if (candidateRegions.some((c: CandidateRegion) => c.regionName === regionFromPath))
          continue;

        const matchingFeature = features.find(
          (f: GeoJSONFeature) => f.properties?.NAME_1 === regionFromPath,
        );
        if (!matchingFeature) continue;

        try {
          const bbox = (pathElement as SVGPathElement).getBBox();

          // bbox 검사
          if (
            relativeX >= bbox.x &&
            relativeX <= bbox.x + bbox.width &&
            relativeY >= bbox.y &&
            relativeY <= bbox.y + bbox.height
          ) {
            let detectionMethod = 'SVG bbox 검사';
            let isMoreAccurate = false;

            // point-in-fill 검사 (더 정확한 탐지)
            try {
              const svgSvgElement = svgElement as SVGSVGElement;
              if (svgSvgElement.createSVGPoint) {
                const point = svgSvgElement.createSVGPoint();
                point.x = relativeX;
                point.y = relativeY;

                const isInside = (pathElement as SVGPathElement).isPointInFill(point);
                if (isInside) {
                  isMoreAccurate = true;
                  detectionMethod = 'SVG point-in-fill 검사';
                }
              }
            } catch (error) {
              // point-in-fill 실패해도 bbox 결과 사용
            }

            // bbox 검사 통과했거나 point-in-fill 성공한 경우만 후보 추가
            if (isMoreAccurate || detectionMethod === 'SVG bbox 검사') {
              candidateRegions.push({
                regionName: regionFromPath,
                method: detectionMethod,
                area: bbox.width * bbox.height, // 면적으로 우선순위 결정
                isExactMatch: regionFromPath === draggedRegionName,
              });
              console.log(`   후보 추가 (방법2): "${regionFromPath}" - ${detectionMethod}`);
            }
          }
        } catch (error) {
          console.log(`   bbox 검사 실패: "${regionFromPath}", 건너뜀`);
        }
      }
    }

    console.log(`   총 후보 지역 수: ${candidateRegions.length}`);
    candidateRegions.forEach((c: CandidateRegion) => {
      console.log(
        `     - "${c.regionName}" (${c.method}, 면적: ${c.area}, 정확매칭: ${c.isExactMatch})`,
      );
    });

    if (candidateRegions.length === 0) {
      return { regionName: null, method: '탐지 실패' };
    }

    // 우선순위 기반 최적 후보 선택
    // 1순위: 드래그 아이템과 정확히 일치하는 지역
    const exactMatch = candidateRegions.find((c: CandidateRegion) => c.isExactMatch);
    if (exactMatch) {
      console.log(`   🎯 정확 매칭 선택: "${exactMatch.regionName}"`);
      return { regionName: exactMatch.regionName, method: exactMatch.method + ' (정확매칭)' };
    }

    // 2순위: 가장 작은 면적의 지역 (더 구체적인 지역)
    const sortedByArea = candidateRegions.sort((a: CandidateRegion, b: CandidateRegion) => {
      // area가 0인 경우(직접 탐지)가 최우선
      if (a.area === 0 && b.area !== 0) return -1;
      if (a.area !== 0 && b.area === 0) return 1;
      return a.area - b.area;
    });

    const bestCandidate = sortedByArea[0];
    console.log(
      `   🏆 최적 후보 선택: "${bestCandidate.regionName}" (면적: ${bestCandidate.area})`,
    );

    return { regionName: bestCandidate.regionName, method: bestCandidate.method + ' (면적기준)' };
  };

  /**
   * 드롭 처리 함수
   * - 중첩 지역 처리를 위한 개선된 탐지 로직 적용
   * - 드롭 성공 후 UI 상태 안정성 보장
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    console.log('=== 드래그 종료 이벤트 시작 ===');
    console.log('Active:', active?.id);
    console.log('Over:', over?.id);

    if (!active || over?.id !== 'map-drop-zone') {
      console.log('🚫 드롭 실패: 드롭존 외부');
      setActiveId(null);
      setActiveFeature(null);
      setDragOverRegion(null);
      return;
    }

    // 1. 드래그된 아이템의 지역명 추출
    const activeItemId = active.id as string;
    const draggedRegionName = activeItemId.replace('puzzle-', '');
    console.log(`🎯 드래그된 아이템: "${draggedRegionName}"`);

    // 2. 현재 마우스 위치 확인
    const dropX = currentMousePos.x;
    const dropY = currentMousePos.y;
    console.log(`📍 드롭 위치: (${dropX}, ${dropY})`);

    if (dropX === 0 && dropY === 0) {
      console.log('🚫 드롭 실패: 유효하지 않은 마우스 위치');
      setActiveId(null);
      setActiveFeature(null);
      setDragOverRegion(null);
      return;
    }

    // 3. 중첩 지역을 고려한 최적 feature 탐지
    const { regionName: targetRegionName, method: detectionMethod } = findBestMatchingFeature(
      dropX,
      dropY,
      draggedRegionName,
    );

    console.log(`🎯 최종 탐지 결과: "${targetRegionName}" (${detectionMethod})`);

    // 유효한 드롭존이 아닌 경우 처리
    if (!targetRegionName) {
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
    console.log(`🔧 탐지 방법: ${detectionMethod}`);

    if (draggedRegionName === targetRegionName) {
      console.log('🎉 드롭 성공! 동일한 지역 매칭 완료');
      console.log(`✅ 드롭 성공 상태: 지역명 일치 확인됨`);

      // geojson 기반 매칭 성공 처리
      markMatched(draggedRegionName);
      console.log(`🔄 "${draggedRegionName}" 지역 매칭 상태로 변경 완료`);

      // 스냅 좌표로 이동 (centroid 기반)
      const snapPoint = regionSnapPoints[targetRegionName];
      if (snapPoint) {
        setItemPosition(activeItemId, snapPoint);
        console.log(`📍 아이템을 centroid 좌표로 이동: (${snapPoint.x}, ${snapPoint.y})`);
      } else {
        console.log(`⚠️ "${targetRegionName}" 지역의 스냅 좌표를 찾을 수 없음`);
      }

      // 시각적 피드백 및 UI 안정성 보장
      setInteractionEnabled(false);

      // UI 상태 업데이트를 위한 강제 리렌더링
      setTimeout(() => {
        setInteractionEnabled(true);
        // 추가적인 상태 동기화를 위한 처리
        console.log(`🔄 UI 상태 동기화 완료: "${draggedRegionName}" 매칭됨`);
      }, 500);

      console.log('🏆 드롭 완료 처리 성공');
    } else {
      console.log('❌ 드롭 실패: 지역 불일치');
      console.log(`❌ 드롭 실패 상태: 지역명 불일치`);
      console.log(`   - 드래그 아이템: "${draggedRegionName}"`);
      console.log(`   - 드롭존 feature: "${targetRegionName}"`);
      console.log(`   - 탐지 방법: ${detectionMethod}`);
      console.log(`   - 실패 원인: 지역명이 일치하지 않음`);

      // 중첩 지역에서 다른 후보들도 확인
      console.log(`   💡 힌트: "${draggedRegionName}" 지역을 찾아 정확한 위치에 드롭하세요`);
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
      <div className="flex h-screen w-full">
        {/* 지도 DropZone - 좌측 영역 */}
        <div className="flex-1">
          <DropZone
            className="map-wrapper relative h-full w-full"
            dragOverRegion={dragOverRegion}
            activeFeature={activeFeature}
          />
        </div>

        {/* 퍼즐 아이템 리스트 - 우측 고정 영역 */}
        <div className="flex w-80 flex-col border-l border-gray-200 bg-gray-50">
          <div className="border-b border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-800">퍼즐조각</h3>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-4">
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
      </div>

      {/* 드래그 중 오버레이 */}
      <DragOverlay>{activeId ? renderDragOverlay() : null}</DragOverlay>
    </DndContext>
  );
};

export default MapDnD;
