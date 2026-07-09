# Sales by State Map

An interactive, hosted replacement for the monthly "Sales by State" PowerPoint deck: a clickable choropleth map of US states + Canadian provinces, broken out by the same 13 views as the deck (All Sales, Motorized, Towables, HMD Motorized, HMD Towables, and one per dealer location), with a month/year-to-date period selector so history accumulates instead of being rebuilt from scratch every month.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind, deployed on Netlify
- deck.gl for the map (choropleth today, extrusion + click drill-down planned for Phase 3)
- Supabase (Postgres + Auth + Storage) for data, with RLS locking PII-bearing tables to authenticated users only

## Local development

```bash
npm install
npm run dev
```

Copy `.env.local.example` to `.env.local` and fill in your Supabase project's URL, anon key, and (for running the seed script) service role key.

## Data pipeline

- `supabase/migrations/` — schema + RLS policies
- `supabase/seed.sql` — reference data (dealer locations, US states, Canadian provinces)
- `scripts/seed-historical.ts` — parses the historical `.xlsx` exports and seeds Supabase; run with `npx tsx scripts/seed-historical.ts` for a dry run, or `--commit` to write to Supabase
- `scripts/buildMapGeo.ts` — rebuilds `public/us-states.json` (the combined US + Canada map geometry) if the geometry source ever changes

Source `.xlsx`/`.pptx` files are never committed (see `.gitignore`) since they contain customer PII.

## Status

Phase 1 (static map + seeded historical data) is complete. Phase 2 (in-app admin upload pipeline) and Phase 3 (3D extrusion + click drill-down) are planned next — see the project plan for details.
