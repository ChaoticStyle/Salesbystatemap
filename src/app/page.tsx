'use client';

import { useEffect, useState } from 'react';
import { DeckMap } from '@/components/map/DeckMap';
import { ViewSelector } from '@/components/map/ViewSelector';
import { PeriodSelector } from '@/components/map/PeriodSelector';
import type { StateGeoFeature } from '@/components/map/types';
import { fetchAvailablePeriods, fetchStateCounts, type AvailablePeriods, type PeriodSelection, type StateCountRow } from '@/lib/queries';
import type { ViewKey } from '@/types/domain';

export default function Home() {
  const [geoData, setGeoData] = useState<{ type: 'FeatureCollection'; features: StateGeoFeature[] } | null>(null);
  const [viewKey, setViewKey] = useState<ViewKey>('ALL');
  const [period, setPeriod] = useState<PeriodSelection>({ mode: 'ytd', year: 2026, month: 6 });
  const [periods, setPeriods] = useState<AvailablePeriods>({ years: [2026], monthsByYear: { 2026: [1, 2, 3, 4, 5, 6] } });
  const [counts, setCounts] = useState<StateCountRow[]>([]);
  const [error, setError] = useState<string | null>(null);

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
    fetchStateCounts(viewKey, period)
      .then(setCounts)
      .catch((e) => setError(`Supabase not reachable yet: ${e.message}`));
  }, [viewKey, period]);

  const total = counts.reduce((sum, r) => sum + r.deal_count, 0);

  return (
    <div className="flex h-screen bg-[#595959]">
      <aside className="flex w-72 shrink-0 flex-col gap-5 overflow-y-auto bg-black/30 p-4">
        <h1 className="text-xl font-bold text-white">Sales by State</h1>
        <ViewSelector value={viewKey} onChange={setViewKey} />
        <PeriodSelector value={period} onChange={setPeriod} years={periods.years} monthsByYear={periods.monthsByYear} />
        {error && <div className="rounded bg-red-900/60 px-3 py-2 text-sm text-red-100">{error}</div>}
      </aside>
      <div className="relative flex-1">
        <DeckMap geoData={geoData} counts={counts} />
        <div className="pointer-events-none absolute top-1/2 right-10 -translate-y-1/2 text-right">
          <div className="text-sm font-semibold tracking-wide text-white/70 uppercase">Total</div>
          <div className="text-7xl font-bold text-white drop-shadow-lg">{total}</div>
        </div>
      </div>
    </div>
  );
}
