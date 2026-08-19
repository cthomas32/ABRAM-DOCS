/**
 * The email address as a key, and nothing else.
 *
 * Email is the only join between a subscriber, a captured card, a form
 * fill and a person, so the two functions that decide "is this the same
 * address" sit in a module with **no imports at all**.
 *
 * That is the point of the file rather than an accident of it. They used
 * to live in `subscriberLink.ts`, which imports `@/utils/resend`, which
 * imports the server Supabase client, which imports `next/headers`. So
 * `contactSync.ts` — the pure merge rule, which needs exactly these two
 * string functions — could only be loaded inside a Next request. A test
 * could not import it and neither could a script, which is why the
 * backfill that finally created thirty people had to be able to call the
 * real merge rule and at first could not.
 *
 * Keep this file a leaf. Anything imported here is imported by every
 * feed in the CRM.
 */

/**
 * Deliberately strict. A malformed address that reaches the list costs a
 * bounce against the sending domain, and the capture form asks for an email
 * without insisting on one, so a typo is the expected failure here.
 */
const EMAIL = /^[^\s@,;<>"]+@[^\s@,;<>".]+\.[^\s@,;<>"]{2,}$/;

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || trimmed.length > 200) return null;
  return EMAIL.test(trimmed) ? trimmed : null;
}

/** Escapes the characters ILIKE treats as wildcards, underscore included. */
export function ilikeEscape(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}
