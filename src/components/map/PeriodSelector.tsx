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
    <div className="flex flex-col gap-2">
      <div className="text-xs font-semibold tracking-wide text-white/50 uppercase">Period</div>

      <div className="flex overflow-hidden rounded-md text-sm">
        {(['ytd', 'single'] as PeriodMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => onChange({ ...value, mode })}
            className={`flex-1 px-2 py-1.5 ${value.mode === mode ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/80 hover:bg-white/15'}`}
          >
            {mode === 'ytd' ? 'Thru month' : 'Single month'}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <select
          value={value.year}
          onChange={(e) => onChange({ ...value, year: Number(e.target.value) })}
          className="flex-1 rounded-md bg-white/5 px-2 py-1.5 text-sm text-white"
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
          className="flex-1 rounded-md bg-white/5 px-2 py-1.5 text-sm text-white"
        >
          {availableMonths.map((m) => (
            <option key={m} value={m} className="text-black">
              {MONTH_LABELS[m - 1]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
