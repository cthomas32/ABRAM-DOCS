"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { readConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import { rows } from "@/lib/supabase/rows";
import {
  dueAtFor,
  stepsInOrder,
  taskTitleFor,
  type CrmSequenceStep,
} from "@/lib/crm/sequences";

/**
 * Doing one thing to a screenful of people.
 *
 * Three rules hold these up, and the third is the one that is easy to get
 * wrong. Permission is re-checked here rather than inherited from the
 * screen. Row level security decides which of the named ids the caller
 * can actually touch, so an id typed into a request reaches nothing new.
 * And every one of these reports how many rows it actually changed rather
 * than saying "done", because a bulk write that silently skipped half its
 * targets is the worst kind of success.
 *
 * There is a cap. A bulk action over a thousand rows is a migration, and
 * a migration should be somebody deliberately running a statement rather
 * than a person holding a mouse button on a header checkbox.
 */

const MAX_TARGETS = 500;

export interface BulkResult {
  ok: boolean;
  error?: string;
  /** How many rows actually changed. Never assumed from the input length. */
  changed: number;
  message?: string;
}

async function readWriter() {
  const supabase = await createClient();
  const user = await readConsoleUser(supabase);

  if (!user) return { error: "Sign in again to carry on." as const };
  if (!can(user, "crm.contacts.write.own")) {
    return { error: "Changing people is not yours to do." as const };
  }
  return { supabase, user };
}

function guard(ids: string[]): string | null {
  if (ids.length === 0) return "Nothing was selected.";
  if (ids.length > MAX_TARGETS) {
    return `That is ${ids.length} people. ${MAX_TARGETS} at a time is the limit.`;
  }
  return null;
}

function refresh() {
  revalidatePath("/admin/dashboard/people");
}

/* ------------------------------------------------------------------ */
/*  Ownership                                                          */
/* ------------------------------------------------------------------ */

/**
 * Who works these today.
 *
 * `owner_user_id` and nothing else. `sourced_by` is write-once and the
 * database refuses to move it, which is deliberate: who found a lead is
 * what the commission ledger pays on, and it must not be reassignable by
 * a checkbox and a dropdown.
 */
export async function bulkAssignOwner(input: {
  ids: string[];
  ownerUserId: string | null;
}): Promise<BulkResult> {
  const writer = await readWriter();
  if ("error" in writer) return { ok: false, error: writer.error, changed: 0 };
  const { supabase } = writer;

  const problem = guard(input.ids);
  if (problem) return { ok: false, error: problem, changed: 0 };

  const { data, error } = await supabase
    .from("crm_contacts")
    .update({ owner_user_id: input.ownerUserId })
    .in("id", input.ids)
    .select("id");

  if (error) return { ok: false, error: "That reassignment did not save.", changed: 0 };

  const changed = rows<{ id: string }>({ data, error: null }).length;
  refresh();
  return {
    ok: true,
    changed,
    message:
      changed === input.ids.length
        ? `${changed} reassigned.`
        : `${changed} of ${input.ids.length} reassigned. The rest are not yours to change.`,
  };
}

/* ------------------------------------------------------------------ */
/*  Tags                                                               */
/* ------------------------------------------------------------------ */

/**
 * Add one tag, keeping whatever is already there.
 *
 * Read then write, rather than an array append in SQL, because the tag
 * set is small and a lost tag is worse than a slow loop. Nothing here
 * removes a tag: taking one off is a per-person decision and lives in
 * the drawer.
 */
export async function bulkAddTag(input: { ids: string[]; tag: string }): Promise<BulkResult> {
  const writer = await readWriter();
  if ("error" in writer) return { ok: false, error: writer.error, changed: 0 };
  const { supabase } = writer;

  const problem = guard(input.ids);
  if (problem) return { ok: false, error: problem, changed: 0 };

  const tag = input.tag.trim().slice(0, 40);
  if (!tag) return { ok: false, error: "Give the tag a name.", changed: 0 };

  const existing = await supabase.from("crm_contacts").select("id, tags").in("id", input.ids);
  const targets = rows<{ id: string; tags: string[] | null }>(existing);

  let changed = 0;
  for (const target of targets) {
    const tags = target.tags ?? [];
    if (tags.includes(tag)) continue;

    const { error } = await supabase
      .from("crm_contacts")
      .update({ tags: [...tags, tag] })
      .eq("id", target.id);

    if (!error) changed++;
  }

  refresh();
  return { ok: true, changed, message: `${tag} added to ${changed}.` };
}

