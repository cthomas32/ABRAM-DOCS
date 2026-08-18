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
  | "subscriber"
  | "new"
  | "contacted"
  | "qualified"
  | "demo"
  | "opportunity"
  | "won"
  | "lost";

/**
 * Which journey somebody is on.
 *
 * Two funnels, one spine: the same people table, a stage set per motion.
 * Forcing a newsletter signup and a production company through identical
 * stages makes both boards lie.
 */
export type CrmMotion = "self_serve" | "enterprise";

export const CRM_MOTIONS: { id: CrmMotion; label: string; hint: string }[] = [
  {
    id: "self_serve",
    label: "Self serve",
    hint: "Found us, signed up, may never speak to anybody.",
  },
  {
    id: "enterprise",
    label: "Enterprise",
    hint: "A conversation that runs from first contact to a signed order.",
  },
];

/**
 * ON THE COLOUR IN THIS FILE.
 *
 * The stages used to run through a rainbow: sky, violet, amber, orange,
 * emerald. Six tints for six steps reads as six kinds of thing rather
 * than one thing at six points, and it put amber and emerald on states
 * where they mean nothing.
 *
 * The ladder is neutral now. It gets brighter as the contact gets closer,
 * white for the one stage that is actually in play, and the palette keeps
 * its two reserved tints for the two things they mean:
 *
 *   violet   the single accent, for the stage a person is working today
 *   amber    a state that costs money if it is ignored
 *   emerald  a state that has been reached
 *
 * No red anywhere. A lost deal and a declined registration are ordinary
 * outcomes, and colouring them like a failure makes the board lie about
 * how the week went.
 */
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
  /**
   * Which motions show this column. Absent means both — most of the
   * pipeline is shared, and only the ends of it differ.
   */
  motions?: CrmMotion[];
}

