# CRM console rebuild: what is done, what is left

Written 2026-08-18, at the end of a working session. Everything below is uncommitted and sitting in the working tree on `main`.

The job was: the CRM backend read as confusing, the side drawers should be full pages, there should be one source of truth for people and companies, a central store for the brand and the brain and how proposals get written, and an MCP server so teammates can ask Claude for CRM data scoped to their own account. Also: remove a stray real brand name.

---

## Do these three things first

**The four migrations are applied.** Pushed to `fovvtmwmrivuwnqemcil` (ABRAM-WEBSITE) on 2026-08-18 and confirmed present remotely: the carve-out comment, the sources invariant, `brain_docs`, and `mcp_tokens`. Verified after the push: four seed documents on the shelf, both new tables live, and an anonymous client refused a read on all three plus an insert into `mcp_tokens` with `42501`, which is the missing INSERT policy doing its job.

One thing that verification could **not** prove: `crm_contacts` is empty, so the sources backfill repaired nothing and the trigger has never fired. It is installed, and the first capture will be its first real test.

1. **Read `.agents/crm-mcp.md`** before touching anything under `src/lib/mcp/` or `src/app/admin/dashboard/brain/`. It carries the reasoning that is not in the code.
2. **Run the three-role access check** in that file. It is the one thing type checking cannot see, and if a growth advisor's `pipeline_summary` returns everything, something reached for the service role and it must not ship.
3. **Read `docs/design/crm-record-pages.md`** before adding any screen to the CRM. The three record pages follow it to the class and a fourth that does not will look like a different product.

---

## What is done

### The address scheme

Four objects, one address each. Every old address redirects, and all of them were checked live.

```
/admin/dashboard/people              list, tabs: list lists sequences import events codes card
/admin/dashboard/people/[id]         person page
/admin/dashboard/companies           list
/admin/dashboard/companies/[id]      company page
/admin/dashboard/deals               list, tabs: list board forecast registrations
/admin/dashboard/deals/[id]          deal page
/admin/dashboard/activities          tabs: tasks calls email notes
/admin/dashboard/capture             the one-handed capture form
/admin/dashboard/brain/[collection]/[slug]
/admin/dashboard/growth | content | money | team
```

**The name collision is gone.** `/admin/dashboard/people` used to be the *team access* screen while CRM people lived at `/crm/people`. Team access now lives in `team/` (`AccessPanel.tsx`, `PeopleManager.tsx`, `accessActions.ts`) and is reached at `/team?tab=access`.

That collision had produced four dead links in `PeopleWorkspace.tsx` and two `revalidatePath` calls in `bulkActions.ts` pointing at the wrong screen, so bulk edits never refreshed the list. Both fixed.

### The three record pages

Each replaces a drawer, has `loading.tsx`, `not-found.tsx`, and a refused state that renders a closed door rather than redirecting.

| Page | Tabs | Notes |
|---|---|---|
| `people/[id]` | Overview, Activity, Deals, Sequences | Sequences dropped from the array without `crm.sequences.manage` |
| `companies/[id]` | Overview, People, Deals | Rollups are scoped queries, not slices of a map of every account |
| `deals/[id]` | Overview, Attribution | Closing stays a two step; attribution has nothing to change on it |

Three Save buttons became one sticky bar with a change count and ⌘S. Lists, deal board cards and the command palette all link to these pages. The old `?contact=`, `?account=` and `?deal=` query forms redirect and `replace` rather than `push`.

**`ContactDrawer.tsx` is deleted** (1105 lines). It was the largest file in the console and the only surface anywhere in it writing to Supabase directly from the browser, which is why its timeline entries never carried `author_user_id`. Every person write now goes through `people/actions.ts`.

### SSOT repairs

- **Newsletter signups become people.** `api/newsletter/subscribe/route.ts` now calls `syncFeedPerson`. Before this, `linkSubscriberToContacts` only ever *updated* existing contacts, so a stranger who subscribed from the site existed in `subscribers` and nowhere else until somebody clicked convert by hand.
- **The capture route writes `sources` and `lifecycle_stage`**, and a trigger now enforces `source = ANY(sources)` with a backfill. Every conference capture since 18 August had written an empty array, making those people invisible to the source filters and scoring them low.
- **One email matcher.** `contactSync.ts` was calling `.ilike()` without escaping `%` and `_`, while its sibling in `subscriberLink.ts` escaped. Now both escape.
- **Feeds stamp `owner_user_id`.** CSV import and subscriber conversion set it; the public newsletter route does not, because nobody chose.

