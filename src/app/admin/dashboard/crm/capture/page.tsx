"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, CloudUpload, Flame, Loader2, WifiOff } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { FIELD_LIMITS } from "@/lib/crm/constants";
import type { CapturePayload } from "@/lib/crm/types";
import {
  flush,
  newClientToken,
  onQueueChange,
  pendingCount,
  startAutoFlush,
  submitCapture,
} from "@/lib/crm/offlineQueue";

/**
 * Capture mode.
 *
 * The path for when the other person's phone has nothing: no signal, a dead
 * battery, or a hall where four thousand devices are fighting over one
 * access point. You hold your phone and they type, or you type for them.
 *
 * The whole screen is built around one number, which is how many seconds
 * pass between two people at a booth. So: nothing is fetched before the form
 * renders, saving does not wait for the network, and the fields are blank
 * again before the request has even left the device. A save that fails to
 * send is not a failure anybody has to deal with in the moment. It sits in
 * the outbox and goes out when there is signal, and the badge in the corner
 * is the only place that ever mentions it.
 */

/**
 * The card these captures belong to.
 *
 * Resolved in this order: the address bar, then the last one used on this
 * device, then a background read of the profile table. The constant is the
 * last resort so that a first run with no signal still queues rather than
 * refusing, and it is overwritten the moment any better answer arrives.
 */
const FALLBACK_PROFILE_SLUG = "connor";
const SLUG_CACHE_KEY = "abram-crm-capture-profile";
const CONTEXT_CACHE_KEY = "abram-crm-capture-context";

interface Draft {
  full_name: string;
  company: string;
  job_title: string;
  email: string;
  phone: string;
  linkedin_url: string;
  notes: string;
}

const BLANK: Draft = {
  full_name: "",
  company: "",
  job_title: "",
  email: "",
  phone: "",
  linkedin_url: "",
  notes: "",
};

interface LastSave {
  name: string;
  delivered: boolean;
}

