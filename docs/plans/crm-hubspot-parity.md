# HubSpot parity for a 1 to 3 person growth team

What the CRM on `claude/abram-crm-admin-lifecycle-zdl2kp` has, what it does not, and the order to
build the rest in.

The target is not HubSpot. The target is the subset of HubSpot that one Head of Growth and one
founder actually use every day, plus the growth-partner pieces HubSpot has no concept of
(registrations, attribution verdict, commission ledger). Everything HubSpot does for a 40 person
sales org is out of scope permanently.

---

## Gap analysis

Legend: **have** works today, **partial** schema or half the surface exists, **none** nothing.

### Objects

| Object | State | Where it is |
|---|---|---|
| Contacts | **have** | `crm_contacts`, `crm/page.tsx` pipeline tab, `ContactDrawer.tsx` |
| Companies / accounts | **partial** | `crm_accounts` table and RLS exist. Zero UI. Read once, in `registrations/actions.ts:98` |
| Deals | **partial** | `crm_deals` table, stages, amount, MRR, close date, attribution columns. Zero UI |
| Activities / timeline | **have** | `crm_interactions`, 21 kinds, rendered in `ContactDrawer.tsx` |
| Tasks | **partial** | `crm_tasks` with `assigned_to`, `due_at`, `status`. Rendered inside the contact drawer only. No task list, no queue, no reminders |
| Notes | **have** | `crm_interactions` kind `note` |
| Email (one to one) | **have** | `contactEmail.ts` plus `crm.email.send`, gated to `head_of_growth` |
| Email engagement | **have** | `crm_record_email_engagement`, opens and clicks on the timeline, deduped by index |
| Calls / meetings | **partial** | kinds `call`, `meeting`, `demo` are valid values. No logging affordance in the UI |

### Pipeline and forecast

| Capability | State | Note |
|---|---|---|
| Board with stages | **partial** | `PipelineBoard.tsx` exists and works, but drags *contacts* through contact stages |
| Drag between stages | **have** | HTML5 drag and drop, `PipelineBoard.tsx:83-119`. Logs to `crm_stage_changes` |
| Deal amount | **partial** | `crm_deals.amount_cents`, `mrr_cents`, `currency`, `billing_period`. No writer |
| Close date | **partial** | `crm_deals.expected_close_on`. No writer |
| Probability | **none** | No column. Stage-weighted default is the right shape, not a typed field |
| Forecast | **none** | Nothing sums weighted pipeline |
| Column totals | **none** | Board shows counts, not value |

### Email and sequences

| Capability | State |
|---|---|
| One to one send with logging | **have** |
| Open and click tracking on the person | **have** |
| Reply capture | **none**. Inbound goes to a human inbox, nothing lands on the timeline |
| Templates and snippets | **partial**. `crm_email_templates` exists, owner-writable, partner read-only |
| Sequences (multi step, auto advance, stop on reply) | **none** |
| Broadcast drafting | **have**, draft only, enforced by RLS |
| Broadcast send | **have**, owner only, deliberate |

### Everything else

| Capability | State |
|---|---|
| Tasks and reminders | **partial**. Table yes, queue no, reminders no |
| Lists and saved segments | **none**. Client-side filters only |
| Lead scoring | **none** |
| Reporting: pipeline | **none** |
| Reporting: activity by rep | **none** |
| Reporting: sourced and closed by rep | **partial**. `growth_attributed_mrr` view exists, only surfaced on the earnings page |
| Reporting: commission owed and paid | **have** for the partner's own numbers (`earnings/page.tsx`). **none** for the owner across everybody |
| CSV import | **none** |
| CSV export | **partial**. `contactsToCsv` in `crm/lib.ts:220`, contacts only |
| Activity timeline | **have** |
| Ownership and assignment | **have** at the schema (`owner_user_id`, `sourced_by`, `closed_by`, all three separate and `sourced_by` write-once by trigger). Reassignment UI exists for contacts only |
| Duplicate detection | **partial**. Unique index on `lower(domain)` for accounts. Nothing for contacts |

### Growth partner specific

| Capability | State |
|---|---|
| Deal registrations | **have**. File, decide, both clocks resolved at filing |
| Auto-approval by silence | **broken**. Derived in the UI, never written to the row, so attribution rejects it |
| Attribution verdict | **built, never called**. `resolveAttribution` has zero callers |
| Commission ledger | **built, never runs**. `commission_recompute_for_collection` has zero callers |
| Revenue collections | **no producer**. Table exists, nothing writes to it |
| Commission statement | **have** as a page, will render empty forever until the above are wired |
| Payout marking | **partial**. `commission_payouts` table, no UI |
| Equity tranches | **have** for display |

