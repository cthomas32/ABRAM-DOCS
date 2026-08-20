import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck, Lock } from "lucide-react";
import { getConsoleUser } from "@/lib/auth/consoleUser";
import { ROLE_LABELS, can } from "@/lib/auth/permissions";
import { visibleTools } from "@/lib/mcp/tools";
import {
  MCP_PATH,
  errorRedirect,
  oauthService,
  readAuthorizeParams,
  redirectIsRegistered,
  resourceMatches,
} from "@/lib/mcp/oauth";
import { issuerOrigin } from "@/lib/mcp/origin";
import ConsentForm from "./ConsentForm";

/**
 * The page that used to be a 404.
 *
 * Adding this server to claude.ai sent somebody here, because a client
 * given a bare `Bearer` challenge and no discovery document guesses the
 * endpoint names at the origin. The guess was right about the address and
 * this is what should have been at it.
 *
 * **The order of the checks is the security property.** Everything that
 * decides where a code may be sent is settled before anything is told to
 * the person, and refusals split in two:
 *
 *   - An unknown client, or a return address it never registered, gets a
 *     message on this page and no redirect. There is nowhere trustworthy
 *     to send it, and redirecting to an unverified address is how an
 *     authorization server becomes somebody's open redirector.
 *   - A registered client sending a malformed request gets redirected
 *     back with an error, because it can be trusted with the answer and
 *     the alternative is a client waiting forever for a callback.
 *
 * The identity comes from the session cookie and never from the query
 * string. `client_id=Connor` in a URL names a client, not a person, and
 * nothing here reads a person's name from anywhere a caller controls.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Connect an app · ABRAM",
  description: "Authorize an application to read the ABRAM CRM as you.",
  /* Not in the sitemap and not indexable. It is a step in a flow, and a
     search result landing on it is somebody arriving mid-sentence. */
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** The one shape a refusal takes when there is nowhere safe to redirect. */
function Refusal({ title, detail }: { title: string; detail: string }) {
  return (
    <Shell>
      <div className="flex items-start gap-3 mb-4">
        <Lock className="h-4 w-4 text-amber-300/80 mt-0.5 shrink-0" aria-hidden="true" />
        <h1 className="text-lg font-semibold tracking-tight text-white">{title}</h1>
      </div>
      <p className="text-xs text-zinc-400 leading-relaxed">{detail}</p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0A0A0A] px-4 py-10 font-sans">
      <div className="w-full max-w-md rounded-2xl border border-white/5 glass-panel p-6 sm:p-8">
        {children}
      </div>
    </main>
  );
}

