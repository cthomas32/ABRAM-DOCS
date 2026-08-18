/**
 * The one way a feed becomes a person.
 *
 * Subscribers, event signups and form fills each used to be their own
 * object with its own idea of who a person is. They are feeds now, and
 * every one of them lands here, so there is exactly one merge rule:
 *
 *   1. Match on lowercased email. There is no other key that works —
 *      names are typed three ways and ids are per-table.
 *   2. If a live contact matches, add the source and advance the
 *      lifecycle. Never overwrite a name, a company or an owner: the
 *      person record is the more considered of the two.
 *   3. If nothing matches, create the contact with the feed's values.
 *   4. Anything without a usable email is refused rather than guessed.
 *
 * Idempotent by construction. Running it twice on the same subscriber
 * adds no row and changes no field, because step 2 computes the same set
 * and the same stage it computed the first time.
 *
 * The caller passes its own Supabase client, so row level security
 * decides what can be read and written. Nothing here is SECURITY
 * DEFINER and nothing here bypasses a policy.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeEmail } from "./subscriberLink";
import {
  advanceLifecycle,
  withSource,
  type ContactSource,
  type LifecycleStage,
} from "./people";

export interface FeedPerson {
  email: string | null | undefined;
  fullName?: string | null;
  company?: string | null;
  jobTitle?: string | null;
  /** How they reached us this time. */
  source: ContactSource;
  /** The furthest this feed is entitled to claim. Never moves anybody back. */
  lifecycle: LifecycleStage;
  /** Set when the feed is the mailing list, so the link is recorded too. */
  subscriberId?: string | null;
  /** Set when the feed is an event signup. */
  eventId?: string | null;
}

export type SyncOutcome = "created" | "linked" | "unchanged" | "refused";

export interface SyncResult {
  ok: boolean;
  outcome: SyncOutcome;
  contactId?: string;
  error?: string;
}

/**
 * The profile a created contact is filed under.
 *
 * `crm_contacts.profile_id` is NOT NULL, and a conversion has no card to
 * hang off, so it uses the first profile — the same one the capture
 * routes write to. A database with no profile at all cannot hold a
 * contact, and saying so is better than a foreign key error.
 */
async function firstProfileId(supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase
    .from("crm_profiles")
    .select("id")
    .order("created_at")
    .limit(1);
  const row = Array.isArray(data) ? data[0] : data;
  return (row as { id?: string } | null)?.id ?? null;
}

export async function syncFeedPerson(
  supabase: SupabaseClient,
  person: FeedPerson
): Promise<SyncResult> {
  const email = normalizeEmail(person.email);
  if (!email) {
    return {
      ok: false,
      outcome: "refused",
      error: "That row has no usable email address, so it cannot be matched to a person.",
    };
  }

  /* ---------------------------------------------------------------- */
  /*  Existing person                                                  */
  /* ---------------------------------------------------------------- */

  const existing = await supabase
    .from("crm_contacts")
    .select("id, sources, lifecycle_stage, subscriber_id, event_id")
    .eq("archived", false)
    .ilike("email", email)
    .limit(1);

  if (existing.error) {
    return { ok: false, outcome: "refused", error: "The contact table could not be read." };
  }

  const match = (existing.data ?? [])[0] as
    | {
        id: string;
        sources: string[] | null;
        lifecycle_stage: string | null;
        subscriber_id: string | null;
        event_id: string | null;
      }
    | undefined;

  if (match) {
    const sources = withSource(match.sources, person.source);
    const lifecycle = advanceLifecycle(match.lifecycle_stage, person.lifecycle);
    const subscriberId = match.subscriber_id ?? person.subscriberId ?? null;
    const eventId = match.event_id ?? person.eventId ?? null;

    const same =
      sources.length === (match.sources?.length ?? 0) &&
      lifecycle === match.lifecycle_stage &&
      subscriberId === match.subscriber_id &&
      eventId === match.event_id;

    if (same) return { ok: true, outcome: "unchanged", contactId: match.id };

    const { error } = await supabase
      .from("crm_contacts")
      .update({
        sources,
        lifecycle_stage: lifecycle,
        subscriber_id: subscriberId,
        event_id: eventId,
      })
      .eq("id", match.id);

    if (error) {
      return { ok: false, outcome: "refused", error: "That person could not be updated." };
    }
    return { ok: true, outcome: "linked", contactId: match.id };
  }

  /* ---------------------------------------------------------------- */
  /*  New person                                                       */
  /* ---------------------------------------------------------------- */

  const profileId = await firstProfileId(supabase);
  if (!profileId) {
    return {
      ok: false,
      outcome: "refused",
      error: "There is no contact card set up yet, so there is nowhere to file this person.",
    };
  }

  const { data, error } = await supabase
    .from("crm_contacts")
    .insert({
      profile_id: profileId,
      // A subscriber row regularly has no name at all, and an email is a
      // worse name than no name only if it is hidden. It is not hidden.
      full_name: person.fullName?.trim() || email,
      email,
      company: person.company ?? null,
      job_title: person.jobTitle ?? null,
      source: person.source,
      sources: withSource([], person.source),
      lifecycle_stage: person.lifecycle,
      subscriber_id: person.subscriberId ?? null,
      event_id: person.eventId ?? null,
    })
    .select("id")
    .limit(1);

  if (error) {
    return { ok: false, outcome: "refused", error: "That person could not be created." };
  }

  const created = (data ?? [])[0] as { id?: string } | undefined;
  return { ok: true, outcome: "created", contactId: created?.id };
}
