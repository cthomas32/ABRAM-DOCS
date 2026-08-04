# Social images — the studio, the library, and KIPP's draft queue

Post images are **rendered from code**, the same way the site's link previews always have been.
There is one renderer, one set of templates, and one palette, and everything comes out of it: the
Open Graph card on a campaign page, a square for the feed, a story, a carousel.

- **Studio and library:** Admin → **Social Studio** (`/admin/dashboard/social`). A card can also be
  opened straight from the post it is on, and carries its other sizes with it: see
  [`social-calendar.md`](./social-calendar.md).
- **Where a card ends up:** [`social-calendar.md`](./social-calendar.md), which covers the day,
  channel, caption and link that carry it, and the morning Slack message that delivers the pack.
- **Renderer:** [`src/lib/social/`](../src/lib/social/) — `render.tsx` draws, `mockups.tsx` draws the
  app panels, `presets.ts` holds the starting copy.
- **KIPP files drafts with:** `node scripts/social-draft.js`, and sees the image library with
  `node scripts/social-draft.js --backdrops`.
- **Voice and claims:** [`brand-voice.md`](./brand-voice.md) governs every word on a card, exactly
  as it governs a page.

---

## The one idea worth understanding

**A saved card is a spec, not a picture.** The row in the database holds the template, the size,
the palette and the copy. Rendering is a pure function of that, so:

- a draft can be previewed before any file exists,
- KIPP can propose a card without storage credentials or a render budget,
- changing a template later re-draws every card that has not been approved yet,
- approving is the *only* thing that writes a PNG and hands out a public address.

Approval is always a person's click. Nothing an agent files is published.

---

## Where it is going, and therefore what size

Pick the destination first. The sizes are pixels; a destination is what somebody actually says out
loud, and it carries the two or three facts about that surface that change the card. They live in
[`platforms.ts`](../src/lib/social/platforms.ts), the studio's first control is a picker over
them, and `node scripts/social-draft.js --options` prints them.

| Destination | Size it picks | The thing that changes the card |
|---|---|---|
| Instagram feed | Portrait, square | Read at about a third of its real size. The headline has to survive a thumbnail. |
| Instagram or TikTok story | Story | The platform covers the top and the bottom. One idea, very large. |
| LinkedIn feed | Square, landscape | The one audience that will read a dense card. Checklists and comparisons earn their keep here. |
| LinkedIn carousel | Portrait, square | Paged rather than swiped, so a longer set gets read. |
| Profile banner | Banner | Your photo covers the bottom left and the ends crop. One line, usually no lockup. |
| X post | Wide, landscape | Cropped to 16:9 and competing with the post text under it. |
| TikTok or Reels cover | Story, portrait | Judged as a grid thumbnail as often as full screen. Four words. |
| Link preview | Landscape, wide | Sits beside the page title, which already says the obvious thing. Say the other thing. |

## Sizes

| Size | Pixels | Where it goes |
|---|---|---|
| Square | 1080 x 1080 | Instagram, LinkedIn and Facebook feed |
| Portrait | 1080 x 1350 | Instagram and Facebook feed, the tallest allowed |
| Story | 1080 x 1920 | Instagram, TikTok and LinkedIn stories, Reels covers |
| Landscape | 1200 x 630 | Link previews and Open Graph cards |
| Wide | 1600 x 900 | X posts, YouTube thumbnails and blog headers |
| Banner | 1584 x 396 | LinkedIn profile and page banners, email headers |

### Safe areas

Two sizes have a platform interface sitting on top of them, and both declare it in `formats.ts`
rather than leaving it to whoever writes the card:

- **Story** keeps 130px clear at the top and 250px at the bottom, on top of its padding. The
  profile row covers one and the reply bar covers the other. This is why a story looks sparse,
  and the sparseness is correct.
- **Banner** keeps 260px clear on the left and 160px on the right, because a LinkedIn profile
  photo sits over the bottom-left corner and the ends crop on a narrow window.

Everything that measures a card reads `contentInsets()`, so adding a safe area to a format is
enough to move every layout out of the way.

## Branding

**The name is only ever the drawn mark.** Never the word ABRAM set in the body face, on a card or
inside a drawn app screen. Where a screen needs to name the assistant it sets the lockup, which is
why both `mark` and `lockup` are handed down into `mockups.tsx`. The frame's old text fallback is
gone: if the asset cannot be read the brand row renders empty, because a card that looks slightly
wrong travels further than one that looks obviously broken.

Every card carries the identity in one of three ways:

- **Lockup** (default) — the mark plus the ABRAM wordmark. Use it wherever a reader might be
  meeting the name for the first time.
- **Mark only** — for the middle slides of a carousel, where slide one already said the name.
- **None** — and none means none. No mark anywhere on the card, on every layout including the
  poster. Use it where the name is already on screen, or where the card is doing something the
  identity would interrupt.