/* ------------------------------------------------------------------ */
/*  Sequences                                                          */
/* ------------------------------------------------------------------ */

/**
 * Put a screenful of people on one sequence.
 *
 * The single-person version lives in sequenceActions.ts and this is not
 * a loop over it, because that would re-read the steps once per person.
 * The rule it enforces is the same one: somebody already on a sequence is
 * skipped rather than enrolled twice, and the count says how many were.
 */
export async function bulkEnroll(input: {
  ids: string[];
  sequenceId: string;
}): Promise<BulkResult> {
  const writer = await readWriter();
  if ("error" in writer) return { ok: false, error: writer.error, changed: 0 };
  const { supabase, user } = writer;

  if (!can(user, "crm.sequences.manage")) {
    return { ok: false, error: "Enrolling people is not yours to do.", changed: 0 };
  }

  const problem = guard(input.ids);
  if (problem) return { ok: false, error: problem, changed: 0 };

  const [sequenceRes, stepsRes, liveRes] = await Promise.all([
    supabase
      .from("crm_sequences")
      .select("id, name, is_active")
      .eq("id", input.sequenceId)
      .maybeSingle(),
    supabase.from("crm_sequence_steps").select("*").eq("sequence_id", input.sequenceId),
    supabase
      .from("crm_sequence_enrollments")
      .select("contact_id")
      .eq("sequence_id", input.sequenceId)
      .eq("status", "active"),
  ]);

  const sequence = sequenceRes.data as { id: string; is_active: boolean } | null;
  if (!sequence) return { ok: false, error: "That sequence is not one you can reach.", changed: 0 };
  if (!sequence.is_active) {
    return { ok: false, error: "That sequence is paused. Start it before enrolling anybody.", changed: 0 };
  }

  const steps = stepsInOrder(rows<CrmSequenceStep>(stepsRes));
  if (steps.length === 0) {
    return { ok: false, error: "That sequence has no steps, so enrolling would do nothing.", changed: 0 };
  }

  const already = new Set(
    rows<{ contact_id: string }>(liveRes).map((row) => row.contact_id)
  );
  const targets = input.ids.filter((id) => !already.has(id));
  if (targets.length === 0) {
    return { ok: true, changed: 0, message: "Everybody selected is already on it." };
  }

  const startedOn = new Date();

  const { data: enrolled, error: enrolError } = await supabase
    .from("crm_sequence_enrollments")
    .insert(
      targets.map((contactId) => ({
        sequence_id: sequence.id,
        contact_id: contactId,
        enrolled_by: user.userId,
        started_on: startedOn.toISOString().slice(0, 10),
        tasks_created: steps.length,
      }))
    )
    .select("contact_id");

  if (enrolError) return { ok: false, error: "Nobody was enrolled. Try again.", changed: 0 };

  // Only the rows the database actually accepted get follow ups, so a
  // person refused by row level security does not get a queue full of
  // work about somebody the enroller cannot see.
  const accepted = rows<{ contact_id: string }>({ data: enrolled, error: null }).map(
    (row) => row.contact_id
  );

  if (accepted.length > 0) {
    await supabase.from("crm_tasks").insert(
      accepted.flatMap((contactId) =>
        steps.map((step) => ({
          contact_id: contactId,
          sequence_id: sequence.id,
          title: taskTitleFor(step),
          details: step.details,
          email_template_key: step.kind === "email" ? step.template_key : null,
          due_at: dueAtFor(startedOn, step.day_offset),
          status: "open",
          priority: "normal",
          assigned_to: user.userId,
          created_by: user.userId,
        }))
      )
    );
  }

  revalidatePath("/admin/dashboard/people");
  revalidatePath("/admin/dashboard/activities");

  return {
    ok: true,
    changed: accepted.length,
    message: `${accepted.length} enrolled, ${accepted.length * steps.length} follow ups added.`,
  };
}
