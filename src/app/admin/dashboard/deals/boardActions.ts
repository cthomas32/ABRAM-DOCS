"use server";

import {
  markLost,
  markWon,
  moveDealStage,
  type DealResult,
} from "./actions";
import type { DealStage } from "@/lib/crm/constants";

/**
 * The board's shape of the deal writes.
 *
 * There is exactly one implementation of moving a deal, and it lives in
 * `actions.ts`: the permission check, the close columns, the timeline
 * line and the attribution lock are all written once. This file only
 * translates the board's object arguments into that call, so the two
 * surfaces cannot drift into two different ideas of what winning a deal
 * means.
 *
 * The one rule the interface has to know about the schema:
 * `crm_deals_won_needs_close` refuses a won row without both `closed_at`
 * and `closed_by`. So a drag into Won never writes directly. It opens the
 * close dialog, which calls `markDealWon`, which sets the two together
 * and locks attribution against the close.
 */

export interface DealBoardResult {
  ok: boolean;
  error?: string;
}

function asBoardResult(result: DealResult): DealBoardResult {
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

/** Any move except into Won. Lost is allowed here, without a reason. */
export async function setDealStage(input: {
  id: string;
  stage: DealStage;
}): Promise<DealBoardResult> {
  return asBoardResult(await moveDealStage(input.id, input.stage));
}

/** Marking a deal won, with the date the close dialog collected. */
export async function markDealWon(input: {
  id: string;
  /** A calendar day, `YYYY-MM-DD`. Defaults to today when left blank. */
  closedOn?: string;
}): Promise<DealBoardResult> {
  return asBoardResult(await markWon(input.id, { closedOn: input.closedOn ?? null }));
}

/** Marking a deal lost, with the sentence that says why when there is one. */
export async function markDealLost(input: {
  id: string;
  reason?: string;
}): Promise<DealBoardResult> {
  const reason = (input.reason ?? "").trim();
  if (reason) return asBoardResult(await markLost(input.id, reason));
  return asBoardResult(await moveDealStage(input.id, "lost"));
}
