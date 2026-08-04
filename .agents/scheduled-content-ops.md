# KIPP — Content Ops & Search (agent-co)

The fourth AI employee, and the first one that lives in **ABRAM-DOCS** rather than the product
repo. Its colleagues — TARS (error triage), Murph (product polish), Romilly (research) — all run
in `abram-network`. KIPP runs here, reads their shared brain, and writes back to it.

**What it is for:** keep what the world sees about ABRAM **true, findable, and persuasive — in
that order.** A wrong claim on a public page is a liability. A true page nobody can reach is
worth nothing. Copy that converts a reader who was misled is the worst of the three.

- **Prompt:** [`scheduled-content-ops.prompt.md`](./scheduled-content-ops.prompt.md) — what it
  actually does, phase by phase.
- **Voice & claims SSOT:** [`brand-voice.md`](./brand-voice.md) — governs every published word.
- **Workflow:** [`.github/workflows/scheduled-content-ops.yml`](../.github/workflows/scheduled-content-ops.yml)
  — installed 2026-08-03. It began life as a template in this directory; that copy is deleted, so
  there is one file and it cannot drift.
- **Design context:** `abram-network` → `docs/design/ai-employees-next-hires.md` §2 and
  `docs/design/ai-employees.md`.

---

## Setup checklist

Until every **required** secret exists, the workflow is inert. Add secrets first, install the
workflow last.

### 1. Claude Code auth

```bash
claude setup-token
```

Store the result as `CLAUDE_CODE_OAUTH_TOKEN`. Subscription auth, not a metered API key; the
token lasts about a year. Same secret name the other three employees use.

### 2. Database access

| Secret | Value | Why |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ABRAM-DOCS project URL | Landing analytics, blog, help docs, subscribers, SEO snapshots |
| `SUPABASE_SERVICE_ROLE_KEY` | ABRAM-DOCS service role key | Snapshot tables are service-role only |
| `NETWORK_SUPABASE_URL` | abram-network project URL | The shared employee brain |
| `NETWORK_SUPABASE_SERVICE_ROLE_KEY` | abram-network service role key | Writing `abram_brain_events` and `agent_briefs` |

> **Note the boundary, and note that it is a prompt rule rather than a credential one.** The
> network service-role key is capable of writing any product table; the prompt restricts KIPP to
> two. That is the same trust model the other employees run under, but it is worth knowing
> explicitly rather than assuming the key is scoped. If it ever proves insufficient, the fix is a
> dedicated role, not a wider prompt.

### 3. Cross-repo read access

`NETWORK_REPO_READ_PAT` — a **fine-grained** PAT with `Contents: Read` on `cthomas32/abram-network`
and nothing else. This is Romilly's access shape. KIPP reads `.agents/brain/` and
`git log origin/main` from it; it can never push, because the token cannot.

### 4. Slack

`SLACK_WEBHOOK_URL_KIPP` — an Incoming Webhook bound to **`#kipp`**. Create the channel first.
Falls back to `SLACK_TRIAGE_WEBHOOK_URL` if unset, which is fine for a first run but means KIPP's
reports land in the triage channel.

### 5. Install the workflow

~~Copy the template into `.github/workflows/`.~~ **Done 2026-08-03.** The workflow is installed at
`.github/workflows/scheduled-content-ops.yml` — the first one in this repo.

### 6. Apply the snapshot migration

```bash
npx supabase db push
```

Creates `seo_query_snapshots` and `seo_audit_runs`
(`supabase/migrations/20260803120000_seo_snapshots.sql`). Both are service-role only with RLS on
and no policies. **Always the Supabase CLI — never an MCP `apply_migration`.**

### 7. Google Search Console — optional, but it is the whole point

Without this KIPP does on-page hygiene and on-site behaviour analysis. With it, KIPP does SEO.
The difference is whether it can see **what people actually search for**.

1. In Google Cloud, create a project and a **service account**. No roles needed — Search Console
   authorises by email, not IAM.
2. Create a **JSON key** for it and copy the whole file contents.
3. In Search Console → your property → **Settings → Users and permissions → Add user**, add the
   service account's `client_email` with **Full** or **Restricted** access (Restricted is enough
   to read; the script only ever reads).
4. Add the secrets:
   - `GSC_SERVICE_ACCOUNT_JSON` — the entire JSON key file, pasted as-is. **Do not strip
     whitespace**; the `private_key` field contains real newlines and stripping them corrupts the
     key. The workflow deliberately excludes this one from its whitespace-stripping loop.
   - `GSC_SITE_URL` — the property spelled exactly as Search Console spells it. Domain property:
     `sc-domain:abram.network`. URL-prefix property: `https://abram.network/` (**with** the
     trailing slash). Getting this wrong returns 403, not 404, which is a confusing way to fail.

Verify locally before trusting a scheduled run:

```bash
GSC_SERVICE_ACCOUNT_JSON="$(cat ~/path/to/key.json)" \
GSC_SITE_URL='sc-domain:abram.network' \
node scripts/gsc-report.js --no-write --human
```

Exit **78** means "not configured" and is a deliberate skip, not a failure — the workflow
continues without it.

---

## Cadence

**Weekly, Friday, 09:47 ET** (08:47 in winter — GitHub cron cannot observe daylight saving, and
the accepted trade is reliable delivery over exact local time).

Weekly rather than daily because a changelog is a weekly artifact, daily marketing is noise, and
unlike TARS there is no error queue forcing KIPP's hand. Friday because the week's shipped work
is complete by then and the ammo pack is in Connor's hands before the weekend, when he posts.

