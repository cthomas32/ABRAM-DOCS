"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { readConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import { DEAL_STAGES, type DealStage } from "@/lib/crm/constants";

/**
 * Moving a deal across the board.
 *
 * The board is a second door onto the same rows the deal list writes, so
 * the checks are repeated here rather than borrowed. A server action is a
 * public HTTP endpoint: it does not inherit the guard on the page that
 * rendered the card, and anybody who can read the page's JavaScript can
 * call it directly. Row level security is the lock underneath, and these
 * checks exist so a refusal arrives as a sentence instead of an empty
 * update.
 *
 * The one rule the interface has to know about the schema:
 * `crm_deals_won_needs_close` refuses a won row without both `closed_at`
 * and `closed_by`. So a drag into Won never writes directly. It opens the
 * close dialog, which calls `markDealWon`, which sets the two together.
 */

const MAX_REASON = 500;

export interface DealBoardResult {
  ok: boolean;
  error?: string;
}

const STAGE_IDS = DEAL_STAGES.map((stage) => stage.id) as string[];

function stageLabel(id: string): string {
  return DEAL_STAGES.find((stage) => stage.id === id)?.label ?? id;
}

/**
 * The signed-in person, if they may move deals at all.
 *
 * Returns the error sentence rather than throwing, because every caller
 * renders it in the same place.
 */
async function readMover() {
  const supabase = await createClient();
  const user = await readConsoleUser(supabase);

  if (!user) return { error: "Sign in again to carry on." as const };
  if (!can(user, "crm.deals.manage")) {
    return { error: "You do not have permission to change deals." as const };
  }
  return { supabase, user };
}

/**
 * The timeline entry for a move.
 *
 * `crm_interactions.contact_id` is not nullable, so a deal with no
 * primary contact has nowhere to write this. That is a missing line on a
 * timeline, not a failed move, and it is silent on purpose.
 */
async function logMove(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: {
    contactId: string | null;
    kind: "stage_change" | "deal_won" | "deal_lost";
    body: string;
    meta: Record<string, unknown>;
    authorUserId: string;
  }
) {
  if (!input.contactId) return;
  await supabase.from("crm_interactions").insert({
    contact_id: input.contactId,
    kind: input.kind,
    body: input.body,
    meta: input.meta,
    occurred_at: new Date().toISOString(),
    author_user_id: input.authorUserId,
  });
}

async function readDeal(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string
) {
  const { data } = await supabase
    .from("crm_deals")
    .select("id, name, stage, primary_contact_id")
    .eq("id", id)
    .maybeSingle();
  return data as
    | { id: string; name: string; stage: DealStage; primary_contact_id: string | null }
    | null;
}

/**
 * Any move except into Won.
 *
 * Leaving Won clears `closed_at` and `closed_by` in the same write. A
 * deal reopened for negotiation is not closed, and leaving the closer
 * stamped on it means the commission ledger reads a close that no longer
 * happened.
 */
export async function setDealStage(input: {
  id: string;
  stage: DealStage;
}): Promise<DealBoardResult> {
  const mover = await readMover();
  if ("error" in mover) return { ok: false, error: mover.error };
  const { supabase, user } = mover;

  if (!STAGE_IDS.includes(input.stage)) {
    return { ok: false, error: "That is not a stage a deal can be in." };
  }
  if (input.stage === "won") {
    return {
      ok: false,
      error: "A deal is marked won through the close dialog, which records the date and the closer.",
    };
  }

  const deal = await readDeal(supabase, input.id);
  if (!deal) return { ok: false, error: "That deal no longer exists." };
  if (deal.stage === input.stage) return { ok: true };

  const patch: Record<string, unknown> = { stage: input.stage };
  if (deal.stage === "won") {
    patch.closed_at = null;
    patch.closed_by = null;
  }
  if (input.stage !== "lost") patch.lost_reason = null;

  const { error } = await supabase.from("crm_deals").update(patch).eq("id", input.id);

  if (error) {
    return { ok: false, error: "That move did not save. Try again." };
  }

  await logMove(supabase, {
    contactId: deal.primary_contact_id,
    kind: input.stage === "lost" ? "deal_lost" : "stage_change",
    body: `${deal.name}: ${stageLabel(deal.stage)} to ${stageLabel(input.stage)}`,
    meta: { deal_id: deal.id, from: deal.stage, to: input.stage },
    authorUserId: user.userId,
  });

  revalidatePath("/admin/dashboard/deals/board");
  revalidatePath("/admin/dashboard/deals");
  return { ok: true };
}

