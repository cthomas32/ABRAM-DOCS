/**
 * A list is a filter somebody named.
 *
 * The people screen already had eight filters and no way to keep any of
 * them, so every morning began by setting the same four dropdowns. A
 * saved view is those dropdowns written down, and that is all it is:
 * there is no separate list table, no membership rows, and nothing to go
 * stale. Ask the same question tomorrow and you get today's answer.
 *
 * The filter is stored as jsonb rather than as columns because this set
 * has grown twice already. A view saved before a filter existed simply
 * does not constrain it, and a view carrying a key this build no longer
 * understands is ignored rather than refused.
 *
 * One function applies a filter, and both the people screen and the lists
 * screen call it, so a list cannot show a different set from the board it
 * came off.
 */

import type { CrmContact } from "./types";

/* ------------------------------------------------------------------ */
/*  The shape                                                          */
/* ------------------------------------------------------------------ */

export interface ContactFilter {
  /** Matched against name, company and email, case insensitively. */
  query?: string;
  lifecycle?: string;
  source?: string;
  stage?: string;
  priority?: string;
  tag?: string;
  eventId?: string;
  accountId?: string;
  /** Who works it today. Not who sourced it: that is a money question. */
  ownerUserId?: string;
  /** Only people with a lead score at or above this. */
  minScore?: number;
  needsFollowUp?: boolean;
  /** Something happened on their timeline inside this many days. */
  activeWithinDays?: number;
  /** Nothing has happened on their timeline for this many days. */
  noTouchDays?: number;
  /** Became a person inside this many days. */
  createdWithinDays?: number;
  /** Has at least one open follow up, due or not. */
  hasOpenTask?: boolean;
  /** Archived people are excluded unless a view deliberately asks for them. */
  archived?: boolean;
}

export interface CrmSavedView {
  id: string;
  name: string;
  scope: "contacts" | "deals" | "tasks";
  filter: ContactFilter;
  owner_user_id: string;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

export const MAX_VIEW_NAME = 80;

/* ------------------------------------------------------------------ */
/*  Reading one back                                                   */
/* ------------------------------------------------------------------ */

const NUMBER_KEYS = ["minScore", "activeWithinDays", "noTouchDays", "createdWithinDays"] as const;

const TEXT_KEYS = [
  "query",
  "lifecycle",
  "source",
  "stage",
  "priority",
  "tag",
  "eventId",
  "accountId",
  "ownerUserId",
] as const;

/**
 * Whatever came out of the column, as a filter.
 *
 * Unknown keys are dropped and wrong types are ignored, because a stored
 * blob is the one input to this module nobody validated on the way in.
 */
export function readFilter(value: unknown): ContactFilter {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const raw = value as Record<string, unknown>;
  const filter: ContactFilter = {};

  for (const key of TEXT_KEYS) {
    const entry = raw[key];
    if (typeof entry === "string" && entry.trim()) filter[key] = entry.trim();
  }

  for (const key of NUMBER_KEYS) {
    const entry = raw[key];
    if (typeof entry === "number" && Number.isFinite(entry) && entry > 0) {
      filter[key] = Math.min(key === "minScore" ? 100 : 3650, Math.round(entry));
    }
  }
  if (raw.needsFollowUp === true) filter.needsFollowUp = true;
  if (raw.hasOpenTask === true) filter.hasOpenTask = true;
  if (raw.archived === true) filter.archived = true;

  return filter;
}

/** The same trimming on the way in, so nothing stores an empty string. */
export function cleanFilter(filter: ContactFilter): ContactFilter {
  return readFilter(filter as unknown);
}

/** Whether a filter constrains anything at all. An empty view is everybody. */
export function filterIsEmpty(filter: ContactFilter): boolean {
  return Object.keys(cleanFilter(filter)).length === 0;
}

/** What the view narrows to, said in words. Used on the card and the chip. */
export function describeFilter(filter: ContactFilter): string {
  const parts: string[] = [];
  const clean = cleanFilter(filter);

  if (clean.query) parts.push(`matching "${clean.query}"`);
  if (clean.lifecycle) parts.push(clean.lifecycle);
  if (clean.source) parts.push(`from ${clean.source}`);
  if (clean.stage) parts.push(`at ${clean.stage}`);
  if (clean.priority) parts.push(`${clean.priority} priority`);
  if (clean.tag) parts.push(`tagged ${clean.tag}`);
  if (clean.eventId) parts.push("from one event");
  if (clean.accountId) parts.push("at one company");
  if (clean.ownerUserId) parts.push("owned by one person");
  if (clean.minScore) parts.push(`scoring ${clean.minScore} or more`);
  if (clean.activeWithinDays) parts.push(`active in ${clean.activeWithinDays} days`);
  if (clean.noTouchDays) parts.push(`untouched for ${clean.noTouchDays} days`);
  if (clean.createdWithinDays) parts.push(`added in ${clean.createdWithinDays} days`);
  if (clean.hasOpenTask) parts.push("with a follow up open");
  if (clean.needsFollowUp) parts.push("with something due");
  if (clean.archived) parts.push("archived");

  return parts.length === 0 ? "Everybody" : parts.join(", ");
}

/* ------------------------------------------------------------------ */
/*  Applying one                                                       */
/* ------------------------------------------------------------------ */

export interface FilterContext {
  /** Contact ids with an open follow up due today or already past. */
  dueContactIds?: Set<string>;
  /** Contact ids with any open follow up at all. */
  openTaskContactIds?: Set<string>;
  /** Lead score per contact, where it has been read. */
  scoreById?: Record<string, number>;
}

/** Days since an instant, or null when there is no instant to count from. */
export function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return null;
  return (Date.now() - then) / 86_400_000;
}

