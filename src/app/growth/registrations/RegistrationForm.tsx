"use client";

import { useState, useTransition } from "react";
import { AlertCircle, CheckCircle, Loader2, Plus } from "lucide-react";
import { fileRegistration } from "./actions";

/**
 * Filing a claim.
 *
 * Collapsed by default. This is a thing somebody does occasionally, and a
 * permanently open form pushes the list of what has already been filed —
 * which is the reason most visits happen — below the fold.
 */
export default function RegistrationForm() {
  const [open, setOpen] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [accountDomain, setAccountDomain] = useState("");
  const [rationale, setRationale] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setDone(false);

    startTransition(async () => {
      const result = await fileRegistration({ accountName, accountDomain, rationale });
      if (result.ok) {
        setDone(true);
        setAccountName("");
        setAccountDomain("");
        setRationale("");
        setOpen(false);
      } else {
        setError(result.error || "Something went wrong.");
      }
    });
  };

  if (!open) {
    return (
      <div className="space-y-3">
        <button onClick={() => setOpen(true)} className="btn-primary rounded-full text-xs px-4 py-2.5 inline-flex items-center gap-1.5 min-h-11">
          <Plus className="w-3.5 h-3.5" />
          Register an account
        </button>

        {done && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 flex gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-emerald-200 leading-relaxed">
              Filed. It stands unless it is declined within five business days.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:p-5 space-y-4">
      <div>
        <label htmlFor="reg-name" className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500 block mb-1.5">
          Company name
        </label>
        <input
          id="reg-name"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          required
          maxLength={200}
          placeholder="Helix Studios"
          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/25"
        />
      </div>

      <div>
        <label htmlFor="reg-domain" className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500 block mb-1.5">
          Web address
        </label>
        <input
          id="reg-domain"
          value={accountDomain}
          onChange={(e) => setAccountDomain(e.target.value)}
          required
          maxLength={200}
          placeholder="helix.com"
          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/25"
        />
        <p className="text-[10px] text-zinc-600 mt-1.5 leading-relaxed">
          Company names get typed three different ways. The web address is what stops two people
          claiming the same account without noticing.
        </p>
      </div>

      <div>
        <label htmlFor="reg-why" className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500 block mb-1.5">
          Why this one <span className="text-zinc-600 normal-case tracking-normal">(optional)</span>
        </label>
        <textarea
          id="reg-why"
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="Where the introduction is coming from, and roughly what you expect."
          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/25 resize-y"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 flex gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-rose-200 leading-relaxed">{error}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <button type="submit" disabled={pending} className="btn-primary rounded-full text-xs px-4 py-2.5 inline-flex items-center gap-1.5 min-h-11 disabled:opacity-60">
          {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          File registration
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError("");
          }}
          className="btn-ghost rounded-full text-xs px-4 py-2.5 min-h-11"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
