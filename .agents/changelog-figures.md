# Changelog figures

The small dark UI diagrams that sit inside a release note and its campaign email.
Established with 1.4.0. Source lives in `scripts/changelog-figures/`.

**The key idea: a figure is drawn from the app's own tokens, not from a screenshot and not
from taste.** Every colour, label, icon and status value in a figure traces to a specific
constant in `abram-network`. That is what makes them look like the product instead of like a
marketing illustration of the product — and it is what stops them going quietly stale, because
a wrong figure is a false claim in the sense of `brand-voice.md` §1, just a slower one.

They are also *not screenshots*, deliberately. A screenshot carries whatever real data happened
to be on screen, ages the moment a padding value changes, and cannot be cropped to the one idea
the paragraph is making. A drawn figure shows one true state of one surface.

---

## 1. Two outputs, one source

| Surface | Format | Why |
|---|---|---|
| Changelog page | inline `<svg>` in the note body | MDX renders it; stays crisp at any width; `wrapWideFigures` gives it a phone scroller |
| Campaign email | `<img>` → hosted 2x PNG | every mail client strips `<svg>`. Gmail removes it, Outlook renders through Word |

Both come from the same function, so they cannot drift.

**Never put SVG in an email**, and never let the admin *broadcast* action send a release note that
contains figures — it injects `note.content` straight into the body, so recipients get blank gaps
where the figures should be. Send the campaign draft instead.

---

## 2. How we design one

**Read the component first.** Open the real file in `abram-network` before drawing anything.
Copy the labels, the status vocabulary, the icon choices and the column order out of it. The
1.4.0 figures cost two rebuilds because the first pass invented a status set that does not exist
anywhere in the product.

**Composite the opacities by hand.** The app writes `text-fg/40`; SVG has no cascade, so work out
what that resolves to over its actual background and use the flat hex. `#FAFAFA` at 40% over
`bg-well` `#1C1C1C` is `#757575`. The tokens block in `figures.js` has the ones already derived.

**Use the surface's own vocabulary.** A Run of Show segment is `pending / live / completed /
skipped`. A task is `Not Started / In Progress / In Review / Approved / Completed`. They are
different systems and mixing them makes a figure that reads as nonsense to anyone who uses the
product.

**Obey the block language.** Meaning is never a colour bar or slab on the edge of a card or row —
colour lives in small glyphs and small chips. This is recorded in `abram-network`'s
`.agents/brain/DECISIONS.md` and enforced by `src/components/project/blocks/`.

**No red, and go easy on warm accents generally.** `--abram-red` exists for safety alerts only.
Amber is the app's attention colour, but a figure with an amber tab strip reads as a warning
state; prefer a neutral persona (Producer is `zinc`) unless the amber is the point.

**Show one true state.** Four rows, three lanes, four tiles. Not a maximal screen — a legible one.
Pick the state that illustrates the sentence next to it.

**Caption inside the figure.** One quiet line at the bottom in `FG45`, saying the thing the
picture cannot. It survives into the PNG, which matters when images are the only thing a reader
can see.

**Geometry.** `viewBox` 720 wide — over the 600 minimum that makes `wrapWideFigures` wrap it in a
scroller, and a clean 2x down to the email's 536px column. Card radius 16 (`--radius`), inner
elements 8–12. Uniform gutters; if the left margin is 24 the right margin is 24.

---

## 3. Workflow

```bash
node scripts/changelog-figures/render.js preview          # look at it first
node scripts/changelog-figures/render.js svg <name>       # paste into the note body
node scripts/changelog-figures/render.js publish 1-4-0    # 2x PNGs for the email
```

`publish` content-hashes every filename, sets a one-year cache header, sweeps older objects in
that release folder, and writes a url map. The hash is not optional: re-uploading a corrected
figure to the same path leaves every cache — including Gmail's image proxy — serving the old one.

Then compile-check the note body before saving it. Raw markup that MDX rejects takes the whole
changelog page down, and the draft row is not validated on write.

---

## 4. Before it ships

- [ ] Opened the preview sheet and looked at it
- [ ] Every colour traced to a token; no invented hex
- [ ] Status values and labels match the surface's own SSOT
- [ ] No red; no amber unless it is the subject
- [ ] Nothing clipped — text inside its `viewBox`, columns not colliding
- [ ] Note body compiles as MDX and every figure gets wrapped
- [ ] PNGs return 200 at their hashed urls
- [ ] Email under ~100KB of HTML (Gmail clips) and images under ~600KB total
- [ ] The prose still makes sense with images blocked

---

## 5. Figures we still need

Roughly in the order a future release is likely to want them. One per surface, built the same way.

**High value — the surfaces we ship into most**

| Figure | Surface | Read first |
|---|---|---|
| `stripboard-scenes` | scene strips, INT/EXT × day/night wash, banner rows | `StripboardView.tsx` |
| `budget-sheet` | spreadsheet keyboard entry, fringes, totals | Budget + Expense sheets |
| `business-document` | a quote or invoice as the client sees it | `BusinessDocumentView.tsx` |
| `workload-balancer` | capacity bars, over-allocation, conflict cards | `WorkloadBalancer`, `ConflictCardView` |
| `utilization-calendar` | bookings, holds, blockouts, subscribed-calendar clashes | capacity calendar + `dayEvents.ts` |

**Client-facing**

| Figure | Surface | Read first |
|---|---|---|
| `client-portal` | what an external client actually sees | client-portal routes |
| `invitations-inbox` | one inbox, RSVP states | unified invitations inbox |
| `document-viewer` | the shared in-app viewer | `DocumentViewerDialog` |

**Platform**

| Figure | Surface | Read first |
|---|---|---|
| `ask-abram` | the chat panel with a streaming answer | `ChatArea` / chat panel |
| `permissions-page` | member permissions grid | org member permissions page |
| `get-started` | onboarding checklist + capability gating | `GetStartedChecklist.tsx` |
| `financial-reports` | date-scoped exports and totals | reports/export surfaces |
| `crew-matching` | skill-graph match results and scores | matching service UI |

**Owed a rebuild**

| Figure | Note |
|---|---|
| `abram-on-a-phone` | attempted for 1.4.0 and cut — two phone frames side by side read as flat and toy-like. Worth retrying as **one** phone at a larger scale, or as a cropped detail rather than a whole device. The mobile work deserves a picture; that attempt was not it. |

**Deliberately not figures**: pricing and plan matrices (they belong on the pricing page, where
they come from the registry and cannot go stale), anything showing a real org, project or person,
and anything asserting a number we have not measured.