**The one sentence summary:** the schema is roughly at parity and the interface is at about a third.
The two ends of the money chain (create a deal, receive a payment) both have no door.

---

## Build plan

Sized for four parallel builders. Each item names the files it owns so two agents never touch the
same file. Nothing here is a migration except where explicitly stated, and migrations are Connor's.

### P0 - Ava's day one

She cannot do her job without these. Target: the week before her first login.

**P0-1. Deals: table, drawer, and the won path** _(builder A, largest item)_

- `src/app/admin/dashboard/deals/page.tsx` - list, filterable by stage, owner, motion, close month
- `src/app/admin/dashboard/deals/DealDrawer.tsx` - create and edit: name, account, primary contact,
  amount, MRR, billing period, plan tier, seats, expected close date, stage, notes
- `src/app/admin/dashboard/deals/actions.ts` - `createDeal`, `updateDeal`, `setDealStage`,
  `markWon`, `markLost`. Every action re-checks `can(user, "crm.deals.manage")`; RLS is the second
  lock
- `markWon` must set `closed_at` and `closed_by` together, because
  `crm_deals_won_needs_close` (`20260817100000:359`) refuses the row otherwise. Surface that as a
  sentence, not a constraint error
- `sourced_by` is set once on create from the caller and never editable, matching the write-once
  trigger

**P0-2. Accounts** _(builder A, same domain, sequential with P0-1)_

- `src/app/admin/dashboard/accounts/page.tsx` and `AccountDrawer.tsx`
- Fields that matter: name, domain, industry, size band, `first_contact_at`, and the three exclusion
  flags `is_comped`, `is_company_managed`, `carve_out`
- `first_contact_at` must be settable, because the registration guard reads it
  (`registrations/actions.ts:104`) and nothing writes it today
- Contact drawer gains an account picker so contacts roll up

**P0-3. Wire attribution** _(builder B)_

- `src/lib/crm/attributionService.ts` - server-side: gather the evidence for a deal (redeemed promo
  code, UTM source, the registration on that account), call `resolveAttribution`, write
  `attribution_rule`, `attribution_ref`, `attribution_note`, `registration_id` onto the deal
- Called from `markWon` and from an explicit "Recheck attribution" button on the deal drawer
- Fix `attribution.ts:164` to read `registrationState().effective` rather than the stored status, so
  approval by silence pays
- Ownership maps (`promoCodeOwners`, `utmSourceOwners`) need a home. Cheapest correct version: a
  `growth_attribution_keys` table (owner-writable, one row per code or source per partner). This is
  a migration, so it is Connor's, and it blocks P0-3
- Surface the verdict and the full rejection list on the deal drawer. The rejections are the whole
  point: "why did this not pay" is the question that gets asked

#### P0-3 built — what builder A wires up

Everything above is on `crm/p0-attribution`. Three things for the deals surface:

**1. The stub.** In `src/app/admin/dashboard/deals/actions.ts`, replace the body of
`recheckDealAttribution` with a single line:

```ts
import { applyDealAttribution } from "@/lib/crm/attributionService";

export async function recheckDealAttribution(dealId: string) {
  return applyDealAttribution(dealId);
}
```

**2. `markWon` locks it.** Attribution has to be settled at the moment the deal is won, in the same
action, after the stage write:

```ts
await applyDealAttribution(dealId, { lock: true });
```

Locking is what stops a UTM edited next month from moving a commission already paid. A deal that is
already locked comes back `{ ok: true, locked: true, changed: false }` carrying the stored verdict —
the write is refused rather than silently skipped, so "recheck did nothing" and "recheck agreed" are
distinguishable. Unlocking is deliberately not offered: it is one UPDATE by an owner.

**The signature.** Never throws; everything a person should read comes back as `error`.

```ts
applyDealAttribution(dealId: string, options?: { lock?: boolean }): Promise<DealAttributionResult>
resolveDealAttribution(dealId: string): Promise<DealAttributionResult>  // reads, writes nothing

interface DealAttributionResult {
  ok: boolean;
  error?: string;        // a sentence, present only when ok is false
  verdict?: AttributionVerdict;
  locked?: boolean;
  changed?: boolean;
  warnings?: string[];   // things a person must settle, not things the rules decided
}
```

Both check `crm.deals.manage` themselves. A server action is a public endpoint and does not inherit
the page's guard, so do not rely on the drawer having checked.

