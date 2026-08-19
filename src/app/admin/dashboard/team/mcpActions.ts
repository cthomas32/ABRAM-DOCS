"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { readConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import { forgetSession, mintToken } from "@/lib/mcp/session";

/**
 * Handing somebody a key to their own CRM.
 *
 * The plaintext token exists in exactly one place for exactly one moment:
 * the return value of `createMcpToken`. It is shown once, it is never
 * written to the database, and there is no path anywhere in this
 * application that can produce it again. If somebody loses it they make
 * another, which is thirty seconds of inconvenience and the reason a
 * leaked backup is not a leaked credential.
 *
 * The insert uses the service role, and that is deliberate rather than
 * lazy. There is no INSERT policy on `mcp_tokens` for a signed in
 * browser, because a browser that can insert a row here can choose its
 * own hash, which is the same as choosing its own token for somebody
 * else's account. Minting happens on the server, after this file has
 * established who is asking, and the row it writes names that person and
 * nobody else.
 *
 * Revoking is an ordinary update under row level security, so a person
 * can revoke their own and an owner can revoke anybody's, and neither can
 * revoke in a direction the policy does not allow.
 */

const MAX_NAME = 80;
const MAX_LIVE_TOKENS = 10;
const DEFAULT_DAYS = 180;

export interface McpTokenResult {
  ok: boolean;
  error?: string;
  /** Present once, on creation, and never again. */
  token?: string;
  expiresOn?: string;
}

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function createMcpToken(input: {
  name: string;
  /** How long it lives. Capped at a year: a key with no end is a key in a drawer. */
  days?: number;
}): Promise<McpTokenResult> {
  const supabase = await createServerClient();
  const user = await readConsoleUser(supabase);

  if (!user) return { ok: false, error: "Your session has expired. Sign in again." };
  if (!can(user, "console.admin")) {
    return { ok: false, error: "Your login cannot reach the console, so there is nothing to connect." };
  }

  const name = (input.name ?? "").trim().slice(0, MAX_NAME);
  if (!name) {
    return { ok: false, error: "Give it a name, so you know which one to revoke later." };
  }

  const days = Math.min(Math.max(Math.round(Number(input.days ?? DEFAULT_DAYS)), 1), 365);

  /* A cap, because the failure this prevents is not somebody making
     eleven tokens on purpose. It is a broken client retrying a setup step
     and leaving forty live keys behind. */
  const live = await supabase
    .from("mcp_tokens")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.userId)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString());

  if ((live.count ?? 0) >= MAX_LIVE_TOKENS) {
    return {
      ok: false,
      error: `You already have ${MAX_LIVE_TOKENS} live tokens. Revoke one you no longer recognise before making another.`,
    };
  }

  const service = serviceClient();
  if (!service) {
    return { ok: false, error: "This server is not configured to mint tokens yet." };
  }

  const { token, hash, prefix } = mintToken();
  const expiresAt = new Date(Date.now() + days * 86_400_000);

  const { error } = await service.from("mcp_tokens").insert({
    user_id: user.userId,
    token_hash: hash,
    prefix,
    name,
    expires_at: expiresAt.toISOString(),
  });

  if (error) return { ok: false, error: `That did not save: ${error.message}` };

  revalidatePath("/admin/dashboard/team");
  return { ok: true, token, expiresOn: expiresAt.toISOString().slice(0, 10) };
}

export async function revokeMcpToken(tokenId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createServerClient();
  const user = await readConsoleUser(supabase);
  if (!user) return { ok: false, error: "Your session has expired. Sign in again." };

  /* Row level security decides whether this is theirs to revoke. The
     select afterwards is what tells us it actually happened: an update
     that matches no row under policy returns no error and no rows. */
  const { data, error } = await supabase
    .from("mcp_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", tokenId)
    .is("revoked_at", null)
    .select("token_hash")
    .maybeSingle();

  if (error) return { ok: false, error: `That did not save: ${error.message}` };
  if (!data) return { ok: false, error: "That token is not yours to revoke, or it is already revoked." };

  /* Drop the cached database session immediately, so revoking takes
     effect on the next call rather than when the cache happens to expire.
     The server re-checks `revoked_at` on every request regardless; this
     is belt and braces on the instance that is already warm. */
  forgetSession(data.token_hash as string);

  revalidatePath("/admin/dashboard/team");
  return { ok: true };
}
