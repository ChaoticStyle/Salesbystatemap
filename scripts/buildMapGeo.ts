/**
 * Builds public/us-states.json: a single GeoJSON FeatureCollection covering
 * US states + Canadian provinces, each feature tagged with our 2-letter
 * `code` (matching the `states` table) so the map component can join
 * geometry to data by code. Run again only if the geometry source changes.
 *
 * Usage: npx tsx scripts/buildMapGeo.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import * as topojson from 'topojson-client';
import { STATE_REFS } from '../src/lib/knownStates';

const ROOT = path.resolve(__dirname, '..');

const usStatesTopo = JSON.parse(fs.readFileSync(path.join(ROOT, 'node_modules/us-atlas/states-10m.json'), 'utf-8'));
const canadaRaw = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/data/canada-provinces-raw.geojson'), 'utf-8'));

const fipsToState = new Map(STATE_REFS.filter((s) => s.regionType === 'us_state').map((s) => [s.fipsOrGeoId, s]));
const nameToProvince = new Map(STATE_REFS.filter((s) => s.regionType === 'ca_province').map((s) => [s.name, s]));

// us-atlas states object -> GeoJSON FeatureCollection, one feature per state (id = FIPS).
const usGeo = topojson.feature(usStatesTopo, usStatesTopo.objects.states) as unknown as {
  type: 'FeatureCollection';
  features: Array<{ type: 'Feature'; id: string | number; properties: Record<string, unknown>; geometry: unknown }>;
};

const usFeatures = usGeo.features
  .map((f) => {
    const fips = String(f.id).padStart(2, '0');
    const ref = fipsToState.get(fips);
    if (!ref) {
      console.warn(`No state ref for FIPS ${fips}, skipping`);
      return null;
    }
    return {
      type: 'Feature' as const,
      geometry: f.geometry,
      properties: { code: ref.code, name: ref.name, regionType: ref.regionType },
    };
  })
  .filter(Boolean);

const caFeatures = canadaRaw.features
  .map((f: { properties: { name: string }; geometry: unknown }) => {
    const ref = nameToProvince.get(f.properties.name);
    if (!ref) {
      console.warn(`No province ref for "${f.properties.name}", skipping`);
      return null;
    }
    return {
      type: 'Feature' as const,
      geometry: f.geometry,
      properties: { code: ref.code, name: ref.name, regionType: ref.regionType },
    };
  })
  .filter(Boolean);

const combined = {
  type: 'FeatureCollection' as const,
  features: [...usFeatures, ...caFeatures],
};

const outPath = path.join(ROOT, 'public/us-states.json');
fs.writeFileSync(outPath, JSON.stringify(combined));
console.log(`Wrote ${combined.features.length} features to ${outPath} (${usFeatures.length} US + ${caFeatures.length} Canada)`);
