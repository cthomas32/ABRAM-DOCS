/**
 * Turning the attribution rules into a row on a deal.
 *
 * `attribution.ts` decides. This file is the only thing that gathers what
 * it decides from, and the only thing that writes the answer down. The
 * split is the point: the rules stay a pure function anybody can read and
 * test, and everything that could be argued about — which column counts
 * as "the promo code", what happens when two signals disagree — is here,
 * in one place, with the reasoning attached.
 *
 * WHAT COUNTS AS EVIDENCE, AND WHY
 *
 * Rule one is "her promo code redeemed at checkout". Checkout happens in
 * the product's database, not this one — see src/app/api/admin/promotions
 * for the wall between the two projects — so there is no redemption
 * record here to read. What there is, is `crm_deals.promo_code`, the
 * column the schema calls "the evidence each rule reads". That is the
 * mirror, and it is filled in by hand today because nothing syncs it yet.
 * That gap is real and named at the bottom of this file.
 *
 * `crm_contacts.promo_code` is deliberately NOT read as rule one. The
 * migration that added it says why: it is a code seen on the way in,
 * which is a weaker thing than a code redeemed at checkout, and treating
 * the two as the same makes a deal pay on a code the customer typed into
 * a landing page and then abandoned. When it disagrees with the deal, the
 * verdict carries a warning rather than a payment.
 *
 * WHO GETS PAID IS NOT WHAT THIS DECIDES
 *
 * Worth stating plainly because it surprised the author. The commission
 * ledger pays `crm_deals.sourced_by`; it reads `attribution_rule` only to
 * decide *whether* a deal pays at all. So attribution and the payee are
 * two columns that must agree, and nothing was making them. This file
 * closes half of that: when a rule resolves to somebody and `sourced_by`
 * is empty, it fills it in. When `sourced_by` is already set to somebody
 * else it does not overwrite — that column is write-once by trigger and
 * for good reason — it raises a warning that a person has to settle.
 */

