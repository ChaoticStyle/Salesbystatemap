import type { StateCountRow } from '@/lib/queries';
import type { StateGeoFeature } from './types';

/**
 * Drops Canadian provinces entirely when a view has no Canadian data, so its
 * mini-map matches how the original deck auto-cropped to just the US rather
 * than showing an all-gray country.
 */
export function scopeGeoDataForCounts(
  geoData: { type: 'FeatureCollection'; features: StateGeoFeature[] } | null,
  counts: StateCountRow[],
) {
  if (!geoData) return geoData;
  const hasCanadaData = counts.some((c) => {
    const feature = geoData.features.find((f) => f.properties.code === c.state_code);
    return feature?.properties.regionType === 'ca_province' && c.deal_count > 0;
  });
  if (hasCanadaData) return geoData;
  return { ...geoData, features: geoData.features.filter((f) => f.properties.regionType !== 'ca_province') };
}
