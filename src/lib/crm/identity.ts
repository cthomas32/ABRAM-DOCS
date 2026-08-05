/**
 * Who a card says you are.
 *
 * A person's name, job title, photograph and city live once, in
 * `team_members`. A capture card borrows them and may override any of
 * them, which is what lets somebody present differently at an event than
 * in a blog byline without keeping two copies of the truth.
 *
 * Both the card page and the follow up email resolve identity through
 * here, so the two can never drift apart.
 */

import type { CrmProfile } from "./types";

/** The shared record, as much of it as a card ever needs. */
export interface TeamMemberIdentity {
  full_name: string | null;
  job_title: string | null;
  photo_url: string | null;
  short_bio: string | null;
  email: string | null;
  linkedin_url: string | null;
  x_url: string | null;
  website: string | null;
  location: string | null;
}

/** The columns to ask for when joining the shared record onto a card. */
export const IDENTITY_SELECT =
  "*, member:team_members(full_name, job_title, photo_url, short_bio, email, linkedin_url, x_url, website, location)";

/**
 * A card with its identity resolved. `location` is not a column on
 * `crm_profiles`, it only ever comes from the shared record, which is why
 * it is added here rather than being in `CrmProfile`.
 */
export type CardIdentity = CrmProfile & { location: string | null };

/**
 * Folds the shared record into the card. The card wins wherever it has a
 * value; everything left blank falls through. Change a photograph in one
 * place and the byline, the card and the email signature all follow.
 */
export function resolveIdentity(
  row: CrmProfile & { member?: TeamMemberIdentity | null },
): CardIdentity {
  const { member, ...card } = row;

  if (!member) return { ...(card as CrmProfile), location: null };

  return {
    ...(card as CrmProfile),
    full_name: card.full_name || member.full_name || "",
    job_title: card.job_title ?? member.job_title,
    avatar_url: card.avatar_url ?? member.photo_url,
    bio: card.bio ?? member.short_bio,
    email: card.email ?? member.email,
    linkedin_url: card.linkedin_url ?? member.linkedin_url,
    x_url: card.x_url ?? member.x_url,
    website: card.website ?? member.website,
    location: member.location,
  };
}
