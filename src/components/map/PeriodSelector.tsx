'use client';

import type { PeriodMode, PeriodSelection } from '@/lib/queries';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface PeriodSelectorProps {
  value: PeriodSelection;
  onChange: (period: PeriodSelection) => void;
  years: number[];
  monthsByYear: Record<number, number[]>;
}

export function PeriodSelector({ value, onChange, years, monthsByYear }: PeriodSelectorProps) {
  const availableMonths = monthsByYear[value.year] ?? [];

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-white">
      <div className="flex overflow-hidden rounded">
        {(['ytd', 'single'] as PeriodMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => onChange({ ...value, mode })}
            className={`px-2 py-1 ${value.mode === mode ? 'bg-blue-600' : 'bg-white/10 hover:bg-white/20'}`}
          >
            {mode === 'ytd' ? 'Thru month (YTD)' : 'Single month'}
          </button>
        ))}
      </div>

      <select
        value={value.year}
        onChange={(e) => onChange({ ...value, year: Number(e.target.value) })}
        className="rounded bg-white/10 px-2 py-1"
      >
        {years.map((y) => (
          <option key={y} value={y} className="text-black">
            {y}
          </option>
        ))}
      </select>

      <select
        value={value.month}
        onChange={(e) => onChange({ ...value, month: Number(e.target.value) })}
        className="rounded bg-white/10 px-2 py-1"
      >
        {availableMonths.map((m) => (
          <option key={m} value={m} className="text-black">
            {MONTH_LABELS[m - 1]}
          </option>
        ))}
      </select>
    </div>
  );
}