export default function CapturePage() {
  const [draft, setDraft] = useState<Draft>(BLANK);
  /** Where you are standing. Kept between saves, because you have not moved. */
  const [metContext, setMetContext] = useState("");
  const [hot, setHot] = useState(false);

  const [slug, setSlug] = useState(FALLBACK_PROFILE_SLUG);
  const [queued, setQueued] = useState(0);
  const [online, setOnline] = useState(true);
  const [savedCount, setSavedCount] = useState(0);
  const [lastSave, setLastSave] = useState<LastSave | null>(null);
  const [syncing, setSyncing] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);

  /* ---------------------------------------------------------------- */
  /*  Wiring, none of which blocks the form                            */
  /* ---------------------------------------------------------------- */

  const readQueue = useCallback(() => {
    void pendingCount().then(setQueued);
  }, []);

  useEffect(() => {
    const stop = startAutoFlush();
    const unsubscribe = onQueueChange(readQueue);
    readQueue();
    return () => {
      stop();
      unsubscribe();
    };
  }, [readQueue]);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine !== false);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    // The address bar wins, then whatever this device used last.
    const fromUrl = new URLSearchParams(window.location.search).get("p");
    const cached = (() => {
      try {
        return localStorage.getItem(SLUG_CACHE_KEY);
      } catch {
        return null;
      }
    })();

    const resolved = fromUrl || cached;
    if (resolved) setSlug(resolved);

    try {
      const savedContext = localStorage.getItem(CONTEXT_CACHE_KEY);
      if (savedContext) setMetContext(savedContext);
    } catch {
      /* A blocked store only costs a retyped line. */
    }

    if (fromUrl) {
      try {
        localStorage.setItem(SLUG_CACHE_KEY, fromUrl);
      } catch {
        /* Nothing depends on this succeeding. */
      }
      return;
    }

    // Background only. If this never comes back, the form still works.
    void (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("crm_profiles")
          .select("slug")
          .order("created_at")
          .limit(1);
        const found = (data as { slug: string }[] | null)?.[0]?.slug;
        if (!found) return;
        setSlug(found);
        try {
          localStorage.setItem(SLUG_CACHE_KEY, found);
        } catch {
          /* Nothing depends on this succeeding. */
        }
      } catch {
        /* Offline is the expected case here, not an error worth showing. */
      }
    })();
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Saving                                                           */
  /* ---------------------------------------------------------------- */

  const save = () => {
    const name = draft.full_name.trim();
    if (!name) {
      nameRef.current?.focus();
      return;
    }

    const payload: CapturePayload = {
      client_token: newClientToken(),
      profile_slug: slug,
      full_name: name.slice(0, FIELD_LIMITS.full_name),
      email: draft.email.trim().slice(0, FIELD_LIMITS.email) || null,
      phone: draft.phone.trim().slice(0, FIELD_LIMITS.phone) || null,
      company: draft.company.trim().slice(0, FIELD_LIMITS.company) || null,
      job_title: draft.job_title.trim().slice(0, FIELD_LIMITS.job_title) || null,
      linkedin_url: draft.linkedin_url.trim().slice(0, FIELD_LIMITS.linkedin_url) || null,
      notes: draft.notes.trim().slice(0, FIELD_LIMITS.notes) || null,
      met_context: metContext.trim().slice(0, FIELD_LIMITS.met_context) || null,
      priority: hot ? "hot" : "normal",
      source: "capture_mode",
      captured_at: new Date().toISOString(),
      captured_offline: navigator.onLine === false,
    };

    // Reset first. The next person is already standing there, and whether
    // this reached the server is not their problem or yours.
    setDraft(BLANK);
    setHot(false);
    setSavedCount((n) => n + 1);
    setLastSave(null);
    nameRef.current?.focus();

    try {
      localStorage.setItem(CONTEXT_CACHE_KEY, metContext.trim());
    } catch {
      /* Nothing depends on this succeeding. */
    }

    void submitCapture(payload).then(
      (result) => setLastSave({ name, delivered: result.delivered }),
      () => setLastSave({ name, delivered: false })
    );
  };

  const syncNow = async () => {
    setSyncing(true);
    const result = await flush();
    setSyncing(false);
    readQueue();
    if (result.remaining > 0) {
      setLastSave(null);
    }
  };

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="flex-1 overflow-y-auto bg-[#0A0A0A]">
      <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4">
        {/* Chrome, kept to one row */}
        <div className="flex items-center gap-2">
          <Link
            href="/admin/dashboard/crm"
            className="w-11 h-11 -ml-2 flex items-center justify-center rounded-full text-zinc-400 hover:text-white transition-colors shrink-0"
            aria-label="Back to contacts"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-base font-bold tracking-tight text-white font-sans">Capture</h1>
          <span className="ml-auto flex items-center gap-2">
            {!online && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/10 border border-amber-500/25 text-amber-300">
                <WifiOff className="w-3 h-3" />
                No signal
              </span>
            )}
            <span className="text-[10px] text-zinc-600 font-mono">{savedCount} this session</span>
          </span>
        </div>

        {/* The outbox. Always present, so it never has to be explained. */}
        <div
          className={`rounded-xl border px-3 py-2.5 flex items-center gap-3 ${
            queued > 0 ? "border-amber-500/25 bg-amber-500/[0.05]" : "border-white/8 bg-white/[0.02]"
          }`}
        >
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold text-zinc-200">
              {queued === 0
                ? "Everything is synced"
                : `${queued} ${queued === 1 ? "capture" : "captures"} waiting to sync`}
            </span>
            <span className="block text-[10px] text-zinc-500 leading-relaxed mt-0.5">
              {queued === 0
                ? "Saves go out as you make them. Nothing is waiting."
                : "They are stored on this phone and go out on their own once there is signal."}
            </span>
          </span>
          <button
            type="button"
            onClick={() => void syncNow()}
            disabled={syncing || queued === 0}
            className="btn-glass px-3.5 min-h-[44px] text-[11px] font-semibold rounded-full shrink-0 disabled:opacity-40"
          >
            {syncing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CloudUpload className="w-3.5 h-3.5" />
            )}
            Sync now
          </button>
        </div>

        {/* Confirmation of the one before, which never stands in the way. */}
        <div className="min-h-[1.75rem]">
          {lastSave && (
            <p className="flex items-center gap-2 text-[11px] text-emerald-300">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span className="min-w-0 break-words">
                {lastSave.name} saved{lastSave.delivered ? "" : " and waiting to sync"}
              </span>
            </p>
          )}
        </div>

        {/* One field per row, every one of them thumb sized */}
        <div className="space-y-3">
          <BigField label="Name" required>
            <input
              ref={nameRef}
              value={draft.full_name}
              onChange={(e) => set({ full_name: e.target.value })}
              autoComplete="off"
              autoCapitalize="words"
              enterKeyHint="next"
              placeholder="Who you just met"
              className="admin-input h-14 py-0 text-base"
            />
          </BigField>

          <BigField label="Company">
            <input
              value={draft.company}
              onChange={(e) => set({ company: e.target.value })}
              autoComplete="off"
              autoCapitalize="words"
              className="admin-input h-14 py-0 text-base"
            />
          </BigField>

          <BigField label="Email">
            <input
              type="email"
              inputMode="email"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              value={draft.email}
              onChange={(e) => set({ email: e.target.value })}
              className="admin-input h-14 py-0 text-base"
            />
          </BigField>

          <BigField label="Phone">
            <input
              type="tel"
              inputMode="tel"
              autoComplete="off"
              value={draft.phone}
              onChange={(e) => set({ phone: e.target.value })}
              className="admin-input h-14 py-0 text-base"
            />
          </BigField>

          <BigField label="Job title">
            <input
              value={draft.job_title}
              onChange={(e) => set({ job_title: e.target.value })}
              autoComplete="off"
              className="admin-input h-14 py-0 text-base"
            />
          </BigField>

          <BigField label="LinkedIn">
            <input
              inputMode="url"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              value={draft.linkedin_url}
              onChange={(e) => set({ linkedin_url: e.target.value })}
              className="admin-input h-14 py-0 text-base"
            />
          </BigField>

          <BigField label="Where we met" hint="Kept for the next person, since you have not moved.">
            <input
              value={metContext}
              onChange={(e) => setMetContext(e.target.value)}
              autoComplete="off"
              placeholder="Stand 14, second morning"
              className="admin-input h-14 py-0 text-base"
            />
          </BigField>

          <BigField label="Notes">
            <textarea
              rows={3}
              value={draft.notes}
              onChange={(e) => set({ notes: e.target.value })}
              placeholder="What they actually said"
              className="admin-input text-base leading-relaxed resize-y"
            />
          </BigField>

          <button
            type="button"
            onClick={() => setHot((v) => !v)}
            aria-pressed={hot}
            className={`w-full min-h-[56px] rounded-xl border flex items-center gap-3 px-4 transition-colors ${
              hot
                ? "border-amber-500/30 bg-amber-500/[0.06] text-amber-100"
                : "border-white/8 bg-white/[0.02] text-zinc-400"
            }`}
          >
            <Flame className={`w-5 h-5 shrink-0 ${hot ? "text-amber-400" : "text-zinc-600"}`} />
            <span className="text-left min-w-0">
              <span className="block text-sm font-semibold">Hot lead</span>
              <span className="block text-[11px] leading-relaxed opacity-80">
                Follow up the same night rather than next week.
              </span>
            </span>
            <span
              className={`ml-auto w-5 h-5 rounded-full border shrink-0 flex items-center justify-center ${
                hot ? "bg-amber-400 border-amber-400" : "border-white/20"
              }`}
            >
              {hot && <Check className="w-3 h-3 text-black" />}
            </span>
          </button>
        </div>
      </div>

      {/* Save sits under the thumb and stays there */}
      <div className="sticky bottom-0 border-t border-white/8 bg-[#0A0A0A]/95 backdrop-blur-xl px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-lg mx-auto">
          <button
            type="button"
            onClick={save}
            disabled={!draft.full_name.trim()}
            className="btn-primary w-full min-h-[56px] text-sm rounded-full disabled:opacity-40"
          >
            Save and next
          </button>
        </div>
      </div>
    </div>
  );
}

function BigField({
  label,
  hint,
  required = false,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline gap-1.5 mb-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          {label}
        </span>
        {required && <span className="text-[10px] text-zinc-600">required</span>}
      </span>
      {children}
      {hint && <span className="block text-[10px] text-zinc-600 mt-1 leading-relaxed">{hint}</span>}
    </label>
  );
}
