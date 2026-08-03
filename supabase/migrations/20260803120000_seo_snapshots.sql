-- SEO snapshot history for KIPP (content-ops agent).
--
-- Google Search Console retains 16 months and offers no history API, so the only way to
-- answer "did that title rewrite actually work" is to keep our own copy of each pull.
-- These tables are that copy. They are append-only history, service-role only, and are
-- never read by the public site.

-- ---------------------------------------------------------------- query/page snapshots

create table if not exists public.seo_query_snapshots (
  id             uuid primary key default gen_random_uuid(),
  window_start   date   not null,
  window_end     date   not null,
  -- 'query' = a search term; 'page' = one of our URLs. One table, because every downstream
  -- question ("what moved") is the same shape for both.
  dimension      text   not null check (dimension in ('query', 'page')),
  key            text   not null,
  clicks         integer not null default 0,
  impressions    integer not null default 0,
  ctr            numeric(6,2) not null default 0,   -- percent, e.g. 3.41
  position       numeric(6,1) not null default 0,   -- average position; LOWER is better
  captured_at    timestamptz not null default now()
);

-- Makes a re-run of the same window idempotent instead of duplicating it. gsc-report.js
-- relies on this via `on_conflict=window_end,dimension,key`.
create unique index if not exists seo_query_snapshots_window_key_idx
  on public.seo_query_snapshots (window_end, dimension, key);

create index if not exists seo_query_snapshots_dimension_window_idx
  on public.seo_query_snapshots (dimension, window_end desc);

-- ------------------------------------------------------------------- audit history

-- One row per seo-audit.js run. Lets KIPP answer "is the technical debt going up or down"
-- without re-reading old PRs, and makes a regression (an issue we fixed coming back)
-- visible as a count that stopped falling.
create table if not exists public.seo_audit_runs (
  id            uuid primary key default gen_random_uuid(),
  run_at        timestamptz not null default now(),
  git_sha       text,
  error_count   integer not null default 0,
  warn_count    integer not null default 0,
  info_count    integer not null default 0,
  public_routes integer not null default 0,
  -- Full issue list, so a later run can diff check+target pairs and name what regressed.
  issues        jsonb  not null default '[]'::jsonb
);

create index if not exists seo_audit_runs_run_at_idx
  on public.seo_audit_runs (run_at desc);

-- ------------------------------------------------------------------------- security

-- Both tables are operational telemetry for one agent. No anon or authenticated role has
-- any business reading them, so RLS is on with deliberately no policies: service-role
-- bypasses RLS, everything else is denied by default.
alter table public.seo_query_snapshots enable row level security;
alter table public.seo_audit_runs      enable row level security;

revoke all on public.seo_query_snapshots from anon, authenticated;
revoke all on public.seo_audit_runs      from anon, authenticated;

comment on table public.seo_query_snapshots is
  'Append-only Search Console history written by scripts/gsc-report.js. GSC retains 16 months and has no history API; this is our own copy so week-over-week deltas survive.';
comment on table public.seo_audit_runs is
  'One row per scripts/seo-audit.js run, so technical SEO debt can be trended and regressions named.';