### The brain

`brain_docs` and `brain_doc_revisions`, at **Content → Brain**. Five collections mirroring `abram-network/.agents/brain/`: brand, business, market, decisions, proposals.

- A trigger files the superseded version before every update that changes the words. `SECURITY DEFINER`, and the revisions table has no write policy: a history somebody can edit is not a history.
- `last_verified_on` on every document, amber past ninety days. Verifying is its own button, separate from saving.
- Read: everybody with console access. Write: owner and admin, via a new `content.brain` permission.
- The editor is database only. It does **not** copy `editor-actions.ts`, which writes `docs.json` to disk and shells out to a build script, both of which fail on a read-only serverless filesystem.
- `src/components/admin/Markdown.tsx` renders without a compiler, so a half-typed `<` in a draft cannot throw inside a server component.

### The MCP server

`POST /api/mcp`, excluded from the middleware matcher. Token issued at **Team → Claude access**.

**The server never answers with the service role.** It resolves a token to a person, opens a real database session for them via `generateLink` plus `verifyOtp` (which generates and does not send mail), and runs every query with it. Postgres decides what comes back.

Thirteen tools. It can log activity, add follow ups, and move a deal between open stages. It cannot close a deal, delete, or archive. Every write records `author_user_id`.

Tokens are SHA-256 at rest, shown once, 180 days by default, ten live per person, and revocation is checked on every call.

### The console error, fixed

`Only plain objects can be passed to Client Components` on the company page, and behind it a hard `Functions cannot be passed directly to Client Components` that broke the render.

Cause: the three record pages built their tab arrays on the server and passed them to client components. A tab carries a lucide icon, an icon is a component, and a component cannot cross that boundary. Fixed by moving each tab strip into its client component and passing only plain data (counts, permission booleans). A sweep found no other instance.

### ARBY

It was `abry_portfolio`, referencing Abry Partners, a real private equity firm: a placeholder in the carve-out field and the `crm_accounts.carve_out` column comment. Also a violation of the no-real-brand-names rule in `AGENTS.md`. Removed from both, plus the historical migration's copy, so the repo is clean. The new migration fixes the live database and **reports** stored carve-out values rather than rewriting them, since a carve-out names a real agreement and editing one silently moves money.

---

## What was done in the follow-up session (2026-08-18, later)

Items 1 to 4 and half of 7 are done. `npm run build`, `npm run lint` and `npm test` all pass; the suite is **83 tests**, up from 60.

### 1. Growth INSERT ownership: done, and wider than described

`20260818170000_growth_insert_ownership.sql` gives `crm_contacts`, `crm_accounts` and `crm_deals` an INSERT `WITH CHECK` that is a copy of the same table's UPDATE policy. **`crm_accounts` had the identical gap** and was not in the original list. The rule is one sentence: a growth member may only create a row they could then edit. `.agents/growth-crm.md` carries the reasoning.

Safe because every session-scoped insert already stamps ownership (`createDeal`, `createAccount`, `syncFeedPerson` via both console feeds). The three that do not hold the service role and are not subject to these policies.

### 1b. `crm_attribution_audit`: it was never broken

**The handoff was wrong to call this the highest-severity item.** The view is switched to invoker rights by `ALTER VIEW` at `20260817110000_growth_commission_ledger.sql:609`, the very next migration in sequence, so the live database has always been correct.

What was real is a latent trap: `CREATE OR REPLACE VIEW` resets any reloption the statement does not name, so the next person to add a column to that view would silently hand it back the definer's rights. The option is now pinned inline at the creation site as well, and the comment says why the repetition is deliberate.

### 2. Company text resolves to an account: done

`src/lib/crm/accountMatch.ts` proposes and never writes. Email domain first against `lower(domain)`, normalised company name second, and it refuses rather than guesses: consumer mail domains name no employer, an ambiguous name has no answer, and there is deliberately no fuzzy third pass. 23 tests in `tests/account-match.test.mts`, most of them about what it declines.

