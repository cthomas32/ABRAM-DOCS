# Roles, attribution and commission

Who can get into the console, what they see when they do, and how a closed deal turns into a figure somebody is owed. This file covers the decisions behind all three and the places they will bite you.

`conference-crm.md` covers how a person gets *into* the CRM. This covers what happens to them afterwards, and who gets paid for it.

## The one idea

**Access is a database fact, not an interface one.** Every rule below is enforced by row level security in Postgres, and the interface is a second, redundant copy that exists so a refused page reads as a closed door rather than as a broken product. A signed-in browser can query any table this database will answer for, whatever the navigation happens to show it.

That redundancy is deliberate and it has to be maintained in both directions. A permission added to `src/lib/auth/permissions.ts` with no policy behind it is a promise the database will not keep. A policy tightened without the catalog following is a visible link that leads to an empty table.

## What changed, and why it had to

Before 20260817, every policy in this database read:

```sql
FOR ALL TO authenticated USING (true) WITH CHECK (true)
```

That is not an access rule, it is the absence of one. It was correct while exactly one person had a login. It stopped being correct the moment a second did — and the second person arrives with a written agreement listing, surface by surface, what they may and may not reach.

Note what that means even for surfaces nobody is arguing about: before this, a login created for somebody to write blog posts also handed them the subscriber list and the broadcast sender.

## Roles

One row per person in `admin_users`. An `auth.users` row with **no** row there is authenticated and unauthorized: it can hold a session and read nothing. That is the right outcome for an account created by mistake, and it means a failed lookup is refusal rather than escalation.

| Role | What it carries |
|---|---|
| `owner` | Everything, including handing out roles. |
| `admin` | Everything except roles. |
| `growth` | Acquisition, end to end. See the grant table below. |
| `contributor` | Docs, blog, release notes. Nothing about people or money. |
| `viewer` | Reads the pipeline, changes nothing. |

`growth_stage` modifies the growth role rather than multiplying it into three more roles, because advancing somebody changes what they *see*, not what they can *do*:

- **`advisor`** — only the accounts assigned to them, read and write.
- **`head_of_growth`** — the whole pipeline, edits their own, may send one-to-one email.
- **`employee`** — post-conversion. Full pipeline and the mailing list.

The distinction lives in exactly one function, `public.growth_sees_all_contacts()`, so advancing somebody is one column change rather than an audit.

### Guards you cannot route around

- **Self-promotion is refused by trigger**, not by policy. RLS has no column-level grants, so the policy that lets somebody set their own display name would also let them set `role = 'owner'`. The trigger closes that and lets the service role through, which keeps the recovery path open.
- **The last active owner cannot be demoted or deactivated.** Without it, one careless click leaves a console nobody can administer.
- **Every existing auth user was backfilled as `owner`.** That is not a promotion, it describes what they already had. Anything narrower would have revoked access as a side effect of tightening it — exactly the failure the migration exists to prevent.

### Adding a table

Add it to a group in `20260817120000_role_aware_rls.sql`. A table with RLS on and no policy is unreadable by the console, which is a loud failure and the correct direction to fail in.

**The sweep only drops policies whose role list is exactly `{authenticated}`.** Public policies were written `TO public` or with no `TO` clause, so anonymous reads — published posts, active contact cards, the link hub, the newsletter signup insert — survive untouched. Do not "simplify" this into dropping every policy on the table; the failure mode is a marketing site that 404s its own content, and it will not be noticed for a day.

## One console, not two

The partnership terms say **Admin console — Never**. That was first read as meaning *this* console, and a second shell was built at `/growth` so a partner never saw admin chrome.

**That reading was wrong, and the correction is worth keeping written down.** It means the platform super-admin in `abram-network` — other people's organisations, plan tiers, entitlements, `is_platform_admin` — which is a different system that this repository holds no credentials for and cannot reach from any page. The marketing console here was never what that line was about.

So there is one console. `/admin/dashboard/*` requires `console.admin`, which every working role holds, and what differs is the navigation and the data:

- **The navigation** is filtered from the permissions the person holds, so a link that would be refused is never drawn.
- **The data** is decided independently by row level security, so the same CRM screen shows an advisor their own accounts and a Head of Growth the whole board.

`/growth` is gone. Do not recreate it. Two shells meant to show the same board are two shells that stop showing the same board, usually in the month somebody is relying on one of them.

## What a growth partner actually gets

