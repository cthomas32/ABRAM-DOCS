# The social calendar and the morning post pack

The Social Studio draws pictures. The calendar decides **what goes out, when, and where**, and
every morning it puts the day's approved posts in Slack with everything needed to post them.

- **Where it lives:** Admin, **Social Studio**, **Calendar** tab (`/admin/dashboard/social`).
- **Tables:** `social_campaigns`, `social_posts`
  (`supabase/migrations/20260803180000_social_calendar.sql`).
- **The morning job:** `node scripts/social-daily.js`, run by
  [`.github/workflows/social-daily.yml`](../.github/workflows/social-daily.yml).
- **Cards:** [`social-images.md`](./social-images.md). **Voice and claims:**
  [`brand-voice.md`](./brand-voice.md), which governs a caption exactly as it governs a page.

---

## The one idea worth understanding

**A post is a packet, not a reminder.** One row holds the day, the channel, the caption, the
tracked link and the card. That is the whole reason the morning message can be acted on without
opening anything: posting is a copy and a paste, not a trip back to the dashboard to assemble the
pieces.

The three states that matter:

| Status | What it means |
|---|---|
| `draft` | Written, or proposed by KIPP. Invisible to the morning job. |
| `ready` | Approved. Its card is rendered and public. **This is what gets delivered.** |
| `posted` | Out in the world. Stamped when you mark it. |

`skipped` exists so a deliberate gap is explained rather than looking like a miss.

---

## The second thing worth understanding: what the week is made of

A post also carries a **kind**, which is what it is for. Left unrecorded, a week drifts to the
same place every time, because on any given day the easiest post to write is another one about
ABRAM, and seven of those is an account with no audience to announce anything to.

| Kind | What it is | Needs |
|---|---|---|
| `product` | ABRAM doing something. A screen, a shipped change, an outcome. | |
| `craft` | Useful with the product taken out. A definition, a checklist, a way of running a day. | |
| `market` | A number about the industry. | The publisher named on the card, and the link in the note. |
| `story` | How we think about production, and what we are building. | |
| `article` | Sends the reader to a blog post or a help article. | `blogSlug` or `docSlug`. |

**At most half the posts on the days a run touches may be `product`.** `social-draft.js` counts
the kinds already standing on those days along with the ones being filed, and refuses the whole
run when the share goes over. Refusing beats warning here: a warning at the end of a long agent
run is a line that gets scrolled past, and the fix is one card.

The rule sleeps under four posts. A week halfway through being written is not a week that has
drifted, and a check that fires every Monday is one nobody reads.

The week view counts the same five under its standing figures, and says so out loud when more
than half of a week has become about us. See [`brand-voice.md`](./brand-voice.md) §5 for what
each kind is doing and how a post pairs with an article without giving the article away.

**Marking a post ready publishes its card.** One click renders the PNG, uploads it, and flips the
post, because those two things were always going to happen together and splitting them across two
screens is how a post reaches Slack with a caption and a hole where the picture should be. It is
still a person's click, and it is still the only thing that writes a PNG.

---

## The week, and the post you tapped

**The week is a schedule, not a gallery.** Seven columns of full-size cards is a wall of pictures
you cannot read a week off, so a post in a day column is a short crop, the channel, and the status
in one word. No caption, no row of buttons. Everything that changes a post is behind the single
menu glyph in the corner: mark ready, mark posted, copy the caption and link, edit, skip, remove.

**Below 1024px the week is one day at a time.** Seven columns on a phone is seven boxes stacked,
most of them empty, and a page you scroll for a while to reach Thursday. So the week becomes a
strip of seven chips carrying the date and a dot per post, and the day you tap opens under it.
Today is what it opens on, and changing week takes the open day with it. The posts in that day are
list rows rather than tiles, because a phone screen is wide enough to show the whole card as a
thumbnail beside two lines of the caption, without cropping a headline through the middle of a
word. The standing figures and the campaign filter move to the bottom on that layout: what you
open this on the way to set for is Thursday, not a count of how many posts the week holds.

**Tapping the post opens it, and that view does two things only.** The card at full size, swiping
if it is a carousel, and one button to save it, with a small Edit beside it for the post's own
editor. It is deliberately not an editor itself: this is the view for the moment you want the
picture on your phone, and a settings panel in the way of that is the thing it exists to avoid. It
writes nothing. The save button sits in a fixed foot below the picture, clear of the home
indicator, so it stays under the thumb however long the caption runs.

On a phone that save button hands the slides to the system share sheet, so **Save Image** puts them
in Photos, which a download cannot do. The whole of that behaviour lives in
[`saveImage.ts`](../src/lib/social/saveImage.ts) and is described in
[social-images.md](./social-images.md). A carousel saves as the whole set, in order, because that
is the only way it can be posted.

