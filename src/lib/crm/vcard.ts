/**
 * vCard generation.
 *
 * Two directions are needed. Someone who scans the card taps "Save my
 * contact" and their phone imports a .vcf built from the profile. Going
 * the other way, contacts you captured can be exported so they can be
 * loaded into a phone or another address book.
 *
 * Version 3.0 is used deliberately. It is the version iOS, Android and
 * every desktop client agree on, whereas 4.0 still trips up older
 * Android address books.
 */

import type { CrmContact, CrmProfile } from "./types";

/**
 * Escapes the characters vCard treats as structural. Newlines become the
 * literal backslash-n sequence the format expects.
 */
function esc(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Splits a display name into family and given parts for the N property. */
function splitName(fullName: string): { given: string; family: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { given: parts[0] ?? "", family: "" };
  return { given: parts.slice(0, -1).join(" "), family: parts[parts.length - 1] ?? "" };
}

function line(bits: (string | null | undefined)[]): string | null {
  return bits.every((b) => b !== null && b !== undefined) ? bits.join("") : null;
}

/** Folds long lines at 75 octets, which strict parsers still require. */
function fold(lines: string[]): string {
  const out: string[] = [];
  for (const raw of lines) {
    if (raw.length <= 75) {
      out.push(raw);
      continue;
    }
    out.push(raw.slice(0, 75));
    let rest = raw.slice(75);
    while (rest.length > 74) {
      out.push(" " + rest.slice(0, 74));
      rest = rest.slice(74);
    }
    if (rest) out.push(" " + rest);
  }
  return out.join("\r\n") + "\r\n";
}

/**
 * The card handed to someone who scanned your code.
 *
 * `cardUrl` is passed in rather than derived so the saved contact carries a
 * link back to the live card, which stays current after the conference is
 * over even if a phone number changes.
 */
export function buildProfileVCard(profile: CrmProfile, cardUrl?: string): string {
  const { given, family } = splitName(profile.full_name);

  const lines: (string | null)[] = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${esc(family)};${esc(given)};;;`,
    `FN:${esc(profile.full_name)}`,
    profile.company ? `ORG:${esc(profile.company)}` : null,
    profile.job_title ? `TITLE:${esc(profile.job_title)}` : null,
    profile.email ? `EMAIL;type=INTERNET;type=WORK;type=pref:${esc(profile.email)}` : null,
    profile.phone ? `TEL;type=CELL;type=VOICE;type=pref:${esc(profile.phone)}` : null,
    profile.website ? `URL;type=WORK:${esc(profile.website)}` : null,
    cardUrl ? `URL;type=HOME:${esc(cardUrl)}` : null,
    profile.linkedin_url
      ? `X-SOCIALPROFILE;type=linkedin:${esc(profile.linkedin_url)}`
      : null,
    profile.x_url ? `X-SOCIALPROFILE;type=twitter:${esc(profile.x_url)}` : null,
    profile.tagline || profile.bio ? `NOTE:${esc(profile.tagline || profile.bio || "")}` : null,
    `REV:${new Date().toISOString().replace(/\.\d{3}Z$/, "Z")}`,
    "END:VCARD",
  ];

  return fold(lines.filter((l): l is string => Boolean(l)));
}

/** A captured contact, exported back out of the CRM. */
export function buildContactVCard(contact: CrmContact, eventName?: string | null): string {
  const { given, family } = splitName(contact.full_name);

  const noteParts = [
    eventName ? `Met at ${eventName}` : null,
    contact.met_context,
    contact.notes,
  ].filter(Boolean);

  const lines: (string | null)[] = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${esc(family)};${esc(given)};;;`,
    `FN:${esc(contact.full_name)}`,
    contact.company ? `ORG:${esc(contact.company)}` : null,
    contact.job_title ? `TITLE:${esc(contact.job_title)}` : null,
    contact.email ? `EMAIL;type=INTERNET;type=WORK;type=pref:${esc(contact.email)}` : null,
    contact.phone ? `TEL;type=CELL;type=VOICE;type=pref:${esc(contact.phone)}` : null,
    contact.website ? `URL;type=WORK:${esc(contact.website)}` : null,
    contact.linkedin_url
      ? `X-SOCIALPROFILE;type=linkedin:${esc(contact.linkedin_url)}`
      : null,
    noteParts.length ? `NOTE:${esc(noteParts.join(". "))}` : null,
    `REV:${new Date().toISOString().replace(/\.\d{3}Z$/, "Z")}`,
    "END:VCARD",
  ];

  return fold(lines.filter((l): l is string => Boolean(l)));
}

/** Several contacts in one file, which every address book imports as a batch. */
export function buildContactVCardBundle(
  contacts: CrmContact[],
  eventNameById?: Record<string, string>,
): string {
  return contacts
    .map((c) => buildContactVCard(c, c.event_id ? eventNameById?.[c.event_id] : null))
    .join("");
}

/** A filename phones handle without complaint. */
export function vcardFilename(name: string): string {
  const safe = name
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
  return `${safe || "contact"}.vcf`;
}
