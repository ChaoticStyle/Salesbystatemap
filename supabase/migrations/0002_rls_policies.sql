-- RLS: the public/anon role can only ever read fully-aggregated, PII-free
-- tables. deals/uploads (and the raw-file storage bucket, configured
-- separately in the Supabase dashboard) are readable only by authenticated
-- users; all writes happen through the process-upload Edge Function using
-- the service-role key, which bypasses RLS entirely.

alter table dealer_locations enable row level security;
alter table states enable row level security;
alter table uploads enable row level security;
alter table deals enable row level security;
alter table state_view_month_counts enable row level security;
alter table view_month_totals enable row level security;

-- Public reference/aggregate data: readable by anyone, including anon.
create policy "public read dealer_locations" on dealer_locations
  for select using (true);

create policy "public read states" on states
  for select using (true);

create policy "public read state_view_month_counts" on state_view_month_counts
  for select using (true);

create policy "public read view_month_totals" on view_month_totals
  for select using (true);

-- PII-bearing tables: authenticated users only (no policy = no anon access).
create policy "authenticated read deals" on deals
  for select using (auth.role() = 'authenticated');

create policy "authenticated read uploads" on uploads
  for select using (auth.role() = 'authenticated');

-- No insert/update/delete policies are defined for any table for the
-- anon or authenticated roles: all writes go through the Edge Function's
-- service-role client, which bypasses RLS by design.
