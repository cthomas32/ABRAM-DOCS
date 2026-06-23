"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Calendar, 
  Clock, 
  Sparkles, 
  DollarSign, 
  Users, 
  ShieldCheck, 
  CloudSun,
  MapPin,
  MessageSquare,
  Film,
  UserCheck
} from "lucide-react";
import ScriptBreakdownMockup from "@/components/film-production/ScriptBreakdownMockup";
import { revealVariants, staggerContainer } from "@/lib/motion";

// Custom Slack Icon component to bypass Lucide package limitations (force recompile cache)
const SlackIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className} 
    fill="currentColor" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523 2.528 2.528 0 0 1-2.522-2.523 2.528 2.528 0 0 1 2.522-2.52h2.52v2.52zm1.261 0a2.528 2.528 0 0 1 2.52-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.042a2.528 2.528 0 0 1-2.522 2.52H8.823a2.528 2.528 0 0 1-2.52-2.52v-5.042zM8.823 5.043a2.528 2.528 0 0 1 2.52-2.522 2.528 2.528 0 0 1 2.522 2.522v2.52h-2.522a2.528 2.528 0 0 1-2.52-2.52zm0 1.261a2.528 2.528 0 0 1 2.52 2.52v5.043a2.528 2.528 0 0 1-2.522 2.522H3.778a2.528 2.528 0 0 1-2.522-2.522 2.528 2.528 0 0 1 2.522-2.52h5.043zM18.958 8.823a2.528 2.528 0 0 1 2.522-2.52 2.528 2.528 0 0 1 2.52 2.52a2.528 2.528 0 0 1-2.52 2.52h-2.522v-2.52zm-1.261 0a2.528 2.528 0 0 1-2.52 2.52h-5.043a2.528 2.528 0 0 1-2.522-2.52V3.78a2.528 2.528 0 0 1 2.522-2.52h5.043a2.528 2.528 0 0 1 2.52 2.52v5.043zm-2.52 10.134a2.528 2.528 0 0 1-2.52 2.522 2.528 2.528 0 0 1-2.522-2.522v-2.52h2.522a2.528 2.528 0 0 1 2.52 2.52zm0-1.261a2.528 2.528 0 0 1-2.52-2.52v-5.043a2.528 2.528 0 0 1 2.522-2.522h5.043a2.528 2.528 0 0 1 2.522 2.522v5.043a2.528 2.528 0 0 1-2.522 2.52h-5.043z" />
  </svg>
);

