# CRM and admin roles branch: audit

Branch `claude/abram-crm-admin-lifecycle-zdl2kp`, 4 commits, 30 files, +6195/-337.
Reviewed against `origin/main` on 2026-08-17.

Commits:

- `40136b2` feat(crm): roles, permissions, and the growth partner lifecycle
- `f0cfd87` docs(crm): the roles, attribution and commission reference
- `fda5b5a` feat(crm): one-to-one email and engagement on the contact timeline
- `6b9b47d` refactor(admin): one console with roles, not two shells

---

## Verdict

**MERGE WITH FIXES.**

The security model is real and it is better than what is on `main` today. Before this branch every
policy in the DOCS database was `FOR ALL TO authenticated USING (true)`, which means a second login
of any kind would have had the subscriber list, the broadcast sender and every contact record. That
is now closed at the database, not at the interface, and the migration is written so that the
public marketing site keeps working. That work should land.

It should not land as-is, because four things are true at the same time:

1. Two HTTP endpoints in this repo let an unauthenticated or merely-authenticated caller do things
   the new RLS explicitly forbids. Both are pre-existing, neither is touched by the branch, and
   both make the branch's central claim ("everything the console hides, the policies refuse")
   false in production the day Ava gets a login.
2. The commission chain has no entry point and no writer. `resolveAttribution` is never called.
   `commission_recompute_for_collection` is never called. `revenue_collections` has no producer.
   There is no UI anywhere for `crm_deals` or `crm_accounts`. The earnings page will render an
   empty statement forever, and an empty statement is indistinguishable from an unpaid one.
3. Auto-approval by silence is derived in the interface and never written to the row, so a
   registration that the interface shows as "approved (by default)" is still `pending` to the
   attribution rule, which rejects anything not literally `approved`. The screen and the money
   disagree.
4. One nav link points at a page that does not exist.

None of those is a reason to throw the branch away. All of them are a reason not to hand Ava a
login on the day it merges.

**Suggested sequencing:** merge the branch, ship fixes 1 to 5 in a follow-up before creating Ava's
account, and treat fixes 6 to 12 as the first sprint.

---

## 1. Correctness

### Is RLS actually enforced

Yes, at the database, and the design is sound.

- `20260817120000_role_aware_rls.sql:81-105` sweeps only policies whose role list is exactly
  `{authenticated}`, so `TO public` policies serving the marketing site survive. This is the right
  call and the header explains it well enough that nobody will "simplify" it by accident.
- Every predicate (`current_admin_role`, `is_owner_or_admin`, `growth_sees_all_contacts` and the
  rest, `20260817090000:177-234`) is `STABLE SECURITY DEFINER SET search_path = public`, granted to
  `authenticated` and `service_role`, revoked from `anon` and `public`. That is correct on all three
  counts: `SECURITY DEFINER` avoids policy recursion on `admin_users`, `STABLE` means one evaluation
  per statement rather than per row, and the explicit `search_path` closes the shadowing escalation.
- `NULL` fails closed everywhere. A user with an `auth.users` row and no `admin_users` row gets
  `current_admin_role() = NULL` and reads nothing.
- Views are `security_invoker = on` (`20260817110000:607-609`), so `commission_statement` cannot be
  used to read past the entry policies. Easy to forget, and it was not forgotten.

The scaffolding helpers `__apply_policy` and `__drop_authenticated_policies` are dropped at the end
of the migration (`20260817120000:430-431`). Good, they build DDL from strings.

**Where the redundancy has drifted:** `permissions.ts` grants `analytics.write` at
`head_of_growth` and `employee` (`permissions.ts:227-228`), but Group F only writes
`Owners manage analytics` for owner and admin (`20260817120000:403-406`). The catalog promises
something the database refuses. Nothing writes analytics today so it is inert, but it is exactly
the drift the file's own docstring warns about.

### Self-promotion trigger

Yes, and it is correct. `admin_users_guard_privilege_change` (`20260817090000:275-300`) fires
`BEFORE UPDATE FOR EACH ROW`, refuses any change to `role`, `growth_stage` or `is_active` from a
non-owner, and returns early when `auth.uid() IS NULL` so the service role keeps the recovery path.
It is needed because the "Users update their own profile" policy (`:325-329`) is row-level and RLS
has no column grants.

