/**
 * Small helpers shared by the CRM console screens.
 *
 * Nothing here talks to the database. The queries live next to the screen
 * that needs them, the same way the rest of the dashboard is written. What
 * lives here is the handful of things three or four screens would otherwise
 * each write their own slightly different version of: dates, downloads,
 * the CSV column order, and the rules for what counts as due.
 */

import { sourceLabel } from "@/lib/crm/people";
import type { CrmContact } from "@/lib/crm/types";
import { stageSpec } from "@/lib/crm/constants";

/* ------------------------------------------------------------------ */
/*  Shapes the console passes around                                   */
/* ------------------------------------------------------------------ */

/** One row of the per event rollup view. */
export interface EventStatRow {
  event_id: string;
  slug: string;
  name: string;
  starts_on: string | null;
  ends_on: string | null;
  scans: number;
  unique_scanners: number;
  contacts: number;
  qualified: number;
  won: number;
}

/** Every screen reports back the same way, so there is one toast stack. */
export type Notify = (message: string, tone: "success" | "error") => void;

/* ------------------------------------------------------------------ */
/*  Dates                                                              */
/* ------------------------------------------------------------------ */

/**
 * The last instant of today in the reader's own timezone.
 *
 * Follow ups are judged against this rather than against "now", because a
 * task due at nine this morning and a task due at six tonight are both
 * things to deal with today, and a list that hides one of them until the
 * afternoon is worse than useless.
 */
export function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export function isDueOrOverdue(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const when = new Date(iso).getTime();
  return Number.isFinite(when) && when <= endOfToday().getTime();
}

export function isOverdue(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const when = new Date(iso).getTime();
  return Number.isFinite(when) && when < Date.now();
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "3 days ago", for timeline rows where the exact minute does not matter. */
export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

/** A value an `<input type="datetime-local">` accepts, in local time. */
export function toLocalInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

export function fromLocalInputValue(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/* ------------------------------------------------------------------ */
/*  Text                                                               */
/* ------------------------------------------------------------------ */

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

/**
 * A short token for a printed code.
 *
 * Five characters from an alphabet with no 0/O or 1/I/l in it, so a code
 * read off a sticker and typed by hand does not turn into a different one.
 * Every extra character makes the printed square denser, which is the whole
 * reason these are short.
 */
const CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function randomCode(length = 5): string {
  let out = "";
  const bytes = new Uint8Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
    for (let i = 0; i < length; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
    return out;
  }
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

/**
 * Re-exported rather than reimplemented.
 *
 * The vocabulary grew when subscribers and event signups became feeds
 * into the person record, and the CSV export was reading a shorter copy
 * of the list, so a converted subscriber exported as the raw string
 * `newsletter`. `@/lib/crm/people` is the one list now.
 */
export { sourceLabel };

/** Percentage as a whole number, or null when the denominator is zero. */
export function ratePct(part: number, whole: number): number | null {
  if (!whole) return null;
  return Math.round((part / whole) * 100);
}

/* ------------------------------------------------------------------ */
/*  Downloads                                                          */
/* ------------------------------------------------------------------ */

export function downloadFile(filename: string, mime: string, content: string | Blob): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoking on the next tick, because Safari has not started the download yet.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ------------------------------------------------------------------ */
/*  CSV                                                                */
/* ------------------------------------------------------------------ */

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const CSV_COLUMNS: { header: string; read: (c: CrmContact, eventName: string) => unknown }[] = [
  { header: "Name", read: (c) => c.full_name },
  { header: "Email", read: (c) => c.email },
  { header: "Phone", read: (c) => c.phone },
  { header: "Company", read: (c) => c.company },
  { header: "Job title", read: (c) => c.job_title },
  { header: "LinkedIn", read: (c) => c.linkedin_url },
  { header: "Website", read: (c) => c.website },
  { header: "Event", read: (_c, eventName) => eventName },
  { header: "Stage", read: (c) => stageSpec(c.stage).label },
  { header: "Priority", read: (c) => c.priority },
  { header: "Tags", read: (c) => c.tags.join(" | ") },
  { header: "How they arrived", read: (c) => sourceLabel(c.source) },
  { header: "Where we met", read: (c) => c.met_context },
  { header: "Notes", read: (c) => c.notes },
  { header: "Met at", read: (c) => c.met_at },
  { header: "Next follow up", read: (c) => c.next_follow_up_at },
  { header: "Last activity", read: (c) => c.last_activity_at },
  { header: "Captured offline", read: (c) => (c.captured_offline ? "yes" : "no") },
];

/**
 * The filtered set as a spreadsheet.
 *
 * A leading byte order mark is included because without one Excel opens a
 * UTF-8 file as Latin-1 and every accented name in the list comes out wrong.
 */
export function contactsToCsv(
  contacts: CrmContact[],
  eventNameById: Record<string, string> = {}
): string {
  const rows = [CSV_COLUMNS.map((col) => csvCell(col.header)).join(",")];
  for (const contact of contacts) {
    const eventName = contact.event_id ? eventNameById[contact.event_id] ?? "" : "";
    rows.push(CSV_COLUMNS.map((col) => csvCell(col.read(contact, eventName))).join(","));
  }
  return "\uFEFF" + rows.join("\r\n") + "\r\n";
}

/** `contacts-2026-08-04.csv`, so a folder of exports sorts by date. */
export function stampedFilename(base: string, extension: string): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${base}-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.${extension}`;
}
