/**
 * How many follow ups are waiting on the person reading the screen.
 *
 * The number the navigation badge shows, and the only place it is
 * defined. "Waiting" means open and due by the end of today, in the
 * reader's own timezone as far as a server can know it, because a badge
 * that counts every task ever filed stops being read within a week.
 *
 * Unassigned tasks count too. A follow up nobody picked up is exactly the
 * thing a queue exists to surface, and on a team of two there is no
 * ambiguity about whose it is.
 *
 * A failed read returns zero rather than throwing. The badge is a
 * convenience and must never be the reason the console fails to render.
 */

import { createClient } from "@/utils/supabase/server";

/** The last instant of today, as a UTC timestamp string. */
function endOfToday(): string {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

export async function openTaskCount(userId: string): Promise<number> {
  try {
    const supabase = await createClient();

    const { count, error } = await supabase
      .from("crm_tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", "open")
      .lte("due_at", endOfToday())
      .or(`assigned_to.eq.${userId},assigned_to.is.null`);

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}
