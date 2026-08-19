/**
 * The five shelves, as a plain module.
 *
 * No directive at the top of this file on purpose. A `"use server"`
 * module may only export async functions, and everything else in it is
 * rewritten into a server action reference at build time, so a constant
 * array exported from an actions file survives type checking, survives
 * the build, and arrives in the browser as a function. The accounts
 * screen died that way once. Both the server actions and the client
 * components import from here instead.
 *
 * The names mirror `abram-network/.agents/brain/` so that somebody moving
 * between the two repositories is not learning a second taxonomy.
 */

export type BrainCollection = "brand" | "business" | "market" | "decisions" | "proposals";

export interface BrainCollectionSpec {
  id: BrainCollection;
  label: string;
  /** One line, drawn under the heading on the shelf. */
  hint: string;
}

export const BRAIN_COLLECTIONS: BrainCollectionSpec[] = [
  {
    id: "brand",
    label: "Brand",
    hint: "Voice, and the rule that every claim traces to something real.",
  },
  {
    id: "business",
    label: "Business",
    hint: "What ABRAM is, who it is for, and what it charges.",
  },
  {
    id: "market",
    label: "Market",
    hint: "Competitors, the category, and what other people charge.",
  },
  {
    id: "decisions",
    label: "Decisions",
    hint: "Questions that have an answer. Append only, reversals supersede.",
  },
  {
    id: "proposals",
    label: "Proposals",
    hint: "How a proposal is written, and the exemplars worth copying.",
  },
];

export const BRAIN_COLLECTION_IDS = BRAIN_COLLECTIONS.map((entry) => entry.id);

export function brainCollectionLabel(id: string): string {
  return BRAIN_COLLECTIONS.find((entry) => entry.id === id)?.label ?? id;
}

export interface BrainDoc {
  id: string;
  collection: BrainCollection;
  slug: string;
  title: string;
  summary: string | null;
  body_md: string;
  owner_user_id: string | null;
  status: "draft" | "published";
  tags: string[];
  last_verified_on: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface BrainRevision {
  id: string;
  doc_id: string;
  title: string;
  body_md: string;
  summary: string | null;
  edited_by: string | null;
  created_at: string;
}

/**
 * Everything decays.
 *
 * Ninety days is the line the file convention draws, and past it a claim
 * is a lead rather than a fact. A document that has never been verified
 * is not stale, it is unverified, which is a different thing and reads
 * differently on the shelf.
 */
export function verificationAge(
  lastVerifiedOn: string | null,
  now: Date
): { state: "unverified" | "fresh" | "stale"; days: number | null } {
  if (!lastVerifiedOn) return { state: "unverified", days: null };

  const then = new Date(`${lastVerifiedOn}T00:00:00Z`);
  if (Number.isNaN(then.getTime())) return { state: "unverified", days: null };

  const days = Math.floor((now.getTime() - then.getTime()) / 86_400_000);
  return { state: days > 90 ? "stale" : "fresh", days };
}

/** A title becomes an address. Same shape the slug constraint enforces. */
export function toSlug(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