| Surface | Grant |
|---|---|
| Contacts, accounts, deals, events | Full, scoped by stage |
| Registrations | File, never decide |
| Campaign pages, tracked links, promo codes | Full |
| Social Studio | Full |
| Blog, help docs | Full — content is an acquisition channel |
| Subscribers | **Read only.** Enough to size a segment, not enough to move anybody's consent |
| Email broadcasts | **Draft only.** See below |
| Their own commission statement | Read |
| Release notes, team record, roles, commission management | **None** |

### "Draft only" is a state machine, not a permission

A partner may create and edit a campaign **while it is a draft**. The `UPDATE` policy's `USING` clause limits which rows they may touch (drafts), and the `WITH CHECK` clause limits what those rows may become (still drafts). Both halves are needed — `USING` alone would let a draft be updated straight to `sending`.

The consequence is that the irreversible act is refused by Postgres rather than hidden by the interface. The guard in `approveAndSendCampaignAction` produces a readable sentence instead of a policy violation; it is **not** what stops the send. Verified: a growth session moving a draft to `sending` gets `new row violates row-level security policy`.

A sent campaign becomes read-only history for them at the same moment, which also means they cannot rewrite the subject line of something already in people's inboxes.

### A partner may only create a row they could then edit

`crm_contacts`, `crm_accounts` and `crm_deals` each carry an `INSERT` policy whose `WITH CHECK` is a copy of the same table's `UPDATE` policy: owner and admin, or a growth member who is the row's `owner_user_id` or `sourced_by`. They are the same text on purpose. Two clauses that have to agree should be one string a reader can compare by eye, so changing one is visibly changing both.

They did not always agree. Until `20260818170000_growth_insert_ownership.sql` the `INSERT` check was `is_owner_or_admin() OR is_growth_member()`, which never looks at the row and is therefore the same as no check. The damage was not a partner writing somebody else's data. It was a partner writing a row that belonged to nobody they are: on contacts and deals, where `SELECT` is keyed on ownership, an advisor could create a record and then not find it, so the next thing they did was type it in again. On accounts, where read is open to every partner, the row was visible and uneditable by the person who had just made it.

**`growth_sees_all_contacts()` is deliberately absent from all three checks**, for the reason it is absent from `UPDATE`: seeing the whole board is context, and creating a record assigned to another partner is a write. A Head of Growth making work for somebody else does it as themselves and hands it over, which leaves a trail.

This only holds while every session-scoped insert stamps ownership from the session, which `createDeal`, `createAccount` and `syncFeedPerson`'s two console feeds all do. The paths that pass no owner (`/api/crm/capture`, `/api/newsletter/subscribe`, the collections sync) hold the service role and are not subject to these policies. If you add a fourth feed, stamp the owner or give it the service role, and be able to say which.

## Attribution

Three rules, and one instruction about how to apply them:

1. A promo code redeemed at checkout
2. A tracked link recorded at signup
3. A named account registered in writing before first contact, closed within 120 days

> First match governs. No discretionary override.

**That last line is why attribution is a derived function and not a dropdown.** A dropdown is a discretionary override wearing a different hat: the moment attribution is a field somebody types, the rule is whatever they typed, and the first disagreement about a commission figure becomes an argument about memory instead of a lookup.

So `resolveAttribution` in `src/lib/crm/attribution.ts` takes the evidence and returns a verdict, and the only thing a person can change is the underlying facts — link a code, correct a UTM, approve a registration — each of which is itself recorded. It collects **every rejection** rather than discarding them, because "why did this not pay" gets asked far more often than "why did this pay", and an answer listing what was tested settles it in one screen.

`attribution_locked_at` is the point after which the ledger reads the stored rule rather than re-deriving it, so a UTM column edited later cannot silently move money.

### Registrations

The only one of the three rules involving a human decision, which is why it is the only one with a table. Two clocks run from a filing and they fail in opposite directions:

- **5 business days** — the company's window to decline, because the account is already in progress.
- **120 days** — the partner's deadline to close it.

Both are **resolved to real timestamps when filed**, never computed on read. "Five business days from now" is a different instant depending on when you ask, and a deadline that moves is not a deadline.

**Letting the five-day window lapse approves the claim.** `registrationState()` returns `autoApproved: true` for that case and the interface says "(by default)". That is a silent outcome by design, so it has to be visible *before* it happens rather than explained afterwards.

Business days count weekends only. Public holidays are not modelled — that would need a calendar per country and would still be wrong for somebody. Erring toward a shorter window favours the partner, which is the right direction for an ambiguity in the company's own agreement.

## Commission

Paid on **net cash collected**, not bookings, not pipeline, not signups. Every design choice follows from that sentence.

