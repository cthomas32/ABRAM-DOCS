import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ConsoleRole, ConsoleUser, GrowthStage } from "@/lib/auth/permissions";

/**
 * Turning a token into a database session that belongs to a person.
 *
 * This is the part of the MCP server that has to be right, so the
 * reasoning is here rather than in a commit message.
 *
 * **The server never answers with the service role.** It would be four
 * lines shorter: look the token up, use the elevated client, filter the
 * rows in JavaScript according to the permission catalog. That is also
 * how a system ends up with two definitions of who may see what, and the
 * copy that drifts is always the one doing the enforcing. Every rule in
 * `.agents/growth-crm.md` is enforced by row level security in Postgres,
 * and this makes the MCP inherit those rules rather than restate them: an
 * advisor asking Claude for "my pipeline" gets their own accounts for
 * exactly the same reason the web console shows them their own accounts.
 * Nothing here is SECURITY DEFINER and nothing here bypasses a policy.
 *
 * **How a session is obtained.** The database's own tokens are signed
 * with a key this application does not hold, so it cannot mint one. What
 * it can do, with the service role, is ask the auth service for a one
 * time link for a known address and immediately redeem it. `generateLink`
 * generates and does not send: no mail leaves, and the address is read
 * from `admin_users` rather than from the request, so the caller chooses
 * a token and never an identity. What comes back is an ordinary user
 * session, indistinguishable from one created by signing in, which is the
 * point.
 *
 * **Why it is cached.** That exchange costs two round trips and the
 * session it returns is good for an hour. Caching it per token for fifty
 * minutes turns a per-request cost into a per-hour one. The cache is in
 * memory, so it dies with the instance, which is the correct behaviour: a
 * revoked token cannot outlive a deploy, and the revocation check runs on
 * every call regardless of whether the session was cached.
 *
 * **What is checked on every single call**, cached session or not:
 * the token exists, it is not revoked, it has not expired, and the login
 * behind it is still active. Deactivating somebody in the console kills
 * their MCP access on their next request without anybody remembering to
 * revoke a token.
 */

const TOKEN_PREFIX = "abram_mcp_";
const PREFIX_VISIBLE = 8;
/** Ten minutes short of the hour a Supabase access token lives. */
const SESSION_TTL_MS = 50 * 60 * 1000;

export interface McpIdentity {
  user: ConsoleUser;
  /** Scoped to this person. Row level security applies to every query. */
  supabase: SupabaseClient;
  tokenId: string;
}

export type McpAuthFailure =
  | "no_token"
  | "malformed"
  | "unknown"
  | "revoked"
  | "expired"
  | "inactive"
  | "not_configured"
  | "session_failed";

export interface McpAuthResult {
  identity?: McpIdentity;
  failure?: McpAuthFailure;
}

/* ------------------------------------------------------------------ */
/*  Tokens                                                             */
/* ------------------------------------------------------------------ */

