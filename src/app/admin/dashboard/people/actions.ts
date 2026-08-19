"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { readConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import {
  CRM_PRIORITIES,
  CRM_STAGES,
  stageSpec,
  type CrmPriority,
  type CrmStage,
  type InteractionKind,
} from "@/lib/crm/constants";
import { LIFECYCLE_STAGES, type LifecycleStage } from "@/lib/crm/people";
import { normalizeDomain } from "@/lib/crm/accountMatch";

/**
 * Writing a person.
 *
 * Every write on this object used to happen in the browser. The contact
 * drawer held a Supabase client and called `.update()` and `.insert()`
 * directly, which made it the only surface in the console that did, while
 * companies and deals had gone through server actions since they were
 * written. Two things followed from that and both mattered:
 *
 *   The author of a change was whatever string the parent screen passed
 *   down, so `crm_interactions.author_user_id` went unwritten and the
 *   timeline could not say who did something, only what was done.
 *
 *   There was no single place to guard. Row level security still refused
 *   what it should refuse, but a refusal arrived as a Postgres error
 *   string in a toast rather than as a sentence, and there was nowhere to
 *   put the rule that a note and a task are the same act of touching a
 *   person's history.
 *
 * So every write lands here. The permission check is repeated on every
 * action even though the page already made it, because a server action is
 * reachable without its page. Row level security is the second lock and
 * the one that actually holds: see `crm_can_edit_contact` in
 * 20260817120000_role_aware_rls.sql.
 *
 * Nothing here deletes. Archiving hides a person and keeps their history,
 * because the one thing worse than a cluttered pipeline is finding out in
 * a year that you did meet somebody and the record is gone.
 */

const MAX_NAME = 200;
const MAX_SHORT = 200;
const MAX_LONG = 4000;
const MAX_TAGS = 20;

export interface ContactResult {
  ok: boolean;
  error?: string;
}

export interface ContactInput {
  fullName: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  jobTitle: string | null;
  website: string | null;
  linkedinUrl: string | null;
  city: string | null;
  country: string | null;
  metContext: string | null;
  notes: string | null;
  eventId: string | null;
  accountId: string | null;
  /** ISO instant, or null to clear the follow up date. */
  nextFollowUpAt: string | null;
}

function text(value: string | null | undefined, limit: number): string | null {
  const trimmed = (value ?? "").trim().slice(0, limit);
  return trimmed || null;
}

/* ------------------------------------------------------------------ */
/*  The guard                                                          */
/* ------------------------------------------------------------------ */

/**
 * Who is asking, and may they write a person at all.
 *
 * Returns the client alongside the user so a caller makes one round trip
 * rather than two. A refusal is a sentence, never a raw policy violation:
 * the reader of this console is a colleague, and "you cannot do this" is
 * more use to them than "new row violates row-level security policy".
 */
async function writer() {
  const supabase = await createClient();
  const user = await readConsoleUser(supabase);

  if (!user) {
    return { error: "Your session has expired. Sign in again." as const };
  }
  if (!can(user, "crm.contacts.write.own")) {
    return { error: "Your role cannot change a person's record." as const };
  }
  return { supabase, user };
}

/** The name a timeline entry is filed under, and the id behind it. */
function authorFields(user: { userId: string; fullName: string | null; email: string }) {
  return { author: user.fullName || user.email, author_user_id: user.userId };
}

function refresh(contactId: string) {
  revalidatePath("/admin/dashboard/people");
  revalidatePath(`/admin/dashboard/people/${contactId}`);
  revalidatePath("/admin/dashboard/activities");
}

/**
 * The contact's own follow up date tracks the soonest open task.
 *
 * The board badge and the header count both read that column rather than
 * counting tasks, so it has to be recomputed whenever a task is added or
 * closed. Derived from the table rather than from what the browser
 * happened to have in memory, which is the whole reason this moved to the
 * server: two people working the same person no longer overwrite each
 * other's idea of what is due next.
 */
async function recomputeNextFollowUp(
  supabase: Awaited<ReturnType<typeof createClient>>,
  contactId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("crm_tasks")
    .select("due_at")
    .eq("contact_id", contactId)
    .eq("status", "open")
    .not("due_at", "is", null)
    .order("due_at", { ascending: true })
    .limit(1);

  return (data?.[0]?.due_at as string | undefined) ?? null;
}

/* ------------------------------------------------------------------ */
/*  The record                                                         */
/* ------------------------------------------------------------------ */

