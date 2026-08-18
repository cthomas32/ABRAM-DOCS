"use client";

import { useState, useTransition } from "react";
import { RotateCw } from "lucide-react";
import { replaySyncEvent } from "./syncActions";

/**
 * The last few things abram-network told us, and a way to try one again.
 *
 * Deliberately small. This is not a log viewer — it answers one question,
 * "did the money get here", and gives one action for when it did not.
 * Anything more belongs in the collections list, which is the next thing
 * to be built on this page.
 *
 * The replay button is per-event and never bulk: a replay is something a
 * person does after fixing the reason the event went wrong, and a button
 * that replays fifty of them is a button that gets pressed before the
 * fixing.
 */

export interface SyncEventView {
  eventId: string;
  eventType: string;
  syncType: string;
  status: string;
  note: string | null;
  receivedAt: string;
  amountCents: number | null;
  currency: string;
  who: string | null;
  replayCount: number;
}

const STATUS_LABEL: Record<string, string> = {
  applied: "Applied",
  needs_review: "Needs review",
  ignored: "Nothing to do",
  failed: "Failed",
};

function when(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function money(cents: number | null, currency: string): string {
  if (cents === null) return "";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD" }).format(cents / 100);
}

export default function SyncPanel({ events }: { events: SyncEventView[] }) {
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function replay(eventId: string) {
    setBusyId(eventId);
    setMessage(null);
    startTransition(async () => {
      const result = await replaySyncEvent(eventId);
      setBusyId(null);
      setMessage(result.ok ? (result.note ?? "Replayed.") : (result.error ?? "That did not work."));
    });
  }

  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-6">
        <p className="text-sm text-zinc-300">Nothing has come across yet.</p>
        <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
          Payments appear here within five minutes of landing in Stripe. If a payment has been taken
          and nothing shows, the secret or the URL is unset on one side — see
          docs/plans/collections-sync.md.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {message && (
        <p className="text-[11px] text-zinc-400 leading-relaxed px-1">{message}</p>
      )}

      {events.map((event) => (
        <div
          key={event.eventId}
          className="rounded-lg border border-white/10 bg-white/[0.02] p-3 flex gap-3 items-start"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-xs font-semibold text-white">
                {STATUS_LABEL[event.status] ?? event.status}
              </span>
              <span className="text-[11px] text-zinc-500">{event.syncType}</span>
              {event.amountCents !== null && (
                <span className="text-[11px] text-zinc-400 tabular-nums">
                  {money(event.amountCents, event.currency)}
                </span>
              )}
              {event.who && <span className="text-[11px] text-zinc-400 truncate">{event.who}</span>}
              <span className="text-[11px] text-zinc-600">{when(event.receivedAt)}</span>
              {event.replayCount > 0 && (
                <span className="text-[11px] text-zinc-600">replayed ×{event.replayCount}</span>
              )}
            </div>
            {event.note && (
              <p className="text-[11px] text-zinc-500 leading-relaxed mt-1">{event.note}</p>
            )}
            <p className="text-[10px] text-zinc-700 mt-1 font-mono truncate">{event.eventId}</p>
          </div>

          <button
            type="button"
            onClick={() => replay(event.eventId)}
            disabled={pending && busyId === event.eventId}
            className="shrink-0 h-8 px-2.5 text-[11px] font-medium rounded-lg border border-white/10 text-zinc-300 hover:bg-white/[0.04] transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <RotateCw className={`w-3 h-3 ${pending && busyId === event.eventId ? "animate-spin" : ""}`} />
            Replay
          </button>
        </div>
      ))}
    </div>
  );
}
