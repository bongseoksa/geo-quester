import { useGeoPath } from '@/hooks/use-geo-path';
import type { GeoJSONFeature } from '@/hooks/use-geo-store';
import { useGeoStore } from '@/hooks/use-geo-store';
import { useDroppable } from '@dnd-kit/core';
import * as d3 from 'd3';
import { useEffect, useRef } from 'react';

interface Props {
  className?: string;
}

export const MapWrapper: React.FC<Props> = ({ className }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const { features, selectedName, setSelectedName } = useGeoStore();
  const pathGenerator = useGeoPath(features, 800, 600);

  const { setNodeRef } = useDroppable({ id: 'map-drop-zone' });

  useEffect(() => {
    const width = 800;
    const height = 600;

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

    if (!features || features.length === 0 || !pathGenerator) return;

    svg
      .selectAll<SVGPathElement, GeoJSONFeature>('path')
      .data(features)
      .join('path')
      .attr('d', pathGenerator as any)
      .attr('fill', '#D6EAF8')
      .attr('stroke', '#2980B9')
      .attr('stroke-width', 1)
      .on('mouseover', function (event, d) {
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
        tooltip.style('left', `${event.pageX + 10}px`).style('top', `${event.pageY + 10}px`);
      })
      .on('mouseout', function (event, d) {
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
        setSelectedName(d.properties.NAME_1);
      });
  }, [features, pathGenerator, setSelectedName]);

  return (
    <div className={className} ref={setNodeRef}>
      <svg ref={svgRef}></svg>
      <div ref={tooltipRef}></div>
    </div>
  );
};

export default MapWrapper;
