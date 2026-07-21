"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Info } from "lucide-react";
import AbramMark from "@/components/AbramMark";

/* ------------------------------------------------------------------ */
/*  Data model                                                         */
/* ------------------------------------------------------------------ */

const DAYS_PER_WEEK = 5;
const TOTAL_WEEKS = 8;
const TOTAL_DAYS = DAYS_PER_WEEK * TOTAL_WEEKS;
const WEEKDAY_LETTERS = ["M", "T", "W", "T", "F"];
const CAPACITY = 8; // planned hours per person per day
const CELL_W = 36; // px, matches w-9

type Cell = { planned: number; actual: number; off?: boolean };

type Person = {
  id: string;
  initial: string;
  name: string;
  role: string;
  city: string;
  internal: boolean;
  cells: Cell[];
};

type DemandRow = {
  id: string;
  name: string;
  partial?: boolean;
  cells: number[]; // needed hours per day, 0 = nothing needed
};

function buildCells(
  base: number,
  opts: { over?: Record<number, number>; light?: Record<number, number>; off?: number[] } = {}
): Cell[] {
  const off = new Set(opts.off ?? []);
  return Array.from({ length: TOTAL_DAYS }, (_, i) => {
    if (off.has(i)) return { planned: 0, actual: 0, off: true };
    const planned = opts.over?.[i] ?? opts.light?.[i] ?? base;
    const actual = Math.max(0, planned - (i % 3 === 0 ? 1 : 0));
    return { planned, actual };
  });
}

function buildDemand(needs: Record<number, number>): number[] {
  return Array.from({ length: TOTAL_DAYS }, (_, i) => needs[i] ?? 0);
}

const INITIAL_PEOPLE: Person[] = [
  {
    id: "maya",
    initial: "M",
    name: "Maya Chen",
    role: "Art Director",
    city: "Los Angeles",
    internal: true,
    cells: buildCells(8, { over: { 2: 11, 9: 10 }, off: [17, 18] }),
  },
  {
    id: "vesper",
    initial: "V",
    name: "Vesper Lin",
    role: "3D Motion Lead",
    city: "Berlin",
    internal: true,
    cells: buildCells(8, { over: { 6: 10 }, light: { 12: 6, 13: 6 } }),
  },
  {
    id: "marcus",
    initial: "M",
    name: "Marcus Vance",
    role: "Lead Editor",
    city: "London",
    internal: true,
    cells: buildCells(7, { off: [3, 4], light: { 10: 5, 11: 5 } }),
  },
  {
    id: "noa",
    initial: "N",
    name: "Noa Reyes",
    role: "Motion Designer",
    city: "Austin",
    internal: false,
    cells: buildCells(6, { light: { 0: 4, 1: 4, 14: 4 } }),
  },
];

const DEMAND_ROWS: DemandRow[] = [
  {
    id: "helix",
    name: "Helix Launch Film",
    partial: true,
    cells: buildDemand({ 0: 6, 1: 6, 5: 8, 6: 8, 10: 6, 14: 6 }),
  },
  {
    id: "onyx",
    name: "Onyx Rebrand System",
    cells: buildDemand({ 2: 8, 3: 8, 4: 8, 15: 6, 16: 6, 17: 6 }),
  },
  {
    id: "vesperc",
    name: "Vesper Spring Campaign",
    cells: buildDemand({ 8: 8, 9: 8, 12: 6, 13: 6, 18: 8 }),
  },
  {
    id: "sensa",
    name: "Sensa Product Reel",
    partial: true,
    cells: buildDemand({ 7: 6, 11: 6, 14: 6, 19: 6 }),
  },
];

/* ------------------------------------------------------------------ */
/*  Shared cell visuals                                                */
/* ------------------------------------------------------------------ */

const HATCH_STYLE: React.CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(45deg, rgba(255,255,255,0.07) 0, rgba(255,255,255,0.07) 3px, transparent 3px, transparent 6px)",
};

