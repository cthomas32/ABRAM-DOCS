/**
 * The person model, in one module.
 *
 * `crm_contacts` is THE person record. A newsletter subscriber, an event
 * signup, a form fill and an app signup are not four kinds of person;
 * they are four ways the same person reached us, and they are recorded
 * as sources on the contact rather than as separate objects that have to
 * be reconciled later.
 *
 * Three ladders exist and they are not the same ladder, which is why
 * they are three columns:
 *
 *   lifecycle_stage  how far along the *person* is. Owned here.
 *   stage            where their *pipeline* sits. Owned by constants.ts.
 *   deal.stage       where the *money* sits. Owned by constants.ts.
 *
 * Conflating the first two is what made "subscriber" a pipeline stage,
 * which then meant every newsletter signup appeared in a sales board.
 *
 * See docs/crm/PEOPLE_MODEL.md.
 */

/* ------------------------------------------------------------------ */
/*  Lifecycle                                                          */
/* ------------------------------------------------------------------ */

export type LifecycleStage =
  | "subscriber"
  | "lead"
  | "mql"
  | "sql"
  | "customer"
  | "churned";

export interface LifecycleSpec {
  id: LifecycleStage;
  label: string;
  /** One sentence saying what makes somebody this, not what they feel like. */
  hint: string;
  /** The chip. Quiet by default; the palette spends colour rarely. */
  badge: string;
}

export const LIFECYCLE_STAGES: LifecycleSpec[] = [
  {
    id: "subscriber",
    label: "Subscriber",
    hint: "On the mailing list and nothing more. Not a lead until somebody says so.",
    badge: "bg-white/[0.04] border-white/8 text-zinc-300",
  },
  {
    id: "lead",
    label: "Lead",
    hint: "A person we have a reason to contact.",
    badge: "bg-white/[0.04] border-white/8 text-zinc-200",
  },
  {
    id: "mql",
    label: "Marketing qualified",
    hint: "Behaved like somebody worth a call: signed up, came to an event, asked something.",
    badge: "bg-white/[0.06] border-white/10 text-white",
  },
  {
    id: "sql",
    label: "Sales qualified",
    hint: "A real conversation has happened and there is a deal to open.",
    badge: "bg-violet-500/10 border-violet-400/20 text-violet-200",
  },
  {
    id: "customer",
    label: "Customer",
    hint: "Money has arrived. The deal, not the optimism, decides this.",
    badge: "bg-emerald-500/10 border-emerald-400/20 text-emerald-200",
  },
  {
    id: "churned",
    label: "Churned",
    hint: "Was a customer, is not any more.",
    badge: "bg-white/[0.03] border-white/8 text-zinc-400",
  },
];

export const LIFECYCLE_IDS = LIFECYCLE_STAGES.map((entry) => entry.id);

export function lifecycleSpec(id: string | null | undefined): LifecycleSpec {
  return LIFECYCLE_STAGES.find((entry) => entry.id === id) ?? LIFECYCLE_STAGES[1];
}

/* ------------------------------------------------------------------ */
/*  Sources                                                            */
/* ------------------------------------------------------------------ */

/**
 * How somebody reached us. Closed, because an open text column is how a
 * funnel report ends up with three spellings of "newsletter".
 *
 * The first four are what the conference capture app writes and are kept
 * verbatim so no existing row has to be rewritten.
 */
export type ContactSource =
  | "qr_card"
  | "capture_mode"
  | "manual"
  | "import"
  | "newsletter"
  | "event"
  | "form"
  | "promo"
  | "app_signup";

export const CONTACT_SOURCES: { id: ContactSource; label: string }[] = [
  { id: "newsletter", label: "Newsletter" },
  { id: "event", label: "Event" },
  { id: "form", label: "Form" },
  { id: "promo", label: "Promo code" },
  { id: "app_signup", label: "App signup" },
  { id: "qr_card", label: "Card scan" },
  { id: "capture_mode", label: "Captured in person" },
  { id: "manual", label: "Added by hand" },
  { id: "import", label: "Imported" },
];

export const CONTACT_SOURCE_IDS = CONTACT_SOURCES.map((entry) => entry.id);

export function sourceLabel(id: string): string {
  return CONTACT_SOURCES.find((entry) => entry.id === id)?.label ?? id;
}

/**
 * The set of sources a contact should carry, given what it already has
 * and what just happened. Idempotent, order-stable, and it always keeps
 * the first way in.
 *
 * Used by every feed — a subscriber conversion, an event link, a form —
 * so none of them can invent a different merge rule.
 */
export function withSource(
  existing: readonly string[] | null | undefined,
  added: ContactSource | null | undefined
): ContactSource[] {
  const set = new Set<string>(existing ?? []);
  if (added) set.add(added);
  // Filtered against the vocabulary, so a stale value from an older row
  // cannot fail the array constraint on the way back in.
  return CONTACT_SOURCE_IDS.filter((id) => set.has(id));
}

/**
 * Whether a lifecycle move is worth making.
 *
 * Only ever forwards, and never past customer. A subscriber who fills in
 * a form is now a lead; a customer who fills in a form is still a
 * customer, and quietly demoting them because of a marketing event is
 * the kind of thing that makes a CRM untrustworthy.
 */
export function advanceLifecycle(
  current: string | null | undefined,
  proposed: LifecycleStage
): LifecycleStage {
  const order = LIFECYCLE_IDS.indexOf(lifecycleSpec(current).id);
  const next = LIFECYCLE_IDS.indexOf(proposed);
  // Churned is terminal and is only ever set deliberately, never derived.
  if (lifecycleSpec(current).id === "churned") return "churned";
  return next > order ? proposed : lifecycleSpec(current).id;
}
