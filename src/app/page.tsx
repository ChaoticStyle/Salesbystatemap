'use client';

import { useEffect, useMemo, useState } from 'react';
import { DeckMap } from '@/components/map/DeckMap';
import { GalleryView } from '@/components/map/GalleryView';
import { ViewSelector } from '@/components/map/ViewSelector';
import { PeriodSelector } from '@/components/map/PeriodSelector';
import { VIEW_DEFS } from '@/lib/views';
import type { StateGeoFeature } from '@/components/map/types';
import { fetchAvailablePeriods, fetchAllViewCounts, type AvailablePeriods, type PeriodSelection, type StateCountRow } from '@/lib/queries';
import type { ViewKey } from '@/types/domain';

type ViewMode = 'single' | 'gallery';

export default function Home() {
  const [geoData, setGeoData] = useState<{ type: 'FeatureCollection'; features: StateGeoFeature[] } | null>(null);
  const [viewKey, setViewKey] = useState<ViewKey>('ALL');
  const [period, setPeriod] = useState<PeriodSelection>({ mode: 'ytd', year: 2026, month: 6 });
  const [periods, setPeriods] = useState<AvailablePeriods>({ years: [2026], monthsByYear: { 2026: [1, 2, 3, 4, 5, 6] } });
  const [countsByView, setCountsByView] = useState<Record<string, StateCountRow[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [visibleViews, setVisibleViews] = useState<Set<string>>(() => new Set(VIEW_DEFS.map((v) => v.key)));

  useEffect(() => {
    fetch('/us-states.json')
      .then((r) => r.json())
      .then(setGeoData)
      .catch((e) => setError(`Failed to load map geometry: ${e.message}`));
  }, []);

  useEffect(() => {
    fetchAvailablePeriods()
      .then((p) => {
        if (p.years.length > 0) setPeriods(p);
      })
      .catch((e) => setError(`Supabase not reachable yet: ${e.message}`));
  }, []);

  useEffect(() => {
    fetchAllViewCounts(period)
      .then(setCountsByView)
      .catch((e) => setError(`Supabase not reachable yet: ${e.message}`));
  }, [period]);

  const counts = useMemo(() => countsByView[viewKey] ?? [], [countsByView, viewKey]);
  const total = counts.reduce((sum, r) => sum + r.deal_count, 0);

  function toggleView(key: string) {
    setVisibleViews((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="flex h-screen bg-[#595959]">
      {sidebarOpen && (
        <aside className="flex w-72 shrink-0 flex-col gap-5 overflow-y-auto bg-black/30 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">Sales by State</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
              title="Hide menu"
            >
              <HamburgerIcon />
            </button>
          </div>

          <div className="flex overflow-hidden rounded-md text-sm">
            <button
              onClick={() => setViewMode('single')}
              className={`flex-1 px-2 py-1.5 ${viewMode === 'single' ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/80 hover:bg-white/15'}`}
            >
              Single map
            </button>
            <button
              onClick={() => setViewMode('gallery')}
              className={`flex-1 px-2 py-1.5 ${viewMode === 'gallery' ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/80 hover:bg-white/15'}`}
            >
              All views
            </button>
          </div>

          {viewMode === 'single' && <ViewSelector value={viewKey} onChange={setViewKey} />}
          <PeriodSelector value={period} onChange={setPeriod} years={periods.years} monthsByYear={periods.monthsByYear} />
          {error && <div className="rounded bg-red-900/60 px-3 py-2 text-sm text-red-100">{error}</div>}
        </aside>
      )}

      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-30 rounded bg-black/50 p-2 text-white/80 hover:bg-black/70 hover:text-white"
          title="Show menu"
        >
          <HamburgerIcon />
        </button>
      )}

      <div className="relative flex-1">
        {viewMode === 'single' ? (
          <>
            <DeckMap geoData={geoData} counts={counts} />
            <div className="pointer-events-none absolute right-6 bottom-6 rounded-lg border border-white/10 bg-black/80 px-6 py-3 text-right shadow-lg">
              <div className="text-xs font-semibold tracking-wide text-white/60 uppercase">Total</div>
              <div className="text-5xl font-bold text-white">{total}</div>
            </div>
          </>
        ) : (
          <GalleryView geoData={geoData} countsByView={countsByView} visibleViews={visibleViews} onToggleView={toggleView} />
        )}
      </div>
    </div>
  );
}

function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 5H17M3 10H17M3 15H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
