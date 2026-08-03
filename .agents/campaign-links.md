# Campaign link builder — reading and editing it from the database

The tracked link builder on `/admin/dashboard/campaigns` builds one UTM-tagged URL per
landing page per channel. Both lists come from the database, so a channel can be added,
renamed, reordered, or retired without a code change or a deploy.

Project: `fovvtmwmrivuwnqemcil` (the only Supabase project this repo may target).

| Table | What it holds |
| --- | --- |
| `campaign_link_pages` | The landing pages offered in the builder (`slug`, `label`, `path`) |
| `campaign_link_channels` | The `utm_source` / `utm_medium` pairs (`source`, `medium`, `label`) |

Both tables also carry `sort_order` (ascending, lower first) and `active` (set it to `false`
to hide a row rather than deleting it, which keeps historical attribution readable).

## Show me what's live right now

```sql
select source, medium, label, sort_order, active
from campaign_link_channels
order by sort_order;
```

```sql
select slug, label, path, sort_order, active
from campaign_link_pages
order by sort_order;
```

The dashboard renders exactly these rows, filtered to `active = true` and ordered by
`sort_order`. Its subtitle says whether it is showing database rows or the built-in
fallback, so a mismatch is visible on the page itself.

## Add a channel

```sql
insert into campaign_link_channels (source, medium, label, sort_order)
values ('threads', 'social', 'Threads', 70)
on conflict (source) do nothing;
```

The row appears on the next page load. No deploy.

**`source` must match the normalized channel names** in the attribution helpers
(`REFERRER_CHANNELS` in `src/lib/campaigns.ts` and `SOURCE_HOSTS` in
`src/app/api/track/link/route.ts`). Those map an incoming referrer host to a channel name;
if the `utm_source` here uses a different spelling, tagged clicks and untagged referrer
traffic split into two rows in the dashboard's source breakdown. Existing normalized names
include `tiktok`, `reddit`, `instagram`, `youtube`, `linkedin`, `x`, `facebook`, `threads`,
`discord`, `hackernews`, `google`, `bing`, `duckduckgo`, `chatgpt`, `ai-assistant`.
Adding a channel whose host is not in those maps means untagged shares from it land in
`other` until the map is extended in code.

## Retire or rename one

```sql
update campaign_link_channels set active = false where source = 'reddit';
update campaign_link_channels set label = 'X (Twitter)' where source = 'x';
update campaign_link_channels set sort_order = 5 where source = 'linkedin';
```

## Fallback behavior

If either table is empty or the read fails, the builder falls back to the arrays in
`src/app/admin/dashboard/campaigns/page.tsx` (`FALLBACK_LINK_PAGES`,
`FALLBACK_LINK_CHANNELS`), which mirror the seeded rows. The builder never renders blank.

## Access

RLS on both tables is authenticated-only for read and write, matching the rest of the admin
surface. The service role bypasses RLS, so database tooling can read and edit them directly.
Schema definition: `supabase/migrations/20260803140000_campaign_link_builder.sql`.
