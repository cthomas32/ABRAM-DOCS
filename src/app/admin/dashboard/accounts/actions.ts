"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { readConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
// A `"use server"` module may only export async functions, so the
// lifecycle list lives in a plain module that both sides may import.
import type { AccountLifecycle } from "./lifecycles";

/**
 * Writing a company record.
 *
 * The permission check is repeated on every action even though the page
 * made it, because a server action is reachable without the page. Row
 * level security is the second lock.
 *
 * Two fields here decide money rather than describe a company:
 *
 *   first_contact_at  a registration is only valid if it was filed
 *                     before this instant, so the registration guard
 *                     reads it. Nothing else writes it.
 *   the exclusions    is_comped, is_company_managed and carve_out each
 *                     remove the account from commission entirely.
 *
 * `domain` is stored lowercased. The uniqueness index is on
 * `lower(domain)` but lookups elsewhere compare the raw column, so an
 * account typed as "Helix.com" would be found by the index and missed by
 * every query. Normalising on the way in removes the difference.
 */

const MAX_NAME = 200;
const MAX_DOMAIN = 200;
const MAX_SHORT = 120;
const MAX_NOTES = 4000;

export interface AccountResult {
  ok: boolean;
  error?: string;
  accountId?: string;
}

export interface AccountInput {
  name: string;
  domain: string | null;
  website: string | null;
  industry: string | null;
  sizeBand: string | null;
  city: string | null;
  country: string | null;
  lifecycle: AccountLifecycle;
  /** ISO instant, or null when nobody has spoken to them yet. */
  firstContactAt: string | null;
  isComped: boolean;
  isCompanyManaged: boolean;
  carveOut: string | null;
  notes: string | null;
}

function text(value: string | null | undefined, limit: number): string | null {
  const trimmed = (value ?? "").trim().slice(0, limit);
  return trimmed || null;
}

/** Bare host, lowercased. Accepts a pasted URL or a typed domain. */
function normalizeDomain(raw: string | null | undefined): { domain: string | null; error?: string } {
  const trimmed = (raw ?? "").trim().toLowerCase();
  if (!trimmed) return { domain: null };

  const host = trimmed
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .split("?")[0]
    .replace(/^www\./, "");

  if (!host.includes(".") || /\s/.test(host)) {
    return {
      domain: null,
      error: "Enter the company's web address, for example helix.com. It is what stops the same company being added twice.",
    };
  }
  return { domain: host.slice(0, MAX_DOMAIN) };
}

function instant(value: string | null | undefined): { at: string | null; error?: string } {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return { at: null };
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return { at: null, error: "That first contact date is not a date. Use the date picker." };
  }
  return { at: parsed.toISOString() };
}

function readWriteError(code: string | undefined, fallback: string): string {
  if (code === "23505") return "An account with that web address already exists.";
  if (code === "42501") return "You do not have permission to change this account.";
  return fallback;
}

function refresh() {
  revalidatePath("/admin/dashboard/accounts");
  revalidatePath("/admin/dashboard/deals");
}

/* ------------------------------------------------------------------ */
/*  Create                                                             */
/* ------------------------------------------------------------------ */

export async function createAccount(input: AccountInput): Promise<AccountResult> {
  const supabase = await createClient();
  const user = await readConsoleUser(supabase);

  if (!user) return { ok: false, error: "Sign in again to carry on." };
  if (!can(user, "crm.accounts.manage")) {
    return { ok: false, error: "You do not have permission to add accounts." };
  }

  const name = text(input.name, MAX_NAME);
  if (!name) return { ok: false, error: "Give the account a name." };

  const { domain, error: domainError } = normalizeDomain(input.domain);
  if (domainError) return { ok: false, error: domainError };

  const { at: firstContactAt, error: dateError } = instant(input.firstContactAt);
  if (dateError) return { ok: false, error: dateError };

  const { data, error } = await supabase
    .from("crm_accounts")
    .insert({
      name,
      domain,
      website: text(input.website, MAX_DOMAIN),
      industry: text(input.industry, MAX_SHORT),
      size_band: text(input.sizeBand, MAX_SHORT),
      city: text(input.city, MAX_SHORT),
      country: text(input.country, MAX_SHORT),
      lifecycle: input.lifecycle,
      first_contact_at: firstContactAt,
      is_comped: Boolean(input.isComped),
      is_company_managed: Boolean(input.isCompanyManaged),
      carve_out: text(input.carveOut, MAX_SHORT),
      notes: text(input.notes, MAX_NOTES),
      owner_user_id: user.userId,
      sourced_by: user.userId,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: readWriteError(error?.code, "Could not add the account. Try again.") };
  }

  refresh();
  return { ok: true, accountId: data.id as string };
}

/* ------------------------------------------------------------------ */
/*  Edit                                                               */
/* ------------------------------------------------------------------ */

/** `sourced_by` is left out of the patch. The database refuses to move it. */
export async function updateAccount(
  accountId: string,
  input: AccountInput
): Promise<AccountResult> {
  const supabase = await createClient();
  const user = await readConsoleUser(supabase);

  if (!user) return { ok: false, error: "Sign in again to carry on." };
  if (!can(user, "crm.accounts.manage")) {
    return { ok: false, error: "You do not have permission to edit accounts." };
  }

  const name = text(input.name, MAX_NAME);
  if (!name) return { ok: false, error: "Give the account a name." };

  const { domain, error: domainError } = normalizeDomain(input.domain);
  if (domainError) return { ok: false, error: domainError };

  const { at: firstContactAt, error: dateError } = instant(input.firstContactAt);
  if (dateError) return { ok: false, error: dateError };

  const { error } = await supabase
    .from("crm_accounts")
    .update({
      name,
      domain,
      website: text(input.website, MAX_DOMAIN),
      industry: text(input.industry, MAX_SHORT),
      size_band: text(input.sizeBand, MAX_SHORT),
      city: text(input.city, MAX_SHORT),
      country: text(input.country, MAX_SHORT),
      lifecycle: input.lifecycle,
      first_contact_at: firstContactAt,
      is_comped: Boolean(input.isComped),
      is_company_managed: Boolean(input.isCompanyManaged),
      carve_out: text(input.carveOut, MAX_SHORT),
      notes: text(input.notes, MAX_NOTES),
    })
    .eq("id", accountId);

  if (error) {
    return { ok: false, error: readWriteError(error.code, "Could not save the account. Try again.") };
  }

  refresh();
  return { ok: true, accountId };
}

/**
 * Archiving hides an account from the list and keeps everything hanging
 * off it. Nothing here deletes: an account removed a year from now takes
 * the evidence of who found it with it.
 */
export async function setAccountArchived(
  accountId: string,
  archived: boolean
): Promise<AccountResult> {
  const supabase = await createClient();
  const user = await readConsoleUser(supabase);

  if (!user) return { ok: false, error: "Sign in again to carry on." };
  if (!can(user, "crm.accounts.manage")) {
    return { ok: false, error: "You do not have permission to edit accounts." };
  }

  const { error } = await supabase
    .from("crm_accounts")
    .update({ archived })
    .eq("id", accountId);

  if (error) {
    return { ok: false, error: readWriteError(error.code, "Could not change the account. Try again.") };
  }

  refresh();
  return { ok: true, accountId };
}
