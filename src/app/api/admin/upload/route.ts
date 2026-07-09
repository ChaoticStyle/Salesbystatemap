import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServiceRoleClient, isAdminEmail } from '@/lib/supabase/serviceRole';
import type { ParsedDeal, StateViewMonthCount } from '@/types/domain';

interface UploadPayload {
  fileName: string;
  year: number;
  rowCountRaw: number;
  rowCountUnmapped: number;
  deals: ParsedDeal[];
  stateViewMonthCounts: StateViewMonthCount[];
  viewMonthTotals: { periodMonth: string; viewKey: string; totalCount: number; totalAmount: number | null }[];
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const {
    data: { user },
  } = await anonClient.auth.getUser(token);

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const body = (await request.json()) as UploadPayload;
  const { fileName, year, rowCountRaw, rowCountUnmapped, deals, stateViewMonthCounts, viewMonthTotals } = body;

  if (!year || !Number.isInteger(year)) {
    return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
  }

  const db = createServiceRoleClient();
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year + 1}-01-01`;

  const { data: upload, error: uploadInsertErr } = await db
    .from('uploads')
    .insert({
      file_name: fileName,
      period_month: yearStart,
      uploaded_by: user.email,
      status: 'processing',
      row_count_raw: rowCountRaw,
      row_count_unmapped: rowCountUnmapped,
    })
    .select()
    .single();

  if (uploadInsertErr || !upload) {
    return NextResponse.json({ error: uploadInsertErr?.message ?? 'Failed to log upload' }, { status: 500 });
  }

  try {
    // Wipe-and-replace: each monthly file is the full Jan-thru-current-month
    // cumulative picture for its year, so it fully supersedes prior data for
    // that year (other years are untouched).
    const { error: delDealsErr } = await db.from('deals').delete().gte('period_month', yearStart).lt('period_month', yearEnd);
    if (delDealsErr) throw delDealsErr;

    const { error: delCountsErr } = await db
      .from('state_view_month_counts')
      .delete()
      .gte('period_month', yearStart)
      .lt('period_month', yearEnd);
    if (delCountsErr) throw delCountsErr;

    const { error: delTotalsErr } = await db.from('view_month_totals').delete().gte('period_month', yearStart).lt('period_month', yearEnd);
    if (delTotalsErr) throw delTotalsErr;

    const dealRows = deals.map((d) => ({
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

    for (const batch of chunk(dealRows, 500)) {
      const { error } = await db.from('deals').insert(batch);
      if (error) throw error;
    }

    const countRows = stateViewMonthCounts.map((r) => ({
      period_month: r.periodMonth,
      view_key: r.viewKey,
      state_code: r.stateCode,
      deal_count: r.dealCount,
      deal_amount: r.dealAmount,
    }));
    for (const batch of chunk(countRows, 500)) {
      const { error } = await db.from('state_view_month_counts').upsert(batch);
      if (error) throw error;
    }

    const totalRows = viewMonthTotals.map((r) => ({
      period_month: r.periodMonth,
      view_key: r.viewKey,
      total_count: r.totalCount,
      total_amount: r.totalAmount,
    }));
    const { error: totalsErr } = await db.from('view_month_totals').upsert(totalRows);
    if (totalsErr) throw totalsErr;

    await db.from('uploads').update({ status: 'succeeded' }).eq('id', upload.id);

    return NextResponse.json({ ok: true, uploadId: upload.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db.from('uploads').update({ status: 'failed', notes: message }).eq('id', upload.id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
