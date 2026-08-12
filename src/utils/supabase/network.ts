import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Read-only client into the abram-network product database, used only to
 * serve public creator bio pages at /l/<slug> (see src/app/l/[slug]/page.tsx).
 *
 * This is a different Supabase project from the one src/utils/supabase/static
 * points at (that one is this repo's own marketing/docs database). Both
 * NETWORK_SUPABASE_URL and NETWORK_SUPABASE_ANON_KEY are server-only env
 * vars — never NEXT_PUBLIC_ — because the only consumer is a server
 * component; the anon key never needs to reach the browser bundle. Client-
 * side view/click tracking goes through /api/l-track instead, which holds
 * these same env vars server-side and proxies the RPC call.
 *
 * The anon key only ever reads `public_link_pages` / `public_link_blocks`
 * (two views scoped to published content) and executes
 * `record_link_page_event` — see supabase/migrations/20270823000000_link_hub_app.sql
 * in the abram-network repo for the full grant boundary.
 */

const NETWORK_SUPABASE_URL = process.env.NETWORK_SUPABASE_URL;
const NETWORK_SUPABASE_ANON_KEY = process.env.NETWORK_SUPABASE_ANON_KEY;

let cachedClient: SupabaseClient | null | undefined;

/**
 * Returns null (never throws) when the env vars are missing, so a caller
 * can notFound() instead of crashing the page or the build.
 */
export function getNetworkSupabase(): SupabaseClient | null {
  if (cachedClient !== undefined) return cachedClient;

  if (!NETWORK_SUPABASE_URL || !NETWORK_SUPABASE_ANON_KEY) {
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = createSupabaseClient(NETWORK_SUPABASE_URL, NETWORK_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return cachedClient;
}
