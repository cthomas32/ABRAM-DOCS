/**
 * Reading the signed-in person's role on the server.
 *
 * Everything that guards a page or a server action starts here. Two rules
 * hold it up:
 *
 * 1. **No row means no access.** An auth.users record with no admin_users
 *    row is authenticated and unauthorized, and this returns null for it.
 *    That is the correct outcome for an account created by mistake, and
 *    it means the failure of a lookup is refusal rather than escalation.
 *
 * 2. **A failed query is a refusal too.** If the database is unreachable
 *    or the select errors, this returns null. Never fall back to a
 *    permissive default here — an outage must not open the console.
 */

import { cache } from "react";
import { createClient } from "@/utils/supabase/server";
import type { ConsoleRole, ConsoleUser, GrowthStage } from "./permissions";

const CONSOLE_USER_COLUMNS = "user_id, email, full_name, role, growth_stage, member_id, is_active";

/**
 * The signed-in console user, or null.
 *
 * Wrapped in React's `cache` so a layout, a page and three server actions
 * in the same request share one round trip instead of making five.
 */
export const getConsoleUser = cache(async (): Promise<ConsoleUser | null> => {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return null;

    const { data, error } = await supabase
      .from("admin_users")
      .select(CONSOLE_USER_COLUMNS)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data) return null;

    return {
      userId: data.user_id as string,
      email: (data.email as string) ?? user.email ?? "",
      fullName: (data.full_name as string | null) ?? null,
      role: data.role as ConsoleRole,
      growthStage: (data.growth_stage as GrowthStage | null) ?? null,
      memberId: (data.member_id as string | null) ?? null,
      isActive: Boolean(data.is_active),
    };
  } catch {
    // Unreachable database, malformed cookie, anything. All of it means
    // "we could not establish who this is", which is a refusal.
    return null;
  }
});

/**
 * The same lookup for a route handler or a server action that already
 * holds a client. Kept separate from the cached version because a webhook
 * has no request-scoped cache to share and passing the client in avoids
 * building a second one.
 */
export async function readConsoleUser(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<ConsoleUser | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("admin_users")
      .select(CONSOLE_USER_COLUMNS)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data) return null;

    return {
      userId: data.user_id as string,
      email: (data.email as string) ?? user.email ?? "",
      fullName: (data.full_name as string | null) ?? null,
      role: data.role as ConsoleRole,
      growthStage: (data.growth_stage as GrowthStage | null) ?? null,
      memberId: (data.member_id as string | null) ?? null,
      isActive: Boolean(data.is_active),
    };
  } catch {
    return null;
  }
}
