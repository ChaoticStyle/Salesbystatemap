'use client';

import { useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { MapView } from '@deck.gl/core';
import { PAGE_BACKGROUND_COLOR } from './colorScale';
import { buildChoroplethLayers } from './buildChoroplethLayers';
import type { StateCountRow } from '@/lib/queries';
import type { StateGeoFeature } from './types';

const INITIAL_VIEW_STATE = {
  longitude: -95,
  latitude: 38,
  zoom: 2.4,
  pitch: 0,
  bearing: 0,
};

interface MiniMapProps {
  id: string;
  geoData: { type: 'FeatureCollection'; features: StateGeoFeature[] } | null;
  counts: StateCountRow[];
}

export function MiniMap({ id, geoData, counts }: MiniMapProps) {
  // Deck slides auto-cropped to whatever region had data -- if this view has
  // no Canadian province with a nonzero count, drop Canada entirely so the
  // mini-map matches (just the US) instead of showing an all-gray country.
  const scopedGeoData = useMemo(() => {
    if (!geoData) return geoData;
    const hasCanadaData = counts.some((c) => {
      const feature = geoData.features.find((f) => f.properties.code === c.state_code);
      return feature?.properties.regionType === 'ca_province' && c.deal_count > 0;
    });
    if (hasCanadaData) return geoData;
    return { ...geoData, features: geoData.features.filter((f) => f.properties.regionType !== 'ca_province') };
  }, [geoData, counts]);

  const layers = buildChoroplethLayers({ idPrefix: id, geoData: scopedGeoData, counts, pickable: false });

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: PAGE_BACKGROUND_COLOR }}>
      <DeckGL initialViewState={INITIAL_VIEW_STATE} controller={false} views={new MapView({ repeat: false })} layers={layers} />
    </div>
  );
}