Most layouts put it top left. The **poster** centres it over the type instead, at about two
thirds the height, because a centred mark sitting with the words reads larger than the same mark
floating in a corner.

### Sizing

Two controls, both set-level so a carousel stays a set, and both steps rather than sliders
because a slider means every card comes out a different size.

- **Text size**: Small, Default, Large, Largest. It multiplies every type size *and* every gap
  and padding, so a bigger headline still has room around it.
- **Mark size**: Small, Default, Large. Held separately from the text size, so the identity holds
  still while the words move.

Both are snapped to the offered steps in `normalizeSpec`, so a hand-built URL cannot ask for
forty-times type.

Cream and black versions of both are generated from the masters in `images/` into `public/brand/`,
and the palette picks the right ink. **Do not hand-crop these.** The file this replaced had lost
the final M of the wordmark, which is why every card looked subtly wrong for a while.

Type does not scale with pixel width. A story is only 1080 wide but is read on a full phone
screen, so it carries much larger type than a landscape card that shows up as a thumbnail. Those
multipliers live in `formats.ts` and were set by eye.

## Placement

Where the block of words sits, in [`placement.ts`](../src/lib/social/placement.ts). Six presets,
set-level like the type size, drawn in the studio as six small cards rather than named, because
six words in a row is six words to read and compare.

Every layout used to draw its block in the middle of the frame. That is the safe answer and never
the best one: on a photograph the composition decides where the type goes, and a sky at the top
wants the line low. `top-left`, `top-center`, `center-left` (the old behaviour, and still the
default), `center`, `bottom-left`, `bottom-center`.

**Centring only applies to the layouts that are one or two lines**: poster, hook, statement,
quote, stat and definition. A checklist, a comparison or a numbered sequence keeps its left edge
whatever the placement says, because a ragged left edge gives the eye nothing to come back to on
the next line and every one of those layouts is a set of lines you scan down. `canCentre` decides,
the frame resolves it into `ctx.align` once, and the studio says so rather than quietly ignoring
the control. Two other things follow the alignment: the mark, which would otherwise sit in the
top-left corner over centred type, and the scrim.

## The image library

The drawn skies above need no asset and no deploy, which is why they are still the default. A real
photograph is the register that carries furthest on a feed, and asking for a commit every time
somebody finds one puts a working morning behind a pull request.

**Library → Images** is the shelf: drop a morning's worth in, look through them, title them, say
who took them. The studio's Look panel shows the same library as a picker, and it is literally the
same component in two modes — the compression, the title rules and the credit fields all have to
behave identically or a picture uploaded in one place would be second-class in the other.

### The picker is a room, and the shelf is not loaded

In the studio the Look panel shows **the one picture the card is on**: a thumbnail, its title, its
credit, a control to take it off and a Choose that opens the library over the top. Pick one and it
goes on the card and the library closes again. It used to be the whole grid, open, sitting in the
middle of Look between the palette and the crop controls, which is a wall of squares on top of
controls you need while you are looking at the card, and it only gets taller.

Two things underneath that, both invisible at a dozen pictures and both fatal at three hundred:

- **A page at a time.** The grid reads `PAGE_SIZE` rows and fetches the next when you reach the
  bottom, with a button under the observer for when an observer never fires. The search runs
  against the table rather than over the loaded rows, because a search that only finds what you
  have already scrolled past is worse than no search. PostgREST reads `or` as a grammar, so commas
  and brackets in what somebody typed are dropped rather than escaped — none of them belongs in a
  title anyway.
- **Tiles are not the upload.** A picture is scaled to 2560 on its long edge on the way in, which
  is right for a story and absurd for a square 180 across: the grid was pulling about a megabyte
  per tile. `backdropThumbUrl` asks the storage layer to resize and it caches the answer, so the
  same picture arrives at roughly 25 kilobytes instead of 905. A failure there falls back to the
  full file once, so the bad outcome is a slow tile rather than a broken one. The renderer still
  takes the full file: a story at the tightest crop is 3360 across.

A tile carries **one** corner control, not two. Forty-four pixels is the rule and a tile on a phone
is about 150 across, so two of them side by side cover the picture. The chooser gets the pencil,
because deleting while picking is a mis-tap rather than an intention; the gallery gets the bin,
because a tap there already opens the editor. Nothing is lost either way — the editor carries
delete in its own header.

The Library tab holds two different things and toggles between them. **Cards** came out of the
studio and are specs waiting on approval. **Images** are the raw pictures, which have their own
life: they arrive by the dozen off a shoot and get titled and credited long before anybody makes a
card out of one.

Editing one is a **dialog on a desktop and a page on a phone** — one element, two shapes, split on
a media query rather than into two components. It started as a panel that opened at the bottom of
the grid, which is fine at twelve images and useless at two hundred: tapping the third one
scrolled you past the other hundred and ninety-seven to reach the boxes. Escape closes it, tapping
off it closes it, and the page underneath stops scrolling while it is open. Delete lives in its
header rather than beside Save, so the destructive control does not get the easiest target on a
phone screen. The corner buttons on a tile are visible on touch and appear on hover on a desktop;
hover-only controls do not exist on a phone.

