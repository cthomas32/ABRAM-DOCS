"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Calendar, DollarSign, Clock, AlertTriangle, ArrowDown } from "lucide-react";
import { revealVariants, staggerContainer } from "@/lib/motion";

export default function HeroSection() {
  return (
    <section className="relative w-full py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-transparent overflow-visible select-none">
      
      {/* Absolute Ambient Glow (No container clipping due to parent overflow-visible) */}
      <div 
        className="absolute top-12 left-1/2 -translate-x-1/2 w-[320px] md:w-[600px] h-[350px] bg-gradient-to-tr from-white/[0.01] via-zinc-800/10 to-transparent rounded-full blur-[100px] pointer-events-none -z-10"
      />
      
      <div className="max-w-7xl mx-auto">
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="relative flex flex-col items-center justify-center text-center max-w-4xl mx-auto w-full"
        >
          {/* Overline Display Tag (Archivo Display Font, uppercase section tag) */}
          <motion.span 
            variants={revealVariants}
            custom={0.0}
            className="font-display text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-4"
          >
            Scheduling & Budgeting
          </motion.span>

          {/* Hero Headline (Display Token) */}
          <motion.h1
            variants={revealVariants}
            custom={0.1}
            className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white leading-[1.12] mb-6 font-sans select-text"
          >
            The Stripboard, Reimagined.
            <span className="block mt-[8px] text-zinc-500">
              Connected to your budget.
            </span>
          </motion.h1>

          {/* Hero Subtitle (Body Token) */}
          <motion.p
            variants={revealVariants}
            custom={0.2}
            className="text-base sm:text-lg md:text-xl font-normal leading-7 text-zinc-400 max-w-2xl mx-auto mb-8 font-sans select-text"
          >
            Integrate scheduling and financial forecasting in a unified workspace. Predict union rest violations, analyze daily burn rates, and adjust locations on the fly.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={revealVariants}
            custom={0.3}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16 w-full px-4 sm:px-0"
          >
            <a
              href="https://app.abram.network"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary group w-full sm:w-auto min-h-[44px] md:min-h-0 flex items-center justify-center gap-1.5"
            >
              <span>Start Building</span>
              <ArrowUpRight className="h-4.5 w-4.5 opacity-75 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
            <a 
              href="#interactive-playground" 
              className="btn-glass group flex items-center justify-center gap-1 cursor-pointer w-full sm:w-auto min-h-[44px] md:min-h-0"
            >
              <span>Learn More</span>
              <ArrowDown className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100 group-hover:translate-y-0.5 transition-all duration-200" />
            </a>
          </motion.div>

          {/* Interactive Product Mock Container (High-Fidelity Mockup) */}
          <motion.div
            variants={revealVariants}
            custom={0.4}
            className="w-full max-w-4xl mx-auto relative rounded-2xl border border-white/8 bg-zinc-950/20 backdrop-blur-md p-3 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
          >
            {/* Header elements inside the mockup */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4 text-[10px] sm:text-xs text-zinc-500">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-zinc-400 font-semibold uppercase">abram_brain: main_board</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] text-zinc-400 md:hidden block font-mono animate-pulse">Swipe to view →</span>
                <span>Total Days: <strong className="text-white">18</strong></span>
                <span>Est. Budget: <strong className="text-white">$2,450,000</strong></span>
              </div>
            </div>

            {/* Simulated Stripboard rows */}
            <div className="space-y-2 overflow-x-auto select-none scrollbar-thin pb-2">
              <div className="min-w-[650px] space-y-2">
                
                {/* Scene 1 - INT. DAY (Yellow strip) */}
                <div className="grid grid-cols-[14px_50px_36px_80px_1fr_120px_100px_50px] items-center gap-x-3 px-3 py-2 rounded-lg border border-white/5 bg-zinc-950/40 text-xs text-zinc-300 hover:border-white/10 hover:bg-white/[0.01] transition-all">
                  <div className="h-4 w-full rounded bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.3)]" />
                  <div className="font-mono font-medium text-zinc-400">12</div>
                  <div className="font-mono text-zinc-400">INT</div>
                  <div className="font-mono text-zinc-400">DAY</div>
                  <div className="truncate font-medium text-zinc-100 text-left">Leo decodes the ledger</div>
                  <div className="truncate text-zinc-400 text-left">Living Room</div>
                  <div className="font-mono text-right text-zinc-400">1 4/8 pgs</div>
                  <div className="font-mono text-center text-zinc-400">1, 2, 4</div>
                </div>

                {/* Scene 2 - EXT. NIGHT (Green strip with Warning Alert) */}
                <div className="grid grid-cols-[14px_50px_36px_80px_1fr_120px_100px_50px] items-center gap-x-3 px-3 py-2 rounded-lg border border-amber-500/25 bg-amber-500/5 text-xs text-zinc-300 hover:border-white/10 transition-all relative">
                  <div className="h-4 w-full rounded bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                  <div className="font-mono font-medium text-zinc-400">13</div>
                  <div className="font-mono text-zinc-400">EXT</div>
                  <div className="font-mono text-zinc-400">NIGHT</div>
                  <div className="truncate font-medium text-zinc-100 text-left">The escape through the courtyard</div>
                  <div className="truncate text-zinc-400 text-left">Courtyard</div>
                  <div className="font-mono text-right text-zinc-400">3 2/8 pgs</div>
                  <div className="font-mono text-center text-zinc-400">1, 2, 8, 12</div>
                  
                  {/* Absolute Warning Badge */}
                  <div className="absolute right-4 -top-3 px-2 py-0.5 rounded-full border border-amber-500/30 bg-zinc-950 text-[9px] font-semibold text-amber-400 flex items-center gap-1 shadow-lg">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    Turnaround rest &lt; 10.5 hrs (SAG)
                  </div>
                </div>

                {/* Scene 3 - INT. NIGHT (Indigo strip) */}
                <div className="grid grid-cols-[14px_50px_36px_80px_1fr_120px_100px_50px] items-center gap-x-3 px-3 py-2 rounded-lg border border-white/5 bg-zinc-950/40 text-xs text-zinc-300 hover:border-white/10 hover:bg-white/[0.01] transition-all">
                  <div className="h-4 w-full rounded bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.3)]" />
                  <div className="font-mono font-medium text-zinc-400">14</div>
                  <div className="font-mono text-zinc-400">INT</div>
                  <div className="font-mono text-zinc-400">NIGHT</div>
                  <div className="truncate font-medium text-zinc-100 text-left">Leo and Maya split the cargo</div>
                  <div className="truncate text-zinc-400 text-left">Safehouse Attic</div>
                  <div className="font-mono text-right text-zinc-400">2 1/8 pgs</div>
                  <div className="font-mono text-center text-zinc-400">1, 2</div>
                </div>

              </div>
            </div>

            {/* Under-board live KPIs */}
            <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-2 text-left">
              <div className="p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors">
                <span className="flex items-center gap-1.5 text-[10px] font-medium tracking-wide text-zinc-500 uppercase mb-1">
                  <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                  Active Crew Count
                </span>
                <span className="font-mono text-sm sm:text-base font-semibold text-white">42 Active</span>
              </div>
              <div className="p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors">
                <span className="flex items-center gap-1.5 text-[10px] font-medium tracking-wide text-zinc-500 uppercase mb-1">
                  <DollarSign className="h-3.5 w-3.5 text-zinc-400" />
                  Daily Burn Rate
                </span>
                <span className="font-mono text-sm sm:text-base font-semibold text-white">$142,500</span>
              </div>
              <div className="p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors">
                <span className="flex items-center gap-1.5 text-[10px] font-medium tracking-wide text-zinc-500 uppercase mb-1">
                  <Clock className="h-3.5 w-3.5 text-zinc-400" />
                  Union Overtime Risk
                </span>
                <span className="font-mono text-sm sm:text-base font-semibold text-amber-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Moderate
                </span>
              </div>
            </div>

          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
