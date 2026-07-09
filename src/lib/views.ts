import type { ParsedDeal, ViewKey } from '@/types/domain';

export interface ViewDef {
  key: ViewKey;
  label: string;
  group: 'overall' | 'byType' | 'dealer';
  matches: (deal: ParsedDeal) => boolean;
}

const DEALER_VIEW_CODES = ['ABB', 'BAY', 'CLE', 'HEF', 'HUN', 'HAT', 'TUP', 'LFT'] as const;

export const VIEW_DEFS: ViewDef[] = [
  { key: 'ALL', label: 'All Sales', group: 'overall', matches: () => true },
  { key: 'MOTORIZED', label: 'All Motorized', group: 'byType', matches: (d) => d.vehicleClass === 'motorized' },
  { key: 'TOWABLES', label: 'All Towables', group: 'byType', matches: (d) => d.vehicleClass === 'towable' },
  { key: 'HMD_COMBINED', label: 'HMD Combined', group: 'dealer', matches: (d) => d.dealerCode === 'HMD' },
  { key: 'HMD_MOTORIZED', label: 'HMD MOTOR', group: 'dealer', matches: (d) => d.dealerCode === 'HMD' && d.vehicleClass === 'motorized' },
  { key: 'HMD_TOWABLES', label: 'HMD TOW', group: 'dealer', matches: (d) => d.dealerCode === 'HMD' && d.vehicleClass === 'towable' },
  ...DEALER_VIEW_CODES.map(
    (code): ViewDef => ({
      key: `DEALER_${code}` as ViewKey,
      label: code,
      group: 'dealer',
      matches: (d) => d.dealerCode === code,
    }),
  ),
];

export const VIEW_DEFS_BY_KEY: Record<ViewKey, ViewDef> = Object.fromEntries(
  VIEW_DEFS.map((v) => [v.key, v]),
) as Record<ViewKey, ViewDef>;
