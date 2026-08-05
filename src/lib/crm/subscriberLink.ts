/**
 * The bridge between a person you met and the mailing list.
 *
 * One rule governs this whole file. A contact becomes a subscriber only when
 * they ticked the box themselves. Handing over a business card is not a
 * request to be mailed, and treating it as one is both a legal problem and
 * the fastest way to lose a sending domain. Every entry point below either
 * proves consent from the committed contact row, or is a subscription the
 * person started on the site of their own accord. There is no third path.
 *
 * Both directions are side effects. Neither may fail the thing that triggered
 * it, so nothing here throws: a failure is logged and the caller carries on.
 *
 * Idempotency comes from `crm_contacts.subscriber_id`. A contact that already
 * carries one is skipped, and the write that sets it is conditional on the
 * column still being null, so a queued retry or a race writes the link and
 * the timeline entry exactly once.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { addSubscriber, createServiceClient } from "@/utils/resend";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Deliberately strict. A malformed address that reaches the list costs a
 * bounce against the sending domain, and the capture form asks for an email
 * without insisting on one, so a typo is the expected failure here.
 */
const EMAIL = /^[^\s@,;<>"]+@[^\s@,;<>".]+\.[^\s@,;<>"]{2,}$/;

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || trimmed.length > 200) return null;
  return EMAIL.test(trimmed) ? trimmed : null;
}

