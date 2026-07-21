"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AbramMark from "@/components/AbramMark";
import {
  Check,
  Loader2,
  Plus,
  Minus,
  Maximize2,
  X,
  ChevronDown,
  ArrowUp,
  ArrowRight,
  Save,
  Download,
  Clock,
  MapPin,
  Calendar,
  FileText,
  Users,
  ClipboardList,
} from "lucide-react";

type ArtifactKind = "callsheet" | "roster" | "workplan";

interface Scenario {
  id: string;
  icon: typeof FileText;
  prompt: string;
  activity: string[];
  response: string;
  artifact: ArtifactKind;
}

const SCENARIOS: Scenario[] = [
  {
    id: "callsheet",
    icon: FileText,
    prompt: "Draft tomorrow's call sheet for the Helix shoot",
    activity: [
      "read_project(Helix)",
      "draft_call_sheet",
      "pull_crew_call_times",
      "save_to_knowledge_base",
    ],
    response:
      "Here is Day 4 for the Helix shoot at Onyx Stage 4. Using your rate card and last quarter's actuals, general call is 07:00 on a 12-hour day.",
    artifact: "callsheet",
  },
  {
    id: "roster",
    icon: Users,
    prompt: "Who on my roster can edit next week?",
    activity: [
      "search_roster",
      "check_availability",
      "rank_by_fit",
      "staff_crew_member",
    ],
    response:
      "Four editors are open next week. Maya Chen edited your last 4 projects and ranks highest on fit.",
    artifact: "roster",
  },
  {
    id: "workplan",
    icon: ClipboardList,
    prompt: "Scope this brief into a work plan",
    activity: [
      "read_brief",
      "break_down_script",
      "scope_work_packages",
      "commit_estimate",
    ],
    response:
      "I scoped the Sensa launch into four work packages. Using your rate card that is 112 hours and a $128,400 ROM.",
    artifact: "workplan",
  },
];

const ARTIFACT_TITLE: Record<ArtifactKind, string> = {
  callsheet: "Call Sheet · Helix Day 4",
  roster: "Roster Shortlist · Editors",
  workplan: "Work Plan · Sensa Launch",
};

type StepStatus = "idle" | "running" | "done";

const STEP_DELAY = 850;

