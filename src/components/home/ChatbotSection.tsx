"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Terminal, CheckCircle2, AlertTriangle, Users, Calendar, DollarSign, FileText, ArrowRight } from "lucide-react";

type PhaseId = "intake" | "crew" | "timeline" | "payments";

interface LogMessage {
  type: "info" | "success" | "warning" | "user";
  text: string;
  timestamp: string;
}

interface KanbanCard {
  code: string;
  title: string;
  column: "todo" | "in-progress" | "done";
  tag: string;
  active?: boolean;
}

interface PhaseData {
  title: string;
  tabLabel: string;
  num: string;
  chatMessages: LogMessage[];
  cards: KanbanCard[];
}

const PHASE_DATA: Record<PhaseId, PhaseData> = {
  intake: {
    title: "AI Intake & Campaign Structure",
    tabLabel: "Intake Brief",
    num: "1.1",
    chatMessages: [
      { type: "user", text: "Process campaign treatment for NYC Winter Apparel Campaign.", timestamp: "10:02 AM" },
      { type: "info", text: "Analyzing brief text... Extracting scope deliverables and crew specs.", timestamp: "10:02 AM" },
      { type: "success", text: "✓ Deliverables structure created: 1x 60s Director's Cut, 3x 15s Social Ads.", timestamp: "10:03 AM" },
      { type: "success", text: "✓ Campaign Memory Brain successfully locked. Retaining historical rates.", timestamp: "10:03 AM" }
    ],
    cards: [
      { code: "ABR-401", title: "Extract Campaign Scope", column: "done", tag: "Intake" },
      { code: "ABR-402", title: "Build Workspace Memory", column: "in-progress", tag: "Brain", active: true },
      { code: "ABR-403", title: "Match Crew Roster", column: "todo", tag: "Roster" },
      { code: "ABR-404", title: "Resolve Stage Bookings", column: "todo", tag: "Calendar" }
    ]
  },
  crew: {
    title: "Verified Roster Matchmaking",
    tabLabel: "Crew Match",
    num: "1.2",
    chatMessages: [
      { type: "user", text: "Assemble optimal crew for Winter Campaign shooting days.", timestamp: "10:05 AM" },
      { type: "info", text: "Scanning verified creator network. Scoring credentials, availability, and rates.", timestamp: "10:05 AM" },
      { type: "success", text: "✓ DP Alex K. matched (98% score). availability verified, rate locked.", timestamp: "10:06 AM" },
      { type: "warning", text: "⚠️ Calendar Collision: Gaffer Jordan M. has a secondary timeline hold.", timestamp: "10:06 AM" },
      { type: "success", text: "✓ Conflict resolved: Backup Gaffer Marcus T. matched (94% score, proposed).", timestamp: "10:07 AM" }
    ],
    cards: [
      { code: "ABR-401", title: "Extract Campaign Scope", column: "done", tag: "Intake" },
      { code: "ABR-402", title: "Build Workspace Memory", column: "done", tag: "Brain" },
      { code: "ABR-403", title: "Gaffer Marcus T. (Proposed)", column: "in-progress", tag: "Matcher", active: true },
      { code: "ABR-404", title: "Resolve Stage Bookings", column: "todo", tag: "Calendar" }
    ]
  },
  timeline: {
    title: "Collision-Free Resource Calendar",
    tabLabel: "Timeline Calendar",
    num: "1.3",
    chatMessages: [
      { type: "user", text: "Lock in schedule reservations and check gear safety.", timestamp: "10:10 AM" },
      { type: "info", text: "Verifying Stage Stage A holds in Brooklyn. Syncing Alexa 35 inventory.", timestamp: "10:10 AM" },
      { type: "success", text: "✓ Studio Stage A booked for Shoot Day 1 & Day 2.", timestamp: "10:11 AM" },
      { type: "success", text: "✓ ARRI Alexa 35 Cam Package confirmed. Zero scheduling collisions.", timestamp: "10:11 AM" },
      { type: "success", text: "✓ Creator availability calendars synchronized successfully.", timestamp: "10:12 AM" }
    ],
    cards: [
      { code: "ABR-401", title: "Extract Campaign Scope", column: "done", tag: "Intake" },
      { code: "ABR-402", title: "Build Workspace Memory", column: "done", tag: "Brain" },
      { code: "ABR-403", title: "Gaffer Marcus T. (Proposed)", column: "done", tag: "Matcher" },
      { code: "ABR-404", title: "Studio Stage A Hold Confirmed", column: "in-progress", tag: "Calendar", active: true }
    ]
  },
  payments: {
    title: "Direct Escrow Settlements",
    tabLabel: "Direct Payouts",
    num: "1.4",
    chatMessages: [
      { type: "user", text: "Approve wrap deliverables and trigger settlements.", timestamp: "10:15 AM" },
      { type: "info", text: "Resolving escrow routing metrics. Triggering Stripe Connect ledgers.", timestamp: "10:15 AM" },
      { type: "success", text: "✓ Deliverables accepted. Escrow released to creator profiles.", timestamp: "10:16 AM" },
      { type: "success", text: "✓ DP Alex K.: $3,600 paid via instant settlement.", timestamp: "10:16 AM" },
      { type: "success", text: "✓ Gaffer Marcus T.: $3,450 paid via instant settlement.", timestamp: "10:17 AM" }
    ],
    cards: [
      { code: "ABR-401", title: "Extract Campaign Scope", column: "done", tag: "Intake" },
      { code: "ABR-402", title: "Build Workspace Memory", column: "done", tag: "Brain" },
      { code: "ABR-403", title: "Gaffer Marcus T. (Proposed)", column: "done", tag: "Matcher" },
      { code: "ABR-404", title: "Direct Creator Settlements", column: "done", tag: "Payments", active: true }
    ]
  }
};

