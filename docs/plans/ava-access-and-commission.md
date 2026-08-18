# Ava's account, her access, and how she gets paid

Operational spec. What to create, what she can and cannot do, how the number on her statement is
produced, and the one part of it that does not work yet.

Reference: `.agents/growth-crm.md`, `src/lib/auth/permissions.ts`,
`supabase/migrations/20260817110000_growth_commission_ledger.sql`.

---

## 1. What her account should be

| Field | Value | Why |
|---|---|---|
| `role` | `growth` | The only role the commission ledger will pay. `commission_recompute_for_collection:359` refuses a payee whose role is anything else |
| `growth_stage` | `head_of_growth` | She is being hired as Head of Growth, not trialled as an advisor. `advisor` would show her only her own accounts, which makes her unable to see what she is inheriting |
| `is_active` | `true` | |
| `member_id` | set once her `team_members` row exists | Links the login to the public byline. Nullable, so it can wait |
| `email` | her work address | This is what appears on the invite and on every statement |
| `full_name` | Ava's full name | |
| `invited_at` | stamped by `inviteTeammate` | |

`head_of_growth` rather than `advisor` is the one real decision here. Under
`GROWTH_STAGE_PERMISSIONS` (`permissions.ts:225-229`) it is the difference between three things:
seeing the whole pipeline instead of only her own rows, being able to send a one-to-one email at
all, and `analytics.write`. All three are things a Head of Growth needs on day one.

The advisor stage exists for someone being evaluated. That is not the arrangement being proposed.

---

## 2. Permission by permission

Held. Everything on this list is granted by role `growth` plus stage `head_of_growth`.

| Permission | Source | What it means in practice |
|---|---|---|
| `console.admin` | role | Reaches `/admin/dashboard`. Navigation is filtered to what follows |
| `crm.contacts.read.own` | role | |
| `crm.contacts.read.all` | stage | Sees the whole contact pipeline |
| `crm.contacts.write.own` | role | Edits contacts where she is `owner_user_id` or `sourced_by`. RLS enforces it, not the UI |
| `crm.accounts.manage` | role | Creates and reads accounts. Edits only her own |
| `crm.deals.manage` | role | Creates deals. Edits her own. Can set `closed_by` and `attribution_rule` on them |
| `crm.events.manage` | role | Conference events, capture codes, scans |
| `crm.registrations.file` | role | Files a claim on a named account |
| `crm.email.send` | stage | One to one email from a contact record, through `sendContactEmail` |
| `broadcasts.draft` | role | Writes a campaign. RLS pins it to `status = 'draft'` |
| `subscribers.read` | role | Reads the list. Enough to size a segment |
| `content.docs`, `content.blog` | role | Full write on help docs and blog posts |
| `social.manage` | role | Social Studio |
| `campaigns.manage` | role | Campaign landing pages |
| `links.manage` | role | Link Hub and tracked links |
| `promotions.manage` | role | Promo codes, via the abram-network proxy |
| `analytics.read` | role | Landing visits, events, SEO snapshots |
| `analytics.write` | stage | Currently has no matching RLS policy. Inert. Flagged in the audit |
| `commission.read.own` | role | Her own earnings page and nobody else's |

Withheld, deliberately.

| Permission | Effect |
|---|---|
| `roles.manage` | Cannot create logins, change roles, or deactivate anyone. `/admin/dashboard/people` is not drawn and the URL redirects |
| `commission.manage` | Cannot see collections, create payouts, mark anything paid, or set her own rates |
| `broadcasts.send` | Can write a broadcast. Cannot send one. Refused by the `WITH CHECK` on `campaigns`, not by a hidden button |
| `crm.registrations.decide` | Files a claim, never decides one. `crm_deal_registrations` UPDATE is `is_owner_or_admin()` |
| `crm.contacts.delete` | Archives, never deletes. The archive flag is reversible; a DELETE is not |
| `content.changelog` | Release notes are a product claim |
| `content.team` | The team record is an identity record |

Also unreachable, at the database rather than by permission:

- `revenue_collections` - no policy for a growth member at all. This is the raw payment mirror
- `growth_partner_terms` - reads her own row, cannot write it
- `commission_entries` and `commission_payouts` - reads her own, writes nothing
- `admin_users` - reads the team (so a pipeline shows names not UUIDs), writes only her own row, and
  the trigger at `20260817090000:275` refuses any change to `role`, `growth_stage` or `is_active`
