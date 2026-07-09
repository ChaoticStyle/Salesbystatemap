import { GeoJsonLayer, TextLayer, LineLayer } from '@deck.gl/layers';
import { geoCentroid } from 'd3-geo';
import { buildColorScale, labelColorForFill } from './colorScale';
import { SMALL_REGION_LABEL_POSITIONS } from './smallRegionOffsets';
import type { StateCountRow } from '@/lib/queries';
import type { StateGeoFeature } from './types';

interface LabelPoint {
  code: string;
  position: [number, number];
  text: string;
  color: [number, number, number, number];
}

interface LeaderLine {
  code: string;
  source: [number, number];
  target: [number, number];
}

export interface BuildLayersOptions {
  idPrefix: string;
  geoData: { type: 'FeatureCollection'; features: StateGeoFeature[] } | null;
  counts: StateCountRow[];
  pickable?: boolean;
  onClick?: (code: string) => void;
  onHover?: (info: { x: number; y: number; code: string; name: string; count: number } | null) => void;
}

export function buildChoroplethLayers({ idPrefix, geoData, counts, pickable = false, onClick, onHover }: BuildLayersOptions) {
  if (!geoData) return [];

  const countByCode = new Map<string, number>();
  for (const row of counts) countByCode.set(row.state_code, row.deal_count);

  const colorScale = buildColorScale(Array.from(countByCode.values()));

  const centroids = new Map<string, [number, number]>();
  for (const f of geoData.features) {
    centroids.set(f.properties.code, geoCentroid(f.geometry as never) as [number, number]);
  }

  const labelPoints: LabelPoint[] = [];
  const leaderLines: LeaderLine[] = [];
  for (const [code, centroid] of centroids.entries()) {
    const count = countByCode.get(code) ?? 0;
    if (count <= 0) continue;
    const offsetPosition = SMALL_REGION_LABEL_POSITIONS[code];
    const position = offsetPosition ?? centroid;
    // Offset (leader-line) labels sit on the dark page background, not the
    // state's own fill color, so they always stay white for readability.
    const color = offsetPosition ? ([255, 255, 255, 255] as [number, number, number, number]) : labelColorForFill(colorScale(count));
    labelPoints.push({ code, position, text: String(count), color });
    if (offsetPosition) leaderLines.push({ code, source: centroid, target: offsetPosition });
  }

  return [
    new GeoJsonLayer<StateGeoFeature['properties']>({
      id: `${idPrefix}-states`,
      data: geoData,
      filled: true,
      stroked: true,
      getFillColor: (f) => colorScale(countByCode.get(f.properties.code) ?? 0),
      // geoData's reference never changes, so deck.gl won't know to recompute
      // getFillColor's GPU attributes when `counts` updates unless told to here.
      updateTriggers: { getFillColor: counts },
      getLineColor: [40, 40, 40],
      lineWidthMinPixels: 1,
      pickable,
      autoHighlight: pickable,
      highlightColor: [255, 255, 255, 60],
      onClick: onClick ? (info) => info.object?.properties?.code && onClick(info.object.properties.code) : undefined,
      onHover: onHover
        ? (info) => {
            if (info.object) {
              const code = info.object.properties.code;
              onHover({ x: info.x, y: info.y, code, name: info.object.properties.name, count: countByCode.get(code) ?? 0 });
            } else {
              onHover(null);
            }
          }
        : undefined,
    }),
    new LineLayer<LeaderLine>({
      id: `${idPrefix}-leader-lines`,
      data: leaderLines,
      getSourcePosition: (d) => d.source,
      getTargetPosition: (d) => d.target,
      getColor: [255, 255, 255, 160],
      getWidth: 1,
    }),
    new TextLayer<LabelPoint>({
      id: `${idPrefix}-state-labels`,
      data: labelPoints,
      getPosition: (d) => d.position,
      getText: (d) => d.text,
      getSize: 13,
      // 'pixels' (deck.gl's default, made explicit here) keeps label size a
      // constant screen size regardless of zoom level, matching the deck's look.
      sizeUnits: 'pixels',
      getColor: (d) => d.color,
      updateTriggers: { getColor: counts },
      fontFamily: '"Segoe UI", system-ui, sans-serif',
      fontWeight: 700,
      background: false,
    }),
  ];
}
