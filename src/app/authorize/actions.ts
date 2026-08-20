"use server";

import { createClient } from "@/utils/supabase/server";
import { readConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import {
  CODE_TTL_MS,
  oauthService,
  randomId,
  redirectIsRegistered,
  resourceMatches,
  sha256Hex,
} from "@/lib/mcp/oauth";
import { issuerOrigin } from "@/lib/mcp/origin";

/**
 * The Allow button.
 *
 * **Everything the form carries is re-checked here.** The page already
 * validated the client, the redirect address and the challenge before it
 * rendered, and none of that validation is trusted a second time: the
 * fields arriving at a server action come from a browser, and a browser
 * can send anything. The client is looked up again, the redirect address
 * is matched against the registered list again, and the identity is read
 * from the session cookie and never from the form. That last one is the
 * one that matters. A form field naming the person to authorize would let
 * anybody mint a token for anybody.
 *
 * What it writes is a hashed, single-use code that expires in minutes,
 * bound to four things: this client, this person, this redirect address,
 * and the PKCE challenge the client committed to.
 */

export interface ApproveResult {
  ok: boolean;
  /** Where to send the browser. Present on success and on a clean refusal. */
  redirectTo?: string;
  /** Shown in place of the form when there is nowhere safe to redirect. */
  error?: string;
}

interface ApproveInput {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  state: string | null;
  resource: string | null;
}

export async function approveAuthorization(input: ApproveInput): Promise<ApproveResult> {
  const supabase = await createClient();
  const user = await readConsoleUser(supabase);

  if (!user) {
    return { ok: false, error: "Your session has expired. Sign in again and start over." };
  }
  if (!user.isActive || !can(user, "console.admin")) {
    return { ok: false, error: "Your login cannot reach the console, so there is nothing to connect." };
  }

  const service = oauthService();
  if (!service) {
    return { ok: false, error: "This server is not configured to complete a connection yet." };
  }

  const clientRow = await service
    .from("oauth_clients")
    .select("client_id, redirect_uris")
    .eq("client_id", input.clientId)
    .maybeSingle();

  const client = clientRow.data as { client_id: string; redirect_uris: string[] } | null;

  /* An unknown client, or an address it never registered. Both mean there
     is nowhere this is allowed to redirect to, so the answer is a message
     on this page rather than a redirect anywhere. */
  if (clientRow.error || !client) {
    return { ok: false, error: "That connector is not registered with this server." };
  }
  if (!redirectIsRegistered(client.redirect_uris, input.redirectUri)) {
    return { ok: false, error: "That return address is not one this connector registered." };
  }

  if (input.codeChallenge.length < 43 || input.codeChallenge.length > 128) {
    return { ok: false, error: "That connection request is malformed. Start it again from Claude." };
  }

  const origin = await issuerOrigin();
  if (!resourceMatches(input.resource, origin)) {
    return { ok: false, error: "That request asks for a resource this server does not issue tokens for." };
  }

  const code = `abram_ac_${randomId(32)}`;
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  const { error } = await service.from("oauth_codes").insert({
    code_hash: sha256Hex(code),
    client_id: client.client_id,
    user_id: user.userId,
    redirect_uri: input.redirectUri,
    code_challenge: input.codeChallenge,
    resource: input.resource,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    console.error("OAuth code insert failed:", error);
    return { ok: false, error: "That could not be saved. Try the connection again." };
  }

  const target = new URL(input.redirectUri);
  target.searchParams.set("code", code);
  /* Returned exactly as it arrived, which is how the client knows this
     response belongs to the flow it started. Dropping it is how a client
     ends up treating a cross-site forgery as its own request. */
  if (input.state) target.searchParams.set("state", input.state);

  return { ok: true, redirectTo: target.toString() };
}

/**
 * The Cancel button.
 *
 * A refusal is an answer and the client is entitled to hear it, so this
 * redirects back with `access_denied` rather than leaving somebody on a
 * dead page while Claude waits for a callback that never comes.
 */
export async function denyAuthorization(input: {
  clientId: string;
  redirectUri: string;
  state: string | null;
}): Promise<ApproveResult> {
  const service = oauthService();
  if (!service) return { ok: false, error: "Nothing was connected." };

  const clientRow = await service
    .from("oauth_clients")
    .select("redirect_uris")
    .eq("client_id", input.clientId)
    .maybeSingle();

  const client = clientRow.data as { redirect_uris: string[] } | null;

  /* Same rule as approving: an address that was never registered does not
     get told anything, not even a refusal. */
  if (!client || !redirectIsRegistered(client.redirect_uris, input.redirectUri)) {
    return { ok: false, error: "Nothing was connected. You can close this page." };
  }

  const target = new URL(input.redirectUri);
  target.searchParams.set("error", "access_denied");
  target.searchParams.set("error_description", "The person declined the connection.");
  if (input.state) target.searchParams.set("state", input.state);

  return { ok: true, redirectTo: target.toString() };
}
