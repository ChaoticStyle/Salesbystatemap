'use client';

import { useState } from 'react';
import DeckGL from '@deck.gl/react';
import { MapView } from '@deck.gl/core';
import { PAGE_BACKGROUND_COLOR } from './colorScale';
import { buildChoroplethLayers } from './buildChoroplethLayers';
import { DEFAULT_MAP_ZOOM } from './constants';
import type { StateCountRow } from '@/lib/queries';
import type { StateGeoFeature } from './types';

const DEFAULT_VIEW_STATE = {
  longitude: -95,
  latitude: 30.5,
  zoom: DEFAULT_MAP_ZOOM,
  pitch: 0,
  bearing: 0,
};

interface DeckMapProps {
  idPrefix?: string;
  geoData: { type: 'FeatureCollection'; features: StateGeoFeature[] } | null;
  counts: StateCountRow[];
  onStateClick?: (code: string) => void;
  initialViewState?: Partial<typeof DEFAULT_VIEW_STATE>;
  interactive?: boolean;
}

export function DeckMap({ idPrefix = 'main', geoData, counts, onStateClick, initialViewState, interactive = true }: DeckMapProps) {
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; code: string; name: string; count: number } | null>(null);
  const [zoom, setZoom] = useState(initialViewState?.zoom ?? DEFAULT_VIEW_STATE.zoom);

  const layers = buildChoroplethLayers({
    idPrefix,
    geoData,
    counts,
    zoom,
    pickable: interactive,
    onClick: interactive ? onStateClick : undefined,
    onHover: interactive ? setHoverInfo : undefined,
  });

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: PAGE_BACKGROUND_COLOR }}>
      <DeckGL
        initialViewState={{ ...DEFAULT_VIEW_STATE, ...initialViewState }}
        controller={interactive}
        views={new MapView({ repeat: false })}
        layers={layers}
        onViewStateChange={({ viewState }) => setZoom((viewState as { zoom: number }).zoom)}
      />
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
