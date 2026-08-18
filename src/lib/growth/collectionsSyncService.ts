/**
 * Putting a payment from the product's Stripe into this ledger.
 *
 * `collectionsSync.ts` decides what the message says. This decides what
 * the database does about it, and every decision here is a choice about
 * what happens when the two sides disagree about who a customer is.
 *
 * THE RULE THAT SHAPES EVERYTHING: NEVER DROP THE MONEY
 *
 * A payment that cannot be matched to an account is still a payment. It
 * gets an invented account and an invented deal, both flagged
 * `needs_review`, and the collection is written against them. The
 * alternative — refuse it until somebody has tidied the CRM — makes the
 * ledger quietly short by exactly the payments nobody was watching, which
 * is the worst possible failure for a mirror.
 *
 * An invented deal has no `sourced_by`, so it pays nobody. That is the
 * ledger's own rule for an unattributed deal and it means a wrong guess
 * here costs a review rather than a payout.
 *
 * MATCHING, WIDEST TRUST FIRST
 *
 *   1. `external_customer_ref` on an account, or on a deal. This is the
 *      product's own primary key. It cannot be wrong.
 *   2. The email's company domain. Not a personal mailbox — matching on
 *      gmail.com would file every sole trader against whoever signed up
 *      first, and a wrongly matched payment pays somebody, while an
 *      unmatched one only gets flagged.
 *   3. Nothing. Invent it.
 *
 * IDEMPOTENCY
 *
 * `revenue_sync_events.event_id` is unique and is claimed FIRST, before
 * anything is written. A duplicate delivery loses the race and returns
 * without touching the ledger. `revenue_collections.external_payment_ref`
 * is unique too, so even a claim that somehow succeeded twice cannot
 * write the payment twice.
 *
 * SERVICE ROLE, AND WHY THAT IS SAFE HERE
 *
 * This runs from a route with no signed-in person, so RLS has nobody to
 * evaluate. The gate is the HMAC on the request, checked before this file
 * is reached, and the fact that nothing here takes an id from the caller
 * and echoes it back.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { applyDealAttributionAs } from "@/lib/crm/attributionService";
import {
  accountRefsFor,
  collectionRowFor,
  companyDomain,
  reversalFor,
  type CollectionSyncEvent,
  type ExistingCollection,
} from "./collectionsSync";

export interface ApplyResult {
  ok: boolean;
  /** True when this event had already been applied and nothing was done. */
  duplicate?: boolean;
  status: "applied" | "needs_review" | "ignored" | "failed" | "duplicate";
  note: string;
  collectionId?: string;
  dealId?: string;
  accountId?: string;
  entriesWritten?: number;
}

/** The service-role client. Never handed to anything a browser reaches. */
export function serviceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/* ------------------------------------------------------------------ */
/*  Pieces                                                             */
/* ------------------------------------------------------------------ */

/** Whoever the company is. An invented deal is closed by them. */
async function ownerUserId(supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("role", "owner")
    .order("created_at", { ascending: true })
    .limit(1);

  return ((data ?? []) as { user_id?: string }[])[0]?.user_id ?? null;
}

interface AccountMatch {
  id: string;
  invented: boolean;
  how: string;
}

async function findOrCreateAccount(
  supabase: SupabaseClient,
  event: CollectionSyncEvent,
): Promise<AccountMatch | null> {
  const refs = accountRefsFor(event);

  if (refs.length > 0) {
    const { data } = await supabase
      .from("crm_accounts")
      .select("id")
      .in("external_customer_ref", refs)
      .limit(1);

    const hit = ((data ?? []) as { id: string }[])[0];
    if (hit) return { id: hit.id, invented: false, how: "matched on the product's customer reference" };

    // The deal may carry the reference even when the account does not —
    // `crm_deals.external_customer_ref` predates the account column and
    // is what an owner filled in by hand.
    const { data: deals } = await supabase
      .from("crm_deals")
      .select("account_id")
      .in("external_customer_ref", refs)
      .limit(1);

    const dealHit = ((deals ?? []) as { account_id: string }[])[0];
    if (dealHit?.account_id) {
      // Carry it up so the next payment matches in one query instead of two.
      await supabase
        .from("crm_accounts")
        .update({ external_customer_ref: refs[0] })
        .eq("id", dealHit.account_id)
        .is("external_customer_ref", null);

      return { id: dealHit.account_id, invented: false, how: "matched through a deal's customer reference" };
    }
  }

  const domain = companyDomain(event.customer_email);
  if (domain) {
    const { data } = await supabase
      .from("crm_accounts")
      .select("id")
      .ilike("domain", domain)
      .eq("archived", false)
      .limit(1);

    const hit = ((data ?? []) as { id: string }[])[0];
    if (hit) {
      if (refs.length > 0) {
        await supabase
          .from("crm_accounts")
          .update({ external_customer_ref: refs[0] })
          .eq("id", hit.id)
          .is("external_customer_ref", null);
      }
      return { id: hit.id, invented: false, how: `matched on the email domain ${domain}` };
    }
  }

  const name =
    event.org_name ?? (domain ? domain : null) ?? event.customer_email ?? event.stripe_customer_id ?? "Unknown customer";

  const { data: created, error } = await supabase
    .from("crm_accounts")
    .insert({
      name,
      domain,
      external_customer_ref: refs[0] ?? null,
      lifecycle: "customer",
      needs_review: true,
      notes: `Created by the collections sync from Stripe event ${event.event_id}. Nothing in this CRM matched the customer that paid.`,
    })
    .select("id")
    .maybeSingle();

  if (error || !created?.id) return null;

  return { id: created.id as string, invented: true, how: "no account matched, so one was created" };
}

