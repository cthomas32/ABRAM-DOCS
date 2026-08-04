/**
 * Where a card is going, and what that place does to it.
 *
 * The sizes in `formats.ts` are pixels. This is the layer above them: the
 * question a person actually asks is not "square or portrait", it is "this
 * is for LinkedIn". A destination answers that, picks the size, and carries
 * the two or three facts about the surface that change what the card should
 * say — how much of it gets covered, how long the caption can be, whether a
 * carousel is even a thing there.
 *
 * These are editorial notes, not an API. Platforms move their crops around
 * and nothing here is fetched from them, so treat every number as "true
 * enough to design against" rather than a specification.
 */

import type { SocialFormatId } from "./formats";
import type { SocialTemplateId } from "./spec";

export type SocialDestinationId =
  | "instagram-feed"
  | "instagram-story"
  | "linkedin-feed"
  | "linkedin-carousel"
  | "linkedin-banner"
  | "x-post"
  | "tiktok"
  | "link-preview";

export interface SocialDestination {
  id: SocialDestinationId;
  label: string;
  /** The surface, in the words someone would use out loud */
  surface: string;
  /** Sizes that work here. The first is what the picker selects. */
  formats: SocialFormatId[];
  /** The one thing about this place that changes the card */
  note: string;
  /** Layouts that survive this surface, offered first in the studio */
  suits: SocialTemplateId[];
  /** Roughly how much caption is read before the More link, for the note field */
  captionHint?: string;
  /** Slide count that works here, when the surface has carousels at all */
  carousel?: { max: number; note: string };
}

export const SOCIAL_DESTINATIONS: Record<SocialDestinationId, SocialDestination> = {
  "instagram-feed": {
    id: "instagram-feed",
    label: "Instagram feed",
    surface: "Feed post or carousel, seen on a phone at about a third of its real size",
    formats: ["portrait", "square"],
    note: "Portrait takes the most feed height of anything allowed, so it is the default here. Whatever the headline is has to survive being read at thumb size.",
    suits: ["hook", "statement", "product", "compare", "steps", "quote"],
    captionHint: "About 125 characters show before More.",
    carousel: { max: 10, note: "Slide one earns the swipe. Most people leave by slide three." },
  },
  "instagram-story": {
    id: "instagram-story",
    label: "Story",
    surface: "Full screen, held for a couple of seconds before a thumb moves",
    formats: ["story"],
    note: "The profile row covers the top and the reply bar covers the bottom. One idea, very large, and nothing in the corners.",
    suits: ["hook", "statement", "stat", "showcase", "term"],
  },
  "linkedin-feed": {
    id: "linkedin-feed",
    label: "LinkedIn feed",
    surface: "Feed post on desktop and phone, read by people already at work",
    formats: ["square", "landscape", "portrait"],
    note: "The audience here will read a denser card than Instagram will. This is the one place a checklist or a feature card earns its keep.",
    suits: ["compare", "checklist", "feature", "product", "announce", "stat"],
    captionHint: "About 200 characters show before See more.",
    carousel: { max: 10, note: "LinkedIn shows a document carousel inline, so a longer set is read here." },
  },
  "linkedin-carousel": {
    id: "linkedin-carousel",
    label: "LinkedIn carousel",
    surface: "A document post, paged through inside the feed",
    formats: ["portrait", "square"],
    note: "Paged through in the feed, so slides can carry more than an Instagram set. Still put the argument on slide one.",
    suits: ["hook", "steps", "compare", "product", "checklist"],
    carousel: { max: 10, note: "Eight is usually already too many. Cut before you add." },
  },
  "linkedin-banner": {
    id: "linkedin-banner",
    label: "Profile banner",
    surface: "The strip behind a profile or company page, and the top of an email",
    formats: ["banner"],
    note: "Your profile photo sits over the bottom left and the ends crop on a narrow window, so everything lives in the middle strip. One line, and usually no lockup, since the photo beside it already carries the mark.",
    suits: ["statement", "hook", "term"],
  },
  "x-post": {
    id: "x-post",
    label: "X post",
    surface: "In-stream image, cropped to 16:9 until someone taps it",
    formats: ["wide", "landscape"],
    note: "The crop is unforgiving and the image competes with the post text right under it. Short, high contrast, and do not put anything near the bottom edge.",
    suits: ["statement", "stat", "quote", "announce", "hook"],
    captionHint: "About 280 characters, and the post text is where the argument goes.",
  },
  tiktok: {
    id: "tiktok",
    label: "Video cover",
    surface: "The still frame a video is judged by in a grid and on the For You page",
    formats: ["story", "portrait"],
    note: "Read as a grid thumbnail as often as full screen, and the interface eats the right edge and the bottom third. Four words, enormous.",
    suits: ["hook", "stat", "statement"],
  },
  "link-preview": {
    id: "link-preview",
    label: "Link preview",
    surface: "The card that unfurls when the page is pasted into a chat, a post or a search result",
    formats: ["landscape", "wide"],
    note: "Almost always seen small, beside the page title. Use it to add what the title leaves out.",
    suits: ["statement", "product", "announce", "term"],
  },
};

export const SOCIAL_DESTINATION_IDS = Object.keys(SOCIAL_DESTINATIONS) as SocialDestinationId[];

/**
 * The destinations a given size is a sensible choice for. The studio uses
 * this to keep the picker honest in both directions: choosing a place
 * selects a size, and changing the size re-highlights the places.
 */
export function destinationsForFormat(format: SocialFormatId): SocialDestination[] {
  return SOCIAL_DESTINATION_IDS.map((id) => SOCIAL_DESTINATIONS[id]).filter((d) => d.formats.includes(format));
}