An upload goes straight from the browser into the `social-backdrops` bucket, which is the one
place this feature departs from the house pattern: a server action carries its arguments in the
request body and Next caps that at a megabyte, so routing a photograph through one would mean only
small photographs. Row level security is the same either way, and the bucket enforces what
matters, three image types and twelve megabytes.

A photograph **wins over a drawn backdrop**. Two backgrounds in one frame is two of them arguing.

### It is a shelf, not a pile

Every image carries a **title**, and the title is the one field with a job beyond being readable:
`social-draft.js` resolves a proposal's `backdropImage` against it, so KIPP asks for a picture by
name and the run stops with the real list printed if nothing matches. Two images called the same
thing is a genuine ambiguity and the write refuses it. The title defaults to the filename, which
is usually a camera's idea of a name, so retitle on the way in. Both views search on title,
creator and handle, and the gallery counts how many pictures have nobody credited, because an
uncredited one is the single thing in here that can go out wrong.

`node scripts/social-draft.js --backdrops` prints the library, which is the only part of the
catalogue that cannot be read out of the source: it is a table somebody uploads into.

### Crediting the creator

Two optional fields, because they do different jobs:

- **Creator** is the name. It is the courtesy, and it goes on the card.
- **Their handle**, stored bare without the `@`. It is the half that reaches the person: pasted
  into a caption it tags them, they are told, and their audience finds out where the picture went.

Either one on its own is a valid credit, and a picture off one of our own shoots needs neither.
Where there is one, it lands in two places:

- **On the card**, small and faint along the bottom, in whichever corner you choose. It sits in
  the margin under the footer rather than in the composition, the way a printed page credits a
  picture. Left by default; a LinkedIn banner wants right, because a profile photo covers its
  bottom left.
- **In the morning post pack**, as a `Photo by …` line ready to paste, with the message asking
  whoever posts it to tag them. A corner of a card is not something a creator is ever told about.

The credit is **carried on the spec**, like the base colour and for the same reason: rendering is
a pure function of the row, and a card approved crediting somebody keeps crediting them whatever
the library says later. KIPP never writes that field. An agent has no way to know who took a
picture, and letting it compose an attribution is letting it invent one.

### Scaled on the way in

A file is decoded **once** in the browser and three things come out of that one decode: the scaled
bytes, the pixel size, and the average colour. Anything over **2560 on its long edge** is scaled
to it and re-encoded as WebP, which is more than the largest card ever draws — a story at the
tightest crop is 3360, and at that crop most of those pixels are outside the frame.

Two things are deliberately left alone: a file under a megabyte that is already inside the cap,
because re-encoding a small file usually makes it bigger and always makes it different; and
anything the encoder hands back larger than it was given, which is the ordinary outcome for flat
graphics. Both fall back to uploading exactly what was chosen.

The saving is reported on upload and kept on the row, so you can tell later whether an image is
the original or the scaled version.

Three controls, all set-level, all steps:

- **Crop**: Wide, Mid, Close, Tight. Wide is the whole picture with its long edge trimmed; the
  rest push in, which is how a horizon or a corner of sky becomes the composition. Named the way a
  shot list names them, because that is what this is.
- **Focus**: a three by three, because the answer is a place in the picture rather than two
  numbers. Only does anything once the crop is closer than wide. Satori has no `object-position`,
  so the picture is laid out at its covered size and pushed with absolute offsets instead.
- **Scrim**: None, Light, Medium, Heavy. **It follows the placement**, so moving the words moves
  the darkest part of the card with them. A top-weighted scrim over a card whose only line is at
  the bottom throws away the half of the picture it was chosen for.

Three things worth knowing:

- **A card stores the storage path, not the address**, so a spec outlives a change of project. It
  also stores the picture's average colour, taken in the browser at upload by drawing the file
  into a single pixel. That colour is what shows if the file is ever unreadable, and without it a
  card whose photograph had gone drew its bottom-weighted scrim over nothing and came out a light
  grey gradient.
- **A missing photograph is a plain card, not a failed render.** The fetch logs and returns empty.
- **Deleting a backdrop leaves approved cards alone.** An approved card is a PNG with the picture
  baked in. A draft keeps its path and comes out on the base colour.

## Layouts

Fourteen, which is more than anybody holds in their head, so
`node scripts/social-draft.js --options` prints the fields each one actually draws. A field a
template does not render is a sentence written into a hole.