**Gap:** the trigger does not guard `member_id` or `email`. A growth partner can point their
`admin_users.member_id` at any `team_members` row and change the `email` on their own record. Not a
privilege escalation, but `email` is what a human reads when deciding who to pay, and `member_id`
links a login to a public byline. Add both columns to the trigger's condition.

**Gap:** the last-active-owner rule is enforced only in the server action
(`people/actions.ts:81-90`, `:110-123`), not in the trigger. An owner using any other path (a
`supabase-js` call from a browser console, since owners hold `FOR ALL` on `admin_users`) can demote
themselves and lock the console. Low likelihood, cheap to close, and the migration header claims the
guard exists at the database. It does not.

### Draft-only state machine

Yes, real, and correctly split across `USING` and `WITH CHECK`
(`20260817140000:65-85`). `USING (is_growth_member() AND status = 'draft')` limits which rows may be
touched; `WITH CHECK (... status = 'draft')` limits what they may become. Both halves are present.
The `INSERT` policy separately pins `status = 'draft'` so a campaign cannot be conjured already
sending. This is the best-argued piece of the branch.

### Unsubscribe token

Not touched by this branch and fine where it exists: `src/lib/funnel/unsubscribeToken.ts` is an
HMAC-SHA256 over the payload with `timingSafeEqual` comparison, used by
`/api/newsletter/unsubscribe`.

**Gap that this branch creates:** `sendContactEmail` (`src/lib/crm/contactEmail.ts:137-149`) sends a
one-to-one email with no `List-Unsubscribe` header and no unsubscribe link in the body. For a genuine
one-to-one reply that is defensible. For a cold sales email to a scanned conference contact, which is
what Ava will actually use it for, it is not. It also does not check the `subscribers` row when the
sender is a growth partner, and the code says so plainly (`:116-121`) - the partner cannot read
`subscribers`, so the query returns null and the consent check silently passes. The comment argues
this is acceptable. It is acceptable for a reply and not for a first-touch send, and the function
cannot tell the two apart. Route the consent check through a `SECURITY DEFINER` function that
returns only a boolean, so the check runs regardless of who is calling.

### Webhook auth on `/api/webhooks/resend`

**No, and this is the most serious finding in the review.**

`src/app/api/webhooks/resend/route.ts:102-112` reads the JSON body and immediately builds a service-role
client. There is no signature check of any kind. The sibling route
`src/app/api/webhooks/resend/marketing/route.ts:20-47` does verify the Svix signature properly, with a
timestamp window and constant-time comparison. The base route does not.

What an unauthenticated POST to that URL can do today:

- **Suppress the mailing list.** `:275-296` marks any subscriber `status = 'bounced'` on a forged
  `email.bounced` event. Bounced addresses are then excluded from every send. One request per
  address, no rate limit, no auth.
- **Forge CRM history.** This branch added `:255-272`, which calls `crm_record_email_engagement`.
  Anyone who knows or guesses a contact's email address can now write `email_opened` and
  `email_clicked` rows onto that person's timeline. Ava's pipeline judgement is downstream of those
  rows.
- **Pollute `campaign_logs`** with arbitrary rows (`:207-215`), which feeds
  `reconcile_campaign_recipients_count` and therefore campaign reporting.

Secondary issue on the same route: `:188` interpolates `emailId`, taken straight from the request
body, into a PostgREST `.or()` filter string with no escaping. Commas and parentheses in that value
change the parsed filter. Low impact given the caller already holds the service role, but it is a
filter-injection primitive sitting in an unauthenticated handler.

**Fix:** lift the Svix verification out of `marketing/route.ts` into a shared helper and apply it to
both routes. This is a small change and it should block Ava's account creation, not the merge.

### Two open endpoints the branch does not close

Both defeat the RLS work for the surfaces they cover.

- **`src/app/api/admin/promotions/route.ts:43-51`** checks `if (!user)` and nothing else. Any
  Supabase-authenticated identity, including one with no `admin_users` row at all, can call
  `create_campaign`, `create_codes` and `set_code_status` against the abram-network
  `admin-promotions` edge function using the server-held `ABRAM_PROMO_ADMIN_TOKEN`. Promo codes are
  the first attribution rule and they move real money in the product's Stripe. Needs
  `readConsoleUser` plus `can(user, "promotions.manage")`.
