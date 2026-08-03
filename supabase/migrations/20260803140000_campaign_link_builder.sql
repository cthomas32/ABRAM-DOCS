-- Campaign link builder: pages and channels, moved out of the dashboard source.
--
-- The tracked link builder on /admin/dashboard/campaigns used to hardcode its landing
-- pages and its social channels in the page component, so adding a channel meant a code
-- change and a deploy. These two tables hold the same data, which lets an operator (or an
-- agent with database access) read the current list and add, rename, reorder, or retire a
-- channel without touching the repo. The dashboard falls back to its built-in defaults if
-- either table is empty or unreachable, so the builder never renders blank.

-- ------------------------------------------------------------------ landing pages

create table if not exists public.campaign_link_pages (
  id          uuid primary key default gen_random_uuid(),
  -- Matches the page_slug written by the landing tracker, so builder rows and analytics
  -- rows join on the same key.
  slug        text not null unique,
  label       text not null,
  path        text not null,
  sort_order  integer not null default 100,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists campaign_link_pages_order_idx
  on public.campaign_link_pages (active, sort_order, label);

-- ------------------------------------------------------------------ channels

create table if not exists public.campaign_link_channels (
  id          uuid primary key default gen_random_uuid(),
  -- Becomes utm_source. Keep it lowercase and matching the normalized channel names the
  -- attribution helpers already bucket referrers into ('tiktok', 'linkedin', 'x', ...),
  -- otherwise tagged clicks and untagged referrer traffic land in two separate rows.
  source      text not null unique,
  -- Becomes utm_medium.
  medium      text not null default 'social',
  label       text not null,
  sort_order  integer not null default 100,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists campaign_link_channels_order_idx
  on public.campaign_link_channels (active, sort_order, label);

-- ------------------------------------------------------------------ updated_at

create or replace function public.touch_campaign_link_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists campaign_link_pages_touch on public.campaign_link_pages;
create trigger campaign_link_pages_touch
  before update on public.campaign_link_pages
  for each row execute function public.touch_campaign_link_updated_at();

drop trigger if exists campaign_link_channels_touch on public.campaign_link_channels;
create trigger campaign_link_channels_touch
  before update on public.campaign_link_channels
  for each row execute function public.touch_campaign_link_updated_at();

-- ------------------------------------------------------------------ RLS

-- Read and write are both admin-only. Nothing on the public site reads these tables; the
-- only consumer is the signed-in dashboard, and the service role (used by tooling) bypasses
-- RLS entirely.
alter table public.campaign_link_pages    enable row level security;
alter table public.campaign_link_channels enable row level security;

drop policy if exists "Allow authenticated read of campaign link pages" on public.campaign_link_pages;
create policy "Allow authenticated read of campaign link pages"
  on public.campaign_link_pages for select to authenticated using (true);

drop policy if exists "Allow authenticated write of campaign link pages" on public.campaign_link_pages;
create policy "Allow authenticated write of campaign link pages"
  on public.campaign_link_pages for all to authenticated using (true) with check (true);

drop policy if exists "Allow authenticated read of campaign link channels" on public.campaign_link_channels;
create policy "Allow authenticated read of campaign link channels"
  on public.campaign_link_channels for select to authenticated using (true);

drop policy if exists "Allow authenticated write of campaign link channels" on public.campaign_link_channels;
create policy "Allow authenticated write of campaign link channels"
  on public.campaign_link_channels for all to authenticated using (true) with check (true);

-- ------------------------------------------------------------------ seed

-- The exact lists the dashboard shipped with, so applying this migration changes nothing
-- visible on day one. `on conflict do nothing` keeps a re-run from clobbering later edits.
insert into public.campaign_link_pages (slug, label, path, sort_order) values
  ('start',            'Start (general)', '/start',                     10),
  ('start-filmmakers', 'Filmmakers',      '/start/filmmakers',          20),
  ('start-agencies',   'Agencies',        '/start/agencies',            30),
  ('start-post',       'Post production', '/start/post-production',     40),
  ('start-resources',  'Resources',       '/start/resource-management', 50),
  ('start-assistant',  'AI assistant',    '/start/ai-assistant',        60)
on conflict (slug) do nothing;

insert into public.campaign_link_channels (source, medium, label, sort_order) values
  ('tiktok',    'social', 'TikTok',    10),
  ('reddit',    'social', 'Reddit',    20),
  ('instagram', 'social', 'Instagram', 30),
  ('youtube',   'social', 'YouTube',   40),
  ('linkedin',  'social', 'LinkedIn',  50),
  ('x',         'social', 'X',         60)
on conflict (source) do nothing;

comment on table public.campaign_link_pages is
  'Landing pages offered by the tracked link builder at /admin/dashboard/campaigns. Editable without a deploy; the dashboard falls back to built-in defaults when empty.';
comment on table public.campaign_link_channels is
  'utm_source/utm_medium pairs offered by the tracked link builder. `source` should match the normalized channel names in src/lib/campaigns.ts so tagged and untagged traffic group together.';