| Template | What it is for |
|---|---|
| Poster | A small mark, one line, weather behind it. No eyebrow, no footer, no panel. |
| Statement | One claim, two lines. What the campaign pages already share as. |
| Hook | One line, as large as it goes, and nothing else. Slide one, and stories. |
| Product look | A drawn panel of the app beside the outcome it gets you. |
| Showcase | The same panel as the whole card, with one line over it. |
| Comparison | Two columns, the way it goes now and the way it goes with this. |
| Steps | A numbered sequence, three or four long. |
| Checklist | A title over three to five ticked lines. Scope, or what shipped. |
| Tiles | Four short things in a two by two, for peers rather than a ranking. |
| Feature | Title, paragraph, supporting points. The densest card. |
| Quote | A pulled sentence with an attribution. |
| Stat | One measured number, large. |
| Announcement | A badge, a title and a paragraph. Release notes. |
| Definition | A word and what it means on a set. |

### The eyebrow

**Almost nothing needs one.** A letterspaced label above the headline was on eleven of the
fourteen layouts and on twenty-five of the presets, and on nearly all of them it was a category
name over a line that already said the thing: FOR PRODUCERS over "Get your evenings back" is a
word the reader steps over on the way to the sentence, and a card that opens with one reads as a
slide out of a deck.

It is behind a switch now. `fields` is what a layout asks for and `optional` is what it will draw
without asking, and the eyebrow is the only thing in `optional`. The studio offers it under
**Extras**, off, and turning it off again clears the words with it. Only the announcement keeps it
as a real field, because a version badge is the point of that layout.

Turn it on where it carries something the card cannot get any other way: a version, or where you
are in a carousel. The four presets that still have one are exactly those cases.

### The footer, and the two slots that used to argue

The bar along the bottom has two slots doing different jobs: the **footnote** on the left is the
invitation, and the right is the **cta**, or `Swipe` when the card is one of a set. Both drew
whenever either had words in it, so a card that set the footnote and the cta to the same string
printed `abram.network` at each end of one rule. That reads as a rendering fault rather than as a
decision, and it was reaching real cards because `social-draft.js` defaulted the cta to the domain:
any proposal with `footnote: "abram.network"` got it twice without asking.

The default is gone, and **Footer** is a control in the studio and a set-level field in a proposal:
`both`, `left`, `right`, `none`. `none` takes the bar and its rule away entirely and gives the
height back to the copy, which is what a card carrying its address in the words already wants.

Give a card a footnote **or** a cta. Where it genuinely has both, they have to be two different
things: the campaign link previews put the trust line on the left and the domain on the right, and
that is the shape the two slots were built for.

### The corner rule is off now

The short laser streak across the top left echoes a detail on the site, and on a card it sits above
the mark and takes the first look off the words. It was on unless a card said otherwise. It is off
unless a card asks, which flips `showRule` to opt-in: an absent flag on an existing draft now means
no streak. Approved cards are already PNGs and are untouched. The poster drops it either way.

Four layouts are worth a note:

- **Poster** is the quiet register, and the one to reach for first. See below.
- **Comparison** is the most shared shape there is and the easiest one to lie with. The left
  column has to describe a real week; if it would make a working producer roll their eyes, the
  card is worse than no card. It stacks on a story on its own, where two columns of large type
  leaves about ten characters a line.
- **Definition** is quietly the best performer, because it is useful before it is an advert.
  Rotate the term and keep the shape.
- **Hook** has no body and no bullets on purpose. A hook that needs a supporting sentence is a
  statement, and there is already a template for that.

## The quiet register: backdrops, grain and the poster

Most of this system draws the product. There is a second register that does the opposite, and on
a feed it is usually the stronger one: **a small mark, one line, and something atmospheric behind
it.** No eyebrow, no footer bar, no corner rule, no drawn panel. Nothing on the card to skip past.

Reach for it first. A card only earns an eyebrow, a footer and a panel by having something in all
three that a reader would miss. Most do not, which is why the eyebrow and the app panel are both
switches that start off.

### Backdrops

Set in [`backdrops.ts`](../src/lib/social/backdrops.ts), and set-level like the palette. Five of
them: **Dusk** (deep blue, light breaking low), **Storm** (cold and heavy), **Ember** (last of the
light), **Haze** (soft and high key), **Deep** (nearly black, one edge of light).

- A backdrop **replaces the palette**. Every one is dark, so it takes over the text tiers and the
  ink of the mark, and the studio greys the palette picker out. Without that, a cream card on a
  dusk sky is near-black type on near-black.
- It also replaces the ambient wash, which was doing the same job less well.
- **They are gradients, not photographs.** Satori has no radial gradients that do not band, so
  each one is a stack of linear layers at different angles, painted as separate boxes because
  Satori takes the layers of a background shorthand in the opposite order from a browser.
- **To use a real photograph:** drop the file in `public/brand/backdrops/`, add an entry with
  `image: "yourfile.jpg"` and a `base` colour, and it appears in the studio picker and in KIPP's
  options. Nothing else needs touching. The image covers rather than fits: a card is a fixed crop,
  and letterboxing is worse than losing an edge of the picture.