export const CRM_STAGES: StageSpec[] = [
  {
    id: "subscriber",
    label: "Subscriber",
    description: "On the mailing list and nothing more. Nobody has spoken to them.",
    dot: "bg-zinc-400",
    badge: "bg-zinc-500/10 text-zinc-300 border-zinc-500/20",
    motions: ["self_serve"],
  },
  {
    id: "new",
    label: "New",
    description: "Scanned your code and left their details. Nobody has replied yet.",
    dot: "bg-zinc-400",
    badge: "bg-white/[0.04] text-zinc-300 border-white/10",
  },
  {
    id: "contacted",
    label: "Contacted",
    description: "You have reached out since the event and are waiting on them.",
    dot: "bg-zinc-300",
    badge: "bg-white/[0.06] text-zinc-200 border-white/12",
  },
  {
    id: "qualified",
    label: "Qualified",
    description: "They replied and there is a real reason to keep talking.",
    dot: "bg-zinc-200",
    badge: "bg-white/[0.08] text-zinc-100 border-white/15",
  },
  {
    id: "demo",
    label: "Demo",
    description: "A walkthrough is booked or has happened.",
    dot: "bg-violet-400",
    badge: "bg-violet-500/10 text-violet-200 border-violet-500/20",
    motions: ["enterprise"],
  },
  {
    id: "opportunity",
    label: "Opportunity",
    description: "A trial, a pilot or a proposal is on the table.",
    dot: "bg-violet-300",
    badge: "bg-violet-500/15 text-violet-100 border-violet-500/25",
  },
  {
    id: "won",
    label: "Won",
    description: "They are on the platform.",
    dot: "bg-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-200 border-emerald-500/20",
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

/** The columns a board shows for one motion. */
export function stagesForMotion(motion: CrmMotion): StageSpec[] {
  return CRM_STAGES.filter((s) => !s.motions || s.motions.includes(motion));
}

/* ------------------------------------------------------------------ */
/*  Deals                                                              */
/* ------------------------------------------------------------------ */

export type DealStage = "opportunity" | "proposal" | "negotiation" | "won" | "lost";

export const DEAL_STAGES: { id: DealStage; label: string; badge: string; terminal?: boolean }[] = [
  { id: "opportunity", label: "Opportunity", badge: "bg-white/[0.04] text-zinc-300 border-white/10" },
  { id: "proposal", label: "Proposal", badge: "bg-white/[0.06] text-zinc-200 border-white/12" },
  { id: "negotiation", label: "Negotiation", badge: "bg-violet-500/10 text-violet-200 border-violet-500/20" },
  { id: "won", label: "Won", badge: "bg-emerald-500/10 text-emerald-200 border-emerald-500/20", terminal: true },
  { id: "lost", label: "Lost", badge: "bg-white/[0.02] text-zinc-500 border-white/8", terminal: true },
];

export type BillingPeriod = "one_off" | "monthly" | "annual";

export const BILLING_PERIODS: { id: BillingPeriod; label: string }[] = [
  { id: "one_off", label: "One off" },
  { id: "monthly", label: "Monthly" },
  { id: "annual", label: "Annual" },
];

/* ------------------------------------------------------------------ */
/*  Attribution                                                        */
/* ------------------------------------------------------------------ */

/**
 * The three ways a deal can belong to somebody, and the order they are
 * tested in.
 *
 * "First match governs. No discretionary override." The order below is
 * that sentence, and it is the order `resolveAttribution` walks. Anything
 * that matches none of them is unattributed and pays nothing — which is
 * a real outcome rather than an error, and the interface says so plainly
 * rather than leaving a blank.
 */
export type AttributionRule = "promo_code" | "utm_link" | "registered_account" | "unattributed";

export const ATTRIBUTION_RULES: {
  id: AttributionRule;
  order: number;
  label: string;
  description: string;
  badge: string;
}[] = [
  {
    id: "promo_code",
    order: 1,
    label: "Promo code",
    description: "Their code was redeemed at checkout. The strongest signal there is. It is on the receipt.",
    badge: "bg-white/[0.08] text-zinc-100 border-white/15",
  },
  {
    id: "utm_link",
    order: 2,
    label: "Tracked link",
    description: "Their link was the recorded source at signup.",
    badge: "bg-white/[0.06] text-zinc-200 border-white/12",
  },
  {
    id: "registered_account",
    order: 3,
    label: "Registered account",
    description: "Named in writing before first contact, approved, and closed inside 120 days.",
    badge: "bg-white/[0.04] text-zinc-300 border-white/10",
  },
  {
    id: "unattributed",
    order: 4,
    label: "Unattributed",
    description: "Matches none of the three rules. Pays nothing.",
    badge: "bg-white/[0.02] text-zinc-500 border-white/8",
  },
];

export function attributionSpec(id: string) {
  return ATTRIBUTION_RULES.find((r) => r.id === id) ?? ATTRIBUTION_RULES[3];
}

/** How long an approved registration has to close before it lapses. */
export const REGISTRATION_VALID_DAYS = 120;

/** How long the company has to decline a filed registration. Business days. */
export const REGISTRATION_DECLINE_BUSINESS_DAYS = 5;

export type RegistrationStatus = "pending" | "approved" | "declined" | "expired" | "converted";

export const REGISTRATION_STATUSES: { id: RegistrationStatus; label: string; badge: string }[] = [
  // Amber on "pending" is the one place it is earned here: an undecided
  // registration approves itself when the window lapses, and that outcome
  // costs money. Declined is neutral, not red. It is an ordinary answer.
  { id: "pending", label: "Awaiting decision", badge: "bg-amber-500/10 text-amber-200 border-amber-500/20" },
  { id: "approved", label: "Approved", badge: "bg-emerald-500/10 text-emerald-200 border-emerald-500/20" },
  { id: "declined", label: "Declined", badge: "bg-white/[0.04] text-zinc-300 border-white/10" },
  { id: "expired", label: "Expired", badge: "bg-white/[0.02] text-zinc-500 border-white/8" },
  { id: "converted", label: "Became a deal", badge: "bg-white/[0.08] text-zinc-100 border-white/15" },
];

/* ------------------------------------------------------------------ */
/*  Money                                                              */
/* ------------------------------------------------------------------ */

/**
 * Cents to a readable figure.
 *
 * Everything financial in this system is stored as integer cents, so this
 * is the only place a division by a hundred happens. One place means one
 * chance to get it wrong rather than one per screen.
 */
export function formatMoney(cents: number | null | undefined, currency = "USD"): string {
  const value = (cents ?? 0) / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
  } catch {
    // An unknown currency code must not take a page down over a label.
    return `${currency} ${value.toFixed(2)}`;
  }
}

/** A rate held as a fraction, shown as a percentage. 0.3 becomes "30%". */
export function formatRate(rate: number | null | undefined): string {
  if (rate === null || rate === undefined) return "—";
  const pct = rate * 100;
  return `${Number.isInteger(pct) ? pct : pct.toFixed(1)}%`;
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

/**
 * Every kind the timeline can hold.
 *
 * This list has to match `crm_interactions_kind_check` in migration
 * 20260817100000 exactly. A kind here that the constraint refuses is a
 * write that fails at runtime; a kind the constraint allows but that is
 * missing here is a row nothing can label.
 */
export type InteractionKind =
  | "capture"
  | "scan"
  | "note"
  | "email_sent"
  | "email_received"
  | "email_opened"
  | "email_clicked"
  | "call"
  | "meeting"
  | "demo"
  | "stage_change"
  | "task_created"
  | "task_done"
  | "rescan"
  | "owner_change"
  | "deal_created"
  | "deal_won"
  | "deal_lost"
  | "registration_filed"
  | "registration_decided";

export const INTERACTION_LABELS: Record<InteractionKind, string> = {
  capture: "Details captured",
  scan: "Card scanned",
  note: "Note",
  email_sent: "Email sent",
  email_received: "Email received",
  email_opened: "Email opened",
  email_clicked: "Link clicked",
  call: "Call",
  meeting: "Meeting",
  demo: "Demo",
  stage_change: "Stage changed",
  task_created: "Follow up created",
  task_done: "Follow up done",
  rescan: "Scanned again",
  owner_change: "Owner changed",
  deal_created: "Deal created",
  deal_won: "Deal won",
  deal_lost: "Deal lost",
  registration_filed: "Registration filed",
  registration_decided: "Registration decided",
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
