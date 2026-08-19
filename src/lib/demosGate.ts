/**
 * The lock on /demos.
 *
 * The demo library is finished work that is not ready to be public, so the
 * page is behind one shared password rather than an account. This is a
 * curtain, not a vault: everyone who is let in gets the same word, and the
 * word is expected to travel. It exists so the library is not indexed and
 * not stumbled into, not to defend the videos from somebody determined.
 *
 * Two facts carry it. The check is **server side only** — the password is
 * never sent to the browser, and a locked page never builds the video data
 * at all, so there is nothing in the HTML to read past the form. And the
 * cookie is `httpOnly`, so the thing that proves you got in cannot be read
 * or forged from page script.
 *
 * The password lives in `DEMOS_PASSWORD`. Change it in the environment and
 * redeploy; the default below is what runs when the variable is unset.
 */

/* Deliberately free of Next imports. The cookie is *read* by the page,
   which is where `next/headers` belongs; everything decidable without a
   request lives here so it can be tested as plain functions. */
import { timingSafeEqual } from "node:crypto";

/** The cookie that says this browser has been let in. */
export const DEMOS_COOKIE = "demos_access";

/** Thirty days, in seconds. */
export const DEMOS_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

/** What the cookie holds. The value is a marker, not a secret. */
const DEMOS_COOKIE_VALUE = "unlocked";

const DEFAULT_PASSWORD = "ABRAMDEMOS";

export function demosPassword(): string {
  const configured = process.env.DEMOS_PASSWORD?.trim();
  return configured && configured.length > 0 ? configured : DEFAULT_PASSWORD;
}

/**
 * Compared byte by byte in constant time. The password is shared and
 * short, so this buys little, but a comparison that returns early is the
 * kind of thing that gets copied into somewhere it matters.
 */
export function passwordMatches(submitted: unknown): boolean {
  if (typeof submitted !== "string") return false;

  const expected = Buffer.from(demosPassword(), "utf8");
  const given = Buffer.from(submitted.trim(), "utf8");
  if (expected.length !== given.length) return false;

  return timingSafeEqual(expected, given);
}

/** True when the cookie a request carried says this browser was let in. */
export function unlockedByCookie(value: string | undefined): boolean {
  return value === DEMOS_COOKIE_VALUE;
}

/** The options every place that sets the unlock cookie must use. */
export function demosCookieOptions() {
  return {
    name: DEMOS_COOKIE,
    value: DEMOS_COOKIE_VALUE,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DEMOS_COOKIE_MAX_AGE,
  };
}

/**
 * Where to send somebody after they unlock.
 *
 * Only ever a path under /demos, so a submitted `next` cannot be turned
 * into an open redirect. `?v=<slug>` deep links survive this way: the page
 * hands the form the query it was asked for, and it comes back intact.
 */
export function safeDemosReturn(next: unknown): string {
  if (typeof next !== "string") return "/demos";
  if (!next.startsWith("/demos")) return "/demos";
  if (next.startsWith("//")) return "/demos";
  return next;
}