### Grain

The thing that stops a gradient reading as a software gradient, and most of the difference between
a card that looks photographed and one that looks generated. Satori has no filters, no blend modes
and no noise, so it arrives as an image: `scripts/build-grain.js` writes a seeded 160px noise tile
to `public/brand/grain.png`, and the renderer inlines and tiles it over everything, type included.

Seeded on purpose, so the committed file does not change on every build. It runs in `prebuild`,
and a missing tile just means a clean card rather than a failed render.

Grain follows the backdrop by default and can be toggled on its own.

### The poster layout

`poster` owns its own furniture, so there is nothing to clear: it centres its own mark, sets its
own footnote under the type, and the frame suppresses the corner rule and the footer bar for it.
It draws that mark **only when `brand` is none**, so a poster carries exactly one piece of
identity however the field is set.

Three fields, and you rarely want all three: `headline`, `body` (one short line under it), and
`footnote` (a letterspaced line at the bottom, usually the domain).

> The best version of this card is a question and nothing else.

## The app panels

The product and showcase cards draw the app rather than screenshotting it, and **every other
layout can have one too**, as a switch. Twenty-nine screens are available, grouped in the studio
the way the product is:

| Group | Screens |
|---|---|
| Plan | Dashboard, Tasks and work packages, Production board, Project timeline, Booking calendar |
| On set | Call sheet, The printed sheet, Shooting schedule, Run of show, Script breakdown, Notifications |
| Team | Team capacity, Crew search, Crew roster, Timesheets, Competency |
| Money | Budget and margin, Invoices, Spend over time |
| Clients | Client portal, What the client sees, Sign off |
| Kit | Gear and inventory, What the kit earned |
| Assistant | The unprompted briefing, What to do next, Sorting the board, Asking it directly, The organisation brain |

### The demo switch

`showMockup` puts the chosen screen **under the words** on any layout that is not already built
around one. A stat with the screen the number came off, a statement with the thing it is
promising, a definition with the part of the app the term lives in. Off by default: a card is
usually stronger without, and the point of the switch is that it is a decision.

The split is worth understanding. Product and showcase compose their own panel, because placing it
beside or over the copy is what those layouts *are*. Everywhere else the **frame** draws it, after
the template's block, so no layout has to grow a second version of itself with a screen in it and
the switch stays one flag.

Room is the whole problem. The panel gets a share of the card's height set by how dense the layout
is — a statement is two lines and can give away nearly half, a comparison is two columns of
bullets and gets 28% — and that share comes off what the template is told it has, so a hook still
fills a shorter card instead of overrunning the panel. **Below a third of the column width the
panel is dropped rather than drawn**, because a screen that small reads as a rendering fault. That
is what happens on a banner, which has about 128 points of height once the brand row and the
footer have theirs. The studio preview is the same renderer, so it shows you.

**Each one is the feature and nothing else.** No nav rail, no app header, no browser chrome. An
earlier version drew the whole product shell and it was recognisably the app, but on a card that
gets two seconds of attention the chrome ate the space the one useful thing needed. A screen is
now its title, its primary action, and its real content, cropped out of the app the way a close-up
is cropped out of a wide. They carry the product's own status colours, so a Paid reads green and
an Overdue reads red exactly as they do in the app.

Drawing rather than screenshotting means the panel is sharp at any size, re-themes with the card,
never goes stale against a UI change, and never leaks a real production's data. Every name, number
and brand in them is invented.

### They have to be things the product does

A drawn panel is indistinguishable from a feature claim, so it is governed by the claims rule in
[`brand-voice.md`](./brand-voice.md) exactly as a sentence is. Three screens were drawn and then
deleted for this reason: a dailies and media contact sheet, the app running on a phone, and a
command palette. All three looked plausible and none of them is something the product does yet.
**If you cannot point at the screen in the app, do not draw it** — a mockup is a promise, and a
harder one to walk back than a sentence, because nobody reads a picture as a claim until they
have already believed it.

The reverse mistake is cheaper but costs more: real screens nobody drew. Resource analytics,
competency and the organisation brain were all missing from the first pass and all three are
among the strongest cards here. Before adding a layout, go through the app's own navigation and
check what is not on this list.

### Shape, and why the printed sheet is different

Most screens are wide and are tuned against a 680pt frame. **The printed sheet** is not: it is a
page rather than an interface, taller than it is wide, and it declares its own reference width in
`MOCKUP_REFERENCE` so its type does not get scaled down to nothing. `MOCKUPS` carries a `shape`
for each screen, and the studio warns you when a tall panel is going into a wide card, where it
can only ever be a sliver. Portrait or story is where it belongs.

### The vocabulary

Three corner radii, four paddings, four type sizes, one tracking value, declared at the top of
`mockups.tsx` as `R`, `PAD`, `TYPE` and `TRACK`. Reach into those when you add a screen; if
nothing fits, the screen is usually wrong rather than the scale.

