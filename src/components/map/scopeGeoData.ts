import type { StateCountRow } from '@/lib/queries';
import type { StateGeoFeature } from './types';

function hasNonzeroCount(
  geoData: { type: 'FeatureCollection'; features: StateGeoFeature[] },
  counts: StateCountRow[],
  predicate: (feature: StateGeoFeature) => boolean,
): boolean {
  return counts.some((c) => {
    const feature = geoData.features.find((f) => f.properties.code === c.state_code);
    return feature && predicate(feature) && c.deal_count > 0;
  });
}

/**
 * Drops Canadian provinces and/or Alaska entirely when a view has no data
 * there, so its mini-map matches how the original deck auto-cropped to just
 * the relevant region instead of showing a mostly-empty country/state.
 */
export function scopeGeoDataForCounts(
  geoData: { type: 'FeatureCollection'; features: StateGeoFeature[] } | null,
  counts: StateCountRow[],
) {
  if (!geoData) return geoData;

  const hasCanadaData = hasNonzeroCount(geoData, counts, (f) => f.properties.regionType === 'ca_province');
  const hasAlaskaData = hasNonzeroCount(geoData, counts, (f) => f.properties.code === 'AK');

  if (hasCanadaData && hasAlaskaData) return geoData;

  return {
    ...geoData,
    features: geoData.features.filter((f) => {
      if (!hasCanadaData && f.properties.regionType === 'ca_province') return false;
      if (!hasAlaskaData && f.properties.code === 'AK') return false;
      return true;
    }),
  };
}
