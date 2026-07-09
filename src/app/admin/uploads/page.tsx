'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UploadRow {
  id: string;
  file_name: string;
  period_month: string;
  uploaded_by: string | null;
  uploaded_at: string;
  status: string;
  row_count_raw: number | null;
  row_count_unmapped: number | null;
  notes: string | null;
}

export default function UploadsHistoryPage() {
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('uploads')
      .select('*')
      .order('uploaded_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setRows(data ?? []);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#595959] p-8 text-white">
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Upload History</h1>
          <a href="/admin" className="rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20">
            Back to Upload
          </a>
        </div>

        {error && <div className="rounded bg-red-900/60 px-3 py-2 text-sm text-red-100">{error}</div>}

        <div className="overflow-hidden rounded-lg bg-black/30">
          <table className="w-full text-sm">
            <thead className="bg-white/10 text-left">
              <tr>
                <th className="px-3 py-2">Uploaded</th>
                <th className="px-3 py-2">File</th>
                <th className="px-3 py-2">Year</th>
                <th className="px-3 py-2">By</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Rows</th>
                <th className="px-3 py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-white/10">
                  <td className="px-3 py-2">{new Date(r.uploaded_at).toLocaleString()}</td>
                  <td className="px-3 py-2">{r.file_name}</td>
                  <td className="px-3 py-2">{r.period_month.slice(0, 4)}</td>
                  <td className="px-3 py-2">{r.uploaded_by}</td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        r.status === 'succeeded'
                          ? 'text-green-400'
                          : r.status === 'failed'
                            ? 'text-red-400'
                            : 'text-yellow-300'
                      }
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {r.row_count_raw ?? '-'}
                    {r.row_count_unmapped ? ` (${r.row_count_unmapped} unmapped)` : ''}
                  </td>
                  <td className="max-w-xs truncate px-3 py-2 text-white/60" title={r.notes ?? ''}>
                    {r.notes ?? ''}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && !error && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-white/50">
                    No uploads yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
