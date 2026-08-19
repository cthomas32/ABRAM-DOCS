"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, KeyRound, Loader2, Plus } from "lucide-react";
import Overline, { FieldLabel } from "@/components/admin/Overline";
import Panel, { EmptyPanel } from "@/components/admin/Panel";
import { relativeTime } from "@/lib/crm/console";
import { createMcpToken, revokeMcpToken } from "./mcpActions";

export interface McpTokenRow {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
  last_used_at: string | null;
  expires_at: string;
  revoked_at: string | null;
}

/**
 * The list of keys, and the one moment a key is visible.
 *
 * The new token is held in component state and drawn in a panel that says
 * so. There is no second chance by design: the database has a hash of it
 * and this application cannot reproduce the original, which is the
 * property that makes a stolen backup useless. The panel says that out
 * loud rather than making somebody discover it.
 *
 * A revoked or expired token stays in the list, greyed. A key that
 * existed is worth being able to see, and "when did I stop using that
 * laptop" is a question this list can answer.
 */
export default function McpTokens({ tokens }: { tokens: McpTokenRow[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [fresh, setFresh] = useState<{ token: string; expiresOn?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    setError(null);

    const outcome = await createMcpToken({ name });
    setCreating(false);

    if (!outcome.ok || !outcome.token) {
      setError(outcome.error ?? "That did not save.");
      return;
    }

    setFresh({ token: outcome.token, expiresOn: outcome.expiresOn });
    setName("");
    setCopied(false);
    startTransition(() => router.refresh());
  }

  async function revoke(id: string) {
    setBusyId(id);
    const outcome = await revokeMcpToken(id);
    setBusyId(null);
    if (!outcome.ok) setError(outcome.error ?? null);
    else startTransition(() => router.refresh());
  }

  async function copy() {
    if (!fresh) return;
    try {
      await navigator.clipboard.writeText(fresh.token);
      setCopied(true);
    } catch {
      /* A browser that refuses the clipboard is not an error worth
         reporting: the token is on screen and selectable. */
    }
  }

  const now = Date.now();

  return (
    <div className="space-y-6">
      {fresh && (
        <Panel tone="attention" title="Copy this now">
          <p className="mb-3">
            This is the only time it is shown. The database holds a hash of it and nothing here can
            produce it again, which is what makes a stolen backup useless. If you lose it, make
            another.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <code className="font-mono text-[11px] px-2.5 py-2 rounded-lg bg-black/40 border border-white/8 text-zinc-200 break-all min-w-0 flex-1">
              {fresh.token}
            </code>
            <button
              type="button"
              onClick={() => void copy()}
              className="btn-glass min-h-[44px] sm:min-h-[36px] px-4 text-xs rounded-full inline-flex items-center gap-1.5 shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          {fresh.expiresOn && <p className="mt-3">It stops working on {fresh.expiresOn}.</p>}
        </Panel>
      )}

      <form onSubmit={create} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-2.5">
        <FieldLabel htmlFor="mcp-name">Name a new token</FieldLabel>
        <div className="flex flex-wrap gap-2">
          <input
            id="mcp-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="The work laptop"
            className="admin-input h-11 sm:h-9 py-0"
          />
          <button
            type="submit"
            disabled={creating || !name.trim()}
            className="btn-primary min-h-[44px] sm:min-h-[36px] px-4 text-xs rounded-full inline-flex items-center gap-1.5 shrink-0 disabled:opacity-50"
          >
            {creating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            Create
          </button>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Name it after the machine or the place you will use it, so revoking the right one later is
          obvious. It lasts 180 days.
        </p>
        {error && <p className="text-[11px] text-amber-300 leading-relaxed">{error}</p>}
      </form>

      <section aria-label="Your tokens" className="space-y-2.5">
        <Overline as="h2">Your tokens</Overline>
        {tokens.length === 0 ? (
          <EmptyPanel title="No tokens yet" icon={<KeyRound className="w-6 h-6" />}>
            Make one above to connect Claude.
          </EmptyPanel>
        ) : (
          <ul className="rounded-2xl border border-white/5 bg-white/[0.02] divide-y divide-white/5">
            {tokens.map((token) => {
              const expired = new Date(token.expires_at).getTime() <= now;
              const dead = Boolean(token.revoked_at) || expired;

              return (
                <li
                  key={token.id}
                  className={`flex items-start gap-3 px-4 py-3 ${dead ? "opacity-60" : ""}`}
                >
                  <span className="shrink-0 mt-0.5 w-7 h-7 rounded-lg bg-white/[0.03] border border-white/8 flex items-center justify-center text-zinc-400">
                    <KeyRound className="w-3.5 h-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2 flex-wrap">
                      <span className={`text-xs break-words ${dead ? "text-zinc-400" : "text-white"}`}>
                        {token.name}
                      </span>
                      <span className="font-mono text-[10px] text-zinc-500">
                        abram_mcp_{token.prefix}…
                      </span>
                    </span>
                    <span className="block text-[11px] text-zinc-400 leading-relaxed mt-0.5">
                      {token.revoked_at
                        ? `Revoked ${relativeTime(token.revoked_at)}`
                        : expired
                          ? `Expired ${token.expires_at.slice(0, 10)}`
                          : token.last_used_at
                            ? `Last used ${relativeTime(token.last_used_at)} · expires ${token.expires_at.slice(0, 10)}`
                            : `Never used · expires ${token.expires_at.slice(0, 10)}`}
                    </span>
                  </span>
                  {!dead && (
                    <button
                      type="button"
                      disabled={busyId === token.id}
                      onClick={() => void revoke(token.id)}
                      className="btn-ghost min-h-[44px] sm:min-h-[36px] px-3 text-[11px] rounded-full shrink-0 disabled:opacity-50"
                    >
                      {busyId === token.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        "Revoke"
                      )}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
