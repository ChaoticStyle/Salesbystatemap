/**
 * Curated label positions (lon/lat) for small, tightly-clustered Northeast
 * states/provinces whose polygon is too small to legibly fit a count label.
 * A leader line is drawn from the region's real centroid to this position,
 * replicating the PowerPoint deck's hand-placed callouts for the same states.
 */
// Each position was chosen by computing the region's real centroid and
// binary-searching along a ray toward open water for the closest point that
// doesn't land inside any other state/province polygon (verified against the
// actual public/us-states.json geometry), then extending that vector 1.5x
// (re-verified still safe) for a more visible leader line -- this guarantees
// it never overlaps a neighboring selectable region (e.g. NH no longer lands
// on New Brunswick) while keeping the line clearly connected to its state.
export const SMALL_REGION_LABEL_POSITIONS: Record<string, [number, number]> = {
  VT: [-69.51, 42.92],
  NH: [-70.35, 42.65],
  MA: [-69.12, 41.38],
  RI: [-71.35, 41.41],
  CT: [-71.77, 40.82],
  NJ: [-73.83, 39.54],
  DE: [-74.87, 38.61],
  MD: [-74.65, 37.3],
  DC: [-76.27, 38.39],
  PE: [-62.95, 43.82],
};
