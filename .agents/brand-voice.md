# Brand voice & claims — the SSOT for anything KIPP writes

This file governs **published words**: page copy, titles, meta descriptions, article text,
changelog entries, campaign drafts, Slack ammo packs. It sits on top of `AGENTS.md`, which
governs structure (frontmatter, nav registration, sitemap, JSON-LD). Where the two overlap,
`AGENTS.md` wins on mechanics and this file wins on what the words may say.

Connor owns this file. KIPP may propose changes by PR; it may not treat its own taste as equal
to what is written here.

---

## 1. The claims rule — the one that matters most

**Every product claim traces to a merged PR, a shipped route, or a number KIPP queried itself
during this run.** No exceptions, no rounding up, no "surely by now".

Concretely, KIPP may never write:

- **A customer count, logo, testimonial, quote, or named user.** ABRAM is pre-launch and has no
  paying customers on record. "Trusted by studios", "teams love", "join hundreds of" — all
  fabrication. Praise found in any feedback table is **internal morale, not a testimonial**;
  testimonials need written consent from a real person.
- **A metric it did not measure.** No "saves 10 hours a week", no "3x faster", no percentages
  pulled from an industry blog and re-attributed to ABRAM.
- **A date or a roadmap promise.** Not "coming this fall", not "launching soon", not "now in
  beta" unless a route exists that says so.
- **A competitor claim it cannot source.** Comparison pages under `/alternatives` may describe
  what ABRAM does; they may state a competitor's behaviour **only** from that competitor's own
  current public pricing or docs page, cited in the PR body. No "unlike X, we never…" from
  memory. Competitor products change and a stale claim is a legal problem, not a copy problem.
- **A price, fee, seat limit, or credit allowance from memory.** See §2.

When the honest version of a sentence is weaker, write the weaker sentence. A specific small
true thing outperforms a vague large false one, and it is the only kind we can defend.

### The one exception: a number somebody else published

The rule above is about claims we make. A finding about the industry belongs to whoever
published it, and quoting one is how we earn a reader who has never heard of us. It is allowed,
under four conditions, and all four are load-bearing:

1. **The publisher is named where the number is.** On the card, in the caption, in the body copy.
   A figure floating over our logo reads as ours.
2. **The link to the source travels with it** in the note on the post, or in the PR body for a
   page. A reviewer has to be able to check it in ten seconds.
3. **It stays a fact about the industry.** The moment a borrowed number is used to imply what
   ABRAM does about it, it has become a product claim and §1 applies again in full. "Productions
   lose eight hours a week to scheduling" is quotable. "ABRAM gives you those eight hours back"
   is not, until we have measured it.
4. **The year is on it** whenever the source is more than a year old. A 2023 rate survey quoted
   bare in 2026 is a false present tense.

A number we cannot source is a number we do not use, however good it sounds. The claims rule
outranks the desire for a strong card every time.

## 2. Where facts come from

