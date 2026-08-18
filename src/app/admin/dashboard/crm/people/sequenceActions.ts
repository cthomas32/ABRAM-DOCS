"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { readConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import { rows } from "@/lib/supabase/rows";
import { crmEmailTemplateSpec } from "@/lib/crm/emailTemplates";
import {
  MAX_DAY_OFFSET,
  MAX_DETAILS,
  MAX_NAME,
  MAX_STEPS,
  MAX_TITLE,
  dueAtFor,
  stepsInOrder,
  taskTitleFor,
  type CrmSequenceStep,
  type SequenceStepKind,
} from "@/lib/crm/sequences";

/**
 * The writes behind sequences.
 *
 * Every one of them re-checks `crm.sequences.manage`, because a server
 * action is a public endpoint and does not inherit the guard on the page
 * that rendered the button. Row level security is the lock underneath: a
 * partner's policy on `crm_sequences` is their own rows, and an enrolment
 * additionally needs edit rights on the person, because enrolling
 * somebody is an act on them rather than on the sequence.
 *
 * Enrolling is the only interesting one. It reads the steps, works out a
 * due date per step from the day of enrolment, and inserts one follow up
 * per step in a single statement. If that insert fails the enrolment row
 * is removed again, because an enrolment with no follow ups behind it is
 * a promise the queue does not keep.
 *
 * Nothing here sends an email. An email step becomes a follow up named
 * "Send: <step>" carrying its template key, and a person opens it.
 */

export interface SequenceResult {
  ok: boolean;
  error?: string;
  /** Present on a successful enrolment. Says what was actually written. */
  message?: string;
  id?: string;
}

const PATHS = ["/admin/dashboard/sequences", "/admin/dashboard/tasks", "/admin/dashboard/crm"];

async function readWriter() {
  const supabase = await createClient();
  const user = await readConsoleUser(supabase);

  if (!user) return { error: "Sign in again to carry on." as const };
  if (!can(user, "crm.sequences.manage")) {
    return { error: "Sequences are not yours to change. Ask an owner if you need them." as const };
  }
  return { supabase, user };
}

function refresh() {
  for (const path of PATHS) revalidatePath(path);
}

/* ------------------------------------------------------------------ */
/*  The sequence itself                                                */
/* ------------------------------------------------------------------ */

export async function createSequence(input: {
  name: string;
  description?: string | null;
}): Promise<SequenceResult> {
  const writer = await readWriter();
  if ("error" in writer) return { ok: false, error: writer.error };
  const { supabase, user } = writer;

  const name = input.name.trim().slice(0, MAX_NAME);
  if (!name) return { ok: false, error: "Give the sequence a name." };

  const { data, error } = await supabase
    .from("crm_sequences")
    .insert({
      name,
      description: input.description?.trim().slice(0, MAX_DETAILS) || null,
      owner_user_id: user.userId,
      created_by: user.userId,
    })
    .select("id")
    .limit(1);

  if (error) return { ok: false, error: "That sequence could not be saved. Try again." };

  refresh();
  return { ok: true, id: rows<{ id: string }>({ data, error: null })[0]?.id };
}

export async function updateSequence(input: {
  id: string;
  name?: string;
  description?: string | null;
  isActive?: boolean;
}): Promise<SequenceResult> {
  const writer = await readWriter();
  if ("error" in writer) return { ok: false, error: writer.error };
  const { supabase } = writer;

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) {
    const name = input.name.trim().slice(0, MAX_NAME);
    if (!name) return { ok: false, error: "Give the sequence a name." };
    patch.name = name;
  }
  if (input.description !== undefined) {
    patch.description = input.description?.trim().slice(0, MAX_DETAILS) || null;
  }
  if (input.isActive !== undefined) patch.is_active = input.isActive;

  if (Object.keys(patch).length === 0) return { ok: true };

  const { error } = await supabase.from("crm_sequences").update(patch).eq("id", input.id);
  if (error) return { ok: false, error: "That change did not save. Try again." };

  refresh();
  return { ok: true };
}

/**
 * Deleting a sequence leaves its follow ups alone.
 *
 * `crm_tasks.sequence_id` is ON DELETE SET NULL on purpose. A follow up
 * somebody is part way through is work that still has to be done, and
 * deleting a template should not clear somebody's queue.
 */
