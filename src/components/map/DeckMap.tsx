'use client';

import { useState } from 'react';
import DeckGL from '@deck.gl/react';
import { MapView } from '@deck.gl/core';
import { PAGE_BACKGROUND_COLOR } from './colorScale';
import { buildChoroplethLayers } from './buildChoroplethLayers';
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

  const layers = buildChoroplethLayers({
    idPrefix: 'main',
    geoData,
    counts,
    pickable: true,
    onClick: onStateClick,
    onHover: setHoverInfo,
  });

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
