import { KNOWN_STATE_CODES } from '@/lib/knownStates';
import type { CustStateSource, ParsedDeal, VehicleClass } from '@/types/domain';
import { resolveStateFromZip } from './zipToState';
import type { RawRow } from './parseWorkbook';

export function mapVehicleClass(typeCode: string | null | undefined): VehicleClass | null {
  if (!typeCode) return null;
  const tc = typeCode.toString().trim().toUpperCase();
  if (tc === 'TT' || tc === '5W') return 'towable';
  if (tc === 'A' || tc === 'B' || tc === 'C') return 'motorized';
  return null;
}

export interface ResolvedState {
  custState: string | null;
  custStateSource: CustStateSource | null;
}

/**
 * Resolves the real state for a deal. Case/whitespace differences are
 * normalized first (fixes e.g. `ms` -> `MS`). If the cleaned code still
 * doesn't match a known US state or Canadian province (e.g. `RD`), the
 * state is instead derived from the row's ZIP code rather than being
 * discarded or guessed from the letters themselves.
 */
export function resolveCustState(custStateProvRaw: string | null | undefined, zip: string | null | undefined): ResolvedState {
  const normalized = (custStateProvRaw ?? '').toString().trim().toUpperCase();

  if (normalized && KNOWN_STATE_CODES.has(normalized)) {
    return { custState: normalized, custStateSource: 'reported' };
  }

  const zipState = resolveStateFromZip(zip);
  if (zipState) {
    return { custState: zipState, custStateSource: 'zip_corrected' };
  }

  return { custState: null, custStateSource: null };
}

export function periodMonthFromDate(d: Date | null): string | null {
  if (!d || Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

function toStringOrNull(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null;
  return v.toString().trim();
}

function toDateOrNull(v: unknown): Date | null {
  if (v === null || v === undefined || v === '') return null;
  if (v instanceof Date) return v;
  const d = new Date(v as string);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Maps one raw Excel row (keyed by the source's exact column headers) to a ParsedDeal. */
export function mapRawRowToDeal(row: RawRow): ParsedDeal {
  const dealerCode = toStringOrNull(row['Unit GL Location'])?.toUpperCase() ?? null;
  const stockId = toStringOrNull(row['Stock ID']);
  const datePosted = toDateOrNull(row['Date Posted']);
  const typeCode = toStringOrNull(row['Type Code']);
  const custZip = toStringOrNull(row['Cust Zip Postal']);
  const custStateRaw = toStringOrNull(row['CustStateProv']);
  const { custState, custStateSource } = resolveCustState(custStateRaw, custZip);

  return {
    dealerCode,
    stockId,
    datePosted,
    periodMonth: periodMonthFromDate(datePosted),
    desgn: toStringOrNull(row['Desgn']),
    typeCode,
    vehicleClass: mapVehicleClass(typeCode),
    custStateRaw,
    custState,
    custStateSource,
    custZip,
    custCity: toStringOrNull(row['Cust City']),
    salesPerson: toStringOrNull(row['Sales 1 Name']),
    mfg: toStringOrNull(row['Mfg']),
    brand: toStringOrNull(row['Brand']),
    model: toStringOrNull(row['Model']),
  };
}
