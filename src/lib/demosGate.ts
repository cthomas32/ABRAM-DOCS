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
 * **Where the password comes from**, in order: the `demos_password` row in
 * `site_settings`, then `DEMOS_PASSWORD`, then the built-in default. The
 * database first is what lets somebody change it from the console instead
 * of from Vercel; see `src/lib/demosSettings.ts` for the read and its
 * cache. Everything in this file takes the resolved word as an argument,
 * so nothing here has to know which of the three it came from.
 *
 * **Changing the password locks everybody out again.** The cookie holds a
 * marker derived from the password rather than the word "unlocked", so a
 * cookie handed out under the old word stops matching the moment the new
 * one is saved. That is the point: a password is changed because the old
 * one travelled too far, and a change that left every existing browser
 * signed in would not undo anything.
 */

/* Deliberately free of Next imports. The cookie is *read* by the page,
   which is where `next/headers` belongs; everything decidable without a
   request lives here so it can be tested as plain functions. */
import { createHash, timingSafeEqual } from "node:crypto";

/** The cookie that says this browser has been let in. */
export const DEMOS_COOKIE = "demos_access";

/** Thirty days, in seconds. */
export const DEMOS_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

/** What runs when nothing is stored and nothing is in the environment. */
export const DEFAULT_DEMOS_PASSWORD = "ABRAMDEMOS";

/** The `site_settings` key the password is stored under. */
export const DEMOS_PASSWORD_KEY = "demos_password";

/**
 * Stored value → environment → default.
 *
 * Blank counts as absent at every level, so clearing the field in the
 * console falls back rather than opening the page to an empty password.
 */
export function resolveDemosPassword(stored?: string | null): string {
  const fromStore = typeof stored === "string" ? stored.trim() : "";
  if (fromStore.length > 0) return fromStore;

  const fromEnv = process.env.DEMOS_PASSWORD?.trim();
  if (fromEnv && fromEnv.length > 0) return fromEnv;

  return DEFAULT_DEMOS_PASSWORD;
}

/**
 * What the cookie holds: sixteen hex characters derived from the password.
 *
 * Not a secret and not a session — anybody holding the password can
 * compute it. Its whole job is to stop being valid when the password
 * changes, which is why the password is in the digest at all. The prefix
 * is there so this hash can never collide with a hash of the same word
 * taken for some other purpose.
 */
export function demosCookieMarker(password: string): string {
  return createHash("sha256").update(`demos-gate:v1:${password}`).digest("hex").slice(0, 16);
}

/**
 * Compared byte by byte in constant time. The password is shared and
 * short, so this buys little, but a comparison that returns early is the
 * kind of thing that gets copied into somewhere it matters.
 */
export function passwordMatches(submitted: unknown, password: string): boolean {
  if (typeof submitted !== "string") return false;

  const expected = Buffer.from(password, "utf8");
  const given = Buffer.from(submitted.trim(), "utf8");
  if (expected.length !== given.length) return false;

  return timingSafeEqual(expected, given);
}

/**
 * True when the cookie a request carried was issued under the password
 * that is current now. A cookie from before a password change is not
 * expired, it simply no longer matches, and the visitor sees the form.
 */
export function unlockedByCookie(value: string | undefined, password: string): boolean {
  if (typeof value !== "string" || value.length === 0) return false;
  return value === demosCookieMarker(password);
}

/** The options every place that sets the unlock cookie must use. */
export function demosCookieOptions(password: string) {
  return {
    name: DEMOS_COOKIE,
    value: demosCookieMarker(password),
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
 * into an open redirect. `?v=<slug>` and `?f=<folder>` deep links survive
 * this way: the page hands the form the query it was asked for, and it
 * comes back intact.
 */
export function safeDemosReturn(next: unknown): string {
  if (typeof next !== "string") return "/demos";
  if (!next.startsWith("/demos")) return "/demos";
  if (next.startsWith("//")) return "/demos";
  return next;
}
