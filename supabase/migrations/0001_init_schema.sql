-- Sales by State Map: core schema
-- See plan doc for rationale: deals is the durable per-deal source of truth,
-- state_view_month_counts is the pre-aggregated table the map reads from.

create extension if not exists pgcrypto;

-- Reference tables --------------------------------------------------------

create table dealer_locations (
  code text primary key,
  name text
);

create table states (
  code text primary key,           -- 'MS', 'QC', etc.
  name text not null,
  region_type text not null check (region_type in ('us_state', 'ca_province', 'other')),
  fips_or_geo_id text               -- join key into the map GeoJSON
);

-- Upload audit log ----------------------------------------------------------

create table uploads (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  period_month date not null,
  uploaded_by text,
  uploaded_at timestamptz not null default now(),
  status text not null default 'processing' check (status in ('processing', 'succeeded', 'failed')),
  row_count_raw int,
  row_count_unmapped int,
  notes text
);

-- Deal-level source of truth (PII-bearing, locked down by RLS) -------------

create table deals (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid references uploads(id) on delete cascade,
  period_month date not null,
  dealer_code text references dealer_locations(code),
  stock_id text,
  date_posted timestamptz,
  desgn text,
  type_code text,
  vehicle_class text check (vehicle_class in ('motorized', 'towable')),
  cust_state_raw text,
  cust_state text references states(code),
  cust_state_source text check (cust_state_source in ('reported', 'zip_corrected')),
  cust_zip text,
  cust_city text,
  sales_person text,
  mfg text,
  brand text,
  model text,
  amount numeric  -- reserved for a future $ metric; unused for now
);

create index deals_period_view_idx on deals (period_month, dealer_code, vehicle_class);
create index deals_state_idx on deals (cust_state);
create index deals_upload_idx on deals (upload_id);

-- Pre-aggregated tables the app actually reads from -------------------------

create table state_view_month_counts (
  period_month date not null,
  view_key text not null,
  state_code text references states(code),
  deal_count int not null default 0,
  deal_amount numeric,
  primary key (period_month, view_key, state_code)
);

create table view_month_totals (
  period_month date not null,
  view_key text not null,
  total_count int not null default 0,
  total_amount numeric,
  primary key (period_month, view_key)
);