export default function FilmProductionHubClient() {
  return (
    <main className="text-zinc-100 overflow-x-hidden pt-24 pb-20 select-none relative z-10 isolate">
      {/* Absolute Ambient Page Glows */}
      <div className="absolute top-12 left-1/4 w-[300px] md:w-[600px] h-[300px] bg-gradient-to-tr from-white/[0.01] via-zinc-800/10 to-transparent rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[40%] right-1/4 w-[280px] md:w-[500px] h-[280px] bg-[#8ECAFF]/[0.02] rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="relative w-full min-h-[40vh] md:min-h-[50vh] flex flex-col justify-center py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-transparent overflow-visible mb-16 md:mb-24">
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
              Film Production Suite
            </motion.span>

            {/* Title */}
            <motion.h1
              variants={revealVariants}
              custom={0.1}
              className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white leading-[1.12] mb-6 font-sans select-text"
            >
              Creative Control Cockpit.
              <span className="block mt-[8px] text-zinc-500">
                Connected logistics. Automated workflows.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={revealVariants}
              custom={0.2}
              className="text-base sm:text-lg md:text-xl font-normal leading-7 text-zinc-400 max-w-2xl mx-auto mb-8 font-sans select-text"
            >
              Streamline physical production in a unified environment. Analyze daily burn rates, coordinate crew turnaround safety margins, and break down screenplays with advanced parsing.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Grid of Featured Modules */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 bg-transparent overflow-visible">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            
            {/* MODULE 1: Timeline Scheduling & Budgeting */}
            <div className="rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md hover:border-white/10 hover:bg-zinc-900/30 transition-all duration-300 p-6 flex flex-col justify-between shadow-lg relative overflow-visible group">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold tracking-tight text-zinc-50 font-sans">
                      Timeline Scheduling & Budgeting
                    </h2>
                    <span className="text-[9px] font-medium tracking-widest uppercase text-zinc-500">
                      Live Playground
                    </span>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed font-sans mb-6">
                  Experience a connected stripboard schedule. Check Day Out of Days (DOOD) actor holds and calculate union rest-period compliance on the fly.
                </p>

                {/* Visual Stripboard Preview inside Card */}
                <div className="space-y-2 mb-6 font-mono text-[10px] select-none opacity-80 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-2 p-1.5 rounded bg-zinc-950/40 border border-white/5 text-zinc-400">
                    <span className="h-3 w-1.5 rounded-full bg-amber-400" />
                    <span>Sc. 12 // INT. LIVING ROOM</span>
                    <span className="ml-auto text-zinc-500">1 4/8 pgs</span>
                  </div>
                  <div className="flex items-center gap-2 p-1.5 rounded bg-amber-500/5 border border-amber-500/10 text-amber-400">
                    <span className="h-3 w-1.5 rounded-full bg-emerald-500" />
                    <span>Sc. 13 // EXT. COURTYARD</span>
                    <span className="ml-auto">SAG warning</span>
                  </div>
                </div>
              </div>

              <div>
                <Link 
                  href="/film-production/scheduling-budgeting" 
                  className="btn-glass w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-full text-xs font-medium min-h-[44px] md:min-h-0"
                >
                  <span>Launch Playground</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                </Link>
              </div>
            </div>

            {/* MODULE 2: Digital Call Sheets */}
            <div className="rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md hover:border-white/10 hover:bg-zinc-900/30 transition-all duration-300 p-6 flex flex-col justify-between shadow-lg relative overflow-visible group">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold tracking-tight text-zinc-50 font-sans">
                      Digital Call Sheets
                    </h2>
                    <span className="text-[9px] font-medium tracking-widest uppercase text-zinc-500">
                      Logistics Dashboard
                    </span>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed font-sans mb-6">
                  Maintain control over basecamp logistics, publish daily call details, and coordinate crew transport and safety parameters in real-time.
                </p>

                {/* Visual Call Board Preview inside Card */}
                <div className="grid grid-cols-2 gap-2 mb-6 font-sans text-[10px] select-none opacity-80 group-hover:opacity-100 transition-opacity">
                  <div className="p-2 rounded bg-zinc-950/40 border border-white/5 space-y-1">
                    <span className="text-zinc-500 block uppercase text-[8px] tracking-wide">Crew Call</span>
                    <span className="font-mono text-zinc-300 font-semibold">07:00 AM</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-950/40 border border-white/5 space-y-1">
                    <span className="text-zinc-500 block uppercase text-[8px] tracking-wide">Rest Turnaround</span>
                    <span className="font-mono text-emerald-400 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> OK
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <Link 
                  href="/film-production/call-sheets" 
                  className="btn-glass w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-full text-xs font-medium min-h-[44px] md:min-h-0"
                >
                  <span>Open Call Sheets</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                </Link>
              </div>
            </div>

          </div>

          {/* FEATURED MODULE 3: Script Breakdown - Large full-width card */}
          <div className="rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md hover:border-white/8 hover:bg-zinc-900/10 transition-all duration-300 p-6 md:p-8 shadow-xl relative overflow-visible space-y-6">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-zinc-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold tracking-tight text-zinc-50 font-sans">
                    Script Breakdown
                  </h2>
                  <span className="text-[9px] font-medium tracking-widest uppercase text-zinc-500 block">
                    AI SCREENPLAY PARSER
                  </span>
                </div>
              </div>
              <p className="text-xs text-zinc-400 max-w-md font-sans leading-relaxed md:text-right">
                Synthesize standard screenplay documents automatically into categorizable shooting items, and export directly to scheduling.
              </p>
            </div>

            {/* Script Breakdown Mockup Component Embedded */}
            <div className="w-full">
              <ScriptBreakdownMockup />
            </div>

            <div className="flex justify-start">
              <Link 
                href="/film-production/script-breakdown" 
                className="btn-glass w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-full text-xs font-medium min-h-[44px] md:min-h-0"
              >
                <span>Launch Breakdown Engine</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
              </Link>
            </div>

          </div>

        </div>
      </section>

      {/* Collaboration Sync Summary Banner */}
      <section className="relative w-full py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-transparent overflow-visible border-t border-white/[0.08] mt-16 md:mt-24">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] bg-indigo-950/20 rounded-full blur-[100px] pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto">
          <div className="glass-panel rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md p-8 md:p-10 shadow-xl space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 font-sans block">
                CREW SYNC & INTEGRATION
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
                The Four Pillars of Production Collaboration
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed font-sans">
                Keep directors, producers, freelancers, and clients aligned in real-time. ABRAM bridges core logistics with instant communication.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Pillar 1 */}
              <div className="space-y-3 p-4 rounded-xl border border-white/5 bg-zinc-950/40 hover:border-white/10 hover:bg-zinc-900/20 transition-all">
                <div className="p-2.5 rounded-lg border border-white/5 bg-white/[0.03] text-white w-fit">
                  <MessageSquare className="w-5 h-5 text-zinc-300" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 font-sans">1. Contextual Activity Feeds</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Consolidate review logs and thread messages directly inside deliverables to track progress in real time.
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="space-y-3 p-4 rounded-xl border border-white/5 bg-zinc-950/40 hover:border-white/10 hover:bg-zinc-900/20 transition-all">
                <div className="p-2.5 rounded-lg border border-white/5 bg-white/[0.03] text-white w-fit">
                  <SlackIcon className="w-5 h-5 text-zinc-300" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 font-sans">2. Interactive Slack Broadcasts</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Route project-bound updates and handle crew check-in actions using serverless edge webhooks.
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="space-y-3 p-4 rounded-xl border border-white/5 bg-zinc-950/40 hover:border-white/10 hover:bg-zinc-900/20 transition-all">
                <div className="p-2.5 rounded-lg border border-white/5 bg-white/[0.03] text-white w-fit">
                  <Film className="w-5 h-5 text-zinc-300" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 font-sans">3. Frame.io Workspace Sync</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Synchronize media review directories and provision new creative folders directly within the platform's review dashboard.
                </p>
              </div>

              {/* Pillar 4 */}
              <div className="space-y-3 p-4 rounded-xl border border-white/5 bg-zinc-950/40 hover:border-white/10 hover:bg-zinc-900/20 transition-all">
                <div className="p-2.5 rounded-lg border border-white/5 bg-white/[0.03] text-white w-fit">
                  <UserCheck className="w-5 h-5 text-zinc-300" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 font-sans">4. One-Click Public RSVPs</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Dispatch booking invites that let crew accept holds and update their utilization calendar.
                </p>
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <Link 
                href="/production-brain"
                className="btn-glass w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-full text-xs font-medium min-h-[44px] md:min-h-0"
              >
                <span>Explore Collaboration Brain</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
