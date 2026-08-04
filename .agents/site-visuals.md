# Photographs and drawn app screens on the site — on the shelf

Built on 4 August 2026, wired into the homepage, the six `/start` landing pages and the
`/film-production`, `/agency` and `/intelligence` hubs, then **taken back off every page the same
day**: the look did not fit. The pieces are kept because the ingredients are right and the
placement was wrong. Nothing in this file renders anywhere today.

## What is on the shelf

| File | What it does |
|---|---|
| [`src/lib/siteImages.ts`](../src/lib/siteImages.ts) | Reads the Social Studio image library and picks a picture per named slot. Deterministic, so a slot keeps its photograph across renders, and never repeats one on a page. |
| [`src/components/visuals/PhotoBand.tsx`](../src/components/visuals/PhotoBand.tsx) | A photograph across the page with one line over it. Scrim heavy where the words are, top and bottom fading to the page colour. |
| [`src/components/visuals/AppScreen.tsx`](../src/components/visuals/AppScreen.tsx) | One of the 29 drawn app screens from `src/lib/social/mockups.tsx`, rendered into a web page and sized off its container. |
| [`src/components/visuals/ScreenOnPhoto.tsx`](../src/components/visuals/ScreenOnPhoto.tsx) | The two together: a drawn screen standing in front of a photograph. |

Two supporting changes were kept, because both are inert until something uses them:

- **`next.config.ts`** carries a `remotePatterns` entry for the storage host, without which
  `next/image` refuses the library URLs.
- **A migration** gives `anon` read on `social_backdrop_images`
  (`20260804190000_social_backdrops_public_read.sql`, applied). The files in that bucket were
  always public; the list of them was not, and the site cannot read a table it has no policy for.

## The thing that will bite whoever picks this up

**Never put `mix-blend-mode` on anything in a page.** The first version tiled the card grain over
each photograph with `mix-blend-overlay`. A blend mode anywhere on the page moves the backdrop
root, the fixed header's `backdrop-filter` then samples nothing, and the glass goes flat across
every page that renders one: the site scrolls under a plain dark bar instead of a blurred one.
Plain opacity gives almost the same grain and costs nothing.

Note that `.grain-overlay` in `globals.css` already sets `mix-blend-mode: overlay`, and
`BackgroundGlow` renders it fixed over the whole viewport. Worth understanding before adding
another one.

Two more, less painful:

- **Nothing photographic goes above the fold.** A full-bleed picture in a hero takes the largest
  contentful paint from the copy, which `AGENTS.md` is explicit about.
- **A page that reads the library needs `export const revalidate`**, or it turns dynamic and gives
  up static rendering for a decoration.

## The copy that was written for it

Worth keeping whatever the next plan looks like. Landing page bands, one per `/start` variant:

| Page | Eyebrow | Headline | Body |
|---|---|---|---|
| `start` | Before the first call time | Most of a production is decided before anyone reaches set | The breakdown, the schedule, who is booked, what goes out with them. Keep those in one place and the day itself gets quieter. |
| `start-filmmakers` | On the day | Nobody became a producer to write call sheets | Break the script down, build the schedule, and let tomorrow's sheet come out of the day you already planned. |
| `start-agencies` | Across every job | Know who is free before you promise a date | Every project the team is running on one board, with the hours already committed showing against the ones you are about to sell. |
| `start-post` | After the wrap | Know which round of notes is the current one | Versions, notes and approvals in one thread, so the cut everyone is talking about is the cut everyone is watching. |
| `start-resources` | Kit, vehicles and rooms | The camera is either free that Tuesday or it is not | Gear, vehicles and rooms booked against the same calendar as the crew, so a clash turns up while it is still a conversation. |
| `start-assistant` | The assistant | Ask for it, and get it back ready to send | It reads the workspace you already built, so the answer comes out of your own schedule, roster and budget rather than a blank prompt. |

And the hubs:

- **/film-production** — *From script to shoot day* · "The stripboard is the plan, and the day is
  the proof of it" · with the `breakdown` screen: "Every scene, with what it needs beside it".
- **/agency** — *Across every account* · "The honest answer to whether the team can take it on" ·
  with the `capacity` screen: "Know who is free before you promise a date".
- **/intelligence** — *What it already knows* · "The morning briefing you would have had to ask
  for" · with the `aiupdate` screen: "You did not have to ask it anything".
- **Homepage** — *Built for the day itself* · "The plan has to survive contact with the morning",
  and the `callsheet` screen under "Leave set without the call sheet still to do".

## How it was wired, for when it comes back

The page reads the library on the server and hands the picture down, because every section
component on the site is a client component:

```tsx
export const revalidate = 3600;

export default async function Page() {
  const photos = await getSitePhotos();
  const shots = pickOriented(photos, ["slot-band", "slot-screen"], "landscape");
  ...
}
```

`pickOriented` filters the pool to landscape or portrait first, then seeds off the slot name. A
random pick would hand the server and the browser different pictures and change the page under a
visitor on every navigation.