This is written down because it was not. The file had grown to thirteen radii, twelve top
paddings, ten font sizes (four of them within a pixel of each other once a 680pt panel is drawn at
560 and then scaled again by the card) and seven tracking values for the same overline. None of
that is visible one screen at a time and all of it is visible across twenty-nine.

**Fill or border, never both.** A tile used to draw a 1px hairline over a 3.5% fill, so the border
was carrying the shape and the fill was being paid for anyway. A dashboard panel had fourteen of
those hairlines. The fill went up, the borders came off, and the only rules left are the ones that
separate table rows, which carry structure.

**Status colours are for status.** A red slice in a legend says something is wrong; if the slice
is just the Lighting category, that is decoration carrying anti-information. Categories take the
neutral tone.

### Density

- **The KPI tile band is for two screens**, the dashboard and the spend chart, where the numbers
  are the screen. It was on twelve, which meant twelve panels shared a top third and any two of
  them were indistinguishable at feed size.
- **Three rows and three columns is the cap.** A fourth row and a fifth column add nothing at
  1080 and cost the height that would have made the other three readable.

### On a photograph the panel is opaque, because there is no blur

The panel tokens move with the ink: `BACKDROP_INK` overrides `appPanel`, `appShell`, `appTile`
and `panelBorder` along with the text tiers, so a cream palette on a dusk sky does not draw a
white rectangle under a white headline.

Those fills were once frosted glass — the panel at 0.72, the shell under it at 0.55. That reads as
glass in a browser, where a `backdrop-filter` blurs what is behind it. **Satori has no
`backdrop-filter` and no `filter`**, so what actually rendered was the photograph at full
sharpness at about a third strength, straight through the middle of the app: a call sheet with a
river running through its rows, and half the library is bright enough for that. There is no blur
available to fix it, so the fill does the job — near enough opaque that the screen is a screen,
with the last few per cent left in so it still takes the colour of the picture under it.

`appShadow` is the other half, and the only token that exists solely for this: a rectangle on a
photograph with nothing under it reads as a hole cut in the photograph, and the shadow is what
makes it a window in front of one. It is empty on all five palettes and set only by
`BACKDROP_INK`, because on a flat card the panel already sits on a colour that is plainly not it.

### Never one word on a line

A headline that wraps to `…the call sheet still to / do` is the one typographic mistake on a card
that everybody sees and nobody can name. It is not a wrapping bug — the line broke where it had to
— so there is nothing to fix in the layout, and the fix is in the text. `noWidow` binds the last
two words with U+00A0, which the Unicode line breaking algorithm treats as glue, so the breaker
has to take them down together and the shortest a last line can be is two words. Every headline,
body and list item on every template goes through it.

Binding is not free: a bound pair is one unbreakable token, so a pair too wide for a line would
overflow instead of wrapping. That is why `fitFontSize` fits for **two** things — the line budget,
and whether the last two words could share a line — and shrinks the type until both hold. Without
that second constraint the fitter would happily settle on a size where the only legal wrap leaves
one word alone, and the widow would be baked in before there was anything to fix. `fitItems` does
the same job for the list templates, which measure their longest item as a run of `x` and so have
no pair for `fitFontSize` to see.

The floor still wins: copy long enough to drive the type to its minimum keeps its widow rather
than running off the edge, which is the worse of the two.

### The aspects are measured, not estimated

`MOCKUP_ASPECT` is how much height a layout sets aside for a panel before anything is drawn, so a
wrong number costs either the space or the footer. They were guessed once and then drifted every
time a panel gained or lost a row: sixteen of the twenty-nine were out by more than fifteen per
cent, and four by enough to push the panel over the card's own footer.

```bash
node scripts/measure-mockups.js --dry-run
```

draws each panel alone on a flat colour, reads the PNG back, finds the last row that is not
background, and prints the drift. Without `--dry-run` it writes the answers into `MOCKUP_ASPECT`.
It adds a temporary route, builds, serves, measures and removes the route again, so it leaves
nothing behind. **Run it after changing any panel's density**, because taking rows out changes
these numbers, which is exactly how they went wrong.

### Do not make them all tables

Twelve of the first fifteen screens were a row of tiles over a four-row table, and at feed
thumbnail size a table is grey mush. The ones that earn their place have a silhouette you can
recognise with the text unreadable: the columns of the board, the month grid, the heatmap of the
capacity view, the bars of the spend chart, the page shape of the printed sheet, the split of the
client portal, the coloured strips of the shooting day. When you add a screen, ask what shape it
is before you ask what data it holds.

### The assistant is five screens, not one