---

## The card on a post, and its other sizes

A post used to be able to *pick* a card and nothing else, so fixing a typo meant leaving the
calendar, finding the card in the library, remembering which post it was for, and coming back.

**Edit card** is on the post sheet, next to whichever card is on it. It saves the post first and
then opens the card in the studio with every control, and saving there brings you back to the
calendar with the sheet open where you left it. Saving first is the point rather than a detail: a
caption typed and not yet saved would otherwise be thrown away by a button labelled Edit.

A carousel is the exception. Its slides are written together, so the post sheet sends you to the
library for those rather than opening slide one on its own.

### Variations are sizes, not versions

The same message usually has to go out as a square on LinkedIn, a portrait on Instagram and a
story. Those were three unrelated rows, which meant editing the headline fixed one of them and the
other two went out saying the old thing.

**Sizes** on the post sheet shows the five a dated post can use, with the ones that exist filled in
and the rest offered as something to make. Making one copies the card's whole spec into the new
format. Tapping a size that exists puts *this post* on it.

- **A variation group shares everything except its format.** The renderer already adapts a card to
  its size on its own, scaling type from `formats.ts` and keeping clear of the story and banner
  safe areas through `contentInsets`, so there is nothing left that a second size needs to hold
  differently. Syncing only the words would strand a theme or backdrop change on one size.
- **Editing any size rewrites the others, and sends them back to draft.** Their PNGs no longer
  match their specs, and serving a stale file at an address somebody already pasted is worse than
  asking for another approval. The studio says how many travelled.
- **One size per group**, enforced by a unique index. Two squares in one group is an ambiguity the
  post picker could not resolve and the sync would have no reason to prefer either.
- **Banner is not offered.** A LinkedIn profile header is not something a dated post goes out as.

Null `variation_id` means a card standing on its own, which is most of them. The first size added
mints the group and puts the original in it.

---

## The morning message

Runs daily at **11:12 UTC**, which is 07:12 ET in summer and 06:12 ET in winter. GitHub cron
cannot observe daylight saving, and reliable delivery is worth more than an exact local minute.
There is deliberately **no hour-guard**: a delayed run still delivers.

Each ready post arrives as: the channel and campaign, what the post is for when it is anything
other than product, the caption, the tracked link on its own line (bare, so it can be selected
and pasted), the photographer's credit where the card is built on somebody's picture, the card at
its public address, and the note explaining why the post exists.

The credit line is there because a card can only credit somebody in a corner, and a corner is not
something a creator is ever told about. The tag in the caption is, so it arrives ready to paste
and the message says to use it. See the image library in
[`social-images.md`](./social-images.md).

- **A post is never announced twice.** Delivery stamps `notified_at`, and the query filters on it
  rather than on the date, which is what makes a re-run or a delayed run harmless.
- **Five posts per message.** Anything over the cap is left unstamped and leads the next morning.
- **A quiet day still speaks.** With nothing approved it says how many drafts are waiting; with
  nothing scheduled it says so and reports how much of the week ahead is filled. Pass `--quiet` to
  suppress the empty-day message.
- **It looks forward as well as at today.** Two or more days in the next six with nothing booked
  are named, and so is any day whose post is written but still sitting as a draft. Both are worth
  hearing while there is time to act: KIPP refills the calendar on Friday, and an unapproved post
  is one click from being a real one. A single empty day is not flagged, because a job that nags
  about every ordinary gap is a job whose lines stop being read.
- **Links do not unfurl.** Every post points at the same handful of landing pages, and left to
  unfurl the pack arrives with a stack of preview cards stapled underneath it.

```bash
node scripts/social-daily.js --dry-run          # print the message, send nothing
node scripts/social-daily.js --date 2026-08-05  # a specific day
node scripts/social-daily.js --resend           # include posts already announced
```

Exit **78** means the secrets are absent, which is a skip and not a failure, the same contract
`gsc-report.js` uses.

### Secrets it needs

| Secret | Why |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Reading the calendar |
| `SUPABASE_SERVICE_ROLE_KEY` | Same, and stamping `notified_at` |
| `SLACK_WEBHOOK_URL_KIPP` | The `#kipp` webhook. Falls back to the triage webhook if unset |

The first two already exist for KIPP. **There is no social credential anywhere in this system**,
and there is no model in the daily job. Everything it sends was written by a person or by KIPP and
then approved by a person; the job only delivers. That is what makes it safe to run unattended.

---

## Links, and why the spelling matters

The link builds itself from the landing page, the channel and the campaign:

```
https://abram.network/start/filmmakers?utm_source=linkedin&utm_medium=social&utm_campaign=august-callsheets
```

The pages and channels come from `campaign_link_pages` and `campaign_link_channels`, the same two
tables the builder on the campaigns dashboard reads, so a channel added there appears here with no
deploy. See [`campaign-links.md`](./campaign-links.md).

