/**
 * Curated label positions (lon/lat) for small, tightly-clustered Northeast
 * states/provinces whose polygon is too small to legibly fit a count label.
 * A leader line is drawn from the region's real centroid to this position,
 * replicating the PowerPoint deck's hand-placed callouts for the same states.
 */
// Each position was chosen by computing the region's real centroid and
// binary-searching along a ray toward open water for the closest point that
// doesn't land inside any other state/province polygon (verified against the
// actual public/us-states.json geometry) -- this keeps every leader line as
// short as possible while guaranteeing it never overlaps a neighboring
// selectable region (e.g. NH no longer lands on New Brunswick).
export const SMALL_REGION_LABEL_POSITIONS: Record<string, [number, number]> = {
  VT: [-70.56, 43.3],
  NH: [-70.76, 42.99],
  MA: [-70.01, 41.67],
  RI: [-71.42, 41.5],
  CT: [-72.09, 41.09],
  NJ: [-74.11, 39.75],
  DE: [-75.08, 38.74],
  MD: [-75.35, 37.88],
  DC: [-76.52, 38.56],
  PE: [-63.05, 44.68],
};
