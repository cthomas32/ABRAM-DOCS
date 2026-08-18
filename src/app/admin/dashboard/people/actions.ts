"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/resend";
import { readConsoleUser } from "@/lib/auth/consoleUser";
import { can, type ConsoleRole, type GrowthStage } from "@/lib/auth/permissions";

/**
 * Handing out and taking back access.
 *
 * Three things make this safe enough to be a screen rather than a
 * database job:
 *
 * 1. **Only an owner reaches it**, checked here and enforced again by the
 *    policy on admin_users and by the trigger that refuses a role change
 *    from anybody else. A server action is a public endpoint; the check
 *    in this file is the first of three and not the only one.
 *
 * 2. **You cannot lock the company out.** The last active owner cannot be
 *    demoted or deactivated. Without this, one careless click leaves a
 *    console nobody can administer and a recovery that needs the service
 *    role key.
 *
 * 3. **Rates are a history, not a field.** Advancing somebody's stage
 *    closes their current terms row and opens a new one, so every figure
 *    already paid still recomputes to what was actually paid.
 */

const PATH = "/admin/dashboard/people";

export interface PeopleResult {
  ok: boolean;
  error?: string;
}

async function requireOwner() {
  const supabase = await createClient();
  const user = await readConsoleUser(supabase);
  if (!user) return { supabase, user: null, error: "Sign in again to carry on." };
  if (!can(user, "roles.manage")) {
    return { supabase, user: null, error: "Only an owner can change who has access." };
  }
  return { supabase, user, error: null };
}

/** How many active owners would remain if this row changed as proposed. */
async function otherActiveOwners(
  supabase: Awaited<ReturnType<typeof createClient>>,
  excludingUserId: string
): Promise<number> {
  const { count } = await supabase
    .from("admin_users")
    .select("user_id", { count: "exact", head: true })
    .eq("role", "owner")
    .eq("is_active", true)
    .neq("user_id", excludingUserId);
  return count ?? 0;
}

export async function setRole(input: {
  userId: string;
  role: ConsoleRole;
  growthStage: GrowthStage | null;
}): Promise<PeopleResult> {
  const { supabase, user, error } = await requireOwner();
  if (!user) return { ok: false, error: error ?? "Not permitted." };

  // A growth stage on a non-growth role would make the rate lookup
  // ambiguous, and the database refuses it outright.
  const growthStage = input.role === "growth" ? input.growthStage : null;

  const { data: target } = await supabase
    .from("admin_users")
    .select("user_id, role, is_active")
    .eq("user_id", input.userId)
    .maybeSingle();

  if (!target) return { ok: false, error: "That account no longer exists." };

  if (
    target.role === "owner" &&
    input.role !== "owner" &&
    (await otherActiveOwners(supabase, input.userId)) === 0
  ) {
    return {
      ok: false,
      error: "This is the last owner. Promote somebody else first, or nobody can administer the console.",
    };
  }

  const { error: writeError } = await supabase
    .from("admin_users")
    .update({ role: input.role, growth_stage: growthStage })
    .eq("user_id", input.userId);

  if (writeError) return { ok: false, error: "Could not change the role. Try again." };

  revalidatePath(PATH);
  return { ok: true };
}

export async function setActive(input: {
  userId: string;
  isActive: boolean;
}): Promise<PeopleResult> {
  const { supabase, user, error } = await requireOwner();
  if (!user) return { ok: false, error: error ?? "Not permitted." };

  if (
    !input.isActive &&
    (await otherActiveOwners(supabase, input.userId)) === 0
  ) {
    const { data: target } = await supabase
      .from("admin_users")
      .select("role")
      .eq("user_id", input.userId)
      .maybeSingle();

    if (target?.role === "owner") {
      return { ok: false, error: "This is the last active owner and cannot be deactivated." };
    }
  }

  const { error: writeError } = await supabase
    .from("admin_users")
    .update({ is_active: input.isActive })
    .eq("user_id", input.userId);

  if (writeError) return { ok: false, error: "Could not update the account. Try again." };

  revalidatePath(PATH);
  return { ok: true };
}