interface DealMatch {
  id: string;
  invented: boolean;
}

async function findOrCreateDeal(
  supabase: SupabaseClient,
  event: CollectionSyncEvent,
  accountId: string,
): Promise<DealMatch | null> {
  const refs = accountRefsFor(event);

  // A won deal already pointing at this customer is the best answer, and
  // it is the case where an owner did the work by hand.
  if (refs.length > 0) {
    const { data } = await supabase
      .from("crm_deals")
      .select("id")
      .in("external_customer_ref", refs)
      .eq("stage", "won")
      .order("closed_at", { ascending: true })
      .limit(1);

    const hit = ((data ?? []) as { id: string }[])[0];
    if (hit) return { id: hit.id, invented: false };
  }

  const { data: onAccount } = await supabase
    .from("crm_deals")
    .select("id")
    .eq("account_id", accountId)
    .eq("stage", "won")
    .order("closed_at", { ascending: true })
    .limit(1);

  const accountHit = ((onAccount ?? []) as { id: string }[])[0];
  if (accountHit) return { id: accountHit.id, invented: false };

  // Nothing. Money arrived against an account with no won deal, so there
  // is one now: won, because it plainly is, and paying nobody, because
  // nobody has said whose it was.
  const closedBy = await ownerUserId(supabase);
  if (!closedBy) return null; // crm_deals_won_needs_close would refuse it anyway

  const { data: created, error } = await supabase
    .from("crm_deals")
    .insert({
      account_id: accountId,
      name: `${event.org_name ?? "Self-serve customer"} — ${event.plan_tier ?? "subscription"}`,
      motion: "self_serve",
      stage: "won",
      closed_at: event.occurred_at,
      closed_by: closedBy,
      owner_user_id: closedBy,
      currency: event.currency,
      billing_period: event.billing_interval === "annual" ? "annual" : event.billing_interval === "monthly" ? "monthly" : "one_off",
      plan_tier: event.plan_tier,
      promo_code: event.promo_code,
      utm_source: event.utm_source,
      external_customer_ref: refs[0] ?? null,
      first_payment_at: event.occurred_at,
      origin: "sync",
      needs_review: true,
      notes: `Created by the collections sync from Stripe event ${event.event_id}. It pays nobody until sourced_by is set.`,
    })
    .select("id")
    .maybeSingle();

  if (error || !created?.id) return null;
  return { id: created.id as string, invented: true };
}

/**
 * Write the checkout's own evidence onto the deal, without clobbering.
 *
 * A promo code recorded here is a code redeemed at a real checkout, which
 * is stronger than anything a person types — but a column somebody
 * already filled in is a decision, and overwriting decisions silently is
 * how a ledger loses an argument it should have won. Empty columns only.
 */
async function stampEvidence(
  supabase: SupabaseClient,
  event: CollectionSyncEvent,
  dealId: string,
): Promise<void> {
  const { data } = await supabase
    .from("crm_deals")
    .select("promo_code, utm_source, external_customer_ref, first_payment_at")
    .eq("id", dealId)
    .maybeSingle();

  const deal = data as {
    promo_code: string | null;
    utm_source: string | null;
    external_customer_ref: string | null;
    first_payment_at: string | null;
  } | null;
  if (!deal) return;

  const patch: Record<string, unknown> = {};
  if (event.promo_code && !deal.promo_code) patch.promo_code = event.promo_code;
  if (event.utm_source && !deal.utm_source) patch.utm_source = event.utm_source;

  const ref = event.org_id ?? event.stripe_customer_id;
  if (ref && !deal.external_customer_ref) patch.external_customer_ref = ref;

  if (!deal.first_payment_at || new Date(event.occurred_at) < new Date(deal.first_payment_at)) {
    patch.first_payment_at = event.occurred_at;
  }

  if (Object.keys(patch).length > 0) {
    await supabase.from("crm_deals").update(patch).eq("id", dealId);
  }
}

