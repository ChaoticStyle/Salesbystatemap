'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Smoothly animates scrollTop with a nicer easing curve than the browser's native 'smooth' behavior. */
function smoothScrollTo(el: HTMLElement, target: number, duration = 550) {
  const start = el.scrollTop;
  const change = target - start;
  const startTime = performance.now();

  function step(now: number) {
    const elapsed = Math.min(1, (now - startTime) / duration);
    el.scrollTop = start + change * easeInOutCubic(elapsed);
    if (elapsed < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

export function GalleryView({ geoData, countsByView, visibleViews, onToggleView }: GalleryViewProps) {
  const visibleDefs = useMemo(() => VIEW_DEFS.filter((v) => visibleViews.has(v.key)), [visibleViews]);
  const hiddenDefs = useMemo(() => VIEW_DEFS.filter((v) => !visibleViews.has(v.key)), [visibleViews]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex((i) => Math.min(i, Math.max(0, visibleDefs.length - 1)));
  }, [visibleDefs.length]);

  function goToIndex(index: number) {
    const clamped = Math.max(0, Math.min(visibleDefs.length - 1, index));
    setCurrentIndex(clamped);
    const container = containerRef.current;
    if (container) smoothScrollTo(container, clamped * container.clientHeight);
  }

  // Keep the index in sync if the user scrolls via the scrollbar/trackpad directly.
  function handleScroll() {
    const container = containerRef.current;
    if (!container) return;
    const idx = Math.round(container.scrollTop / container.clientHeight);
    setCurrentIndex((prev) => (prev === idx ? prev : idx));
  }

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

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full snap-y snap-mandatory overflow-y-auto"
        style={{ height: hiddenDefs.length > 0 ? 'calc(100% - 49px)' : '100%' }}
      >
        {visibleDefs.map((view) => {
          const counts = countsByView[view.key] ?? [];
          const total = counts.reduce((sum, r) => sum + r.deal_count, 0);
          const scopedGeoData = scopeGeoDataForCounts(geoData, counts);

          return (
            <section key={view.key} className="relative h-full w-full snap-start bg-[#3d3d3d] p-4">
              <div className="h-full w-full overflow-hidden rounded-xl border-2 border-white/15 shadow-2xl">
                <DeckMap idPrefix={`gallery-${view.key}`} geoData={scopedGeoData} counts={counts} />
              </div>
              <div className="pointer-events-none absolute top-8 left-8 rounded-lg border border-white/10 bg-black/80 px-4 py-2 shadow-lg">
                <div className="text-lg font-bold text-white">{view.label}</div>
                <div className="text-sm text-white/70">Total: {total}</div>
              </div>
              <button
                onClick={() => onToggleView(view.key)}
                className="absolute top-8 right-8 rounded-md border border-white/10 bg-black/80 px-3 py-2 text-sm text-white/70 shadow-lg hover:text-white"
                title="Hide this view"
              >
                Hide ✕
              </button>
            </section>
          );
        })}
      </div>

      {visibleDefs.length > 1 && (
        <div className="pointer-events-none absolute right-10 bottom-10 flex flex-col gap-2">
          <button
            onClick={() => goToIndex(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="pointer-events-auto rounded-full border border-white/10 bg-black/80 p-3 text-white shadow-lg transition-all hover:bg-black/95 disabled:opacity-30"
            title="Previous view"
          >
            <ChevronIcon direction="up" />
          </button>
          <select
            value={currentIndex}
            onChange={(e) => goToIndex(Number(e.target.value))}
            className="pointer-events-auto rounded-md border border-white/10 bg-black/80 px-2 py-1 text-center text-xs text-white shadow-lg"
            title="Jump to view"
          >
            {visibleDefs.map((v, i) => (
              <option key={v.key} value={i} className="bg-neutral-800 text-white">
                {i + 1}. {v.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => goToIndex(currentIndex + 1)}
            disabled={currentIndex === visibleDefs.length - 1}
            className="pointer-events-auto rounded-full border border-white/10 bg-black/80 p-3 text-white shadow-lg transition-all hover:bg-black/95 disabled:opacity-30"
            title="Next view"
          >
            <ChevronIcon direction="down" />
          </button>
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ direction }: { direction: 'up' | 'down' }) {
  const d = direction === 'up' ? 'M5 12L10 7L15 12' : 'M5 8L10 13L15 8';
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d={d} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
