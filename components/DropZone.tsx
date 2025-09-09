import { useGeoPath } from '@/hooks/use-geo-path';
import type { GeoJSONFeature } from '@/hooks/use-geo-store';
import { useGeoStore } from '@/hooks/use-geo-store';
import { useDroppable } from '@dnd-kit/core';
import * as d3 from 'd3';
import React, { useEffect, useRef } from 'react';

interface DropZoneProps {
  className?: string;
  width?: number;
  height?: number;
  dragOverRegion?: string | null;
  activeFeature?: any;
}

/**
 * SVG 지도를 DropZone으로 사용하는 컴포넌트
 * - 각 지역 path에 data-region 속성 추가
 * - 지역별 스냅 좌표(centroid) 계산 및 저장
 * - 드롭 이벤트 처리
 */
export const DropZone: React.FC<DropZoneProps> = ({
  className = 'map-wrapper relative',
  width = 800,
  height = 600,
  dragOverRegion,
  activeFeature,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const {
    features,
    selectedName,
    setSelectedName,
    isInteractionEnabled,
    matchedNames,
    setHoveredName,
    setRegionSnapPoints,
  } = useGeoStore();

  const pathGenerator = useGeoPath(features, width, height);
  const { setNodeRef } = useDroppable({ id: 'map-drop-zone' });

  // 중앙 집중식 features 사용으로 인해 별도 전달 불필요

  // 지역별 스냅 좌표 계산 및 저장
  useEffect(() => {
    if (!features || features.length === 0 || !pathGenerator) return;

    const snapPoints: Record<string, { x: number; y: number }> = {};

    features.forEach((feature) => {
      const name = feature.properties?.NAME_1 || '';
      if (name) {
        try {
          const [x, y] = (pathGenerator as any).centroid(feature);
          snapPoints[name] = { x, y };
        } catch (error) {
          console.warn(`Failed to calculate centroid for ${name}:`, error);
        }
      }
    });

    setRegionSnapPoints(snapPoints);
  }, [features, pathGenerator, setRegionSnapPoints]);

  // SVG 렌더링 및 이벤트 처리
  useEffect(() => {
    if (!features || features.length === 0 || !pathGenerator) return;

    const svg = d3.select(svgRef.current).attr('width', width).attr('height', height);

    const tooltip = d3
      .select(tooltipRef.current)
      .style('position', 'absolute')
      .style('padding', '4px 8px')
      .style('background', 'rgba(0,0,0,0.7)')
      .style('color', '#fff')
      .style('border-radius', '4px')
      .style('pointer-events', 'none')
      .style('opacity', 0);

    const svgSelection = svg
      .selectAll<SVGPathElement, GeoJSONFeature>('path')
      .data(features)
      .join('path')
      .attr('d', pathGenerator as any)
      .attr('data-region', (d) => d.properties?.NAME_1 || '') // 지역 식별용 속성
      .attr('data-drop-zone', (d) => `region-${d.properties?.NAME_1 || ''}`) // 개별 드롭존 ID
      .attr('fill', (d) => {
        const name = d.properties?.NAME_1 || '';
        if (matchedNames.has(name)) return '#86EFAC'; // 매칭된 지역은 녹색
        if (dragOverRegion === name && activeFeature) {
          const itemName = activeFeature.properties?.NAME_1 || '';
          if (itemName === name) return '#10B981'; // 정확한 매칭 가능 지역은 진한 녹색
          return '#F59E0B'; // 드래그 오버 지역은 주황색
        }
        return '#D6EAF8'; // 기본 색상
      })
      //   .attr('stroke', '#2980B9')
      .attr('stroke-width', 1)
      .on('mouseover', function (event, d) {
        if (!isInteractionEnabled) return;
        setHoveredName(d.properties?.NAME_1 || null);

        const element = d3.select(this);
        const [cx, cy] = (pathGenerator as any).centroid(d);

        element
          .raise()
          .transition()
          .duration(200)
          .attr('transform', `translate(${cx},${cy}) scale(1.1) translate(${-cx},${-cy})`)
          .attr('fill', '#F53');

        tooltip
          .style('opacity', 1)
          .html(d.properties.NAME_1)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY + 10}px`);
      })
      .on('mousemove', (event) => {
        if (!isInteractionEnabled) return;
        tooltip.style('left', `${event.pageX + 10}px`).style('top', `${event.pageY + 10}px`);
      })
      .on('mouseout', function (event, d) {
        if (!isInteractionEnabled) return;
        setHoveredName(null);

        const element = d3.select(this);
        const [cx, cy] = (pathGenerator as any).centroid(d);

        element
          .transition()
          .duration(200)
          .attr('transform', `translate(${cx},${cy}) scale(1) translate(${-cx},${-cy})`)
          .attr('fill', '#D6EAF8');

        tooltip.style('opacity', 0);
      })
      .on('click', (_, d) => {
        if (!isInteractionEnabled) return;
        setSelectedName(d.properties.NAME_1);
      });

    // 매칭된 피처 하이라이트 업데이트
    svgSelection
      .transition()
      .duration(200)
      .attr('fill', (d) => {
        const name = d.properties?.NAME_1 || '';
        return matchedNames.has(name) ? '#86EFAC' : '#D6EAF8';
      });
  }, [
    features,
    pathGenerator,
    setSelectedName,
    isInteractionEnabled,
    matchedNames,
    setHoveredName,
    width,
    height,
    dragOverRegion,
    activeFeature,
  ]);

  return (
    <div className={className} ref={setNodeRef}>
      <svg ref={svgRef}></svg>
      <div ref={tooltipRef}></div>
    </div>
  );
};

export default DropZone;