/** Escapes the characters ILIKE treats as wildcards, underscore included. */
function ilikeEscape(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/** "Jane Q. Doe" becomes Jane, and Q. Doe. A single word has no surname. */
function splitName(fullName: string | null | undefined): {
  firstName?: string;
  lastName?: string;
} {
  const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return {};
  if (parts.length === 1) return { firstName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

async function findSubscriberIdByEmail(
  supabase: SupabaseClient,
  email: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("subscribers")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.error("Subscriber link: could not read the subscriber back:", error.message);
    return null;
  }
  return (data?.id as string | undefined) ?? null;
}

/* ------------------------------------------------------------------ */
/*  Capture, when the box was ticked                                   */
/* ------------------------------------------------------------------ */

export interface ConsentSubscribeArgs {
  supabase: SupabaseClient;
  /** The contact row, already committed. Consent is re read from it. */
  contactId: string;
  /** Name as submitted, used only to fill the subscriber's first and last name. */
  fullName: string;
  /** The event they were met at, for the timeline entry. */
  eventName?: string | null;
}

export interface ConsentSubscribeResult {
  /** The subscriber now linked to this contact, or null when nothing was done. */
  subscriberId: string | null;
  /** Why nothing was done, for the log. */
  skipped?:
    | "no_consent"
    | "no_email"
    | "already_linked"
    | "contact_missing"
    | "subscribe_failed"
    | "error";
}

/**
 * Turns a consenting contact into a subscriber, once.
 *
 * Runs after the contact row is committed, never before, so consent is read
 * from the row rather than from the payload that claimed it. Creation goes
 * through `addSubscriber`, the same call every other signup on the site makes,
 * so the local table and the Resend side stay consistent with each other.
 */
export async function subscribeConsentingContact(
  args: ConsentSubscribeArgs,
): Promise<ConsentSubscribeResult> {
  const { supabase, contactId, fullName, eventName } = args;

  try {
    /* The committed row is the only authority on consent. */
    const { data: contact, error: readError } = await supabase
      .from("crm_contacts")
      .select("id, email, full_name, consent_marketing, subscriber_id")
      .eq("id", contactId)
      .maybeSingle();

    if (readError) {
      console.error("Subscriber link: could not read the contact:", readError.message);
      return { subscriberId: null, skipped: "error" };
    }
    if (!contact) return { subscriberId: null, skipped: "contact_missing" };

    /* The gate. Everything below this line requires an explicit tick. */
    if (contact.consent_marketing !== true) return { subscriberId: null, skipped: "no_consent" };

    /* Already done on an earlier attempt at this same capture. */
    if (contact.subscriber_id) {
      return { subscriberId: contact.subscriber_id as string, skipped: "already_linked" };
    }

    const email = normalizeEmail(contact.email);
    if (!email) return { subscriberId: null, skipped: "no_email" };

    const { firstName, lastName } = splitName(
      (contact.full_name as string | null) || fullName,
    );

    /* Upserts on the unique email, so a second run cannot make a second row. */
    const result = await addSubscriber({
      email,
      firstName,
      lastName,
      isMarketingList: true,
    });

    const alreadySubscribed = Boolean(
      (result as { alreadySubscribed?: boolean }).alreadySubscribed,
    );

    const subscriberId = await findSubscriberIdByEmail(supabase, email);
    if (!subscriberId) return { subscriberId: null, skipped: "subscribe_failed" };

    /* Conditional on the column still being null. Whichever concurrent run
       loses this update writes no timeline entry, so the drawer shows one
       line rather than one per retry. */
    const { data: linked, error: linkError } = await supabase
      .from("crm_contacts")
      .update({ subscriber_id: subscriberId })
      .eq("id", contactId)
      .is("subscriber_id", null)
      .select("id");

    if (linkError) {
      console.error("Subscriber link: could not link the contact:", linkError.message);
      return { subscriberId, skipped: "error" };
    }

    if (!linked || linked.length === 0) return { subscriberId, skipped: "already_linked" };

    const where = eventName ? ` at ${eventName}` : "";
    const body = alreadySubscribed
      ? `Ticked the newsletter box${where}. They were already on the ABRAM list, so the two records are now linked.`
      : `Ticked the newsletter box${where} and joined the ABRAM list.`;

    const { error: noteError } = await supabase.from("crm_interactions").insert({
      contact_id: contactId,
      kind: "note",
      body,
      meta: {
        event: "newsletter_subscribed",
        direction: "capture_consent",
        subscriber_id: subscriberId,
        email,
        already_subscribed: alreadySubscribed,
      },
      occurred_at: new Date().toISOString(),
    });

    if (noteError) {
      console.error("Subscriber link: could not write the timeline entry:", noteError.message);
    }

    return { subscriberId };
  } catch (err) {
    console.error("Subscriber link: consent subscribe threw:", err);
    return { subscriberId: null, skipped: "error" };
  }
}

/* ------------------------------------------------------------------ */
/*  The other direction                                                */
/* ------------------------------------------------------------------ */

export interface SiteSignupLinkResult {
  /** How many contact records were linked to this subscriber. */
  linked: number;
  subscriberId: string | null;
}

/**
 * Somebody met at a conference who signs up on the site weeks later.
 *
 * Called after a newsletter signup has already succeeded. It links, and it
 * writes a line on the timeline so the history shows they came back on their
 * own. It never changes their consent flag and never creates a contact,
 * because a subscriber who was never met is not a lead you have.
 *
 * Matching is case insensitive across non archived contacts, and every
 * candidate is re verified in JavaScript so a wildcard that survived the
 * pattern can never attach a stranger's record to somebody's address.
 */
export async function linkSubscriberToContacts(
  rawEmail: string,
  supabaseOverride?: SupabaseClient,
): Promise<SiteSignupLinkResult> {
  const empty: SiteSignupLinkResult = { linked: 0, subscriberId: null };

  try {
    const email = normalizeEmail(rawEmail);
    if (!email) return empty;

    const supabase = supabaseOverride ?? createServiceClient();

    const subscriberId = await findSubscriberIdByEmail(supabase, email);
    if (!subscriberId) return empty;

    const matches = await findUnlinkedContactsByEmail(supabase, email);
    if (matches.length === 0) return { linked: 0, subscriberId };

    let linked = 0;

    for (const contact of matches) {
      const { data: updated, error: linkError } = await supabase
        .from("crm_contacts")
        .update({ subscriber_id: subscriberId })
        .eq("id", contact.id)
        .is("subscriber_id", null)
        .select("id");

      if (linkError) {
        console.error("Subscriber link: could not link a contact:", linkError.message);
        continue;
      }
      if (!updated || updated.length === 0) continue;

      linked += 1;

      const { error: noteError } = await supabase.from("crm_interactions").insert({
        contact_id: contact.id,
        kind: "note",
        body: "Subscribed to the ABRAM newsletter on the site, of their own accord.",
        meta: {
          event: "newsletter_subscribed",
          direction: "site_signup",
          subscriber_id: subscriberId,
          email,
        },
        occurred_at: new Date().toISOString(),
      });

      if (noteError) {
        console.error("Subscriber link: could not write the timeline entry:", noteError.message);
      }
    }

    return { linked, subscriberId };
  } catch (err) {
    console.error("Subscriber link: site signup link threw:", err);
    return empty;
  }
}

/**
 * Every non archived contact carrying this address and no subscriber yet.
 * There is one row per owner at most, because the unique index on the CRM
 * already forbids two live contacts sharing an address under one profile.
 */
export async function findUnlinkedContactsByEmail(
  supabase: SupabaseClient,
  email: string,
): Promise<{ id: string; profile_id: string; email: string | null }[]> {
  const columns = "id, profile_id, email";

  const exact = await supabase
    .from("crm_contacts")
    .select(columns)
    .eq("archived", false)
    .is("subscriber_id", null)
    .eq("email", email)
    .limit(20);

  if (exact.error) {
    console.error("Subscriber link: contact lookup failed:", exact.error.message);
    return [];
  }

  const rows = (exact.data || []) as { id: string; profile_id: string; email: string | null }[];

  /* Older rows may carry mixed case. Widen with an escaped pattern and then
     prove each match in JavaScript before trusting it. */
  const loose = await supabase
    .from("crm_contacts")
    .select(columns)
    .eq("archived", false)
    .is("subscriber_id", null)
    .ilike("email", ilikeEscape(email))
    .limit(20);

  const found = new Map(rows.map((row) => [row.id, row]));

  for (const row of (loose.data || []) as typeof rows) {
    if (typeof row.email === "string" && row.email.toLowerCase() === email) {
      found.set(row.id, row);
    }
  }

  return [...found.values()];
}
