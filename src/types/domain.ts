export type RegionType = 'us_state' | 'ca_province' | 'other';

export interface StateRef {
  code: string;
  name: string;
  regionType: RegionType;
  fipsOrGeoId: string;
}

export type VehicleClass = 'motorized' | 'towable';

export type CustStateSource = 'reported' | 'zip_corrected';

export interface ParsedDeal {
  dealerCode: string | null;
  stockId: string | null;
  datePosted: Date | null;
  periodMonth: string | null; // 'YYYY-MM-01'
  desgn: string | null;
  typeCode: string | null;
  vehicleClass: VehicleClass | null;
  custStateRaw: string | null;
  custState: string | null;
  custStateSource: CustStateSource | null;
  custZip: string | null;
  custCity: string | null;
  salesPerson: string | null;
  mfg: string | null;
  brand: string | null;
  model: string | null;
}

export type ViewKey =
  | 'ALL'
  | 'MOTORIZED'
  | 'TOWABLES'
  | 'HMD_COMBINED'
  | 'HMD_MOTORIZED'
  | 'HMD_TOWABLES'
  | 'DEALER_ABB'
  | 'DEALER_BAY'
  | 'DEALER_CLE'
  | 'DEALER_HEF'
  | 'DEALER_HUN'
  | 'DEALER_HAT'
  | 'DEALER_TUP'
  | 'DEALER_LFT';

export interface StateViewMonthCount {
  periodMonth: string;
  viewKey: ViewKey;
  stateCode: string;
  dealCount: number;
  dealAmount: number | null;
}
