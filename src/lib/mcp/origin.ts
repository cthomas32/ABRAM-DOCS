import { headers } from "next/headers";

/**
 * The issuer, read from the request rather than from configuration.
 *
 * A discovery document has to name the origin it was fetched from. A
 * client that fetches metadata from a preview deployment and is told the
 * issuer is production will refuse it, correctly. Deriving it from the
 * forwarded host means previews authorize against themselves and nobody
 * has to remember an environment variable per deployment.
 *
 * It lives alone in this file so that `oauth.ts` imports nothing from
 * Next. Everything in there decides whether a stranger may walk off with
 * a key to the CRM, and that is the code that has to be runnable by a
 * plain test process with no framework underneath it.
 */
export async function issuerOrigin(): Promise<string> {
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host") ?? "abram.network";
  const proto = list.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
