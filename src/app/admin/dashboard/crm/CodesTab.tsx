"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  Download,
  Loader2,
  Palette,
  Plus,
  Printer,
  QrCode as QrIcon,
  X,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { CODE_PLACEMENTS, cardUrl, type CodePlacement } from "@/lib/crm/constants";
import type { CrmCaptureCode, CrmEvent, CrmProfile } from "@/lib/crm/types";
import QrCode, { qrPngBlob, qrSvgDocument } from "./QrCode";
import { downloadFile, formatDateTime, randomCode, ratePct, type Notify } from "./lib";

/**
 * The printed codes.
 *
 * One row per physical thing a code ends up on, which is the only way to
 * ever answer whether the badge sticker or the booth banner is what people
 * actually scan. Every square is drawn here in the browser from the same
 * encoder the rest of the site uses, so there is no image to keep in sync
 * and no service to be down on the morning of a show.
 *
 * Black on white with a four module margin, always. The dark theme stops at
 * the edge of the code, because a code that fails to scan across a hall is
 * worth nothing at all.
 */

interface CodesTabProps {
  profile: CrmProfile | null;
  codes: CrmCaptureCode[];
  events: CrmEvent[];
  onChanged: () => void;
  notify: Notify;
}

export default function CodesTab({ profile, codes, events, onChanged, notify }: CodesTabProps) {
  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState("");
  const [placement, setPlacement] = useState<CodePlacement>("badge");
  const [eventId, setEventId] = useState("");
  const [token, setToken] = useState(() => randomCode());
  const [busy, setBusy] = useState(false);

  const eventNameById: Record<string, string> = {};
  for (const event of events) eventNameById[event.id] = event.name;

  const createCode = async () => {
    if (!profile) {
      notify("Fill in your card first. A code has to point at something.", "error");
      return;
    }
    if (!label.trim()) return;

    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("crm_capture_codes").insert({
      code: token.trim().toLowerCase(),
      label: label.trim(),
      profile_id: profile.id,
      event_id: eventId || null,
      placement,
    });
    setBusy(false);

    if (error) {
      notify(
        error.message.includes("duplicate")
          ? "That code is already in use. Roll a new one."
          : error.message,
        "error"
      );
      return;
    }

    setLabel("");
    setEventId("");
    setToken(randomCode());
    setCreating(false);
    notify("Code created. Print it and stick it on something.", "success");
    onChanged();
  };

  const toggleActive = async (code: CrmCaptureCode) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("crm_capture_codes")
      .update({ is_active: !code.is_active })
      .eq("id", code.id);
    if (error) {
      notify(error.message, "error");
      return;
    }
    onChanged();
  };

  if (!profile) {
    return (
      <div className="rounded-2xl border border-white/8 bg-zinc-950/40 p-8 sm:p-10 text-center">
        <QrIcon className="w-6 h-6 text-zinc-600 mx-auto" />
        <h3 className="text-sm font-semibold text-white mt-3">No card to point at yet</h3>
        <p className="text-xs text-zinc-500 leading-relaxed mt-2 max-w-md mx-auto">
          A code is a link to your card with a label on it. Open the Your card tab and fill it in
          first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-xs text-zinc-500 leading-relaxed max-w-2xl">
          One code per thing you print. They all open the same card, and the code is what tells you
          which sticker, badge or banner did the work.
        </p>
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="btn-glass px-4 min-h-[44px] sm:min-h-[36px] text-xs font-semibold rounded-full shrink-0 self-start"
        >
          {creating ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {creating ? "Cancel" : "New code"}
        </button>
      </div>

      {creating && (
        <div className="glass-panel rounded-2xl border-white/8 p-4 sm:p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Label">
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Badge sticker, batch one"
                className="admin-input h-11 sm:h-9 py-0"
              />
            </Field>
            <Field label="Where it goes">
              <select
                value={placement}
                onChange={(e) => setPlacement(e.target.value as CodePlacement)}
                className="admin-input h-11 sm:h-9 py-0 cursor-pointer"
              >
                {CODE_PLACEMENTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Event">
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="admin-input h-11 sm:h-9 py-0 cursor-pointer"
              >
                <option value="">Whichever event is active when it is scanned</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </Field>
            <div>
              <span className="block text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-1.5">
                Code
              </span>
              <div className="flex gap-2">
                <input
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/[^a-z0-9]/gi, "").toLowerCase())}
                  maxLength={12}
                  aria-label="Code"
                  className="admin-input h-11 sm:h-9 py-0 font-mono tracking-widest"
                />
                <button
                  type="button"
                  onClick={() => setToken(randomCode())}
                  className="btn-glass px-4 min-h-[44px] sm:min-h-[36px] text-[11px] font-semibold rounded-lg shrink-0"
                >
                  Roll
                </button>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-zinc-600 leading-relaxed">
            {CODE_PLACEMENTS.find((p) => p.id === placement)?.hint} Short codes stay easy to scan,
            so five characters is the default.
          </p>
          <button
            type="button"
            onClick={() => void createCode()}
            disabled={busy || !label.trim() || !token.trim()}
            className="btn-primary px-4 min-h-[44px] sm:min-h-[36px] text-xs rounded-full disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Create code
          </button>
        </div>
      )}

      {codes.length === 0 && !creating ? (
        <EmptyCodes onStart={() => setCreating(true)} />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {codes.map((code) => (
            <CodeCard
              key={code.id}
              code={code}
              slug={profile.slug}
              eventName={code.event_id ? eventNameById[code.event_id] : undefined}
              onToggleActive={() => void toggleActive(code)}
              notify={notify}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function CodeCard({
  code,
  slug,
  eventName,
  onToggleActive,
  notify,
}: {
  code: CrmCaptureCode;
  slug: string;
  eventName?: string;
  onToggleActive: () => void;
  notify: Notify;
}) {
  const [copied, setCopied] = useState(false);
  const url = cardUrl(slug, code.code);
  const conversion = ratePct(code.capture_count, code.scan_count);
  const placement = CODE_PLACEMENTS.find((p) => p.id === code.placement);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify("Your browser blocked the clipboard. The address is printed below the code.", "error");
    }
  };

  const saveSvg = () => {
    const svg = qrSvgDocument(url);
    if (!svg) {
      notify("That address is too long to encode.", "error");
      return;
    }
    downloadFile(`qr-${code.code}.svg`, "image/svg+xml", svg);
  };

  const savePng = async () => {
    const blob = await qrPngBlob(url);
    if (!blob) {
      notify("That code could not be drawn as a PNG.", "error");
      return;
    }
    downloadFile(`qr-${code.code}.png`, "image/png", blob);
  };

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 ${
        code.is_active ? "border-white/8 bg-zinc-950/40" : "border-white/5 bg-zinc-950/20 opacity-70"
      }`}
    >
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="shrink-0 mx-auto sm:mx-0">
          {/* White plate with real padding, so the quiet zone survives a
              screenshot as well as a print. */}
          <div className="bg-white p-2 rounded-xl w-fit">
            <QrCode value={url} size={128} rounded={false} />
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-white break-words">{code.label}</h3>
            <p className="text-[11px] text-zinc-500 mt-1 break-words">
              {[placement?.label, eventName].filter(Boolean).join(" / ") || "No placement noted"}
            </p>
            <p className="text-[10px] font-mono text-zinc-600 mt-1 break-all">{url}</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Stat label="Scans" value={code.scan_count} />
            <Stat label="Captures" value={code.capture_count} />
            <Stat label="Converted" value={conversion === null ? "No scans" : `${conversion}%`} />
          </div>

          {code.last_scanned_at && (
            <p className="text-[10px] text-zinc-600">
              Last scanned {formatDateTime(code.last_scanned_at)}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/admin/dashboard/crm/design?k=${encodeURIComponent(code.code)}&from=codes`}
              className="btn-primary px-3.5 min-h-[44px] sm:min-h-[36px] text-[11px] rounded-full"
            >
              <Palette className="w-3.5 h-3.5" />
              Design
            </Link>
            <button
              type="button"
              onClick={saveSvg}
              className="btn-glass px-3.5 min-h-[44px] sm:min-h-[36px] text-[11px] font-semibold rounded-full"
            >
              <Download className="w-3.5 h-3.5" />
              Plain SVG
            </button>
            <button
              type="button"
              onClick={() => void savePng()}
              className="btn-glass px-3.5 min-h-[44px] sm:min-h-[36px] text-[11px] font-semibold rounded-full"
            >
              <Download className="w-3.5 h-3.5" />
              Plain PNG
            </button>
            <Link
              href={`/admin/dashboard/crm/print?k=${encodeURIComponent(code.code)}`}
              className="btn-glass px-3.5 min-h-[44px] sm:min-h-[36px] text-[11px] font-semibold rounded-full"
            >
              <Printer className="w-3.5 h-3.5" />
              Print sheet
            </Link>
            <button
              type="button"
              onClick={() => void copy()}
              className="btn-glass px-3.5 min-h-[44px] sm:min-h-[36px] text-[11px] font-semibold rounded-full"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy link"}
            </button>
            <button
              type="button"
              onClick={onToggleActive}
              className="btn-ghost px-3.5 min-h-[44px] sm:min-h-[36px] text-[11px] font-semibold rounded-full"
            >
              {code.is_active ? "Retire" : "Bring back"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-2">
      <span className="block text-[9px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <span className="block text-sm font-bold text-white font-mono mt-0.5 truncate">{value}</span>
    </div>
  );
}

function EmptyCodes({ onStart }: { onStart: () => void }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-zinc-950/40 p-8 sm:p-10 text-center">
      <QrIcon className="w-6 h-6 text-zinc-600 mx-auto" />
      <h3 className="text-sm font-semibold text-white mt-3">No codes yet</h3>
      <p className="text-xs text-zinc-500 leading-relaxed mt-2 max-w-md mx-auto">
        Make one for each place a code will live: the back of your badge, your lock screen, the
        banner. They all open the same card, and separate codes are the only way to find out which
        one people actually scan.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="btn-primary px-5 min-h-[44px] text-xs rounded-full mt-5"
      >
        <Plus className="w-3.5 h-3.5" />
        Create your first code
      </button>
    </div>
  );
}
