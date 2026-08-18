"use client";

import { useState, useTransition } from "react";
import { AlertCircle, CheckCircle, Loader2, Plus } from "lucide-react";
import { fileRegistration } from "./actions";
import { FieldLabel } from "@/components/admin/Overline";
import Panel from "@/components/admin/Panel";

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
        <button onClick={() => setOpen(true)} className="btn-primary rounded-full text-xs font-medium px-4 inline-flex items-center gap-1.5 h-11 sm:h-9">
          <Plus className="w-3.5 h-3.5" />
          Register an account
        </button>

        {done && (
          <Panel tone="reached" icon={<CheckCircle className="w-4 h-4 text-emerald-400" />}>
            Filed. It stands unless it is declined within five business days.
          </Panel>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:p-5 space-y-4">
      <div>
        <FieldLabel htmlFor="reg-name">Company name</FieldLabel>
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
        <FieldLabel htmlFor="reg-domain">Web address</FieldLabel>
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
        <FieldLabel htmlFor="reg-why" hint="(optional)">Why this one</FieldLabel>
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

      {/* Neutral, not red. A refused filing is an ordinary answer, usually
          "somebody registered this account already", and dressing it as an
          alarm makes every one of them look like something broke. */}
      {error && (
        <Panel icon={<AlertCircle className="w-4 h-4 text-zinc-400" />}>{error}</Panel>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <button type="submit" disabled={pending} className="btn-primary rounded-full text-xs font-medium px-4 inline-flex items-center gap-1.5 h-11 sm:h-9 disabled:opacity-60">
          {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          File registration
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError("");
          }}
          className="btn-ghost rounded-full text-xs font-medium px-4 h-11 sm:h-9"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
