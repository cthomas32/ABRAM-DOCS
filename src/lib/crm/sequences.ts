/**
 * Sequences, which are deliberately not automation.
 *
 * A sequence is an ordered list of steps with day offsets. Enrolling
 * somebody turns every step into a follow up in the queue, dated from the
 * day of enrolment. That is the entire mechanism. There is no scheduler,
 * no auto-advance and no stop-on-reply, and the reason is in the parity
 * plan: stop-on-reply needs inbound reply capture, which does not exist
 * yet, and a sequence that keeps sending after somebody has replied is
 * worse than no sequence at all.
 *
 * What this buys, without any of that: the third follow up gets made. The
 * thing that actually goes wrong in a two person growth team is not that
 * the emails are untimed, it is that step four never happens.
 *
 * An email step becomes a task named "Send: <step>" carrying the template
 * key, and pressing it opens the one-to-one composer with the template
 * already in it. A person still presses send. That is the only reading of
 * "Resend — send only" in the partnership terms that holds up.
 */

/* ------------------------------------------------------------------ */
/*  Rows                                                               */
/* ------------------------------------------------------------------ */

export type SequenceStepKind = "email" | "task";

export interface CrmSequence {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  owner_user_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmSequenceStep {
  id: string;
  sequence_id: string;
  position: number;
  kind: SequenceStepKind;
  title: string;
  details: string | null;
  template_key: string | null;
  day_offset: number;
  created_at: string;
}

export type EnrollmentStatus = "active" | "completed" | "cancelled";

export interface CrmSequenceEnrollment {
  id: string;
  sequence_id: string;
  contact_id: string;
  enrolled_by: string | null;
  status: EnrollmentStatus;
  started_on: string;
  tasks_created: number;
  cancelled_at: string | null;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/*  Limits                                                             */
/* ------------------------------------------------------------------ */

/** Past this a sequence is a campaign, and a campaign has its own screen. */
export const MAX_STEPS = 12;
export const MAX_DAY_OFFSET = 365;
export const MAX_NAME = 120;
export const MAX_TITLE = 200;
export const MAX_DETAILS = 2000;

/* ------------------------------------------------------------------ */
/*  Dates                                                              */
/* ------------------------------------------------------------------ */

/**
 * When a step falls due, counted in UTC from the day of enrolment.
 *
 * Nine in the morning UTC rather than midnight, because a follow up dated
 * to the stroke of midnight shows as due the evening before in half the
 * timezones this console is read in.
 */
export function dueAtFor(startedOn: string | Date, dayOffset: number): string {
  const base =
    startedOn instanceof Date ? startedOn : new Date(`${String(startedOn).slice(0, 10)}T00:00:00Z`);
  const day = Number.isNaN(base.getTime()) ? new Date() : base;

  const due = new Date(
    Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate() + Math.max(0, dayOffset), 9)
  );
  return due.toISOString();
}

/** What the queue calls a step. Email steps say so, because they open a composer. */
export function taskTitleFor(step: Pick<CrmSequenceStep, "kind" | "title">): string {
  return step.kind === "email" ? `Send: ${step.title}` : step.title;
}

/** "Day 0", "Day 3". Said the same way in the editor and on the card. */
export function offsetLabel(dayOffset: number): string {
  if (dayOffset <= 0) return "Same day";
  if (dayOffset === 1) return "Next day";
  return `Day ${dayOffset}`;
}

/**
 * The steps in the order they happen.
 *
 * Sorted by offset first and position second, because a step editor lets
 * somebody put day 2 above day 1 and the queue should still read in the
 * order the person will meet it.
 */
export function stepsInOrder(steps: CrmSequenceStep[]): CrmSequenceStep[] {
  return [...steps].sort(
    (a, b) => a.day_offset - b.day_offset || a.position - b.position
  );
}

/** How long a sequence runs, said in days. */
export function sequenceSpan(steps: CrmSequenceStep[]): number {
  return steps.reduce((longest, step) => Math.max(longest, step.day_offset), 0);
}