function PlannedCell({
  cell,
  onClick,
  interactive,
}: {
  cell: Cell;
  onClick?: () => void;
  interactive?: boolean;
}) {
  const over = cell.planned > CAPACITY;
  const base =
    "shrink-0 h-11 flex flex-col items-center justify-center border-l border-white/[0.04] transition-colors";

  if (cell.off) {
    return (
      <div
        className={`${base} text-zinc-700`}
        style={{ width: CELL_W, ...HATCH_STYLE }}
        aria-label="Time off"
      />
    );
  }

  if (cell.planned === 0) {
    return <div className={base} style={{ width: CELL_W }} />;
  }

  const tone = over
    ? "bg-amber-500/15 border border-amber-500/40 text-amber-300"
    : "bg-[#8b5cf6]/15 border border-[#8b5cf6]/35 text-violet-200";

  const Wrapper: React.ElementType = interactive ? "button" : "div";

  return (
    <div className={base} style={{ width: CELL_W }}>
      <Wrapper
        onClick={onClick}
        className={`w-[30px] h-9 rounded-md flex flex-col items-center justify-center leading-none ${tone} ${
          interactive ? "cursor-pointer hover:brightness-125" : ""
        }`}
      >
        <span className="text-[10px] font-semibold font-sans">{cell.planned}</span>
        <span className="mt-0.5 text-[7px] text-zinc-400 border-b border-dotted border-zinc-500 font-sans">
          {cell.actual}
        </span>
      </Wrapper>
    </div>
  );
}

function DemandCell({ needed }: { needed: number }) {
  const base =
    "shrink-0 h-11 flex items-center justify-center border-l border-white/[0.04]";
  if (needed === 0) return <div className={base} style={{ width: CELL_W }} />;
  return (
    <div className={base} style={{ width: CELL_W }}>
      <div className="w-[30px] h-9 rounded-md flex items-center justify-center border border-dashed border-amber-500/40 bg-amber-500/[0.06] text-amber-300/90">
        <span className="text-[10px] font-semibold font-sans">{needed}</span>
      </div>
    </div>
  );
}

function MicroLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[9px] font-semibold tracking-[0.18em] uppercase text-zinc-500 font-sans">
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Main interactive mockup                                            */
/* ------------------------------------------------------------------ */

