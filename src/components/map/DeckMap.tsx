'use client';

import { useMemo, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer, TextLayer, LineLayer } from '@deck.gl/layers';
import { MapView } from '@deck.gl/core';
import { geoCentroid } from 'd3-geo';
import { buildColorScale, PAGE_BACKGROUND_COLOR } from './colorScale';
import { SMALL_REGION_LABEL_POSITIONS } from './smallRegionOffsets';
import type { StateCountRow } from '@/lib/queries';
import type { StateGeoFeature } from './types';

const INITIAL_VIEW_STATE = {
  longitude: -95,
  latitude: 38,
  zoom: 2.9,
  pitch: 0,
  bearing: 0,
};

interface DeckMapProps {
  geoData: { type: 'FeatureCollection'; features: StateGeoFeature[] } | null;
  counts: StateCountRow[];
  onStateClick?: (code: string) => void;
}

interface LabelPoint {
  code: string;
  position: [number, number];
  text: string;
}

interface LeaderLine {
  code: string;
  source: [number, number];
  target: [number, number];
}

export function DeckMap({ geoData, counts, onStateClick }: DeckMapProps) {
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; code: string; name: string; count: number } | null>(null);

  const countByCode = useMemo(() => {
    const m = new Map<string, number>();
    for (const row of counts) m.set(row.state_code, row.deal_count);
    return m;
  }, [counts]);

  const colorScale = useMemo(() => buildColorScale(Array.from(countByCode.values())), [countByCode]);

  const centroids = useMemo(() => {
    const m = new Map<string, [number, number]>();
    if (!geoData) return m;
    for (const f of geoData.features) {
      m.set(f.properties.code, geoCentroid(f.geometry as never) as [number, number]);
    }
    return m;
  }, [geoData]);

  const { labelPoints, leaderLines } = useMemo(() => {
    const points: LabelPoint[] = [];
    const lines: LeaderLine[] = [];
    for (const [code, centroid] of centroids.entries()) {
      const count = countByCode.get(code) ?? 0;
      if (count <= 0) continue;
      const offsetPosition = SMALL_REGION_LABEL_POSITIONS[code];
      const position = offsetPosition ?? centroid;
      points.push({ code, position, text: String(count) });
      if (offsetPosition) {
        lines.push({ code, source: centroid, target: offsetPosition });
      }
    }
    return { labelPoints: points, leaderLines: lines };
  }, [centroids, countByCode]);

  const layers = geoData
    ? [
        new GeoJsonLayer<StateGeoFeature['properties']>({
          id: 'states',
          data: geoData,
          filled: true,
          stroked: true,
          getFillColor: (f) => colorScale(countByCode.get(f.properties.code) ?? 0),
          // geoData's reference never changes, so deck.gl won't know to recompute
          // getFillColor's GPU attributes when `counts` updates unless told to here.
          updateTriggers: { getFillColor: counts },
          getLineColor: [40, 40, 40],
          lineWidthMinPixels: 1,
          pickable: true,
          autoHighlight: true,
          highlightColor: [255, 255, 255, 60],
          onClick: (info) => {
            const code = info.object?.properties?.code;
            if (code) onStateClick?.(code);
          },
          onHover: (info) => {
            if (info.object) {
              const code = info.object.properties.code;
              setHoverInfo({
                x: info.x,
                y: info.y,
                code,
                name: info.object.properties.name,
                count: countByCode.get(code) ?? 0,
              });
            } else {
              setHoverInfo(null);
            }
          },
        }),
        new LineLayer<LeaderLine>({
          id: 'leader-lines',
          data: leaderLines,
          getSourcePosition: (d) => d.source,
          getTargetPosition: (d) => d.target,
          getColor: [255, 255, 255, 160],
          getWidth: 1,
        }),
        new TextLayer<LabelPoint>({
          id: 'state-labels',
          data: labelPoints,
          getPosition: (d) => d.position,
          getText: (d) => d.text,
          getSize: 13,
          getColor: [255, 255, 255, 255],
          getPixelOffset: [0, 0],
          fontFamily: '"Segoe UI", system-ui, sans-serif',
          fontWeight: 700,
          background: false,
        }),
      ]
    : [];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: PAGE_BACKGROUND_COLOR }}>
      <DeckGL initialViewState={INITIAL_VIEW_STATE} controller views={new MapView({ repeat: false })} layers={layers} />
      {hoverInfo && (
        <div
          style={{ left: hoverInfo.x + 12, top: hoverInfo.y + 12 }}
          className="pointer-events-none absolute z-10 rounded bg-black/80 px-2 py-1 text-sm text-white"
        >
          {hoverInfo.name}: {hoverInfo.count}
        </div>
      )}
    </div>
  );
}
