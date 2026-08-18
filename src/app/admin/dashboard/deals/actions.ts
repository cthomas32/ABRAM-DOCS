"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { readConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import type { BillingPeriod, CrmMotion, DealStage } from "@/lib/crm/constants";

/**
 * Writing a deal.
 *
 * Every action here re-checks the permission the page already checked.
 * A server action is a public HTTP endpoint: it does not inherit the
 * guard on the page that rendered the form, and anybody who can read the
 * page's JavaScript can call it directly. Row level security is the
 * second lock, and the one that actually protects the table.
 *
 * Two columns are deliberately not editable through `updateDeal`:
 *
 *   sourced_by  stamped once at creation. The database refuses to move
 *               it afterwards, so an update that carried it back from a
 *               stale copy would fail rather than quietly reassign the
 *               money. It is left out of the patch entirely.
 *   stage       moved by setDealStage, markWon and markLost, because
 *               reaching 'won' requires two other columns to be written
 *               in the same statement.
 */

const MAX_NAME = 200;
const MAX_NOTES = 4000;
const MAX_PLAN_TIER = 60;
const MAX_REASON = 500;
const MAX_CODE = 120;

/** A won deal needs both, and the database says so. */
const WON_NEEDS_CLOSE =
  "A won deal needs a closer and a close date. Use Mark won so both are written together.";

export interface DealResult {
  ok: boolean;
  error?: string;
  dealId?: string;
}

export interface DealInput {
  name: string;
  accountId: string;
  primaryContactId: string | null;
  motion: CrmMotion;
  amountCents: number;
  mrrCents: number;
  currency: string;
  billingPeriod: BillingPeriod;
  planTier: string | null;
  seats: number | null;
  expectedCloseOn: string | null;
  notes: string | null;
  promoCode: string | null;
  utmSource: string | null;
}

