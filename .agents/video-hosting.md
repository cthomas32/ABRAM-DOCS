# Video hosting

The demo library at [`/demos`](../src/app/demos/page.tsx), the console screen that
fills it, and the Mux account behind both.

## The shape of it

**A video is a playback ID and three sentences.** The file itself is never in this
repository, never in `public/`, and never in Supabase storage. What the database
holds is a 40-character string plus a title, a sentence and a poster offset.

That is the whole reason for Mux. A screen recording is hundreds of megabytes that
has to become an adaptive ladder, a poster frame, a scrub preview and an HLS
manifest before anybody can watch it on a phone on hotel wifi. Mux does all of that
from the upload and addresses every one of those artefacts off the same playback ID.
The alternative — one enormous MP4 in a bucket — is downloaded in full at one
bitrate by every visitor, and cannot be committed to git at all.

**The file never passes through this application.** This is the part worth
remembering before changing anything in `src/app/admin/dashboard/demos/`. A
serverless function caps request bodies at a few megabytes and times out in minutes.
So the upload is three steps: a server action creates the row and asks Mux for a
single-use URL, the browser PUTs the file **straight to Mux**, and a second action
asks Mux afterwards how it went. None of the three carries the bytes.

## Step by step, in Mux

Done once, by a person, in the dashboard at [mux.com](https://www.mux.com).

1. **Make an account** and add a card. Billing is usage-based with no floor, so an
   idle account costs nothing.
2. **Settings → Access Tokens → Generate new token.** Give it the **Mux Video**
   permission. Read-and-write is required — the console creates uploads and deletes
   assets. Environment: Production.
3. **Copy both halves at once.** The secret is shown exactly once. `MUX_TOKEN_ID`
   is the short one, `MUX_TOKEN_SECRET` the long one.
4. **Put them in Vercel** under Settings → Environment Variables for Production,
   Preview and Development, and in `.env.local` for a laptop.

That is all of it. No webhook to configure, no bucket, no CORS rule — `cors_origin`
is sent per upload and derived from the request, so localhost, a Vercel preview and
production each work without a setting.

There is **nothing to do per video** in the Mux dashboard. Uploading through the
console creates the asset, sets the public playback policy and reads the playback ID
back on its own. The dashboard is worth opening only to check an encode or to see
the bill.

## Step by step, in the console

**Content → Demos.** Owner and admin only; the tab is not drawn for anybody else.

1. **Make a folder.** Type a name, press Add folder. A folder is a section heading
   on the public page.
2. **Give the demo a title**, then press *Choose a video*. The title has to come
   first because it is what the row is created with, and the row has to exist before
   there is anywhere to put an upload URL.
3. **Watch the bar.** That is the browser talking to Mux directly. When it finishes,
   the row goes to *Processing* and the screen polls every five seconds until Mux
   says the asset is playable.
4. **Set the poster frame.** Pencil icon → *Poster frame (seconds in)*. Mux defaults
   to the midpoint of the video, which on a screen recording is reliably a half-open
   menu with the cursor mid-drag. Scrub to a still, composed frame and put that
   second in. It is the single highest-leverage field on the screen: it is the
   picture on the card, and it is also the player's first painted frame.
5. **Press Draft to make it Live.** Nothing reaches the public page until somebody
   does. `status = ready` means Mux finished encoding; `published` means a person
   decided. Keeping them apart is what stops an upload going live the moment it
   finishes processing.

The public page revalidates every 60 seconds, so publishing shows up within a minute
with no deploy.

### Arranging

Up and down arrows, on folders and on videos. Ordering is a decision somebody makes
by looking at the page, so it is stored rather than derived from a date. Videos are
ordered *within* their folder; the arrows swap with the neighbour in the same folder
and stop at the ends.

Drag-and-drop was not used on purpose: the lists are short, and a nudge that either
works or says why is worth more here than a gesture that needs a library and a
separate touch story.

### Two things that look like bugs and are not

**Deleting a folder keeps its videos.** They become unfiled and appear in an
*Unsorted* section in the console, off the public page until they are refiled.
Losing a recording because somebody tidied a heading would be an unreasonable thing
for a delete button to do.

**Renaming a demo does not change its address.** The slug is built from the title
once, at creation, and then frozen. `/demos?v=<slug>` is what gets pasted into a
message; rebuilding it on every rename would break links silently.

**Deleting a demo does delete it at Mux**, permanently, with no undo — that is why
it asks. Mux is deleted first: if that fails the row stays, because a row with a
dead playback ID is a visible problem somebody can retry, whereas a deleted row
pointing at an asset still being billed for is invisible.

## Where things live

| | |
|---|---|
| `supabase/migrations/20260819090000_demo_videos.sql` | `demo_folders`, `demo_videos`, the RLS |
| [`src/lib/demos.ts`](../src/lib/demos.ts) | Row types, the public query, the Mux URL builders |
| [`src/lib/mux/client.ts`](../src/lib/mux/client.ts) | Four endpoints and basic auth |
| [`src/app/admin/dashboard/demos/`](../src/app/admin/dashboard/demos/) | The console screen and its server actions |
| [`src/app/demos/`](../src/app/demos/) | The public page |
| [`src/components/demos/DemoPlayer.tsx`](../src/components/demos/DemoPlayer.tsx) | Mux Player, trimmed |

### What Mux serves

Three hosts, all keyed off the same playback ID:

| Host | What it gives back | Used by |
|---|---|---|
| `stream.mux.com/<id>.m3u8` | The HLS manifest | The player, and `VideoObject` markup |
| `image.mux.com/<id>/thumbnail.webp` | A poster frame at any size | Grid cards, player poster, console rows |
| `image.mux.com/<id>/animated.webp` | A short silent loop | Card hover preview |

Those URLs are built in `src/lib/demos.ts` rather than written by hand, because both
image endpoints take a query string that is easy to get subtly wrong and the `time`
parameter has to agree with the poster the player uses. It has to agree, or the
card's frame and the player's first frame are different pictures and the expansion
flashes.

Thumbnails are plain `<img>`, deliberately. Mux has already resized them and already
served them as webp from its own CDN, so `next/image` would pay for the same job
twice and put a cold origin fetch in front of a warm edge cache.

The hover loop is only requested once the cursor is on the card. It is a couple of
hundred kilobytes and most cards are never hovered.

## Access

Writing is `content.demos`, granted to owner and admin only — the same bar as the
release notes next door, because a demo video is a product claim that ships to the
marketing site. The permission catalog and the RLS policy are two copies of that
rule and **both have to move together**; the database copy is the one that actually
protects anything. See [growth-crm.md](./growth-crm.md).

Reading is open to `anon`, narrowed by the policy rather than by a role check:
`published AND playback_id IS NOT NULL AND status = 'ready'`. The public query in
`getDemoLibrary` repeats those three conditions on purpose. Saying it twice means a
loosened policy still would not leak a draft.

## Polling, and the webhook that does not exist

The console polls `syncVideo` every five seconds while anything is in flight, and
the interval clears itself when nothing is — an idle console makes no requests.

Mux does have webhooks, and they were not used, because a webhook needs a public
endpoint, a signature check and a secret, and this only ever runs with somebody
sitting on the page watching their own upload. That is the one case where polling is
the honest tool. A webhook becomes worth building the moment an upload has to
complete with nobody watching — a scheduled import, or an agent filing recordings.

## Cost

Mux bills encoding once per minute of source and delivery per minute watched. A
handful of short demos on a marketing page is single-digit dollars a month.

The thing that would change that is autoplaying a demo on the home page: delivery is
charged on minutes *streamed*, not minutes *chosen*, so an autoplay hero bills for
every visitor who scrolls past.

`video_quality: "basic"` is set on every upload. It is the cheaper encoding tier and
is right for screen recordings, which are flat colour and text rather than film
grain. Change it in `createDirectUpload` if a demo ever needs to look like footage.

## Still to do

- Record the demos. The library ships with one empty folder and the page renders an
  empty state until it isn't.
- Decide whether `/demos` earns a slot in the main navigation. It is in the footer
  under Resources; the navbar's mega-menus are all product surfaces and a demo
  library is not one.
