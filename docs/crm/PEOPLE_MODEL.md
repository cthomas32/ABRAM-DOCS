# The people model

One page. If something contradicts this, this is wrong or the code is —
either way they should not both stay.

## The claim

**`crm_contacts` is THE person record.** There is no second person table
and no plan for one.

Everything else that used to look like a person is a *feed into* a
contact, a *thing a contact belongs to*, or *money attached to one*:

| Object                 | What it actually is                                        |
| ---------------------- | ---------------------------------------------------------- |
| `subscribers`          | A feed. An email address that asked for the newsletter.     |
| `crm_events` signups   | A feed. Somebody who turned up somewhere.                   |
| Campaign / form fills  | A feed. Somebody who typed into a page.                     |
| App signups            | A feed. Somebody who made an account in the product.        |
| `crm_contacts`         | **The person.**                                             |
| `crm_accounts`         | The company a person rolls up to.                           |
| `crm_deals`            | Money on an account, with one contact named as primary.     |
| `admin_users`          | Not a person in this sense. Somebody with a login *here*.   |

`admin_users` is deliberately outside the model. A teammate is not a lead
and folding the two together is how a CRM ends up emailing its own staff
a nurture sequence.

## The shape

```
   FEEDS                       THE PERSON                 WHAT HANGS OFF THEM
 ───────────                 ──────────────              ─────────────────────

 subscribers ────┐
                 │
 event signups ──┤                                   ┌──▶ crm_interactions
                 │      ┌──────────────────┐         │      (the timeline)
 form fills ─────┼─────▶│   crm_contacts   │─────────┤
                 │      │                  │         ├──▶ crm_tasks
 promo redeem ───┤      │  lifecycle_stage │         │      (follow ups)
                 │      │  sources[]       │         │
 app signups ────┤      │  stage           │         └──▶ crm_stage_changes
                 │      │  source          │                (the audit trail)
 added by hand ──┘      └────────┬─────────┘
                                 │ account_id
                                 ▼
                        ┌──────────────────┐
                        │   crm_accounts   │  the company
                        │                  │
                        │  lifecycle       │
                        │  is_comped …     │  what pays commission
                        └────────┬─────────┘
                                 │ account_id
                                 ▼
                        ┌──────────────────┐
                        │    crm_deals     │  the money
                        │                  │
                        │  primary_contact_id ──▶ back to a person
                        │  stage, amount   │
                        └──────────────────┘
```

Every feed arrow is the same function:
`syncFeedPerson()` in `src/lib/crm/contactSync.ts`.

### The `account_id` arrow is not automatic

`crm_contacts.company` is free text somebody types at a conference, and
`crm_contacts.account_id` is the foreign key drawn above. They are
different facts and nothing sets the second from the first, so a person
can name Helix all day and roll up to no company at all.

`src/lib/crm/accountMatch.ts` proposes the join and never makes it. It
matches on the email domain first, compared against `lower(domain)`, and
on the normalised company name second, and it refuses rather than guesses
when neither is certain: a consumer mail domain names no employer, an
ambiguous name has no answer, and there is no fuzzy third pass. The cost
of a wrong link is a person filed under another company's deals and
another partner's commission, which is why the write is always somebody's
click.

Two surfaces offer it. The person page suggests beneath the company
record select as soon as the field is typed, and the Companies screen
carries every unlinked person grouped by the company they name, so the
gap is visible on the one screen whose subject is companies. Both call
`linkContactsToAccount` or `createAccountForContacts` in
`people/actions.ts`. Neither runs on a schedule.

## The three ladders, which are not one ladder

This is the part that was actually broken. Three different questions were
being answered by two columns.

| Column                          | Question it answers                     | Vocabulary |
| ------------------------------- | --------------------------------------- | ---------- |
| `crm_contacts.lifecycle_stage`  | How far along is this **person**?        | `subscriber` → `lead` → `mql` → `sql` → `customer` → `churned` |
| `crm_contacts.stage`            | Where is their **pipeline**?             | `subscriber`, `new`, `contacted`, `qualified`, `demo`, `opportunity`, `won`, `lost` |
| `crm_deals.stage`               | Where is the **money**?                  | `opportunity` → `proposal` → `negotiation` → `won` / `lost` |

