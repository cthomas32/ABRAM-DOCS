/**
 * Reading the /demos password out of the database.
 *
 * Split from `demosGate.ts` on purpose. That file is arithmetic on
 * strings and is tested as such; this one is the part that talks to
 * Supabase, and keeping the two apart is what lets the gate's rules be
 * tested without a database.
 *
 * **Why the service key.** `site_settings` has no anon read policy — the
 * first thing in it is a password, and a table the browser can read is a
 * password the browser can read. The public page is served to signed-out
 * visitors, so the only key on hand that can see the row is the service
 * one, used here on the server and nowhere near a response body.
 *
 * **Why the cache.** /demos is `force-dynamic`, so without one every view
 * of the page would be a round trip to fetch a word that changes twice a
 * year. Sixty seconds matches the rest of the page's freshness. The cost
 * is that a password change takes up to a minute to be felt on an already
 * warm instance, which is the right trade for a shared curtain.
 */

import { createClient } from "@supabase/supabase-js";
import { DEMOS_PASSWORD_KEY, resolveDemosPassword } from "./demosGate";

const CACHE_TTL_MS = 60_000;

let cached: { value: string | null; at: number } | null = null;

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * The stored password, or null when there is not one.
 *
 * Null is also what an unreachable database gives back. That is
 * deliberate: falling through to the environment leaves the page locked
 * with the previous word rather than locked with nothing, and a failure
 * that hands out access would be the worse of the two.
 */
export async function storedDemosPassword(): Promise<string | null> {
  const now = Date.now();
  if (cached && now - cached.at < CACHE_TTL_MS) return cached.value;

  let value: string | null = null;

  try {
    const supabase = serviceClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", DEMOS_PASSWORD_KEY)
        .maybeSingle();

      if (error) console.error("Could not read the demos password:", error.message);
      else {
        const stored = (data?.value as string | undefined)?.trim();
        value = stored && stored.length > 0 ? stored : null;
      }
    }
  } catch (err) {
    console.error("Could not read the demos password:", err);
  }

  cached = { value, at: now };
  return value;
}

/** The word the gate is checking against right now. */
export async function currentDemosPassword(): Promise<string> {
  return resolveDemosPassword(await storedDemosPassword());
}

/**
 * Drop the cache after a save, so the person who just changed it sees the
 * change immediately on the instance they are on. Every other instance
 * catches up within the minute on its own.
 */
export function forgetDemosPassword(): void {
  cached = null;
}