- **`src/app/api/admin/posts/route.ts:25` and `:71`** export `POST` and `PUT` that write with
  `SUPABASE_SERVICE_ROLE_KEY` (`:5-8`) and perform no authentication whatsoever. Unauthenticated
  blog create and edit on the public marketing site. Whatever `blog_posts` RLS says is irrelevant
  while this route exists.

### The commission chain does not run

Everything is built and nothing is wired.

- `resolveAttribution` (`src/lib/crm/attribution.ts:111`) has **zero callers**. Only
  `registrationState` is imported anywhere (`registrations/page.tsx:5`). Nothing ever writes
  `crm_deals.attribution_rule`, which therefore stays at its default `'unattributed'`, which is the
  first exclusion the recompute checks (`20260817110000:346`). Every deal pays zero.
- `commission_recompute_for_collection` has zero callers. No cron, no route, no action.
- `revenue_collections` has no writer. No Stripe sync exists in this repo.
- There is **no interface for `crm_deals` or `crm_accounts` at all.** The CRM page has four tabs:
  pipeline, events, codes, card (`crm/page.tsx:68`). The pipeline board drags *contacts* through
  contact stages. Nobody can create a deal, set an amount, set a close date, mark it won, or set
  `closed_by`. `crm_deals` is referenced in exactly one app file, and only to read `first_contact_at`
  off an account (`registrations/actions.ts:98-102`).

So the pipeline built by migrations 100000 and 110000 is a schema with no doors. The earnings page
is honest about the terms case (amber panel at `earnings/page.tsx:163-173`) but says nothing about
the far more likely case, which is that no deal was ever created.

### Auto-approval never reaches the row

`registrationState` (`attribution.ts:277-279`) returns `effective: 'approved', autoApproved: true`
once `decline_deadline_at` passes, and the registrations page renders it. The stored `status` stays
`'pending'` forever. `resolveAttribution:164-168` rejects anything whose status is not literally
`'approved'`. So a registration the console shows as approved by silence pays nothing, and the
reason will be invisible because the audit view will just say `unattributed`.

Same shape for `expires_at`: nothing ever writes `status = 'expired'`.

**Fix:** a scheduled job, or a `SECURITY DEFINER` function called on read, that materialises both
transitions. Given there is no cron in this repo, the cheapest correct fix is to have
`resolveAttribution` accept the derived state rather than the stored one, and to have any code that
writes attribution use `registrationState().effective`.

### Terms update is not atomic

`setPartnerTerms` (`people/actions.ts:179-202`) closes the open terms row, then inserts the new one
as a separate statement. If the insert fails, the partner is left with **no open terms row**, which
means `growth_terms_at` returns nothing and `commission_recompute_for_collection` silently pays zero
(`20260817110000:373`). The error message says "Could not record the new terms. Try again." and does
not mention that the previous terms were just deleted from effect. Make it one RPC.

### Smaller correctness notes

- `registrations/actions.ts:101` looks up the account with `.eq("domain", accountDomain)` where
  `accountDomain` is lowercased, but `crm_accounts.domain` is stored as typed and only the *index* is
  `lower(domain)` (`20260817100000:95-96`). An account stored as `Helix.com` will not match, so the
  "already contacted, cannot be registered" guard silently passes. Use `.ilike`.
- `20260817110000:359` excludes non-growth payees with
  `IF EXISTS (SELECT 1 FROM admin_users WHERE user_id = v_payee AND role <> 'growth')`. Invert it to
  `NOT EXISTS (... role = 'growth')` so a missing row fails closed rather than paying.
- `20260817100000:181-184` backfills `owner_user_id` from
  `(SELECT user_id FROM admin_users WHERE role='owner' ORDER BY created_at LIMIT 1)`. Every row was
  inserted by the same statement in 090000, so all `created_at` values are identical and the pick is
  arbitrary if more than one auth user exists. Almost certainly one user in production; worth an
  explicit tiebreak anyway.
- `AdminShell.tsx:94` links "Revenue & Commission" to `/admin/dashboard/revenue`. That directory does
  not exist. An owner clicking it gets a 404. `permissions.ts:302` also routes that prefix.

---

## 2. Migration safety on the DOCS Supabase project

**Destructive:** no `DROP TABLE`, no `DROP COLUMN`, no data deletion. All tables are
`CREATE TABLE IF NOT EXISTS`, all columns `ADD COLUMN IF NOT EXISTS`. Two `CHECK` constraints are
dropped and re-added wider (`crm_contacts_stage_check` gains `subscriber` and `demo`,
`crm_interactions_kind_check` gains eleven kinds) - both strictly widen, so no existing row can fail.

