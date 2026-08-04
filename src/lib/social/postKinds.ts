/**
 * What a post is for.
 *
 * The calendar could always say when a post goes out and with which card,
 * and it could not say what the post was doing there. Left unrecorded, a
 * week drifts to the same place every time: seven cards about ABRAM, which
 * is an account nobody follows and a feed nobody shares.
 *
 * These five are read as a mix across the week. `social-draft.js` refuses a
 * run where more than half of the days it books are product, and the week
 * view says so out loud when a week has drifted that way.
 */

export type PostKind = "product" | "craft" | "market" | "story" | "article";

export interface PostKindEntry {
  id: PostKind;
  label: string;
  blurb: string;
}

export const POST_KINDS: PostKindEntry[] = [
  {
    id: "product",
    label: "Product",
    blurb: "ABRAM doing something. A screen, a shipped change, an outcome it gets you.",
  },
  {
    id: "craft",
    label: "Craft",
    blurb: "Useful with the product taken out. A definition, a checklist, a way of running a day.",
  },
  {
    id: "market",
    label: "Market",
    blurb: "A number about the industry, carrying the name of whoever published it and a link to it in the note.",
  },
  {
    id: "story",
    label: "Story",
    blurb: "How we think about production, and what we are building. The posts that earn a follow.",
  },
  {
    id: "article",
    label: "Article",
    blurb: "Sends the reader to something we wrote. The card is the trailer and the page is the thing.",
  },
];

export const POST_KIND_IDS: PostKind[] = POST_KINDS.map((entry) => entry.id);

export function isPostKind(value: unknown): value is PostKind {
  return typeof value === "string" && (POST_KIND_IDS as string[]).includes(value);
}
