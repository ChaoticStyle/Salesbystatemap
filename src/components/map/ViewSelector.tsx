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
    <div className="flex flex-col gap-4">
      <Section title="Overall">
        {overall.map((v) => (
          <OptionButton key={v.key} active={value === v.key} onClick={() => onChange(v.key)}>
            {v.label}
          </OptionButton>
        ))}
      </Section>
      <Section title="By Dealer">
        <div className="grid grid-cols-2 gap-1.5">
          {dealer.map((v) => (
            <OptionButton key={v.key} active={value === v.key} onClick={() => onChange(v.key)}>
              {v.label}
            </OptionButton>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-xs font-semibold tracking-wide text-white/50 uppercase">{title}</div>
      {children}
    </div>
  );
}

function OptionButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
        active ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/80 hover:bg-white/15'
      }`}
    >
      {children}
    </button>
  );
}
