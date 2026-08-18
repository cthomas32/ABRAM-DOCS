/**
 * Svix signature verification for the Resend webhooks.
 *
 * Resend signs every delivery with Svix. Two routes in this repo receive
 * those deliveries and both of them write to the database with a client
 * that RLS does not constrain, so the signature is the only thing standing
 * between a stranger with the URL and the subscriber list. It lived inline
 * in one route and was missing from the other. It lives here now, and both
 * import it.
 *
 * Three properties this has to hold:
 *
 * 1. **Raw body, not parsed body.** The signature covers the exact bytes
 *    that were sent. `JSON.parse` then `JSON.stringify` does not round-trip
 *    key order or number formatting, so the caller must read `request.text()`
 *    and hand that string over before parsing it.
 * 2. **A timestamp window.** Without it a captured delivery replays forever.
 *    Five minutes, matching Svix's own recommendation.
 * 3. **Constant-time comparison.** A `===` on a signature leaks it one byte
 *    at a time to anybody willing to measure.
 *
 * MISSING SECRET IS A REFUSAL. An unset secret used to mean "skip the check",
 * which is the same as having no check at all on the day somebody forgets to
 * set it. It now means the route answers 503 and processes nothing. A webhook
 * that stops arriving is visible in the Resend dashboard within minutes. A
 * webhook anybody can forge is visible to nobody.
 */

import crypto from "crypto";

export type SvixResult =
  | { ok: true }
  | { ok: false; status: 401 | 503; reason: string };

/** Reads the first of these env vars that holds a value. */
export function readWebhookSecret(...names: string[]): string | null {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.trim()) return value.trim();
  }
  return null;
}

function timingSafeMatch(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  // timingSafeEqual throws on a length mismatch, which would itself be a
  // length oracle. Compare a fixed-width digest of each instead so every
  // comparison costs the same.
  const leftDigest = crypto.createHash("sha256").update(left).digest();
  const rightDigest = crypto.createHash("sha256").update(right).digest();
  return crypto.timingSafeEqual(leftDigest, rightDigest);
}

/**
 * True when the headers carry a valid Svix signature for this body.
 *
 * @param rawBody the exact request body string, before JSON.parse
 * @param headers the incoming request headers
 * @param secret  the `whsec_...` endpoint secret
 */
export function verifySvixSignature(
  rawBody: string,
  headers: Headers,
  secret: string
): boolean {
  const svixId = headers.get("svix-id") ?? headers.get("webhook-id");
  const svixTimestamp = headers.get("svix-timestamp") ?? headers.get("webhook-timestamp");
  const svixSignature = headers.get("svix-signature") ?? headers.get("webhook-signature");

  if (!svixId || !svixTimestamp || !svixSignature) return false;

  const now = Math.floor(Date.now() / 1000);
  const timestamp = Number.parseInt(svixTimestamp, 10);
  if (!Number.isFinite(timestamp) || Math.abs(now - timestamp) > 300) return false;

  // The secret is `whsec_<base64>`. Anything before the first underscore is
  // the prefix; a secret pasted without one is taken as the base64 itself.
  const underscore = secret.indexOf("_");
  const encodedSecret = underscore >= 0 ? secret.slice(underscore + 1) : secret;
  const secretBytes = Buffer.from(encodedSecret, "base64");
  if (secretBytes.length === 0) return false;

  const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;
  const expected = crypto
    .createHmac("sha256", secretBytes)
    .update(signedContent)
    .digest("base64");

  // The header is a space-separated list of `v1,<signature>` pairs, because
  // a rotating endpoint is signed with both the old and the new secret for
  // a while. Any one match is a match.
  for (const entry of svixSignature.split(" ")) {
    const comma = entry.indexOf(",");
    const candidate = comma >= 0 ? entry.slice(comma + 1) : entry;
    if (candidate && timingSafeMatch(candidate, expected)) return true;
  }

  return false;
}

/**
 * The whole gate, in the shape a route handler wants: read the secret,
 * refuse when it is absent, refuse when the signature does not check out.
 *
 * Pass every env var name the deployment might have used, most specific
 * first, so an endpoint with its own secret keeps it and a shared one
 * falls back.
 */
export function verifyResendWebhook(
  rawBody: string,
  headers: Headers,
  ...secretEnvNames: string[]
): SvixResult {
  const secret = readWebhookSecret(...secretEnvNames);

  if (!secret) {
    return {
      ok: false,
      status: 503,
      reason: `No webhook secret configured. Set one of: ${secretEnvNames.join(", ")}.`,
    };
  }

  if (!verifySvixSignature(rawBody, headers, secret)) {
    return { ok: false, status: 401, reason: "Invalid signature" };
  }

  return { ok: true };
}