export default function WorkloadBalancerMockup() {
  const [people, setPeople] = useState<Person[]>(INITIAL_PEOPLE);
  const [visibleWeeks, setVisibleWeeks] = useState<number>(4);
  const [internalOnly, setInternalOnly] = useState(false);
  const [editing, setEditing] = useState<{ pIdx: number; dIdx: number } | null>(null);
  const [editVal, setEditVal] = useState("");

  const visibleDays = visibleWeeks * DAYS_PER_WEEK;
  const dayIndexes = useMemo(
    () => Array.from({ length: visibleDays }, (_, i) => i),
    [visibleDays]
  );
  const weekIndexes = useMemo(
    () => Array.from({ length: visibleWeeks }, (_, i) => i),
    [visibleWeeks]
  );

  const shownPeople = useMemo(
    () => people.filter((p) => (internalOnly ? p.internal : true)),
    [people, internalOnly]
  );

  const overAllocatedDays = useMemo(
    () =>
      shownPeople.reduce(
        (sum, p) =>
          sum + p.cells.slice(0, visibleDays).filter((c) => c.planned > CAPACITY).length,
        0
      ),
    [shownPeople, visibleDays]
  );

  const avgUtilization = useMemo(() => {
    if (shownPeople.length === 0) return 0;
    const totalPlanned = shownPeople.reduce(
      (sum, p) => sum + p.cells.slice(0, visibleDays).reduce((s, c) => s + c.planned, 0),
      0
    );
    const capacity = shownPeople.length * visibleDays * CAPACITY;
    return capacity === 0 ? 0 : Math.round((totalPlanned / capacity) * 100);
  }, [shownPeople, visibleDays]);

  const unassignedHours = useMemo(
    () =>
      DEMAND_ROWS.reduce(
        (sum, row) => sum + row.cells.slice(0, visibleDays).reduce((s, n) => s + n, 0),
        0
      ),
    [visibleDays]
  );

  const openEditor = (pIdx: number, dIdx: number) => {
    setEditing({ pIdx, dIdx });
    setEditVal(String(people[pIdx].cells[dIdx].planned));
  };

  const saveEditor = () => {
    if (!editing) return;
    const parsed = Math.max(0, Math.min(16, Number(editVal) || 0));
    setPeople((prev) =>
      prev.map((p, pi) => {
        if (pi !== editing.pIdx) return p;
        const cells = p.cells.map((c, di) =>
          di === editing.dIdx
            ? { ...c, planned: parsed, actual: Math.min(c.actual, parsed) }
            : c
        );
        return { ...p, cells };
      })
    );
    setEditing(null);
  };

  const editingPerson = editing ? people[editing.pIdx] : null;

  const tiles = [
    {
      label: "Avg Utilization",
      value: `${avgUtilization}%`,
      amber: avgUtilization > 100,
    },
    {
      label: "Over-Allocated Person-Days",
      value: `${overAllocatedDays}`,
      amber: overAllocatedDays > 0,
    },
    {
      label: "Unassigned Hours",
      value: `${unassignedHours}h`,
      amber: false,
    },
  ];

  const nameColClass =
    "sticky left-0 z-20 shrink-0 w-40 bg-[#0a0a0c] border-r border-white/[0.08]";

  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl border border-white/[0.08] bg-zinc-950/40 backdrop-blur-xl p-4 sm:p-6 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <AbramMark size={14} />
          <MicroLabel>Team Capacity</MicroLabel>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* People filter */}
          <div className="inline-flex rounded-full border border-white/[0.08] bg-white/[0.02] p-0.5">
            {[
              { key: false, label: "All people" },
              { key: true, label: "Internal only" },
            ].map((opt) => (
              <button
                key={String(opt.key)}
                onClick={() => setInternalOnly(opt.key)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium font-sans transition-colors cursor-pointer ${
                  internalOnly === opt.key
                    ? "bg-white/10 text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {/* Project filter (display) */}
          <span className="px-2.5 py-1 rounded-full border border-white/[0.08] bg-white/[0.02] text-[10px] font-medium text-zinc-400 font-sans">
            All Projects
          </span>
          {/* Range chips */}
          <div className="inline-flex rounded-full border border-white/[0.08] bg-white/[0.02] p-0.5">
            {[2, 4, 8].map((w) => (
              <button
                key={w}
                onClick={() => setVisibleWeeks(w)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium font-sans transition-colors cursor-pointer ${
                  visibleWeeks === w
                    ? "bg-white/10 text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {w} Weeks
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-5">
        {tiles.map((t) => (
          <div
            key={t.label}
            className={`rounded-xl border px-3 py-3 ${
              t.amber
                ? "border-amber-500/30 bg-amber-500/[0.06]"
                : "border-white/[0.08] bg-zinc-900/40"
            }`}
          >
            <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-sans leading-tight">
              {t.label}
            </div>
            <motion.div
              key={t.value}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              className={`mt-1 text-xl sm:text-2xl font-medium font-sans ${
                t.amber ? "text-amber-300" : "text-white"
              }`}
            >
              {t.value}
            </motion.div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 text-[10px] text-zinc-400 font-sans">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-[3px] bg-[#8b5cf6]/25 border border-[#8b5cf6]/40" />
          Assigned
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-[3px] bg-amber-500/20 border border-amber-500/50" />
          Unassigned / over-allocated
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-[3px] border border-white/15" style={HATCH_STYLE} />
          Time off
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="text-[9px] text-zinc-400 border-b border-dotted border-zinc-500">0</span>
          Actual logged hours
        </span>
      </div>

      {/* Mobile swipe hint */}
      <div className="flex justify-end mb-2 md:hidden">
        <span className="text-[9px] text-zinc-400 font-sans">Swipe to view →</span>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto scrollbar-thin rounded-xl border border-white/[0.08] bg-zinc-950/20">
        <div style={{ minWidth: 160 + visibleDays * CELL_W }}>
          {/* Week + weekday header */}
          <div className="flex border-b border-white/[0.08] bg-white/[0.015]">
            <div className={`${nameColClass} bg-[#0a0a0c] flex items-end px-3 py-2`}>
              <MicroLabel>Team Member</MicroLabel>
            </div>
            <div className="flex">
              {weekIndexes.map((w) => (
                <div key={w} className="flex flex-col">
                  <div
                    className="text-center text-[9px] font-semibold tracking-[0.15em] uppercase text-zinc-500 font-sans py-1 border-l border-white/[0.06]"
                    style={{ width: DAYS_PER_WEEK * CELL_W }}
                  >
                    Week {w + 1}
                  </div>
                  <div className="flex">
                    {WEEKDAY_LETTERS.map((letter, di) => (
                      <div
                        key={di}
                        className="shrink-0 text-center text-[9px] text-zinc-600 font-sans py-1 border-l border-white/[0.04]"
                        style={{ width: CELL_W }}
                      >
                        {letter}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Unassigned Work section */}
          <div className="flex items-center bg-white/[0.01] border-b border-white/[0.06]">
            <div className={`${nameColClass} bg-[#0a0a0c] px-3 py-1.5`}>
              <span className="text-[9px] font-semibold tracking-[0.18em] uppercase text-amber-400/80 font-sans">
                Unassigned Work
              </span>
            </div>
            <div className="flex-1" />
          </div>

          {DEMAND_ROWS.map((row) => (
            <div key={row.id} className="flex border-b border-white/[0.05]">
              <div className={`${nameColClass} px-3 py-2 flex items-center gap-2`}>
                <span className="text-[11px] text-zinc-300 font-sans truncate">{row.name}</span>
                {row.partial && (
                  <span className="shrink-0 text-[8px] px-1.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 font-sans uppercase tracking-wide">
                    Partial
                  </span>
                )}
              </div>
              <div className="flex">
                {dayIndexes.map((di) => (
                  <DemandCell key={di} needed={row.cells[di]} />
                ))}
              </div>
            </div>
          ))}

          {/* Assigned Work section */}
          <div className="flex items-center bg-white/[0.01] border-b border-white/[0.06]">
            <div className={`${nameColClass} bg-[#0a0a0c] px-3 py-1.5`}>
              <span className="text-[9px] font-semibold tracking-[0.18em] uppercase text-violet-300/80 font-sans">
                Assigned Work
              </span>
            </div>
            <div className="flex-1" />
          </div>

          {shownPeople.map((person) => {
            const pIdx = people.findIndex((p) => p.id === person.id);
            return (
              <div key={person.id} className="flex border-b border-white/[0.05] last:border-b-0">
                <div className={`${nameColClass} px-3 py-2 flex items-center gap-2.5`}>
                  <span className="shrink-0 w-6 h-6 rounded-full bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 flex items-center justify-center text-[10px] font-semibold text-violet-200 font-sans">
                    {person.initial}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium text-zinc-100 font-sans truncate">
                      {person.name}
                    </div>
                    <div className="text-[9px] text-zinc-500 font-sans truncate">
                      {person.role} · {person.city}
                    </div>
                  </div>
                </div>
                <div className="flex">
                  {dayIndexes.map((di) => (
                    <PlannedCell
                      key={di}
                      cell={person.cells[di]}
                      interactive
                      onClick={() => openEditor(pIdx, di)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer hint */}
      <div className="mt-4 flex items-center gap-1.5 px-1 text-[10px] text-zinc-500 font-sans">
        <Info className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
        <span>Click any over-allocated day to rebalance planned hours in place.</span>
      </div>

      {/* Edit hours popover */}
      <AnimatePresence>
        {editing && editingPerson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setEditing(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="relative w-[280px] rounded-2xl border border-white/[0.08] bg-zinc-950/95 backdrop-blur-xl p-5 shadow-2xl"
            >
              <button
                onClick={() => setEditing(null)}
                className="absolute top-3 right-3 h-8 w-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
              <MicroLabel>Edit hours</MicroLabel>
              <div className="mt-2 mb-4">
                <div className="text-sm font-medium text-white font-sans">
                  {editingPerson.name}
                </div>
                <div className="text-[10px] text-zinc-500 font-sans">
                  {editingPerson.role} · Planned per day
                </div>
              </div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-sans mb-1.5">
                Planned hours
              </label>
              <input
                type="number"
                min={0}
                max={16}
                value={editVal}
                onChange={(e) => setEditVal(e.target.value)}
                className="w-full rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2 text-sm text-white font-sans outline-none focus:border-[#8b5cf6]/50"
              />
              <p className="mt-2 text-[10px] text-zinc-500 font-sans leading-relaxed">
                Anything above {CAPACITY}h a day flags as over-allocated.
              </p>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  onClick={() => setEditing(null)}
                  className="btn-ghost rounded-full px-3.5 py-1.5 text-xs text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEditor}
                  className="btn-glass rounded-full px-4 py-1.5 text-xs font-medium cursor-pointer"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Compact static preview (for hub + homepage reuse)                  */
/* ------------------------------------------------------------------ */

export function WorkloadPreview() {
  const previewTiles = [
    { label: "Avg Utilization", value: "87%" },
    { label: "Over-Allocated", value: "3", amber: true },
    { label: "Unassigned", value: "142h" },
  ];

  const rows: { initial: string; name: string; role: string; hours: number[]; over?: boolean }[] = [
    { initial: "M", name: "Maya Chen", role: "Art Director", hours: [8, 8, 11, 8, 8], over: true },
    { initial: "V", name: "Vesper Lin", role: "3D Motion Lead", hours: [8, 8, 6, 6, 8] },
    { initial: "M", name: "Marcus Vance", role: "Lead Editor", hours: [7, 7, 0, 0, 7] },
    { initial: "N", name: "Noa Reyes", role: "Motion Designer", hours: [4, 6, 6, 6, 4] },
  ];

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-zinc-950/40 backdrop-blur-md shadow-xl p-4 sm:p-5 select-none">
      <div className="flex items-center justify-between mb-3.5">
        <MicroLabel>Team Capacity</MicroLabel>
        <span className="inline-flex items-center gap-1.5 text-[10px] text-zinc-400 font-sans">
          <AbramMark size={12} />
          Workload Balancer
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3.5">
        {previewTiles.map((t) => (
          <div
            key={t.label}
            className={`rounded-lg border px-2.5 py-2 ${
              t.amber ? "border-amber-500/30 bg-amber-500/[0.06]" : "border-white/[0.06] bg-zinc-900/40"
            }`}
          >
            <div className="text-[8px] uppercase tracking-wider text-zinc-500 font-sans leading-tight">
              {t.label}
            </div>
            <div className={`mt-0.5 text-base font-medium font-sans ${t.amber ? "text-amber-300" : "text-white"}`}>
              {t.value}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-white/[0.06] overflow-hidden">
        <div className="flex bg-white/[0.02] border-b border-white/[0.06]">
          <div className="w-28 shrink-0 px-2.5 py-1.5">
            <span className="text-[8px] uppercase tracking-[0.15em] text-zinc-500 font-sans">Week 1</span>
          </div>
          <div className="flex flex-1">
            {WEEKDAY_LETTERS.map((l, i) => (
              <div key={i} className="flex-1 text-center text-[8px] text-zinc-600 font-sans py-1.5 border-l border-white/[0.04]">
                {l}
              </div>
            ))}
          </div>
        </div>
        {rows.map((r) => (
          <div key={r.name} className="flex border-b border-white/[0.04] last:border-b-0">
            <div className="w-28 shrink-0 px-2.5 py-1.5 flex items-center gap-1.5">
              <span className="shrink-0 w-4 h-4 rounded-full bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 flex items-center justify-center text-[8px] font-semibold text-violet-200 font-sans">
                {r.initial}
              </span>
              <span className="text-[9px] text-zinc-300 font-sans truncate">{r.name}</span>
            </div>
            <div className="flex flex-1">
              {r.hours.map((h, i) => {
                const off = h === 0;
                const over = h > CAPACITY;
                return (
                  <div
                    key={i}
                    className="flex-1 h-8 flex items-center justify-center border-l border-white/[0.04]"
                    style={off ? HATCH_STYLE : undefined}
                  >
                    {!off && (
                      <div
                        className={`w-6 h-6 rounded-[5px] flex items-center justify-center text-[9px] font-semibold font-sans ${
                          over
                            ? "bg-amber-500/15 border border-amber-500/40 text-amber-300"
                            : "bg-[#8b5cf6]/15 border border-[#8b5cf6]/35 text-violet-200"
                        }`}
                      >
                        {h}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
