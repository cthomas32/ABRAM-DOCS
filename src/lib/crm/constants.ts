/**
 * Shared vocabulary for the conference capture flow and the CRM.
 *
 * Everything that both the public card at /c/<slug> and the admin console
 * need to agree on lives here: pipeline stages, interaction kinds, where a
 * printed code was stuck, and how a card URL is built. The database stores
 * the ids below as plain text, so this file is the only place a label or a
 * colour is written down.
 */

/* ------------------------------------------------------------------ */
/*  Routing                                                            */
/* ------------------------------------------------------------------ */

/**
 * Cards live at a deliberately short path. Every character in a QR payload
 * pushes the code to a higher version with more modules, and more modules
 * means a phone has to be held closer and steadier to read it. Two letters
 * of path plus a slug keeps the printed square large and forgiving across
 * a crowded room.
 */
export const CARD_BASE_PATH = "/c";
export const SITE_ORIGIN = "https://abram.network";

/** Path for a card, with the optional code that says which printed copy was scanned. */
export function cardPath(slug: string, code?: string | null): string {
  return code ? `${CARD_BASE_PATH}/${slug}?k=${encodeURIComponent(code)}` : `${CARD_BASE_PATH}/${slug}`;
}

/** Absolute URL for a card. This is the string that gets encoded into a QR. */
export function cardUrl(slug: string, code?: string | null): string {
  return `${SITE_ORIGIN}${cardPath(slug, code)}`;
}

/* ------------------------------------------------------------------ */
/*  Pipeline                                                           */
/* ------------------------------------------------------------------ */

export type CrmStage =
  | "new"
  | "contacted"
  | "qualified"
  | "opportunity"
  | "won"
  | "lost";

export interface StageSpec {
  id: CrmStage;
  label: string;
  /** What being in this column actually means, shown as column help text. */
  description: string;
  /** Tailwind classes for the column header dot and the badge on a card. */
  dot: string;
  badge: string;
  /** Stages past this point no longer count as open pipeline. */
  terminal?: boolean;
}

export const CRM_STAGES: StageSpec[] = [
  {
    id: "new",
    label: "New",
    description: "Scanned your code and left their details. Nobody has replied yet.",
    dot: "bg-sky-400",
    badge: "bg-sky-500/10 text-sky-300 border-sky-500/20",
  },
  {
    id: "contacted",
    label: "Contacted",
    description: "You have reached out since the event and are waiting on them.",
    dot: "bg-violet-400",
    badge: "bg-violet-500/10 text-violet-300 border-violet-500/20",
  },
  {
    id: "qualified",
    label: "Qualified",
    description: "They replied and there is a real reason to keep talking.",
    dot: "bg-amber-400",
    badge: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  },
  {
    id: "opportunity",
    label: "Opportunity",
    description: "A trial, a pilot or a proposal is on the table.",
    dot: "bg-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  },
  {
    id: "won",
    label: "Won",
    description: "They are on the platform.",
    dot: "bg-emerald-500",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    terminal: true,
  },
  {
    id: "lost",
    label: "Lost",
    description: "Not a fit, or the thread went cold and you have closed it out.",
    dot: "bg-zinc-500",
    badge: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    terminal: true,
  },
];

export const STAGE_IDS = CRM_STAGES.map((s) => s.id);
export const OPEN_STAGE_IDS = CRM_STAGES.filter((s) => !s.terminal).map((s) => s.id);

export function stageSpec(id: string): StageSpec {
  return CRM_STAGES.find((s) => s.id === id) ?? CRM_STAGES[0];
}

/* ------------------------------------------------------------------ */
/*  Priority                                                           */
/* ------------------------------------------------------------------ */

export type CrmPriority = "hot" | "normal" | "low";

export const CRM_PRIORITIES: { id: CrmPriority; label: string; hint: string; badge: string }[] = [
  {
    id: "hot",
    label: "Hot",
    hint: "Follow up the same night.",
    badge: "bg-rose-500/10 text-rose-300 border-rose-500/20",
  },
  {
    id: "normal",
    label: "Normal",
    hint: "Follow up within the week.",
    badge: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  },
  {
    id: "low",
    label: "Low",
    hint: "Keep on the list, no rush.",
    badge: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
  },
];

/* ------------------------------------------------------------------ */
/*  Where a contact came from                                          */
/* ------------------------------------------------------------------ */

export type CrmSource = "qr_card" | "capture_mode" | "manual" | "import";

export const CRM_SOURCES: { id: CrmSource; label: string }[] = [
  { id: "qr_card", label: "Scanned your code" },
  { id: "capture_mode", label: "Typed on your phone" },
  { id: "manual", label: "Added by hand" },
  { id: "import", label: "Imported" },
];

/* ------------------------------------------------------------------ */
/*  Timeline                                                           */
/* ------------------------------------------------------------------ */

export type InteractionKind =
  | "capture"
  | "scan"
  | "note"
  | "email_sent"
  | "email_received"
  | "call"
  | "meeting"
  | "stage_change"
  | "task_created"
  | "task_done"
  | "rescan";

export const INTERACTION_LABELS: Record<InteractionKind, string> = {
  capture: "Details captured",
  scan: "Card scanned",
  note: "Note",
  email_sent: "Email sent",
  email_received: "Email received",
  call: "Call",
  meeting: "Meeting",
  stage_change: "Stage changed",
  task_created: "Follow up created",
  task_done: "Follow up done",
  rescan: "Scanned again",
};

/* ------------------------------------------------------------------ */
/*  Printed codes                                                      */
/* ------------------------------------------------------------------ */

export type CodePlacement =
  | "badge"
  | "business_card"
  | "lockscreen"
  | "booth"
  | "email_signature"
  | "slide"
  | "sticker";

export const CODE_PLACEMENTS: { id: CodePlacement; label: string; hint: string }[] = [
  { id: "badge", label: "Lanyard badge", hint: "Stuck on the back of a conference badge." },
  { id: "business_card", label: "Business card", hint: "Printed on the back of a card you hand over." },
  { id: "lockscreen", label: "Phone lock screen", hint: "Set as your wallpaper so you can flash it instantly." },
  { id: "booth", label: "Booth or banner", hint: "Large format, scanned from a distance." },
  { id: "email_signature", label: "Email signature", hint: "Small inline image under your sign off." },
  { id: "slide", label: "Talk slide", hint: "Last slide of a talk or panel." },
  { id: "sticker", label: "Sticker", hint: "Handed out loose." },
];

/* ------------------------------------------------------------------ */
/*  Tasks                                                              */
/* ------------------------------------------------------------------ */

export type TaskStatus = "open" | "done" | "snoozed" | "cancelled";

export const TASK_STATUSES: { id: TaskStatus; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "done", label: "Done" },
  { id: "snoozed", label: "Snoozed" },
  { id: "cancelled", label: "Cancelled" },
];

/* ------------------------------------------------------------------ */
/*  Limits, shared by the form and the ingest route                    */
/* ------------------------------------------------------------------ */

export const FIELD_LIMITS = {
  full_name: 120,
  email: 200,
  phone: 40,
  company: 140,
  job_title: 140,
  website: 300,
  linkedin_url: 300,
  notes: 2000,
  met_context: 300,
} as const;