A chat window says there is an AI in here somewhere and leaves the work of asking with the
reader. Most of what ABRAM does happens before anyone asks, so the assistant gets five screens:
the unprompted briefing on a project, the suggestions with their reasoning attached, the board it
sorted and showed its working for, the organisation brain it built without being told to, and the
direct question. The **What the assistant actually does** carousel preset runs them in order,
because the range is the argument.

Two things every assistant screen has to carry:

- **Where it got that.** The briefing says it read the schedule and the ledger, every suggestion
  states the thing it noticed, the sorted board shows its working, and every line in the brain
  names the events it was inferred from. A conclusion with no provenance is a horoscope, and on a
  card it is also an unfalsifiable claim.
- **The chat shows it working, not just answering.** The steps before the answer are the point:
  one that says it is checking the schedule before it drafts, so it does not clobber days that
  already exist, is asking to be checked rather than asking to be trusted.

Each screen carries a suggested value line, offered as one click in the studio. Adding a screen
means a panel in `mockups.tsx`, an entry in `MOCKUPS` in `spec.ts`, and entries in
`MOCKUP_ASPECT` and `MOCKUP_REFERENCE`. The studio picker and KIPP's `--options` output both read
from those, so neither needs touching.

### Two Satori traps these hit, worth knowing before you add a screen

- **A style key with an `undefined` value throws.** The DOM ignores it; Satori calls `.trim()` on
  it and dies with a stack that names none of your code. Optional dimensions have to be omitted,
  which is what `optionalWidth()` is for.
- **A fixed-width cell beside a growing one still shrinks** unless it says `flexShrink: 0`, which
  is what was wrapping two-word labels onto two lines and running them under the next column.
- `flex-wrap` is ignored, so a wrapping row collapses into a column. Build the rows explicitly.
- **A percentage margin does not survive, but a percentage width does.** The gantt bars offset
  themselves with an empty spacer div rather than a `marginLeft`.
- **A column head does not know about its cell's padding.** Give it `padLeft` to match, or two
  headings run into each other and read as one word.
- **`flexGrow: 1` alone does not make text wrap.** The intrinsic width of a long line sets the
  base size and it runs off the panel. Add `flexBasis: 0`.
- **A stacked bar cannot have gaps between its segments.** The widths already sum to a hundred
  per cent, so any margin on top of that pushes the last segment past the edge.
- **There are no arcs**, so there is no doughnut. The resource split is a stacked bar and a
  legend, which reads at least as well lying down.
- **Background layers stack in the opposite order from a browser.** Paint them as separate
  absolute boxes rather than as one shorthand, or the stack comes out inside out.
- **There is no noise, no filter and no blend mode.** Grain has to be an image.

## Carousels

A carousel is one row per slide sharing a set id. The shape that works:

1. **Slide one earns the swipe.** A claim or a question, not a title card. Use the **poster**
   layout on a backdrop, or **hook** if the set is not on one. Both have nothing to read past.
2. **Middle slides do one idea each.** A product panel per slide is the strongest version. Set
   them to **mark only**, since slide one already said the name.
3. **The last slide asks for something.**

Every slide but the last says *Swipe* in its footer on its own. Slide counters render top right.
Ten slides is the cap, and eight is usually already too many.

Four carousel presets ship, and they are worth reading before writing one from scratch:
**Hook, then answer** (the default shape), **What the assistant actually does** (range),
**How it works** (for the reply that it sounds like more setup than it saves), and the two older
ones.

---

## Getting the finished card off the screen

One helper does this everywhere the studio, the library and the calendar offer it:
[`saveImage.ts`](../src/lib/social/saveImage.ts). It fetches the renders (all of a carousel's
slides at once, in order) and then delivers them one of two ways.

On a desktop it is a file in the downloads folder, as it always was. On a phone it goes to the
system share sheet instead, because a PNG downloaded in mobile Safari lands in Files and there is
no route from there to the camera roll without opening the Files app and sharing it back out. The
sheet is the only thing that can write to Photos, and it still lists Files, so the choice stays
with the person: **Save Image** for Photos, **Save to Files** for Files. A carousel arrives as one
sheet with every slide on it, so it saves in a single tap.

Two things to keep in mind when touching it:

- **The button says what it will do.** `useCanShareImages()` returns false on the first render so
  the server and the client agree, then true on a touch device once mounted. Desktops are excluded
  deliberately even when they can share, since a sheet in the middle of the screen is an
  interruption there.
- **Every failure still lands the file.** Closing the sheet is not an error and says nothing.
  Anything else, including Safari deciding the tap has expired while the render was fetched, falls
  through to the plain download rather than dead-ending.

---

## What the copy has to do

**Write the outcome, then stop early.** Name what the reader walks away with, and leave the how
for the page. The gap between the two is the reason anybody clicks, and closing it on the card is
the most common way a good line gets wasted.

> "Leave set without the call sheet still to do." An outcome, and it leaves a question open.
> "Automatically generate call sheets from your shooting schedule." Answers everything, and a
> reader who has finished it has no reason to go anywhere.