There is deliberately **no hour-guard**. A delayed run still runs and still reports. A
self-rejecting guard is exactly what killed every scheduled run on the product side once already.

### Run modes (`workflow_dispatch`)

| Mode | What it does |
|---|---|
| `weekly` | The full pass. Default. |
| `seo` | Phase 0 + the technical PR lane only. No copy, no changelog, no campaign. |
| `ammo` | Phase 0 + the Slack ammo pack. **No PRs at all.** Use before a launch push. |
| `brief` | Build one approved brief (`brief_id` required). Skips discovery entirely. |

`brief` mode is the one that matters most. On the product side every PR that reached `main`
fastest came from Connor clicking "Build this" and Murph shipping inside twenty minutes. KIPP is
built for the same loop.

---

## What it may and may not do

**Opens PRs for:** metadata, canonicals, `openGraph`, JSON-LD, sitemap registration, internal
links, alt text, frontmatter, `docs.json`, and body copy on feature pages, comparison pages, and
`user-guide/` articles.

**Only proposes (brief + Slack, never an edit):** the homepage hero, the primary positioning
line, the tagline, and how pricing is framed. Positioning is Connor's — and
`BUSINESS.md` open question #1 records that the adopted positioning is genuinely unsettled, so
KIPP's job there is to surface the inconsistency with evidence, not resolve it by editing.

**Never:** merges a PR, publishes anything, sends a campaign or any email, posts to social, holds
social credentials, uploads an image, writes a photographer's credit, names a real user or
customer, quotes a price without reading the plans registry in the same run, or writes to any
`abram-network` table other than `abram_brain_events` and `agent_briefs`.

**Images: it can reach for one, it cannot add one.** `node scripts/social-draft.js --backdrops`
prints the image library and KIPP names a picture by its title in a proposal. Uploading stays a
person's job, which is what keeps the shape of the feature: the agent proposes with what is
already on the shelf, and the only things that add to the shelf or publish off it are clicks.
The credit is copied onto the card from the library row rather than written by KIPP, because an
agent has no way to know who took a photograph and letting it compose an attribution is letting
it invent one. **A picture with no title but a camera's filename is a picture KIPP cannot ask
for** — retitling on the way in is what makes the shelf usable by anything other than eye.

**Two PR lanes, never mixed.** Mechanical changes and copy changes go in separate PRs. A copy
change buried in a 40-file metadata sweep gets rubber-stamped, and rubber-stamped copy is how a
false claim ships.

---

## The tools it runs

### `scripts/seo-audit.js`

Deterministic technical audit. Zero dependencies, safe to run any time, no network calls.

```bash
node scripts/seo-audit.js --human           # readable
node scripts/seo-audit.js                   # JSON (what the agent reads)
node scripts/seo-audit.js --fail-on-error   # exit 1 on any error-level issue
```

Checks metadata presence, canonicals, `openGraph`, title/description length bands, duplicate
titles and descriptions, sitemap drift in **both** directions, JSON-LD on commercial pages,
`user-guide` frontmatter completeness, `docs.json` registration, and orphan pages nothing links
to.

It exists so KIPP does not burn Opus tokens re-deriving facts a script can prove. Judgment —
*what the copy should say* — stays with the agent.

**This is also useful to you directly.** It is the fastest read on the state of the site, and it
would be reasonable to wire `--fail-on-error` into a PR check later so drift cannot land at all.

### `scripts/gsc-report.js`

Pulls Search Console, snapshots into `seo_query_snapshots`, and returns five analyses:
`strikingDistance` (positions 8–20 — the highest-yield list on the site), `poorCtr` (ranks well,
nobody clicks — the title is the problem), `contentGaps` (shown for queries we never wrote
about), and `slipping` / `rising` (week-over-week movement).

The snapshot is the point. Search Console retains 16 months and has no history API, so without
our own copy there is no way to ever answer *"did that title rewrite work?"*

Remember position is golf: **lower is better, so a negative `deltaPosition` is an improvement.**

---

## Baseline at hire time — 2026-08-03

What `node scripts/seo-audit.js` reported on the day KIPP was built, so the first run has
something to beat: **10 errors, 47 warnings, 10 info** across 39 public routes and 48 articles.

The findings worth knowing about, because they are not evenly distributed:

- **All five `/alternatives/*` comparison pages are orphans** — nothing on the site links to
  them. These are the highest commercial-intent pages we have (someone searching "StudioBinder
  alternative" is shopping), and they receive no internal authority at all.
- **All six `/start/*` conversion pages are orphans too, and none has a canonical.**
- **14 pages have descriptions over 160 characters**, so Google truncates them and substitutes
  its own snippet. The homepage's is 267. These are the cheapest wins available.
- **`/production-brain` and `/intelligence/creative-copilot` export no metadata at all** and are
  missing from the sitemap. `/production-brain` is doubly awkward: `AGENTS.md` §2 cites it as the
  reference example for JSON-LD, and it has none.
- **`/alternatives` (the index) is missing from the sitemap.**

Behaviour over the first six days of tracking (2026-07-28 → 08-03): 69 sessions, 1 signup click,
0 emails captured. `/start/ai-assistant` loses 83% of readers above the fold.
`/start/filmmakers` is the only page converting anything and has the shortest dwell.

None of these were fixed when KIPP was built — deliberately. They are its first job, and they
make the first run measurable.