export async function deleteSequence(input: { id: string }): Promise<SequenceResult> {
  const writer = await readWriter();
  if ("error" in writer) return { ok: false, error: writer.error };
  const { supabase } = writer;

  const { error } = await supabase.from("crm_sequences").delete().eq("id", input.id);
  if (error) return { ok: false, error: "That sequence could not be removed. Try again." };

  refresh();
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  Steps                                                              */
/* ------------------------------------------------------------------ */

export async function addStep(input: {
  sequenceId: string;
  kind: SequenceStepKind;
  title: string;
  details?: string | null;
  templateKey?: string | null;
  dayOffset: number;
}): Promise<SequenceResult> {
  const writer = await readWriter();
  if ("error" in writer) return { ok: false, error: writer.error };
  const { supabase } = writer;

  const title = input.title.trim().slice(0, MAX_TITLE);
  if (!title) return { ok: false, error: "Say what the step is." };

  if (input.kind !== "email" && input.kind !== "task") {
    return { ok: false, error: "A step is either an email or a task." };
  }

  const dayOffset = Math.round(input.dayOffset);
  if (!Number.isFinite(dayOffset) || dayOffset < 0 || dayOffset > MAX_DAY_OFFSET) {
    return { ok: false, error: `A step falls between day 0 and day ${MAX_DAY_OFFSET}.` };
  }

  // A key this build has never heard of would open an empty composer, so
  // it is refused here rather than discovered by somebody mid-send.
  const templateKey = input.kind === "email" ? input.templateKey || null : null;
  if (templateKey && !crmEmailTemplateSpec(templateKey)) {
    return { ok: false, error: "That email template is not one this console knows about." };
  }

  const existing = await supabase
    .from("crm_sequence_steps")
    .select("position")
    .eq("sequence_id", input.sequenceId);

  const positions = rows<{ position: number }>(existing);
  if (positions.length >= MAX_STEPS) {
    return {
      ok: false,
      error: `A sequence holds ${MAX_STEPS} steps. Past that it is a campaign, and campaigns have their own screen.`,
    };
  }

  const next = positions.reduce((highest, row) => Math.max(highest, row.position), -1) + 1;

  const { error } = await supabase.from("crm_sequence_steps").insert({
    sequence_id: input.sequenceId,
    position: next,
    kind: input.kind,
    title,
    details: input.details?.trim().slice(0, MAX_DETAILS) || null,
    template_key: templateKey,
    day_offset: dayOffset,
  });

  if (error) return { ok: false, error: "That step could not be saved. Try again." };

  refresh();
  return { ok: true };
}

export async function deleteStep(input: { id: string }): Promise<SequenceResult> {
  const writer = await readWriter();
  if ("error" in writer) return { ok: false, error: writer.error };
  const { supabase } = writer;

  const { error } = await supabase.from("crm_sequence_steps").delete().eq("id", input.id);
  if (error) return { ok: false, error: "That step could not be removed. Try again." };

  refresh();
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  Enrolling                                                          */
/* ------------------------------------------------------------------ */

/**
 * Put one person on one sequence, and write the follow ups it implies.
 *
 * Reports what it actually did rather than saying "done": a person who
 * enrols somebody wants to know how many things just landed in their
 * queue and on which day the last one falls.
 */
export async function enrollContact(input: {
  sequenceId: string;
  contactId: string;
}): Promise<SequenceResult> {
  const writer = await readWriter();
  if ("error" in writer) return { ok: false, error: writer.error };
  const { supabase, user } = writer;

  if (!input.sequenceId || !input.contactId) {
    return { ok: false, error: "Pick a sequence and a person." };
  }

  const [sequenceRes, stepsRes, liveRes] = await Promise.all([
    supabase
      .from("crm_sequences")
      .select("id, name, is_active")
      .eq("id", input.sequenceId)
      .maybeSingle(),
    supabase.from("crm_sequence_steps").select("*").eq("sequence_id", input.sequenceId),
    supabase
      .from("crm_sequence_enrollments")
      .select("id")
      .eq("sequence_id", input.sequenceId)
      .eq("contact_id", input.contactId)
      .eq("status", "active")
      .maybeSingle(),
  ]);

  const sequence = sequenceRes.data as { id: string; name: string; is_active: boolean } | null;
  if (!sequence) return { ok: false, error: "That sequence is not one you can reach." };
  if (!sequence.is_active) {
    return { ok: false, error: "That sequence is paused. Start it again before enrolling anybody." };
  }
  if (liveRes.data) {
    return { ok: false, error: "They are already on this sequence." };
  }

  const steps = stepsInOrder(rows<CrmSequenceStep>(stepsRes));
  if (steps.length === 0) {
    return { ok: false, error: "That sequence has no steps yet, so enrolling would do nothing." };
  }

  const startedOn = new Date();
  const { data: enrolled, error: enrolError } = await supabase
    .from("crm_sequence_enrollments")
    .insert({
      sequence_id: sequence.id,
      contact_id: input.contactId,
      enrolled_by: user.userId,
      started_on: startedOn.toISOString().slice(0, 10),
      tasks_created: steps.length,
    })
    .select("id")
    .limit(1);

  if (enrolError) {
    return { ok: false, error: "That enrolment could not be saved. Try again." };
  }

  const enrollmentId = rows<{ id: string }>({ data: enrolled, error: null })[0]?.id;

  const { error: taskError } = await supabase.from("crm_tasks").insert(
    steps.map((step) => ({
      contact_id: input.contactId,
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
  );

  if (taskError) {
    // An enrolment with no follow ups behind it is a promise the queue
    // does not keep, so it is taken back rather than left as a row.
    if (enrollmentId) {
      await supabase.from("crm_sequence_enrollments").delete().eq("id", enrollmentId);
    }
    return {
      ok: false,
      error: "The follow ups could not be created, so nobody was enrolled. Try again.",
    };
  }

  const span = steps[steps.length - 1].day_offset;
  refresh();
  return {
    ok: true,
    id: enrollmentId,
    message:
      span === 0
        ? `${steps.length} follow ${steps.length === 1 ? "up" : "ups"} added, all due today.`
        : `${steps.length} follow ups added, the last one ${span} days out.`,
  };
}

/**
 * Take somebody off.
 *
 * The follow ups already written stay. They are work somebody committed
 * to, and clearing a queue on a status change is how a person loses a
 * morning's list to one click.
 */
export async function cancelEnrollment(input: { id: string }): Promise<SequenceResult> {
  const writer = await readWriter();
  if ("error" in writer) return { ok: false, error: writer.error };
  const { supabase } = writer;

  const { error } = await supabase
    .from("crm_sequence_enrollments")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", input.id);

  if (error) return { ok: false, error: "That could not be cancelled. Try again." };

  refresh();
  return { ok: true, message: "Taken off the sequence. The follow ups already made are still due." };
}