/**
 * The one place a contact filter is applied.
 *
 * `archived` is a positive filter rather than an include: a view of
 * archived people shows archived people and nobody else, which is what
 * somebody looking for a record they put away actually wants.
 */
export function applyContactFilter(
  contacts: CrmContact[],
  filter: ContactFilter,
  context: FilterContext = {}
): CrmContact[] {
  const clean = cleanFilter(filter);
  const needle = clean.query?.toLowerCase() ?? "";

  return contacts.filter((contact) => {
    if (contact.archived !== Boolean(clean.archived)) return false;
    if (clean.lifecycle && contact.lifecycle_stage !== clean.lifecycle) return false;
    if (clean.source && !(contact.sources ?? []).includes(clean.source as never)) return false;
    if (clean.stage && contact.stage !== clean.stage) return false;
    if (clean.priority && contact.priority !== clean.priority) return false;
    if (clean.tag && !contact.tags.includes(clean.tag)) return false;
    if (clean.eventId && contact.event_id !== clean.eventId) return false;
    if (clean.accountId && contact.account_id !== clean.accountId) return false;
    if (clean.ownerUserId && contact.owner_user_id !== clean.ownerUserId) return false;

    if (clean.minScore !== undefined) {
      const score = context.scoreById?.[contact.id] ?? 0;
      if (score < clean.minScore) return false;
    }

    if (clean.needsFollowUp && !(context.dueContactIds?.has(contact.id) ?? false)) return false;
    if (clean.hasOpenTask && !(context.openTaskContactIds?.has(contact.id) ?? false)) return false;

    /* Recency, counted off last_activity_at, which every write on a
       person moves. "No touch in 14 days" is the one filter a growth
       team actually opens the console to run, and a person with no
       activity date at all counts as untouched rather than as fresh. */
    if (clean.activeWithinDays !== undefined) {
      const since = daysSince(contact.last_activity_at);
      if (since === null || since > clean.activeWithinDays) return false;
    }
    if (clean.noTouchDays !== undefined) {
      const since = daysSince(contact.last_activity_at);
      if (since !== null && since < clean.noTouchDays) return false;
    }
    if (clean.createdWithinDays !== undefined) {
      const since = daysSince(contact.created_at);
      if (since === null || since > clean.createdWithinDays) return false;
    }

    if (needle) {
      const haystack = [contact.full_name, contact.company, contact.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(needle)) return false;
    }

    return true;
  });
}

/* ------------------------------------------------------------------ */
/*  The lists nobody has to build                                      */
/* ------------------------------------------------------------------ */

export interface SmartList {
  id: string;
  label: string;
  /** Why it exists, in one line, shown as the chip's title. */
  hint: string;
  filter: ContactFilter;
}

/**
 * Four questions a growth team asks every week.
 *
 * Built in rather than seeded as rows, because a seeded row can be edited
 * into something that no longer matches its name, and then "Stale" means
 * whatever somebody changed it to last March. These are code, they are
 * the same for everybody, and anything more specific is a saved list.
 */
export const SMART_LISTS: SmartList[] = [
  {
    id: "hot",
    label: "Hot",
    hint: "Sales qualified, and something happened in the last week.",
    filter: { lifecycle: "sql", activeWithinDays: 7 },
  },
  {
    id: "stale",
    label: "Stale",
    hint: "Nothing has happened on their timeline for a fortnight.",
    filter: { noTouchDays: 14 },
  },
  {
    id: "new",
    label: "New this week",
    hint: "Became a person in the last seven days.",
    filter: { createdWithinDays: 7 },
  },
  {
    id: "subscribers",
    label: "Subscribers",
    hint: "On the mailing list and nothing more. Nobody has spoken to them.",
    filter: { lifecycle: "subscriber" },
  },
];

export function smartList(id: string | null | undefined): SmartList | null {
  return SMART_LISTS.find((entry) => entry.id === id) ?? null;
}
