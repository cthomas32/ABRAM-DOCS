# The collections sync

How money that arrives in Stripe becomes a row in this ledger, and what to do
when it does not.

## What it is

`revenue_collections` is the only thing the commission ledger pays on. Checkout
happens in **abram-network**, a different Supabase project with a different
customer table, so until this existed the ledger had no producer and every
commission figure was structurally correct and permanently zero.

The pipe, end to end:

```
Stripe  →  abram-network stripe-webhook  →  docs_sync_outbox
                                                  ↓  (pg_cron, every 5 min)
                                          docs-collections-sync
                                                  ↓  (HMAC-signed POST)
                                    DOCS /api/sync/collections
                                                  ↓
              revenue_sync_events → crm_accounts / crm_deals → revenue_collections
                                                  ↓
                              commission_recompute_for_collection
```

**abram-network is authoritative. DOCS mirrors.** A row here that disagrees with
Stripe is wrong by definition. Nothing in this repo may be used to answer "how
much did we collect" — that question is answered in Stripe, and this is a copy
kept so a commission statement has something to read.

## What crosses, and what does not

| Stripe event | Mirrored as | Notes |
|---|---|---|
| `invoice.paid` (platform, has a subscription) | `collected` | Sales tax netted out; discount reported separately |
| `checkout.session.completed` (platform, `mode: payment`) | `collected` | One-off purchases and AI credit top-ups |
| `checkout.session.completed` (`mode: subscription`) | **nothing** | Its money arrives on `invoice.paid`; mirroring both pays twice |
| `charge.refunded` | `refunded` | Stripe's cumulative `amount_refunded`, stored not added |
| `charge.dispute.created` | `disputed` | The collection stops paying while contested |
| `charge.dispute.closed` (lost) | `disputed` | |
| `charge.dispute.closed` (won) | `disputed`, amount 0 | Puts the collection back |
| Anything with `event.account` set | **nothing** | Connect: a customer's client paying the customer, not ABRAM's revenue |

The Connect exclusion is the one worth restating. ABRAM's revenue from a
marketplace payment is the application fee, not the gross, and mirroring the
gross would pay commission on a $30,000 production invoice that earned us a few
hundred dollars. **Application-fee revenue is not mirrored at all today** — see
"Still manual" below.

## Mapping

A payment finds its account in this order:

1. `crm_accounts.external_customer_ref` — the product's org id or Stripe
   customer id. Cannot be wrong.
2. `crm_deals.external_customer_ref` — the same reference typed in by hand
   before the sync existed. Copied up to the account on first match.
3. The email's **company** domain. Personal mailboxes (gmail, icloud, …) are
   deliberately excluded: matching on `gmail.com` files every sole trader
   against whoever signed up first, and a wrongly matched payment pays somebody
   while an unmatched one only gets flagged.
4. Nothing matched → an account is **created**, flagged `needs_review`.

Then a won deal on that account, or one is created with `origin = 'sync'`,
`stage = 'won'`, `needs_review = true`, and **no `sourced_by`** — so it pays
nobody until a person says whose it was. That is the ledger's own rule for an
unattributed deal, and it means a wrong guess costs a review rather than a
payout.

The checkout's own evidence — `promo_code`, `utm_source`,
`external_customer_ref` — is written onto the deal, **empty columns only**, and
then attribution is re-derived. A locked deal is left exactly as it was. The
sync never locks: settling attribution ends an argument, and that is a human
act.

## Environment

| Where | Name | Value |
|---|---|---|
| abram-network Supabase function secrets | `DOCS_COLLECTIONS_SYNC_SECRET` | shared secret, `openssl rand -hex 32` |
| abram-network Supabase function secrets | `DOCS_COLLECTIONS_SYNC_URL` | `https://abram.network/api/sync/collections` |
| abram-network Supabase vault | `cron_secret` | already set; the drain reuses it |
| DOCS Vercel (Production + Preview) | `DOCS_COLLECTIONS_SYNC_SECRET` | **the same value** |
| DOCS Vercel | `SUPABASE_SERVICE_ROLE_KEY` | already set |

```bash
# abram-network
npx supabase secrets set DOCS_COLLECTIONS_SYNC_SECRET=... DOCS_COLLECTIONS_SYNC_URL=...
npx supabase functions deploy docs-collections-sync
npx supabase functions deploy stripe-webhook
npx supabase db push          # 20270904000000_docs_sync_outbox

# ABRAM-DOCS
npx supabase db push          # 20260818120000_revenue_sync_events
# then set DOCS_COLLECTIONS_SYNC_SECRET in Vercel and redeploy
```

Both sides fail **closed** when the secret is missing. abram-network's drain
no-ops and leaves the queue alone; DOCS answers 503. Neither loses a payment.

## Rotating the secret

The two sides cannot change at the same instant, so accept a gap rather than
pretend otherwise:

1. Generate the new secret.
2. Set it in **DOCS** (Vercel) and redeploy. Deliveries now fail with 401.
3. Set it in **abram-network** (`supabase secrets set`) and redeploy the
   function. Deliveries resume.

401 is deliberately retryable in the outbox — everything queued during the gap
delivers on the next five-minute run. Nothing is lost and nothing needs
replaying.

## When DOCS is down

Nothing happens to Stripe, to entitlements, or to a customer. The outbox row
stays `pending` and backs off: one minute, two, four, doubling to a six-hour
cap, eight attempts, roughly a day. After that it is `failed` and stops trying.

To see the queue on the abram-network side:

```sql
select status, count(*), min(created_at)
  from docs_sync_outbox group by status;
```

To push a `failed` row back into the queue once the cause is fixed:

```sql
update docs_sync_outbox
   set status = 'pending', attempts = 0, next_attempt_at = now(), last_error = null
 where event_id = 'evt_...';
```

## Replaying

`revenue_sync_events` keeps the verified payload of every event that ever
arrived. **Replay re-applies that payload through the same code the route
runs** — it does not ask Stripe again, and it cannot re-collect money:
`revenue_collections.external_payment_ref` is unique, so a payment already in
the ledger stays there exactly once.

Replay when the *mapping* was wrong and the world has since been fixed:

- The payment landed against an invented account because the real one had no
  customer reference. Set `crm_accounts.external_customer_ref`, replay.
- An event `failed` because the console had no owner to close an invented deal.
  Fix that, replay.
- A mapping bug was shipped and corrected. Replay the affected events.

The button is on `/admin/dashboard/revenue`, owner only, one event at a time —
a replay follows a fix, and a button that replays fifty of them gets pressed
before the fixing.

Replay does **not** un-invent an account or deal that should not have been
created. Merge or archive those by hand; the collection follows the deal.

## Still manual

- **Application-fee revenue.** ABRAM's cut of marketplace payments is real
  revenue and is not mirrored. Deciding whether it pays commission at all is a
  question about the agreement, not about this pipe.
- **`sourced_by` on a synced deal.** Nothing infers who found a customer. Until
  somebody sets it, a synced deal pays nobody — by design.
- **Signup UTM.** abram-network records no `utm_source` against an org at
  signup, so rule two's evidence comes only from the campaign a promo code
  belongs to. A tracked link that produced a signup without a code is still
  invisible.
- **Merging an invented account** into the real one.
- **Unlocking attribution.** One UPDATE by an owner, deliberately not a button.
