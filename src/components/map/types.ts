export interface StateGeoFeature {
  type: 'Feature';
  properties: { code: string; name: string; regionType: 'us_state' | 'ca_province' | 'other' };
  geometry: GeoJSON.Geometry;
}