/** Has this customer paid before? The twelve month tail runs from the first. */
async function isFirstPayment(
  supabase: SupabaseClient,
  event: CollectionSyncEvent,
): Promise<boolean> {
  const ref = event.org_id ?? event.stripe_customer_id;
  if (!ref) return false; // nothing to group by, so we cannot claim it is the first

  const { count } = await supabase
    .from("revenue_collections")
    .select("id", { count: "exact", head: true })
    .eq("external_customer_ref", ref)
    .lte("collected_at", event.occurred_at);

  return (count ?? 0) === 0;
}

async function recompute(supabase: SupabaseClient, collectionId: string): Promise<number> {
  const { data, error } = await supabase.rpc("commission_recompute_for_collection", {
    p_collection_id: collectionId,
  });
  if (error) return 0;
  return typeof data === "number" ? data : 0;
}

/** The collection a reversal is about, found under any ref it might carry. */
async function findCollection(
  supabase: SupabaseClient,
  event: CollectionSyncEvent,
): Promise<ExistingCollection | null> {
  const refs = Array.from(new Set([event.payment_ref, ...event.payment_ref_candidates]));

  const { data } = await supabase
    .from("revenue_collections")
    .select("id, net_cents, deal_id, account_id, currency")
    .in("external_payment_ref", refs)
    .limit(1);

  return ((data ?? []) as ExistingCollection[])[0] ?? null;
}

/* ------------------------------------------------------------------ */
/*  The two things that can happen                                     */
/* ------------------------------------------------------------------ */

async function applyCollected(
  supabase: SupabaseClient,
  event: CollectionSyncEvent,
): Promise<ApplyResult> {
  const account = await findOrCreateAccount(supabase, event);
  if (!account) {
    return { ok: false, status: "failed", note: "No account could be matched or created for this payment." };
  }

  const deal = await findOrCreateDeal(supabase, event, account.id);
  if (!deal) {
    return {
      ok: false,
      status: "failed",
      accountId: account.id,
      note: "No won deal could be matched, and none could be created — the console has no owner to close it.",
    };
  }

  await stampEvidence(supabase, event, deal.id);

  // Re-derive attribution now that the checkout's own evidence is on the
  // deal. Never locks: settling is a human act. A locked deal is left
  // exactly as it was, which is the point of locking it.
  const attribution = await applyDealAttributionAs(supabase, deal.id);

  const first = await isFirstPayment(supabase, event);
  const row = collectionRowFor(event, { dealId: deal.id, accountId: account.id, isFirstPayment: first });

  const { data: inserted, error } = await supabase
    .from("revenue_collections")
    .insert(row)
    .select("id")
    .maybeSingle();

  let collectionId = (inserted as { id?: string } | null)?.id ?? null;

  if (error) {
    if (error.code === "23505") {
      // Already mirrored under a different event id — a webhook redelivery
      // that arrived as a new Stripe event. Recompute anyway: cheap, and
      // idempotent by design.
      const existing = await findCollection(supabase, event);
      collectionId = existing?.id ?? null;
      if (!collectionId) {
        return { ok: true, status: "ignored", note: "This payment is already in the ledger.", accountId: account.id, dealId: deal.id };
      }
    } else {
      return {
        ok: false,
        status: "failed",
        accountId: account.id,
        dealId: deal.id,
        note: `The collection could not be written (${error.code ?? "unknown"}).`,
      };
    }
  }

  if (!collectionId) {
    return { ok: false, status: "failed", accountId: account.id, dealId: deal.id, note: "The collection could not be written." };
  }

  const entriesWritten = await recompute(supabase, collectionId);
  const review = account.invented || deal.invented;

  const notes = [
    `Account ${account.how}.`,
    deal.invented ? "No won deal existed, so one was created and it pays nobody until sourced_by is set." : "Matched an existing won deal.",
    attribution.locked
      ? "Attribution was already settled and was left alone."
      : `Attribution re-derived: ${attribution.verdict?.rule ?? "unresolved"}.`,
    entriesWritten > 0
      ? `${entriesWritten} commission entry written.`
      : "It pays nobody — unattributed, excluded, or the tail has run out.",
  ];

  return {
    ok: true,
    status: review ? "needs_review" : "applied",
    note: notes.join(" "),
    collectionId,
    dealId: deal.id,
    accountId: account.id,
    entriesWritten,
  };
}

