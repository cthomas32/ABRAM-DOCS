/**
 * Reading a payment that happened somewhere else.
 *
 * abram-network owns Stripe. It queues every cash event and posts it here
 * signed. This file is everything about that message that can be decided
 * without a database — the signature, the shape, the arithmetic — kept
 * apart from `collectionsSyncService.ts` so the parts that are worth
 * arguing about can be read and tested on their own.
 *
 * THE SIGNATURE COVERS THE TIMESTAMP
 *
 * HMAC-SHA256 over `<timestamp>.<body>`, the shape Stripe and Slack both
 * use. Signing only the body means a captured request can be replayed
 * forever by editing a header; signing the timestamp with it means a
 * replay has to forge the signature, which is the whole point of having
 * one. The window is five minutes each way — "each way" because a clock
 * that is thirty seconds fast on one side is a fact of life and not an
 * attack.
 *
 * WHY THE COMPARISON IS CONSTANT TIME
 *
 * A byte-by-byte early return leaks how much of a guess was right, and a
 * few thousand requests turn that into the signature. `timingSafeEqual`
 * costs nothing and closes it.
 *
 * WHAT A REVERSAL IS
 *
 * Not a negative collection. The ledger computes commission on
 * `net_cents - refunded_cents` off the collection row itself, so a refund
 * is an UPDATE to the row it reverses followed by a recompute, which
 * voids or reduces the entry. A separate negative row would be invisible
 * to that arithmetic and would also corrupt "which payment was first",
 * which is what the twelve-month tail runs from.
 *
 * A reversal whose collection we never saw is the one case that does
 * insert: a standalone row worth nothing, flagged, so the money going out
 * is on the record even though the money coming in never was.
 */

import crypto from "node:crypto";

/* ------------------------------------------------------------------ */
/*  The message                                                        */
/* ------------------------------------------------------------------ */

export type SyncType = "collected" | "refunded" | "disputed";

export type SyncReason =
  | "refund"
  | "dispute_opened"
  | "dispute_lost"
  | "dispute_won"
  | null;

export interface CollectionSyncEvent {
  event_id: string;
  stripe_event_type: string;
  type: SyncType;
  reason: SyncReason;

  org_id: string | null;
  org_name: string | null;
  customer_email: string | null;
  entity_id: string | null;

  stripe_customer_id: string | null;
  stripe_invoice_id: string | null;
  stripe_charge_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  stripe_subscription_id: string | null;

  payment_ref: string;
  payment_ref_candidates: string[];

  amount_cents: number;
  discount_cents: number;
  fee_cents: number;
  currency: string;

  promo_code: string | null;
  utm_source: string | null;
  plan_tier: string | null;
  billing_interval: string | null;

  occurred_at: string;
  sent_at: string | null;
}

/* ------------------------------------------------------------------ */
/*  Signature                                                          */
/* ------------------------------------------------------------------ */

export interface VerifyInput {
  secret: string;
  timestamp: string | null;
  signature: string | null;
  rawBody: string;
  /** Injectable so the window can be tested without waiting five minutes. */
  nowMs?: number;
  toleranceSeconds?: number;
}

export interface VerifyResult {
  ok: boolean;
  /** A short machine reason. Never returned to the caller — logged only. */
  error?: "no_secret" | "missing_headers" | "stale" | "bad_signature";
}

export const SIGNATURE_TOLERANCE_SECONDS = 300;

/** The signature abram-network sends, computed here to compare against. */
export function computeSignature(secret: string, timestamp: string, rawBody: string): string {
  return crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
}

/**
 * Is this really from abram-network, and is it recent?
 *
 * ```ts
 * const check = verifySyncSignature({
 *   secret: process.env.DOCS_COLLECTIONS_SYNC_SECRET ?? "",
 *   timestamp: request.headers.get("x-abram-sync-timestamp"),
 *   signature: request.headers.get("x-abram-sync-signature"),
 *   rawBody,
 * });
 * ```
 *
 * A missing secret fails closed. It is the one configuration mistake that
 * would otherwise turn a money endpoint into an open one.
 */
