/**
 * The collections sync's boundary: what a signature has to prove, what a
 * payload has to contain, and what a refund does to a ledger.
 *
 * Every case here is a rule that costs money when it breaks. The pure
 * half of the sync lives in `src/lib/growth/collectionsSync.ts` precisely
 * so those rules can be exercised without a database — the service half
 * is mapping and round trips, and mapping bugs are recoverable by replay
 * while an arithmetic bug is not.
 *
 * Run: npm test
 */

import assert from "node:assert/strict";
import crypto from "node:crypto";
import { test } from "node:test";

import {
  collectionMonth,
  collectionRowFor,
  companyDomain,
  computeSignature,
  parseSyncEvent,
  reversalFor,
  verifySyncSignature,
  type CollectionSyncEvent,
} from "@/lib/growth/collectionsSync";

/* ------------------------------------------------------------------ */
/*  Fixtures                                                           */
/* ------------------------------------------------------------------ */

const SECRET = "a-shared-secret-of-at-least-32-characters";
const NOW_MS = 1_770_000_000_000;

function payload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    event_id: "evt_1",
    stripe_event_type: "invoice.paid",
    type: "collected",
    reason: null,
    org_id: "org-uuid",
    org_name: "Northwind Pictures",
    customer_email: "Billing@Northwind.com",
    stripe_customer_id: "cus_1",
    stripe_invoice_id: "in_1",
    payment_ref: "stripe:in_1",
    payment_ref_candidates: ["stripe:in_1", "stripe:ch_1"],
    amount_cents: 10_000,
    discount_cents: 2_000,
    fee_cents: 0,
    currency: "usd",
    promo_code: "AVA20",
    utm_source: "ava-newsletter",
    occurred_at: "2026-08-04T12:00:00.000Z",
    sent_at: "2026-08-04T12:00:05.000Z",
    ...overrides,
  };
}

function event(overrides: Record<string, unknown> = {}): CollectionSyncEvent {
  const parsed = parseSyncEvent(payload(overrides));
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.event;
}

function sign(body: string, timestampSeconds: number): { timestamp: string; signature: string } {
  const timestamp = String(timestampSeconds);
  return { timestamp, signature: computeSignature(SECRET, timestamp, body) };
}

/* ------------------------------------------------------------------ */
/*  Signature                                                          */
/* ------------------------------------------------------------------ */

test("a correctly signed request is accepted", () => {
  const body = JSON.stringify(payload());
  const { timestamp, signature } = sign(body, NOW_MS / 1000);

  const result = verifySyncSignature({ secret: SECRET, timestamp, signature, rawBody: body, nowMs: NOW_MS });
  assert.equal(result.ok, true);
});

test("the body is what is signed, so a changed amount fails", () => {
  const body = JSON.stringify(payload());
  const { timestamp, signature } = sign(body, NOW_MS / 1000);

  // The single most valuable forgery: same event, bigger number.
  const tampered = JSON.stringify(payload({ amount_cents: 1_000_000 }));

  const result = verifySyncSignature({ secret: SECRET, timestamp, signature, rawBody: tampered, nowMs: NOW_MS });
  assert.equal(result.ok, false);
  assert.equal(result.error, "bad_signature");
});

test("a captured request cannot be replayed tomorrow", () => {
  const body = JSON.stringify(payload());
  const { timestamp, signature } = sign(body, NOW_MS / 1000 - 3_600);

  const result = verifySyncSignature({ secret: SECRET, timestamp, signature, rawBody: body, nowMs: NOW_MS });
  assert.equal(result.ok, false);
  assert.equal(result.error, "stale");
});

test("a clock a minute out on either side is still fine", () => {
  const body = JSON.stringify(payload());

  for (const skew of [-60, 60]) {
    const { timestamp, signature } = sign(body, NOW_MS / 1000 + skew);
    const result = verifySyncSignature({ secret: SECRET, timestamp, signature, rawBody: body, nowMs: NOW_MS });
    assert.equal(result.ok, true, `skew ${skew} should be accepted`);
  }
});

test("another secret does not open the door", () => {
  const body = JSON.stringify(payload());
  const timestamp = String(NOW_MS / 1000);
  const signature = crypto.createHmac("sha256", "the-wrong-secret").update(`${timestamp}.${body}`).digest("hex");

  const result = verifySyncSignature({ secret: SECRET, timestamp, signature, rawBody: body, nowMs: NOW_MS });
  assert.equal(result.ok, false);
  assert.equal(result.error, "bad_signature");
});

test("no secret configured fails closed rather than open", () => {
  const body = JSON.stringify(payload());
  const { timestamp, signature } = sign(body, NOW_MS / 1000);

  const result = verifySyncSignature({ secret: "", timestamp, signature, rawBody: body, nowMs: NOW_MS });
  assert.equal(result.ok, false);
  assert.equal(result.error, "no_secret");
});

test("a missing signature header is refused before anything else", () => {
  const result = verifySyncSignature({
    secret: SECRET,
    timestamp: String(NOW_MS / 1000),
    signature: null,
    rawBody: "{}",
    nowMs: NOW_MS,
  });
  assert.equal(result.ok, false);
  assert.equal(result.error, "missing_headers");
});