### Pointing at something we wrote

A landing page is one of six. The blog and the help centre are the rest of the site, and a post
that sends somebody to a piece of writing is the cheapest traffic on the calendar: the piece
already carries the argument and the search value, and the card costs one headline.

In the studio, leave the landing page empty and paste the URL into the tracked link, keeping
`utm_source` spelled the way the channel is. In a KIPP proposal it is a field:

```json
"post": { "kind": "article", "blogSlug": "why-productions-still-run-on-spreadsheets" }
"post": { "kind": "article", "docSlug": "user-guide/2.1-building-a-call-sheet" }
```

Both are checked before anything is written. A blog slug is matched against the published posts
and a doc slug against the search index, because a slug guessed from a headline is a card with a
404 behind it, approved by somebody who had no reason to check the link.
`node scripts/social-draft.js --articles` prints both lists.

`page_slug` stays empty on those rows. The campaign dashboard joins its landing analytics on that
column, and an article is not one of the pages it measures. The clicks still arrive tagged.

**`utm_source` has to match the normalized channel names** in `REFERRER_CHANNELS`
(`src/lib/campaigns.ts`), or a tagged click and an untagged share from the same place land in two
separate rows in the dashboard.

The built link stays editable, and what was posted is stored as it was posted rather than rebuilt
on read. A campaign renamed after posting would otherwise rewrite history it cannot change.

---

## Campaigns

Thin on purpose. A campaign contributes three things a post cannot supply alone: a **name** to
group a week under, a **goal** to judge a post against, and the **tag** every link in it is
measured by. Landing pages and channels stay where they already live.

The tag becomes `utm_campaign` and ends up in analytics rows that outlive the campaign, so it is
normalized once on save. **Renaming one after posting splits its numbers across two names.**

Deleting a campaign leaves its posts on the calendar with no campaign. A week of scheduled work
should not disappear because a grouping was tidied up.

---

## What KIPP may and may not do here

Unchanged from everywhere else: **KIPP proposes, you approve.** It can write a post row as a
`draft` with `source: kipp`, and the library and the calendar both badge and count those. It
cannot mark anything ready, cannot publish a card, and holds no social credentials. Nothing it
files reaches the morning message until someone clicks.

It books the week through `scripts/social-draft.js`, by adding a `post` block to a proposal:

```json
"post": {
  "scheduledFor": "2026-08-04",
  "channel": "linkedin",
  "kind": "product",
  "caption": "Tomorrow's call sheet builds from the schedule you already made.",
  "pageSlug": "start-filmmakers",
  "altText": "A call sheet screen showing tomorrow's crew and call times"
}
```

The card and the booking are written together, and the link is built from the page, the channel
and the campaign at write time. `node scripts/social-draft.js --options` prints the accepted
fields, read out of the source, so it cannot drift from what the studio offers.

What the script refuses, rather than filing something misleading:

- **A day in the past, or more than 21 days out.** A weekly agent has no business filling a month.
- **A channel or landing page that is not in the link builder**, with the live list printed.
- **A post with no `kind`.** There is no default, because a default is what the whole week would
  quietly become.
- **A week where more than half the posts are `product`.** The counts and the ceiling are printed.
- **A `market` post with no source**, meaning no link in the note or nothing naming the publisher
  on the card. An unsourced statistic under our logo is a claim we made.
- **An `article` post with nothing to point at**, and any blog or doc slug that does not resolve.
- **A campaign that does not exist.** Creating one is a positioning decision and it is yours. KIPP
  proposes it in the Slack pack instead.
- **A day and channel already booked**, which is skipped and reported rather than double posted.

A week with no `article` post is allowed and mentioned. There is not always a piece worth
pointing at, and a refusal would only produce a weak article post filed to clear the check.

A bad booking fails the whole run, cards included. A card filed without the post it was drawn for
is a card nobody can place.

---

## Things that will bite you

- **PostgREST bulk inserts require every object to have the same keys.** A batch of posts where
  one row omits `note` fails the whole insert with `All object keys must match`, not a useful
  message. Build rows from one shape and fill the blanks with `null`.
- **Dates are dates, not timestamps.** The time of day a post goes out is judgement made in the
  moment; scheduling to the minute would be precision this system does not have and cannot act on.
- **The day is resolved in a named zone**, not from the server clock. The job runs on UTC
  infrastructure, and a naive `toISOString().slice(0, 10)` hands back yesterday for most of the
  evening.
- **Editing a post sends it back to draft** and clears `notified_at`. An approval was for the
  words that existed when it was given.
- **The render route is signed-in only.** A draft card previews through it, which is why only an
  approved card, served from the public bucket, can appear in Slack.