/** 32 bytes of randomness, base64url, behind a recognisable prefix. */
export function mintToken(): { token: string; hash: string; prefix: string } {
  const secret = randomBytes(32).toString("base64url");
  const token = `${TOKEN_PREFIX}${secret}`;
  return {
    token,
    hash: hashToken(token),
    prefix: secret.slice(0, PREFIX_VISIBLE),
  };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/**
 * Constant time compare over the hashes.
 *
 * The lookup is by hash and Postgres decides equality, so this is belt
 * and braces for the paths that compare in process. It matters more than
 * it looks: a byte-at-a-time comparison over a value an attacker controls
 * leaks the value one byte at a time.
 */
export function sameToken(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** The bearer token, or null. Nothing else is accepted as a credential. */
export function bearerFrom(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  const token = match?.[1]?.trim();
  return token && token.startsWith(TOKEN_PREFIX) ? token : null;
}

/* ------------------------------------------------------------------ */
/*  The session cache                                                  */
/* ------------------------------------------------------------------ */

interface CachedSession {
  accessToken: string;
  expiresAt: number;
}

const sessions = new Map<string, CachedSession>();

function cachedSession(hash: string): string | null {
  const entry = sessions.get(hash);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    sessions.delete(hash);
    return null;
  }
  return entry.accessToken;
}

/** Called when a token stops being valid, so a revoke takes effect now. */
export function forgetSession(hash: string): void {
  sessions.delete(hash);
}

/* ------------------------------------------------------------------ */
/*  Clients                                                            */
/* ------------------------------------------------------------------ */

function env(name: string): string | null {
  const value = process.env[name];
  return value && value.trim() ? value : null;
}

function serviceClient(): SupabaseClient | null {
  const url = env("NEXT_PUBLIC_SUPABASE_URL");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** A client that is this person, and is refused whatever they are refused. */
function userClient(accessToken: string): SupabaseClient | null {
  const url = env("NEXT_PUBLIC_SUPABASE_URL");
  const key = env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

/**
 * A real user session for an address we already trust.
 *
 * `generateLink` does not send mail. It returns the one time token that
 * a link would have carried, and `verifyOtp` redeems it for a session.
 * The address comes from `admin_users`, never from the request.
 */
async function sessionFor(service: SupabaseClient, email: string): Promise<string | null> {
  const generated = await service.auth.admin.generateLink({ type: "magiclink", email });
  const hashedToken = generated.data?.properties?.hashed_token;
  if (generated.error || !hashedToken) return null;

  const url = env("NEXT_PUBLIC_SUPABASE_URL");
  const key = env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  if (!url || !key) return null;

  const redeemer = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const verified = await redeemer.auth.verifyOtp({ token_hash: hashedToken, type: "magiclink" });
  return verified.data?.session?.access_token ?? null;
}

/* ------------------------------------------------------------------ */
/*  The whole exchange                                                 */
/* ------------------------------------------------------------------ */

export async function identify(request: Request): Promise<McpAuthResult> {
  const token = bearerFrom(request);
  if (!token) return { failure: "no_token" };
  if (token.length < TOKEN_PREFIX.length + 20) return { failure: "malformed" };

  const service = serviceClient();
  if (!service) return { failure: "not_configured" };

  const hash = hashToken(token);

  const tokenRes = await service
    .from("mcp_tokens")
    .select("id, user_id, token_hash, expires_at, revoked_at")
    .eq("token_hash", hash)
    .maybeSingle();

  const row = tokenRes.data as
    | { id: string; user_id: string; token_hash: string; expires_at: string; revoked_at: string | null }
    | null;

  if (tokenRes.error || !row || !sameToken(row.token_hash, hash)) {
    return { failure: "unknown" };
  }
  if (row.revoked_at) {
    forgetSession(hash);
    return { failure: "revoked" };
  }
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    forgetSession(hash);
    return { failure: "expired" };
  }

  const userRes = await service
    .from("admin_users")
    .select("user_id, email, full_name, role, growth_stage, member_id, is_active")
    .eq("user_id", row.user_id)
    .maybeSingle();

  const record = userRes.data as
    | {
        user_id: string;
        email: string;
        full_name: string | null;
        role: ConsoleRole;
        growth_stage: GrowthStage | null;
        member_id: string | null;
        is_active: boolean;
      }
    | null;

  /* No row, or a login somebody switched off. Both are a closed door, and
     the second is the one that matters: turning somebody off in the
     console has to end their Claude access without anybody remembering
     this table exists. */
  if (userRes.error || !record || !record.is_active) {
    forgetSession(hash);
    return { failure: "inactive" };
  }

  let accessToken = cachedSession(hash);
  if (!accessToken) {
    accessToken = await sessionFor(service, record.email);
    if (!accessToken) return { failure: "session_failed" };
    sessions.set(hash, { accessToken, expiresAt: Date.now() + SESSION_TTL_MS });
  }

  const supabase = userClient(accessToken);
  if (!supabase) return { failure: "not_configured" };

  /* Recorded, not awaited. A failed timestamp must not fail a request,
     and this is the only write the transport itself makes. */
  void service
    .from("mcp_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", row.id)
    .then(undefined, () => undefined);

  const user: ConsoleUser = {
    userId: record.user_id,
    email: record.email,
    fullName: record.full_name,
    role: record.role,
    growthStage: record.growth_stage,
    memberId: record.member_id,
    isActive: record.is_active,
  };

  return { identity: { user, supabase, tokenId: row.id } };
}

/** What a refusal says out loud. Never which of the two it was. */
export function failureMessage(failure: McpAuthFailure): string {
  switch (failure) {
    case "no_token":
    case "malformed":
      return "This server needs a token. Add it as an Authorization: Bearer header, or create one at /admin/dashboard/team.";
    case "not_configured":
      return "This server is not configured yet. Tell whoever runs it that the Supabase keys are missing.";
    case "session_failed":
      return "Your token is valid but a session could not be opened. Try again in a moment.";
    default:
      /* Unknown, revoked, expired and deactivated all read the same on
         purpose. Telling somebody holding a wrong token that it merely
         expired tells them a real one existed. */
      return "That token is not valid. Create a new one at /admin/dashboard/team.";
  }
}