The presets in `presets.ts` are all written this way, and starting from one and editing it is the
fastest route to staying on voice.

Four rules, taken straight from [`brand-voice.md`](./brand-voice.md) and repeated here because a
card is the easiest place to break them:

1. **Never define a thing by what it is not.** No negative parallelism, no contrastive reframe.
   No "not X, it's Y", no "X rather than Y", no "one place, one decision". Say it once, straight,
   and stop. This is a hard ban and it is the fastest way for a card to read as machine-written.
   The tell is a sentence that names the wrong answer before it reaches the right one.
2. **Every claim traces to something that shipped or a number you measured.** No customer counts,
   no testimonials, no invented metrics. This is why no preset carries a figure: a stat card is
   worth making, and the number has to come from you.
3. **The footer is an invitation.** Something short that points forward: "Free plan. No card.",
   "Read the release notes", the domain. Keep pricing arguments on the page the card links to. A
   headline that would only be true with an asterisk is the wrong headline, so fix the headline.
4. **A quote card is for a line from a post or a doc.** Never for praise nobody said.

---

## KIPP's part

KIPP proposes; you approve. Its job is to notice that something is worth a post and to draft the
card, not to decide that it goes out.

### Filing drafts

```bash
node scripts/social-draft.js --options
```

prints exactly what the renderer accepts, read out of the renderer's own source, so it cannot
drift from what the studio offers. Then:

```bash
node scripts/social-draft.js --file proposals.json --dry-run
node scripts/social-draft.js --file proposals.json
```

A proposal looks like this. One slide is a single image, more than one is a carousel:

```json
[
  {
    "title": "Call sheet, square",
    "note": "For the Tuesday post. Pairs with the call sheet help doc.",
    "campaignSlug": "start-filmmakers",
    "format": "square",
    "theme": "midnight",
    "slides": [
      {
        "template": "product",
        "mockup": "callsheet",
        "eyebrow": "CALL SHEETS",
        "headline": "Leave set without the call sheet still to do",
        "body": "Tomorrow's sheet builds from the schedule you already made.",
        "footnote": "Free plan. No card."
      }
    ]
  }
]
```

### Set-level fields

A proposal carries the palette, the backdrop, the placement and the sizes above its slides, the
same way the studio does. Until recently it computed all of them and then returned none of them,
so anything KIPP asked for above the slide level reached the row as `undefined` and the renderer
quietly used its defaults. `--options` prints the accepted values for each.

```json
{
  "format": "portrait",
  "theme": "midnight",
  "backdropImage": "Storm over the hills",
  "backdropCrop": 1.45,
  "backdropFocus": "bottom",
  "backdropDim": 0.78,
  "placement": "bottom-left",
  "typeScale": 1.15
}
```

**KIPP names a photograph, it does not upload one.** `backdropImage` is the label of something
already in the studio's library, resolved against the live table just before the write. A label
that matches nothing stops the run and prints the labels that exist, because the alternative is a
card that quietly comes out on a flat colour and gets approved before anybody notices the picture
is missing. Uploading stays a person's job, which keeps the shape of the whole feature: the agent
proposes with what is there, and the only things that add to the library or publish out of it are
clicks.

`note` is required, and it is the part that decides whether the queue gets read. Say where the
card would be posted and why it is worth posting. A card with no reasoning is a card a reviewer
has to reverse engineer.

A comparison carries two lists rather than one, and both are required, because a comparison with
one side filled in is an advert with the awkward half deleted:

```json
{
  "template": "compare",
  "headline": "The same week, run two ways",
  "labelA": "How it goes now",
  "items": ["The schedule is in one file and the call sheet in another"],
  "labelB": "With ABRAM",
  "itemsB": ["The sheet is built from the schedule, so they cannot disagree"]
}
```

### The caps, and why they are there

- **Seven proposals per run**, one for each morning the post pack goes out. It was six until the
  daily calendar made six a guaranteed silent morning. It is still a cap, and a queue nobody
  finishes is still a queue nobody opens.
- **Ten slides per carousel.**
- **Everything lands as a draft, from `source: kipp`.** The library badges them and counts them so
  they are impossible to miss and impossible to publish by accident.

### What KIPP should draft, in rough priority order

1. **Something that actually shipped.** A merged change with a user-visible outcome is the only
   claim that needs no defending. Announcement or product look.
2. **A page that is getting search impressions and no clicks.** The card is a second route to a
   page the world is already half interested in. Product look or statement.
3. **A question that keeps coming up.** Checklist or steps, answered plainly.
4. **A word that gets used on set and means something specific.** Definition. These are useful
   before they are an advert, which is why they get saved.
5. **A line from an existing doc or post that reads well on its own.** Quote.

What it should not draft: anything requiring a number nobody measured, anything implying a
customer count, any card whose headline would be false if a reader took it literally, and any
product or showcase card whose screen it cannot point at in the app.