/** Integer cents, never negative. The constraint refuses anything else. */
function cents(value: number | null | undefined): number {
  const n = Math.round(Number(value ?? 0));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function text(value: string | null | undefined, limit: number): string | null {
  const trimmed = (value ?? "").trim().slice(0, limit);
  return trimmed || null;
}

/** A yyyy-mm-dd date, or nothing. Anything else is a typo, not a date. */
function day(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  return trimmed;
}

function seatCount(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const n = Math.round(Number(value));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** The shared shape of every write, minus the columns each action owns. */
function payloadFrom(input: DealInput) {
  return {
    name: text(input.name, MAX_NAME) ?? "",
    account_id: input.accountId,
    primary_contact_id: input.primaryContactId || null,
    motion: input.motion,
    amount_cents: cents(input.amountCents),
    mrr_cents: cents(input.mrrCents),
    currency: (input.currency || "USD").trim().toUpperCase().slice(0, 3),
    billing_period: input.billingPeriod,
    plan_tier: text(input.planTier, MAX_PLAN_TIER),
    seats: seatCount(input.seats),
    expected_close_on: day(input.expectedCloseOn),
    notes: text(input.notes, MAX_NOTES),
    promo_code: text(input.promoCode, MAX_CODE),
    utm_source: text(input.utmSource, MAX_CODE),
  };
}

/** Turns a constraint rejection into a sentence somebody can act on. */
function readWriteError(code: string | undefined, fallback: string): string {
  if (code === "23514") return WON_NEEDS_CLOSE;
  if (code === "23503") return "The account or contact on this deal no longer exists.";
  if (code === "42501") return "You do not have permission to change this deal.";
  return fallback;
}

function refresh() {
  revalidatePath("/admin/dashboard/deals");
  revalidatePath("/admin/dashboard/accounts");
}

/* ------------------------------------------------------------------ */
/*  Create                                                             */
/* ------------------------------------------------------------------ */

/**
 * A new deal starts open, owned by whoever typed it, and credited to
 * them as the source. That last part is the one that cannot be corrected
 * later without an owner, so it is stamped from the session rather than
 * taken from the form.
 */
export async function createDeal(input: DealInput): Promise<DealResult> {
  const supabase = await createClient();
  const user = await readConsoleUser(supabase);

  if (!user) return { ok: false, error: "Sign in again to carry on." };
  if (!can(user, "crm.deals.manage")) {
    return { ok: false, error: "You do not have permission to create deals." };
  }

  const payload = payloadFrom(input);
  if (!payload.name) return { ok: false, error: "Give the deal a name." };
  if (!payload.account_id) return { ok: false, error: "Pick the account this deal belongs to." };

  const { data, error } = await supabase
    .from("crm_deals")
    .insert({
      ...payload,
      stage: "opportunity" satisfies DealStage,
      owner_user_id: user.userId,
      sourced_by: user.userId,
      created_by: user.userId,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: readWriteError(error?.code, "Could not create the deal. Try again.") };
  }

  refresh();
  return { ok: true, dealId: data.id as string };
}

/* ------------------------------------------------------------------ */
/*  Edit                                                               */
/* ------------------------------------------------------------------ */

export async function updateDeal(dealId: string, input: DealInput): Promise<DealResult> {
  const supabase = await createClient();
  const user = await readConsoleUser(supabase);

  if (!user) return { ok: false, error: "Sign in again to carry on." };
  if (!can(user, "crm.deals.manage")) {
    return { ok: false, error: "You do not have permission to edit deals." };
  }

  const payload = payloadFrom(input);
  if (!payload.name) return { ok: false, error: "Give the deal a name." };
  if (!payload.account_id) return { ok: false, error: "Pick the account this deal belongs to." };

  const { error } = await supabase.from("crm_deals").update(payload).eq("id", dealId);

  if (error) {
    return { ok: false, error: readWriteError(error.code, "Could not save the deal. Try again.") };
  }

  refresh();
  return { ok: true, dealId };
}

/* ------------------------------------------------------------------ */
/*  Stage                                                              */
/* ------------------------------------------------------------------ */

/**
 * Moving a deal between the three open stages.
 *
 * Won and lost are not reachable from here on purpose. Both close a deal
 * and both write columns beyond the stage, so each has its own action
 * and its own confirmation rather than being one more option in a menu.
 */
export async function setDealStage(dealId: string, stage: DealStage): Promise<DealResult> {
  const supabase = await createClient();
  const user = await readConsoleUser(supabase);

  if (!user) return { ok: false, error: "Sign in again to carry on." };
  if (!can(user, "crm.deals.manage")) {
    return { ok: false, error: "You do not have permission to move deals." };
  }

  if (stage === "won") return { ok: false, error: WON_NEEDS_CLOSE };
  if (stage === "lost") {
    return { ok: false, error: "Use Mark lost, so the reason is recorded with it." };
  }
  if (stage !== "opportunity" && stage !== "proposal" && stage !== "negotiation") {
    return { ok: false, error: "That is not a stage a deal can be in." };
  }

  const { error } = await supabase
    .from("crm_deals")
    .update({ stage, closed_at: null, closed_by: null, lost_reason: null })
    .eq("id", dealId);

  if (error) {
    return { ok: false, error: readWriteError(error.code, "Could not move the deal. Try again.") };
  }

  refresh();
  return { ok: true, dealId };
}

/**
 * Marking a deal won.
 *
 * `closed_at` and `closed_by` go in the same statement as the stage,
 * because `crm_deals_won_needs_close` refuses the row without both. The
 * ledger keys a collection month off the close date, so a won deal
 * missing one pays nobody, which is worse than never marking it won.
 */
export async function markWon(
  dealId: string,
  input: { closedOn?: string | null } = {}
): Promise<DealResult> {
  const supabase = await createClient();
  const user = await readConsoleUser(supabase);

  if (!user) return { ok: false, error: "Sign in again to carry on." };
  if (!can(user, "crm.deals.manage")) {
    return { ok: false, error: "You do not have permission to close deals." };
  }

  const closedOn = day(input.closedOn);
  const closedAt = closedOn ? new Date(`${closedOn}T12:00:00Z`) : new Date();
  if (Number.isNaN(closedAt.getTime())) {
    return { ok: false, error: "That close date is not a date. Use the date picker." };
  }
  if (closedAt.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
    return { ok: false, error: "A deal cannot have closed in the future." };
  }

  const { error } = await supabase
    .from("crm_deals")
    .update({
      stage: "won" satisfies DealStage,
      closed_at: closedAt.toISOString(),
      closed_by: user.userId,
      lost_reason: null,
    })
    .eq("id", dealId);

  if (error) {
    return { ok: false, error: readWriteError(error.code, "Could not mark the deal won. Try again.") };
  }

  refresh();
  return { ok: true, dealId };
}

/**
 * Marking a deal lost.
 *
 * `closed_by` stays empty. It means the person who ran a deal to a
 * completed checkout, and nobody did.
 */
export async function markLost(dealId: string, reason: string): Promise<DealResult> {
  const supabase = await createClient();
  const user = await readConsoleUser(supabase);

  if (!user) return { ok: false, error: "Sign in again to carry on." };
  if (!can(user, "crm.deals.manage")) {
    return { ok: false, error: "You do not have permission to close deals." };
  }

  const lostReason = text(reason, MAX_REASON);
  if (!lostReason) return { ok: false, error: "Say why it was lost. In six months nobody remembers." };

  const { error } = await supabase
    .from("crm_deals")
    .update({
      stage: "lost" satisfies DealStage,
      closed_at: new Date().toISOString(),
      closed_by: null,
      lost_reason: lostReason,
    })
    .eq("id", dealId);

  if (error) {
    return { ok: false, error: readWriteError(error.code, "Could not mark the deal lost. Try again.") };
  }

  refresh();
  return { ok: true, dealId };
}

/* ------------------------------------------------------------------ */
/*  Attribution                                                        */
/* ------------------------------------------------------------------ */

export interface AttributionRecheckResult {
  ok: boolean;
  message: string;
}

/**
 * Re-deriving which rule attributes this deal.
 *
 * A placeholder. The evidence gathering and the call into
 * `resolveAttribution` land in `src/lib/crm/attributionService.ts`, and
 * this becomes its caller. The button exists now so the drawer has one
 * shape rather than two, and it says plainly that it does nothing yet
 * rather than returning a silent success.
 */
export async function recheckDealAttribution(dealId: string): Promise<AttributionRecheckResult> {
  if (!dealId) return { ok: false, message: "No deal to check." };
  return { ok: false, message: "not wired yet" };
}
