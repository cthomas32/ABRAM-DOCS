/**
 * The people who work here.
 *
 * `team_members` is the one place a name, a job title and a photograph are
 * written down. A blog byline reads from it, and so does a contact card.
 * Before this, a byline was free text with the photo copied onto every post
 * and kept in step by the editor rewriting all of them at once, which is why
 * a new headshot used to mean twenty-two writes instead of one.
 *
 * The legacy `blog_posts.author` and `blog_posts.author_avatar` columns are
 * deliberately still here. They are the fallback for a post whose author
 * never became a team member, and the snapshot that keeps a byline readable
 * if the member record is ever removed, which is why `member_id` is
 * ON DELETE SET NULL. Dropping those columns would blank those bylines.
 */

export interface TeamMember {
  id: string;
  slug: string;
  full_name: string;
  job_title: string | null;
  photo_url: string | null;
  short_bio: string | null;
  email: string | null;
  linkedin_url: string | null;
  x_url: string | null;
  website: string | null;
  /** Where they are based, written as they would write it in a signature. */
  location?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

/** Just enough of a member to draw a byline, for the nested select. */
export type BylineMember = Pick<TeamMember, "id" | "full_name" | "job_title" | "photo_url">;

/**
 * The relation to hang off a `blog_posts` select, e.g.
 * `.select(\`*, ${BYLINE_MEMBER_SELECT}\`)`.
 */
export const BYLINE_MEMBER_SELECT = "member:team_members(id, full_name, job_title, photo_url)";

/** Shown when a post has neither a member nor any author text left. */
export const DEFAULT_BYLINE_NAME = "ABRAM Team";

/** A post, as far as its byline is concerned. */
export interface BylineSource {
  author?: string | null;
  author_avatar?: string | null;
  /**
   * PostgREST returns a nested single relation as an object, but types it as
   * an array in some client versions, so both shapes are accepted here.
   */
  member?: BylineMember | BylineMember[] | null;
}

export interface Byline {
  name: string;
  /** Null for a guest author, whose one text field holds name and title together. */
  jobTitle: string | null;
  photoUrl: string | null;
  /** True when the byline came from a team member rather than the legacy text. */
  fromMember: boolean;
}

/** Unwraps the joined member, whichever shape the client handed back. */
export function bylineMember(row: BylineSource): BylineMember | null {
  const member = Array.isArray(row.member) ? row.member[0] : row.member;
  return member ?? null;
}

/**
 * Resolves a byline.
 *
 * A linked member wins, so changing a photograph in one place changes it
 * everywhere. Anything the member leaves blank falls through to the legacy
 * text, and a post with no member at all renders exactly as it always did:
 * one string, one avatar, no job title.
 */
export function resolveByline(row: BylineSource): Byline {
  const member = bylineMember(row);
  const legacyName = (row.author || "").trim();
  const legacyPhoto = row.author_avatar || null;

  if (member) {
    return {
      name: (member.full_name || "").trim() || legacyName || DEFAULT_BYLINE_NAME,
      jobTitle: (member.job_title || "").trim() || null,
      photoUrl: member.photo_url || legacyPhoto,
      fromMember: true,
    };
  }

  return {
    name: legacyName || DEFAULT_BYLINE_NAME,
    jobTitle: null,
    photoUrl: legacyPhoto,
    fromMember: false,
  };
}

/** Turns a person's name into a URL-safe slug for a new record. */
export function slugifyName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