Two surfaces offer the fix. The person page suggests beneath the company select as soon as the field is typed. The Companies screen dropped `.not("account_id", "is", null)` and now carries every unlinked person grouped by the company they name, with one action per group. Both go through `linkContactsToAccount` / `createAccountForContacts` in `people/actions.ts`, which take a list because eleven people at one company are one decision.

### 3. Subscribers under People: done

`subscribers/actions.ts` is now `people/subscriberActions.ts` and the folder is gone. The built-in list already existed as `SMART_LISTS` in `lib/crm/savedViews.ts`; what was missing was an address for it, so `?list=<id>` now deep-links a smart list the way `?view=` deep-links a saved one. The two dashboard KPI cards point at `/people?tab=list&list=subscribers` instead of relying on the redirect.

### 4. Create pages: done, and both drawers deleted

`companies/new` and `deals/new` exist; `AccountDrawer.tsx` (600 lines) and `DealDrawer.tsx` (773) are deleted.

The forms are extracted rather than copied: `companies/CompanyFields.tsx` and `deals/DealFields.tsx` are imported by both the record page and the create page, so the two cannot drift. `AccountOption` and `ContactOption` now live in `DealFields.tsx`, which is what `DealsListPanel` imports. That panel also lost a 1000-row contacts query that existed only to fill the drawer's select.

A new deal has no stage control: `createDeal` stamps `opportunity`, and won and lost stay on the record page where closing asks for a date and says it cannot be undone.

### 7a. `Overline`: done, and it was 16 files rather than one

The handoff called it a one-file fix. `Overline` was two occurrences, but the same recipe is hand-inlined across the console: **56 `gray-*` tokens in 16 files**, all now `zinc-*`. Marketing pages, the docs route and the diagram mocks still carry `gray-*` and were deliberately left alone, being outside the console rule and unverifiable from here.

---

## What was done in the second follow-up (2026-08-18, evening)

Database access was restored, so the checks that could not run, ran.

### A. The MCP server is verified against the live project

The session exchange, which was the one piece never exercised for real, **works**. Full results are in `.agents/crm-mcp.md`. In short: a token resolves to a real user session, reads come back through that session, `log_activity` writes and carries `author_user_id`, closing a deal is refused in a sentence, and revoking a token 401s the very next request.

**Steps 2 and 3 of the three-role check still have not run, and cannot yet.** `admin_users` holds exactly one row. There is no growth advisor and no contributor to sign in as, and inventing them in the production database would be worse than leaving the check open. **Run them the day a second teammate is onboarded, before handing over a token.**

### B. The CRM was empty and is not any more

`crm_contacts` held zero rows while `subscribers` held thirty real people. The conversion existed as a button and had never been pressed.

`scripts/backfill-people-from-subscribers.mjs` fixes that, and imports the real merge rule from `contactSync.ts` rather than reimplementing it. Dry run by default, `--apply` to write, `--resend` to realign the list flags from Resend first.

Applied: **6 rows realigned** against Resend (local had 29 flagged as application against a segment of 23), then **30 contacts created**. Re-running reports 0 to create, which is the idempotence claim holding.

**The two lists mean different things and now land differently.** `is_application_list` is somebody who asked for access to the product, which is `app_signup` and `lead`; `is_marketing_list` alone is `newsletter` and `subscriber`. Both are kept when both are true, which needed `alsoSources` on `FeedPerson`, because a person can be on two lists at once and 23 of these are. Result: 23 leads, 7 subscribers.

### C. Wording

The People screen was headed **"Conference Contacts"** and described as people who scanned a code in a hallway. It is the master people list and its contents are overwhelmingly app applicants, so it now says what it is. Events, Codes and capture mode keep their conference wording, because those genuinely are conference features.

Also corrected: the dashboard cards pointed "New company" and "New deal" at the list screens rather than the create pages built earlier, and `viewActions.ts` was revalidating `/admin/dashboard/lists`, which is a redirect and refreshes nothing.

### D. One structural fix that unblocked the rest

