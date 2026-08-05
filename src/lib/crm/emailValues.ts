/**
 * What a capture email knows about the two people in it.
 *
 * The sender half comes off the shared team record through resolveIdentity,
 * so the signature says the same thing as the card that was just scanned.
 * The contact half comes off the form they filled in a moment ago.
 *
 * Anything missing is passed as an empty string rather than left out. The
 * renderer treats an empty value as a gap and takes the punctuation around
 * it away, which is what lets one piece of copy serve a card with every
 * field filled in and a card with three.
 */

import { cardUrl } from "./constants";
import type { CrmEmailValues } from "./emailTemplates";

/** The part of a card this email reads. Kept structural so it is easy to test. */
export interface EmailSenderIdentity {
  slug: string;
  full_name: string | null;
  job_title: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
}

/** The first word of a name, which is how anybody signs off a note. */
export function firstWordOf(name: string | null | undefined): string {
  const value = String(name ?? "").trim();
  return value.split(/\s+/)[0] || value;
}

export function captureEmailValues(args: {
  profile: EmailSenderIdentity;
  toName: string;
  company?: string | null;
  jobTitle?: string | null;
  eventName?: string | null;
}): CrmEmailValues {
  const { profile, toName, company, jobTitle, eventName } = args;
  const link = cardUrl(profile.slug);

  return {
    contact_first_name: firstWordOf(toName),
    contact_name: String(toName ?? "").trim(),
    contact_company: company ?? "",
    contact_job_title: jobTitle ?? "",
    event_name: eventName ?? "",
    sender_first_name: firstWordOf(profile.full_name),
    sender_name: profile.full_name ?? "",
    sender_job_title: profile.job_title ?? "",
    sender_city: profile.location ?? "",
    sender_email: profile.email ?? "",
    sender_phone: profile.phone ?? "",
    save_contact_link: `${link}/vcf`,
    card_link: link,
  };
}
