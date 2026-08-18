/**
 * Deciding whose deal this is.
 *
 * The partnership agreement gives three rules and one instruction about
 * how to apply them:
 *
 *     1. Her promo code redeemed at checkout
 *     2. Her UTM link recorded at signup
 *     3. Named accounts registered in writing before first contact,
 *        closed within 120 days
 *
 *     "First match governs. No discretionary override."
 *
 * That last line is the reason this file exists as a pure function rather
 * than as a dropdown somebody fills in. A dropdown is a discretionary
 * override wearing a different hat: the moment attribution is a field a
 * person types, the rule is whatever the person typed, and the first
 * disagreement about a commission figure becomes an argument about
 * memory instead of a lookup.
 *
 * So: the interface shows what the rules produce and why, and the only
 * thing a person can do about it is change the underlying facts — link a
 * promo code, correct a UTM, approve a registration. Each of those is
 * itself recorded.
 *
 * Nothing here touches the database. It takes the evidence and returns a
 * verdict, which is what makes it testable and what makes the same answer
 * come out on the server, in the browser and in a report.
 */

import {
  REGISTRATION_VALID_DAYS,
  type AttributionRule,
} from "./constants";

/* ------------------------------------------------------------------ */
/*  What the rules read                                                */
/* ------------------------------------------------------------------ */

export interface AttributionEvidence {
  /** A promo code actually redeemed at checkout, from the payment record. */
  redeemedPromoCode?: string | null;
  /** The source recorded at signup. */
  utmSource?: string | null;
  utmCampaign?: string | null;
  /** When the deal closed, or now if it has not. */
  closedAt?: string | Date | null;
  /**
   * A registration covering this account, if there is one.
   *
   * `status` is the stored one and is deliberately not trusted on its
   * own: a pending registration nobody declined inside the five business
   * day window has been approved by silence, and the row still says
   * pending because nothing wrote to it. Pass `declineDeadlineAt` and the
   * clocks decide. Without it this falls back to the stored status, which
   * under-pays rather than over-pays.
   */
  registration?: {
    id: string;
    requestedBy: string;
    requestedAt: string | Date;
    status: string;
    expiresAt: string | Date;
    declineDeadlineAt?: string | Date | null;
  } | null;
  /** Fixes "now" for the clocks. Tests set it; nothing else needs to. */
  now?: Date;
  /** When anybody here first spoke to this account. */
  accountFirstContactAt?: string | Date | null;
}

/** Which codes and links belong to which partner. */
export interface AttributionOwnership {
  /** Lowercased promo code to the user id that owns it. */
  promoCodeOwners: Record<string, string>;
  /** Lowercased utm_source to the user id that owns it. */
  utmSourceOwners: Record<string, string>;
}

export interface AttributionVerdict {
  rule: AttributionRule;
  /** The user this deal is attributed to, or null when nothing matched. */
  userId: string | null;
  /** What the rule matched on — the code, the source, the registration id. */
  ref: string | null;
  /** Plain English, shown in the interface beside the verdict. */
  reason: string;
  /** The rules that were tested and rejected, in order, and why. */
  rejected: { rule: AttributionRule; reason: string }[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function asDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000);
}

function normalizeKey(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed || null;
}

/* ------------------------------------------------------------------ */
/*  The rules                                                          */
/* ------------------------------------------------------------------ */

/**
 * Apply the three rules in order and return the first that matches.
 *
 * Every rejection is collected rather than discarded. "Why did this not
 * pay" is asked far more often than "why did this pay", and an answer
 * that lists what was tested settles it in one screen.
 */
