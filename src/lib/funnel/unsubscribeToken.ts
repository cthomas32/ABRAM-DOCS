/**
 * The token in an unsubscribe link.
 *
 * One rule shapes this file: **an unsubscribe link must work for the person
 * holding it and for nobody else.** A link containing a bare email address
 * is an invitation to unsubscribe strangers by editing the address bar, and
 * a link containing a random id needs a table to look it up in, which is a
 * table that has to be written before the email can be sent and cleaned up
 * afterwards. A signature needs neither. The address travels in the link,
 * the signature proves we minted it, and nothing is stored anywhere.
 *
 * The signature is an HMAC rather than a plain hash. A plain hash of an
 * address is forgeable by anybody who can guess the construction, which is
 * everybody, since this file is public.
 *
 * The key is deliberately allowed to fall back to the service role key. A
 * welcome email that cannot send because a new secret is missing is a worse
 * failure than a key doing double duty, and the value never leaves the
 * server either way. Set `NEWSLETTER_UNSUBSCRIBE_SECRET` to separate them,
 * which also lets the link secret be rotated on its own; rotating it
 * invalidates links already sitting in inboxes, so it is not free.
 */

import { createHmac, timingSafeEqual } from "crypto";

const SEPARATOR = ".";

function secret(): string | null {
  return (
    process.env.NEWSLETTER_UNSUBSCRIBE_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    null
  );
}

function base64url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

/**
 * The token for one address, or null when there is no key to sign with.
 *
 * Null is a real outcome and callers have to handle it. It means the email
 * has no working unsubscribe link, and an email with no working unsubscribe
 * link does not get sent.
 */
export function mintUnsubscribeToken(email: string): string | null {
  const key = secret();
  if (!key) return null;

  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const payload = base64url(normalized);
  return `${payload}${SEPARATOR}${sign(payload, key)}`;
}

/**
 * The address a token stands for, or null if it does not verify.
 *
 * Every failure returns null rather than throwing or explaining. A route
 * that says "bad signature" for one token and "unknown address" for
 * another is an oracle, and the only thing it helps anybody do is probe.
 */
export function readUnsubscribeToken(token: string | null | undefined): string | null {
  const key = secret();
  if (!key || typeof token !== "string") return null;

  const index = token.indexOf(SEPARATOR);
  if (index <= 0) return null;

  const payload = token.slice(0, index);
  const provided = token.slice(index + 1);
  if (!payload || !provided) return null;

  const expected = sign(payload, key);

  /* Compared in constant time. The comparison leaks how many leading bytes
     matched otherwise, which over enough attempts is a forged signature. */
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const email = Buffer.from(payload, "base64url").toString("utf8").trim().toLowerCase();
    return email.includes("@") ? email : null;
  } catch {
    return null;
  }
}

/** The full link, or null when it cannot be signed. */
export function unsubscribeUrl(email: string, origin = "https://abram.network"): string | null {
  const token = mintUnsubscribeToken(email);
  return token ? `${origin}/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}` : null;
}