/**
 * Recording what a growth partner earns, from a given date.
 *
 * Closes any open terms row the day before the new one starts rather than
 * overwriting it. Two open rows would make "the current rate" a question
 * with two answers, and the database has a unique index that refuses it —
 * this is the ordering that keeps that index satisfied.
 */
export async function setPartnerTerms(input: {
  userId: string;
  stage: GrowthStage;
  closeRatePct: number;
  sourceRatePct: number;
  tailMonths: number;
  clawbackDays: number;
  effectiveFrom: string;
  note: string;
}): Promise<PeopleResult> {
  const { supabase, user, error } = await requireOwner();
  if (!user) return { ok: false, error: error ?? "Not permitted." };

  const closeRate = input.closeRatePct / 100;
  const sourceRate = input.sourceRatePct / 100;

  if (!Number.isFinite(closeRate) || closeRate < 0 || closeRate > 1) {
    return { ok: false, error: "The closing rate has to be between 0 and 100 percent." };
  }
  if (!Number.isFinite(sourceRate) || sourceRate < 0 || sourceRate > 1) {
    return { ok: false, error: "The sourcing rate has to be between 0 and 100 percent." };
  }
  if (!input.effectiveFrom) {
    return { ok: false, error: "Give the date these rates start from." };
  }

  const startsOn = new Date(input.effectiveFrom + "T00:00:00Z");
  if (Number.isNaN(startsOn.getTime())) {
    return { ok: false, error: "That start date could not be read." };
  }

  // The day before the new row begins. Terms are inclusive at both ends,
  // so an end equal to the new start would double-count that day.
  const closesOn = new Date(startsOn.getTime() - 86_400_000).toISOString().slice(0, 10);

  const { error: closeError } = await supabase
    .from("growth_partner_terms")
    .update({ effective_to: closesOn })
    .eq("user_id", input.userId)
    .is("effective_to", null);

  if (closeError) {
    return { ok: false, error: "Could not close the previous terms. Nothing was changed." };
  }

  const { error: insertError } = await supabase.from("growth_partner_terms").insert({
    user_id: input.userId,
    stage: input.stage,
    close_rate: closeRate,
    source_rate: sourceRate,
    tail_months: input.tailMonths,
    clawback_days: input.clawbackDays,
    effective_from: input.effectiveFrom,
    note: input.note.trim().slice(0, 500) || null,
  });

  if (insertError) {
    return { ok: false, error: "Could not record the new terms. Try again." };
  }

  revalidatePath(PATH);
  return { ok: true };
}

/**
 * Inviting somebody.
 *
 * Needs the service role, because creating an auth user is an
 * administrative act the signed-in session cannot perform on its own. The
 * admin_users row is written in the same call so there is never a window
 * where an account exists with no role — that window is exactly the state
 * the no-access screen exists to explain, and it should be rare rather
 * than a routine step of onboarding.
 */
export async function inviteTeammate(input: {
  email: string;
  fullName: string;
  role: ConsoleRole;
  growthStage: GrowthStage | null;
}): Promise<PeopleResult> {
  const { user, error } = await requireOwner();
  if (!user) return { ok: false, error: error ?? "Not permitted." };

  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return { ok: false, error: "That does not look like an email address." };
  }

  let service;
  try {
    service = createServiceClient();
  } catch {
    return {
      ok: false,
      error: "Inviting needs the service role key, which is not configured on this deployment.",
    };
  }

  const { data: invited, error: inviteError } =
    await service.auth.admin.inviteUserByEmail(email);

  if (inviteError || !invited?.user) {
    // An address that already has an account is a common and recoverable
    // case, so it gets its own sentence rather than the generic failure.
    if (inviteError?.message?.toLowerCase().includes("already")) {
      return { ok: false, error: "That address already has an account." };
    }
    return { ok: false, error: inviteError?.message || "Could not send the invitation." };
  }

  const { error: rowError } = await service.from("admin_users").upsert(
    {
      user_id: invited.user.id,
      email,
      full_name: input.fullName.trim() || null,
      role: input.role,
      growth_stage: input.role === "growth" ? input.growthStage : null,
      invited_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (rowError) {
    return {
      ok: false,
      error: "The invitation was sent but the role could not be saved. Set it from the list below.",
    };
  }

  revalidatePath(PATH);
  return { ok: true };
}