async function applyReversal(
  supabase: SupabaseClient,
  event: CollectionSyncEvent,
): Promise<ApplyResult> {
  const existing = await findCollection(supabase, event);
  const reversal = reversalFor(event, existing);

  if (reversal.mode === "update" && existing) {
    const { error } = await supabase
      .from("revenue_collections")
      .update(reversal.patch)
      .eq("id", existing.id);

    if (error) {
      return { ok: false, status: "failed", note: `The reversal could not be written (${error.code ?? "unknown"}).` };
    }

    const entriesWritten = await recompute(supabase, existing.id);

    return {
      ok: true,
      status: "applied",
      collectionId: existing.id,
      dealId: existing.deal_id ?? undefined,
      accountId: existing.account_id ?? undefined,
      entriesWritten,
      note: `${String(reversal.patch.reversal_reason ?? "Reversed.")} The commission was recomputed against what is left.`,
    };
  }

  // Nothing to reverse. Record it anyway — see the header.
  const { data: inserted, error } = await supabase
    .from("revenue_collections")
    .insert(reversal.mode === "insert" ? reversal.row : {})
    .select("id")
    .maybeSingle();

  if (error && error.code !== "23505") {
    return { ok: false, status: "failed", note: `The orphan reversal could not be recorded (${error.code ?? "unknown"}).` };
  }

  return {
    ok: true,
    status: "needs_review",
    collectionId: (inserted as { id?: string } | null)?.id,
    note: "Money went back out on a payment this ledger never mirrored. Recorded on its own so it is not invisible.",
  };
}

/* ------------------------------------------------------------------ */
/*  The entry point                                                    */
/* ------------------------------------------------------------------ */

export interface ApplyOptions {
  /**
   * A replay from the console. Skips the duplicate check, because the
   * whole point of a replay is that the first attempt got it wrong.
   */
  replay?: boolean;
}

/**
 * Apply one verified sync event.
 *
 * ```ts
 * const result = await applySyncEvent(supabase, event);
 * ```
 *
 * Never throws. The event log row is claimed before any ledger write and
 * updated after, so an event that crashed mid-way is visible as `failed`
 * with its payload intact and can be replayed against fixed code.
 */
export async function applySyncEvent(
  supabase: SupabaseClient,
  event: CollectionSyncEvent,
  options: ApplyOptions = {},
): Promise<ApplyResult> {
  // Claim it first. A second delivery loses here and touches nothing.
  const { error: claimError } = await supabase.from("revenue_sync_events").insert({
    event_id: event.event_id,
    event_type: event.stripe_event_type,
    sync_type: event.type,
    payload: event,
    status: "failed",
    note: "Applying.",
  });

  if (claimError) {
    if (claimError.code === "23505" && !options.replay) {
      return { ok: true, duplicate: true, status: "duplicate", note: "Already applied." };
    }
    if (claimError.code !== "23505") {
      return { ok: false, status: "failed", note: `The event could not be logged (${claimError.code ?? "unknown"}).` };
    }
  }

  let result: ApplyResult;
  try {
    result =
      event.type === "collected" ? await applyCollected(supabase, event) : await applyReversal(supabase, event);
  } catch (err) {
    result = {
      ok: false,
      status: "failed",
      note: `The mapping threw: ${(err as Error).message ?? "unknown"}. The payload is kept; fix and replay.`,
    };
  }

  const patch: Record<string, unknown> = {
    status: result.status === "duplicate" ? "ignored" : result.status,
    note: result.note.slice(0, 2000),
    collection_id: result.collectionId ?? null,
    deal_id: result.dealId ?? null,
    account_id: result.accountId ?? null,
    entries_written: result.entriesWritten ?? 0,
    applied_at: new Date().toISOString(),
  };

  if (options.replay) {
    patch.replayed_at = new Date().toISOString();
  }

  await supabase.from("revenue_sync_events").update(patch).eq("event_id", event.event_id);

  if (options.replay) {
    // Not a column the patch above can express: the count has to read
    // itself. One extra round trip on a button nobody presses often.
    const { data } = await supabase
      .from("revenue_sync_events")
      .select("replay_count")
      .eq("event_id", event.event_id)
      .maybeSingle();

    const count = ((data as { replay_count?: number } | null)?.replay_count ?? 0) + 1;
    await supabase.from("revenue_sync_events").update({ replay_count: count }).eq("event_id", event.event_id);
  }

  return result;
}