export function resolveAttribution(
  evidence: AttributionEvidence,
  ownership: AttributionOwnership
): AttributionVerdict {
  const rejected: { rule: AttributionRule; reason: string }[] = [];

  /* -- Rule 1: a promo code redeemed at checkout -------------------- */
  const code = normalizeKey(evidence.redeemedPromoCode);
  if (code) {
    const owner = ownership.promoCodeOwners[code];
    if (owner) {
      return {
        rule: "promo_code",
        userId: owner,
        ref: code,
        reason: `Promo code ${code} was redeemed at checkout.`,
        rejected,
      };
    }
    rejected.push({
      rule: "promo_code",
      reason: `Code ${code} was redeemed but belongs to nobody.`,
    });
  } else {
    rejected.push({ rule: "promo_code", reason: "No promo code was redeemed at checkout." });
  }

  /* -- Rule 2: a tracked link recorded at signup -------------------- */
  const source = normalizeKey(evidence.utmSource);
  if (source) {
    const owner = ownership.utmSourceOwners[source];
    if (owner) {
      return {
        rule: "utm_link",
        userId: owner,
        ref: source,
        reason: `Signup recorded ${source} as the source.`,
        rejected,
      };
    }
    rejected.push({
      rule: "utm_link",
      reason: `Source ${source} is not a tracked partner link.`,
    });
  } else {
    rejected.push({ rule: "utm_link", reason: "No tracked source was recorded at signup." });
  }

  /* -- Rule 3: a registered named account --------------------------- */
  const registration = evidence.registration;

  // The stored status is not the answer. Both of a registration's clocks
  // run on their own and neither writes to the row when it elapses, so
  // reading `status` directly means a registration approved by silence
  // pays nothing — which is precisely the outcome the five business day
  // window exists to prevent.
  const registrationEffective = registration
    ? registrationState({
        status: registration.status,
        // Absent clocks fall back to the stored status rather than
        // inventing a deadline. Under-paying is recoverable by filling the
        // field in; auto-approving against a made-up date is not.
        declineDeadlineAt: registration.declineDeadlineAt ?? new Date(8.64e15),
        expiresAt: registration.expiresAt,
        now: evidence.now,
      })
    : null;

  if (!registration || !registrationEffective) {
    rejected.push({ rule: "registered_account", reason: "No registration was filed for this account." });
  } else if (
    // "converted" is downstream of approval — a registration only reaches
    // it by having been approved first — so it is not a rejection.
    registrationEffective.effective !== "approved" &&
    registrationEffective.effective !== "converted"
  ) {
    rejected.push({
      rule: "registered_account",
      reason:
        registrationEffective.effective === "expired"
          ? `Registration expired before the deal closed, past the ${REGISTRATION_VALID_DAYS} day window.`
          : `Registration is ${registrationEffective.effective}, not approved.`,
    });
  } else {
    const requestedAt = asDate(registration.requestedAt);
    const firstContact = asDate(evidence.accountFirstContactAt);
    // A deal that has not closed is tested against today, so the
    // interface can warn that a registration is about to lapse rather
    // than only discovering it afterwards.
    const closedAt = asDate(evidence.closedAt) ?? evidence.now ?? new Date();

    // Filed before first contact. The whole point of registration is that
    // it claims an account nobody has approached yet.
    if (requestedAt && firstContact && requestedAt > firstContact) {
      rejected.push({
        rule: "registered_account",
        reason: "Registration was filed after first contact with the account.",
      });
    } else if (requestedAt && daysBetween(requestedAt, closedAt) > REGISTRATION_VALID_DAYS) {
      rejected.push({
        rule: "registered_account",
        reason: `Closed ${daysBetween(requestedAt, closedAt)} days after registration, past the ${REGISTRATION_VALID_DAYS} day window.`,
      });
    } else {
      return {
        rule: "registered_account",
        userId: registration.requestedBy,
        ref: registration.id,
        reason:
          (requestedAt
            ? `Account registered on ${requestedAt.toISOString().slice(0, 10)} and closed inside the ${REGISTRATION_VALID_DAYS} day window.`
            : `Account was registered and approved.`) +
          (registrationEffective.autoApproved
            ? " Nobody declined it inside the window, so it stands."
            : ""),
        rejected,
      };
    }
  }

  return {
    rule: "unattributed",
    userId: null,
    ref: null,
    reason: "Matches none of the three attribution rules, so it pays nothing.",
    rejected,
  };
}

/* ------------------------------------------------------------------ */
/*  Registration clocks                                                */
/* ------------------------------------------------------------------ */

/**
 * Five business days from a filing, as a real instant.
 *
 * Weekends only — public holidays are not modelled, and pretending
 * otherwise would need a calendar per country and would still be wrong
 * for somebody. Erring toward a slightly shorter window favours the
 * partner, which is the right direction for an ambiguity in a company's
 * own agreement.
 *
 * Counted in UTC. The local-time version of this returns a different
 * deadline depending on which machine resolved it, and a deadline that
 * depends on the server's timezone is not a fact — it is the sort of
 * discrepancy that surfaces as a partner and a founder each holding a
 * screenshot of a different date.
 */
export function declineDeadlineFrom(filedAt: Date, businessDays = 5): Date {
  const deadline = new Date(filedAt.getTime());
  let remaining = businessDays;

  while (remaining > 0) {
    deadline.setUTCDate(deadline.getUTCDate() + 1);
    const day = deadline.getUTCDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }

  return deadline;
}

/** When an approved registration stops being able to pay anything. */
export function registrationExpiryFrom(filedAt: Date, days = REGISTRATION_VALID_DAYS): Date {
  const expiry = new Date(filedAt.getTime());
  expiry.setUTCDate(expiry.getUTCDate() + days);
  return expiry;
}

/**
 * How a registration should be read right now, given the two clocks.
 *
 * Kept apart from the stored status because the stored one only changes
 * when somebody writes to it, and both of these expire on their own.
 */
export function registrationState(input: {
  status: string;
  declineDeadlineAt: string | Date;
  expiresAt: string | Date;
  now?: Date;
}): {
  effective: "pending" | "approved" | "declined" | "expired" | "converted";
  autoApproved: boolean;
  daysLeft: number | null;
} {
  const now = input.now ?? new Date();
  const declineBy = asDate(input.declineDeadlineAt);
  const expires = asDate(input.expiresAt);

  // Terminal by decision. `expired` is here as well as below because a row
  // stored expired with a future expiry is incoherent data, and the safe
  // reading of incoherent data is the one that does not revive a claim.
  if (input.status === "declined" || input.status === "converted" || input.status === "expired") {
    return {
      effective: input.status,
      autoApproved: false,
      daysLeft: input.status === "expired" ? 0 : null,
    };
  }

  if (expires && now > expires) {
    return { effective: "expired", autoApproved: false, daysLeft: 0 };
  }

  const daysLeft = expires ? Math.max(daysBetween(now, expires), 0) : null;

  // A pending registration the company never declined inside its window
  // has been approved by silence. The agreement gives the company five
  // business days to object; not objecting is the decision.
  if (input.status === "pending" && declineBy && now > declineBy) {
    return { effective: "approved", autoApproved: true, daysLeft };
  }

  return {
    effective: input.status === "approved" ? "approved" : "pending",
    autoApproved: false,
    daysLeft,
  };
}
