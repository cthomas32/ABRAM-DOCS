# Deploying CRM P0

Everything on `crm/p0` that has to happen outside the code, in the order it has to happen in.

Read `docs/plans/crm-hubspot-parity.md` for what was built and
`docs/plans/ava-access-and-commission.md` for why the commission rows matter.

---

## 1. Environment variables

Two of these are new and two routes now **refuse to run without them**. That is deliberate: an
unauthenticated webhook endpoint that accepts anything is worse than one that is down, and a 503
that says so is easier to notice than a silent forgery.

| Variable | Where | Required | What breaks without it |
|---|---|---|---|
| `RESEND_WEBHOOK_SECRET` | Vercel, all environments | **Yes, new** | `/api/webhooks/resend` returns 503 |
| `RESEND_MARKETING_WEBHOOK_SECRET` | Vercel, all environments | **Yes, new** | `/api/webhooks/resend/marketing` returns 503 |
| `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET` | Vercel | Already on `main` | Kipp's Slack review flow |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel, server only | Already set | Every admin write |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel | Already set | The console does not load |

Both webhook secrets come from the Resend dashboard, one per endpoint. They are Svix signing
secrets and start with `whsec_`. Set them **before** deploying, not after: the 503 is returned on
every delivery in the gap, and Resend retries a bounded number of times.

## 2. Migrations, in order

Apply all of `20260817*` to the DOCS Supabase project. They are ordered by filename and each one
assumes the ones before it.

1. `20260817090000_admin_roles_and_permissions.sql` — `admin_users`, roles, growth stages.
   **Backfills every existing `auth.users` row as `owner`.** See section 3.
2. `20260817100000_crm_lifecycle_accounts_deals.sql` — `crm_accounts`, `crm_deals`,
   `crm_deal_registrations`, and the widened `crm_interactions_kind_check`.
3. `20260817110000_growth_commission_ledger.sql` — `growth_partner_terms`, `revenue_collections`,
   `commission_ledger`, the recompute.
4. `20260817120000_role_aware_rls.sql` — the policy sweep and `__apply_policy`. Everything after
   this depends on that function existing.
5. `20260817130000_crm_email_engagement.sql` — open and click kinds on the timeline.
6. `20260817140000_growth_console_surfaces.sql` — the console read surfaces, now `to_regclass`
   guarded.
7. `20260817150000_growth_attribution_keys.sql` — `growth_attribution_keys` plus
   `growth_attribution_owners`, `crm_live_registration_for_account`,
   `commission_recompute_as_owner`.
8. `20260817160000_crm_tasks_deal_link.sql` — `deal_id` on `crm_tasks`, `crm_interactions` and
   `crm_stage_changes`; `contact_id` nullable on the latter two under a CHECK; `crm_can_see_deal`
   and `crm_can_edit_deal`; rewritten policies on the three tables.

```bash
npx supabase link --project-ref <docs-project-ref>
npx supabase db push
```

`db push` only, never the MCP apply_migration path. Migration 8 raises an exception rather than
running if migration 4 is missing, so a partial apply fails loudly instead of leaving the timeline
readable by nobody.

## 3. The `admin_users` backfill

`20260817090000` inserts an `owner` row for **every** existing `auth.users` row. On the DOCS project
that is currently Connor and nothing else, which is correct. Confirm it before applying, because an
owner row is not something to discover later:

```sql
SELECT id, email, created_at FROM auth.users ORDER BY created_at;
```

Every row returned becomes an owner. If any of them should not be, delete the user first or fix the
`admin_users` row immediately after the push.

## 4. The policy audit, before and after

`scripts/audit-open-policies.sql` lists every policy addressed to `authenticated` whose `USING`
clause is `true` — a policy that lets any signed-in person read the whole table.

Run it **before** the migrations to record what you started with, and **after** to prove the sweep
worked:

```bash
psql "$DOCS_DATABASE_URL" -f scripts/audit-open-policies.sql
```

The after run must return **no rows for the CRM and growth tables**. `crm_contacts`,
`crm_interactions`, `crm_tasks`, `crm_stage_changes`, `crm_accounts`, `crm_deals`,
`crm_deal_registrations`, `growth_partner_terms`, `revenue_collections`, `commission_ledger` and
`growth_attribution_keys` are all role-aware after step 2. A surviving `USING (true)` on any of them
means a migration did not apply and every partner can read every other partner's pipeline.

## 5. Ava's rows

None of this is code. It is three inserts, and the second one is the one that is silently
catastrophic to forget: **no terms row means no commission, and the recompute returns 0 and writes
nothing.** Only the earnings page mentions it.

**Her account.** Do this through the console, not through SQL: sign in as owner, go to
`/admin/dashboard/people`, and invite her with role `growth` and stage `head_of_growth`.
`inviteTeammate` creates the `auth.users` row and the `admin_users` row in one call, so there is
never a window where she has a login and no role.

If it has to be done by hand, after the invite has created the auth user:

```sql
-- Her console row. Replace the uuid with her auth.users id.
INSERT INTO public.admin_users (user_id, email, full_name, role, growth_stage, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'ava@example.com',
    'Ava <surname>',
    'growth',
    'head_of_growth',
    TRUE
)
ON CONFLICT (user_id) DO UPDATE
   SET role = EXCLUDED.role,
       growth_stage = EXCLUDED.growth_stage,
       is_active = TRUE;
```

**Her commission terms.** Rates are stored as fractions, not percents: `0.2000` is twenty percent.
The people screen takes percents and divides, so type `20` there. These are the defaults proposed in
`docs/plans/ava-access-and-commission.md` section 3 and they are placeholders until the agreement is
signed — confirm both rates with her before inserting.

```sql
INSERT INTO public.growth_partner_terms (
    user_id, stage, close_rate, source_rate,
    tail_months, clawback_days, effective_from
)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'head_of_growth',
    0.2000,   -- she sourced it and ran it to checkout
    0.1000,   -- she sourced it, somebody else closed it
    12,       -- collections stop paying twelve months after first payment
    90,       -- a refund inside this window reverses the accrual
    '2026-09-01'
);
```

**Her attribution keys.** Until these exist, rules one and two cannot fire for her and every deal
she sources comes back `unattributed`, which pays nothing.

```sql
INSERT INTO public.growth_attribution_keys (user_id, key_type, key_value, label)
VALUES
    ('00000000-0000-0000-0000-000000000000', 'promo_code', 'AVA', 'Her code on every deck'),
    ('00000000-0000-0000-0000-000000000000', 'utm_source', 'ava', 'Her links');
```

## 6. After the deploy

- [ ] Both webhook endpoints return 200 on a Resend test delivery, not 503
- [ ] The policy audit returns no rows for the CRM and growth tables
- [ ] Sign in as owner: Deals, Deal board, Tasks, Accounts and Registrations all appear in the nav
- [ ] Create a deal, drag it across the board, mark it won through the close dialog, and confirm the
      attribution panel shows a verdict marked Settled
- [ ] Sign in as Ava: the nav shows Contacts, Accounts, Deals, Deal board, Tasks, Registrations,
      Campaign Pages, Link Hub, Promotions, Subscribers, Email Broadcasts and Your Earnings, and
      does **not** show Release Notes, Team, People and Access or Revenue and Commission
- [ ] `/admin/dashboard/people` typed directly redirects her away
- [ ] Her earnings page renders and shows the terms from step 5
