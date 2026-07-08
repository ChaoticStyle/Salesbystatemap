/**
 * One-off seed script: parses the existing historical .xlsx export(s) with
 * the same mapping/normalization/aggregation logic the live upload pipeline
 * will use, prints a validation summary against known deck totals, and
 * (only when --commit is passed and Supabase env vars are set) writes the
 * result into Supabase.
 *
 * Usage:
 *   npx tsx scripts/seed-historical.ts                # dry run, prints summary only
 *   npx tsx scripts/seed-historical.ts --commit        # also writes to Supabase
 */
import { config } from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
config({ path: path.resolve(__dirname, '../.env.local') });
import { createClient } from '@supabase/supabase-js';
import { parseWorkbookBuffer } from '../src/lib/excel/parseWorkbook';
import { mapRawRowToDeal } from '../src/lib/excel/columnMapping';
import { aggregateDeals } from '../src/lib/aggregate';
import type { ParsedDeal } from '../src/types/domain';

const ROOT = path.resolve(__dirname, '..');

const SOURCE_FILES = [
  'COPY OF Posted Deals by Sales-IDS Support-0126 - 0626 JORDAN REPORT.xlsx',
  'MAY 26 SALES BY STATE.xlsx',
];

function loadDeals(fileName: string): ParsedDeal[] {
  const filePath = path.join(ROOT, fileName);
  if (!fs.existsSync(filePath)) {
    console.warn(`Skipping (not found): ${fileName}`);
    return [];
  }
  const buf = fs.readFileSync(filePath);
  const { rows, totalPhysicalRows } = parseWorkbookBuffer(new Uint8Array(buf));
  console.log(`${fileName}: ${rows.length} clean rows detected out of ${totalPhysicalRows} physical rows`);
  return rows.map(mapRawRowToDeal);
}

function summarize(deals: ParsedDeal[]) {
  const unresolved = deals.filter((d) => !d.custState);
  const zipCorrected = deals.filter((d) => d.custStateSource === 'zip_corrected');
  console.log(`  total deals: ${deals.length}`);
  console.log(`  unresolved state (dropped from map): ${unresolved.length}`);
  if (unresolved.length) {
    console.log('   ', unresolved.map((d) => `${d.custStateRaw ?? '(blank)'}/${d.custZip}`).join(', '));
  }
  console.log(`  zip-corrected rows: ${zipCorrected.length}`);
  for (const d of zipCorrected) {
    console.log(`    ${d.custStateRaw} + zip ${d.custZip} -> ${d.custState}`);
  }
}

async function main() {
  const shouldCommit = process.argv.includes('--commit');

  const allDeals: ParsedDeal[] = [];
  for (const file of SOURCE_FILES) {
    const deals = loadDeals(file);
    summarize(deals);
    allDeals.push(...deals);
  }

  // De-dupe by stockId+periodMonth in case the same deal appears in both the
  // cumulative JORDAN report and the single-month MAY file.
  const seen = new Set<string>();
  const dedupedDeals = allDeals.filter((d) => {
    const key = `${d.stockId}|${d.periodMonth}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  console.log(`\nCombined: ${allDeals.length} rows -> ${dedupedDeals.length} after de-dupe`);

  const { stateViewMonthCounts, viewMonthTotals, unresolvedCount } = aggregateDeals(dedupedDeals);
  console.log(`Aggregated into ${stateViewMonthCounts.length} state/view/month rows, ${unresolvedCount} unresolved deals excluded`);

  // Deck slide 1 ("All Sales by State thru May 2026") is a year-to-date total,
  // i.e. Jan-May 2026 summed, not a single month -- reproduce that here.
  const ytdThruMay = stateViewMonthCounts.filter(
    (r) => r.viewKey === 'ALL' && r.periodMonth >= '2026-01-01' && r.periodMonth <= '2026-05-01',
  );
  const sample = ['MS', 'LA', 'FL', 'QC'];
  console.log('\nValidation sample (ALL view, YTD thru May 2026) vs known deck totals (MS=335, LA=421, FL=240, QC=1):');
  for (const code of sample) {
    const total = ytdThruMay.filter((r) => r.stateCode === code).reduce((sum, r) => sum + r.dealCount, 0);
    console.log(`  ${code}: ${total}`);
  }

  if (!shouldCommit) {
    console.log('\nDry run only (pass --commit to write to Supabase).');
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error('\nMissing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local — cannot commit.');
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey);

  console.log('\nWriting deals + aggregates to Supabase...');
  const { data: upload, error: uploadErr } = await supabase
    .from('uploads')
    .insert({ file_name: SOURCE_FILES.join(' + '), period_month: '2026-01-01', status: 'processing', row_count_raw: dedupedDeals.length, row_count_unmapped: unresolvedCount })
    .select()
    .single();
  if (uploadErr || !upload) throw uploadErr;

  const dealRows = dedupedDeals.map((d) => ({
    upload_id: upload.id,
    period_month: d.periodMonth,
    dealer_code: d.dealerCode,
    stock_id: d.stockId,
    date_posted: d.datePosted,
    desgn: d.desgn,
    type_code: d.typeCode,
    vehicle_class: d.vehicleClass,
    cust_state_raw: d.custStateRaw,
    cust_state: d.custState,
    cust_state_source: d.custStateSource,
    cust_zip: d.custZip,
    cust_city: d.custCity,
    sales_person: d.salesPerson,
    mfg: d.mfg,
    brand: d.brand,
    model: d.model,
  }));

  const CHUNK = 500;
  for (let i = 0; i < dealRows.length; i += CHUNK) {
    const { error } = await supabase.from('deals').insert(dealRows.slice(i, i + CHUNK));
    if (error) throw error;
  }

  const countRows = stateViewMonthCounts.map((r) => ({
    period_month: r.periodMonth,
    view_key: r.viewKey,
    state_code: r.stateCode,
    deal_count: r.dealCount,
    deal_amount: r.dealAmount,
  }));
  for (let i = 0; i < countRows.length; i += CHUNK) {
    const { error } = await supabase.from('state_view_month_counts').upsert(countRows.slice(i, i + CHUNK));
    if (error) throw error;
  }

  const totalRows = viewMonthTotals.map((r) => ({
    period_month: r.periodMonth,
    view_key: r.viewKey,
    total_count: r.totalCount,
    total_amount: r.totalAmount,
  }));
  const { error: totalsErr } = await supabase.from('view_month_totals').upsert(totalRows);
  if (totalsErr) throw totalsErr;

  await supabase.from('uploads').update({ status: 'succeeded' }).eq('id', upload.id);
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
