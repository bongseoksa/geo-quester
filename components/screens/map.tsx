import * as d3 from 'd3';
import * as d3Geo from 'd3-geo';
import { useEffect, useRef, useState } from 'react';

interface FeatureProperties {
  NAME_1: string;
  [key: string]: any;
}

interface GeoJSONFeature {
  type: string;
  properties: FeatureProperties;
  geometry: any;
}

interface GeoJSONData {
  type: string;
  features: GeoJSONFeature[];
}

const Map = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const [features, setFeatures] = useState<GeoJSONFeature[]>([]);
  const [pathGenerator, setPathGenerator] = useState<d3Geo.GeoPath<
    any,
    d3.GeoPermissibleObjects
  > | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

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

    d3.json<GeoJSONData>('/data/geojson/gadm41_KOR_1.geojson').then((geojson) => {
      if (!geojson) return;

      setFeatures(geojson.features);

      const projection = d3Geo.geoMercator().fitSize([width, height], geojson as any);

      const path = d3Geo.geoPath().projection(projection as any);
      setPathGenerator(() => path);

      svg
        .selectAll<SVGPathElement, GeoJSONFeature>('path')
        .data(geojson.features)
        .join('path')
        .attr('d', path as any)
        .attr('fill', '#D6EAF8')
        .attr('stroke', '#2980B9')
        .attr('stroke-width', 1)
        .on('mouseover', function (event, d) {
          const element = d3.select(this);
          const [cx, cy] = path.centroid(d);

          element.raise();
          element
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
          const [cx, cy] = path.centroid(d);

          element
            .transition()
            .duration(200)
            .attr('transform', `translate(${cx},${cy}) scale(1) translate(${-cx},${-cy})`)
            .attr('fill', '#D6EAF8');

          tooltip.style('opacity', 0);
        })
        .on('click', (_, d) => {
          setSelected(d.properties.NAME_1);
        });
    });
  }, []);

  return (
    <div className="flex">
      {/* 지도 영역 */}
      <div className="map-wrapper relative">
        <svg ref={svgRef}></svg>
        <div ref={tooltipRef}></div>
      </div>

      {/* 퍼즐조각 리스트 */}
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
        {features.map((f, i) => (
          <div
            key={i}
            onClick={() => setSelected(f.properties.NAME_1)}
            style={{
              marginBottom: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            {/* 원본 좌표 기반 미니 지도 */}
            <svg width={200} height={150} viewBox="0 0 800 600">
              {pathGenerator && (
                <path
                  d={pathGenerator(f) || ''}
                  fill={selected === f.properties.NAME_1 ? '#F53' : '#D6EAF8'}
                  stroke="#2980B9"
                  strokeWidth={1}
                />
              )}
            </svg>
            <span
              style={{
                fontSize: '14px',
                marginTop: '4px',
                fontWeight: selected === f.properties.NAME_1 ? 'bold' : 'normal',
              }}
            >
              {f.properties.NAME_1}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Map;