**Backfills:** two, both benign and both correctly `ON CONFLICT DO NOTHING` or `WHERE ... IS NULL`.

- `20260817090000:356-363` inserts every `auth.users` row into `admin_users` as `owner`. This is the
  right call and the header says why: everyone who could sign in already had unrestricted access, so
  `owner` describes what they had rather than granting something new. **Verify the production
  `auth.users` count before running.** If there is a stale or test account in there, this branch
  hands it owner. One `SELECT count(*), email FROM auth.users` settles it.
- `20260817100000:181-184` sets `owner_user_id` and `sourced_by` on existing contacts. Idempotent
  via the `IS NULL` guard.

**The `TO authenticated USING(true)` sweep:** safe for the public site. The distinguishing test is
sound - `pg_policies.roles = ARRAY['authenticated']` misses `{public}` and `{anon}` policies, which
is where every anonymous path lives. Verified in the prior migrations: the public card read, the
newsletter insert and the link hub reads are all written without a `TO` clause. Section 9 of the
migration re-asserts the card policy as belt and braces.

**Two real risks in the sweep:**

1. **Anything not named in a group keeps its old open policy.** The sweep is an explicit table list.
   Tables created outside these migrations (several were made in the dashboard) and not named will
   keep a `USING (true)` policy and stay wide open to every login, including `viewer` and
   `contributor`. Before deploying, run:
   ```sql
   SELECT tablename, policyname, roles, qual
     FROM pg_policies
    WHERE schemaname = 'public'
      AND roles = ARRAY['authenticated']::name[]
      AND qual = 'true';
   ```
   on the production project and confirm the result is empty after the migration.
2. **Any table with RLS enabled and no surviving policy becomes unreadable.** The migration header
   calls this the correct direction to fail in, and it is, but it is still a visible outage. The same
   query with `qual IS NULL` before deploying will tell you which tables are about to go dark.

**One migration will hard-fail on a fresh environment.** `20260817140000` is the only one of the six
that abandons the `to_regclass` guard the others use. Lines 44-57 and 65-85 issue bare
`CREATE POLICY ... ON public.subscribers`, `campaign_logs`, `email_templates` and `campaigns`. None of
those four tables is created by any migration in this repo - they were made in the dashboard - so
`supabase db reset` or a fresh branch database will error out at this file. Section 3 of the same file
does use `to_regclass` (`:99`), so the inconsistency is an oversight rather than a decision. Wrap
sections 1 and 2 the same way.

**Ordering:** filename order is correct. 090000 creates `admin_users` before 100000 FKs to it, before
110000 FKs to both, before 120000 writes policies that call 090000's predicates.

**Dependency:** all six assume `public.crm_touch_updated_at()` exists (from
`20260804120000_crm_conference_capture.sql`). True on production, true in a full replay.

---

## 3. UI and UX of the admin CRM pages

The screens are competent and consistent with the rest of the DOCS console. They are not yet a CRM.

**What works**

- `AdminShell` filters the nav from the permission set before render (`AdminShell.tsx:50-97`), so a
  refused link is never drawn. The reasoning in the docstring is right: a menu of doors you cannot
  open also describes what everybody else can do.
- The registrations page leads with "How this is decided" and the three rules in order
  (`registrations/page.tsx:77-95`) before showing any data. That is the correct emphasis for a screen
  whose whole purpose is preventing an argument.
- `RegistrationForm` is collapsed by default (`RegistrationForm.tsx:45`) so the list of what has
  already been filed, which is why most visits happen, stays above the fold.
- The earnings empty state explains *why* it is empty rather than showing a zero
  (`earnings/page.tsx:163-173`).
- The no-access page is a real screen with a real sentence, not a redirect loop.

**What needs work**

- **Three different label recipes in one branch.** `text-[9px] font-semibold tracking-[0.2em]`
  (`AdminShell.tsx:210`), `text-[10px] font-semibold tracking-[0.2em]` (`earnings/page.tsx:36`),
  `text-[10px] font-semibold tracking-[0.15em]` (`PeopleManager.tsx:180`, `earnings/page.tsx:53`).
  Same job, three sizes, two trackings. There is an `Overline` component in `earnings/page.tsx` that
  nothing else imports. Promote it to `src/components/admin/Overline.tsx` and use it everywhere.
