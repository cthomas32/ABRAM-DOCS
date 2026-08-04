/**
 * The tracked link that goes out with a post.
 *
 * Same shape the builder on the campaigns dashboard produces, kept here so
 * the calendar and the builder cannot drift into two spellings of the same
 * URL. `source` has to match the normalized channel names the attribution
 * helpers bucket referrers into, otherwise a tagged click and an untagged
 * share from the same place land in two rows.
 */

export const SITE_ORIGIN = "https://abram.network";

export interface TrackedLinkParts {
  /** Landing page path, leading slash, e.g. "/start/filmmakers" */
  path: string;
  /** utm_source. Matches campaign_link_channels.source */
  source: string;
  /** utm_medium, "social" for everything the calendar schedules */
  medium?: string;
  /** utm_campaign. The campaign slug when a post belongs to one */
  campaign?: string | null;
}

export function buildTrackedLink({ path, source, medium = "social", campaign }: TrackedLinkParts): string {
  const params = new URLSearchParams({ utm_source: source, utm_medium: medium });
  if (campaign) params.set("utm_campaign", campaign);
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${clean}?${params.toString()}`;
}

/**
 * What gets copied to the clipboard as one block: the caption with the
 * link under it. Posting is a paste, and a caption whose link has to be
 * fetched separately is two jobs rather than one.
 */
export function composePostText(caption: string, link: string | null): string {
  const body = caption.trim();
  if (!link) return body;
  return body ? `${body}\n\n${link}` : link;
}
