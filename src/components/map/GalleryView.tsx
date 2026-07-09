'use client';

import { useMemo } from 'react';
import { VIEW_DEFS } from '@/lib/views';
import { DeckMap } from './DeckMap';
import { scopeGeoDataForCounts } from './scopeGeoData';
import type { StateCountRow } from '@/lib/queries';
import type { StateGeoFeature } from './types';

interface GalleryViewProps {
  geoData: { type: 'FeatureCollection'; features: StateGeoFeature[] } | null;
  countsByView: Record<string, StateCountRow[]>;
  visibleViews: Set<string>;
  onToggleView: (key: string) => void;
}

export function GalleryView({ geoData, countsByView, visibleViews, onToggleView }: GalleryViewProps) {
  const visibleDefs = useMemo(() => VIEW_DEFS.filter((v) => visibleViews.has(v.key)), [visibleViews]);
  const hiddenDefs = useMemo(() => VIEW_DEFS.filter((v) => !visibleViews.has(v.key)), [visibleViews]);

  return (
    <div className="h-full">
      {hiddenDefs.length > 0 && (
        <div className="flex flex-wrap gap-2 border-b border-white/10 bg-black/30 p-3">
          {hiddenDefs.map((v) => (
            <button
              key={v.key}
              onClick={() => onToggleView(v.key)}
              className="rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60 hover:bg-white/10"
            >
              Show {v.label}
            </button>
          ))}
        </div>
      )}

      <div className="h-full snap-y snap-mandatory overflow-y-auto scroll-smooth" style={{ height: hiddenDefs.length > 0 ? 'calc(100% - 49px)' : '100%' }}>
        {visibleDefs.map((view) => {
          const counts = countsByView[view.key] ?? [];
          const total = counts.reduce((sum, r) => sum + r.deal_count, 0);
          const scopedGeoData = scopeGeoDataForCounts(geoData, counts);

          return (
            <section key={view.key} className="relative h-full w-full snap-start">
              <DeckMap idPrefix={`gallery-${view.key}`} geoData={scopedGeoData} counts={counts} />
              <div className="pointer-events-none absolute top-4 left-4 rounded-lg border border-white/10 bg-black/80 px-4 py-2 shadow-lg">
                <div className="text-lg font-bold text-white">{view.label}</div>
                <div className="text-sm text-white/70">Total: {total}</div>
              </div>
              <button
                onClick={() => onToggleView(view.key)}
                className="absolute top-4 right-4 rounded-md border border-white/10 bg-black/80 px-3 py-2 text-sm text-white/70 shadow-lg hover:text-white"
                title="Hide this view"
              >
                Hide ✕
              </button>
            </section>
          );
        })}
      </div>
    </div>
  );
}
