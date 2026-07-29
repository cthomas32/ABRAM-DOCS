"use client";

import {
  Boxes,
  CalendarDays,
  Check,
  Clock,
  CloudSun,
  MapPin,
  Pause,
  RotateCcw,
  Send,
  ShieldCheck,
  SkipForward,
} from "lucide-react";
import AbramMark from "@/components/AbramMark";
import type { VisualKind } from "@/lib/campaigns";

/**
 * Lightweight product mockups for the campaign landing pages.
 *
 * These are deliberately hand-built from markup rather than reusing the
 * interactive playground components: the landing pages catch social
 * traffic on phones, so the visual has to be instant and readable at a
 * glance instead of being explorable.
 */

const PANEL =
  "relative rounded-2xl border border-white/8 bg-zinc-950/60 backdrop-blur-md overflow-hidden shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)] h-full flex flex-col justify-between";

function WindowChrome({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
      <span className="w-2 h-2 rounded-full bg-white/10" />
      <span className="w-2 h-2 rounded-full bg-white/10" />
      <span className="w-2 h-2 rounded-full bg-white/10" />
      <span className="ml-2 text-[10px] font-medium tracking-wide text-zinc-500 truncate">
        {title}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Call sheet                                                          */
/* ------------------------------------------------------------------ */

const CALL_ROWS = [
  { id: "A-01", name: "L. Vance", role: "Lead", call: "08:30", tone: "text-amber-300/90" },
  { id: "A-02", name: "S. Apex", role: "Lead", call: "07:30", tone: "text-amber-300/90" },
  { id: "DP", name: "J. Doe", role: "Camera", call: "07:00", tone: "text-zinc-400" },
  { id: "SND", name: "V. Lin", role: "Sound", call: "07:30", tone: "text-zinc-400" },
];

function CallSheetVisual() {
  return (
    <div className={PANEL}>
      <WindowChrome title="Call Sheet / Day 12" />

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-[9px] font-medium tracking-widest uppercase text-zinc-500">
              Unit call
            </p>
            <p className="text-2xl font-semibold tracking-tight text-white font-mono">07:00</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="inline-flex items-center gap-1.5 text-[10px] text-zinc-400">
              <CloudSun className="w-3 h-3 text-[#8ECAFF]" />
              74&deg;F Sunny
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] text-zinc-500">
              <MapPin className="w-3 h-3" />
              Alleyway Backlot
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          {CALL_ROWS.map((row) => (
            <div
              key={row.id}
              className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
            >
              <span className="text-[9px] font-mono text-zinc-600 w-8 shrink-0">{row.id}</span>
              <span className="text-[11px] text-zinc-200 flex-1 min-w-0 truncate">{row.name}</span>
              <span className={`text-[10px] ${row.tone} shrink-0`}>{row.role}</span>
              <span className="text-[11px] font-mono text-white shrink-0 w-10 text-right">
                {row.call}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2.5">
          <span className="text-[10px] text-zinc-400">Ready to send to 14 crew</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white text-black text-[10px] font-semibold px-3 py-1">
            <Send className="w-3 h-3" />
            Send
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Schedule                                                            */
/* ------------------------------------------------------------------ */

const SCHEDULE_ROWS = [
  { label: "Prep", start: 0, span: 3, tone: "bg-zinc-600/50" },
  { label: "Shoot block A", start: 2, span: 4, tone: "bg-[#8ECAFF]/60" },
  { label: "Shoot block B", start: 5, span: 3, tone: "bg-[#8ECAFF]/40" },
  { label: "Post", start: 7, span: 4, tone: "bg-zinc-600/50" },
];

const DAY_LABELS = ["M", "T", "W", "T", "F", "M", "T", "W", "T", "F", "M"];

function ScheduleVisual() {
  return (
    <div className={PANEL}>
      <WindowChrome title="Schedule / Nebula Spot" />

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-[10px] font-medium tracking-wide text-zinc-400">
            Two week block
          </span>
          <span className="ml-auto text-[9px] font-medium tracking-widest uppercase text-[#8ECAFF]">
            Live
          </span>
        </div>

        <div className="grid grid-cols-11 gap-1 mb-2">
          {DAY_LABELS.map((day, index) => (
            <span
              key={`${day}-${index}`}
              className="text-[8px] font-mono text-zinc-600 text-center"
            >
              {day}
            </span>
          ))}
        </div>

        <div className="space-y-2">
          {SCHEDULE_ROWS.map((row) => (
            <div key={row.label}>
              <span className="text-[10px] text-zinc-400 block mb-1">{row.label}</span>
              <div className="grid grid-cols-11 gap-1 h-5">
                {Array.from({ length: 11 }, (_, cell) => {
                  const filled = cell >= row.start && cell < row.start + row.span;
                  return (
                    <span
                      key={cell}
                      className={`rounded-sm ${filled ? row.tone : "bg-white/[0.03]"}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 text-[10px] text-zinc-400">
          Day 6 moved. 9 crew calls and 4 bookings updated.
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Capacity                                                            */
/* ------------------------------------------------------------------ */

const CAPACITY_ROWS = [
  { name: "Producer", load: 62, tone: "bg-[#8ECAFF]/60", status: "Available" },
  { name: "1st AD", load: 94, tone: "bg-amber-400/70", status: "At limit" },
  { name: "Editor", load: 38, tone: "bg-[#8ECAFF]/60", status: "Available" },
  { name: "Colourist", load: 111, tone: "bg-red-400/70", status: "Over" },
];

function CapacityVisual() {
  return (
    <div className={PANEL}>
      <WindowChrome title="Capacity / Next 4 weeks" />

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-2xl font-semibold tracking-tight text-white font-mono">76%</span>
          <span className="text-[10px] text-zinc-500">team utilisation</span>
        </div>

        <div className="space-y-3">
          {CAPACITY_ROWS.map((row) => (
            <div key={row.name}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-zinc-300">{row.name}</span>
                <span className="text-[10px] font-mono text-zinc-500">
                  {row.load}%
                  <span className="ml-2 text-zinc-600">{row.status}</span>
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/[0.04] overflow-hidden">
                <div
                  className={`h-full rounded-full ${row.tone}`}
                  style={{ width: `${Math.min(100, row.load)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 text-[10px] text-zinc-400">
          Colourist is over by 4 days in week 3.
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Inventory                                                           */
/* ------------------------------------------------------------------ */

const ASSETS = [
  { id: "CAM-001", name: "Sensa FX9 Body #1", cat: "Camera", util: 84, state: "ok" },
  { id: "LNS-014", name: "24-70mm Zoom", cat: "Lens", util: 61, state: "ok" },
  { id: "VEH-003", name: "Grip Truck", cat: "Vehicle", util: 97, state: "clash" },
  { id: "AUD-008", name: "Boom Kit A", cat: "Audio", util: 22, state: "idle" },
];

function InventoryVisual() {
  return (
    <div className={PANEL}>
      <WindowChrome title="Resources / Inventory" />

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <p className="text-[9px] font-medium tracking-widest uppercase text-zinc-500">
              Assets tracked
            </p>
            <p className="text-2xl font-semibold tracking-tight text-white font-mono">248</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[10px] text-zinc-400">
            <Boxes className="w-3 h-3 text-[#8ECAFF]" />
            12 kits
          </span>
        </div>

        <div className="space-y-1.5">
          {ASSETS.map((asset) => (
            <div
              key={asset.id}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
                asset.state === "clash"
                  ? "border-amber-500/25 bg-amber-500/[0.06]"
                  : "border-white/5 bg-white/[0.02]"
              }`}
            >
              <span className="text-[9px] font-mono text-zinc-600 w-14 shrink-0">{asset.id}</span>
              <span className="text-[11px] text-zinc-200 flex-1 min-w-0 truncate">{asset.name}</span>
              <span className="text-[9px] text-zinc-500 shrink-0 hidden xs:inline">{asset.cat}</span>
              <span
                className={`text-[10px] font-mono shrink-0 w-9 text-right ${
                  asset.state === "clash"
                    ? "text-amber-300/90"
                    : asset.state === "idle"
                      ? "text-zinc-600"
                      : "text-zinc-300"
                }`}
              >
                {asset.util}%
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/[0.05] px-3 py-2 text-[10px] text-amber-300/90">
          Grip Truck is already out on Nebula. Booking blocked.
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Assistant                                                           */
/* ------------------------------------------------------------------ */

function ChatVisual() {
  return (
    <div className={PANEL}>
      <WindowChrome title="ABRAM / Assistant" />

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div className="flex justify-end mb-3">
          <p className="max-w-[80%] rounded-2xl rounded-br-sm bg-white/[0.06] border border-white/10 px-3 py-2 text-[11px] text-zinc-200">
            Book the A-camera kit for the Nebula shoot next Tuesday and put Leo on it.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center gap-2 mb-3">
            <AbramMark size={12} />
            <span className="text-[9px] font-semibold tracking-widest uppercase text-zinc-400">
              Action Plan
            </span>
            <span className="ml-auto text-[9px] text-zinc-600">Awaiting approval</span>
          </div>

          <div className="space-y-1.5">
            {[
              "Book A-Camera Kit (6 items) for Tue 12 Aug",
              "Assign Leo Vance as operator",
              "Update the Nebula work order dates",
            ].map((step, index) => (
              <div key={step} className="flex items-start gap-2.5">
                <span className="text-[9px] font-mono text-zinc-600 mt-0.5 shrink-0">
                  {index + 1}
                </span>
                <span className="text-[11px] text-zinc-300 leading-snug text-pretty">{step}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white text-black text-[10px] font-semibold px-3 py-1.5">
              <Check className="w-3 h-3" />
              Approve
            </span>
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-300 text-[10px] font-medium px-3 py-1.5">
              Edit
            </span>
          </div>
        </div>

        <p className="mt-3 text-[10px] text-zinc-600">
          Nothing is created or changed until you approve.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Run of show                                                         */
/* ------------------------------------------------------------------ */

const SEGMENTS = [
  { time: "19:00", name: "Opening titles", owner: "Graphics", len: "01:30", state: "done" },
  { time: "19:01", name: "Host welcome", owner: "Camera 2", len: "03:00", state: "done" },
  { time: "19:04", name: "Keynote segment", owner: "Producer", len: "12:00", state: "live" },
  { time: "19:16", name: "Break / VT roll", owner: "Replay", len: "02:00", state: "next" },
  { time: "19:18", name: "Panel", owner: "Audio", len: "18:00", state: "queued" },
];

const SEGMENT_TONE: Record<string, string> = {
  done: "border-white/5 bg-white/[0.02] text-zinc-600",
  live: "border-[#8ECAFF]/25 bg-[#8ECAFF]/[0.07] text-zinc-100",
  next: "border-white/8 bg-white/[0.03] text-zinc-300",
  queued: "border-white/5 bg-white/[0.02] text-zinc-500",
};

function RunOfShowVisual() {
  return (
    <div className={PANEL}>
      <WindowChrome title="Run of Show / Live" />

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div className="flex items-center justify-between gap-3 mb-4">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-[#8ECAFF]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8ECAFF]" />
            GO LIVE
          </span>
          <div className="text-right">
            <p className="text-[9px] font-medium tracking-widest uppercase text-zinc-500">
              Variance
            </p>
            <p className="text-sm font-semibold tracking-tight text-amber-300/90 font-mono">
              +00:42 behind
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          {SEGMENTS.map((segment) => (
            <div
              key={segment.name}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${SEGMENT_TONE[segment.state]}`}
            >
              <span className="text-[10px] font-mono shrink-0 w-9">{segment.time}</span>
              <span className="text-[11px] flex-1 min-w-0 truncate">{segment.name}</span>
              <span className="text-[9px] text-zinc-500 shrink-0 hidden xs:inline">
                {segment.owner}
              </span>
              <span className="text-[10px] font-mono shrink-0 w-10 text-right">{segment.len}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white text-black text-[10px] font-semibold px-3 py-1.5">
            <SkipForward className="w-3 h-3" />
            Advance
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] text-zinc-300 text-[10px] font-medium px-3 py-1.5">
            <Pause className="w-3 h-3" />
            Pause
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Client portal                                                       */
/* ------------------------------------------------------------------ */

const PORTAL_ITEMS = [
  { label: "Hero film 60s", meta: "Deliverable / v3", action: "Review", tone: "bg-white text-black" },
  {
    label: "Q3 campaign quote",
    meta: "Quote / $28,400",
    action: "Approve",
    tone: "bg-white/[0.06] text-zinc-200 border border-white/10",
  },
  {
    label: "Invoice 0142",
    meta: "Due in 7 days",
    action: "Pay",
    tone: "bg-white/[0.06] text-zinc-200 border border-white/10",
  },
];

function PortalVisual() {
  return (
    <div className={PANEL}>
      <WindowChrome title="Client Portal / Vesper Studios" />

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-3.5 h-3.5 text-[#8ECAFF]" />
          <span className="text-[10px] text-zinc-400">Secure link, no account needed</span>
        </div>

        <div className="space-y-1.5">
          {PORTAL_ITEMS.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-zinc-200 truncate">{item.label}</p>
                <p className="text-[9px] text-zinc-600 truncate">{item.meta}</p>
              </div>
              <span
                className={`text-[10px] font-semibold px-3 py-1 rounded-full shrink-0 ${item.tone}`}
              >
                {item.action}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 text-[10px] text-zinc-400">
          They only see what you mark as visible.
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Review rounds                                                       */
/* ------------------------------------------------------------------ */

const REVIEW_ROUNDS = [
  {
    version: "v3",
    note: "Colour pass on the rooftop sequence",
    status: "In review",
    tone: "text-[#8ECAFF] border-[#8ECAFF]/20 bg-[#8ECAFF]/5",
    current: true,
  },
  {
    version: "v2",
    note: "Revision requested: tighten the opening",
    status: "Sent back",
    tone: "text-amber-300/90 border-amber-500/20 bg-amber-500/5",
    current: false,
  },
  {
    version: "v1",
    note: "First assembly",
    status: "Superseded",
    tone: "text-zinc-500 border-white/5 bg-white/[0.02]",
    current: false,
  },
];

function ReviewVisual() {
  return (
    <div className={PANEL}>
      <WindowChrome title="Deliverable / Hero Film 60s" />

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-[9px] font-medium tracking-widest uppercase text-zinc-500">
              Revision round
            </p>
            <p className="text-2xl font-semibold tracking-tight text-white font-mono">3 of 4</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[10px] text-zinc-400">
            <Clock className="w-3 h-3 text-[#8ECAFF]" />
            Due Friday
          </span>
        </div>

        <div className="space-y-1.5">
          {REVIEW_ROUNDS.map((round) => (
            <div
              key={round.version}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
                round.current ? "border-white/10 bg-white/[0.04]" : "border-white/5 bg-white/[0.02]"
              }`}
            >
              <span className="text-[11px] font-mono text-zinc-300 w-6 shrink-0">
                {round.version}
              </span>
              <span className="text-[11px] text-zinc-400 flex-1 min-w-0 truncate">{round.note}</span>
              <span
                className={`text-[9px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${round.tone}`}
              >
                {round.status}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white text-black text-[10px] font-semibold px-3 py-1.5">
            <Check className="w-3 h-3" />
            Approve
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] text-zinc-300 text-[10px] font-medium px-3 py-1.5">
            <RotateCcw className="w-3 h-3" />
            Request revision
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Margin                                                              */
/* ------------------------------------------------------------------ */

const SCOPE_BUDGET_LINES = [
  { label: "Crew Roster", planned: 42000, committed: 39400 },
  { label: "Equipment Kits", planned: 18500, committed: 18000 },
  { label: "Locations & Permits", planned: 9500, committed: 7200 },
  { label: "Post & Deliverables", planned: 24000, committed: 22000 },
];

function money(value: number): string {
  return `$${(value / 1000).toFixed(1)}k`;
}

function MarginVisual() {
  return (
    <div className={PANEL}>
      <WindowChrome title="ABRAM / Smart Scope Engine" />

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        {/* Top Header with radial glowing ring meter */}
        <div className="flex items-center justify-between gap-3 mb-4 rounded-xl border border-white/8 bg-white/[0.02] p-3.5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#8ECAFF]/10 rounded-full blur-xl pointer-events-none" />
          
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <AbramMark size={12} />
              <span className="text-[9px] font-semibold tracking-widest uppercase text-zinc-400 font-sans">
                Scope Engine
              </span>
            </div>
            <p className="text-2xl font-bold tracking-tight text-white font-mono">$28,400</p>
            <p className="text-[9px] text-zinc-500 font-sans mt-0.5">Quoted & Margin Locked</p>
          </div>

          {/* Radial ring progress display */}
          <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-white/10"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-400"
                strokeDasharray="100, 100"
                strokeDashoffset="18"
                strokeWidth="3"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-[10px] font-mono font-bold text-emerald-400">82%</span>
          </div>
        </div>

        {/* Visual Flow Nodes: Brief -> Roster -> Payout */}
        <div className="space-y-2 relative">
          <div className="flex items-center gap-2.5 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
            <span className="w-2 h-2 rounded-full bg-[#8ECAFF] shrink-0 animate-pulse" />
            <span className="text-[11px] font-medium text-zinc-200 font-sans flex-1 min-w-0 truncate">
              Brief Scoped ➔ 3 Deliverables Extracted
            </span>
            <span className="text-[9px] font-mono text-[#8ECAFF] shrink-0 font-semibold">Step 1</span>
          </div>

          <div className="flex items-center gap-2.5 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <span className="text-[11px] font-medium text-zinc-200 font-sans flex-1 min-w-0 truncate">
              Roster Matched ➔ 4 Crew Assigned
            </span>
            <span className="text-[9px] font-mono text-amber-400 shrink-0 font-semibold">Step 2</span>
          </div>

          <div className="flex items-center gap-2.5 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-[11px] font-medium text-zinc-200 font-sans flex-1 min-w-0 truncate">
              Invoice Generated ➔ Payout Linked
            </span>
            <span className="text-[9px] font-mono text-emerald-400 shrink-0 font-semibold">Step 3</span>
          </div>
        </div>

        {/* Glowing Action & Status Callout */}
        <div className="mt-4 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.07] px-3 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-[10px] text-emerald-300 font-sans truncate">
              Client Approved • Ready to Launch
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-black font-semibold text-[9px] font-mono shrink-0">
            Active
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function CampaignVisual({
  kind,
  className = "",
}: {
  kind: VisualKind;
  className?: string;
}) {
  return (
    <div className={className}>
      {kind === "callsheet" ? <CallSheetVisual /> : null}
      {kind === "schedule" ? <ScheduleVisual /> : null}
      {kind === "capacity" ? <CapacityVisual /> : null}
      {kind === "margin" ? <MarginVisual /> : null}
      {kind === "review" ? <ReviewVisual /> : null}
      {kind === "runofshow" ? <RunOfShowVisual /> : null}
      {kind === "portal" ? <PortalVisual /> : null}
      {kind === "inventory" ? <InventoryVisual /> : null}
      {kind === "chat" ? <ChatVisual /> : null}
    </div>
  );
}
