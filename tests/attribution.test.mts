/**
 * The attribution rules, tested.
 *
 * These are the only tests in the repository, and they are here rather
 * than somewhere more useful because this is the code where being wrong
 * costs money to a specific person who will notice. Everything else can
 * be checked by opening a page.
 *
 * No test framework: Node's own runner, and TypeScript stripped by the
 * runtime. `npm test`.
 *
 * Every date below is fixed. A test that reads the wall clock passes on
 * a Tuesday and fails on a Saturday, and the business-day arithmetic
 * under test is exactly the sort of thing that would.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  resolveAttribution,
  registrationState,
  declineDeadlineFrom,
  registrationExpiryFrom,
  type AttributionEvidence,
  type AttributionOwnership,
} from "../src/lib/crm/attribution.ts";

const AVA = "11111111-1111-1111-1111-111111111111";
const CONNOR = "22222222-2222-2222-2222-222222222222";

const OWNERSHIP: AttributionOwnership = {
  promoCodeOwners: { ava10: AVA },
  utmSourceOwners: { ava: AVA, "ava-newsletter": AVA },
};

const NO_OWNERSHIP: AttributionOwnership = { promoCodeOwners: {}, utmSourceOwners: {} };

/** A Wednesday, so the business-day arithmetic has a weekend to cross. */
const WED = new Date("2026-08-05T12:00:00.000Z");

function evidence(over: Partial<AttributionEvidence> = {}): AttributionEvidence {
  return { now: WED, ...over };
}

/* ------------------------------------------------------------------ */
/*  First match governs                                                */
/* ------------------------------------------------------------------ */

test("a redeemed promo code wins outright", () => {
  const verdict = resolveAttribution(
    evidence({ redeemedPromoCode: "AVA10", utmSource: "ava" }),
    OWNERSHIP
  );

  assert.equal(verdict.rule, "promo_code");
  assert.equal(verdict.userId, AVA);
  assert.equal(verdict.ref, "ava10");
  // Nothing was tested before it, so nothing was rejected.
  assert.deepEqual(verdict.rejected, []);
});

test("a code nobody owns falls through to the link, and says why", () => {
  const verdict = resolveAttribution(
    evidence({ redeemedPromoCode: "LAUNCH50", utmSource: "ava" }),
    OWNERSHIP
  );

  assert.equal(verdict.rule, "utm_link");
  assert.equal(verdict.userId, AVA);
  assert.equal(verdict.rejected.length, 1);
  assert.match(verdict.rejected[0].reason, /belongs to nobody/);
});

test("nothing at all is unattributed, with all three rejections listed", () => {
  const verdict = resolveAttribution(evidence(), NO_OWNERSHIP);

  assert.equal(verdict.rule, "unattributed");
  assert.equal(verdict.userId, null);
  assert.deepEqual(
    verdict.rejected.map((r) => r.rule),
    ["promo_code", "utm_link", "registered_account"]
  );
});

test("keys match case-insensitively and ignore surrounding space", () => {
  const verdict = resolveAttribution(evidence({ redeemedPromoCode: "  Ava10 " }), OWNERSHIP);
  assert.equal(verdict.userId, AVA);
});

/* ------------------------------------------------------------------ */
/*  Rule three, and the clocks that decide it                          */
/* ------------------------------------------------------------------ */

/** Filed 30 days before "now", with both clocks resolved as they would be. */
function registration(over: Record<string, unknown> = {}) {
  const filedAt = new Date("2026-07-06T12:00:00.000Z");
  return {
    id: "reg-1",
    requestedBy: AVA,
    requestedAt: filedAt.toISOString(),
    status: "pending",
    declineDeadlineAt: declineDeadlineFrom(filedAt).toISOString(),
    expiresAt: registrationExpiryFrom(filedAt).toISOString(),
    ...over,
  };
}

test("a pending registration nobody declined in time still pays", () => {
  const verdict = resolveAttribution(
    evidence({ registration: registration(), closedAt: WED.toISOString() }),
    NO_OWNERSHIP
  );

  assert.equal(verdict.rule, "registered_account");
  assert.equal(verdict.userId, AVA);
  assert.equal(verdict.ref, "reg-1");
  assert.match(verdict.reason, /Nobody declined it inside the window/);
});

