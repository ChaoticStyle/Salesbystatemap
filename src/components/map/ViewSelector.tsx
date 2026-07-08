'use client';

import { VIEW_DEFS } from '@/lib/views';
import type { ViewKey } from '@/types/domain';

interface ViewSelectorProps {
  value: ViewKey;
  onChange: (key: ViewKey) => void;
}

export function ViewSelector({ value, onChange }: ViewSelectorProps) {
  const overall = VIEW_DEFS.filter((v) => v.group === 'overall');
  const dealer = VIEW_DEFS.filter((v) => v.group === 'dealer');

  return (
    <div className="flex flex-wrap gap-4 text-sm">
      <div className="flex flex-wrap gap-1">
        {overall.map((v) => (
          <button
            key={v.key}
            onClick={() => onChange(v.key)}
            className={`rounded px-2 py-1 ${value === v.key ? 'bg-blue-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
            {v.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        {dealer.map((v) => (
          <button
            key={v.key}
            onClick={() => onChange(v.key)}
            className={`rounded px-2 py-1 ${value === v.key ? 'bg-blue-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}
