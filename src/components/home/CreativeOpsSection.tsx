"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  FileText, 
  CalendarDays, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Cpu, 
  Coins, 
  UserPlus
} from "lucide-react";
import Link from "next/link";

interface Candidate {
  name: string;
  role: string;
  matchScore: number;
  rate: string;
  avatar: string;
  status: "available" | "booked";
}

const CANDIDATES: Candidate[] = [
  { name: "Sarah Jenkins", role: "Art Director", matchScore: 97, rate: "$850/day", avatar: "SJ", status: "available" },
  { name: "Marcus Chen", role: "Motion Designer", matchScore: 94, rate: "$700/day", avatar: "MC", status: "available" },
  { name: "Elena Rostova", role: "Copywriter", matchScore: 88, rate: "$600/day", avatar: "ER", status: "available" }
];

function InteractiveIntakeMockup() {
  const [step, setStep] = useState<"brief" | "matching" | "roster">("brief");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleNextStep = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      if (step === "brief") setStep("matching");
      else if (step === "matching") setStep("roster");
    }, 850);
  };

  const handleReset = () => {
    setStep("brief");
  };

  return (
    <div className="w-full rounded-2xl border border-white/5 bg-zinc-950/40 p-4 sm:p-6 backdrop-blur-xl relative overflow-visible select-none">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] sm:w-[450px] h-[250px] bg-[#8ECAFF]/[0.012] rounded-full filter blur-[80px] pointer-events-none -z-10" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* LEFT COLUMN: The Interactive Board */}
        <div className="lg:col-span-7 flex flex-col rounded-xl border border-white/5 bg-zinc-950/80 p-4 shadow-inner min-h-[300px] justify-between">
          <div>
            {/* Header tab line */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-4 text-[10px] sm:text-xs text-zinc-500 font-sans">
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-zinc-400" />
                <span className="font-mono text-zinc-400">agency_intake_hub.md</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-white/5 font-mono text-[9px] uppercase tracking-wide">
                Active Project
              </span>
            </div>

            <AnimatePresence mode="wait">
              {step === "brief" && (
                <motion.div
                  key="step-brief"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-3.5"
                >
                  <div className="p-3 bg-zinc-900/40 rounded-lg border border-white/5">
                    <span className="text-[9px] font-semibold text-zinc-500 uppercase font-sans tracking-wider block mb-1">
                      Incoming Creative Brief (Onyx Corp)
                    </span>
                    <p className="text-[11px] text-zinc-300 font-sans leading-relaxed">
                      "Launch campaign for Onyx Horizon: Needs a 30s landing page trailer. Require senior Art Direction for concept, high-end 3D Motion Design, and script copywriting."
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-lg bg-zinc-900/30 border border-white/5 text-center">
                      <span className="text-[9px] text-zinc-500 block">Deliverable</span>
                      <span className="text-[10px] font-semibold text-zinc-300 block mt-0.5">30s Video</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-900/30 border border-white/5 text-center">
                      <span className="text-[9px] text-zinc-500 block">Deadline</span>
                      <span className="text-[10px] font-semibold text-zinc-300 block mt-0.5">July 15</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-900/30 border border-white/5 text-center">
                      <span className="text-[9px] text-zinc-500 block">Est. Budget</span>
                      <span className="text-[10px] font-semibold text-zinc-300 block mt-0.5">$18,500</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === "matching" && (
                <motion.div
                  key="step-matching"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-3"
                >
                  <div className="flex justify-between items-center px-1 mb-1">
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">
                      AI Crew Recommendations
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500">Searching 85+ Contractors</span>
                  </div>

                  <div className="space-y-2">
                    {CANDIDATES.map((cand, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-zinc-900/40 border border-white/5 rounded-lg">
                        <div className="flex items-center gap-2.5">
                          <div className="w-6.5 h-6.5 rounded-full bg-zinc-800 border border-white/8 flex items-center justify-center text-[10px] font-bold text-zinc-300 font-sans">
                            {cand.avatar}
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-zinc-200 block">{cand.name}</span>
                            <span className="text-[9px] text-zinc-500 block font-mono">{cand.role} • {cand.rate}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-semibold text-emerald-400">
                            {cand.matchScore}% match
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === "roster" && (
                <motion.div
                  key="step-roster"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-3"
                >
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide">
                        Roster Locked & Scheduled
                      </h4>
                      <p className="text-[10px] text-emerald-300/80 leading-relaxed font-sans mt-0.5">
                        All contract items generated. Calendar bookings created for Sarah, Marcus, and Elena.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 border border-white/5 bg-zinc-900/20 p-2.5 rounded-lg">
                    <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono">
                      <span>Roster Match Rate:</span>
                      <span className="text-zinc-200">93% average</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono">
                      <span>Total Booked Rate:</span>
                      <span className="text-zinc-200">$2,150 / day</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono">
                      <span>Contracts Generated:</span>
                      <span className="text-emerald-400 font-semibold">3 Active (Ready to Sign)</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
            {step !== "roster" ? (
              <span className="text-[9px] text-zinc-500 font-sans">
                Interactive Pipeline Demo
              </span>
            ) : (
              <span className="text-[9px] text-zinc-500 font-sans">
                Roster match completed
              </span>
            )}
            
            <div className="flex gap-2">
              {isProcessing ? (
                <button disabled className="btn-glass px-4.5 py-1.5 text-[10px] opacity-60 cursor-not-allowed">
                  <span>Processing...</span>
                </button>
              ) : step === "roster" ? (
                <button onClick={handleReset} className="btn-glass px-4.5 py-1.5 text-[10px]">
                  <span>Reset Demo</span>
                </button>
              ) : (
                <button onClick={handleNextStep} className="btn-primary px-4.5 py-1.5 text-[10px] flex items-center gap-1">
                  <span>{step === "brief" ? "Parse with AI Matchmaker" : "Lock Crew & Book"}</span>
                  <ArrowRight className="w-3 h-3 text-zinc-950" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Operations Controls */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-white/5 bg-zinc-950/80 p-4 shadow-inner">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-[9px] font-semibold tracking-wider text-zinc-500 uppercase font-sans">
                Staffing Status
              </span>
              <span className="text-[9px] font-mono text-zinc-400 px-1.5 py-0.5 rounded bg-zinc-900 border border-white/5">
                Pipeline V1
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="p-2.5 rounded-lg bg-zinc-900/30 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-[10px] font-sans text-zinc-300">Brief Intent Parsing</span>
                </div>
                <span className={`text-[9px] font-semibold font-mono ${step !== "brief" ? "text-emerald-400" : "text-zinc-500"}`}>
                  {step !== "brief" ? "Completed" : "Ready"}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-900/30 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-[10px] font-sans text-zinc-300">Contractor Roster Check</span>
                </div>
                <span className={`text-[9px] font-semibold font-mono ${step === "roster" ? "text-emerald-400" : step === "matching" ? "text-amber-400" : "text-zinc-500"}`}>
                  {step === "roster" ? "3 Matches" : step === "matching" ? "Matching..." : "Pending"}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-900/30 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-[10px] font-sans text-zinc-300">Project Budget Matching</span>
                </div>
                <span className={`text-[9px] font-semibold font-mono ${step === "roster" ? "text-emerald-400" : "text-zinc-500"}`}>
                  {step === "roster" ? "Budget Optimized" : "Pending"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[10px] font-sans text-zinc-500">
              <span>Intake Pipeline:</span>
              <span className="text-zinc-400 font-mono">100% automated</span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-sans text-zinc-500">
              <span>Time saved:</span>
              <span className="text-emerald-400 font-mono font-semibold">~4.5 hours / project</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function CreativeOpsSection() {
  const features = [
    {
      icon: FileText,
      title: "Client Intake Hub",
      description: "Convert chaotic creative briefs, files, and templates into structured project plans automatically."
    },
    {
      icon: Users,
      title: "Crew Roster Matrix",
      description: "Manage contractor databases, day rates, skill tagging, and profile parameters in one clean portal."
    },
    {
      icon: CalendarDays,
      title: "Smart Scheduling",
      description: "Track team utilization, match projects with talent, and schedule without calendar overlaps."
    },
    {
      icon: Sparkles,
      title: "AI-Powered Matchmaking",
      description: "Run automated availability searches to lock your dream production crew in seconds."
    }
  ];

  return (
    <section className="relative py-16 md:py-24 lg:py-32 border-t border-white/5 bg-transparent overflow-hidden">
      {/* Ambient background glows */}
      <div 
        className="absolute top-1/2 right-1/3 translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] lg:w-[600px] lg:h-[600px] bg-zinc-800/[0.03] rounded-full filter blur-[80px] lg:blur-[130px] pointer-events-none" 
      />
      <div 
        className="absolute top-1/4 left-1/4 w-[250px] h-[250px] lg:w-[450px] lg:h-[450px] bg-white/[0.008] rounded-full filter blur-[90px] lg:blur-[110px] pointer-events-none" 
      />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center mb-16">
          
          {/* Copy Side */}
          <div className="lg:col-span-5 space-y-6">
            {/* Overline Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/[0.02] text-zinc-400 text-[10px] font-semibold tracking-[0.2em] uppercase w-fit">
              CREATIVE OPERATIONS
            </div>

            {/* Header */}
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-50 uppercase font-display leading-tight">
              Scale agency operations.
            </h2>

            {/* Description */}
            <p className="text-sm md:text-base font-normal leading-7 text-zinc-400 max-w-xl font-sans">
              Accelerate client intake, schedule crew rosters, and match project briefs with the ideal talent automatically. Reduce booking friction and optimize resource allocation across all campaigns.
            </p>

            {/* CTA */}
            <div className="pt-4">
              <Link 
                href="/agency"
                className="btn-glass px-5 py-2.5 text-xs rounded-full inline-flex items-center gap-1.5 transition-all duration-200 min-h-[44px] group"
              >
                <span>Explore Creative Ops</span>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-400 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* Graphic Side */}
          <div className="lg:col-span-7 w-full">
            <InteractiveIntakeMockup />
          </div>
        </div>

        {/* 4 Bottom Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-16 border-t border-white/5">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="flex flex-col space-y-4 p-6 rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md hover:border-white/12 hover:bg-zinc-900/30 transition-all duration-200 select-none group"
              >
                <div className="text-zinc-400 group-hover:text-zinc-100 transition-colors duration-200">
                  <Icon className="h-5 w-5 stroke-[1.4]" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-200 tracking-tight font-sans">
                  {feature.title}
                </h3>
                <p className="text-sm font-normal leading-relaxed text-zinc-400 font-sans">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