test("a pending registration still inside the decline window does not pay yet", () => {
  const filedAt = new Date("2026-08-04T12:00:00.000Z"); // yesterday
  const verdict = resolveAttribution(
    evidence({
      registration: registration({
        requestedAt: filedAt.toISOString(),
        declineDeadlineAt: declineDeadlineFrom(filedAt).toISOString(),
        expiresAt: registrationExpiryFrom(filedAt).toISOString(),
      }),
    }),
    NO_OWNERSHIP
  );

  assert.equal(verdict.rule, "unattributed");
  assert.match(verdict.rejected.at(-1)!.reason, /pending, not approved/);
});

test("a declined registration pays nothing however long ago it was filed", () => {
  const verdict = resolveAttribution(
    evidence({ registration: registration({ status: "declined" }) }),
    NO_OWNERSHIP
  );

  assert.equal(verdict.rule, "unattributed");
  assert.match(verdict.rejected.at(-1)!.reason, /declined, not approved/);
});

test("a converted registration is not a rejection — converting is downstream of approval", () => {
  const verdict = resolveAttribution(
    evidence({ registration: registration({ status: "converted" }), closedAt: WED.toISOString() }),
    NO_OWNERSHIP
  );

  assert.equal(verdict.rule, "registered_account");
});

test("registration filed after first contact is refused", () => {
  const verdict = resolveAttribution(
    evidence({
      registration: registration({ status: "approved" }),
      accountFirstContactAt: "2026-07-01T12:00:00.000Z",
      closedAt: WED.toISOString(),
    }),
    NO_OWNERSHIP
  );

  assert.equal(verdict.rule, "unattributed");
  assert.match(verdict.rejected.at(-1)!.reason, /after first contact/);
});

test("closing on the 120th day pays and the 121st does not", () => {
  const filedAt = new Date("2026-01-01T00:00:00.000Z");
  const base = registration({
    status: "approved",
    requestedAt: filedAt.toISOString(),
    declineDeadlineAt: declineDeadlineFrom(filedAt).toISOString(),
    expiresAt: registrationExpiryFrom(filedAt).toISOString(),
  });

  const onTime = resolveAttribution(
    evidence({
      now: new Date("2026-05-01T00:00:00.000Z"),
      registration: base,
      // Exactly 120 days after filing.
      closedAt: "2026-05-01T00:00:00.000Z",
    }),
    NO_OWNERSHIP
  );
  assert.equal(onTime.rule, "registered_account");

  const late = resolveAttribution(
    evidence({
      now: new Date("2026-05-02T00:00:00.000Z"),
      registration: base,
      closedAt: "2026-05-02T00:00:01.000Z",
    }),
    NO_OWNERSHIP
  );
  assert.equal(late.rule, "unattributed");
  assert.match(late.rejected.at(-1)!.reason, /past the 120 day window/);
});

test("the 120 day rule bites even when the stored expiry is generous", () => {
  // Two clocks can disagree: `expires_at` is stored when the registration
  // is filed and a row written by hand or by an earlier version can carry
  // a longer one. The rule in the agreement is 120 days, and it wins.
  const filedAt = new Date("2026-01-01T00:00:00.000Z");
  const verdict = resolveAttribution(
    evidence({
      now: new Date("2026-06-01T00:00:00.000Z"),
      registration: registration({
        status: "approved",
        requestedAt: filedAt.toISOString(),
        declineDeadlineAt: declineDeadlineFrom(filedAt).toISOString(),
        expiresAt: "2027-01-01T00:00:00.000Z",
      }),
      closedAt: "2026-06-01T00:00:00.000Z",
    }),
    NO_OWNERSHIP
  );

  assert.equal(verdict.rule, "unattributed");
  assert.match(verdict.rejected.at(-1)!.reason, /151 days after registration/);
});