/* ------------------------------------------------------------------ */
/*  Shape                                                              */
/* ------------------------------------------------------------------ */

test("an event with no id is refused, because it could not be applied once", () => {
  const parsed = parseSyncEvent(payload({ event_id: null }));
  assert.equal(parsed.ok, false);
});

test("an event with no payment reference is refused", () => {
  const parsed = parseSyncEvent(payload({ payment_ref: "" }));
  assert.equal(parsed.ok, false);
});

test("a missing org name is not a reason to lose a payment", () => {
  const parsed = parseSyncEvent(payload({ org_name: null, promo_code: null, utm_source: null }));
  assert.equal(parsed.ok, true);
});

test("currency is normalised and email is lowercased", () => {
  const parsed = event();
  assert.equal(parsed.currency, "USD");
  assert.equal(parsed.customer_email, "billing@northwind.com");
});

/* ------------------------------------------------------------------ */
/*  Mapping                                                            */
/* ------------------------------------------------------------------ */

test("a personal mailbox is not a company", () => {
  assert.equal(companyDomain("someone@gmail.com"), null);
  assert.equal(companyDomain("someone@icloud.com"), null);
  assert.equal(companyDomain("billing@northwind.com"), "northwind.com");
  assert.equal(companyDomain(null), null);
});

test("the collection month is the first of the month the money landed in", () => {
  assert.equal(collectionMonth("2026-08-31T23:30:00.000Z"), "2026-08-01");
  assert.equal(collectionMonth("2026-01-01T00:00:00.000Z"), "2026-01-01");
});

test("commission is calculated on the amount net of discount, and the fee is not deducted", () => {
  const row = collectionRowFor(event({ fee_cents: 320 }), {
    dealId: "deal-1",
    accountId: "account-1",
    isFirstPayment: true,
  });

  // Gross is what it would have been without the discount; net is what
  // the agreement pays on. The processor fee is recorded beside them and
  // deliberately left out of the basis.
  assert.equal(row.gross_cents, 12_000);
  assert.equal(row.discount_cents, 2_000);
  assert.equal(row.net_cents, 10_000);
  assert.equal(row.fee_cents, 320);
  assert.equal(row.source, "stripe");
  assert.equal(row.status, "collected");
  assert.equal(row.is_first_payment, true);
  assert.equal(row.external_payment_ref, "stripe:in_1");
  assert.equal(row.external_customer_ref, "org-uuid");
});

/* ------------------------------------------------------------------ */
/*  Reversals                                                          */
/* ------------------------------------------------------------------ */

const existing = {
  id: "collection-1",
  net_cents: 10_000,
  deal_id: "deal-1",
  account_id: "account-1",
  currency: "USD",
};

test("a refund updates the collection it reverses rather than adding a row", () => {
  const reversal = reversalFor(
    event({ type: "refunded", reason: "refund", amount_cents: 4_000 }),
    existing,
  );

  assert.equal(reversal.mode, "update");
  if (reversal.mode !== "update") return;
  assert.equal(reversal.patch.refunded_cents, 4_000);
  assert.equal(reversal.patch.status, "refunded");
});

test("a reversal larger than the collection cannot drive the basis below zero", () => {
  const reversal = reversalFor(
    event({ type: "disputed", reason: "dispute_lost", amount_cents: 15_000 }),
    existing,
  );

  assert.equal(reversal.mode, "update");
  if (reversal.mode !== "update") return;
  assert.equal(reversal.patch.refunded_cents, 10_000);
  assert.equal(reversal.patch.status, "charged_back");
});

test("a dispute we won puts the collection back exactly as it was", () => {
  const reversal = reversalFor(
    event({ type: "disputed", reason: "dispute_won", amount_cents: 0 }),
    existing,
  );

  assert.equal(reversal.mode, "update");
  if (reversal.mode !== "update") return;
  assert.equal(reversal.patch.status, "collected");
  assert.equal(reversal.patch.refunded_cents, 0);
  assert.equal(reversal.patch.reversed_at, null);
});

test("a refund with no collection to reverse is recorded on its own, worth nothing", () => {
  const reversal = reversalFor(
    event({ type: "refunded", reason: "refund", amount_cents: 4_000 }),
    null,
  );

  assert.equal(reversal.mode, "insert");
  if (reversal.mode !== "insert") return;

  // Worth zero on both sides so it pays nobody and cannot be mistaken for
  // income, and keyed so it can never collide with the collection it
  // failed to find.
  assert.equal(reversal.row.gross_cents, 0);
  assert.equal(reversal.row.net_cents, 0);
  assert.equal(reversal.row.refunded_cents, 4_000);
  assert.equal(reversal.row.status, "refunded");
  assert.equal(reversal.row.deal_id, null);
  assert.equal(reversal.row.external_payment_ref, "stripe:reversal:in_1");
  assert.equal(reversal.row.is_first_payment, false);
});
