"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { readConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import type { CrmPriority } from "@/lib/crm/constants";

/**
 * The follow up queue's writes.
 *
 * Reading the queue needs `crm.contacts.read.own`; changing anything in
 * it needs `crm.contacts.write.own`, which a viewer does not hold. Both
 * are checked here as well as on the page, because a server action is a
 * public endpoint and does not inherit the page's guard. Row level
 * security is the lock underneath: a task follows its contact, so
 * somebody who cannot edit the person cannot edit their follow ups
 * either, whatever this file decides.
 *
 * Snoozing moves the due date and leaves the task open. `crm_tasks` does
 * have a `snoozed` status, and using it would hide the task from every
 * open-task count in the console while doing nothing about the reason it
 * was put off. A date that moved is honest and still counted.
 */

const MAX_TITLE = 200;
const MAX_DETAILS = 2000;
const MAX_BODY = 2000;

export interface TaskResult {
  ok: boolean;
  error?: string;
}

async function readWriter() {
  const supabase = await createClient();
  const user = await readConsoleUser(supabase);

  if (!user) return { error: "Sign in again to carry on." as const };
  if (!can(user, "crm.contacts.write.own")) {
    return { error: "You can read the queue, and changing it is not yours to do." as const };
  }
  return { supabase, user };
}

function refresh() {
  revalidatePath("/admin/dashboard/tasks");
  revalidatePath("/admin/dashboard/people");
}

/* ------------------------------------------------------------------ */
/*  Creating                                                           */
/* ------------------------------------------------------------------ */

/**
 * A new follow up.
 *
 * `crm_tasks.deal_id` arrived with migration 20260817160000, so a follow
 * up about a deal now says so in a column rather than in a sentence in
 * its details. `contact_id` stays required: every follow up in this
 * console is something somebody has to do about a person, and the queue
 * groups by that person.
 */