export default function ChatbotSection() {
  const [activePhase, setActivePhase] = useState<PhaseId>("intake");
  const data = PHASE_DATA[activePhase];

  return (
    <section id="showcase-section" className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 bg-abram-black text-white">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-red-500/[0.015] rounded-full blur-[100px] pointer-events-none" />

      {/* Header Info */}
      <div className="max-w-lg mx-auto text-center mb-10 md:mb-14 space-y-3">
        <span className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-zinc-500 block">
          Campaign Workspace Interface
        </span>
        <h2 
          className="text-sm md:text-sm font-medium font-display"
        >
          {data.title}
        </h2>
      </div>

      {/* Main Showcase Canvas */}
      <div className="relative z-10 glass-panel rounded-2xl overflow-hidden border border-white/5 bg-[#050505] shadow-[0_12px_40px_rgba(206,28,28,0.02)]">
        
        {/* Mock Window Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/40">
          <div className="flex items-center gap-2">
            {/* Window control dots */}
            <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
            <span className="ml-3 font-mono text-[10px] text-white/30 tracking-wider">ABRAM WORKSPACE // PHASE_{activePhase.toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-mono text-white/30">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 " />
              Agent Live
            </span>
          </div>
        </div>

        {/* Dual-Pane Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[420px]">
          
          {/* Left Pane: AI Agent Thread Log Feed (lg:col-span-5) */}
          <div className="lg:col-span-5 border-r border-white/5 bg-black/20 p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest pb-2 border-b border-white/5">
                <Terminal className="h-3.5 w-3.5 text-red-500/80" />
                <span>AI Operation Thread</span>
              </div>

              <div className="space-y-3 text-xs">
                <AnimatePresence mode="popLayout">
                  {data.chatMessages.map((msg, idx) => (
                    <motion.div
                      key={`${activePhase}-msg-${idx}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.08 }}
                      className={`p-3 rounded-lg border leading-relaxed ${
                        msg.type === "user"
                          ? "bg-white/[0.02] border-white/5 text-white/80"
                          : msg.type === "success"
                          ? "bg-emerald-500/[0.02] border-emerald-500/10 text-emerald-400/95"
                          : msg.type === "warning"
                          ? "bg-amber-500/[0.02] border-amber-500/10 text-amber-400/95"
                          : "bg-red-500/[0.02] border-red-500/10 text-red-400/90"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1 text-[9px] font-mono tracking-wide text-white/20">
                        <span>{msg.type === "user" ? "User Request" : "System Agent"}</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <p>{msg.text}</p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Bottom Status Panel */}
            <div className="mt-6 pt-3 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-white/30 tracking-wide">
              <span>Sync status: ok</span>
              <span>Workspace Active</span>
            </div>
          </div>

          {/* Right Pane: Kanban board columns (lg:col-span-7) */}
          <div className="lg:col-span-7 p-5 bg-[#070707] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 uppercase tracking-widest pb-2 border-b border-white/5 mb-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Roster Kanban Board
                </span>
                <span>Apparel Shoot Campaign</span>
              </div>

              {/* Kanban Columns */}
              <div className="grid grid-cols-3 gap-3">
                {/* Column definitions */}
                {(["todo", "in-progress", "done"] as const).map((col) => {
                  const filteredCards = data.cards.filter((c) => c.column === col);
                  return (
                    <div key={col} className="space-y-3">
                      {/* Column Header */}
                      <div className="flex items-center gap-1.5 px-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          col === "todo" ? "bg-zinc-600" : col === "in-progress" ? "bg-red-500" : "bg-emerald-500"
                        }`} />
                        <span className="text-[9px] font-mono tracking-wide text-zinc-500">
                          {col === "todo" ? "Todo" : col === "in-progress" ? "In Progress" : "Done"}
                        </span>
                      </div>

                      {/* Cards Stack */}
                      <div className="space-y-2.5">
                        <AnimatePresence mode="popLayout">
                          {filteredCards.map((card) => (
                            <motion.div
                              key={`${activePhase}-${card.code}`}
                              initial={{ opacity: 0, scale: 0.96 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.3 }}
                              className={`p-2.5 rounded-lg border bg-[#121212] transition-all duration-200 select-text ${
                                card.active
                                  ? "border-red-500/35 shadow-[0_0_15px_rgba(206,28,28,0.04)]"
                                  : "border-white/5 hover:border-white/10"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[9px] font-mono text-white/30">{card.code}</span>
                                <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded tracking-wide ${
                                  card.active ? "bg-red-500/10 text-red-400" : "bg-white/5 text-zinc-500"
                                }`}>
                                  {card.tag}
                                </span>
                              </div>
                              <h4 className="text-[10.5px] font-medium text-white/85 leading-snug">{card.title}</h4>
                            </motion.div>
                          ))}
                        </AnimatePresence>

                        {/* Empty state holder */}
                        {filteredCards.length === 0 && (
                          <div className="border border-dashed border-white/5 rounded-lg h-24 flex items-center justify-center">
                            <span className="text-[8px] font-mono uppercase text-white/10">No items</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Status line */}
            <div className="mt-6 pt-3 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-white/30 tracking-wide">
              <span>Roster verified: 100%</span>
              <span>Conflicts: 0 resolved</span>
            </div>
          </div>

        </div>
      </div>

      {/* Horizontal Sub-Navigation Tabs matching Linear screenshot */}
      <div className="mt-8 flex flex-wrap gap-4 sm:gap-8 justify-center text-xs select-none relative z-10">
        {(["intake", "crew", "timeline", "payments"] as const).map((phase) => {
          const isActive = activePhase === phase;
          const phaseData = PHASE_DATA[phase];
          return (
            <button
              key={phase}
              onClick={() => setActivePhase(phase)}
              className={`flex items-center gap-2 cursor-pointer py-1.5 px-3 rounded-full border transition-all duration-200 ${
                isActive 
                  ? "border-red-500/20 bg-red-500/[0.04] text-white" 
                  : "border-transparent text-zinc-500 hover:text-white"
              }`}
            >
              <span className={`font-mono text-[9px] ${isActive ? "text-red-400" : "text-zinc-700"}`}>
                {phaseData.num}
              </span>
              <span>{phaseData.tabLabel}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