test("an open deal is tested against today, so a lapsed window is visible before the close", () => {
  const filedAt = new Date("2026-01-01T00:00:00.000Z");
  const verdict = resolveAttribution(
    evidence({
      now: new Date("2026-08-05T00:00:00.000Z"),
      registration: registration({
        status: "approved",
        requestedAt: filedAt.toISOString(),
        declineDeadlineAt: declineDeadlineFrom(filedAt).toISOString(),
        expiresAt: registrationExpiryFrom(filedAt).toISOString(),
      }),
      closedAt: null,
    }),
    NO_OWNERSHIP
  );

  assert.equal(verdict.rule, "unattributed");
});

test("without a decline deadline the rules fall back to the stored status", () => {
  // Under-paying is recoverable. Auto-approving against a deadline that
  // was never recorded is not, so absence must not grant.
  const verdict = resolveAttribution(
    evidence({
      registration: {
        id: "reg-legacy",
        requestedBy: AVA,
        requestedAt: "2026-01-01T00:00:00.000Z",
        status: "pending",
        expiresAt: "2026-12-31T00:00:00.000Z",
      },
    }),
    NO_OWNERSHIP
  );

  assert.equal(verdict.rule, "unattributed");
});

/* ------------------------------------------------------------------ */
/*  The clocks themselves                                              */
/* ------------------------------------------------------------------ */

test("five business days from a Wednesday lands on the following Wednesday", () => {
  // Wed 5 Aug 2026 -> Thu, Fri, Mon, Tue, Wed = 12 Aug.
  const deadline = declineDeadlineFrom(new Date("2026-08-05T12:00:00.000Z"));
  assert.equal(deadline.toISOString().slice(0, 10), "2026-08-12");
});

test("five business days from a Friday skips the weekend", () => {
  // Fri 7 Aug 2026 -> Mon, Tue, Wed, Thu, Fri = 14 Aug.
  const deadline = declineDeadlineFrom(new Date("2026-08-07T12:00:00.000Z"));
  assert.equal(deadline.toISOString().slice(0, 10), "2026-08-14");
  assert.notEqual(deadline.getUTCDay(), 0);
  assert.notEqual(deadline.getUTCDay(), 6);
});

test("a registration expires 120 days after filing", () => {
  const expiry = registrationExpiryFrom(new Date("2026-01-01T00:00:00.000Z"));
  assert.equal(expiry.toISOString().slice(0, 10), "2026-05-01");
});

test("registrationState approves by silence and says it did", () => {
  const filedAt = new Date("2026-07-06T12:00:00.000Z");
  const state = registrationState({
    status: "pending",
    declineDeadlineAt: declineDeadlineFrom(filedAt),
    expiresAt: registrationExpiryFrom(filedAt),
    now: WED,
  });

  assert.equal(state.effective, "approved");
  assert.equal(state.autoApproved, true);
  assert.ok(state.daysLeft !== null && state.daysLeft > 0);
});

test("registrationState expires an approved registration once its window shuts", () => {
  const filedAt = new Date("2026-01-01T00:00:00.000Z");
  const state = registrationState({
    status: "approved",
    declineDeadlineAt: declineDeadlineFrom(filedAt),
    expiresAt: registrationExpiryFrom(filedAt),
    now: WED,
  });

  assert.equal(state.effective, "expired");
  assert.equal(state.daysLeft, 0);
});

test("a stored expired status is never revived by a future expiry date", () => {
  const state = registrationState({
    status: "expired",
    declineDeadlineAt: "2020-01-01T00:00:00.000Z",
    expiresAt: "2099-01-01T00:00:00.000Z",
    now: WED,
  });

  assert.equal(state.effective, "expired");
  assert.equal(state.autoApproved, false);
});

test("a declined registration is terminal even before its decline window shuts", () => {
  const state = registrationState({
    status: "declined",
    declineDeadlineAt: "2099-01-01T00:00:00.000Z",
    expiresAt: "2099-01-01T00:00:00.000Z",
    now: WED,
  });

  assert.equal(state.effective, "declined");
});

/* ------------------------------------------------------------------ */
/*  Whose deal it is when the two clocks disagree with the columns     */
/* ------------------------------------------------------------------ */

test("a registration filed by one person never pays another", () => {
  const verdict = resolveAttribution(
    evidence({ registration: registration({ requestedBy: CONNOR }), closedAt: WED.toISOString() }),
    OWNERSHIP
  );

  assert.equal(verdict.userId, CONNOR);
});