- `subscribers` - read only. She can see the list. She cannot change anybody's consent state
- Anything in abram-network. This repo holds no credentials for the platform admin, the product
  database, or Stripe. That is a boundary of architecture, not of policy

Three fixes from the audit must land before this table is true in production. Until they do, an
authenticated identity can write blog posts (`/api/admin/posts`), create promo codes
(`/api/admin/promotions`) and forge email engagement (`/api/webhooks/resend`) regardless of role.

---

## 3. How commission is computed

### The rule

Six statements, in the order the recompute function evaluates them.

1. **Paid on cash collected, not on bookings.** A deal that closed at $30,000 and has collected
   $2,400 pays on $2,400.
2. **The unit is a collection, not a deal.** One payment, one ledger entry.
3. **The payee is always the deal's sourcer.** Both rates in the agreement are defined in terms of
   origination. The only question the rate answers is whether the sourcer also closed it. Closing
   somebody else's account is not a paid event. This is counterintuitive and it is written into the
   migration header at `20260817110000:27-43` because a reasonable engineer will try to "fix" it,
   and that fix pays out roughly a third more than the document promises.
4. **Basis is gross less discount.** Processor fees are not deducted. The agreement says net of
   discount and says nothing about fees.
5. **Rates are snapshotted.** Every entry stores `rate_applied` and points at the `terms_id` it came
   from, so a promotion in November does not restate what was paid in August.
6. **Entries are immutable once paid.** A clawback is a new negative row carrying
   `reverses_entry_id`, never an edit. Enforced by trigger at `20260817110000:242-262`.

### Exclusions, checked before anything is computed

An account marked `is_comped`, `is_company_managed`, or carrying a `carve_out`. A deal whose
`attribution_rule` is `unattributed`. A deal not at stage `won`. A collection outside the twelve
month tail measured from the customer's first ever payment. A payee with no open terms row.

Each of those does not merely stop accrual, it **voids what is already there**. An account marked
comped today stops paying retroactively for anything not yet paid out.

### Proposed default rates

Placeholders until the agreement is signed. These are the numbers to seed
`growth_partner_terms` with:

| Field | Proposed | Note |
|---|---|---|
| `close_rate` | `0.2000` | She sourced it and ran it to checkout |
| `source_rate` | `0.1000` | She sourced it, Connor closed it |
| `tail_months` | `12` | Schema default. Collections stop paying twelve months after the customer's first payment |
| `clawback_days` | `90` | Schema default. A refund or chargeback inside this window reverses the accrual |
| `effective_from` | her start date | |

Rates are stored as fractions, not percents. `0.2000` is twenty percent. The people screen takes
percents and divides (`people/actions.ts:157-158`), so type `20` there.

---

## 4. Worked example

Ava starts 1 September. Terms: close 20 percent, source 10 percent, twelve month tail, ninety day
clawback.

### Deal A: she sourced it and she closed it

Northfield University, EDU program licence. 40 students at $400 per student per year, one annual
invoice, 10 percent first-year introductory discount.

- `crm_accounts` row: Northfield University, domain `northfield.edu`, no carve-out, not comped
- `crm_deals` row: `sourced_by` = Ava, `closed_by` = Ava, `stage` = `won`,
  `amount_cents` = 1,600,000, `attribution_rule` = `promo_code`, `attribution_ref` = `ava-edu`
- Stripe collects on 14 October. The mirror writes a `revenue_collections` row:

| Field | Value |
|---|---|
| `gross_cents` | 1,600,000 ($16,000) |
| `discount_cents` | 160,000 ($1,600) |
| `fee_cents` | 47,000 ($470, recorded and **not** deducted) |
| `net_cents` | 1,440,000 ($14,400) |
| `collection_month` | 2026-10-01 |
| `is_first_payment` | true |
| `status` | collected |

Recompute:

- basis = `net_cents` - `refunded_cents` = 1,440,000
- she sourced and closed, so `credit_type` = `closed`, rate = 0.2000
- amount = ROUND(1,440,000 x 0.2000) = **288,000 cents, $2,880**

### Deal B: she sourced it, Connor closed it

Helix Post, Studio plan, $800 per month, annual prepay at $8,640 after the annual discount.

- `sourced_by` = Ava, `closed_by` = Connor, `stage` = `won`, `attribution_rule` = `utm_link`
- Stripe collects $8,640 on 22 October, no discount at checkout, so `net_cents` = 864,000

Recompute:

- `closed_by` is not the payee, so `credit_type` = `sourced`, rate = 0.1000
- amount = ROUND(864,000 x 0.1000) = **86,400 cents, $864**

Note what did not happen: Connor was not paid the close rate. The payee is the sourcer either way.

### Deal C: a small one that goes bad

Redwood Media, Solo Pro, $1,200 collected 3 October. She sourced and closed it.

- basis 120,000, rate 0.2000, amount **24,000 cents, $240**, status `accrued`

On 20 November the customer charges back. The mirror updates the collection to
`status = 'charged_back'`, `refunded_cents` = 120,000, and re-runs the recompute.

- `status <> 'collected'`, so basis = 0
- basis 0, so the function calls `__commission_void_live` and returns 0

Because the October payout was already approved and marked paid on 15 November, that entry is
`status = 'paid'` and `__commission_void_live` only touches `accrued` and `payable`
(`20260817110000:296-303`). The paid entry survives, correctly, because a paid figure must never
change underneath her. **A reversing entry of -24,000 cents against the December statement has to be
written by hand, and nothing in the system does that today.** See section 7.

### October statement

| Line | Basis | Rate | Amount |
|---|---|---|---|
| Northfield University, closed | $14,400 | 20% | $2,880 |
| Helix Post, sourced | $8,640 | 10% | $864 |
| Redwood Media, closed | $1,200 | 20% | $240 |
| **October total** | | | **$3,984** |

`due_at` on the October payout is 30 November: close of the collection month plus thirty days.

### November statement, after the chargeback

| Line | Amount |
|---|---|
| (November collections) | ... |
| Redwood Media clawback, reverses the October entry | **-$240** |

The statement is a plain `SUM` because amounts are signed. No separate reversals query.

---

## 5. How income and commission are reported

**Her view: `/admin/dashboard/earnings`.** Built, works, will show zeros until section 7 is done.
Four stat tiles (lifetime, paid, outstanding, paying deals), attributed MRR with the equity tranches
it unlocks, a month-by-month statement, and the individual entries with the rate that applied.
Scoped by RLS to her own rows, so an owner opening the same page sees their own numbers, not hers.

**Connor's view: `/admin/dashboard/revenue`.** Does not exist. The nav links to it
(`AdminShell.tsx:94`) and it 404s. It needs to carry:

- Collections, with the unlinked ones surfaced first. The partial index at `20260817110000:122`
  exists for that queue
- Link a collection to a deal, then recompute
- Payout runs: create the month, attach entries, approve, mark paid with a payment reference
- Everyone's statement side by side, plus commission owed against cash collected

**Payout marking.** `commission_payouts` moves `draft` to `approved` to `paid`. `paid_at` and
`payment_ref` are what make a payment provable. Marking a payout paid should also flip its entries
to `status = 'paid'`, which is what makes them immutable. Nothing does that today either.

---

## 6. The Stripe boundary

The line is drawn in the agreement and it is drawn correctly in the schema.

- Money truth lives in abram-network's Stripe. Always. Nothing in the DOCS database is authoritative
  about a payment
- `revenue_collections` is a **mirror**, and it says so: `source`, `raw` and `synced_at` exist so a
  reconciliation run can tell a sync bug from a genuine refund. A row here that disagrees with
  Stripe is wrong by definition
- Ava has no policy on `revenue_collections` at all. Not read, not write. She sees derived
  commission, never a customer's payment instrument or invoice reference
- DOCS holds no Stripe credentials and should never hold any

---

## 7. The largest open gap

**Nothing writes `revenue_collections`, and therefore nothing on the earnings page will ever be
non-zero.**

This is not a bug in the branch. It is a cross-repo integration that does not exist. It is also the
single thing that determines whether the commission system is real or decorative, so it should be
scoped now.

An empty earnings page is indistinguishable from an unpaid one. That is the failure mode: Ava closes
three deals, opens her statement, sees $0, and has no way to tell whether the system is broken or she
is owed nothing. Until the sync exists, the earnings page should say so explicitly.

### What the sync has to do

Direction is one way: abram-network to DOCS. Never the reverse.

1. **Producer, in abram-network.** A Stripe webhook handler on `invoice.paid`,
   `charge.refunded`, `charge.dispute.created` and `customer.subscription.deleted`. That repo
   already has Stripe webhook infrastructure.
