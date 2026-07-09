'use client';

import { VIEW_DEFS } from '@/lib/views';
import { MiniMap } from './MiniMap';
import type { StateCountRow } from '@/lib/queries';
import type { StateGeoFeature } from './types';

interface GalleryViewProps {
  geoData: { type: 'FeatureCollection'; features: StateGeoFeature[] } | null;
  countsByView: Record<string, StateCountRow[]>;
  visibleViews: Set<string>;
  onToggleView: (key: string) => void;
}

export function GalleryView({ geoData, countsByView, visibleViews, onToggleView }: GalleryViewProps) {
  return (
    <div className="grid h-full auto-rows-min grid-cols-2 gap-3 overflow-y-auto p-4 md:grid-cols-3 xl:grid-cols-4">
      {VIEW_DEFS.map((view) => {
        const counts = countsByView[view.key] ?? [];
        const total = counts.reduce((sum, r) => sum + r.deal_count, 0);
        const visible = visibleViews.has(view.key);

        if (!visible) {
          return (
            <button
              key={view.key}
              onClick={() => onToggleView(view.key)}
              className="flex h-12 items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white/60 hover:bg-white/10"
            >
              <span>{view.label} (hidden)</span>
              <span className="text-xs uppercase">Show</span>
            </button>
          );
        }

        return (
          <div key={view.key} className="flex flex-col overflow-hidden rounded-md border border-white/10 bg-black/20">
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-sm font-semibold text-white">{view.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{total}</span>
                <button
                  onClick={() => onToggleView(view.key)}
                  className="rounded px-1.5 py-0.5 text-xs text-white/50 hover:bg-white/10 hover:text-white"
                  title="Hide this view"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="h-48">
              <MiniMap id={`gallery-${view.key}`} geoData={geoData} counts={counts} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
