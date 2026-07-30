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
  Coins,
  Clapperboard,
  Video,
  ShieldCheck,
  Phone,
  Building,
  CheckCircle2,
  Minimize2,
} from "lucide-react";

type ArtifactKind = "callsheet" | "roster" | "workplan" | "rom" | "script" | "equipment";

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
  {
    id: "rom",
    icon: Coins,
    prompt: "Generate a ROM estimate for the Apex campaign",
    activity: [
      "query_labor_rates",
      "estimate_equipment_costs",
      "apply_contingency",
      "commit_estimate",
    ],
    response:
      "I pulled current rates for the LA market and compiled a Rough Order of Magnitude. The total estimate is $173,030.00.",
    artifact: "rom",
  },
  {
    id: "script",
    icon: Clapperboard,
    prompt: "Break down Scene 4 of the coffee shop script",
    activity: [
      "parse_screenplay",
      "extract_cast_and_props",
      "tag_wardrobe",
      "update_stripboard",
    ],
    response:
      "Scene 4 analyzed. I extracted 2 cast members, tagged key props like the briefcase and coffee cup, and updated the stripboard.",
    artifact: "script",
  },
  {
    id: "equipment",
    icon: Video,
    prompt: "Check camera inventory and book package gaps",
    activity: [
      "check_inventory",
      "match_compatible_gear",
      "query_rental_vendors",
      "reserve_equipment",
    ],
    response:
      "Checked internal inventory. RED V-Raptor body is reserved. I sourced and booked a Cooke Anamorphic 5-lens set from external vendors.",
    artifact: "equipment",
  },
];

const ARTIFACT_TITLE: Record<ArtifactKind, string> = {
  callsheet: "Call Sheet · Helix Day 4",
  roster: "Roster Shortlist · Editors",
  workplan: "Work Plan · Sensa Launch",
  rom: "Rough Order of Magnitude · Apex Campaign",
  script: "Script Breakdown · Scene 4 Coffee Shop",
  equipment: "Equipment Requisition · Camera & G&E",
};

type StepStatus = "idle" | "running" | "done";

const STEP_DELAY = 280;