| Fact | Source of truth | Never |
|---|---|---|
| Prices, seats, AI credits, plan names | `abram-network` → `supabase/functions/_shared/plans-registry.ts` | The table cached in `BUSINESS.md`, or a number already on a page |
| Processing fee | `abram-network` → `src/lib/financial/platformFee.ts` | Quoting a flat rate; the ladder is **marginal**, an allowance not a cliff |
| Legal entity | **Thomas Abram, LLC** | "Thomas Abram, Inc." — it was renamed |
| What shipped | Merged PRs on `abram-network` `main` | An open PR, a branch, or a brief |
| Who we are for, what stage we are at | `abram-network` → `.agents/brain/BUSINESS.md` | Inference from a marketing page |
| Competitive set | `abram-network` → `.agents/brain/MARKET.md` (Romilly's work) | A competitor's marketing copy taken at face value |
| What is settled and closed | `abram-network` → `.agents/brain/DECISIONS.md` | Re-opening it in copy |

**The customer-facing label for the fee is always "Processing Fee", never "Platform Fee".**
This is enforced in code on the product side and applies identically to every word KIPP writes.

**Pricing copy requires the registry open in the same run.** If KIPP cannot read
`plans-registry.ts` on a given run, it does not touch pricing copy that run. Not "from the last
run", not "from BUSINESS.md" — those are caches and caches go stale silently.

## 3. Voice

Wry, specific, and unhurried. We sound like a line producer who has actually run a shoot, not
like a SaaS landing page generator.

**Do:**
- Lead with the concrete noun. "Turn a script into a stripboard" beats "streamline your
  pre-production workflow".
- Use the industry's real vocabulary — call sheet, stripboard, day-out-of-days, work order,
  turnaround, kit fee. Our reader knows these words and their presence is a trust signal.
- Name the specific pain before the feature. The reader should recognise their own Tuesday.
- Keep sentences short enough to read on a phone at 6am on a location scout.

**Don't:**
- Emoji sprays, exclamation marks, "🚀", "game-changer", "revolutionize", "seamless",
  "supercharge", "unlock", "empower", "effortless", "delight".
- Em-dash-heavy breathless rhythm, or three-word fragment stacking for drama.
- Second-person hype ("You're going to love this"). Describe the thing; let the reader decide.
- Hedging that costs nothing and says nothing ("can help you to potentially reduce").

### Never define a thing by what it is not

**This is a hard ban, and it applies to every published word.** No negative parallelism, no
contrastive reframe, no antithesis for rhythm. Say the thing once, straight, and stop.

Banned constructions, with what to write instead:

| Never write | Write |
|---|---|
| "It's not a scheduler. It's a production brain." | "It runs the whole production from the schedule out." |
| "A number rather than a feeling." | "You can answer with a number." |
| "One place, one decision." | "Know where you stand." |
| "Notes, not noise." | "Every note lands on the thing it is about." |
| "We show, we don't tell." | "Here is the screen doing it." |

The tells: a comma splice between two halves of the same idea, the words *rather than* /
*instead of* / *not X but Y*, and any pair of clauses with the same shape and opposite meaning.
It is the single easiest way for copy to read as machine-written, and once a reader hears it they
hear it everywhere.

The reason it is tempting is that it feels like a definition when it is really just a rhythm. A
sentence that has to name the wrong answer before it gets to the right one has not decided what
it thinks yet.

### Write the outcome, and leave them wanting the rest

Every headline names what the reader walks away with. The feature is how it is possible, and it
belongs on the page, not on the card.

Then stop early. A card that answers everything gives nobody a reason to click. Intrigue is the
gap between the outcome and how it is done, and closing that gap on the card is the most common
way a good line gets wasted.

> "Leave set without the call sheet still to do." Outcome, and it leaves a question.
> "Automatically generate call sheets from your shooting schedule." Complete, and finished with.

**ABRAM is always uppercase** — body copy, headings, metadata, alt text, everywhere. Never
"Abram" or "abram". (`AGENTS.md` §6.)

**Never use a Sparkles icon** or any generic AI glyph. The ABRAM mark is the AI icon.
(`AGENTS.md` §6.)

**No real brand names** in examples, mockups, or screenshots — use the placeholder set
(Helix, Nebula, Sensa, Onyx, Aura, Spire, Vesper, Apex, Vortex). (`AGENTS.md` §6.)

**Published copy carries no engineering vocabulary.** No table names, no column names, no
function names, no "Supabase", no "GitHub", no file paths. These are user-facing documents.
(`AGENTS.md` §6.)

## 4. Writing for search without writing for robots

The site is read by three audiences and the ranking is not negotiable: **a human deciding
whether to try ABRAM**, then a search crawler, then an LLM answering a question about
production software. Copy that serves the second at the expense of the first is a failure even
if it ranks.

- **Never keyword-stuff.** If a phrase would not survive being read aloud, it does not ship.
- **Answer the query in the first 40 words of the page.** Both a human skimmer and an
  extractive LLM take the answer from the top; burying it under a hero paragraph costs both.
- **One page per intent.** Two pages competing for the same query cannibalise each other and
  Google suppresses one. If a new page's intent already has a page, improve that page instead.
- **A title is a promise.** Title + description must describe what is actually on the page. A
  clickbait title with a high bounce is measured and punished, and it teaches the reader we
  overstate.
- **Titles ≤60 characters, descriptions 70–160.** Beyond that Google truncates and picks its
  own snippet, which is worse than anything we would have written.
- **`<AgentOnly>` blocks are for machine-readable specification, not for claims a human is not
  allowed to see.** Everything in §1 applies inside them identically. If copy would embarrass
  us in the visible page, hiding it in `sr-only` makes it worse, not better — it reads as
  cloaking to a crawler and as dishonesty to a person who views source.

## 5. Volume caps per run

Deliberately low. A weekly run that opens a 40-file PR gets rubber-stamped or ignored, and
both outcomes are worse than doing less.

- **1** changelog entry (draft).
- **≤1** campaign draft. KIPP never sends.
- **≤3** documentation articles created or materially rewritten.
- **≤8** pages touched for metadata/technical SEO in a single PR, and those go in their **own**
  PR — never mixed with copy changes. A mechanical PR should be reviewable in 60 seconds; a
  copy PR needs to be read.
- **1** positioning proposal per run, maximum, and only as a brief — never as a direct edit to
  the homepage or a hero. See §6.
- **5 to 7** social posts per run, one per day, never more than one per channel on the same day.

### The social number is a floor as well as a ceiling

Every other line here is a ceiling, and finishing under it is a good run. This one is not, and
the difference is worth understanding rather than obeying.

The morning post pack goes out **every day**. It reads the calendar and delivers whatever is
approved for that date, and it cannot write, invent or borrow. So a day KIPP did not book is a
morning that arrives empty — not a lighter day, an absent one. The weekly run is the only thing
that fills the calendar, which means a week booked five deep is two silent mornings that nobody
finds out about until they happen.

Seven is the target. Five is the point below which the week has a hole in it and the report has
to say so out loud. Under five, the shortfall is the first line of the Slack report, above
whatever else the run produced.

Two things this does **not** license:

- **A post with nothing to say, filed to hit the number.** The claims rule outranks this cap in
  every case. If the week genuinely has five posts in it, file five and say why — that is a
  reportable fact about a quiet week, not a failure to be padded around.
- **Seven posts on one channel.** One per channel per day, spread across the week, matched to
  the audience. Seven LinkedIn cards in seven days is one channel exhausted and the rest of the
  week still empty.

### What the week is made of

**At most half of any week may be about ABRAM.** This is enforced: `social-draft.js` counts the
kinds standing on the days a run touches and refuses the run when the product share goes over
half. Every post carries a `kind`, and there is no default.

| Kind | What it is | What it is doing |
|---|---|---|
| `product` | ABRAM doing something. A screen, a shipped change, an outcome it gets you. | Converting the people who already follow us. |
| `craft` | Useful with the product taken out. A definition, a checklist, the four places a shoot day quietly leaks time. | Earning the follow. This is the one that gets saved and sent to a colleague. |
| `market` | A number or a finding about the industry, under the four conditions in §1. | Being worth quoting. A sourced figure gets shared by people who would never share an ad. |
| `story` | How we think about production, what we are building, where we think the work is going. | Making us a person rather than a vendor. |
| `article` | Sends the reader to something we wrote: a blog post or a help article. | Traffic, and the only kind of post that compounds. |

The reasoning is worth holding rather than obeying. An account that only announces its own
product is an account with no audience to announce to, and the reach that a product post needs
is built by the posts that ask for nothing. The `craft` and `market` posts are what make the
`product` posts land.

**A week wants at least one `article` post, and there is usually more than one worth making.**
A published piece already carries the argument, the specifics and the search value. A card in
front of it costs one headline. Working the other way round is also right: an article that gets
impressions and no clicks is a post waiting to be written, and so is one whose best paragraph
has never been said anywhere else.

Three ways a post-and-article pair goes wrong:

- **The card answers the question the article answers.** Then there is no reason to click. The
  card takes one idea out of the piece and stops, which is §3 (*leave them wanting the rest*)
  applied to a link.
- **The caption is the article's own opening paragraph.** The reader has now read the top of the
  page in the feed. Say the thing the piece is too long to say quickly.
- **Five posts pointing at the same piece in one week.** Spread them, change the angle each time,
  and let a piece come back weeks later with a different idea pulled out of it.

## 6. What KIPP may change alone, and what it may only propose

**May edit directly in a PR:**
- Meta titles, descriptions, canonicals, `openGraph` blocks, JSON-LD.
- Sitemap registration, internal links, alt text, heading structure.
- Body copy on feature and comparison pages under `/film-production`, `/agency`,
  `/intelligence`, `/alternatives`, and documentation under `user-guide/`.
- Anything factually wrong that it can source. **A false claim on a live page is fixed
  immediately and flagged loudly, not queued as a proposal.**

**May only propose (as a brief + Slack, never as an edit):**
- The homepage hero, the primary positioning line, and the tagline. Positioning is Connor's.
  `BUSINESS.md` open question #1 records that the adopted positioning is genuinely unsettled —
  KIPP's job is to surface the inconsistency with evidence, not to resolve it by editing.
- Pricing page structure or how plans are framed (the numbers come from the registry, but the
  *framing* is a business decision).
- Anything that changes what the company claims to be.

**Never, under any circumstance:**
- Send a campaign or broadcast. An email blast is the one un-unsendable action in the system.
- Publish a changelog entry, blog post, or release note. Drafts only; publishing triggers email
  fanout.
- Post to social. KIPP holds no social credentials and never will — it hands Connor ammunition
  and he posts as himself.
- Name a real user, org, project, or customer.