A newsletter subscriber sitting at pipeline stage `new` is a normal,
common state. Before `lifecycle_stage` existed it was inexpressible, so
every newsletter signup appeared on a sales board and the lead count
meant nothing.

Rules:

- Feeds only ever move `lifecycle_stage` **forwards** (`advanceLifecycle`).
  A customer who fills in a marketing form stays a customer.
- `churned` is terminal and is only ever set by a human.
- `customer` is decided by a deal being won, not by optimism.

## Sources: plural on purpose

`source` (singular) is the **first** way in. Written once at capture,
never moved. Attribution reads it.

`sources` (array) is **every** way in, accumulating, and always contains
`source`. Somebody who subscribed, came to a conference, and then filled
in a form is all three; a report forced to pick one of them is a report
that is wrong.

Vocabulary, closed, in `src/lib/crm/people.ts`:

```
newsletter · event · form · promo · app_signup
qr_card · capture_mode · manual · import
```

The last four are what the conference capture app already wrote and are
kept verbatim, so no existing row had to be rewritten.

## What was deliberately not done

- **No new tables.** Two columns on `crm_contacts`, that is all.
- **No migration of subscribers into contacts.** The subscriber table
  stays exactly where it is and keeps being the mailing list. Conversion
  is an action somebody presses.
- **No background job.** Silently promoting every address on a mailing
  list into a worked lead is worse than the problem it solves.
- **No merge UI.** Matching is on lowercased email and nothing else. When
  two humans genuinely need merging, that is a real feature and should be
  designed rather than smuggled in here.

## Where it lives

| Thing                                  | File |
| -------------------------------------- | ---- |
| Vocabularies, labels, merge rules      | `src/lib/crm/people.ts` |
| The one merge function                 | `src/lib/crm/contactSync.ts` |
| Subscriber → contact actions           | `src/app/admin/dashboard/people/subscriberActions.ts` |
| Company text → account record          | `src/lib/crm/accountMatch.ts` |
| The chips                              | `src/components/admin/PersonChips.tsx` |
| Columns, constraints, backfill         | `supabase/migrations/20260818090000_contact_lifecycle_and_sources.sql` |

## Objects, and the page each one is

The console is object-first. An object is **one address**, and every way
of looking at it is a **tab on that address**, in the URL, so it can be
linked and bookmarked and redirected to. There is no page per verb.

| Object | Address | Tabs |
| --- | --- | --- |
| — | `/admin/dashboard` | CRM Home. Four object cards, counts, one action each, the lifecycle funnel |
| `crm_contacts` | `/admin/dashboard/people` | List · Lists · Sequences · Import and export · Events · Codes · Your card |
| `crm_accounts` | `/admin/dashboard/companies` | One view, plus the unlinked people queue. The company's own people and deals are tabs on `companies/[id]` |
| `crm_deals` | `/admin/dashboard/deals` | List · Board · Forecast · Registrations |
| `crm_interactions` + `crm_tasks` | `/admin/dashboard/activities` | Tasks · Calls and meetings · Email · Notes |

The four surfaces that are not the CRM follow the same rule:
`/admin/dashboard/growth` (traffic, email, promo codes, campaign pages,
social, link hub), `/admin/dashboard/content` (blog, docs, release
notes), `/admin/dashboard/money` (earnings, revenue and sync, reports,
commission) and `/admin/dashboard/team` (people and access, bylines).

**The subscribers screen is gone and is not coming back.** A subscriber
was never a second kind of person, and having a page for one is exactly
how the same human ended up counted twice. It is `lifecycle_stage =
'subscriber'` on a contact, a built-in list on the people screen, and a
consent column on that list. The one thing that screen did which nothing
else did — turning an address that asked for the newsletter into a person
— is the "Bring the mailing list in" action on the import tab.

Every old address redirects. See `next.config.ts`.

## In the interface

- A **lifecycle chip** and **source chips** on every contact card and at
  the top of the contact drawer.
- **Lifecycle** and **Source** filters on the people screen, beside stage.
- A **lifecycle dropdown** in the drawer, next to stage, so the two
  ladders are visibly two ladders.
- **Add to contacts** on the subscribers screen, which reports what it
  did: created, matched, or already linked.
