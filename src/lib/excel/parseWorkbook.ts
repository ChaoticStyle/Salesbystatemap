import * as XLSX from 'xlsx';

export type RawRow = Record<string, unknown>;

export interface ParseWorkbookResult {
  rows: RawRow[];
  totalPhysicalRows: number;
}

/**
 * Reads the first worksheet of an uploaded .xlsx and returns only the clean
 * deal rows. End-of-data is detected by scanning for the first row whose key
 * columns (Stock ID / Cust ID) are both blank, rather than a hardcoded row
 * number — the source file may also contain a trailing pivot table/blank
 * spacer rows below the real data, and the exact cutoff row shifts month to
 * month.
 */
export function parseWorkbookBuffer(data: ArrayBuffer | Uint8Array): ParseWorkbookResult {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const workbook = XLSX.read(bytes, { type: 'array', cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const allRows: RawRow[] = XLSX.utils.sheet_to_json(sheet, { defval: null });

  const rows: RawRow[] = [];
  for (const row of allRows) {
    const stockId = row['Stock ID'];
    const custId = row['Cust ID'];
    const isBlank = (v: unknown) => v === null || v === undefined || v === '';
    if (isBlank(stockId) && isBlank(custId)) {
      break;
    }
    rows.push(row);
  }

  return { rows, totalPhysicalRows: allRows.length };
}