export default function CopilotSandbox() {
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [active, setActive] = useState<Scenario | null>(null);
  const [statuses, setStatuses] = useState<StepStatus[]>([]);
  const [showResponse, setShowResponse] = useState(false);
  const [artifact, setArtifact] = useState<ArtifactKind | null>(null);
  const [zoom, setZoom] = useState<"fit" | "full">("fit");

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
              <span className="text-[#e4e4e7] font-medium text-sm font-sans">Chat</span>
              <button
                onClick={reset}
                disabled={phase === "running"}
                aria-label="New chat"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#27272a] hover:bg-[#3f3f46] transition-colors cursor-pointer min-h-[36px] disabled:opacity-40 disabled:pointer-events-none"
              >
                <Plus className="w-3.5 h-3.5 text-[#e4e4e7]" />
                <span className="text-[#e4e4e7] text-xs font-medium font-sans">New chat</span>
              </button>
            </div>
            <div className="flex items-center gap-4 text-[#52525b]">
              <Minus className="w-4 h-4 hover:text-[#e4e4e7] transition-colors" />
              <Maximize2 className="w-3.5 h-3.5 hover:text-[#e4e4e7] transition-colors" />
              <X className="w-4 h-4 hover:text-[#e4e4e7] transition-colors" />
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 scrollbar-none font-sans">
            {phase === "idle" && !active && (
              <div className="flex flex-col items-start gap-1.5">
                <span className="text-[#52525b] text-[13px] font-medium font-sans">ABRAM Agent</span>
                <p className="text-[#a1a1aa] text-[13px] leading-relaxed font-sans">
                  Your Brain is scoped to this studio. It knows your crews, rate card, and clients.
                  Pick a scenario to watch it work.
                </p>
              </div>
            )}

            {active && (
              <>
                {/* User bubble */}
                <div className="flex justify-end w-full">
                  <div className="max-w-[85%] rounded-2xl px-4 py-2.5 bg-[#27272a] text-[#e4e4e7] text-[14px] leading-relaxed font-sans">
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
                      <span className="text-[#52525b] text-[13px] font-medium mb-1.5 font-sans">ABRAM Agent</span>
                      <p className="text-[#e4e4e7] text-[14px] sm:text-[15px] leading-relaxed font-sans">
                        <TypewriterText text={active.response} scrollRef={scrollRef} />
                      </p>
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-zinc-500 font-sans">
                        <AbramMark size={12} />
                        Artifact generated in your canvas
                        <ArrowRight className="w-3 h-3" />
                      </div>

                      {/* POP-UP NEXT SCENARIO BUTTONS */}
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="pt-3 border-t border-[#27272a]/60 mt-4 w-full space-y-2"
                      >
                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold flex items-center gap-1.5 font-sans">
                          <AbramMark size={10} />
                          Try another scenario
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {SCENARIOS.filter((s) => s.id !== active.id).map((s) => {
                            const Icon = s.icon;
                            return (
                              <button
                                key={s.id}
                                onClick={() => run(s)}
                                className="w-full text-left p-2.5 rounded-xl border border-[#27272a] bg-[#27272a]/20 hover:border-white/20 hover:bg-[#27272a]/60 transition-all cursor-pointer min-h-[38px] flex items-center gap-2.5 text-xs text-zinc-300 hover:text-white font-sans"
                              >
                                <Icon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                <span className="flex-1 truncate">{s.prompt}</span>
                                <ArrowRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>

          {/* Initial Prompt cards */}
          {phase === "idle" && (
            <div className="px-4 pt-3 shrink-0">
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-2.5 font-sans">
                Try a scenario
              </div>
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto scrollbar-none pr-1">
                {SCENARIOS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.id}
                      onClick={() => run(s)}
                      className="w-full text-left p-2.5 rounded-xl border border-[#27272a] bg-[#27272a]/10 hover:border-white/10 hover:bg-[#27272a]/20 transition-all cursor-pointer min-h-[40px] flex items-center gap-2.5 text-[12px] text-zinc-300 hover:text-white font-sans"
                    >
                      <span className="w-6 h-6 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5 text-zinc-400" />
                      </span>
                      <span className="flex-1 truncate">{s.prompt}</span>
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
                className="w-full bg-transparent border-none text-[#e4e4e7] placeholder:text-[#52525b] text-[14px] leading-relaxed resize-none focus:outline-none min-h-[40px] font-sans"
                rows={1}
              />
              <div className="flex items-center justify-between mt-2">
                <button
                  disabled
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[#a1a1aa] cursor-default"
                >
                  <AbramMark size={14} />
                  <span className="text-xs font-medium font-sans">Skills</span>
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
              <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase truncate font-sans">
                {artifact ? ARTIFACT_TITLE[artifact] : "Artifact Canvas"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={() => setZoom(zoom === "fit" ? "full" : "fit")}
                className="h-8 px-2.5 rounded-lg bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] hover:text-white border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer font-sans"
              >
                {zoom === "fit" ? (
                  <>
                    <Maximize2 size={13} className="text-zinc-400" />
                    <span className="hidden sm:inline">100% View</span>
                  </>
                ) : (
                  <>
                    <Minimize2 size={13} className="text-zinc-400" />
                    <span className="hidden sm:inline">Fit Page</span>
                  </>
                )}
              </button>
              <button className="h-8 px-3 rounded-lg bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08] hover:text-white border border-white/10 hover:border-white/15 text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-default font-sans">
                <Save size={13} className="text-zinc-400" />
                <span className="hidden sm:inline">Save</span>
              </button>
              <button className="h-8 px-2.5 rounded-lg bg-white/[0.02] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 border border-white/5 hover:border-white/10 text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-default font-sans">
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

          {/* Body with Fit Scale Viewport */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-[#08080a] scrollbar-none flex flex-col items-center justify-start">
            <AnimatePresence mode="wait">
              {artifact === null ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full min-h-[300px] flex flex-col items-center justify-center text-center border border-dashed border-white/5 rounded-md bg-white/[0.01] p-8 w-full"
                >
                  <AbramMark size={22} />
                  <p className="text-xs text-zinc-500 mt-3 max-w-[220px] font-sans">
                    Run a scenario to generate an artifact here.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key={artifact}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`w-full transition-transform duration-300 origin-top flex justify-center ${
                    zoom === "fit" ? "scale-[0.82] sm:scale-[0.85] lg:scale-[0.88]" : "scale-100"
                  }`}
                >
                  {artifact === "callsheet" && <CallSheetArtifact />}
                  {artifact === "roster" && <RosterArtifact />}
                  {artifact === "workplan" && <WorkPlanArtifact />}
                  {artifact === "rom" && <ROMArtifact />}
                  {artifact === "script" && <ScriptArtifact />}
                  {artifact === "equipment" && <EquipmentArtifact />}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Standard Letter-Sized Document Paper Frame (8.5" x 11" Proportions with Clean Rounded Border) */
function DocPaper({
  title,
  subtitle,
  badge,
  docRef,
  dateStr,
  children,
}: {
  title: string;
  subtitle: string;
  badge: string;
  docRef?: string;
  dateStr?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-[720px] mx-auto bg-[#121214] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-xl p-4 sm:p-6 text-zinc-100 relative font-sans">
      {/* Official Top Branding Strip */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-4 text-[10px] text-zinc-500 font-sans">
        <div className="flex items-center gap-2">
          <AbramMark size={14} />
          <span className="font-semibold tracking-[0.2em] text-zinc-400 uppercase">ABRAM NETWORK</span>
          <span className="text-zinc-700">•</span>
          <span className="font-mono text-zinc-500">STUDIO OPERATIONS</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[9px] text-zinc-500">
          <span>DATE: {dateStr || "JULY 30, 2026"}</span>
          <span>•</span>
          <span>FORMAT: LETTER 8.5&quot; × 11&quot;</span>
        </div>
      </div>

      {/* Main Document Header Block */}
      <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest bg-white/[0.04] border border-white/5 px-2 py-0.5 rounded">
              {docRef || "REF-2026-981A"}
            </span>
            <span className="text-[9px] font-mono text-emerald-400 uppercase font-semibold">
              ● VERIFIED DRAFT
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white font-sans">{title}</h1>
          <p className="text-[11px] text-zinc-400 mt-0.5 font-sans">{subtitle}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="inline-flex items-center rounded-md bg-white/[0.06] border border-white/15 px-2.5 py-0.5 text-[9px] uppercase tracking-wider font-semibold text-zinc-100 font-sans shadow-sm">
            {badge}
          </span>
          <span className="text-[9px] font-mono text-zinc-500 uppercase">CLASSIFICATION: INTERNAL</span>
        </div>
      </div>

      {/* Main Document Body */}
      {children}

      {/* Formal Document Footer */}
      <div className="border-t border-white/10 pt-3 mt-5 flex flex-wrap items-center justify-between gap-2 text-[9px] text-zinc-500 font-sans">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
          <span>Cryptographically signed &amp; verified by ABRAM Engine</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[9px]">
          <span>PAGE 1 OF 1</span>
          <span>•</span>
          <span>SECURITY HASH: 0x9F4B2A8C</span>
        </div>
      </div>
    </div>
  );
}

/* ── Artifact 1: Call Sheet (High-Density Multi-Block Layout) ─────────────────────────────── */
function CallSheetArtifact() {
  const meta = [
    { icon: Clock, label: "General Crew Call", value: "06:00 AM" },
    { icon: Clock, label: "Breakfast Buffet", value: "06:30 AM" },
    { icon: Calendar, label: "Lunch Break", value: "12:30 PM" },
    { icon: Clock, label: "Est. Wrap Time", value: "18:30 PM" },
  ];

  const schedule = [
    { time: "07:00 AM", scene: "4", intExt: "INT", set: "COFFEE SHOP - DAY", desc: "Marcus refuses to surrender the briefcase to Sarah", cast: "1, 2", pages: "2 1/8", loc: "Onyx Stage 4" },
    { time: "10:30 AM", scene: "5", intExt: "EXT", set: "ALLEYWAY - DAY", desc: "Sarah spots idling black sedan waiting outside", cast: "2", pages: "1 4/8", loc: "Backlot Alley B" },
    { time: "12:30 PM", scene: "—", intExt: "—", set: "LUNCH BREAK (60 MINS)", desc: "Catering provided at Basecamp Pavilion", cast: "ALL", pages: "—", loc: "Basecamp Lot B" },
    { time: "13:30 PM", scene: "8", intExt: "INT", set: "WAREHOUSE - NIGHT", desc: "The exchange & standoff with informant", cast: "1, 2, 4", pages: "3 2/8", loc: "Onyx Stage 2" },
  ];

  const cast = [
    { id: "1", char: "Marcus", actor: "Marcus Vance", status: "W", pu: "05:15", call: "05:45", hmu: "06:00", set: "07:00", notes: "Stunt double ready" },
    { id: "2", char: "Sarah", actor: "Sarah Jenkins", status: "W", pu: "05:30", call: "06:00", hmu: "06:15", set: "07:00", notes: "Wardrobe change @ 10:00" },
    { id: "4", char: "Informant", actor: "Devon Reed", status: "P", pu: "12:00", call: "12:30", hmu: "12:45", set: "13:30", notes: "Prosthetic makeup req." },
  ];

  const deptNotes = [
    { dept: "Camera & DIT", note: "RED V-Raptor 8K VV + Cooke Anamorphics. 2nd unit DIT setup in Stage 4 bay." },
    { dept: "Grip & Lighting", note: "Aputure 1200d rigged through Stage 4 cyc window. Pre-rig complete at 05:30 AM." },
    { dept: "Sound Department", note: "Ch 1 Prod Dialogue / Ch 3 Wireless Trans. RF Quiet Zone strictly enforced on Stage 4." },
    { dept: "Basecamp & Parking", note: "Crew parking in Lot B (entrance off 4th St). Catering truck arrives 06:00 AM." },
  ];

  return (
    <DocPaper title="DAILY CALL SHEET" subtitle="Project Helix · Commercial Production · Shoot Day 4 of 12" badge="CONFIRMED DAY 4" docRef="CS-HLX-004" dateStr="JULY 31, 2026">
      {/* Executive Logistics & Emergency Info Block */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4 p-3 rounded-xl border border-white/5 bg-white/[0.02]">
        <div className="space-y-0.5">
          <div className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-sans">
            <Building className="w-3 h-3 text-zinc-400" />
            Stage &amp; Studio Address
          </div>
          <p className="text-xs text-zinc-200 font-bold">Onyx Soundstage 4 &amp; Backlot Alley B</p>
          <p className="text-[10px] text-zinc-500">1040 Studio Way, Los Angeles CA 90028 • Stage Phone: (323) 555-0194</p>
        </div>
        <div className="space-y-0.5 sm:border-l sm:border-white/5 sm:pl-3">
          <div className="text-[9px] font-semibold uppercase tracking-wider text-red-400 flex items-center gap-1.5 font-sans">
            <Phone className="w-3 h-3 text-red-400" />
            Emergency Services &amp; 24/7 Hospital
          </div>
          <p className="text-xs text-zinc-200 font-bold">Cedars-Sinai Medical Center (ER)</p>
          <p className="text-[10px] text-zinc-500">8700 Beverly Blvd, LA CA • Direct: (310) 423-3277 • Distance: 3.2 mi</p>
        </div>
      </div>

      {/* Main Call Times Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {meta.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
              <div className="flex items-center gap-1.5 text-[8px] uppercase tracking-wider text-zinc-500 font-sans">
                <Icon className="w-3 h-3 text-zinc-400" />
                {m.label}
              </div>
              <div className="text-zinc-100 font-bold text-sm mt-0.5 tabular-nums font-mono">{m.value}</div>
            </div>
          );
        })}
      </div>

      {/* Shooting Schedule Block */}
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300 font-sans flex items-center gap-1.5">
            <Clapperboard className="w-3 h-3 text-zinc-400" />
            Shooting Schedule (7 7/8 Pages Total)
          </h3>
          <span className="text-[9px] font-mono text-zinc-500">SUNRISE: 05:42 AM • SUNSET: 20:12 PM</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[8px] uppercase tracking-wider text-zinc-500 font-sans">
                <th className="py-1.5 pr-2 font-semibold">Time</th>
                <th className="py-1.5 pr-2 font-semibold text-center">Sc</th>
                <th className="py-1.5 pr-2 font-semibold">Set &amp; Description</th>
                <th className="py-1.5 pr-2 font-semibold text-center">Cast</th>
                <th className="py-1.5 pr-2 font-semibold text-center">Pages</th>
                <th className="py-1.5 text-right font-semibold">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300 font-sans">
              {schedule.map((row) => (
                <tr key={row.time} className={row.scene === "—" ? "bg-blue-500/[0.04] text-blue-300 font-medium" : ""}>
                  <td className="py-2 pr-2 font-mono text-[10px] text-zinc-400 whitespace-nowrap">{row.time}</td>
                  <td className="py-2 pr-2 text-center font-bold text-zinc-200 font-mono">{row.scene}</td>
                  <td className="py-2 pr-2">
                    <div className="font-semibold text-zinc-200">
                      <span className="text-[9px] font-mono text-zinc-500 mr-1">{row.intExt}</span>
                      {row.set}
                    </div>
                    <div className="text-[9px] text-zinc-500">{row.desc}</div>
                  </td>
                  <td className="py-2 pr-2 text-center text-zinc-400 font-mono text-[10px]">{row.cast}</td>
                  <td className="py-2 pr-2 text-center font-mono text-[10px] text-zinc-400">{row.pages}</td>
                  <td className="py-2 text-right font-mono text-[9px] text-zinc-500">{row.loc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cast & Talent Call Table */}
      <div className="space-y-1.5 mb-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300 font-sans border-b border-white/5 pb-1.5 flex items-center gap-1.5">
          <Users className="w-3 h-3 text-zinc-400" />
          Cast &amp; Talent Calls
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[8px] uppercase tracking-wider text-zinc-500 font-sans">
                <th className="py-1.5 pr-2 font-semibold">ID</th>
                <th className="py-1.5 pr-2 font-semibold">Character / Actor</th>
                <th className="py-1.5 pr-2 font-semibold text-center">Status</th>
                <th className="py-1.5 pr-2 font-semibold text-center">P/U</th>
                <th className="py-1.5 pr-2 font-semibold text-center">Call</th>
                <th className="py-1.5 pr-2 font-semibold text-center">H/MU</th>
                <th className="py-1.5 pr-2 font-semibold text-center">Set Call</th>
                <th className="py-1.5 text-right font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300 font-sans">
              {cast.map((c) => (
                <tr key={c.id}>
                  <td className="py-2 pr-2 font-bold text-zinc-400 font-mono">{c.id}</td>
                  <td className="py-2 pr-2">
                    <div className="font-semibold text-zinc-200">{c.char}</div>
                    <div className="text-[9px] text-zinc-500">{c.actor}</div>
                  </td>
                  <td className="py-2 pr-2 text-center font-mono text-[9px] text-zinc-400 font-semibold">{c.status}</td>
                  <td className="py-2 pr-2 text-center font-mono text-[10px] text-zinc-400">{c.pu}</td>
                  <td className="py-2 pr-2 text-center font-mono text-[10px] text-zinc-200 font-semibold">{c.call}</td>
                  <td className="py-2 pr-2 text-center font-mono text-[10px] text-zinc-400">{c.hmu}</td>
                  <td className="py-2 pr-2 text-center font-mono text-[10px] text-emerald-400 font-bold">{c.set}</td>
                  <td className="py-2 text-right font-sans text-[9px] text-zinc-500">{c.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Departmental Bulletins Grid */}
      <div className="space-y-1.5">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300 font-sans border-b border-white/5 pb-1.5">
          Departmental Directives &amp; Notes
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {deptNotes.map((d) => (
            <div key={d.dept} className="p-2.5 rounded-lg border border-white/5 bg-white/[0.01]">
              <span className="text-[8px] font-semibold uppercase tracking-wider text-zinc-400 block font-sans mb-0.5">
                {d.dept}
              </span>
              <p className="text-[10px] text-zinc-300 leading-relaxed font-sans">{d.note}</p>
            </div>
          ))}
        </div>
      </div>
    </DocPaper>
  );
}

/* ── Artifact 2: Roster Shortlist (High-Density Candidate Matchmaking Report) ───────────────────────── */
function RosterArtifact() {
  const candidates = [
    { name: "Maya Chen", role: "Lead Commercial Editor", guild: "IATSE 700", rate: "$1,250/day", fit: "96%", projects: "4 Past Shoots", certs: "Avid / DaVinci", status: "Available" },
    { name: "Noa Reyes", role: "Editor & DIT Specialist", guild: "Non-Union", rate: "$950/day", fit: "88%", projects: "2 Past Shoots", certs: "Premiere / DIT", status: "Tentative" },
    { name: "Marcus Vance", role: "Assistant Editor", guild: "IATSE 700", rate: "$750/day", fit: "81%", projects: "1 Past Shoot", certs: "Avid Media Composer", status: "Available" },
    { name: "Vesper Lin", role: "Colorist & Finishing Artist", guild: "CSI Member", rate: "$1,400/day", fit: "74%", projects: "3 Past Shoots", certs: "DaVinci Resolve Studio", status: "Booked" },
  ];

  return (
    <DocPaper title="ROSTER MATCHMAKING REPORT" subtitle="Senior Post-Production Editorial Shortlist · Target Window: Aug 3–7" badge="4 CANDIDATES MATCHED" docRef="RST-EDT-2026" dateStr="JULY 30, 2026">
      {/* Project Scope & Match Criteria */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4 p-3 rounded-xl border border-white/5 bg-white/[0.02]">
        <div className="space-y-0.5">
          <span className="text-[8px] font-semibold uppercase tracking-wider text-zinc-500 font-sans">Role Needed</span>
          <p className="text-xs text-zinc-200 font-bold">Senior Commercial Editor</p>
        </div>
        <div className="space-y-0.5">
          <span className="text-[8px] font-semibold uppercase tracking-wider text-zinc-500 font-sans">Union / Guild Req.</span>
          <p className="text-xs text-zinc-200 font-bold">IATSE Local 700 Preferred</p>
        </div>
        <div className="space-y-0.5">
          <span className="text-[8px] font-semibold uppercase tracking-wider text-zinc-500 font-sans">Labor Rate Ceiling</span>
          <p className="text-xs text-emerald-400 font-bold font-mono">$1,350.00 / Day</p>
        </div>
      </div>

      {/* Primary Recommendation Focus Card */}
      <div className="mb-5 p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-zinc-100 font-sans">TOP RECOMMENDATION: MAYA CHEN</span>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400">96% MATCH SCORE</span>
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed font-sans">
          Maya Chen edited your last 4 commercial campaigns with Director Vesper Lin. Her average turnaround speed is 32% faster than industry baseline with zero rest-period union penalties incurred.
        </p>
      </div>

      {/* Full Candidate Matrix */}
      <div className="space-y-2 mb-5">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300 font-sans border-b border-white/5 pb-1.5">
          Ranked Candidate Roster Matrix
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[8px] uppercase tracking-wider text-zinc-500 font-sans">
                <th className="py-1.5 pr-3 font-semibold">Candidate &amp; Role</th>
                <th className="py-1.5 pr-3 font-semibold">Guild &amp; Certs</th>
                <th className="py-1.5 pr-3 font-semibold text-right">Day Rate</th>
                <th className="py-1.5 pr-3 font-semibold text-center">Fit Score</th>
                <th className="py-1.5 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300 font-sans">
              {candidates.map((c) => (
                <tr key={c.name}>
                  <td className="py-2.5 pr-3">
                    <div className="font-semibold text-zinc-200">{c.name}</div>
                    <div className="text-[9px] text-zinc-500">{c.role} • {c.projects}</div>
                  </td>
                  <td className="py-2.5 pr-3">
                    <div className="text-zinc-300 font-mono text-[10px]">{c.guild}</div>
                    <div className="text-[9px] text-zinc-500">{c.certs}</div>
                  </td>
                  <td className="py-2.5 pr-3 text-right font-mono text-zinc-300 font-semibold">{c.rate}</td>
                  <td className="py-2.5 pr-3 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
                      {c.fit}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-semibold font-sans ${
                      c.status === "Available"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : c.status === "Tentative"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-white/[0.04] text-zinc-500 border border-white/5"
                    }`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Labor Compliance Check */}
      <div className="p-2.5 rounded-lg border border-white/5 bg-white/[0.01] flex items-center justify-between text-[10px] text-zinc-400 font-sans">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
          <span>IATSE Local 700 Rest Period Compliance Verified</span>
        </div>
        <span className="text-emerald-400 font-semibold font-mono">12h Turnaround Cleared</span>
      </div>
    </DocPaper>
  );
}

/* ── Artifact 3: Work Plan (High-Density Work Breakdown Structure) ──────────────────────────────── */
function WorkPlanArtifact() {
  const packages = [
    { id: "WP-01", name: "Pre-Production & Creative Prep", owner: "Noa Reyes", hours: 24, rate: "$120/hr", total: "$18,400.00", status: "Complete" },
    { id: "WP-02", name: "Principal Photography & Shoot Days", owner: "Vesper Lin", hours: 40, rate: "$150/hr", total: "$46,000.00", status: "In Progress" },
    { id: "WP-03", name: "Offline Editorial & Assembly", owner: "Maya Chen", hours: 32, rate: "$130/hr", total: "$32,000.00", status: "Scheduled" },
    { id: "WP-04", name: "Color Grading, VFX & Sound Finish", owner: "Marcus Vance", hours: 16, rate: "$140/hr", total: "$16,000.00", status: "Scheduled" },
  ];

  return (
    <DocPaper title="WORK BREAKDOWN STRUCTURE (WBS)" subtitle="Sensa Launch Campaign · 4 Phased Work Packages" badge="112 TOTAL HOURS" docRef="WP-SNS-2026" dateStr="JULY 30, 2026">
      {/* Scope Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
        <div className="p-2.5 rounded-xl border border-white/5 bg-white/[0.02]">
          <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-sans block">Total Hours</span>
          <span className="text-sm font-bold text-zinc-100 font-mono mt-0.5 block">112 Hours</span>
        </div>
        <div className="p-2.5 rounded-xl border border-white/5 bg-white/[0.02]">
          <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-sans block">Total Packages</span>
          <span className="text-sm font-bold text-zinc-100 font-mono mt-0.5 block">4 Packages</span>
        </div>
        <div className="p-2.5 rounded-xl border border-white/5 bg-white/[0.02]">
          <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-sans block">Est. Duration</span>
          <span className="text-sm font-bold text-zinc-100 font-mono mt-0.5 block">3.5 Weeks</span>
        </div>
        <div className="p-2.5 rounded-xl border border-white/5 bg-white/[0.02]">
          <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-sans block">Estimated Budget</span>
          <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5 block">$128,400.00</span>
        </div>
      </div>

      {/* Package Breakdown Table */}
      <div className="space-y-3 mb-5">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300 font-sans border-b border-white/5 pb-1.5">
          Phased Package Allocations
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[8px] uppercase tracking-wider text-zinc-500 font-sans">
                <th className="py-1.5 pr-3 font-semibold">Package ID</th>
                <th className="py-1.5 pr-3 font-semibold">Work Package Name</th>
                <th className="py-1.5 pr-3 font-semibold">Lead Owner</th>
                <th className="py-1.5 pr-3 font-semibold text-center">Hours</th>
                <th className="py-1.5 pr-3 font-semibold text-right">Allocated ROM</th>
                <th className="py-1.5 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300 font-sans">
              {packages.map((p) => (
                <tr key={p.id}>
                  <td className="py-2.5 pr-3 font-mono text-[10px] text-zinc-500">{p.id}</td>
                  <td className="py-2.5 pr-3 font-semibold text-zinc-200">{p.name}</td>
                  <td className="py-2.5 pr-3 text-zinc-400">{p.owner}</td>
                  <td className="py-2.5 pr-3 text-center font-mono text-zinc-300">{p.hours}h</td>
                  <td className="py-2.5 pr-3 text-right font-mono text-zinc-200 font-semibold">{p.total}</td>
                  <td className="py-2.5 text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-semibold bg-white/[0.04] border border-white/5 text-zinc-400">
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.02] space-y-2.5">
        <span className="text-[8px] font-semibold uppercase tracking-wider text-zinc-400 font-sans block">
          Resource Distribution Across Phases
        </span>
        <div className="space-y-1.5">
          {packages.map((p) => (
            <div key={p.id} className="space-y-1">
              <div className="flex justify-between text-[10px] text-zinc-300 font-sans">
                <span>{p.name}</span>
                <span className="font-mono text-zinc-400">{p.hours}h ({Math.round((p.hours / 112) * 100)}%)</span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-900 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-400/70"
                  style={{ width: `${(p.hours / 112) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </DocPaper>
  );
}

/* ── Artifact 4: ROM Estimate (High-Density AICP-Style Budget) ────────────────────────────── */
function ROMArtifact() {
  const lineItems = [
    { code: "1001", cat: "Above the Line", desc: "Director Daily Commercial Rate", rate: "$4,500/day", qty: "5 days", total: "$22,500.00" },
    { code: "1002", cat: "Above the Line", desc: "Producer Prep + Shoot + Wrap", rate: "$1,500/day", qty: "8 days", total: "$12,000.00" },
    { code: "2001", cat: "Below the Line", desc: "Director of Photography (DP)", rate: "$3,200/day", qty: "3 days", total: "$9,600.00" },
    { code: "2002", cat: "Below the Line", desc: "Gaffer & Key Grip Daily Rates", rate: "$2,800/day", qty: "3 days", total: "$8,400.00" },
    { code: "3001", cat: "Equipment", desc: "Camera Package (ARRI Alexa 35)", rate: "$3,200/day", qty: "3 days", total: "$9,600.00" },
    { code: "3002", cat: "Equipment", desc: "Lighting & Grip 5-Ton Truck", rate: "$2,800/day", qty: "3 days", total: "$8,400.00" },
    { code: "4001", cat: "Locations", desc: "Onyx Stage A Soundstage + Permits", rate: "$6,500/day", qty: "3 days", total: "$19,500.00" },
    { code: "5001", cat: "Post-Production", desc: "Offline Editorial, Color & Mix", rate: "$2,500/day", qty: "10 days", total: "$25,000.00" },
  ];

  return (
    <DocPaper title="ROUGH ORDER OF MAGNITUDE (ROM)" subtitle="Apex Campaign · AICP Format Estimate · LA Market" badge="$173,030 GRAND TOTAL" docRef="EST-APX-2026" dateStr="JULY 30, 2026">
      {/* AICP Schedule Summary Table */}
      <div className="space-y-3 mb-5">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300 font-sans border-b border-white/5 pb-1.5">
          AICP Line Item Schedule
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[8px] uppercase tracking-wider text-zinc-500 font-sans">
                <th className="py-1.5 pr-2 font-semibold">Acct</th>
                <th className="py-1.5 pr-2 font-semibold">Category</th>
                <th className="py-1.5 pr-2 font-semibold">Line Item Description</th>
                <th className="py-1.5 pr-2 font-semibold text-right">Rate</th>
                <th className="py-1.5 pr-2 font-semibold text-center">Qty</th>
                <th className="py-1.5 text-right font-semibold">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300 font-sans">
              {lineItems.map((item) => (
                <tr key={item.code}>
                  <td className="py-2 pr-2 font-mono text-[9px] text-zinc-500">{item.code}</td>
                  <td className="py-2 pr-2 text-[9px] font-mono text-zinc-400">{item.cat}</td>
                  <td className="py-2 pr-2 font-semibold text-zinc-200">{item.desc}</td>
                  <td className="py-2 pr-2 text-right font-mono text-zinc-400">{item.rate}</td>
                  <td className="py-2 pr-2 text-center font-mono text-zinc-400">{item.qty}</td>
                  <td className="py-2 text-right font-mono text-zinc-200 font-semibold">{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Calculations Box */}
      <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.02] space-y-1.5 font-sans">
        <div className="flex justify-between text-xs text-zinc-400">
          <span>Direct Labor Subtotal</span>
          <span className="font-mono text-zinc-200 font-semibold">$115,000.00</span>
        </div>
        <div className="flex justify-between text-xs text-zinc-400">
          <span>Equipment &amp; Locations Subtotal</span>
          <span className="font-mono text-zinc-200 font-semibold">$28,000.00</span>
        </div>
        <div className="flex justify-between text-xs text-zinc-400">
          <span>Contingency Reserve (10%)</span>
          <span className="font-mono text-zinc-200">$14,300.00</span>
        </div>
        <div className="flex justify-between text-xs text-zinc-400 pb-1.5 border-b border-white/5">
          <span>Production Fee &amp; Insurance (10%)</span>
          <span className="font-mono text-zinc-200">$15,730.00</span>
        </div>
        <div className="flex justify-between text-sm font-bold text-white pt-0.5">
          <span>Estimate Grand Total</span>
          <span className="font-mono text-emerald-400 text-base font-bold">$173,030.00</span>
        </div>
      </div>
    </DocPaper>
  );
}

/* ── Artifact 5: Script Breakdown (High-Density Screenplay & Stripboard) ───────────────────────── */
function ScriptArtifact() {
  const elements = [
    { cat: "Cast (2)", items: ["1. Marcus (Lead)", "2. Sarah (Co-Star)"], color: "border-amber-500/30 text-amber-300 bg-amber-500/10" },
    { cat: "Props (3)", items: ["Black Leather Briefcase", "Ceramic Coffee Cup", "Vintage Gold Watch"], color: "border-violet-500/30 text-violet-300 bg-violet-500/10" },
    { cat: "Wardrobe (2)", items: ["Red Silk Scarf", "Marcus Charcoal Suit"], color: "border-blue-500/30 text-blue-300 bg-blue-500/10" },
    { cat: "Vehicles (1)", items: ["1984 Black Sedan"], color: "border-red-500/30 text-red-300 bg-red-500/10" },
  ];

  return (
    <DocPaper title="SCREENPLAY SCENE BREAKDOWN" subtitle="Scene 4 · INT. COFFEE SHOP - DAY · Pgs 2 1/8 · Onyx Stage 4" badge="PARSED &amp; TAGGED" docRef="SCR-SC4-2026" dateStr="JULY 30, 2026">
      {/* Scene Header Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 p-2.5 rounded-xl border border-white/5 bg-white/[0.02] text-xs">
        <div>
          <span className="text-[8px] uppercase tracking-wider text-zinc-500 block">Scene #</span>
          <span className="font-bold text-zinc-200 font-mono">SCENE 4</span>
        </div>
        <div>
          <span className="text-[8px] uppercase tracking-wider text-zinc-500 block">Setting</span>
          <span className="font-bold text-zinc-200 font-mono">INT. COFFEE SHOP</span>
        </div>
        <div>
          <span className="text-[8px] uppercase tracking-wider text-zinc-500 block">Time of Day</span>
          <span className="font-bold text-zinc-200 font-mono">DAY</span>
        </div>
        <div>
          <span className="text-[8px] uppercase tracking-wider text-zinc-500 block">Page Count</span>
          <span className="font-bold text-zinc-200 font-mono">2 1/8 PAGES</span>
        </div>
      </div>

      {/* Screenplay Formatting Container */}
      <div className="font-mono text-xs text-zinc-300 p-4 rounded-xl bg-zinc-950 border border-white/10 space-y-1.5 mb-5 leading-relaxed shadow-inner">
        <p className="text-center font-bold text-zinc-100 uppercase tracking-widest">MARCUS</p>
        <p className="text-center text-zinc-400 max-w-sm mx-auto">
          I told you, the <span className="border border-violet-500/40 text-violet-300 bg-violet-500/15 px-1.5 py-0.5 rounded text-[10px]">briefcase</span> stays with me until the payment is confirmed.
        </p>
        <p className="text-zinc-400 pt-2">
          <span className="border border-amber-500/40 text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded text-[10px]">SARAH</span> sips her <span className="border border-violet-500/40 text-violet-300 bg-violet-500/15 px-1.5 py-0.5 rounded text-[10px]">coffee</span>, quietly adjusting her <span className="border border-blue-500/40 text-blue-300 bg-blue-500/15 px-1.5 py-0.5 rounded text-[10px]">red silk scarf</span> as a <span className="border border-red-500/40 text-red-300 bg-red-500/15 px-1.5 py-0.5 rounded text-[10px]">black sedan</span> idles outside.
        </p>
      </div>

      {/* Element Breakdown Grid */}
      <div className="space-y-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300 font-sans border-b border-white/5 pb-1.5">
          Categorized Breakdown Elements
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {elements.map((e) => (
            <div key={e.cat} className="p-3 rounded-xl border border-white/5 bg-white/[0.02] space-y-1 font-sans">
              <span className={`inline-flex px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-semibold border ${e.color}`}>
                {e.cat}
              </span>
              <ul className="text-xs text-zinc-300 space-y-0.5 pt-0.5">
                {e.items.map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </DocPaper>
  );
}

/* ── Artifact 6: Equipment Requisition (High-Density Rental Manifest) ──────────────────── */
function EquipmentArtifact() {
  const rentalItems = [
    { item: "Cooke Anamorphic/i SF 5-Lens Set (32, 40, 50, 75, 100mm)", vendor: "Onyx Cine Rentals", rate: "$900/day", days: "3 days", total: "$2,700.00" },
    { item: "Teradek Bolt 4K LT 750 Transmitter & Dual Monitor Set", vendor: "Onyx Cine Rentals", rate: "$250/day", days: "3 days", total: "$750.00" },
    { item: "3-Ton Grip & Lighting Truck Package + Expendables", vendor: "Apex Grip & Lighting", rate: "$650/day", days: "3 days", total: "$1,950.00" },
    { item: "ARRI SkyPanel S60-C LED Softlights (×2 Units)", vendor: "Apex Grip & Lighting", rate: "$400/day", days: "3 days", total: "$1,200.00" },
  ];

  return (
    <DocPaper title="EQUIPMENT REQUISITION MANIFEST" subtitle="Camera, Lighting &amp; Grip Package · 3 Shoot Days" badge="PACKAGE LOCKED" docRef="REQ-CAM-2026" dateStr="JULY 30, 2026">
      {/* In-House Gear Reserved Block */}
      <div className="mb-5 p-3.5 rounded-xl border border-white/5 bg-white/[0.02] space-y-1.5 font-sans">
        <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
          <span className="text-xs font-bold text-zinc-100">1. Internal In-House Inventory (Owned Gear)</span>
          <span className="text-[9px] font-semibold text-blue-400 uppercase tracking-wider font-mono">RESERVED ($0.00 RATE)</span>
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed">
          RED V-Raptor 8K VV Camera Body • OConnor 2575D Fluid Head Tripod • Aputure 1200d Daylight LED
        </p>
      </div>

      {/* External Rental Vendors Manifest */}
      <div className="space-y-3 mb-5">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300 font-sans border-b border-white/5 pb-1.5">
          2. External Vendor Rental Manifest
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[8px] uppercase tracking-wider text-zinc-500 font-sans">
                <th className="py-1.5 pr-3 font-semibold">Equipment Item</th>
                <th className="py-1.5 pr-3 font-semibold">Vendor</th>
                <th className="py-1.5 pr-3 font-semibold text-right">Daily Rate</th>
                <th className="py-1.5 pr-3 font-semibold text-center">Duration</th>
                <th className="py-1.5 text-right font-semibold">Total Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300 font-sans">
              {rentalItems.map((r, idx) => (
                <tr key={idx}>
                  <td className="py-2.5 pr-3 font-semibold text-zinc-200">{r.item}</td>
                  <td className="py-2.5 pr-3 text-zinc-400">{r.vendor}</td>
                  <td className="py-2.5 pr-3 text-right font-mono text-zinc-300">{r.rate}</td>
                  <td className="py-2.5 pr-3 text-center font-mono text-zinc-400">{r.days}</td>
                  <td className="py-2.5 text-right font-mono text-zinc-100 font-semibold">{r.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Total Rental Summary Box */}
      <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-between font-sans">
        <div>
          <span className="text-[8px] font-semibold uppercase tracking-wider text-zinc-400 block">Total Rental Commitment</span>
          <span className="text-[10px] text-zinc-500">Certificate of Insurance (COI) verified on file</span>
        </div>
        <span className="text-sm font-bold text-emerald-400 font-mono">$6,600.00 Total</span>
      </div>
    </DocPaper>
  );
}

function TypewriterText({ text, scrollRef }: { text: string; scrollRef: React.RefObject<HTMLDivElement | null> }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 2));
        i += 2;
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      } else {
        setDisplayed(text);
        clearInterval(interval);
      }
    }, 8);

    return () => clearInterval(interval);
  }, [text, scrollRef]);

  return <span>{displayed}</span>;
}
