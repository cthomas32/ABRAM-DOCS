"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import { rows } from "@/lib/supabase/rows";
import {
  feedPersonFromSubscriber,
  syncFeedPerson,
  type SubscriberRow,
} from "@/lib/crm/contactSync";

/**
 * Turning the mailing list into people.
 *
 * A subscriber is a row with an email on it. A contact is a person. They
 * were separate objects with no relationship, which meant the same human
 * could be mailed as a subscriber, worked as a contact, and counted
 * twice in every report that added the two together.
 *
 * These two actions are the bridge, and they are actions rather than a
 * background job on purpose: converting somebody is a decision, and a
 * job that silently promoted every address on a mailing list into a
 * worked lead would be worse than the problem.
 *
 * Both are idempotent. Running either twice on the same subscriber adds
 * no row and changes no field.
 *
 * These live under `people/` because there is no subscribers screen to
 * live under any more. The mailing list is a source on a contact and a
 * built-in list at `/admin/dashboard/people?tab=list&list=subscribers`,
 * which is the filter `SMART_LISTS` holds in `lib/crm/savedViews.ts`.
 * Anything still linking to `/admin/dashboard/subscribers` is caught by a
 * redirect in `next.config.ts`.
 */

export interface ConvertResult {
  ok: boolean;
  error?: string;
  /** What actually happened, so the screen can say so honestly. */
  created?: number;
  linked?: number;
  unchanged?: number;
  refused?: number;
}

/** A permission check on the action itself, because a page is not a lock. */
async function guard() {
  const user = await getConsoleUser();
  if (!user) return { error: "Sign in again." as const };
  // Writing a person is a contact write, whatever screen asked for it.
  if (!can(user, "crm.contacts.write.own")) {
    return { error: "You do not have permission to create contacts." as const };
  }
  return { user };
}

/**
 * One subscriber, matched to a person or made into one.
 *
 * What is claimed depends on which list they are on, and
 * `feedPersonFromSubscriber` is the one place that decides: the mailing
 * list alone claims `subscriber` and no further, because somebody on a
 * mailing list has done exactly one thing and a CRM that calls that a
 * lead is a CRM whose lead count means nothing. Asking for access to the
 * product is a different act and claims `lead`.
 */
export async function convertSubscriberToContact(subscriberId: string): Promise<ConvertResult> {
  const gate = await guard();
  if ("error" in gate) return { ok: false, error: gate.error };

  const supabase = await createClient();

  const found = await supabase
    .from("subscribers")
    .select("id, email, first_name, last_name, job_title, is_marketing_list, is_application_list")
    .eq("id", subscriberId)
    .limit(1);

  const subscriber = rows<SubscriberRow>(found)[0];

  if (!subscriber) return { ok: false, error: "That subscriber could not be read." };

  const result = await syncFeedPerson(
    supabase,
    feedPersonFromSubscriber(subscriber, gate.user.userId)
  );

  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/admin/dashboard/people");

  return {
    ok: true,
    created: result.outcome === "created" ? 1 : 0,
    linked: result.outcome === "linked" ? 1 : 0,
    unchanged: result.outcome === "unchanged" ? 1 : 0,
  };
}

/**
 * The whole list, in one pass.
 *
 * Capped, and sequential rather than parallel, because the merge rule
 * matches on email and two rows for the same address arriving at once
 * would both find nothing and both create. The cap is a page of work,
 * not a limit on the list: run it again and it picks up where it left
 * off, since everything already converted comes back `unchanged`.
 */
const BATCH = 200;

export async function convertAllSubscribers(): Promise<ConvertResult> {
  const gate = await guard();
  if ("error" in gate) return { ok: false, error: gate.error };

  const supabase = await createClient();

  const found = await supabase
    .from("subscribers")
    .select("id, email, first_name, last_name, job_title, is_marketing_list, is_application_list")
    .eq("status", "subscribed")
    .order("created_at", { ascending: true })
    .limit(BATCH);

  if (found.error) return { ok: false, error: "The subscriber list could not be read." };

  const tally = { created: 0, linked: 0, unchanged: 0, refused: 0 };

  for (const subscriber of rows<SubscriberRow>(found)) {
    const result = await syncFeedPerson(
      supabase,
      feedPersonFromSubscriber(subscriber, gate.user.userId)
    );
    tally[result.outcome] += 1;
  }

  revalidatePath("/admin/dashboard/people");

  return { ok: true, ...tally };
}
