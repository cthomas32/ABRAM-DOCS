import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The authorization server that gets Claude connected.
 *
 * **Why this exists at all.** `/api/mcp` has always taken a bearer token
 * and that has always been enough for Claude Code, which lets you set a
 * header. The claude.ai connector dialog does not: it has a URL and two
 * OAuth fields. Presented with a bare `WWW-Authenticate: Bearer`
 * challenge and no discovery document, a client falls back to guessing
 * the endpoint names at the origin, which is why adding this server sent
 * somebody to `https://abram.network/authorize` and showed them a blank
 * page. That guess is now correct.
 *
 * **What it does not do is invent a credential.** The last act of the
 * flow is an insert into `mcp_tokens`, the same table the team screen
 * writes to, and the transport never learns which kind of token it was
 * handed. Every access rule stays in Postgres, `session.ts` is untouched,
 * and there is no second definition of who may read what -- which is the
 * property the whole CRM is built to preserve, and the one an OAuth layer
 * is most likely to quietly break.
 *
 * **Public clients, PKCE, S256, no secrets.** A client secret issued to a
 * desktop app or a third-party web service is a secret in a file on
 * somebody else's machine. PKCE replaces it with a proof: the client
 * commits to `SHA256(verifier)` when it starts and produces the verifier
 * when it redeems, so a stolen code is useless without the browser that
 * began the flow. `plain` is refused. It exists in the specification for
 * devices that cannot hash and is a downgrade attack anywhere else.
 *
 * **Registration is open and that is not the hole it looks like.**
 * Dynamic client registration has to accept strangers, because a client
 * that has never seen this server cannot have been pre-registered with
 * it. What a client id buys is the right to send somebody to a consent
 * page. Between that page and a row of the CRM stand a console password,
 * an active `admin_users` row, and a person reading whose data it is and
 * clicking Allow.
 */

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** The only resource this server issues tokens for. */
export const MCP_PATH = "/api/mcp";

/** Long enough for a redirect and a token call, short enough to be dull. */
export const CODE_TTL_MS = 5 * 60 * 1000;

/** The same life a hand-made token gets. One clock, one story. */
export const TOKEN_DAYS = 180;

/** Advertised, requested, and granted. There is only one thing to ask for. */
export const SCOPE = "mcp";

/* ------------------------------------------------------------------ */
/*  Secrets and hashing                                                */
/* ------------------------------------------------------------------ */

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

/** base64url of the raw digest, which is the shape PKCE compares in. */
export function pkceChallengeFor(verifier: string): string {
  return createHash("sha256").update(verifier, "utf8").digest("base64url");
}

export function randomId(bytes = 24): string {
  return randomBytes(bytes).toString("base64url");
}

/** Constant time over equal-length strings, false over unequal ones. */
export function sameSecret(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/* ------------------------------------------------------------------ */
/*  The elevated client                                                */
/* ------------------------------------------------------------------ */

/**
 * The service role, and only for the three tables this file owns.
 *
 * Everything that reads CRM data does so as the person. This writes
 * client registrations, authorization codes and one token row, none of
 * which a signed-in browser is allowed to write for the same reason it
 * cannot insert into `mcp_tokens`: whoever chooses the hash chooses the
 * credential.
 */
export function oauthService(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url?.trim() || !key?.trim()) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/* ------------------------------------------------------------------ */
/*  Redirect addresses                                                 */
/* ------------------------------------------------------------------ */

/**
 * Whether an address may receive an authorization code.
 *
 * https everywhere, with loopback in the clear as the one exception,
 * because a native client's callback is a server on 127.0.0.1 and there
 * is no certificate for that. Loopback is identified by host and never by
 * the word "localhost" in a string, so `https://localhost.evil.test` is
 * not a loopback address here.
 *
 * No fragment, since the fragment never reaches the server and a client
 * expecting one is confused about which flow it is in.
 */
export function isRegistrableRedirect(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  if (url.hash) return false;

  const loopback = url.hostname === "127.0.0.1" || url.hostname === "::1" || url.hostname === "localhost";
  if (url.protocol === "http:") return loopback;
  return url.protocol === "https:";
}

/**
 * Exact match against the registered list.
 *
 * Whole strings, never prefixes. A prefix test on `https://claude.ai/`
 * also passes `https://claude.ai.evil.test/`, and this comparison is the
 * single thing standing between an authorization code and somebody else's
 * callback.
 */
export function redirectIsRegistered(registered: string[], candidate: string): boolean {
  return registered.some((uri) => uri === candidate);
}

/** A redirect back to the client carrying an error, per RFC 6749 §4.1.2.1. */
export function errorRedirect(
  redirectUri: string,
  error: string,
  description: string,
  state?: string | null
): string {
  const url = new URL(redirectUri);
  url.searchParams.set("error", error);
  url.searchParams.set("error_description", description);
  if (state) url.searchParams.set("state", state);
  return url.toString();
}

/* ------------------------------------------------------------------ */
/*  Reading a request                                                  */
/* ------------------------------------------------------------------ */

export interface AuthorizeParams {
  responseType: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  state: string | null;
  scope: string | null;
  resource: string | null;
}

export function readAuthorizeParams(input: Record<string, string | string[] | undefined>): AuthorizeParams {
  const one = (key: string): string => {
    const value = input[key];
    return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
  };
  return {
    responseType: one("response_type"),
    clientId: one("client_id"),
    redirectUri: one("redirect_uri"),
    codeChallenge: one("code_challenge"),
    /* Absent means `plain` in the specification. Naming that default here
       rather than leaving it empty means the refusal below says what was
       wrong instead of "missing". */
    codeChallengeMethod: one("code_challenge_method") || "plain",
    state: one("state") || null,
    scope: one("scope") || null,
    resource: one("resource") || null,
  };
}

/**
 * Whether a `resource` names this server.
 *
 * RFC 8707 is what stops a token minted for this CRM being replayed at
 * some other service behind the same issuer. There is only one resource
 * today, so this is cheap insurance against the day there are two.
 * Absent is accepted: clients predating the requirement are still clients.
 */
export function resourceMatches(resource: string | null, origin: string): boolean {
  if (!resource) return true;
  try {
    const asked = new URL(resource);
    const ours = new URL(`${origin}${MCP_PATH}`);
    return asked.origin === ours.origin && asked.pathname.replace(/\/$/, "") === ours.pathname;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/*  CORS                                                               */
/* ------------------------------------------------------------------ */

/**
 * Wide open, on the endpoints where that is correct.
 *
 * Registration, token exchange and the two discovery documents are called
 * by clients from origins nobody here can enumerate, and none of them
 * reads a cookie: every one is authenticated by something in the request
 * body or by nothing at all. A credentialed cross-origin request would be
 * a different question, and `Allow-Credentials` is deliberately absent so
 * it cannot become one by accident.
 */
export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, MCP-Protocol-Version",
  "Access-Control-Max-Age": "86400",
};

/** An OAuth error object, in the shape RFC 6749 §5.2 asks for. */
export function oauthError(error: string, description: string, status = 400): Response {
  return new Response(JSON.stringify({ error, error_description: description }), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...CORS_HEADERS,
    },
  });
}