export default async function AuthorizePage({ searchParams }: PageProps) {
  const params = readAuthorizeParams(await searchParams);
  const origin = await issuerOrigin();

  const service = oauthService();
  if (!service) {
    return (
      <Refusal
        title="Not ready yet"
        detail="This server cannot complete a connection because it has no database credentials. Tell whoever runs it."
      />
    );
  }

  if (!params.clientId) {
    return (
      <Refusal
        title="Nothing to connect"
        detail="This page is the last step of connecting an app, and it was opened without one. Start from the app you are trying to connect."
      />
    );
  }

  const clientRow = await service
    .from("oauth_clients")
    .select("client_id, client_name, redirect_uris")
    .eq("client_id", params.clientId)
    .maybeSingle();

  const client = clientRow.data as
    | { client_id: string; client_name: string; redirect_uris: string[] }
    | null;

  if (clientRow.error || !client) {
    return (
      <Refusal
        title="That app is not registered"
        detail="No application with that identifier has introduced itself to this server. If you typed anything into a client ID box by hand, clear it: the app fills that in for itself."
      />
    );
  }

  /* Exact match, whole string. This is the check that decides where an
     authorization code is permitted to land, and everything after it is
     allowed to redirect because of it. */
  if (!params.redirectUri || !redirectIsRegistered(client.redirect_uris, params.redirectUri)) {
    return (
      <Refusal
        title="That return address is not registered"
        detail="The app asked to be sent back to an address it did not register with this server, so nothing was connected and nothing was sent anywhere."
      />
    );
  }

  /* Past here the return address is trusted, so a bad request is answered
     to the client rather than to the person reading this page. */

  if (params.responseType !== "code") {
    redirect(
      errorRedirect(
        params.redirectUri,
        "unsupported_response_type",
        "This server issues authorization codes only.",
        params.state
      )
    );
  }

  if (!params.codeChallenge) {
    redirect(
      errorRedirect(
        params.redirectUri,
        "invalid_request",
        "A PKCE code_challenge is required.",
        params.state
      )
    );
  }

  if (params.codeChallengeMethod !== "S256") {
    redirect(
      errorRedirect(
        params.redirectUri,
        "invalid_request",
        "Only the S256 code challenge method is accepted.",
        params.state
      )
    );
  }

  if (!resourceMatches(params.resource, origin)) {
    redirect(
      errorRedirect(
        params.redirectUri,
        "invalid_target",
        `This server issues tokens for ${origin}${MCP_PATH} only.`,
        params.state
      )
    );
  }

  const user = await getConsoleUser();

  if (!user) {
    /* Back here afterwards, with the whole request intact. A relative
       path, so the sign-in page cannot be turned into a redirector to
       somewhere else by whoever composed this URL. */
    const query = new URLSearchParams();
    query.set("response_type", params.responseType);
    query.set("client_id", params.clientId);
    query.set("redirect_uri", params.redirectUri);
    query.set("code_challenge", params.codeChallenge);
    query.set("code_challenge_method", params.codeChallengeMethod);
    if (params.state) query.set("state", params.state);
    if (params.scope) query.set("scope", params.scope);
    if (params.resource) query.set("resource", params.resource);

    redirect(`/admin?next=${encodeURIComponent(`/authorize?${query.toString()}`)}`);
  }

  if (!user.isActive || !can(user, "console.admin")) {
    return (
      <Refusal
        title="Your login cannot reach the console"
        detail="You are signed in, but this account has no console access, so there is nothing here to connect it to. Ask an owner to grant it."
      />
    );
  }

  const tools = visibleTools(user);

  return (
    <Shell>
      <div className="flex items-start gap-3 mb-5">
        <ShieldCheck className="h-4 w-4 text-white/70 mt-0.5 shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-white break-words">
            {/* Rendered as text. This is a name a stranger chose at
                registration, so it is shown and never interpreted. */}
            Connect {client.client_name} to the ABRAM CRM?
          </h1>
          <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
            It will read and write as you, and see exactly what you see.
          </p>
        </div>
      </div>

      <dl className="rounded-xl border border-white/5 bg-white/[0.02] divide-y divide-white/5 mb-5 text-xs">
        <div className="px-3.5 py-2.5 flex items-baseline justify-between gap-3">
          <dt className="text-zinc-500">Signing in as</dt>
          <dd className="text-zinc-200 text-right break-words min-w-0">
            {user.fullName || user.email}
          </dd>
        </div>
        <div className="px-3.5 py-2.5 flex items-baseline justify-between gap-3">
          <dt className="text-zinc-500">Access level</dt>
          <dd className="text-zinc-200 text-right">{ROLE_LABELS[user.role]}</dd>
        </div>
        <div className="px-3.5 py-2.5 flex items-baseline justify-between gap-3">
          <dt className="text-zinc-500">Tools it gets</dt>
          <dd className="text-zinc-200 text-right">{tools.length}</dd>
        </div>
        <div className="px-3.5 py-2.5 flex items-baseline justify-between gap-3">
          <dt className="text-zinc-500">Returns to</dt>
          <dd className="text-zinc-400 text-right font-mono text-[10px] break-all min-w-0">
            {new URL(params.redirectUri).host}
          </dd>
        </div>
      </dl>

      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5 mb-5 space-y-2 text-[11px] text-zinc-400 leading-relaxed">
        <p>
          It can read people, companies, deals, what has been logged, and the brain. It can write a
          note, add a follow up, and move a deal between the open stages.
        </p>
        <p>
          It cannot close a deal won or lost, and it cannot delete or archive anything. Every write
          is recorded against your name.
        </p>
        <p className="text-zinc-300">
          Revoke this at any time from Team, Claude access. It expires on its own in 180 days.
        </p>
      </div>

      <ConsentForm
        clientId={client.client_id}
        clientName={client.client_name}
        redirectUri={params.redirectUri}
        codeChallenge={params.codeChallenge}
        state={params.state}
        resource={params.resource}
      />
    </Shell>
  );
}
