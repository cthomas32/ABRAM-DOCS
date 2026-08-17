"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { readConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import { declineDeadlineFrom, registrationExpiryFrom } from "@/lib/crm/attribution";
import { REGISTRATION_DECLINE_BUSINESS_DAYS } from "@/lib/crm/constants";

/**
 * Filing a claim on a named account.
 *
 * Both clocks are resolved to real timestamps here, at the moment of
 * filing, rather than being computed whenever somebody looks. "Five
 * business days from now" is a different instant depending on when you
 * ask it, and a deadline that moves is not a deadline. What was true when
 * it was filed stays true.
 *
 * The permission check is repeated even though the middleware and the
 * page already made it. A server action is a public HTTP endpoint — it
 * does not inherit the guard on the page that renders the form, and
 * anybody who can read the page's JavaScript can call it directly.
 */

const MAX_NAME = 200;
const MAX_DOMAIN = 200;
const MAX_RATIONALE = 1000;

export interface RegistrationResult {
  ok: boolean;
  error?: string;
}

/** Bare host, lowercased. Accepts a pasted URL or a typed domain. */
function normalizeDomain(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return null;

  const withoutScheme = trimmed.replace(/^https?:\/\//, "");
  const host = withoutScheme.split("/")[0].split("?")[0].replace(/^www\./, "");

  // A domain has a dot and no spaces. Anything else is somebody typing a
  // company name into the wrong box, and storing it would break the
  // uniqueness guarantee this column exists to provide.
  if (!host.includes(".") || /\s/.test(host)) return null;
  return host.slice(0, MAX_DOMAIN);
}

export async function fileRegistration(input: {
  accountName: string;
  accountDomain: string;
  rationale: string;
}): Promise<RegistrationResult> {
  const supabase = await createClient();
  const user = await readConsoleUser(supabase);

  if (!user) return { ok: false, error: "Sign in again to carry on." };
  if (!can(user, "crm.registrations.file")) {
    return { ok: false, error: "You do not have permission to register accounts." };
  }

  const accountName = input.accountName.trim().slice(0, MAX_NAME);
  if (!accountName) return { ok: false, error: "Give the account a name." };

  const accountDomain = normalizeDomain(input.accountDomain);
  if (!accountDomain) {
    return {
      ok: false,
      error: "Enter the company's web address, for example helix.com. It is what stops two people claiming the same account.",
    };
  }

  const rationale = input.rationale.trim().slice(0, MAX_RATIONALE) || null;

  // Refuse early with a sentence rather than letting the unique index
  // reject it with a constraint name. The index is still the backstop
  // against two filings racing.
  const { data: existing } = await supabase
    .from("crm_deal_registrations")
    .select("id, status, requested_by")
    .eq("account_domain", accountDomain)
    .in("status", ["pending", "approved"])
    .maybeSingle();

  if (existing) {
    return {
      ok: false,
      error:
        existing.requested_by === user.userId
          ? "You have already registered this account."
          : "Somebody has already registered this account.",
    };
  }

  // An account already spoken to cannot be claimed. The registration is
  // for accounts nobody here has approached, and first_contact_at is the
  // stored fact that settles it.
  const { data: account } = await supabase
    .from("crm_accounts")
    .select("id, first_contact_at")
    .eq("domain", accountDomain)
    .maybeSingle();

  if (account?.first_contact_at) {
    return {
      ok: false,
      error: "This account has already been contacted, so it cannot be registered.",
    };
  }

  const filedAt = new Date();

  const { error } = await supabase.from("crm_deal_registrations").insert({
    account_id: account?.id ?? null,
    account_name: accountName,
    account_domain: accountDomain,
    requested_by: user.userId,
    requested_at: filedAt.toISOString(),
    rationale,
    status: "pending",
    decline_deadline_at: declineDeadlineFrom(
      filedAt,
      REGISTRATION_DECLINE_BUSINESS_DAYS
    ).toISOString(),
    expires_at: registrationExpiryFrom(filedAt).toISOString(),
  });

  if (error) {
    // 23505 is the unique index catching a race that the lookup above
    // missed by milliseconds.
    if (error.code === "23505") {
      return { ok: false, error: "Somebody registered this account a moment ago." };
    }
    return { ok: false, error: "Could not file the registration. Try again." };
  }

  revalidatePath("/growth/registrations");
  return { ok: true };
}

/**
 * Approving or declining a filed claim.
 *
 * Only an owner reaches this, and the database enforces that
 * independently: the update policy on crm_deal_registrations is
 * is_owner_or_admin(), so a partner calling this directly changes
 * nothing even if this check were removed.
 */
export async function decideRegistration(input: {
  id: string;
  decision: "approved" | "declined";
  reason: string;
}): Promise<RegistrationResult> {
  const supabase = await createClient();
  const user = await readConsoleUser(supabase);

  if (!user) return { ok: false, error: "Sign in again to carry on." };
  if (!can(user, "crm.registrations.decide")) {
    return { ok: false, error: "Only an owner decides a registration." };
  }

  const { data: registration } = await supabase
    .from("crm_deal_registrations")
    .select("id, status, decline_deadline_at")
    .eq("id", input.id)
    .maybeSingle();

  if (!registration) return { ok: false, error: "That registration no longer exists." };
  if (registration.status !== "pending") {
    return { ok: false, error: "That registration has already been decided." };
  }

  // Declining after the window has closed does nothing. The agreement
  // gives a fixed window and letting it lapse is itself the decision, so
  // the refusal is stated plainly rather than quietly accepted.
  if (
    input.decision === "declined" &&
    new Date(registration.decline_deadline_at).getTime() < Date.now()
  ) {
    return {
      ok: false,
      error: "The window to decline this registration has closed, so it stands.",
    };
  }

  const { error } = await supabase
    .from("crm_deal_registrations")
    .update({
      status: input.decision,
      decided_by: user.userId,
      decided_at: new Date().toISOString(),
      decision_reason: input.reason.trim().slice(0, MAX_RATIONALE) || null,
    })
    .eq("id", input.id)
    .eq("status", "pending"); // Conditional, so two decisions cannot race.

  if (error) return { ok: false, error: "Could not record the decision. Try again." };

  revalidatePath("/growth/registrations");
  return { ok: true };
}