export async function createTask(input: {
  contactId: string;
  title: string;
  details?: string;
  /** A local `YYYY-MM-DDTHH:mm` from the form, or blank for no due date. */
  dueAt?: string | null;
  assignedTo?: string | null;
  priority?: CrmPriority;
  /** The deal this is about. Written to `deal_id`. */
  dealId?: string | null;
  /** Its name, kept in the details so the queue reads without a join. */
  dealName?: string | null;
}): Promise<TaskResult> {
  const writer = await readWriter();
  if ("error" in writer) return { ok: false, error: writer.error };
  const { supabase, user } = writer;

  const title = input.title.trim().slice(0, MAX_TITLE);
  if (!title) return { ok: false, error: "Give the follow up a title." };
  if (!input.contactId) return { ok: false, error: "Pick the person this follow up is about." };

  let dueAt: string | null = null;
  if (input.dueAt) {
    const parsed = new Date(input.dueAt);
    if (Number.isNaN(parsed.getTime())) {
      return { ok: false, error: "That due date could not be read. Use the date picker." };
    }
    dueAt = parsed.toISOString();
  }

  const detailParts = [input.dealName ? `Deal: ${input.dealName}` : null, input.details?.trim()];
  const details = detailParts.filter(Boolean).join("\n").slice(0, MAX_DETAILS) || null;

  const { error } = await supabase.from("crm_tasks").insert({
    contact_id: input.contactId,
    deal_id: input.dealId || null,
    title,
    details,
    due_at: dueAt,
    status: "open",
    priority: input.priority ?? "normal",
    assigned_to: input.assignedTo || user.userId,
    created_by: user.userId,
  });

  if (error) return { ok: false, error: "Could not save that follow up. Try again." };

  await supabase.from("crm_interactions").insert({
    contact_id: input.contactId,
    deal_id: input.dealId || null,
    kind: "task_created",
    body: title,
    occurred_at: new Date().toISOString(),
    author_user_id: user.userId,
  });

  refresh();
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  Working the queue                                                  */
/* ------------------------------------------------------------------ */

export async function completeTask(input: { id: string }): Promise<TaskResult> {
  const writer = await readWriter();
  if ("error" in writer) return { ok: false, error: writer.error };
  const { supabase, user } = writer;

  const { data: task } = await supabase
    .from("crm_tasks")
    .select("id, title, contact_id, status")
    .eq("id", input.id)
    .maybeSingle();

  if (!task) return { ok: false, error: "That follow up no longer exists." };
  if (task.status === "done") return { ok: true };

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("crm_tasks")
    .update({ status: "done", completed_at: now })
    .eq("id", input.id);

  if (error) return { ok: false, error: "Could not mark that done. Try again." };

  await supabase.from("crm_interactions").insert({
    contact_id: task.contact_id,
    kind: "task_done",
    body: task.title as string,
    occurred_at: now,
    author_user_id: user.userId,
  });

  refresh();
  return { ok: true };
}

/** Back to open, for the one marked done by mistake. */
export async function reopenTask(input: { id: string }): Promise<TaskResult> {
  const writer = await readWriter();
  if ("error" in writer) return { ok: false, error: writer.error };
  const { supabase } = writer;

  const { error } = await supabase
    .from("crm_tasks")
    .update({ status: "open", completed_at: null })
    .eq("id", input.id);

  if (error) return { ok: false, error: "Could not reopen that follow up. Try again." };

  refresh();
  return { ok: true };
}

/**
 * Later, by a number of days.
 *
 * Counted from the due date when there is one still ahead, and from now
 * when the task is already late. Snoozing something three weeks overdue
 * by a day should land tomorrow, not three weeks ago plus a day.
 */
export async function snoozeTask(input: { id: string; days: number }): Promise<TaskResult> {
  const writer = await readWriter();
  if ("error" in writer) return { ok: false, error: writer.error };
  const { supabase } = writer;

  const days = Math.round(input.days);
  if (!Number.isFinite(days) || days < 1 || days > 90) {
    return { ok: false, error: "Snooze by a day and 90 days, not more." };
  }

  const { data: task } = await supabase
    .from("crm_tasks")
    .select("id, due_at")
    .eq("id", input.id)
    .maybeSingle();

  if (!task) return { ok: false, error: "That follow up no longer exists." };

  const from = task.due_at ? new Date(task.due_at as string) : new Date();
  const base = Number.isNaN(from.getTime()) || from.getTime() < Date.now() ? new Date() : from;
  const next = new Date(base.getTime() + days * 86_400_000);

  const { error } = await supabase
    .from("crm_tasks")
    .update({ due_at: next.toISOString(), status: "open" })
    .eq("id", input.id);

  if (error) return { ok: false, error: "Could not move that follow up. Try again." };

  refresh();
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  Logging what happened                                              */
/* ------------------------------------------------------------------ */

/**
 * A call or a meeting, written onto the person's timeline.
 *
 * Both kinds were already valid values on `crm_interactions`; what was
 * missing was anywhere to press. The timeline is also what the activity
 * reporting counts, so a call logged here is a call that shows up in the
 * numbers later.
 */
export async function logContactActivity(input: {
  contactId: string;
  kind: "call" | "meeting";
  body?: string;
  /** A local `YYYY-MM-DDTHH:mm`. Defaults to now. */
  occurredAt?: string | null;
}): Promise<TaskResult> {
  const writer = await readWriter();
  if ("error" in writer) return { ok: false, error: writer.error };
  const { supabase, user } = writer;

  if (input.kind !== "call" && input.kind !== "meeting") {
    return { ok: false, error: "That is not something the timeline records." };
  }
  if (!input.contactId) return { ok: false, error: "Pick the person this was with." };

  let occurredAt = new Date();
  if (input.occurredAt) {
    const parsed = new Date(input.occurredAt);
    if (Number.isNaN(parsed.getTime())) {
      return { ok: false, error: "That date could not be read. Use the date picker." };
    }
    occurredAt = parsed;
  }

  const { error } = await supabase.from("crm_interactions").insert({
    contact_id: input.contactId,
    kind: input.kind,
    body: (input.body ?? "").trim().slice(0, MAX_BODY) || null,
    occurred_at: occurredAt.toISOString(),
    author_user_id: user.userId,
  });

  if (error) return { ok: false, error: "Could not log that. Try again." };

  await supabase
    .from("crm_contacts")
    .update({ last_activity_at: occurredAt.toISOString() })
    .eq("id", input.contactId);

  refresh();
  return { ok: true };
}
