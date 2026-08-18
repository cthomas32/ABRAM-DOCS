"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { readConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import { parseSyncEvent } from "@/lib/growth/collectionsSync";
import { applySyncEvent, serviceClient } from "@/lib/growth/collectionsSyncService";

/**
 * Replaying a collections sync event.
 *
 * The stored payload is the one that arrived, verified, from
 * abram-network. Replaying re-applies it through the same code path the
 * route runs — `applySyncEvent` — rather than posting it back to our own
 * URL. Two reasons: signing a request to ourselves would mean holding the
 * shared secret in a second place for no gain, and the round trip could
 * fail for reasons that have nothing to do with the thing being retried.
 *
 * WHAT A REPLAY IS FOR
 *
 * A mapping bug. An event that landed against an invented account because
 * the real one had no customer reference; an event that failed outright
 * because the console had no owner. Fix the data, press replay, and the
 * event is applied against the corrected world. It is not a way to
 * re-collect money: `revenue_collections.external_payment_ref` is unique,
 * so a payment already in the ledger stays there exactly once.
 *
 * OWNER ONLY, and for the same reason `recordCollection` is: every row
 * this touches is money somebody is paid on.
 */

export interface ReplayResult {
  ok: boolean;
  error?: string;
  note?: string;
}

export async function replaySyncEvent(eventId: string): Promise<ReplayResult> {
  const supabase = await createClient();
  const user = await readConsoleUser(supabase);

  if (!user) return { ok: false, error: "Sign in again to carry on." };
  if (!can(user, "commission.manage")) {
    return { ok: false, error: "Only an owner replays a sync event." };
  }

  const id = eventId?.trim();
  if (!id) return { ok: false, error: "No event was named." };

  // Read through the console's own client, so RLS decides whether this
  // person may see the event at all before the service role touches it.
  const { data } = await supabase
    .from("revenue_sync_events")
    .select("event_id, payload")
    .eq("event_id", id)
    .maybeSingle();

  const row = data as { event_id: string; payload: unknown } | null;
  if (!row) return { ok: false, error: "That event is not available." };

  const parsed = parseSyncEvent(row.payload);
  if (!parsed.ok) {
    return { ok: false, error: `The stored payload cannot be read: ${parsed.error}` };
  }

  const service = serviceClient();
  if (!service) {
    return { ok: false, error: "The sync is not configured on this environment." };
  }

  const result = await applySyncEvent(service, parsed.event, { replay: true });

  revalidatePath("/admin/dashboard/revenue");

  return result.ok ? { ok: true, note: result.note } : { ok: false, error: result.note };
}
