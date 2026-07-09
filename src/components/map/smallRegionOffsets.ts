/**
 * Curated label positions (lon/lat) for small, tightly-clustered Northeast
 * states/provinces whose polygon is too small to legibly fit a count label.
 * A leader line is drawn from the region's real centroid to this position,
 * replicating the PowerPoint deck's hand-placed callouts for the same states.
 */
export const SMALL_REGION_LABEL_POSITIONS: Record<string, [number, number]> = {
  VT: [-67.5, 46.3],
  NH: [-65.5, 44.6],
  MA: [-65.5, 42.6],
  RI: [-65.5, 40.9],
  CT: [-65.5, 39.2],
  NJ: [-70, 37.2],
  DE: [-70, 35.2],
  MD: [-70, 33.2],
  DC: [-70, 31.2],
  PE: [-58, 48.8],
};
