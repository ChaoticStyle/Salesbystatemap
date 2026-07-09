import { createClient } from '@/lib/supabase/client';

export interface StateCountRow {
  state_code: string;
  deal_count: number;
}

export type PeriodMode = 'ytd' | 'single';

export interface PeriodSelection {
  mode: PeriodMode;
  year: number;
  month: number; // 1-12
}

function periodMonthString(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

/** Fetches state counts for every view at once, keyed by view_key -- backs both the single-map view (by indexing in) and the gallery/multi-window mode. */
export async function fetchAllViewCounts(period: PeriodSelection): Promise<Record<string, StateCountRow[]>> {
  const supabase = createClient();
  let query = supabase.from('state_view_month_counts').select('view_key, state_code, deal_count, period_month');

  if (period.mode === 'single') {
    query = query.eq('period_month', periodMonthString(period.year, period.month));
  } else {
    query = query.gte('period_month', periodMonthString(period.year, 1)).lte('period_month', periodMonthString(period.year, period.month));
  }

  const { data, error } = await query;
  if (error) throw error;

  const byView = new Map<string, Map<string, number>>();
  for (const row of data ?? []) {
    const stateMap = byView.get(row.view_key) ?? new Map<string, number>();
    stateMap.set(row.state_code, (stateMap.get(row.state_code) ?? 0) + row.deal_count);
    byView.set(row.view_key, stateMap);
  }

  const result: Record<string, StateCountRow[]> = {};
  for (const [viewKey, stateMap] of byView.entries()) {
    result[viewKey] = Array.from(stateMap.entries()).map(([state_code, deal_count]) => ({ state_code, deal_count }));
  }
  return result;
}

export interface AvailablePeriods {
  years: number[];
  monthsByYear: Record<number, number[]>;
}

export async function fetchAvailablePeriods(): Promise<AvailablePeriods> {
  const supabase = createClient();
  const { data, error } = await supabase.from('view_month_totals').select('period_month');
  if (error) throw error;

  const monthsByYear: Record<number, number[]> = {};
  for (const row of data ?? []) {
    const year = Number(row.period_month.slice(0, 4));
    const month = Number(row.period_month.slice(5, 7));
    monthsByYear[year] = monthsByYear[year] ?? [];
    if (!monthsByYear[year].includes(month)) monthsByYear[year].push(month);
  }
  for (const year of Object.keys(monthsByYear)) {
    monthsByYear[Number(year)].sort((a, b) => a - b);
  }
  const years = Object.keys(monthsByYear).map(Number).sort((a, b) => a - b);

  return { years, monthsByYear };
}