export function verifySyncSignature(input: VerifyInput): VerifyResult {
  const { secret, timestamp, signature, rawBody } = input;

  if (!secret) return { ok: false, error: "no_secret" };
  if (!timestamp || !signature) return { ok: false, error: "missing_headers" };

  const sent = Number(timestamp);
  if (!Number.isFinite(sent)) return { ok: false, error: "missing_headers" };

  const now = Math.floor((input.nowMs ?? Date.now()) / 1000);
  const tolerance = input.toleranceSeconds ?? SIGNATURE_TOLERANCE_SECONDS;
  if (Math.abs(now - sent) > tolerance) return { ok: false, error: "stale" };

  const expected = computeSignature(secret, timestamp, rawBody);

  // Same length is a precondition of timingSafeEqual, and a wrong length
  // is a wrong signature, so checking it first leaks nothing.
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return { ok: false, error: "bad_signature" };
  if (!crypto.timingSafeEqual(a, b)) return { ok: false, error: "bad_signature" };

  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  Shape                                                              */
/* ------------------------------------------------------------------ */

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function cents(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

/**
 * The message as a value, or a sentence saying what is wrong with it.
 *
 * Everything optional is defaulted rather than rejected — a payload
 * missing an org name is still a payment, and refusing it would lose the
 * money over a label. What cannot be defaulted is refused: an event with
 * no id cannot be made idempotent, and one with no payment reference
 * cannot be reconciled against Stripe.
 */
export function parseSyncEvent(input: unknown): { ok: true; event: CollectionSyncEvent } | { ok: false; error: string } {
  if (!input || typeof input !== "object") return { ok: false, error: "The body is not an object." };
  const raw = input as Record<string, unknown>;

  const eventId = text(raw.event_id);
  if (!eventId) return { ok: false, error: "No event_id, so this could not be applied only once." };

  const type = text(raw.type);
  if (type !== "collected" && type !== "refunded" && type !== "disputed") {
    return { ok: false, error: `Unknown event type ${type ?? "(none)"}.` };
  }

  const paymentRef = text(raw.payment_ref);
  if (!paymentRef) return { ok: false, error: "No payment_ref, so nothing can be reconciled against Stripe." };

  const occurredAt = text(raw.occurred_at);
  if (!occurredAt || Number.isNaN(new Date(occurredAt).getTime())) {
    return { ok: false, error: "occurred_at is not a date, and it decides which month's statement this lands on." };
  }

  const candidates = Array.isArray(raw.payment_ref_candidates)
    ? (raw.payment_ref_candidates as unknown[]).map(text).filter((v): v is string => Boolean(v))
    : [];

  const reason = text(raw.reason);

  return {
    ok: true,
    event: {
      event_id: eventId,
      stripe_event_type: text(raw.stripe_event_type) ?? "unknown",
      type,
      reason:
        reason === "refund" || reason === "dispute_opened" || reason === "dispute_lost" || reason === "dispute_won"
          ? reason
          : null,

      org_id: text(raw.org_id),
      org_name: text(raw.org_name),
      customer_email: text(raw.customer_email)?.toLowerCase() ?? null,
      entity_id: text(raw.entity_id),

      stripe_customer_id: text(raw.stripe_customer_id),
      stripe_invoice_id: text(raw.stripe_invoice_id),
      stripe_charge_id: text(raw.stripe_charge_id),
      stripe_payment_intent_id: text(raw.stripe_payment_intent_id),
      stripe_checkout_session_id: text(raw.stripe_checkout_session_id),
      stripe_subscription_id: text(raw.stripe_subscription_id),

      payment_ref: paymentRef,
      payment_ref_candidates: candidates.length > 0 ? candidates : [paymentRef],

      amount_cents: cents(raw.amount_cents),
      discount_cents: cents(raw.discount_cents),
      fee_cents: cents(raw.fee_cents),
      currency: (text(raw.currency) ?? "USD").toUpperCase().slice(0, 3),

      promo_code: text(raw.promo_code),
      utm_source: text(raw.utm_source),
      plan_tier: text(raw.plan_tier),
      billing_interval: text(raw.billing_interval),

      occurred_at: new Date(occurredAt).toISOString(),
      sent_at: text(raw.sent_at),
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Mapping helpers                                                    */
/* ------------------------------------------------------------------ */

/** First of the month the payment landed in. Payouts are keyed to it. */
export function collectionMonth(collectedAt: string | Date): string {
  const date = typeof collectedAt === "string" ? new Date(collectedAt) : collectedAt;
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

/**
 * The references an account might already be filed under, most specific
 * first. The org id is the product's own primary key and never moves; a
 * Stripe customer id is stable too but is created later and can be
 * replaced when a customer is re-created.
 */
export function accountRefsFor(event: CollectionSyncEvent): string[] {
  return Array.from(
    new Set([event.org_id, event.entity_id, event.stripe_customer_id].filter((v): v is string => Boolean(v))),
  );
}

/** The domain half of an email, lowercased. Null for the free providers. */
const PUBLIC_MAILBOXES = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "yahoo.com",
  "icloud.com",
  "me.com",
  "proton.me",
  "protonmail.com",
  "aol.com",
]);

/**
 * The company an email belongs to, or null.
 *
 * A personal mailbox is not a company. Matching an account on gmail.com
 * would file every sole trader's payment against whichever one signed up
 * first, which is worse than not matching at all — an unmatched payment
 * gets flagged, a wrongly matched one pays somebody.
 */
export function companyDomain(email: string | null): string | null {
  if (!email) return null;
  const at = email.lastIndexOf("@");
  if (at < 1) return null;
  const domain = email.slice(at + 1).trim().toLowerCase();
  if (!domain || !domain.includes(".")) return null;
  return PUBLIC_MAILBOXES.has(domain) ? null : domain;
}

/* ------------------------------------------------------------------ */
/*  Rows                                                               */
/* ------------------------------------------------------------------ */

export interface CollectionRowContext {
  dealId: string | null;
  accountId: string | null;
  /** Stamped once by the sync. The twelve month tail runs from it. */
  isFirstPayment: boolean;
}

/** The `revenue_collections` insert for a payment that arrived. */
export function collectionRowFor(
  event: CollectionSyncEvent,
  context: CollectionRowContext,
): Record<string, unknown> {
  const gross = event.amount_cents + event.discount_cents;

  return {
    external_payment_ref: event.payment_ref,
    external_customer_ref: event.org_id ?? event.stripe_customer_id ?? null,
    external_invoice_ref: event.stripe_invoice_id,
    deal_id: context.dealId,
    account_id: context.accountId,
    collected_at: event.occurred_at,
    collection_month: collectionMonth(event.occurred_at),
    gross_cents: gross,
    discount_cents: event.discount_cents,
    fee_cents: event.fee_cents,
    // Gross less the discount taken at checkout, which is what the
    // agreement pays on. Processor fees are recorded and NOT deducted.
    net_cents: event.amount_cents,
    currency: event.currency,
    status: "collected",
    is_first_payment: context.isFirstPayment,
    source: "stripe",
    raw: {
      event_id: event.event_id,
      stripe_event_type: event.stripe_event_type,
      stripe_customer_id: event.stripe_customer_id,
      stripe_charge_id: event.stripe_charge_id,
      stripe_payment_intent_id: event.stripe_payment_intent_id,
      stripe_checkout_session_id: event.stripe_checkout_session_id,
      stripe_subscription_id: event.stripe_subscription_id,
      payment_ref_candidates: event.payment_ref_candidates,
      promo_code: event.promo_code,
      utm_source: event.utm_source,
      plan_tier: event.plan_tier,
      billing_interval: event.billing_interval,
      org_name: event.org_name,
    },
  };
}

export type Reversal =
  | { mode: "update"; patch: Record<string, unknown> }
  | { mode: "insert"; row: Record<string, unknown> };

export interface ExistingCollection {
  id: string;
  net_cents: number;
  deal_id: string | null;
  account_id: string | null;
  currency: string;
}

/**
 * What a refund or a chargeback does to the ledger.
 *
 * ```ts
 * const reversal = reversalFor(event, existing);
 * ```
 *
 * Against a collection we hold, it is an UPDATE — see the header: the
 * commission arithmetic reads `net_cents - refunded_cents` off this row,
 * so the reversal has to live on it. `refunded_cents` is Stripe's
 * cumulative figure and is stored rather than added to, which is what
 * makes a redelivered refund harmless.
 *
 * A dispute we won puts the row back exactly as it was, because that is
 * what winning means.
 *
 * With no collection to reverse it is an INSERT worth nothing: the money
 * going out is recorded even though the money coming in never was, and
 * flagged so somebody finds out why.
 */
export function reversalFor(event: CollectionSyncEvent, existing: ExistingCollection | null): Reversal {
  const chargeback = event.type === "disputed";

  if (event.reason === "dispute_won") {
    if (!existing) {
      return {
        mode: "insert",
        row: orphanReversalRow(event, 0, "collected", "A dispute was won on a payment this ledger never saw."),
      };
    }
    return {
      mode: "update",
      patch: {
        status: "collected",
        refunded_cents: 0,
        reversed_at: null,
        reversal_reason: "Dispute won; the payment stands.",
      },
    };
  }

  const reason =
    event.reason === "dispute_lost"
      ? "Chargeback lost."
      : event.reason === "dispute_opened"
        ? "Chargeback opened; the payment is contested."
        : "Refunded in Stripe.";

  if (!existing) {
    return {
      mode: "insert",
      row: orphanReversalRow(
        event,
        event.amount_cents,
        chargeback ? "charged_back" : "refunded",
        `${reason} No matching collection was ever mirrored, so this row records the reversal alone.`,
      ),
    };
  }

  return {
    mode: "update",
    patch: {
      // Cumulative from Stripe, never additive. Capped at what was
      // collected: a dispute amount can exceed the net figure once fees
      // are involved, and a basis below zero is not a thing.
      refunded_cents: Math.min(event.amount_cents, existing.net_cents),
      status: chargeback ? "charged_back" : "refunded",
      reversed_at: event.occurred_at,
      reversal_reason: reason,
    },
  };
}

/**
 * A reversal with nothing to reverse.
 *
 * Worth zero on both sides so it pays nobody and cannot be mistaken for
 * income, keyed on `stripe:reversal:<ref>` so it can never collide with
 * the collection it failed to find.
 */
function orphanReversalRow(
  event: CollectionSyncEvent,
  refunded: number,
  status: string,
  note: string,
): Record<string, unknown> {
  return {
    external_payment_ref: `stripe:reversal:${event.payment_ref.replace(/^stripe:/, "")}`,
    external_customer_ref: event.org_id ?? event.stripe_customer_id ?? null,
    external_invoice_ref: event.stripe_invoice_id,
    deal_id: null,
    account_id: null,
    collected_at: event.occurred_at,
    collection_month: collectionMonth(event.occurred_at),
    gross_cents: 0,
    discount_cents: 0,
    fee_cents: 0,
    net_cents: 0,
    currency: event.currency,
    status,
    refunded_cents: refunded,
    reversed_at: status === "collected" ? null : event.occurred_at,
    reversal_reason: note,
    is_first_payment: false,
    source: "stripe",
    raw: {
      event_id: event.event_id,
      stripe_event_type: event.stripe_event_type,
      orphan_reversal: true,
      payment_ref_candidates: event.payment_ref_candidates,
    },
  };
}
