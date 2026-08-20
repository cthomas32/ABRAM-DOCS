import { createClient } from "@/utils/supabase/server";
import { getConsoleUser } from "@/lib/auth/consoleUser";
import { rows } from "@/lib/supabase/rows";
import Overline from "@/components/admin/Overline";
import Panel from "@/components/admin/Panel";
import McpTokens, { type McpTokenRow } from "./McpTokens";

/**
 * Connecting Claude to the CRM.
 *
 * One screen, and most of it is the explanation rather than the control,
 * because the thing somebody needs here is not a button. It is the URL,
 * the header, and the confidence that handing a chat window a key to the
 * customer database is a bounded act.
 *
 * The bound is worth stating plainly on the page itself: the token names
 * a person and grants nothing. Everything the connection can read is
 * decided by the same database rules that decide what that person sees in
 * the console, so a growth advisor connecting Claude gets their own
 * accounts and no more, and there is no configuration anywhere that can
 * widen it without widening their console access too.
 *
 * **Two ways in, listed in the order they should be tried.** Signing in
 * is the one to reach for: the connector dialog on claude.ai has a URL
 * box and no header box, so a token is not merely inconvenient there, it
 * is impossible. Tokens stay because a client that does let you set a
 * header -- Claude Code, a script, anything talking to the endpoint
 * directly -- has no browser to send anybody to.
 */

export const dynamic = "force-dynamic";

export default async function McpPanel() {
  const user = await getConsoleUser();
  if (!user) return null;

  const supabase = await createClient();

  const result = await supabase
    .from("mcp_tokens")
    .select("id, name, prefix, created_at, last_used_at, expires_at, revoked_at, user_id")
    .eq("user_id", user.userId)
    .order("created_at", { ascending: false })
    .limit(50);

  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://abram.network";

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Claude access</h1>
        <p className="text-sm text-zinc-400 mt-2 leading-relaxed max-w-2xl">
          Ask Claude about the CRM in words, from wherever you already use it. It answers with what
          your own login can read and nothing else, because it queries the database as you.
        </p>
      </header>

      <section aria-label="How to connect" className="space-y-3 mb-10">
        <Overline as="h2">Connecting</Overline>
        <ol className="rounded-2xl border border-white/5 bg-white/[0.02] divide-y divide-white/5 text-xs text-zinc-300">
          <li className="px-4 py-3">
            <span className="text-white">1.</span> In Claude, add a custom connector at{" "}
            <code className="font-mono text-[11px] px-1 py-0.5 rounded bg-white/[0.06] text-zinc-200 break-all">
              {base}/api/mcp
            </code>
          </li>
          <li className="px-4 py-3">
            <span className="text-white">2.</span> Leave the client ID and secret boxes empty.
            Claude fills those in for itself, and anything typed there stops the sign-in working.
          </li>
          <li className="px-4 py-3">
            <span className="text-white">3.</span> Click connect. It sends you here to sign in and
            asks you to allow it. No token to copy, and nothing to paste.
          </li>
          <li className="px-4 py-3">
            <span className="text-white">4.</span> Ask it something. &quot;Who did I meet at the
            Northern Screen Summit that I have not followed up?&quot; is a fair first test.
          </li>
        </ol>
      </section>

      <section aria-label="Connecting with a token" className="space-y-3 mb-10">
        <Overline as="h2">Or with a token</Overline>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-2.5 text-[11px] text-zinc-400 leading-relaxed">
          <p>
            For a client that lets you set headers, and for anything talking to the endpoint
            directly. Make a token below, copy it once, and send it as{" "}
            <code className="font-mono text-[10px] px-1 py-0.5 rounded bg-white/[0.06] text-zinc-200 break-all">
              Authorization: Bearer &lt;your token&gt;
            </code>
          </p>
          <p>
            In Claude Code that is one line:{" "}
            <code className="font-mono text-[10px] px-1 py-0.5 rounded bg-white/[0.06] text-zinc-200 break-all">
              claude mcp add --transport http abram {base}/api/mcp --header &quot;Authorization:
              Bearer &lt;your token&gt;&quot;
            </code>
          </p>
          <p className="text-zinc-300">
            Both routes end at the same place. Signing in makes one of these tokens for you and
            names it after the app, so everything you connect shows up in the same list below.
          </p>
        </div>
      </section>

      <section aria-label="What it can do" className="space-y-3 mb-10">
        <Overline as="h2">What it can and cannot do</Overline>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-2.5 text-[11px] text-zinc-400 leading-relaxed">
          <p>
            It reads people, companies, deals, what has been logged, and the brain. It can write a
            note, add a follow up, and move a deal between the open stages.
          </p>
          <p>
            It cannot close a deal won or lost. That locks the attribution rule and starts a
            commission clock, so it stays in the console where it asks for a date and warns you it
            cannot be undone.
          </p>
          <p>
            It cannot delete or archive anything. Nothing on this console deletes, and archiving is
            not exposed to a conversation.
          </p>
          <p className="text-zinc-300">
            Every write is recorded against your name, so the timeline shows who did it.
          </p>
        </div>
      </section>

      {result.error ? (
        <Panel tone="attention">
          Your tokens could not be read. If this is a fresh database, the migration that creates them
          has not run yet.
        </Panel>
      ) : (
        <McpTokens tokens={rows<McpTokenRow>(result)} />
      )}
    </div>
  );
}
