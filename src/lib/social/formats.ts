/**
 * Output sizes for social images.
 *
 * A social card is the same idea rendered at five aspect ratios, so the
 * sizes live here on their own and every template reads from them. Type
 * does not scale linearly with pixel width: a story is only 1080 wide but
 * is read at arm's length on a full phone screen, so it wants larger type
 * than a 1200-wide link preview that shows up as a thumbnail. That is why
 * `scale` and `padding` are set per format by eye rather than derived.
 */

export type SocialFormatId = "square" | "portrait" | "story" | "landscape" | "wide" | "banner";

export interface SocialFormat {
  id: SocialFormatId;
  /** Shown in the studio picker */
  label: string;
  /** Where this size is actually used, so the picker explains itself */
  usedFor: string;
  width: number;
  height: number;
  /** Multiplier applied to every type size and gap in a template */
  scale: number;
  /** Inner padding in output pixels. Already absolute, so not scaled again. */
  paddingX: number;
  paddingY: number;
  /**
   * Extra inset on top of the padding, kept clear because the platform
   * puts its own interface there. A story is the case that matters: the
   * profile row sits over the top of the image and the reply bar over the
   * bottom, so a card that uses its full height loses its lockup to one
   * and its footer to the other. These are the reason a story card looks
   * sparse, and the sparseness is correct.
   */
  safeTop?: number;
  safeBottom?: number;
  safeLeft?: number;
  safeRight?: number;
  /** Why this size is inset, shown next to the picker */
  safeNote?: string;
}

export const SOCIAL_FORMATS: Record<SocialFormatId, SocialFormat> = {
  square: {
    id: "square",
    label: "Square",
    usedFor: "Instagram, LinkedIn and Facebook feed",
    width: 1080,
    height: 1080,
    scale: 1.05,
    paddingX: 88,
    paddingY: 88,
  },
  portrait: {
    id: "portrait",
    label: "Portrait",
    usedFor: "Instagram and Facebook feed, the tallest they allow",
    width: 1080,
    height: 1350,
    scale: 1.28,
    paddingX: 88,
    paddingY: 104,
  },
  story: {
    id: "story",
    label: "Story",
    usedFor: "Instagram, TikTok and LinkedIn stories, Reels covers",
    width: 1080,
    height: 1920,
    scale: 1.55,
    paddingX: 92,
    paddingY: 120,
    safeTop: 130,
    safeBottom: 250,
    safeNote: "The profile row and the reply bar cover the top and bottom, so a story carries less.",
  },
  landscape: {
    id: "landscape",
    label: "Landscape",
    usedFor: "Link previews, when a page is pasted into a chat or a post",
    width: 1200,
    height: 630,
    scale: 1,
    paddingX: 80,
    paddingY: 72,
  },
  wide: {
    id: "wide",
    label: "Wide",
    usedFor: "X posts, YouTube thumbnails and blog headers",
    width: 1600,
    height: 900,
    scale: 1.3,
    paddingX: 104,
    paddingY: 96,
  },
  banner: {
    id: "banner",
    label: "Banner",
    usedFor: "LinkedIn profile and page banners, email headers",
    width: 1584,
    height: 396,
    scale: 0.92,
    paddingX: 88,
    paddingY: 52,
    // The profile photo sits over the bottom-left corner on LinkedIn, and
    // the ends get cropped on a narrow window, so the readable part of a
    // banner is a strip in the middle.
    safeLeft: 260,
    safeRight: 160,
    safeNote: "Your profile photo covers the bottom left, and the ends crop on a narrow window.",
  },
};

export const SOCIAL_FORMAT_IDS = Object.keys(SOCIAL_FORMATS) as SocialFormatId[];

export const DEFAULT_FORMAT: SocialFormatId = "square";

export function getFormat(id: string | null | undefined): SocialFormat {
  return SOCIAL_FORMATS[(id as SocialFormatId) ?? DEFAULT_FORMAT] ?? SOCIAL_FORMATS[DEFAULT_FORMAT];
}

/**
 * Where the card is actually allowed to draw: its padding plus whatever
 * the platform's own interface is going to sit on top of. Everything that
 * measures a card works from these rather than from `padding*`, so adding
 * a safe area to a format is enough to move every layout out of the way.
 */
export function contentInsets(format: SocialFormat) {
  return {
    top: format.paddingY + (format.safeTop ?? 0),
    bottom: format.paddingY + (format.safeBottom ?? 0),
    left: format.paddingX + (format.safeLeft ?? 0),
    right: format.paddingX + (format.safeRight ?? 0),
  };
}

/** True when the platform covers part of this size, so the studio can say so. */
export function hasSafeArea(format: SocialFormat): boolean {
  return Boolean(format.safeTop || format.safeBottom || format.safeLeft || format.safeRight);
}