**3. The panel.** `src/components/crm/AttributionVerdict.tsx` — presentational, no server imports,
safe in a client component. Pass the recheck button in as `action`:

```tsx
<AttributionVerdict verdict={result.verdict ?? null} locked={result.locked} warnings={result.warnings} action={<RecheckButton />} />
```

**What P0-3 also changed, worth knowing about:**

- `applyDealAttribution` fills `sourced_by` when a rule resolves to somebody and the column is empty.
  This matters more than it looks: the commission ledger pays `crm_deals.sourced_by` and reads
  `attribution_rule` only to decide *whether* a deal pays at all. When the two disagree and
  `sourced_by` is already set, it is left alone (write-once trigger) and a warning is returned for a
  person to settle.
- `declineDeadlineFrom` and `registrationExpiryFrom` now count in UTC. They counted in local time,
  which returned a different deadline depending on the machine that resolved it.
- `registrationState` treats a stored `expired` as terminal, and `resolveAttribution` treats
  `converted` as approved — converting is downstream of approval, so it was never a rejection.
- Migration `20260817150000_growth_attribution_keys.sql` adds the ownership table plus three
  SECURITY DEFINER functions: `growth_attribution_owners` (resolves keys already in evidence, so a
  partner who cannot read a rival's key does not get told it "belongs to nobody"),
  `crm_live_registration_for_account` (same problem, registrations), and
  `commission_recompute_as_owner`.
- `npm test` runs `tests/attribution.test.mts` on Node's own runner. No framework was added.

**Still open — the Stripe sync.** Nothing writes `crm_deals.promo_code`, `utm_source` or
`external_customer_ref` automatically, and nothing writes `revenue_collections` at all. Checkout is
in the product's Supabase project; the two projects speak only through the promo admin proxy, which
reports campaigns and codes and no redemptions. So rule one currently fires on a column a person
filled in. `src/lib/growth/collectionsService.ts` gives the ledger one manual producer —
`recordCollection`, owner-only, inserts a `source: 'manual'` collection against a won deal and calls
the recompute — which is enough to exercise the arithmetic against a real deal before anybody is
owed money by it. It is not the sync, and it is not a substitute for one.

**P0-4. Deal pipeline board** _(builder C)_

- `src/app/admin/dashboard/deals/DealBoard.tsx`, modelled on `PipelineBoard.tsx` but over
  `crm_deals`
- Five columns: opportunity, proposal, negotiation, won, lost
- Card shows deal name, account, amount, expected close date, owner initial
- Column header shows count and summed value
- Drag writes the stage. Dragging to `won` opens the close dialog rather than writing directly,
  because `closed_by` and `closed_at` are required
- The contact board stays. Two boards, two objects, one nav section

**P0-5. Task queue** _(builder C)_

- `src/app/admin/dashboard/tasks/page.tsx` - overdue, today, this week, later, done
- Complete and snooze inline
- "Log a call" and "Log a meeting" quick actions writing `crm_interactions` kinds `call` and
  `meeting`, which are already valid
- Task counter badge in the nav

**P0-6. Close the five audit blockers** _(builder D)_

Items 1 to 5 from `docs/reviews/2026-08-17-crm-branch-audit.md`. Webhook signature, two open API
routes, the migration guard, the policy audit query. This is a security fix batch, not a feature,
and it gates the account creation rather than the merge.

**P0-7. UI refinement pass** _(builder D, after P0-6)_

Spec below. Touches only presentation files, so it can run last without conflicting.

### P1 - first 30 days

**P1-1. Owner reporting** - `src/app/admin/dashboard/reports/page.tsx`
- Pipeline by stage, count and value
- Weighted forecast for the current and next quarter
- Sourced and closed by rep, from `growth_attributed_mrr` plus a deals-by-`closed_by` rollup
- Activity by rep: interactions per week, by kind
- Commission owed and paid across everybody, from `commission_statement` read as an owner

**P1-2. Owner commission console** - `src/app/admin/dashboard/revenue/page.tsx`
- The page `AdminShell.tsx:94` already links to and which 404s today
- Collections list, unlinked collections queue (the index at `20260817110000:122` exists for exactly
  this), link a collection to a deal
- Payout runs: create a month, attach entries, approve, mark paid with a reference
- A "recompute" button that calls `commission_recompute_for_collection` through a service-role route

**P1-3. Stripe mirror**, the largest open gap. See `docs/plans/ava-access-and-commission.md`.

**P1-4. Saved views and segments**
- `crm_saved_views` (migration, Connor's) storing a filter set per user
- Applies to contacts, deals and tasks

**P1-5. Simple lead scoring**
- Derived, not stored, so nobody argues with it. Points for: has an account with a domain, stage
  reached, opened or clicked in the last 14 days, meeting logged, seniority keyword in job title
- One `src/lib/crm/leadScore.ts` pure function, rendered as a 0 to 100 bar on the contact card
- Explicitly not a model. A visible arithmetic rule Ava can predict is worth more than a good one
  she cannot

**P1-6. Import and export**
- CSV import for contacts and accounts with column mapping, dedupe on email and on `lower(domain)`,
  and a dry-run preview count before writing
- Export extended to deals, accounts and activities

**P1-7. Duplicate detection for contacts** - warn on matching email or on same name plus same
account at create time

### P2 - later

- Sequences: multi-step one-to-one email with stop-on-reply. Needs inbound reply capture first, so
  it is genuinely blocked rather than merely deprioritised
- Inbound reply capture into the timeline
- Calendar and meeting booking link
- Call logging with a dialer. Almost certainly never worth it at this size
- Territory and round-robin assignment. Meaningless with two people
- Custom properties and custom objects. The moment this is needed, the schema is wrong somewhere else
- Quotes and e-signature. Lives in abram-network, not here

---

## UI refinement spec for the CRM screens

Applies to everything under `src/app/admin/dashboard/{crm,deals,accounts,tasks,registrations,earnings,reports,revenue}`.

### Palette

- Ground is black and near-black. Surfaces are `bg-white/[0.02]` on `border-white/5`. Text is
  `text-white`, `text-zinc-400`, `text-zinc-500`, in that order of importance
- Accent is purple or abram-info, used sparingly, for the single most important interactive element
  on a screen and for nothing else
- **No red anywhere.** No rose, no red borders, no red glows, no destructive-looking states. An error
  is a neutral panel with a sentence in it. Replace `RegistrationForm.tsx:114`
- Amber is permitted for one thing only: a state that will cost money if ignored, such as the "no
  terms recorded" panel. Not for validation, not for warnings in general
- Emerald is permitted for one thing only: a completed or reached state, such as a crossed equity
  threshold. Not for success toasts

### Type

- Titles use Archivo, `font-bold tracking-tight`, `text-2xl sm:text-3xl` at page level
- **Labels are one recipe, everywhere:** `text-xs uppercase font-bold tracking-widest text-gray-400`.
  Promote the `Overline` component out of `earnings/page.tsx` into
  `src/components/admin/Overline.tsx` and use it for every section heading, every stat label and
  every form label. Three recipes exist today; there is one from now on
- Body is `text-sm text-zinc-400 leading-relaxed`
- **Buttons never `font-bold`.** Cap at `font-medium`, or `font-semibold` where the existing console
  already uses it. Fix `AdminShell.tsx:258`
- No subtitles under titles. If the title needs explaining, the title is wrong
- No eyebrow or kicker text above a heading. The `Overline` is a section label, not a kicker: it
  names the section, it does not tease it

### Structure

- **No coloured bars on card edges.** No left borders, no top accent strips, no status stripes
- Cards are `rounded-2xl border border-white/5 bg-white/[0.02]`. One radius, one border, one fill
- One toolbar row is one control height. `h-9` throughout, pick the slimmer when two disagree
- Empty states are dashed-border panels with one sentence saying what would appear here and one
  action. Never a bare zero. `earnings/page.tsx:163-173` is the model
- Loading never blanks the page. Skeletons shaped like the content they replace
- Stat rows use one component across every screen: label in `Overline` style, value at `text-lg` or
  larger, optional hint below in `text-[11px] text-zinc-500`. `StatTile` in `earnings/page.tsx` is
  already close; extract it

### Copy

- Say what it is. "What you have earned", not "Earnings dashboard"
- **No em dashes.** Two sentences, or a comma, or a colon. Fix `earnings/page.tsx:247`
- No "not X but Y" constructions. No "one X, one Y" chains
- No hype adjectives. No exclamation marks
- Error messages name the thing that went wrong and the next action. "Somebody registered this
  account a moment ago." is the standard to hold

### New shared components to create

- `src/components/admin/Overline.tsx` - the one label
- `src/components/admin/StatTile.tsx` - extracted from earnings
- `src/components/admin/Panel.tsx` - the four semantic panel treatments (neutral, attention,
  reached, empty). Replaces every inline amber, emerald and rose recipe
- `src/components/admin/Money.tsx` - cents to display string, one place, so no screen divides by 100
  on its own
