import type { ParsedDeal, StateViewMonthCount } from '@/types/domain';
import { VIEW_DEFS } from '@/lib/views';

export interface ViewMonthTotal {
  periodMonth: string;
  viewKey: string;
  totalCount: number;
  totalAmount: number | null;
}

export interface AggregateResult {
  stateViewMonthCounts: StateViewMonthCount[];
  viewMonthTotals: ViewMonthTotal[];
  unresolvedCount: number;
}

/**
 * Rebuilds state_view_month_counts + view_month_totals from a set of parsed
 * deals. Deals with no resolved state (custState null) are excluded from the
 * map aggregates but counted in `unresolvedCount` for the admin/anomaly UI.
 */
export function aggregateDeals(deals: ParsedDeal[]): AggregateResult {
  const countMap = new Map<string, number>(); // key: periodMonth|viewKey|stateCode
  const totalMap = new Map<string, number>(); // key: periodMonth|viewKey
  let unresolvedCount = 0;

  for (const deal of deals) {
    if (!deal.periodMonth) continue;
    if (!deal.custState) {
      unresolvedCount += 1;
      continue;
    }

    for (const view of VIEW_DEFS) {
      if (!view.matches(deal)) continue;

      const countKey = `${deal.periodMonth}|${view.key}|${deal.custState}`;
      countMap.set(countKey, (countMap.get(countKey) ?? 0) + 1);

      const totalKey = `${deal.periodMonth}|${view.key}`;
      totalMap.set(totalKey, (totalMap.get(totalKey) ?? 0) + 1);
    }
  }

  const stateViewMonthCounts: StateViewMonthCount[] = Array.from(countMap.entries()).map(([key, dealCount]) => {
    const [periodMonth, viewKey, stateCode] = key.split('|');
    return { periodMonth, viewKey: viewKey as StateViewMonthCount['viewKey'], stateCode, dealCount, dealAmount: null };
  });

  const viewMonthTotals: ViewMonthTotal[] = Array.from(totalMap.entries()).map(([key, totalCount]) => {
    const [periodMonth, viewKey] = key.split('|');
    return { periodMonth, viewKey, totalCount, totalAmount: null };
  });

  return { stateViewMonthCounts, viewMonthTotals, unresolvedCount };
}
