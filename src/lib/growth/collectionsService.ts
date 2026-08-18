/**
 * Getting a payment into the ledger by hand.
 *
 * THE GAP THIS FILLS, AND THE ONE IT DOES NOT
 *
 * `revenue_collections` is the only thing the commission ledger pays on,
 * and until this file nothing wrote to it. The whole chain existed —
 * terms, entries, payouts, statements, the recompute function, the equity
 * tranches — with no producer at the top, which meant every downstream
 * number was structurally correct and permanently zero. A ledger nobody
 * can put a payment into is a schema, not a ledger.
 *
 * The real producer is a Stripe-to-DOCS sync: checkout happens in the
 * product's Supabase project, this is the marketing project, and the two
 * only speak through the promo admin proxy, which reports campaigns and
 * codes and no redemptions at all. That sync does not exist. It is the
 * open gap, it is named in docs/plans/crm-hubspot-parity.md, and this
 * file is not it.
 *
 * What this is: an owner typing in a payment they can see in Stripe, so
 * the first commission statement has something in it and the arithmetic
 * gets exercised against a real deal before anybody is owed money by it.
 * `source` is stamped `manual` precisely so the sync, when it arrives,
 * can tell what it did not put there.
 *
 * WHY ONLY AN OWNER
 *
 * Every row here is money somebody is paid on. A partner who could insert
 * one could pay themselves, and the RLS on the table already says so —
 * this check is the sentence a person reads instead of a policy
 * violation.
 */

import { createClient } from "@/utils/supabase/server";
import { readConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";

export interface RecordCollectionInput {
  /** A won deal. Anything else pays nobody, so it is refused rather than stored. */
  dealId: string;
  /**
   * The processor's own id — a Stripe `pi_...` or `in_...`. Unique on the
   * table, which is what makes re-entering the same payment a no-op
   * rather than double pay. Absent means a generated `manual:` ref, which
   * cannot collide but also cannot be reconciled, so supplying the real
   * one is always better.
   */
  externalPaymentRef?: string;
  /** ISO instant. Decides which month's statement it lands on. */
  collectedAt: string;
  grossCents: number;
  /** Discount applied at checkout. Commission is calculated net of this. */
  discountCents?: number;
  /** Processor fee, recorded and deliberately not deducted from the basis. */
  feeCents?: number;
  currency?: string;
  note?: string;
}

export interface RecordCollectionResult {
  ok: boolean;
  error?: string;
  collectionId?: string;
  /** How many commission entries the recompute wrote. Zero is a real answer. */
  entriesWritten?: number;
  /** Present when the recompute wrote nothing and the reason is knowable. */
  notice?: string;
}

/** First of the month the payment landed in, as a date string. */
function collectionMonth(collectedAt: Date): string {
  return `${collectedAt.getUTCFullYear()}-${String(collectedAt.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

function cents(value: number | undefined, fallback = 0): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.round(value));
}

/**
 * Record a collected payment against a won deal and recompute what it owes.
 *
 * ```ts
 * const result = await recordCollection({
 *   dealId,
 *   externalPaymentRef: "pi_3Q...",
 *   collectedAt: "2026-08-04T00:00:00.000Z",
 *   grossCents: 249_00,
 *   discountCents: 25_00,
 * });
 * ```
 *
 * Never throws. `entriesWritten: 0` with no error is a real and common
 * outcome — a carved-out account, a comped one, an unattributed deal or a
 * tail that has run out all pay nothing, and each of those is the ledger
 * working rather than failing.
 */
export async function recordCollection(
  input: RecordCollectionInput
): Promise<RecordCollectionResult> {
  const supabase = await createClient();
  const user = await readConsoleUser(supabase);

  if (!user) return { ok: false, error: "Sign in again to carry on." };
  if (!can(user, "commission.manage")) {
    return { ok: false, error: "Only an owner records a collection." };
  }

  const collectedAt = new Date(input.collectedAt);
  if (Number.isNaN(collectedAt.getTime())) {
    return { ok: false, error: "That is not a date the ledger can read." };
  }

  const gross = cents(input.grossCents);
  const discount = cents(input.discountCents);
  if (gross <= 0) return { ok: false, error: "A collection has to be worth something." };
  if (discount > gross) {
    return { ok: false, error: "The discount is larger than the payment." };
  }

  const { data: deal } = await supabase
    .from("crm_deals")
    .select("id, account_id, stage, currency, external_customer_ref")
    .eq("id", input.dealId)
    .maybeSingle();

  if (!deal) return { ok: false, error: "That deal is not available." };

  // A collection on an open deal would sit in the ledger paying nothing
  // and then start paying the day somebody marked it won, which is a
  // surprise nobody asked for.
  if (deal.stage !== "won") {
    return { ok: false, error: "Record a collection once the deal is won." };
  }

  const customerRef = (deal.external_customer_ref as string | null) ?? null;

  // The twelve month tail runs from the customer's first payment, so
  // whether this is that payment has to be stamped rather than guessed
  // later. Absent a customer reference there is nothing to group by, and
  // the honest answer is that we do not know it is the first.
  let isFirstPayment = false;
  if (customerRef) {
    const { count } = await supabase
      .from("revenue_collections")
      .select("id", { count: "exact", head: true })
      .eq("external_customer_ref", customerRef)
      .lte("collected_at", collectedAt.toISOString());
    isFirstPayment = (count ?? 0) === 0;
  }

  const paymentRef =
    input.externalPaymentRef?.trim() ||
    `manual:${input.dealId}:${collectedAt.toISOString()}`;

  const { data: inserted, error } = await supabase
    .from("revenue_collections")
    .insert({
      external_payment_ref: paymentRef,
      external_customer_ref: customerRef,
      deal_id: deal.id,
      account_id: deal.account_id,
      collected_at: collectedAt.toISOString(),
      collection_month: collectionMonth(collectedAt),
      gross_cents: gross,
      discount_cents: discount,
      fee_cents: cents(input.feeCents),
      // Gross less checkout discount. Processor fees are recorded above
      // and deliberately not deducted — see the ledger migration.
      net_cents: gross - discount,
      currency: (input.currency || (deal.currency as string) || "USD").toUpperCase().slice(0, 3),
      status: "collected",
      is_first_payment: isFirstPayment,
      source: "manual",
      raw: { entered_by: user.userId, note: input.note?.slice(0, 500) ?? null },
    })
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "That payment is already in the ledger." };
    }
    if (error.code === "42501") {
      return { ok: false, error: "You may not write to the ledger." };
    }
    return { ok: false, error: "Could not record the collection. Try again." };
  }

  if (!inserted?.id) {
    return { ok: false, error: "Could not record the collection. Try again." };
  }

  // The entries do not appear on their own. Recompute is idempotent by
  // design, so a failure here is recoverable by running it again rather
  // than by unpicking a half-written ledger.
  const { data: written, error: recomputeError } = await supabase.rpc(
    "commission_recompute_as_owner",
    { p_collection_id: inserted.id }
  );

  if (recomputeError) {
    return {
      ok: true,
      collectionId: inserted.id,
      entriesWritten: 0,
      notice:
        "The payment was recorded but commission could not be computed. Recompute it before the next payout.",
    };
  }

  const entriesWritten = typeof written === "number" ? written : 0;

  return {
    ok: true,
    collectionId: inserted.id,
    entriesWritten,
    notice:
      entriesWritten === 0
        ? "Recorded. It pays nobody — the account is excluded, the deal is unattributed, it has no sourcer, or the commission tail has run out."
        : undefined,
  };
}
