/**
 * A list, whatever the query did.
 *
 * Every console screen reads several tables at once and then maps over
 * the results. Three separate things can put something other than an
 * array in `data`, and two of them are routine rather than exceptional:
 *
 *   1. Row level security refuses the read. PostgREST answers with an
 *      error and `data: null`.
 *   2. A `.single()` or a to-one embed returns an object, not a list.
 *   3. The network drops and the client hands back a rejected shape.
 *
 * A page that maps straight over `data` dies on the first of those, and
 * it dies in the render rather than in the fetch, so the whole route
 * shows a runtime error instead of an empty table. The rule on this
 * console: nothing maps over a query result without passing it through
 * here first.
 *
 * This is not a substitute for reading `error` — a screen that quietly
 * shows nothing when the reader was refused is its own bug. Read the
 * error, say so, and still render a list rather than throwing.
 */

/** The query result shape, without needing the generated database types. */
export interface QueryResultLike<T> {
  data: T[] | T | null;
  error: { message?: string } | null;
}

/** Whatever came back, as an array. Never null, never an object. */
export function rows<T>(result: QueryResultLike<T> | null | undefined): T[] {
  if (!result) return [];
  const { data } = result;
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") return [data as T];
  return [];
}

/**
 * The same coercion for a value that is already unwrapped — an embedded
 * relation, a prop, a cached blob. Supabase types a to-one embed as an
 * array on some paths and an object on others.
 */
export function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object") return [value as T];
  return [];
}

/** The first row of a to-one embed, whichever shape it arrived in. */
export function firstRow<T>(value: unknown): T | null {
  return asArray<T>(value)[0] ?? null;
}

/**
 * One sentence a reader can act on, or null when the query was fine.
 *
 * Deliberately not the raw PostgREST message: `permission denied for
 * table crm_deals` is accurate and tells the reader nothing they can do.
 */
export function readWarning(
  result: { error: { message?: string } | null } | null | undefined,
  subject: string
): string | null {
  if (!result?.error) return null;
  return `${subject} could not be read. Sign in again, or ask an owner to check your access.`;
}
