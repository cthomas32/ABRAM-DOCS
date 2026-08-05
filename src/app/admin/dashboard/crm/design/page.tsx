"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { cardUrl } from "@/lib/crm/constants";
import type { QrDesignSpec } from "@/lib/crm/qrDesign";
import type { CrmCaptureCode, CrmProfile } from "@/lib/crm/types";
import QrDesigner from "../QrDesigner";
import { designFor } from "../codeDesign";
import type { Notify } from "../lib";

/**
 * Designing a code.
 *
 * A page rather than a dialog, for the same reason the print sheet is one:
 * it takes a code in the address, so it can be opened from anywhere,
 * reloaded, kept in a second tab beside the Codes list, and linked to. The
 * designer was a full screen overlay first, which is a workspace wearing a
 * dialog's clothes, with seven sizes and a photo library inside a box that
 * had to scroll within a box that already scrolled.
 *
 * `?k=<code>` names the printed thing being designed, matching
 * `print?k=<code>`, and `?from=` remembers which tab sent you so the way
 * back lands where you left.
 *
 * Read on the client the same way the print sheet reads, so the signed in
 * session doing the reading is the one already in the browser.
 */

/** Where the back link goes, given the tab that opened this. */
const ORIGINS: Record<string, { href: string; label: string }> = {
  codes: { href: "/admin/dashboard/crm?tab=codes", label: "Codes" },
  card: { href: "/admin/dashboard/crm?tab=card", label: "Your card" },
};

const FALLBACK_ORIGIN = { href: "/admin/dashboard/crm", label: "Contacts" };

interface Toast {
  id: string;
  message: string;
  tone: "success" | "error";
}

export default function QrDesignPage() {
  const [code, setCode] = useState<CrmCaptureCode | null>(null);
  const [profile, setProfile] = useState<CrmProfile | null>(null);
  const [saved, setSaved] = useState<QrDesignSpec | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState(FALLBACK_ORIGIN);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback<Notify>((message, tone) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("k");
    setOrigin(ORIGINS[params.get("from") ?? ""] ?? FALLBACK_ORIGIN);

    if (!token) {
      setError("No code was named in the address.");
      setLoading(false);
      return;
    }

    void (async () => {
      const supabase = createClient();
      const { data, error: readError } = await supabase
        .from("crm_capture_codes")
        .select("*")
        .eq("code", token)
        .limit(1);

      const found = (data as CrmCaptureCode[] | null)?.[0];
      if (readError || !found) {
        setError(readError?.message || "That code is not in the list any more.");
        setLoading(false);
        return;
      }

      const profileRes = await supabase
        .from("crm_profiles")
        .select("*")
        .eq("id", found.profile_id)
        .limit(1);
      const owner = (profileRes.data as CrmProfile[] | null)?.[0] ?? null;

      if (!owner) {
        setError("That code points at a card that is no longer there.");
        setLoading(false);
        return;
      }

      setCode(found);
      setProfile(owner);
      setSaved(designFor(found, owner));
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-2 text-zinc-500">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
        <span className="text-xs font-medium">Opening the designer...</span>
      </div>
    );
  }

  if (error || !code || !profile || !saved) {
    return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-md mx-auto text-center pt-16">
          <h1 className="text-sm font-semibold text-white">Nothing to design</h1>
          <p className="text-xs text-zinc-500 leading-relaxed mt-2">
            {error ?? "That code could not be matched to a card."}
          </p>
          <Link
            href={FALLBACK_ORIGIN.href}
            className="btn-glass px-5 min-h-[44px] text-xs rounded-full mt-5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to contacts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-5">
        <div>
          <Link
            href={origin.href}
            className="inline-flex min-h-[44px] items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors -ml-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {origin.label}
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-white font-sans mt-2 break-words">
            Design this code
          </h1>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed break-words">
            {code.label}. Saving keeps the design against this code, so it opens the same way next
            time. Downloading is what makes a file.
          </p>
          <p className="text-[10px] font-mono text-zinc-600 mt-1.5 break-all">
            {cardUrl(profile.slug, code.code)}
          </p>
        </div>

        <QrDesigner
          code={code}
          profile={profile}
          url={cardUrl(profile.slug, code.code)}
          saved={saved}
          onSaved={setSaved}
          notify={notify}
        />
      </div>

      {/* Toasts */}
      <div className="fixed bottom-5 right-5 z-[70] flex flex-col gap-2 max-w-[calc(100vw-2.5rem)] sm:max-w-sm">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className={`glass-panel rounded-xl px-4 py-3 flex items-start gap-3 border ${
                toast.tone === "error" ? "border-red-500/30" : "border-white/10"
              }`}
            >
              <p className="text-xs text-zinc-200 leading-relaxed flex-1">{toast.message}</p>
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                aria-label="Dismiss"
                className="text-zinc-500 hover:text-zinc-200 transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
