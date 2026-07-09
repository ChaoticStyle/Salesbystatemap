import { interpolateBlues } from 'd3-scale-chromatic';

export const NO_DATA_COLOR: [number, number, number] = [217, 217, 217]; // #D9D9D9
export const PAGE_BACKGROUND_COLOR = '#595959';

/** Builds a per-render color function matching the deck's pale-blue -> navy ramp, scaled to the current view+period's own min/max (as the deck did per-slide). */
export function buildColorScale(values: number[]): (value: number) => [number, number, number] {
  const max = Math.max(1, ...values);

  return (value: number) => {
    if (value <= 0) return NO_DATA_COLOR;
    // interpolateBlues gets very pale near 0; bias the floor so the lowest
    // nonzero values are still visibly blue rather than near-white.
    const t = 0.25 + 0.75 * (value / max);
    return parseRgb(interpolateBlues(t));
  };
}

function parseRgb(css: string): [number, number, number] {
  const m = css.match(/(\d+(?:\.\d+)?)/g);
  if (!m || m.length < 3) return [0, 0, 0];
  return [Math.round(Number(m[0])), Math.round(Number(m[1])), Math.round(Number(m[2]))];
}

/** Perceptual luminance (0-255); used to decide whether a label needs black or white text to stay readable against its fill color. */
export function luminance([r, g, b]: [number, number, number]): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function labelColorForFill(fill: [number, number, number]): [number, number, number, number] {
  return luminance(fill) > 150 ? [0, 0, 0, 255] : [255, 255, 255, 255];
}