import { createClient } from "@/utils/supabase/server";
import { readConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import { resolveAttribution } from "./attribution";
import type {
  AttributionEvidence,
  AttributionOwnership,
  AttributionVerdict,
} from "./attribution";

/* ------------------------------------------------------------------ */
/*  The shape builder A calls                                          */
/* ------------------------------------------------------------------ */

export interface DealAttributionResult {
  ok: boolean;
  /** A sentence for the person, present only when ok is false. */
  error?: string;
  /** What the rules produced. Present whenever ok is true. */
  verdict?: AttributionVerdict;
  /** True when the deal was already locked and nothing was rewritten. */
  locked?: boolean;
  /** False when the stored answer already said exactly this. */
  changed?: boolean;
  /**
   * Things a person needs to settle, not things the rules decided.
   * A promo code on the contact that the deal does not carry; a payee
   * that disagrees with the rule. Shown, never acted on automatically.
   */
  warnings?: string[];
}

export interface ApplyDealAttributionOptions {
  /**
   * Stamp `attribution_locked_at` and stop re-deriving. `markWon` passes
   * this: the moment a deal is won, the rule that attributed it becomes
   * history, so a UTM column edited next month cannot move money.
   */
  lock?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Gathering                                                          */
/* ------------------------------------------------------------------ */

/** Lowercased, trimmed, empty means absent. */
function key(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed || null;
}

/** The last path segment, which is how a tracked link is named. */
function slugOf(path: string | null | undefined): string | null {
  const raw = key(path);
  if (!raw) return null;
  const segment = raw.split("?")[0].split("#")[0].replace(/\/+$/, "").split("/").pop();
  return key(segment ?? null);
}

function unique(values: (string | null)[]): string[] {
  return Array.from(new Set(values.filter((v): v is string => Boolean(v))));
}

interface DealRow {
  id: string;
  account_id: string;
  primary_contact_id: string | null;
  stage: string;
  closed_at: string | null;
  sourced_by: string | null;
  attribution_rule: string;
  attribution_ref: string | null;
  attribution_note: string | null;
  attribution_locked_at: string | null;
  registration_id: string | null;
  promo_code: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
}

interface AccountRow {
  id: string;
  domain: string | null;
  first_contact_at: string | null;
}

interface ContactRow {
  promo_code: string | null;
  first_touch_source: string | null;
  first_touch_campaign: string | null;
  first_touch_content: string | null;
  first_touch_landing_path: string | null;
}

interface RegistrationRow {
  id: string;
  requested_by: string;
  requested_at: string;
  status: string;
  decline_deadline_at: string;
  expires_at: string;
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

// One string literal each. Concatenating a select list defeats the typed
// query parser and every row comes back as an error shape.
const DEAL_COLUMNS =
  "id, account_id, primary_contact_id, stage, closed_at, sourced_by, attribution_rule, attribution_ref, attribution_note, attribution_locked_at, registration_id, promo_code, utm_source, utm_campaign";

const CONTACT_COLUMNS =
  "promo_code, first_touch_source, first_touch_campaign, first_touch_content, first_touch_landing_path";

/**
 * Everything the rules read, assembled from four places.
 *
 * Both lookups that cross a permission boundary go through a SECURITY
 * DEFINER function rather than a table read. A growth partner may only
 * read their own attribution keys and their own registrations, and a
 * partner who cannot see a rival's key gets told the code "belongs to
 * nobody" — which is not a permission failure, it is a wrong answer that
 * would then be locked in. See 20260817150000.
 */
async function gatherEvidence(
  supabase: Supabase,
  deal: DealRow,
  account: AccountRow | null,
  contact: ContactRow | null
): Promise<{
  evidence: AttributionEvidence;
  ownership: AttributionOwnership;
  warnings: string[];
  registration: RegistrationRow | null;
}> {
  const warnings: string[] = [];

  /* -- Rule one candidates: the deal's code only ---------------------- */
  const dealCode = key(deal.promo_code);
  const contactCode = key(contact?.promo_code);
  if (!dealCode && contactCode) {
    warnings.push(
      `The contact arrived with promo code ${contactCode}, but no code is recorded on the deal. ` +
        `Rule one reads what was redeemed at checkout, so this attributes nothing until the deal carries it.`
    );
  }

  /* -- Rule two candidates -------------------------------------------- */
  // A tracked link is identified by its own slug rather than by a
  // utm_source, so both key types are collected and tried in order of how
  // directly they evidence the click.
  const sourceCandidates = unique([key(deal.utm_source), key(contact?.first_touch_source)]);
  const linkCandidates = unique([
    key(deal.utm_campaign),
    key(contact?.first_touch_campaign),
    key(contact?.first_touch_content),
    slugOf(contact?.first_touch_landing_path),
  ]);

  /* -- Who owns any of that ------------------------------------------- */
  const lookupValues = unique([dealCode, ...sourceCandidates, ...linkCandidates]);
  const promoCodeOwners: Record<string, string> = {};
  const utmSourceOwners: Record<string, string> = {};

  if (lookupValues.length > 0) {
    const { data: owners, error } = await supabase.rpc("growth_attribution_owners", {
      p_key_types: ["promo_code", "utm_source", "tracked_link"],
      p_values: lookupValues,
    });

    if (error) {
      // Failing open here would attribute a deal to nobody and then let
      // it be locked. Refuse instead, loudly, by leaving the maps empty
      // and saying so.
      warnings.push(
        "The ownership map could not be read, so no code or link could be matched to a partner."
      );
    }

    for (const row of (owners ?? []) as {
      key_type: string;
      key_value: string;
      owner_user_id: string;
    }[]) {
      const value = key(row.key_value);
      if (!value || !row.owner_user_id) continue;
      if (row.key_type === "promo_code") promoCodeOwners[value] = row.owner_user_id;
      // A tracked link and a utm_source both answer rule two, so they
      // share one map. The rule does not care which instrument produced
      // the visit, only that it is a partner's.
      else utmSourceOwners[value] = row.owner_user_id;
    }
  }

  // The source handed to the rules is the first candidate anybody owns,
  // falling back to the first candidate that exists at all so the
  // rejection can name it rather than saying nothing was recorded.
  const orderedSources = [...sourceCandidates, ...linkCandidates];
  const utmSource =
    orderedSources.find((candidate) => utmSourceOwners[candidate]) ?? orderedSources[0] ?? null;

  /* -- Rule three: the registration on the account -------------------- */
  let registration: RegistrationRow | null = null;
  if (deal.account_id || account?.domain) {
    const { data } = await supabase.rpc("crm_live_registration_for_account", {
      p_account_id: deal.account_id ?? null,
      p_domain: account?.domain ?? null,
    });
    const rows = (data ?? []) as RegistrationRow[];
    registration = rows[0] ?? null;
  }

  const evidence: AttributionEvidence = {
    redeemedPromoCode: dealCode,
    utmSource,
    utmCampaign: key(deal.utm_campaign),
    closedAt: deal.closed_at,
    accountFirstContactAt: account?.first_contact_at ?? null,
    registration: registration
      ? {
          id: registration.id,
          requestedBy: registration.requested_by,
          requestedAt: registration.requested_at,
          status: registration.status,
          expiresAt: registration.expires_at,
          // The clock that makes approval-by-silence pay. Without it the
          // rules fall back to the stored status, which says "pending"
          // forever because nothing writes to it when the window shuts.
          declineDeadlineAt: registration.decline_deadline_at,
        }
      : null,
  };

  return { evidence, ownership: { promoCodeOwners, utmSourceOwners }, warnings, registration };
}

/* ------------------------------------------------------------------ */
/*  Reading the answer without writing it                              */
/* ------------------------------------------------------------------ */

/**
 * What the rules say about this deal right now. Writes nothing.
 *
 * A locked deal returns the answer that was locked, because that is the
 * one the ledger uses and showing a fresher one beside a commission
 * figure derived from the older one is how an argument starts.
 */
export async function resolveDealAttribution(dealId: string): Promise<DealAttributionResult> {
  const supabase = await createClient();
  const user = await readConsoleUser(supabase);

  if (!user) return { ok: false, error: "Sign in again to carry on." };
  if (!can(user, "crm.deals.manage")) {
    return { ok: false, error: "You do not have permission to work deals." };
  }

  const loaded = await loadDeal(supabase, dealId);
  if ("error" in loaded) return { ok: false, error: loaded.error };

  const { deal, account, contact } = loaded;

  if (deal.attribution_locked_at) {
    return { ok: true, locked: true, changed: false, verdict: storedVerdict(deal) };
  }

  const { evidence, ownership, warnings } = await gatherEvidence(supabase, deal, account, contact);
  const verdict = resolveAttribution(evidence, ownership);

  return {
    ok: true,
    locked: false,
    changed: false,
    verdict,
    warnings: [...warnings, ...payeeWarnings(deal, verdict)],
  };
}

/* ------------------------------------------------------------------ */
/*  Writing it down                                                    */
/* ------------------------------------------------------------------ */

/**
 * Re-derive attribution for a deal and store the result.
 *
 * ```ts
 * // The "Recheck attribution" button on the drawer.
 * const result = await applyDealAttribution(dealId);
 *
 * // Closing a deal. Locking is what stops a UTM edited next month from
 * // moving a commission that has already been paid.
 * const result = await applyDealAttribution(dealId, { lock: true });
 * ```
 *
 * Returns `{ ok: false, error }` for anything a person should read as a
 * sentence, and never throws. A locked deal comes back `{ ok: true,
 * locked: true, changed: false }` carrying the stored verdict — the write
 * is refused rather than silently skipped, because "recheck did nothing"
 * and "recheck agreed" look identical otherwise.
 *
 * Unlocking is deliberately not offered here. It is one UPDATE by an
 * owner against a table only owners may write, and making it a button
 * makes it routine.
 */
export async function applyDealAttribution(
  dealId: string,
  options: ApplyDealAttributionOptions = {}
): Promise<DealAttributionResult> {
  const supabase = await createClient();
  const user = await readConsoleUser(supabase);

  if (!user) return { ok: false, error: "Sign in again to carry on." };
  if (!can(user, "crm.deals.manage")) {
    return { ok: false, error: "You do not have permission to work deals." };
  }

  const loaded = await loadDeal(supabase, dealId);
  if ("error" in loaded) return { ok: false, error: loaded.error };

  const { deal, account, contact } = loaded;

  // Settled is settled. The ledger reads the stored rule, so rewriting it
  // after a payout would restate what was already paid.
  if (deal.attribution_locked_at) {
    return {
      ok: true,
      locked: true,
      changed: false,
      verdict: storedVerdict(deal),
      warnings: ["Attribution was settled on this deal and is no longer re-derived."],
    };
  }

  const { evidence, ownership, warnings } = await gatherEvidence(supabase, deal, account, contact);
  const verdict = resolveAttribution(evidence, ownership);

  const note = noteFrom(verdict);
  const patch: Record<string, unknown> = {
    attribution_rule: verdict.rule,
    attribution_ref: verdict.ref,
    attribution_note: note,
    registration_id: verdict.rule === "registered_account" ? verdict.ref : null,
  };

  if (options.lock) patch.attribution_locked_at = new Date().toISOString();

  // The payee half. `sourced_by` is write-once by trigger, so this only
  // ever fills an empty column — never moves one — and a disagreement
  // becomes a warning for a person rather than a silent reassignment.
  if (verdict.userId && !deal.sourced_by) patch.sourced_by = verdict.userId;

  const changed =
    deal.attribution_rule !== verdict.rule ||
    (deal.attribution_ref ?? null) !== (verdict.ref ?? null) ||
    (deal.attribution_note ?? null) !== note ||
    Boolean(options.lock);

  const { error } = await supabase.from("crm_deals").update(patch).eq("id", dealId);

  if (error) {
    return {
      ok: false,
      error:
        error.code === "42501"
          ? "You may not change attribution on this deal."
          : "Could not record attribution. Try again.",
      verdict,
    };
  }

  return {
    ok: true,
    locked: Boolean(options.lock),
    changed,
    verdict,
    warnings: [...warnings, ...payeeWarnings(deal, verdict)],
  };
}

/* ------------------------------------------------------------------ */
/*  Pieces                                                             */
/* ------------------------------------------------------------------ */

async function loadDeal(
  supabase: Supabase,
  dealId: string
): Promise<
  | { deal: DealRow; account: AccountRow | null; contact: ContactRow | null }
  | { error: string }
> {
  const { data, error } = await supabase
    .from("crm_deals")
    .select(DEAL_COLUMNS)
    .eq("id", dealId)
    .maybeSingle();

  // Row level security answers "not yours" as "not there", which is the
  // right shape for a caller and the reason both cases say the same thing.
  if (error || !data) return { error: "That deal is not available." };

  const deal = data as unknown as DealRow;

  const [accountResult, contactResult] = await Promise.all([
    supabase
      .from("crm_accounts")
      .select("id, domain, first_contact_at")
      .eq("id", deal.account_id)
      .maybeSingle(),
    deal.primary_contact_id
      ? supabase
          .from("crm_contacts")
          .select(CONTACT_COLUMNS)
          .eq("id", deal.primary_contact_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    deal,
    account: (accountResult.data as unknown as AccountRow | null) ?? null,
    contact: (contactResult.data as unknown as ContactRow | null) ?? null,
  };
}

/**
 * The verdict as one block of text, stored on the deal.
 *
 * The rejections go in as well as the reason. `attribution_note` is what
 * survives on a locked deal, and "why was this not paid" is asked about
 * locked deals far more often than about live ones — a note that only
 * says what fired leaves that question permanently unanswerable.
 */
function noteFrom(verdict: AttributionVerdict): string {
  const lines = [verdict.reason];
  for (const rejection of verdict.rejected) {
    lines.push(`Rejected ${rejection.rule}: ${rejection.reason}`);
  }
  return lines.join("\n").slice(0, 2000);
}

/** The locked answer, read back off the deal rather than re-derived. */
function storedVerdict(deal: DealRow): AttributionVerdict {
  const [reason, ...rejections] = (deal.attribution_note ?? "").split("\n");

  return {
    rule: deal.attribution_rule as AttributionVerdict["rule"],
    userId: deal.sourced_by,
    ref: deal.attribution_ref,
    reason: reason || "Attribution was settled on this deal.",
    // Parsed back out of the stored note rather than recomputed, so the
    // list shown beside a locked verdict is the list that produced it.
    rejected: rejections
      .map((line) => line.replace(/^Rejected /, ""))
      .map((line) => {
        const at = line.indexOf(": ");
        return at === -1
          ? null
          : {
              rule: line.slice(0, at) as AttributionVerdict["rule"],
              reason: line.slice(at + 2),
            };
      })
      .filter((r): r is { rule: AttributionVerdict["rule"]; reason: string } => r !== null),
  };
}

/**
 * The one disagreement nothing else catches.
 *
 * The ledger pays `sourced_by`. If a rule attributed the deal to somebody
 * else, the deal will pay the wrong person and every number downstream
 * will be internally consistent about it.
 */
function payeeWarnings(deal: DealRow, verdict: AttributionVerdict): string[] {
  if (!verdict.userId) return [];
  if (!deal.sourced_by) return [];
  if (deal.sourced_by === verdict.userId) return [];

  return [
    "Attribution resolves to a different person than the deal is sourced to. " +
      "Commission pays the sourcer, so this deal will pay somebody the rules did not choose. " +
      "An owner has to settle which is right.",
  ];
}

/* ------------------------------------------------------------------ *
 *  OPEN GAP
 *
 *  Nothing writes `crm_deals.promo_code`, `utm_source` or
 *  `external_customer_ref` automatically. Checkout is in the product's
 *  database and the two projects only speak through the promo admin
 *  proxy, which reads campaigns and codes but reports no redemptions.
 *  Until a Stripe-to-DOCS sync exists, rule one fires on a column a
 *  person filled in — which is honest, recorded and auditable, and is
 *  still not the same thing as evidence from a checkout.
 *
 *  The same sync is the missing producer for `revenue_collections`; see
 *  src/lib/growth/collectionsService.ts.
 * ------------------------------------------------------------------ */
