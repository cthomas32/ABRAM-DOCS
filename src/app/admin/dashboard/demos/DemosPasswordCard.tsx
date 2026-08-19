"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, Loader2 } from "lucide-react";
import { setDemosPassword } from "./actions";

/**
 * The password on the public demo library, on the screen that manages it.
 *
 * The current word is never sent here. What arrives is how long it is and
 * where it came from, which is enough to draw a mask and enough to answer
 * the two questions somebody opens this card with: is one set, and is it
 * the one I think it is. Reading it back would mean putting it in the
 * page's HTML, and the whole point of the gate is that it never is.
 */

export type PasswordSource = "saved" | "environment" | "default";

const WHERE: Record<PasswordSource, string> = {
  saved: "Saved here.",
  environment: "Coming from the environment, because nothing is saved here yet.",
  default: "The built-in default, because nothing is saved here and nothing is set in the environment.",
};

export default function DemosPasswordCard({
  length,
  source,
  mayWrite,
}: {
  length: number;
  source: PasswordSource;
  mayWrite: boolean;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const save = useCallback(async () => {
    setSaving(true);
    setError(null);

    const result = await setDemosPassword(draft);

    setSaving(false);
    if (!result.ok) {
      setError(result.error ?? "That did not save.");
      return;
    }

    setDraft("");
    setSaved(true);
    setTimeout(() => setSaved(false), 4000);
    router.refresh();
  }, [draft, router]);

  return (
    <section className="rounded-2xl border border-white/8 bg-white/[0.01] p-3.5">
      <h3 className="text-xs font-semibold text-white">Demo page password</h3>
      <p className="mt-0.5 text-[10px] leading-relaxed text-zinc-500">
        One shared word opens /demos. {WHERE[source]}
      </p>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <span className="inline-flex h-8 shrink-0 items-center rounded-lg border border-white/8 bg-white/[0.02] px-3 font-mono text-xs tracking-[0.2em] text-zinc-400">
          {"•".repeat(Math.min(length, 24))}
        </span>
        <span className="text-[10px] text-zinc-600 sm:shrink-0">
          {length} characters
        </span>

        {mayWrite && (
          <>
            <input
              className="admin-input sm:ml-2 sm:max-w-xs"
              placeholder="New password"
              autoComplete="off"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              disabled={saving}
            />
            <button
              type="button"
              className="btn-glass shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
              disabled={saving || draft.trim().length === 0}
              onClick={() => void save()}
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save
            </button>
          </>
        )}
      </div>

      {mayWrite && (
        <p className="mt-2 text-[10px] leading-relaxed text-zinc-600">
          Changing it signs out everybody who is already in, so the old word stops working
          everywhere it was passed on. Six characters or more, no spaces.
        </p>
      )}

      {error && (
        <p className="mt-2 text-[11px] leading-relaxed text-zinc-300">{error}</p>
      )}

      <div className="pointer-events-none fixed bottom-4 right-4 left-4 z-50 flex flex-col gap-3 sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-sm">
        <AnimatePresence>
          {saved && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="glass-panel pointer-events-auto flex w-full items-start gap-3 rounded-xl border p-4 shadow-2xl"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-500/10 bg-emerald-500/10 text-emerald-400">
                <CheckCircle className="h-3 w-3" />
              </span>
              <p className="text-xs leading-relaxed text-zinc-300">
                Password saved. Everybody who was already in has to enter the new one.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