`contactSync.ts` is the pure merge rule, and it could only be loaded inside a Next request: it imported two string helpers from `subscriberLink.ts`, which imports `@/utils/resend`, which imports the server Supabase client, which imports `next/headers`. So no test and no script could call it.

`src/lib/crm/emailKey.ts` now holds those two functions and imports nothing. Keep it a leaf.

---

## What is still left

### 1. The three-role MCP check, when there is a second teammate

See A above. This is the one thing that stays open by necessity rather than by choice.

### 2. Two live funnel errors, neither from this work

`node scripts/funnel-audit.js --human` (with credentials in the environment) reports:

- **30 people are on the marketing list and none has ever been sent a welcome.** Before anybody "fixes" this, note that these people signed up between June and August. Firing the welcome sequence at them now would send a welcome to thirty people months late. Backfill `welcome_email_sent_at` for the existing list first, then let the welcome fire only for new signups.
- **No open or click has ever been recorded.** Not a code gap: the webhook already handles both events. Enable open and click tracking on the sending domain in Resend and add `email.opened` and `email.clicked` to the webhook subscription.

### 3. Console touch targets

**160 interactive controls across 30 files** are under the 44px mobile minimum `AGENTS.md` calls non-negotiable; 79 already use the correct `h-11 sm:h-9`. Not a blind replace: a taller control inside a dense table row changes that row's rhythm, so each wants checking at 375px and 1024px. Worst: `broadcasts/EmailPanel.tsx` (25), `tasks/TaskQueue.tsx` (16), `people/PeopleWorkspace.tsx` (14), `people/ProfileTab.tsx` (14).

### 4. Deferred data work, with reasons

Recorded rather than done, so nobody redoes the thinking:

- The uniqueness index is `(profile_id, lower(email))`, so a second `crm_profiles` row would make the same human two contacts legitimately. Leave it until a second profile actually exists.
- `crm_scans.contact_id` has no foreign key, and **all 25 scans carry a null one**, so there are no orphans to worry about yet. Add the key before scans start resolving to people.
- `crm_interactions.author` free text still sits beside `author_user_id`. Drop it once the id column is verified populated everywhere.

### 5. One unused export

`convertSubscriberToContact` in `people/subscriberActions.ts` has no caller. Kept, because it is guarded and is the obvious per-row action for a subscribers list, but it is a live RPC endpoint with nothing calling it.

---

## How to verify anything here

```bash
npm run build && npm run lint && npm test
```

60 tests, all passing. `tests/mcp-tokens.test.mts` covers minting, hashing and reading the bearer header; the session exchange is deliberately untested because a test that mocks the auth service proves the mock behaves.

```bash
node scripts/seo-audit.js --human
node scripts/funnel-audit.js --human
```

Both exit 78 without database credentials, which is a skip and not a failure.

For the route moves, walk the redirect table:

```bash
for p in /admin/dashboard/crm/people /admin/dashboard/accounts /admin/dashboard/subscribers /admin/dashboard/lists; do printf "%-40s -> " "$p"; curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" "http://localhost:3000$p"; done
```

For the MCP transport, without needing a token:

```bash
curl -s -i -X POST http://localhost:3000/api/mcp -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | head -3
```

Expect 401 with `WWW-Authenticate: Bearer realm="abram-crm"`.

---

## Files worth knowing

| Path | What it holds |
|---|---|
| `docs/design/crm-record-pages.md` | The build spec every CRM screen follows |
| `.agents/crm-mcp.md` | The MCP server and the brain, and why they are shaped as they are |
| `src/app/admin/dashboard/people/actions.ts` | The one write path for a person |
| `src/lib/mcp/session.ts` | Tokens, the session exchange, every refusal |
| `src/lib/mcp/tools.ts` | The tool registry and the wording of every answer |
| `src/lib/brain/collections.ts` | The five shelves and the ninety day rule |
| `src/lib/crm/console.ts` | Shared console helpers, moved out of `dashboard/crm/lib.ts` |
| `src/components/admin/Markdown.tsx` | Markdown without a compiler |
| `next.config.ts` | Thirty-odd redirects holding every old address alive |

Net change across the session: 64 files touched before the brain and MCP work, **359 insertions against 1417 deletions**. The console got smaller.