export async function updateContact(
  contactId: string,
  input: ContactInput
): Promise<ContactResult> {
  const gate = await writer();
  if ("error" in gate) return { ok: false, error: gate.error };
  const { supabase } = gate;

  const fullName = text(input.fullName, MAX_NAME);
  if (!fullName) {
    return { ok: false, error: "A person needs a name. Everything else can wait." };
  }

  const { error } = await supabase
    .from("crm_contacts")
    .update({
      full_name: fullName,
      email: text(input.email, MAX_SHORT)?.toLowerCase() ?? null,
      phone: text(input.phone, MAX_SHORT),
      company: text(input.company, MAX_SHORT),
      job_title: text(input.jobTitle, MAX_SHORT),
      website: text(input.website, MAX_SHORT),
      linkedin_url: text(input.linkedinUrl, MAX_SHORT),
      city: text(input.city, MAX_SHORT),
      country: text(input.country, MAX_SHORT),
      met_context: text(input.metContext, MAX_LONG),
      notes: text(input.notes, MAX_LONG),
      event_id: input.eventId || null,
      account_id: input.accountId || null,
      next_follow_up_at: input.nextFollowUpAt || null,
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", contactId);

  if (error) return { ok: false, error: refusal(error.message) };

  refresh(contactId);
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  The company they typed, and the company we hold                    */
/* ------------------------------------------------------------------ */

export interface CompanyLinkResult extends ContactResult {
  accountId?: string;
  /** How many people were actually attached. */
  linked?: number;
  /** Set when an intended create turned into a link. See below. */
  linkedExisting?: boolean;
}

/**
 * Attaching people to a company record that already exists.
 *
 * `crm_contacts.company` is free text and `account_id` is a foreign key,
 * and for most of this CRM's life nothing joined them up. The matching
 * itself is in `lib/crm/accountMatch.ts` and stays there: it is pure, it
 * is tested, and it decides without writing. This is the writing half,
 * and it is only ever reached by somebody clicking the suggestion.
 *
 * Deliberately not a background repair. A person filed under the wrong
 * company is attached to the wrong account's deals and the wrong
 * partner's commission, and a nightly job that gets that wrong leaves no
 * trace of having chosen.
 *
 * Takes a list because the Companies screen offers the fix per company
 * rather than per person: eleven people at Helix are one decision and
 * eleven clicks would make it eleven. The person page passes one id.
 *
 * Row level security still filters the list. A partner clicking "link all
 * six" where two belong to somebody else attaches the four that are
 * theirs, and the count that comes back says four, which is why the count
 * is reported rather than assumed from the input length.
 */
export async function linkContactsToAccount(
  contactIds: string[],
  accountId: string
): Promise<CompanyLinkResult> {
  const gate = await writer();
  if ("error" in gate) return { ok: false, error: gate.error };
  const { supabase } = gate;

  if (!accountId) return { ok: false, error: "Pick a company to link these people to." };

  const ids = contactIds.filter(Boolean);
  if (!ids.length) return { ok: false, error: "There is nobody to link." };

  const { data, error } = await supabase
    .from("crm_contacts")
    .update({ account_id: accountId })
    .in("id", ids)
    .select("id");

  if (error) return { ok: false, error: refusal(error.message) };

  const linked = (data ?? []).length;
  if (!linked) {
    return { ok: false, error: "None of those people are yours to change." };
  }

  for (const id of ids) refresh(id);
  revalidatePath("/admin/dashboard/companies");
  revalidatePath(`/admin/dashboard/companies/${accountId}`);
  return { ok: true, accountId, linked };
}

/**
 * Creating the company this person names, then linking them to it.
 *
 * Two permissions, because this is two acts. Writing the person is
 * `crm.contacts.write.own` and `writer()` has already checked it;
 * creating a company is `crm.accounts.manage`, checked here. A partner
 * who may work a person but not open an account gets a sentence saying
 * so, rather than a create button that fails at the database.
 *
 * `owner_user_id` and `sourced_by` are stamped from the session, which is
 * both correct and required: `20260818170000_growth_insert_ownership.sql`
 * refuses an insert by a growth member who is neither.
 *
 * THE RACE IS THE INTERESTING PART. `crm_accounts` is unique on
 * `lower(domain)`, so two people linking two contacts at the same company
 * on the same morning means the second insert fails on 23505. That is not
 * an error worth showing: the company they wanted now exists, so the
 * second caller falls through to linking against it and says that is what
 * happened. Reporting "could not create" and leaving the person unlinked
 * would be the one outcome nobody wanted.
 */
export async function createAccountForContacts(
  contactIds: string[],
  input: { name: string; domain: string | null }
): Promise<CompanyLinkResult> {
  const gate = await writer();
  if ("error" in gate) return { ok: false, error: gate.error };
  const { supabase, user } = gate;

  if (!can(user, "crm.accounts.manage")) {
    return { ok: false, error: "Your role cannot create a company record." };
  }

  const name = text(input.name, MAX_NAME);
  if (!name) return { ok: false, error: "A company needs a name." };

  const domain = normalizeDomain(input.domain);

  const created = await supabase
    .from("crm_accounts")
    .insert({
      name,
      domain,
      lifecycle: "prospect",
      owner_user_id: user.userId,
      sourced_by: user.userId,
    })
    .select("id")
    .single();

  if (created.error) {
    if (created.error.code === "23505" && domain) {
      const existing = await supabase
        .from("crm_accounts")
        .select("id")
        .ilike("domain", domain)
        .limit(1);

      const found = (existing.data ?? [])[0] as { id?: string } | undefined;
      if (found?.id) {
        const linked = await linkContactsToAccount(contactIds, found.id);
        return linked.ok ? { ...linked, linkedExisting: true } : linked;
      }
    }
    return { ok: false, error: refusal(created.error.message) };
  }

  const accountId = created.data.id as string;
  const linked = await linkContactsToAccount(contactIds, accountId);
  return linked.ok ? { ...linked, accountId } : linked;
}

/**
 * Moving somebody along the pipeline.
 *
 * Two records rather than one. `crm_stage_changes` is the machine
 * readable history the reports read, and the timeline entry is the human
 * readable one somebody scrolls. Writing only the first gives you a chart
 * nobody can explain; writing only the second gives you a story nobody
 * can count.
 *
 * If the stage moves and the history does not, that is reported rather
 * than swallowed, because a gap in the history is exactly the thing that
 * is invisible until somebody asks a question of it months later.
 */
export async function setContactStage(
  contactId: string,
  from: CrmStage,
  to: CrmStage
): Promise<ContactResult> {
  const gate = await writer();
  if ("error" in gate) return { ok: false, error: gate.error };
  const { supabase, user } = gate;

  if (!CRM_STAGES.some((stage) => stage.id === to)) {
    return { ok: false, error: "That is not a stage." };
  }
  if (from === to) return { ok: true };

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("crm_contacts")
    .update({ stage: to, last_activity_at: now })
    .eq("id", contactId);

  if (error) return { ok: false, error: refusal(error.message) };

  const [changeRes, timelineRes] = await Promise.all([
    supabase
      .from("crm_stage_changes")
      .insert({ contact_id: contactId, from_stage: from, to_stage: to }),
    supabase.from("crm_interactions").insert({
      contact_id: contactId,
      kind: "stage_change" satisfies InteractionKind,
      body: `${stageSpec(from).label} to ${stageSpec(to).label}`,
      meta: { from, to },
      occurred_at: now,
      ...authorFields(user),
    }),
  ]);

  refresh(contactId);

  if (changeRes.error || timelineRes.error) {
    return {
      ok: true,
      error: "The stage moved, but the history did not record it. Refresh before the next move.",
    };
  }
  return { ok: true };
}

/** Set by hand. Every automatic feed only ever moves this forward. */
export async function setContactLifecycle(
  contactId: string,
  lifecycle: LifecycleStage
): Promise<ContactResult> {
  const gate = await writer();
  if ("error" in gate) return { ok: false, error: gate.error };

  if (!LIFECYCLE_STAGES.some((stage) => stage.id === lifecycle)) {
    return { ok: false, error: "That is not a lifecycle stage." };
  }

  const { error } = await gate.supabase
    .from("crm_contacts")
    .update({ lifecycle_stage: lifecycle, last_activity_at: new Date().toISOString() })
    .eq("id", contactId);

  if (error) return { ok: false, error: refusal(error.message) };
  refresh(contactId);
  return { ok: true };
}

export async function setContactPriority(
  contactId: string,
  priority: CrmPriority
): Promise<ContactResult> {
  const gate = await writer();
  if ("error" in gate) return { ok: false, error: gate.error };

  if (!CRM_PRIORITIES.some((entry) => entry.id === priority)) {
    return { ok: false, error: "That is not a priority." };
  }

  const { error } = await gate.supabase
    .from("crm_contacts")
    .update({ priority })
    .eq("id", contactId);

  if (error) return { ok: false, error: refusal(error.message) };
  refresh(contactId);
  return { ok: true };
}

/**
 * Tags are replaced wholesale rather than added to.
 *
 * A read, modify, write from the browser loses one of two tags added in
 * the same minute from two tabs. Sending the whole set means the last
 * writer wins on the whole set, which is at least a state somebody chose,
 * and the list is short enough that this costs nothing.
 */
export async function setContactTags(contactId: string, tags: string[]): Promise<ContactResult> {
  const gate = await writer();
  if ("error" in gate) return { ok: false, error: gate.error };

  const clean = Array.from(
    new Set(
      tags
        .map((tag) => tag.trim().toLowerCase().slice(0, 40))
        .filter(Boolean)
    )
  ).slice(0, MAX_TAGS);

  const { error } = await gate.supabase
    .from("crm_contacts")
    .update({ tags: clean })
    .eq("id", contactId);

  if (error) return { ok: false, error: refusal(error.message) };
  refresh(contactId);
  return { ok: true };
}

export async function setContactArchived(
  contactId: string,
  archived: boolean
): Promise<ContactResult> {
  const gate = await writer();
  if ("error" in gate) return { ok: false, error: gate.error };

  const { error } = await gate.supabase
    .from("crm_contacts")
    .update({ archived })
    .eq("id", contactId);

  if (error) return { ok: false, error: refusal(error.message) };
  refresh(contactId);
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  The history                                                        */
/* ------------------------------------------------------------------ */

export async function addContactNote(contactId: string, body: string): Promise<ContactResult> {
  const gate = await writer();
  if ("error" in gate) return { ok: false, error: gate.error };
  const { supabase, user } = gate;

  const note = text(body, MAX_LONG);
  if (!note) return { ok: false, error: "An empty note is not a note." };

  const now = new Date().toISOString();
  const { error } = await supabase.from("crm_interactions").insert({
    contact_id: contactId,
    kind: "note" satisfies InteractionKind,
    body: note,
    occurred_at: now,
    ...authorFields(user),
  });

  if (error) return { ok: false, error: refusal(error.message) };

  await supabase.from("crm_contacts").update({ last_activity_at: now }).eq("id", contactId);
  refresh(contactId);
  return { ok: true };
}

/**
 * A follow up, and the date on it.
 *
 * `dueDate` is a plain calendar day from a date input. It is resolved to
 * 09:00 in the running process's zone, which is the same thing the drawer
 * did, and is the reason the test suite pins TZ=UTC.
 */
export async function addContactTask(
  contactId: string,
  title: string,
  dueDate: string | null
): Promise<ContactResult> {
  const gate = await writer();
  if ("error" in gate) return { ok: false, error: gate.error };
  const { supabase, user } = gate;

  const clean = text(title, MAX_SHORT);
  if (!clean) return { ok: false, error: "A follow up needs a title." };

  let dueIso: string | null = null;
  if (dueDate) {
    const parsed = new Date(`${dueDate}T09:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return { ok: false, error: "That due date is not a date. Use the date picker." };
    }
    dueIso = parsed.toISOString();
  }

  const { data: contact } = await supabase
    .from("crm_contacts")
    .select("priority")
    .eq("id", contactId)
    .maybeSingle();

  const { error } = await supabase.from("crm_tasks").insert({
    contact_id: contactId,
    title: clean,
    due_at: dueIso,
    status: "open",
    priority: (contact?.priority as CrmPriority | undefined) ?? "normal",
    assigned_to: user.userId,
    created_by: user.userId,
  });

  if (error) return { ok: false, error: refusal(error.message) };

  await supabase.from("crm_interactions").insert({
    contact_id: contactId,
    kind: "task_created" satisfies InteractionKind,
    body: clean,
    meta: { due_at: dueIso },
    ...authorFields(user),
  });

  await supabase
    .from("crm_contacts")
    .update({
      last_activity_at: new Date().toISOString(),
      next_follow_up_at: await recomputeNextFollowUp(supabase, contactId),
    })
    .eq("id", contactId);

  refresh(contactId);
  return { ok: true };
}

export async function completeContactTask(
  taskId: string,
  contactId: string
): Promise<ContactResult> {
  const gate = await writer();
  if ("error" in gate) return { ok: false, error: gate.error };
  const { supabase, user } = gate;

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("crm_tasks")
    .update({ status: "done", completed_at: now })
    .eq("id", taskId)
    .select("title")
    .maybeSingle();

  if (error) return { ok: false, error: refusal(error.message) };
  if (!data) return { ok: false, error: "That follow up is no longer there." };

  await supabase.from("crm_interactions").insert({
    contact_id: contactId,
    kind: "task_done" satisfies InteractionKind,
    body: data.title as string,
    occurred_at: now,
    ...authorFields(user),
  });

  await supabase
    .from("crm_contacts")
    .update({
      last_activity_at: now,
      next_follow_up_at: await recomputeNextFollowUp(supabase, contactId),
    })
    .eq("id", contactId);

  refresh(contactId);
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  Refusals                                                           */
/* ------------------------------------------------------------------ */

/**
 * A policy violation, said in words.
 *
 * Postgres reports a refused write as "new row violates row-level
 * security policy", which is accurate and useless to the person reading
 * it. Anything else is passed through, because an unexpected database
 * error is worth seeing exactly as it arrived.
 */
function refusal(message: string): string {
  if (/row-level security/i.test(message)) {
    return "That person is not yours to change. An owner can reassign them.";
  }
  return message;
}
