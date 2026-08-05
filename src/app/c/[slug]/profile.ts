import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { IDENTITY_SELECT, resolveIdentity } from "@/lib/crm/identity";
import type { CrmProfile } from "@/lib/crm/types";

/**
 * Reading a card.
 *
 * The card is public, but it is read through the service role anyway so the
 * page keeps working if the public read policy is ever tightened, and so the
 * page and the vCard route resolve a slug exactly the same way.
 */

export function crmServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * One profile by slug. Wrapped in `cache` so the metadata pass and the render
 * pass of the same request share a single round trip, which matters when the
 * phone reading this is on conference wifi.
 */
export const getCardProfile = cache(async (slug: string): Promise<CrmProfile | null> => {
  const trimmed = (slug || "").trim().toLowerCase();
  if (!trimmed || trimmed.length > 80 || !/^[a-z0-9-]+$/.test(trimmed)) return null;

  const supabase = crmServiceClient();
  if (!supabase) {
    console.error("Card page: missing platform credentials.");
    return null;
  }

  const { data, error } = await supabase
    .from("crm_profiles")
    .select(IDENTITY_SELECT)
    .eq("slug", trimmed)
    .maybeSingle();

  if (error) {
    console.error("Card page: failed to load profile:", error.message);
    return null;
  }
  if (!data || data.is_active === false) return null;

  return resolveIdentity(data as unknown as Parameters<typeof resolveIdentity>[0]);
});

/** Turns a stored link into something an anchor can use, http or https only. */
export function externalHref(value: string | null | undefined): string | null {
  if (!value) return null;
  const raw = value.trim();
  if (!raw) return null;
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** The visible half of a link, with the scheme and any trailing slash removed. */
export function prettyHost(value: string): string {
  return value.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}
