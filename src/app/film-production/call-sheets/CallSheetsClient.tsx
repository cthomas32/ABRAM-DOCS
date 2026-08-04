"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  CalendarRange,
  Users,
  Printer,
  ArrowDown
} from "lucide-react";
import { revealVariants, staggerContainer } from "@/lib/motion";
import CallSheetMockup from "@/components/film-production/CallSheetMockup";
import AbramMark from "@/components/AbramMark";

export default function CallSheetsClient() {
  return (
    <main className="text-zinc-100 overflow-x-hidden pt-16 select-none relative z-10 isolate">
      
      {/* 1. Hero Section */}
      <section className="relative w-full py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-transparent overflow-visible select-none">
        
        {/* Absolute Ambient Glow */}
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
            {/* Overline Display Tag */}
            <motion.span 
              variants={revealVariants}
              custom={0.0}
              className="font-display text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-4"
            >
              Basecamp Logistics Engine
            </motion.span>

            {/* Hero Headline */}
            <motion.h1
              variants={revealVariants}
              custom={0.1}
              className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white leading-[1.12] mb-6 font-sans select-text"
            >
              Get accurate call sheets to your whole crew before call time.
            </motion.h1>

            {/* Hero Subtitle */}
            <motion.p
              variants={revealVariants}
              custom={0.2}
              className="text-base sm:text-lg md:text-xl font-normal leading-7 text-zinc-400 max-w-2xl mx-auto mb-8 font-sans select-text"
            >
              Distribute daily agendas, track crew call times, and coordinate set logistics from one live interface.
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
                className="btn-primary group animate-none w-full sm:w-auto min-h-[44px] md:min-h-0 flex items-center justify-center gap-1.5"
              >
                <span>Start Scheduling</span>
                <ArrowUpRight className="h-4.5 w-4.5 opacity-75 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
              <a 
                href="#core-features" 
                className="btn-glass group flex items-center justify-center gap-1 cursor-pointer w-full sm:w-auto min-h-[44px] md:min-h-0"
              >
                <span>Explore Call Sheets</span>
                <ArrowDown className="h-3.5 w-3.5 opacity-75 group-hover:translate-y-0.5 transition-transform" />
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-6 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent relative z-10" />

      {/* 2. Interactive Mockup Section */}
      <section className="relative w-full py-16 md:py-24 bg-transparent overflow-visible border-t border-white/[0.08]">
        
        {/* Ambient Glow behind mockup */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] md:w-[600px] h-[350px] bg-white/[0.015] rounded-full filter blur-[100px] pointer-events-none -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
          <div className="text-center space-y-4 max-w-xl mx-auto">
            <span className="font-display text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-3 block">
              High-Fidelity Preview
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-50 font-sans">
              The Live Call Sheet Cockpit
            </h2>
            <p className="text-sm font-normal text-zinc-400 leading-relaxed font-sans">
              Explore the daily schedule, key set logistics, and cast/crew lists in one view.
            </p>
          </div>

          <div className="w-full">
            <CallSheetMockup />
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-6 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent relative z-10" />

      {/* 3. Core Dispatch & Logistics Section */}
      <section id="core-features" className="relative w-full py-20 md:py-24 bg-transparent overflow-visible border-t border-white/[0.08] pb-32">

        {/* Ambient Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] md:w-[600px] h-[350px] bg-zinc-800/[0.02] rounded-full filter blur-[100px] pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center space-y-4 max-w-xl mx-auto mb-16">
            <span className="font-display text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-3 block">
              Coordination Engine
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-50 font-sans">
              Everything your set needs, dispatched automatically
            </h2>
            <p className="text-sm font-normal text-zinc-400 leading-relaxed font-sans">
              ABRAM keeps crew, locations, and safety notes in sync before call time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">

            {/* Feature 1: Daily Schedule Timeline */}
            <div className="border border-white/5 bg-zinc-950/20 backdrop-blur-md rounded-2xl p-6 hover:border-white/10 hover:bg-zinc-900/30 transition-all space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg border border-white/5 bg-white/[0.03] text-white">
                  <CalendarRange className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-zinc-50 font-sans">
                  Daily Schedule Timeline
                </h3>
              </div>
              <p className="text-sm font-normal leading-relaxed text-zinc-400 font-sans">
                Build a daily timeline of scenes, travel, rehearsals, and meals with locations included.
              </p>
            </div>

            {/* Feature 2: Cast & Crew Management */}
            <div className="border border-white/5 bg-zinc-950/20 backdrop-blur-md rounded-2xl p-6 hover:border-white/10 hover:bg-zinc-900/30 transition-all space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg border border-white/5 bg-white/[0.03] text-white">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-zinc-50 font-sans">
                  Cast & Crew Roster
                </h3>
              </div>
              <p className="text-sm font-normal leading-relaxed text-zinc-400 font-sans">
                Set call times per member and track work, hold, travel, and rehearsal status.
              </p>
            </div>

            {/* Feature 3: Smart & AI Autofill */}
            <div className="border border-white/5 bg-zinc-950/20 backdrop-blur-md rounded-2xl p-6 hover:border-white/10 hover:bg-zinc-900/30 transition-all space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg border border-white/5 bg-white/[0.03] text-white">
                  <AbramMark size={20} />
                </div>
                <h3 className="text-base font-semibold text-zinc-50 font-sans">
                  Smart & AI Autofill
                </h3>
              </div>
              <p className="text-sm font-normal leading-relaxed text-zinc-400 font-sans">
                ABRAM's AI drafts department instructions, weather notes, and safety guidelines automatically.
              </p>
            </div>

            {/* Feature 4: Distribution & Print */}
            <div className="border border-white/5 bg-zinc-950/20 backdrop-blur-md rounded-2xl p-6 hover:border-white/10 hover:bg-zinc-900/30 transition-all space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg border border-white/5 bg-white/[0.03] text-white">
                  <Printer className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-zinc-50 font-sans">
                  Distribution & Print
                </h3>
              </div>
              <p className="text-sm font-normal leading-relaxed text-zinc-400 font-sans">
                Distribute call sheets instantly by email and text with delivery confirmations.
              </p>
            </div>

          </div>
        </div>
      </section>

    </main>
  );
}