2. **Transport.** A signed POST to a new DOCS route, `/api/sync/collections`, authenticated with a
   shared secret held in both projects' environment. Not a database-to-database link, and not the
   DOCS service-role key placed into abram-network, which would be a second long-lived cross-tenant
   credential to hold.
3. **Consumer, in DOCS.** Upsert into `revenue_collections` on `external_payment_ref`, which is
   `UNIQUE` precisely so the sync can be re-run any number of times without doubling anybody's pay.
   Then call `commission_recompute_for_collection` for that row.
4. **Linking.** A collection arrives with a Stripe customer id and no deal. Match it to
   `crm_deals.external_customer_ref`. When that is null, leave `deal_id` null and let it sit in the
   unlinked queue for a human. Do not guess.
5. **`is_first_payment`** is stamped once at sync time, because the twelve month tail runs from it.
6. **Reconciliation.** A weekly job that re-pulls the month from Stripe and compares totals. The
   mirror is only trustworthy if something checks it.

### The two smaller gaps in the same chain

- **Attribution is never written.** `resolveAttribution` has zero callers, so every deal stays
  `unattributed`, which is an exclusion. Even a perfect sync pays nothing until this is wired. See
  P0-3 in `docs/plans/crm-hubspot-parity.md`
- **Clawbacks on already-paid entries have no writer.** The recompute correctly refuses to touch a
  paid entry. Nothing creates the compensating negative row. Needs a
  `commission_post_reversal(entry_id, reason)` function, service role only

### Interim, before any of that exists

Set `source = 'manual'` on hand-entered collections and enter them monthly from the Stripe dashboard.
It is a spreadsheet with better guardrails, and it is honest: `source` distinguishes it from a synced
row, so nothing pretends the sync is running. Say plainly on the earnings page that collections are
entered by hand and the last entry date.

---

## 8. Onboarding checklist

**Before her first login**

- [ ] Ship the five blocking fixes from `docs/reviews/2026-08-17-crm-branch-audit.md`. Webhook
      signature, `/api/admin/posts`, `/api/admin/promotions`, the migration guard, the policy audit
- [ ] Run `SELECT id, email, created_at FROM auth.users` on the DOCS project and confirm every row
      should be an owner. Migration `20260817090000` backfills all of them as owner
- [ ] Deploy the six migrations
- [ ] Run the post-deploy policy audit query and confirm no `USING (true)` policy survives
- [ ] Confirm the terms of the agreement, specifically both rates

**Creating the account**

- [ ] Sign in as owner, go to `/admin/dashboard/people`
- [ ] Invite: her work email, full name, role `growth`, stage `head_of_growth`.
      `inviteTeammate` creates the `auth.users` row and the `admin_users` row in one call, so there
      is never a window where she has a login and no role
- [ ] Immediately set her terms on the same screen: stage `head_of_growth`, close rate, source rate,
      tail 12, clawback 90, effective from her start date. **No terms row means no commission,
      silently.** The recompute returns 0 and writes nothing. Only the earnings page mentions it
- [ ] Create her `team_members` row and link `member_id`, if she is going on the public site
- [ ] Add her `growth_attribution_keys` entries once that table exists: her promo code and her UTM
      source. Until then, attribution rules 1 and 2 cannot fire for her

**Her first login**

- [ ] She receives the Supabase invite email and lands on `/admin/set-password`
- [ ] Sets a password, is redirected by `landingPathFor` to `/admin/dashboard`
- [ ] Confirm the navigation shows: Overview, Docs, Blog, Social Studio, Contacts, Registrations,
      Campaign Pages, Link Hub, Promotions, Subscribers, Email Broadcasts, Your Earnings
- [ ] Confirm it does **not** show: Release Notes, Team, People and Access, Revenue and Commission
- [ ] Confirm `/admin/dashboard/people` typed directly redirects her away
- [ ] Confirm her earnings page renders and shows the terms you just set

**Seeding her pipeline**

- [ ] Reassign the existing contacts she should own: set `owner_user_id`. Leave `sourced_by` alone,
      it is write-once by trigger and it is Connor's on every existing row, correctly
- [ ] Create `crm_accounts` rows for the ten or so companies already in conversation, with
      `first_contact_at` set. This matters: an account with a `first_contact_at` cannot be registered
      by anybody, which is what protects Connor's existing relationships
- [ ] Walk her through filing one registration end to end, so she has seen both clocks
- [ ] Tell her the five business day decline window approves by silence. It should never be a
      surprise, and today nothing notifies anybody that a registration was filed