/**
 * Marking a deal won.
 *
 * `closed_at` and `closed_by` are written together with the stage, in one
 * statement, because the table refuses the row otherwise. The closer is
 * whoever pressed the button. That is a money column, so it is taken from
 * the session and never from the form.
 */
export async function markDealWon(input: {
  id: string;
  /** A calendar day, `YYYY-MM-DD`. Defaults to today when left blank. */
  closedOn?: string;
}): Promise<DealBoardResult> {
  const mover = await readMover();
  if ("error" in mover) return { ok: false, error: mover.error };
  const { supabase, user } = mover;

  const deal = await readDeal(supabase, input.id);
  if (!deal) return { ok: false, error: "That deal no longer exists." };

  let closedAt = new Date();
  if (input.closedOn) {
    const parsed = new Date(`${input.closedOn}T12:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return { ok: false, error: "That close date could not be read. Use the date picker." };
    }
    if (parsed.getTime() > Date.now() + 86_400_000) {
      return { ok: false, error: "A deal cannot have closed in the future." };
    }
    closedAt = parsed;
  }

  const { error } = await supabase
    .from("crm_deals")
    .update({
      stage: "won",
      closed_at: closedAt.toISOString(),
      closed_by: user.userId,
      lost_reason: null,
    })
    .eq("id", input.id);

  if (error) {
    // 23514 is crm_deals_won_needs_close, which can only fire if the two
    // columns above were dropped from this write.
    if (error.code === "23514") {
      return {
        ok: false,
        error: "A won deal needs a close date and a closer. Both are set here, so try again.",
      };
    }
    return { ok: false, error: "Could not mark that deal won. Try again." };
  }

  await logMove(supabase, {
    contactId: deal.primary_contact_id,
    kind: "deal_won",
    body: `${deal.name} was won`,
    meta: { deal_id: deal.id, from: deal.stage, to: "won" },
    authorUserId: user.userId,
  });

  revalidatePath("/admin/dashboard/deals/board");
  revalidatePath("/admin/dashboard/deals");
  return { ok: true };
}

/** Marking a deal lost, with the sentence that says why. */
export async function markDealLost(input: {
  id: string;
  reason?: string;
}): Promise<DealBoardResult> {
  const mover = await readMover();
  if ("error" in mover) return { ok: false, error: mover.error };
  const { supabase, user } = mover;

  const deal = await readDeal(supabase, input.id);
  if (!deal) return { ok: false, error: "That deal no longer exists." };

  const reason = (input.reason ?? "").trim().slice(0, MAX_REASON) || null;

  const patch: Record<string, unknown> = { stage: "lost", lost_reason: reason };
  if (deal.stage === "won") {
    patch.closed_at = null;
    patch.closed_by = null;
  }

  const { error } = await supabase.from("crm_deals").update(patch).eq("id", input.id);
  if (error) return { ok: false, error: "Could not mark that deal lost. Try again." };

  await logMove(supabase, {
    contactId: deal.primary_contact_id,
    kind: "deal_lost",
    body: reason ? `${deal.name} was lost: ${reason}` : `${deal.name} was lost`,
    meta: { deal_id: deal.id, from: deal.stage, to: "lost" },
    authorUserId: user.userId,
  });

  revalidatePath("/admin/dashboard/deals/board");
  revalidatePath("/admin/dashboard/deals");
  return { ok: true };
}