export default function CopilotSandbox() {
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [active, setActive] = useState<Scenario | null>(null);
  const [statuses, setStatuses] = useState<StepStatus[]>([]);
  const [showResponse, setShowResponse] = useState(false);
  const [artifact, setArtifact] = useState<ArtifactKind | null>(null);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => clearTimers, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [statuses, showResponse]);

  const run = (scenario: Scenario) => {
    if (phase === "running") return;
    clearTimers();
    setPhase("running");
    setActive(scenario);
    setShowResponse(false);
    setArtifact(null);
    setStatuses(scenario.activity.map(() => "idle"));

    scenario.activity.forEach((_, i) => {
      timers.current.push(
        setTimeout(() => {
          setStatuses((prev) => {
            const next = [...prev];
            next[i] = "running";
            return next;
          });
        }, i * STEP_DELAY)
      );
      timers.current.push(
        setTimeout(() => {
          setStatuses((prev) => {
            const next = [...prev];
            next[i] = "done";
            return next;
          });
        }, i * STEP_DELAY + STEP_DELAY - 120)
      );
    });

    const total = scenario.activity.length * STEP_DELAY;
    timers.current.push(
      setTimeout(() => {
        setShowResponse(true);
        setArtifact(scenario.artifact);
        setPhase("done");
      }, total + 150)
    );
  };

  const reset = () => {
    if (phase === "running") return;
    clearTimers();
    setPhase("idle");
    setActive(null);
    setStatuses([]);
    setShowResponse(false);
    setArtifact(null);
  };

  return (
    <div className="w-full font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
        {/* Chat panel */}
        <div className="col-span-1 lg:col-span-5 flex flex-col h-[560px] sm:h-[620px] lg:h-[680px] bg-[#141414] rounded-[16px] border border-[#27272a] overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#27272a] shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-[#e4e4e7] font-medium text-sm">Chat</span>
              <button
                onClick={reset}
                disabled={phase === "running"}
                aria-label="New chat"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#27272a] hover:bg-[#3f3f46] transition-colors cursor-pointer min-h-[36px] disabled:opacity-40 disabled:pointer-events-none"
              >
                <Plus className="w-3.5 h-3.5 text-[#e4e4e7]" />
                <span className="text-[#e4e4e7] text-xs font-medium">New chat</span>
              </button>
            </div>
            <div className="flex items-center gap-4 text-[#52525b]">
              <Minus className="w-4 h-4 hover:text-[#e4e4e7] transition-colors" />
              <Maximize2 className="w-3.5 h-3.5 hover:text-[#e4e4e7] transition-colors" />
              <X className="w-4 h-4 hover:text-[#e4e4e7] transition-colors" />
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 scrollbar-none">
            {phase === "idle" && !active && (
              <div className="flex flex-col items-start gap-1.5">
                <span className="text-[#52525b] text-[13px] font-medium">ABRAM Agent</span>
                <p className="text-[#a1a1aa] text-[13px] leading-relaxed">
                  Your Brain is scoped to this studio. It knows your crews, rate card, and clients.
                  Pick a scenario to watch it work.
                </p>
              </div>
            )}

            {active && (
              <>
                {/* User bubble */}
                <div className="flex justify-end w-full">
                  <div className="max-w-[85%] rounded-2xl px-4 py-2.5 bg-[#27272a] text-[#e4e4e7] text-[14px] leading-relaxed">
                    {active.prompt}
                  </div>
                </div>

                {/* Agent operations */}
                <div className="flex flex-col items-start w-full">
                  <div className="flex flex-col gap-1.5 mb-1 bg-[#141414]/30 border border-[#27272a]/40 rounded-lg p-2.5 w-full">
                    <div className="text-[10px] uppercase tracking-wider text-[#52525b] font-mono mb-1 font-semibold">
                      Agent Operations
                    </div>
                    {active.activity.map((op, i) => {
                      const s = statuses[i] ?? "idle";
                      return (
                        <div key={op} className="flex items-center gap-2 text-xs">
                          <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                            {s === "done" ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : s === "running" ? (
                              <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                            )}
                          </span>
                          <code
                            className={`font-mono bg-[#27272a]/60 px-1 py-0.5 rounded text-[11px] ${
                              s === "idle" ? "text-zinc-600" : "text-white"
                            }`}
                          >
                            {op}
                            {s === "running" ? "…" : ""}
                          </code>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Assistant response */}
                <AnimatePresence>
                  {showResponse && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-start w-full"
                    >
                      <span className="text-[#52525b] text-[13px] font-medium mb-1.5">ABRAM Agent</span>
                      <p className="text-[#e4e4e7] text-[14px] sm:text-[15px] leading-relaxed">
                        {active.response}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-zinc-500">
                        <AbramMark size={12} />
                        Artifact generated in your canvas
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>

          {/* Prompt cards */}
          {phase === "idle" && (
            <div className="px-4 pt-3 shrink-0">
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-2.5">
                Try a scenario
              </div>
              <div className="space-y-2">
                {SCENARIOS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.id}
                      onClick={() => run(s)}
                      className="w-full text-left p-3 rounded-xl border border-[#27272a] bg-[#27272a]/10 hover:border-white/10 hover:bg-[#27272a]/20 transition-all cursor-pointer min-h-[44px] flex items-center gap-3 text-[13px] text-zinc-300 hover:text-white"
                    >
                      <span className="w-7 h-7 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5 text-zinc-400" />
                      </span>
                      <span className="flex-1 min-w-0">{s.prompt}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="p-4 pt-3 shrink-0">
            <div className="bg-[#141414] border border-[#27272a] rounded-xl flex flex-col p-3 shadow-lg">
              <textarea
                disabled
                placeholder="Ask ABRAM..."
                className="w-full bg-transparent border-none text-[#e4e4e7] placeholder:text-[#52525b] text-[14px] leading-relaxed resize-none focus:outline-none min-h-[40px]"
                rows={1}
              />
              <div className="flex items-center justify-between mt-2">
                <button
                  disabled
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[#a1a1aa] cursor-default"
                >
                  <AbramMark size={14} />
                  <span className="text-xs font-medium">Skills</span>
                  <ChevronDown className="w-3 h-3 ml-0.5" />
                </button>
                <button
                  disabled
                  aria-label="Send message"
                  className="w-8 h-8 rounded-full bg-[#27272a] flex items-center justify-center text-[#e4e4e7] cursor-default"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Artifact canvas */}
        <div className="col-span-1 lg:col-span-7 flex flex-col h-[560px] sm:h-[620px] lg:h-[680px] bg-[#0a0a0a] rounded-[16px] border border-white/5 overflow-hidden shadow-xl">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 h-14 bg-[#0a0a0a] border-b border-white/5 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <FileText size={16} className="text-zinc-400 shrink-0" />
              <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase truncate">
                {artifact ? ARTIFACT_TITLE[artifact] : "Artifact Canvas"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button className="h-8 px-3 rounded-lg bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08] hover:text-white border border-white/10 hover:border-white/15 text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-default">
                <Save size={13} className="text-zinc-400" />
                <span className="hidden sm:inline">Save to Project</span>
              </button>
              <button className="h-8 px-2.5 rounded-lg bg-white/[0.02] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 border border-white/5 hover:border-white/10 text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-default">
                <Download size={13} className="text-zinc-500" />
                <span className="hidden sm:inline">CSV</span>
              </button>
              <button className="h-8 px-2.5 rounded-lg bg-white/[0.02] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 border border-white/5 hover:border-white/10 text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-default hidden sm:flex">
                <Download size={13} className="text-zinc-500" />
                <span className="hidden sm:inline">DOCX</span>
              </button>
              <button className="h-8 px-2.5 rounded-lg bg-white/[0.02] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 border border-white/5 hover:border-white/10 text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-default">
                <Download size={13} className="text-zinc-500" />
                <span className="hidden sm:inline">PDF</span>
              </button>
              <div className="w-px h-3 bg-zinc-800/85 mx-1 hidden sm:block" />
              <button
                onClick={reset}
                disabled={phase === "running" || !artifact}
                className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded-md transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                aria-label="Close artifact"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#0a0a0a] scrollbar-none">
            <AnimatePresence mode="wait">
              {artifact === null ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full min-h-[300px] flex flex-col items-center justify-center text-center border border-dashed border-white/5 rounded-md bg-white/[0.01] p-8"
                >
                  <AbramMark size={22} />
                  <p className="text-xs text-zinc-500 mt-3 max-w-[220px]">
                    Run a scenario to generate an artifact here.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key={artifact}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {artifact === "callsheet" && <CallSheetArtifact />}
                  {artifact === "roster" && <RosterArtifact />}
                  {artifact === "workplan" && <WorkPlanArtifact />}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Shared document paper (mirrors MockArtifactCanvas body) */
function DocPaper({
  title,
  subtitle,
  badge,
  children,
}: {
  title: string;
  subtitle: string;
  badge: string;
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-[816px] mx-auto bg-[#18181b] border border-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.5)] rounded-md p-5 sm:p-8 md:p-10">
      <div className="flex items-start justify-between gap-3 pb-4 mb-5 border-b border-white/5">
        <div className="min-w-0">
          <div className="text-lg sm:text-xl font-bold tracking-tight text-white">{title}</div>
          <div className="text-[11px] text-zinc-500 mt-1">{subtitle}</div>
        </div>
        <span className="inline-flex items-center rounded-full bg-white/[0.04] border border-white/8 px-2.5 py-1 text-[9px] uppercase tracking-wider font-semibold text-zinc-300 shrink-0">
          {badge}
        </span>
      </div>
      {children}
    </div>
  );
}

/* ── Artifact: Call sheet ─────────────────────────────── */
function CallSheetArtifact() {
  const meta = [
    { icon: Clock, label: "General call", value: "07:00" },
    { icon: Clock, label: "Wrap", value: "19:00" },
    { icon: Calendar, label: "Lunch", value: "12:30" },
    { icon: MapPin, label: "Sunset", value: "20:14" },
  ];
  const crew = [
    { name: "Maya Chen", role: "Director", call: "06:30" },
    { name: "Vesper Lin", role: "Cinematographer", call: "07:00" },
    { name: "Marcus Vance", role: "Gaffer", call: "06:45" },
    { name: "Noa Reyes", role: "1st AD", call: "06:30" },
  ];
  return (
    <DocPaper title="Call Sheet" subtitle="Helix · Onyx Stage 4" badge="Day 4 · Fri">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-5">
        {meta.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
              <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-zinc-500">
                <Icon className="w-3 h-3" />
                {m.label}
              </div>
              <div className="text-zinc-100 font-semibold text-sm mt-1 tabular-nums">{m.value}</div>
            </div>
          );
        })}
      </div>

      <div className="text-[10px] text-zinc-600 tracking-wider uppercase mb-1.5 flex items-center gap-1.5 md:hidden">
        Swipe to view <span>→</span>
      </div>
      <div className="overflow-x-auto scrollbar-none">
        <table className="w-full min-w-[320px] text-left">
          <thead>
            <tr className="text-[9px] uppercase tracking-wider text-zinc-500">
              <th className="font-semibold py-2 pr-3">Crew</th>
              <th className="font-semibold py-2 pr-3">Role</th>
              <th className="font-semibold py-2 text-right">Call</th>
            </tr>
          </thead>
          <tbody>
            {crew.map((c) => (
              <tr key={c.name} className="border-t border-white/5">
                <td className="py-2.5 pr-3 text-zinc-200 text-xs font-medium whitespace-nowrap">{c.name}</td>
                <td className="py-2.5 pr-3 text-zinc-500 text-xs whitespace-nowrap">{c.role}</td>
                <td className="py-2.5 text-zinc-300 text-xs text-right tabular-nums">{c.call}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-1.5 pt-4 mt-2 border-t border-white/5 text-[10px] text-zinc-500">
        <AbramMark size={12} />
        Using your rate card · 14 crew on call
      </div>
    </DocPaper>
  );
}

/* ── Artifact: Roster shortlist ───────────────────────── */
function RosterArtifact() {
  const rows = [
    { name: "Maya Chen", role: "Lead Editor", avail: "Available", fit: 96 },
    { name: "Noa Reyes", role: "Editor", avail: "Tentative", fit: 88 },
    { name: "Marcus Vance", role: "Assistant Editor", avail: "Available", fit: 81 },
    { name: "Vesper Lin", role: "Colorist", avail: "Booked", fit: 74 },
  ];
  const pill = (avail: string) =>
    avail === "Available"
      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
      : avail === "Tentative"
        ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
        : "bg-white/[0.03] border-white/8 text-zinc-500";
  return (
    <DocPaper title="Roster shortlist" subtitle="Editors available next week" badge="4 matched">
      <div className="space-y-2.5 pb-5">
        {rows.map((r) => (
          <div
            key={r.name}
            className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5"
          >
            <span className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/8 flex items-center justify-center text-[10px] font-semibold text-zinc-300 shrink-0">
              {r.name.split(" ").map((n) => n[0]).join("")}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-zinc-200 text-xs font-medium truncate">{r.name}</div>
              <div className="text-zinc-500 text-[11px] truncate">{r.role}</div>
            </div>
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-wider font-semibold shrink-0 ${pill(
                r.avail
              )}`}
            >
              {r.avail}
            </span>
            <div className="text-right shrink-0 w-9">
              <div className="text-zinc-100 text-xs font-semibold tabular-nums">{r.fit}</div>
              <div className="text-zinc-600 text-[8px] uppercase tracking-wider">fit</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 pt-4 border-t border-white/5 text-[10px] text-zinc-500">
        <AbramMark size={12} />
        Maya Chen edited your last 4 projects
      </div>
    </DocPaper>
  );
}

/* ── Artifact: Work plan ──────────────────────────────── */
function WorkPlanArtifact() {
  const packages = [
    { name: "Pre-production", owner: "Noa Reyes", hours: 24 },
    { name: "Principal photography", owner: "Vesper Lin", hours: 40 },
    { name: "Editorial", owner: "Maya Chen", hours: 32 },
    { name: "Color + finish", owner: "Marcus Vance", hours: 16 },
  ];
  const maxHours = Math.max(...packages.map((p) => p.hours));
  return (
    <DocPaper title="Work plan" subtitle="Sensa launch" badge="4 packages">
      <div className="space-y-3 pb-5">
        {packages.map((p) => (
          <div key={p.name}>
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <div className="min-w-0">
                <span className="text-zinc-200 text-xs font-medium">{p.name}</span>
                <span className="text-zinc-500 text-[11px] ml-2">{p.owner}</span>
              </div>
              <span className="text-zinc-300 text-xs font-semibold tabular-nums shrink-0">{p.hours}h</span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-900 border border-white/5 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-violet-400/60"
                initial={{ width: 0 }}
                animate={{ width: `${(p.hours / maxHours) * 100}%` }}
                transition={{ type: "spring", stiffness: 170, damping: 26 }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 pt-4 border-t border-white/5 text-[10px] text-zinc-500">
        <AbramMark size={12} />
        112 hours · Using your rate card → $128,400 ROM
      </div>
    </DocPaper>
  );
}
