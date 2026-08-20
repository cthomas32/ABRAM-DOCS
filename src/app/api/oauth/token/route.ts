import {
  CORS_HEADERS,
  SCOPE,
  TOKEN_DAYS,
  oauthError,
  oauthService,
  pkceChallengeFor,
  sameSecret,
  sha256Hex,
} from "@/lib/mcp/oauth";
import { forgetSession, mintToken } from "@/lib/mcp/session";

/**
 * A code, spent once, for a token.
 *
 * The last step of the flow, and the only one that produces a
 * credential. What it produces is an ordinary row in `mcp_tokens` -- the
 * same table the team screen writes to, read by the same `identify()`
 * that has always read it. `/api/mcp` cannot tell the difference and does
 * not need to, because the access rules were never in the token.
 *
 * Four things are checked, and each one is load-bearing:
 *
 * **The code exists and has not expired.** By hash, so a leaked table is
 * not a pile of working codes.
 *
 * **PKCE.** `SHA256(verifier)` has to equal the challenge committed to
 * when the flow began. This is what makes a stolen code useless: the
 * thief has the code and not the verifier, which never left the client
 * that started it.
 *
 * **The redirect address matches the one the code was issued against.**
 * Without this, a client that registered two addresses can have a code
 * issued to one and redeemed against the other.
 *
 * **The code has not already been spent.** And when it has, the response
 * is not merely a refusal: the token that the first redemption produced
 * is revoked. A code presented twice is a code that has plainly been
 * seen by somebody it should not have been, and RFC 6749 §10.5 is right
 * that the safe assumption is theft rather than a retry.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

interface CodeRow {
  id: string;
  client_id: string;
  user_id: string;
  redirect_uri: string;
  code_challenge: string;
  expires_at: string;
  redeemed_at: string | null;
  issued_token_id: string | null;
}

export async function POST(request: Request) {
  /* Form encoded, because that is what RFC 6749 specifies and what every
     client sends. JSON is accepted too: some send it anyway, and a
     refusal here reads to the person as "connection failed". */
  let form: URLSearchParams;
  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as Record<string, unknown>;
      form = new URLSearchParams(
        Object.entries(body).map(([key, value]) => [key, String(value ?? "")])
      );
    } else {
      form = new URLSearchParams(await request.text());
    }
  } catch {
    return oauthError("invalid_request", "That request body could not be read.");
  }

  const grantType = form.get("grant_type")?.trim() ?? "";
  const code = form.get("code")?.trim() ?? "";
  const redirectUri = form.get("redirect_uri")?.trim() ?? "";
  const clientId = form.get("client_id")?.trim() ?? "";
  const codeVerifier = form.get("code_verifier")?.trim() ?? "";

  /* No refresh grant. A token here lives 180 days and re-consenting is
     one click, so a refresh flow would add a second credential to store
     and rotate in exchange for removing an annual click. If that trade
     ever changes, this is the place. */
  if (grantType !== "authorization_code") {
    return oauthError(
      "unsupported_grant_type",
      "This server issues tokens for the authorization_code grant only."
    );
  }

  if (!code || !redirectUri || !clientId || !codeVerifier) {
    return oauthError(
      "invalid_request",
      "code, code_verifier, client_id and redirect_uri are all required."
    );
  }

  /* RFC 7636 fixes the length, and checking it here means a client that
     sends something short finds out why rather than seeing a mismatch. */
  if (codeVerifier.length < 43 || codeVerifier.length > 128) {
    return oauthError("invalid_grant", "The code verifier is not a valid length.");
  }

  const service = oauthService();
  if (!service) {
    return oauthError("server_error", "This server is not configured to issue tokens yet.", 503);
  }

  const codeHash = sha256Hex(code);

  const found = await service
    .from("oauth_codes")
    .select("id, client_id, user_id, redirect_uri, code_challenge, expires_at, redeemed_at, issued_token_id")
    .eq("code_hash", codeHash)
    .maybeSingle();

  const row = found.data as CodeRow | null;

  if (found.error || !row) {
    return oauthError("invalid_grant", "That code is not valid.");
  }

  /* Spent already. Revoke what it bought and refuse, on the assumption
     that two presentations of a single-use code means somebody else has
     seen it. A client retrying a request it thought failed loses its
     connection and reconnects, which is the cheaper of the two mistakes. */
  if (row.redeemed_at) {
    if (row.issued_token_id) {
      const revoked = await service
        .from("mcp_tokens")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", row.issued_token_id)
        .is("revoked_at", null)
        .select("token_hash")
        .maybeSingle();

      const hash = (revoked.data as { token_hash: string } | null)?.token_hash;
      if (hash) forgetSession(hash);
    }
    return oauthError("invalid_grant", "That code has already been used.");
  }

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    return oauthError("invalid_grant", "That code has expired. Start the connection again.");
  }

  if (!sameSecret(row.client_id, clientId)) {
    return oauthError("invalid_grant", "That code was not issued to this client.");
  }

  if (row.redirect_uri !== redirectUri) {
    return oauthError("invalid_grant", "That redirect address does not match the one the code was issued for.");
  }

  if (!sameSecret(row.code_challenge, pkceChallengeFor(codeVerifier))) {
    return oauthError("invalid_grant", "The code verifier does not match the challenge.");
  }

  /* The login could have been switched off between Allow and here. It is
     seconds, and checking costs one query against the alternative of a
     token minted for somebody who was deactivated mid-flow. `identify()`
     would refuse it on first use regardless; this means the connection
     fails at setup, where the message is read. */
  const account = await service
    .from("admin_users")
    .select("user_id, is_active")
    .eq("user_id", row.user_id)
    .maybeSingle();

  if (account.error || !(account.data as { is_active: boolean } | null)?.is_active) {
    return oauthError("invalid_grant", "That login is no longer active.", 403);
  }

  /* Mark spent before minting. If the insert below fails the code is
     burnt and the person starts over, which is a worse minute than the
     alternative and a much better failure than a window in which the same
     code buys two tokens. */
  const spent = await service
    .from("oauth_codes")
    .update({ redeemed_at: new Date().toISOString() })
    .eq("id", row.id)
    .is("redeemed_at", null)
    .select("id")
    .maybeSingle();

  if (spent.error || !spent.data) {
    return oauthError("invalid_grant", "That code has already been used.");
  }

  /* Connecting the same client again replaces the previous token rather
     than stacking one on top of it. Without this, reconnecting four times
     leaves four live keys and walks towards the ten-token cap for no
     reason anybody would recognise later. */
  const superseded = await service
    .from("mcp_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", row.user_id)
    .eq("oauth_client_id", row.client_id)
    .is("revoked_at", null)
    .select("token_hash");

  for (const previous of (superseded.data as { token_hash: string }[] | null) ?? []) {
    forgetSession(previous.token_hash);
  }

  const { token, hash, prefix } = mintToken();
  const expiresAt = new Date(Date.now() + TOKEN_DAYS * 86_400_000);

  const clientRow = await service
    .from("oauth_clients")
    .select("client_name")
    .eq("client_id", row.client_id)
    .maybeSingle();

  const clientName = (clientRow.data as { client_name: string } | null)?.client_name ?? "A connected client";

  const inserted = await service
    .from("mcp_tokens")
    .insert({
      user_id: row.user_id,
      token_hash: hash,
      prefix,
      /* Named after the client, so the team screen shows "Claude" beside
         the tokens somebody typed a name for, and revoking the right one
         does not require remembering which is which. */
      name: clientName.slice(0, 80),
      oauth_client_id: row.client_id,
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .maybeSingle();

  if (inserted.error || !inserted.data) {
    console.error("OAuth token insert failed:", inserted.error);
    return oauthError("server_error", "The token could not be saved. Start the connection again.", 500);
  }

  await service
    .from("oauth_codes")
    .update({ issued_token_id: (inserted.data as { id: string }).id })
    .eq("id", row.id);

  await service
    .from("oauth_clients")
    .update({ last_authorized_at: new Date().toISOString() })
    .eq("client_id", row.client_id);

  /* Housekeeping at the natural moment: the end of a flow is when the
     debris of previous ones is worth clearing. Not awaited, and a failure
     is not this request's problem. */
  void service.rpc("prune_oauth_codes").then(undefined, () => undefined);

  return new Response(
    JSON.stringify({
      access_token: token,
      token_type: "Bearer",
      expires_in: Math.floor((expiresAt.getTime() - Date.now()) / 1000),
      scope: SCOPE,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        /* A credential must not sit in a shared cache. */
        "Cache-Control": "no-store",
        Pragma: "no-cache",
        ...CORS_HEADERS,
      },
    }
  );
}
