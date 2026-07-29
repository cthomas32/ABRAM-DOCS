/**
 * Recognising a lapsed admin session.
 *
 * Two things can tell us the session is gone: the auth client emitting
 * SIGNED_OUT after a refresh it could not retry, or a query coming back
 * rejected because the token no longer passes. This file covers the
 * second case so a stale session reads as "sign in again" rather than as
 * a raw database message.
 */

export interface QueryError {
  code?: string | null;
  message?: string | null;
}

/**
 * PostgREST codes that mean the caller is no longer authenticated.
 *
 * 42501 is Postgres' insufficient-privilege error. Every admin policy
 * grants the whole table to any signed-in user, so the only way to be
 * refused here is to have stopped being signed in.
 */
const AUTH_ERROR_CODES = new Set(["PGRST301", "PGRST302", "42501"]);

const AUTH_ERROR_PATTERNS = [
  "jwt expired",
  "jwt is expired",
  "invalid jwt",
  "jwsError",
  "invalid claim",
  "token is expired",
  "no suitable key",
  "not authenticated",
  "auth session missing",
];

/** True when the failure is the session rather than the request. */
export function isAuthError(error: QueryError | null | undefined): boolean {
  if (!error) return false;

  if (error.code && AUTH_ERROR_CODES.has(error.code)) return true;

  const message = (error.message || "").toLowerCase();
  return AUTH_ERROR_PATTERNS.some((pattern) => message.includes(pattern.toLowerCase()));
}
