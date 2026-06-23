"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Sparkles, 
  FileText, 
  Users, 
  Calendar, 
  Layers, 
  Clock, 
  ShieldCheck, 
  Activity, 
  ChevronRight,
  Workflow,
  MousePointerClick
} from "lucide-react";
import { revealVariants, staggerContainer } from "@/lib/motion";

export default function AgencyHubClient() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "ABRAM Creative Operations Hub",
    "description": "Creative operations and studio logistics management in the ABRAM creative production platform.",
    "url": "https://abram.network/agency",
    "isPartOf": { "@id": "https://abram.network/#website" },
    "publisher": { "@id": "https://abram.network/#organization" },
    "mainEntity": {
      "@type": "SoftwareApplication",
      "name": "ABRAM Creative Operations",
      "applicationCategory": "BusinessApplication",
      "featureList": [
        "AI-Powered Project Brief Intake Wizard",
        "Weighted Contractor Suitability Indexing",
        "Multi-Day Timeline Resource Scheduling",
        "Union Turnaround Margin Verification",
        "Real-Time Schedule Overlap Resolution"
      ]
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <main className="text-zinc-100 overflow-x-hidden pt-24 pb-20 select-none relative z-10 isolate">
        {/* Absolute Ambient Page Glows */}
        <div className="absolute top-12 left-1/4 w-[300px] md:w-[600px] h-[300px] bg-gradient-to-tr from-white/[0.01] via-zinc-800/10 to-transparent rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" />
        <div className="absolute top-[40%] right-1/4 w-[280px] md:w-[500px] h-[280px] bg-[#8ECAFF]/[0.015] rounded-full blur-[100px] pointer-events-none -z-10" />

        {/* Hero Section */}
        <section className="relative w-full min-h-[40vh] md:min-h-[50vh] flex flex-col justify-center py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-transparent overflow-visible mb-12 md:mb-16">
          <div className="max-w-7xl mx-auto w-full">
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto w-full"
            >
              {/* Overline Tag */}
              <motion.span 
                variants={revealVariants}
                custom={0.0}
                className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-4 font-sans block"
              >
                Creative Operations Suite
              </motion.span>

              {/* Title */}
              <motion.h1
                variants={revealVariants}
                custom={0.1}
                className="text-3xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white leading-[1.12] mb-6 font-sans select-text"
              >
                Studio Orchestration.
                <span className="block mt-[8px] text-zinc-500">
                  AI matchmakers. Compliant timelines.
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                variants={revealVariants}
                custom={0.2}
                className="text-base sm:text-lg md:text-xl font-normal leading-7 text-zinc-400 max-w-2xl mx-auto mb-8 font-sans select-text"
              >
                Bridge the gap between client request briefs, contractor crewing, and multi-day scheduling. Scale your studio or agency production throughput without logistical friction.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Core Product Cards Grid */}
        <section className="relative w-full px-4 sm:px-6 lg:px-8 bg-transparent overflow-visible mb-16 md:mb-24">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              
              {/* Card 1: Client Intake Showcase */}
              <div className="rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md hover:border-white/10 hover:bg-zinc-900/30 transition-all duration-300 p-6 flex flex-col justify-between shadow-lg relative overflow-visible group">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold tracking-tight text-zinc-50 font-sans">
                        Client Request & Intake
                      </h2>
                      <span className="text-[9px] font-medium tracking-widest uppercase text-zinc-500 font-mono">
                        Brief Intelligence
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    Construct custom intake forms and feed project briefs into our AI scoping wizard. Instantly parse deliverables, suggest timelines, and output budget models.
                  </p>

                  {/* Inline visual preview */}
                  <div className="p-3.5 rounded bg-zinc-950/40 border border-white/5 text-[10px] font-mono space-y-2 opacity-80 group-hover:opacity-100 transition-opacity select-none">
                    <div className="flex items-center justify-between text-zinc-500 gap-2">
                      <span className="truncate">helix_brief.txt</span>
                      <span className="text-emerald-400 flex items-center gap-1 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Parsed
                      </span>
                    </div>
                    <div className="text-zinc-400 truncate">
                      Deliverables: 3x 3D Reels, 1x Vector Logo
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full w-4/5 bg-white rounded-full" />
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <Link 
                    href="/agency/client-intake" 
                    className="btn-glass w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-full text-xs font-medium min-h-[44px]"
                  >
                    <span>Intake Portal</span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                  </Link>
                </div>
              </div>

              {/* Card 2: Crew & Assets Roster Showcase */}
              <div className="rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md hover:border-white/10 hover:bg-zinc-900/30 transition-all duration-300 p-6 flex flex-col justify-between shadow-lg relative overflow-visible group">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center">
                      <Users className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold tracking-tight text-zinc-50 font-sans">
                        Crew & Assets Roster
                      </h2>
                      <span className="text-[9px] font-medium tracking-widest uppercase text-zinc-500 font-mono">
                        Matchmaker Engine
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    Keep a high-availability database of motion designers, copywriters, and studios. Match them dynamically utilizing weighted suitability index scoring parameters.
                  </p>

                  {/* Inline visual preview */}
                  <div className="p-3.5 rounded bg-zinc-950/40 border border-white/5 text-[10px] font-mono space-y-2 opacity-80 group-hover:opacity-100 transition-opacity select-none">
                    <div className="flex justify-between items-center text-zinc-300 gap-2">
                      <span className="truncate">Vesper Lin (3D Lead)</span>
                      <span className="text-emerald-400 shrink-0">98% Match</span>
                    </div>
                    <div className="flex justify-between items-center text-zinc-500 gap-2">
                      <span className="truncate">Rate: $700/d</span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">Available</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <Link 
                    href="/agency/crew-roster" 
                    className="btn-glass w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-full text-xs font-medium min-h-[44px]"
                  >
                    <span>Roster Board</span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                  </Link>
                </div>
              </div>

              {/* Card 3: Smart Scheduling Showcase */}
              <div className="rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md hover:border-white/10 hover:bg-zinc-900/30 transition-all duration-300 p-6 flex flex-col justify-between shadow-lg relative overflow-visible group">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold tracking-tight text-zinc-50 font-sans">
                        Smart Scheduling
                      </h2>
                      <span className="text-[9px] font-medium tracking-widest uppercase text-zinc-500 font-mono">
                        Timeline Optimizer
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    View active timelines and verify contractor hour limits. Detect and resolve double-bookings or union rest turnaround violations automatically with our conflict resolver.
                  </p>

                  {/* Inline visual preview */}
                  <div className="p-3.5 rounded bg-zinc-950/40 border border-white/5 text-[10px] font-mono space-y-2 opacity-80 group-hover:opacity-100 transition-opacity select-none">
                    <div className="flex justify-between items-center text-red-400 bg-red-500/5 border border-red-500/15 p-1 rounded gap-2">
                      <span className="flex items-center gap-1 truncate">⚠️ Schedule Conflict</span>
                      <span className="shrink-0">Wed Overlap</span>
                    </div>
                    <div className="text-zinc-500 text-[9px] uppercase truncate">
                      AI resolution recommended →
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <Link 
                    href="/agency/smart-scheduling" 
                    className="btn-glass w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-full text-xs font-medium min-h-[44px]"
                  >
                    <span>Timeline Calendar</span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Operational Workflow Showcase */}
        <section className="relative w-full py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-transparent overflow-visible border-t border-white/[0.08]">
          <div className="max-w-7xl mx-auto">
            <div className="glass-panel rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md p-8 md:p-10 shadow-xl space-y-12">
              
              <div className="text-center max-w-2xl mx-auto space-y-3">
                <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 font-sans block">
                  Studio Logistics Workflow
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
                  The End-to-End Creative Pipeline
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
                  ABRAM unifies intake scoping, dynamic contractor matchmaking, and conflict-free timeline allocations into a single automated lifecycle loop.
                </p>
              </div>

              {/* Horizontal / Vertical Stepper Diagram */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">

                {/* Step 1 */}
                <div className="space-y-3 text-center md:text-left">
                  <div className="w-9 h-9 rounded-full bg-zinc-900 border border-white/5 text-white flex items-center justify-center mx-auto md:mx-0 font-mono text-xs font-bold shadow-md">
                    01
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-100 font-sans">AI-Scoped Intake Briefs</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans max-w-xs mx-auto md:mx-0">
                    Clients submit project objectives. The brief scanner extracts deliverable formats and estimates work scopes instantly.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="space-y-3 text-center md:text-left">
                  <div className="w-9 h-9 rounded-full bg-zinc-900 border border-white/5 text-white flex items-center justify-center mx-auto md:mx-0 font-mono text-xs font-bold shadow-md">
                    02
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-100 font-sans">Weighted Matchmaking</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans max-w-xs mx-auto md:mx-0">
                    Map contractor skills and limits. High-match candidates are automatically shortlisted to ensure optimal project coverage.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="space-y-3 text-center md:text-left">
                  <div className="w-9 h-9 rounded-full bg-zinc-900 border border-white/5 text-white flex items-center justify-center mx-auto md:mx-0 font-mono text-xs font-bold shadow-md">
                    03
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-100 font-sans">Conflict-Free Scheduling</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans max-w-xs mx-auto md:mx-0">
                    Visualize allocations in a multi-row calendar. Resolve double-bookings and rest margin warnings using one-click AI optimization.
                  </p>
                </div>

              </div>

              {/* Sandbox Callout */}
              <div className="pt-6 flex justify-center">
                <Link
                  href="/production-brain"
                  className="btn-glass inline-flex items-center justify-center gap-1.5 rounded-full text-xs font-medium min-h-[44px]"
                >
                  <span>Explore Workspace Intelligence</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                </Link>
              </div>

            </div>
          </div>
        </section>
      </main>
    </>
  );
}
