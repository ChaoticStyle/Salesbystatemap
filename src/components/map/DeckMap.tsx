'use client';

import { useMemo, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import { MapView } from '@deck.gl/core';
import { buildColorScale, PAGE_BACKGROUND_COLOR } from './colorScale';
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

export function DeckMap({ geoData, counts, onStateClick }: DeckMapProps) {
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; code: string; name: string; count: number } | null>(null);

  const countByCode = useMemo(() => {
    const m = new Map<string, number>();
    for (const row of counts) m.set(row.state_code, row.deal_count);
    return m;
  }, [counts]);

  const colorScale = useMemo(() => buildColorScale(Array.from(countByCode.values())), [countByCode]);

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
