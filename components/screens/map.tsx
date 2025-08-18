import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as d3Geo from "d3-geo";

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

  useEffect(() => {
    const width = 800;
    const height = 600;

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // 툴팁 div 생성
    const tooltip = d3.select(tooltipRef.current)
      .style("position", "absolute")
      .style("padding", "4px 8px")
      .style("background", "rgba(0,0,0,0.7)")
      .style("color", "#fff")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("opacity", 0);

    d3.json<GeoJSONData>("/data/gadm41_KOR_1.geojson").then((geojson) => {
      if (!geojson) return;

      const projection = d3Geo.geoMercator()
        .fitSize([width, height], geojson as any);

      const path = d3Geo.geoPath().projection(projection as any);

      svg.selectAll<SVGPathElement, GeoJSONFeature>("path")
        .data(geojson.features)
        .join("path")
        .attr("d", path as any)
        .attr("fill", "#D6EAF8")
        .attr("stroke", "#2980B9")
        .attr("stroke-width", 1)
        .on("mouseover", function (event, d) {
          const element = d3.select(this);

          // 중심점 계산
          const [cx, cy] = path.centroid(d);

          // 최상단으로 이동
          element.raise();

          // 스케일 확대
          element.transition()
            .duration(200)
            .attr("transform", `translate(${cx},${cy}) scale(1.1) translate(${-cx},${-cy})`)
            .attr("fill", "#F53");

          // 툴팁 표시
          tooltip
            .style("opacity", 1)
            .html(d.properties.NAME_1)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`);
        })
        .on("mousemove", (event) => {
          // 툴팁 위치 따라오기
          tooltip
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`);
        })
        .on("mouseout", function (event, d) {
          const element = d3.select(this);
          const [cx, cy] = path.centroid(d);

          // 스케일 복원
          element.transition()
            .duration(200)
            .attr("transform", `translate(${cx},${cy}) scale(1) translate(${-cx},${-cy})`)
            .attr("fill", "#D6EAF8");

          // 툴팁 숨기기
          tooltip.style("opacity", 0);
        });
    });
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <svg ref={svgRef}></svg>
      <div ref={tooltipRef}></div>
    </div>
  );
};

export default Map;
