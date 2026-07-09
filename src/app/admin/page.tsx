'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { parseWorkbookBuffer } from '@/lib/excel/parseWorkbook';
import { mapRawRowToDeal } from '@/lib/excel/columnMapping';
import { aggregateDeals } from '@/lib/aggregate';
import type { ParsedDeal } from '@/types/domain';

interface ParsedFile {
  fileName: string;
  deals: ParsedDeal[];
  totalPhysicalRows: number;
  years: number[];
}

export default function AdminUploadPage() {
  const router = useRouter();
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleFile(file: File) {
    setParseError(null);
    setResult(null);
    try {
      const buf = await file.arrayBuffer();
      const { rows, totalPhysicalRows } = parseWorkbookBuffer(new Uint8Array(buf));
      const deals = rows.map(mapRawRowToDeal);
      const years = Array.from(new Set(deals.map((d) => d.periodMonth?.slice(0, 4)).filter((y): y is string => !!y))).map(Number).sort();
      setParsed({ fileName: file.name, deals, totalPhysicalRows, years });
    } catch (e) {
      setParseError(e instanceof Error ? e.message : String(e));
    }
  }

  const summary = useMemo(() => {
    if (!parsed) return null;
    const { deals } = parsed;
    const zipCorrected = deals.filter((d) => d.custStateSource === 'zip_corrected');
    const unresolved = deals.filter((d) => !d.custState);
    const byDealer = new Map<string, number>();
    for (const d of deals) {
      const key = d.dealerCode ?? '(none)';
      byDealer.set(key, (byDealer.get(key) ?? 0) + 1);
    }
    const { stateViewMonthCounts, viewMonthTotals } = aggregateDeals(deals);
    return { zipCorrected, unresolved, byDealer, stateViewMonthCounts, viewMonthTotals };
  }, [parsed]);

  async function handleConfirm() {
    if (!parsed || !summary) return;
    if (parsed.years.length !== 1) {
      setResult({ ok: false, message: `Expected exactly one year in this file, found: ${parsed.years.join(', ') || 'none'}. Refusing to upload.` });
      return;
    }

    setSubmitting(true);
    setResult(null);

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          fileName: parsed.fileName,
          year: parsed.years[0],
          rowCountRaw: parsed.deals.length,
          rowCountUnmapped: summary.unresolved.length,
          deals: parsed.deals,
          stateViewMonthCounts: summary.stateViewMonthCounts,
          viewMonthTotals: summary.viewMonthTotals,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');
      setResult({ ok: true, message: `Uploaded successfully: ${parsed.deals.length} deals for ${parsed.years[0]}.` });
      setParsed(null);
    } catch (e) {
      setResult({ ok: false, message: e instanceof Error ? e.message : String(e) });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#595959] p-8 text-white">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Upload Monthly Data</h1>
          <div className="flex gap-3">
            <a href="/admin/uploads" className="rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20">
              Upload History
            </a>
            <a href="/" className="rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20">
              View Map
            </a>
            <button onClick={handleLogout} className="rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20">
              Log out
            </button>
          </div>
        </div>

        <p className="text-sm text-white/70">
          Upload the cumulative Jan-thru-current-month Excel export. It will completely replace any existing data for that year --
          double check the preview below before confirming.
        </p>

        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-white/20 bg-black/20 p-10 text-center hover:border-white/40">
          <span className="font-semibold">Drop or click to select the .xlsx file</span>
          <input
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </label>

        {parseError && <div className="rounded bg-red-900/60 px-3 py-2 text-sm text-red-100">Failed to parse file: {parseError}</div>}

        {parsed && summary && (
          <div className="flex flex-col gap-4 rounded-lg bg-black/30 p-5">
            <h2 className="text-lg font-bold">Preview: {parsed.fileName}</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                Rows parsed: <strong>{parsed.deals.length}</strong> (of {parsed.totalPhysicalRows} physical rows)
              </div>
              <div>
                Year detected: <strong>{parsed.years.join(', ') || 'none'}</strong>
                {parsed.years.length !== 1 && <span className="ml-2 text-red-300">expected exactly one year</span>}
              </div>
            </div>

            <div>
              <div className="mb-1 text-sm font-semibold text-white/70">Rows per dealer location</div>
              <div className="grid grid-cols-3 gap-1 text-sm">
                {Array.from(summary.byDealer.entries()).map(([code, count]) => (
                  <div key={code} className="rounded bg-white/5 px-2 py-1">
                    {code}: {count}
                  </div>
                ))}
              </div>
            </div>

            {summary.zipCorrected.length > 0 && (
              <div>
                <div className="mb-1 text-sm font-semibold text-amber-300">ZIP-corrected state rows ({summary.zipCorrected.length})</div>
                <div className="max-h-32 overflow-y-auto rounded bg-white/5 p-2 text-xs">
                  {summary.zipCorrected.map((d, i) => (
                    <div key={i}>
                      {d.custStateRaw ?? '(blank)'} + zip {d.custZip} -&gt; {d.custState} (stock {d.stockId})
                    </div>
                  ))}
                </div>
              </div>
            )}

            {summary.unresolved.length > 0 && (
              <div>
                <div className="mb-1 text-sm font-semibold text-red-300">Unresolved rows, excluded from map ({summary.unresolved.length})</div>
                <div className="max-h-32 overflow-y-auto rounded bg-white/5 p-2 text-xs">
                  {summary.unresolved.map((d, i) => (
                    <div key={i}>
                      state={d.custStateRaw ?? '(blank)'} zip={d.custZip ?? '(blank)'} (stock {d.stockId})
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleConfirm}
              disabled={submitting || parsed.years.length !== 1}
              className="self-start rounded-md bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Uploading...' : `Confirm & Replace ${parsed.years[0] ?? ''} Data`}
            </button>
          </div>
        )}

        {result && (
          <div className={`rounded px-3 py-2 text-sm ${result.ok ? 'bg-green-900/60 text-green-100' : 'bg-red-900/60 text-red-100'}`}>
            {result.message}
          </div>
        )}
      </div>
    </div>
  );
}