- **`font-bold` on an interactive control.** `AdminShell.tsx:258` applies `font-bold` to the active
  nav pill. House rule caps interactive labels at `font-medium`. `font-semibold` is used correctly
  everywhere else in the same file.
- **Red used as decoration.** `RegistrationForm.tsx:114` uses `border-rose-500/20 bg-rose-500/5` for
  the error panel. Rose is red. The palette rule is no red accents or glows. Use the same neutral
  panel treatment as the amber terms warning, or plain `border-white/10` with the message doing the
  work.
- **Semantic colour is ad hoc.** amber for warnings, emerald for success, rose for errors, zinc for
  everything, all inline, no tokens. Three files each pick their own. One `statusPanel.ts` with four
  named recipes fixes it permanently.
- **The pipeline board drags the wrong object.** `PipelineBoard.tsx:83-119` has working HTML5 drag
  and drop, but it moves contacts through contact stages. A CRM board moves *deals* through *deal*
  stages with an amount on each card and a column total at the top. The contact board should stay and
  a deal board should be added beside it, not replace it.
- **No stat row on the CRM page.** Earnings has four `StatTile`s. The pipeline has none. Open deals,
  weighted forecast, closing this month and untouched over 14 days are the four numbers a growth lead
  looks at first.
- **Copy carries em dashes** in several page docstrings and in
  `earnings/page.tsx:247` ("a deal does not on its own produce a figure — the cash has to arrive").
  Rewrite as two sentences.

---

## 4. Fix list

Ordered. File and line where the change goes.

**Block Ava's account until these five are done**

1. `src/app/api/webhooks/resend/route.ts:102` - verify the Svix signature before touching the
   service client. Extract the verification from `marketing/route.ts:20-60` into
   `src/lib/webhooks/svix.ts` and call it from both.
2. `src/app/api/admin/posts/route.ts:25` and `:71` - add `readConsoleUser` plus
   `can(user, "content.blog")`. Unauthenticated service-role writes to the public blog.
3. `src/app/api/admin/promotions/route.ts:49` - replace `if (!user)` with `readConsoleUser` plus
   `can(user, "promotions.manage")`.
4. `supabase/migrations/20260817140000_growth_console_surfaces.sql:44-85` - wrap sections 1 and 2 in
   the same `to_regclass` guard section 3 uses, so a fresh database does not fail.
5. Run the two `pg_policies` audit queries in section 2 above against production, before and after
   deploying, and confirm both come back empty.

**First sprint**

6. `src/app/admin/dashboard/AdminShell.tsx:94` - either build `/admin/dashboard/revenue` or remove
   the link. Also remove the dead `revenue` entry at `permissions.ts:302` if the page is not coming.
7. `src/app/admin/dashboard/people/actions.ts:179-202` - move the close-then-insert into one
   `SECURITY DEFINER` RPC so a failed insert cannot strand a partner with no open terms row.
8. `src/lib/crm/attribution.ts:164` - read the *effective* registration state, not the stored status,
   so approval by silence actually pays. Or materialise the transition in a scheduled job.
9. `supabase/migrations/20260817090000_admin_roles_and_permissions.sql:284-287` - add `member_id` and
   `email` to the guarded column list in the trigger.
10. `supabase/migrations/20260817110000_growth_commission_ledger.sql:359` - invert to
    `NOT EXISTS (... role = 'growth')` so a missing `admin_users` row fails closed.
11. `src/app/admin/dashboard/registrations/actions.ts:101` - `.ilike("domain", accountDomain)`.
12. `src/lib/crm/contactEmail.ts:109-128` - move the consent check into a `SECURITY DEFINER` function
    returning a boolean, so it runs for a growth partner too. Add a `List-Unsubscribe` header.

**UI, batchable**

13. Promote `Overline` to a shared component and replace all three label recipes.
14. `AdminShell.tsx:258` - `font-bold` to `font-semibold`.
15. `RegistrationForm.tsx:114` - drop rose.
16. One `statusPanel.ts` for the four semantic panel treatments.

**The gap that is not a fix**

The commission system cannot produce a number until `revenue_collections` has a producer. That is a
cross-repo integration, not a bug in this branch, and it is treated as its own workstream in
`docs/plans/ava-access-and-commission.md`.