- **A collection is the unit, not a deal.** A deal that closed for $30,000 and collected $2,400 pays on $2,400.
- **Nothing here is authoritative about money.** `revenue_collections` mirrors the payment processor, which lives in `abram-network` and not this database. A row here that disagrees with Stripe is wrong by definition.
- **Processor fees are deliberately not deducted.** The agreement says net of *discount* and says nothing about fees. Quietly netting them off shaves a few percent off every payment.
- **Entries are immutable once paid.** A clawback is a new negative row carrying `reverses_entry_id`, never an edit. A ledger you can edit is not a ledger, and the first time a paid figure changes underneath somebody is the last time they trust it. Amounts are signed, so a statement is a plain `SUM` rather than a sum minus a reversals query somebody eventually forgets to write.

### The rule a future reader will try to "fix"

**The payee is always the deal's sourcer.** Both rates in the agreement are defined in terms of origination:

> **Closed** — she sourced the account and ran it to completed checkout
> **Sourced** — she originated it, Connor closed it

Both require that she sourced it. So the only question the rate answers is whether that same person *also* closed it. Closing an account somebody else originated is not a paid event under this agreement.

A reasonable engineer would write it the other way round — pay the closer the close rate, pay the sourcer the source rate, split one deal across two people. **That reading pays out roughly a third more than the document promises.** It is written into the header of `20260817110000_growth_commission_ledger.sql` for that reason. If you change it, change it because the agreement changed.

### Rates are a history, not a value

`growth_partner_terms` holds one row per stage per person with the window it applied to. A rate stored only on the person answers "what do they earn now" and gets the wrong answer for every month already paid, because the row it reads was overwritten by the promotion. Every commission entry snapshots `rate_applied` and points at the `terms_id` it came from.

A unique index enforces one open-ended row per person. `setPartnerTerms` closes the current row the **day before** the new one starts — terms are inclusive at both ends, so an end equal to the new start double-counts that day.

### Recompute

`commission_recompute_for_collection(uuid)` is the whole agreement in one function, evaluated in the order it is written. Safe to run over any collection at any time.

Two properties make that true, and both are load-bearing:

- **Every conclusion of "there should be nothing here" voids what is already there.** An account marked comped today must stop paying, not merely stop accruing more.
- **An identical result is a no-op.** Without that it is still correct but not quiet: a nightly run would void and rewrite every entry every night, and a year later each collection carries three hundred dead rows and the audit trail is unreadable.

Service role only. A partner running it against their own accounts would be marking their own homework.

## Where the line is drawn on money

The agreement says **Stripe — Never** and **Customer payment data — Never**. That resolves as:

- `revenue_collections` — owner and admin only. It is the raw payment mirror: every customer, every invoice reference, every refund. A partner has no policy on it at all.
- `commission_entries` — a partner reads their own. That *does* reveal what their own accounts paid, and that is deliberate: they can already derive it from their commission and their known rate, so hiding it would be theatre rather than privacy. What stays invisible is anybody else's accounts and every payment instrument.
- Writes are closed to everybody. Entries come from the recompute function running as the service role.

## Things that will bite you

- **Collections do not sync yet.** `abram-network` holds Stripe; this repo has no Stripe integration at all beyond marketing copy. Until a sync exists, `revenue_collections` is populated by hand or not at all, and **an empty earnings page is indistinguishable from an unpaid one**. That is the single largest gap in this system.
- **No terms row means no commission, silently.** The recompute returns 0 and writes nothing. The earnings page says so in an amber panel; nothing else does. Set rates at the moment somebody is given the `growth` role.
- **`attributed MRR` reads deals, not collections.** MRR is a run rate, and a run rate computed from last month's cash lags reality by a month in the one direction that matters — it is what the equity tranches and the Advisor→Head of Growth promotion trigger on.
- **A growth partner can write `closed_by` and `attribution_rule` on their own deals.** Deliberate: the alternative is the founder transcribing every close by hand. What protects it is that `sourced_by` is immutable, stage changes are logged to `crm_stage_changes`, and the ledger runs off collected cash that only ever arrives from the payment processor.
- **`crm_contacts.motion` defaults to `enterprise`.** Anything creating a contact from a newsletter signup should set `self_serve` and stage `subscriber`, or the self-serve board will look empty while the enterprise one fills with people nobody has met.

## Reading order for a new session

1. `src/lib/auth/permissions.ts` — the catalog. Everything else is downstream of it.
2. `20260817120000_role_aware_rls.sql` — what the database will actually refuse.
3. `20260817110000_growth_commission_ledger.sql` — read the header before touching the rule.
4. `src/lib/crm/attribution.ts` — the three rules as a pure function.
