/**
 * Link hub: the single shareable page of links that goes in a social bio.
 *
 * Links and page copy are managed from the admin panel, so this file only
 * holds the shape and the icon vocabulary shared between the public page
 * and the admin editor.
 */

export interface LinkHubLink {
  id: string;
  label: string;
  url: string;
  description: string | null;
  icon: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  clicks: number;
  last_clicked_at: string | null;
}

export interface LinkHubSettings {
  heading: string;
  subheading: string;
  footer_note: string | null;
}

export const DEFAULT_SETTINGS: LinkHubSettings = {
  heading: "ABRAM",
  subheading: "The creative operations platform for production teams.",
  footer_note: null,
};

/**
 * Icon keys offered in the admin picker. `abram` renders the brand mark;
 * every other key maps to a lucide icon in LinkHubIcon.
 */
export const LINK_ICON_KEYS = [
  "link",
  "abram",
  "rocket",
  "clapperboard",
  "building",
  "scissors",
  "boxes",
  "tag",
  "book",
  "instagram",
  "youtube",
  "linkedin",
  "x",
  "tiktok",
  "mail",
  "calendar",
  "play",
  "star",
  "download",
  "message",
] as const;

export type LinkIconKey = (typeof LINK_ICON_KEYS)[number];

/** Normalize whatever a user typed into a URL we are willing to link to. */
export function normalizeLinkUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Allow site-relative links so the hub can point at our own pages.
  if (trimmed.startsWith("/")) return trimmed;

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withScheme);
    // Only ever emit http(s), never javascript: or data: URLs.
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Host shown as a hint under a link, e.g. "instagram.com". */
export function linkHost(url: string): string | null {
  if (url.startsWith("/")) return "abram.network";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}
