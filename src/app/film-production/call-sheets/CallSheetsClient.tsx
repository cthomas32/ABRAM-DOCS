"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  ArrowUpRight, 
  CalendarRange, 
  Coins, 
  Users, 
  Sparkles,
  MapPin,
  Printer,
  ArrowDown,
  UserCheck
} from "lucide-react";
import { revealVariants, staggerContainer } from "@/lib/motion";
import CallSheetMockup from "@/components/film-production/CallSheetMockup";

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
              Daily Call Sheets.
              <span className="block mt-[8px] text-zinc-500">
                Synchronized with your set.
              </span>
            </motion.h1>

            {/* Hero Subtitle */}
            <motion.p
              variants={revealVariants}
              custom={0.2}
              className="text-base sm:text-lg md:text-xl font-normal leading-7 text-zinc-400 max-w-2xl mx-auto mb-8 font-sans select-text"
            >
              Distribute daily agendas, track crew call times, and coordinate set logistics from a single, live-updating interface. Connected directly to your stripboard and financial budget.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={revealVariants}
              custom={0.3}
              className="flex flex-wrap items-center justify-center gap-3 mb-16"
            >
              <a
                href="https://app.abram.network"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary group animate-none"
              >
                Start Scheduling
                <ArrowUpRight className="h-4.5 w-4.5 opacity-75 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
              <a href="#core-features" className="btn-glass group">
                Learn More
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
              Explore the daily schedule, key set logistics, and cast/crew lists. Toggle between tabs below to view the unified daily plan.
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
      <section id="core-features" className="relative w-full py-20 md:py-24 bg-transparent overflow-visible border-t border-white/[0.08]">
        
        {/* Ambient Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] md:w-[600px] h-[350px] bg-zinc-800/[0.02] rounded-full filter blur-[100px] pointer-events-none -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center space-y-4 max-w-xl mx-auto mb-16">
            <span className="font-display text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-3 block">
              Coordination Engine
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-50 font-sans">
              Core Dispatch & Logistics
            </h2>
            <p className="text-sm font-normal text-zinc-400 leading-relaxed font-sans">
              The foundational tools for managing and distributing physical set details, call times, and daily schedules.
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
                Supports a dynamic, reorderable timeline of polymorphic items: Script Scenes (with scene numbers, set descriptions, day/night settings, page lengths, and required characters) and Non-Scene Events (travel blocks, rehearsals, meals, and custom banners).
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
                Links directly to the project team and contractor roster. Set unique call times for each member, associate cast with their respective script characters, and track activity statuses (W for Work, H for Hold, T for Travel, R for Rehearsal).
              </p>
            </div>

            {/* Feature 3: Location Details */}
            <div className="border border-white/5 bg-zinc-950/20 backdrop-blur-md rounded-2xl p-6 hover:border-white/10 hover:bg-zinc-900/30 transition-all space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg border border-white/5 bg-white/[0.03] text-white">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-zinc-50 font-sans">
                  Location Details
                </h3>
              </div>
              <p className="text-sm font-normal leading-relaxed text-zinc-400 font-sans">
                Configure multiple locations for the day (Basecamp, Main Set, Secondary Set, and Parking). Save street addresses and directions (e.g. parking zones and shuttle van timetables) so crew and cast know exactly where to go.
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
                Format schedules using print-friendly CSS stylesheets for clean physical printouts or PDF exports. Distribute call sheets instantly to crew portals via email and text, complete with delivery logs and read confirmations.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-6 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent relative z-10" />

      {/* 4. Connected Intelligence & Automations Section */}
      <section className="relative w-full py-20 md:py-24 bg-transparent overflow-visible border-t border-white/[0.08] pb-32">
        
        {/* Ambient Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] md:w-[600px] h-[350px] bg-zinc-800/[0.02] rounded-full filter blur-[100px] pointer-events-none -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center space-y-4 max-w-xl mx-auto mb-16">
            <span className="font-display text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-3 block">
              Intelligent Workflows
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-50 font-sans">
              Connected Intelligence & Automations
            </h2>
            <p className="text-sm font-normal text-zinc-400 leading-relaxed font-sans">
              AI-assisted generation and integrated financial workflows that keep your basecamp in sync with your production office.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            
            {/* Feature 5: Smart Autofill & AI Auto-Fill */}
            <div className="border border-white/5 bg-zinc-950/20 backdrop-blur-md rounded-2xl p-6 hover:border-white/10 hover:bg-zinc-900/30 transition-all space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg border border-white/5 bg-white/[0.03] text-white">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-zinc-50 font-sans">
                  Smart & AI Autofill
                </h3>
              </div>
              <p className="text-sm font-normal leading-relaxed text-zinc-400 font-sans">
                Auto-calculates the shoot day number and syncs confirmed bookings. Anthropic Claude evaluates timeline data to draft department-specific instructions (Camera, Art, Wardrobe, Audio), local weather, and tailored stage safety guidelines.
              </p>
            </div>

            {/* Feature 6: Work Order & Billing Integration */}
            <div className="border border-white/5 bg-zinc-950/20 backdrop-blur-md rounded-2xl p-6 hover:border-white/10 hover:bg-zinc-900/30 transition-all space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg border border-white/5 bg-white/[0.03] text-white">
                  <Coins className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-zinc-50 font-sans">
                  Work Order & Billing
                </h3>
              </div>
              <p className="text-sm font-normal leading-relaxed text-zinc-400 font-sans">
                Connect call sheets directly to scheduled Work Orders. Sync crew hours with payroll ledgers, track equipment logistics, and quickly generate new work orders from the call sheet layout, copying crew lists and details.
              </p>
            </div>

            {/* Feature 7: One-Click Public RSVPs */}
            <div className="border border-white/5 bg-zinc-950/20 backdrop-blur-md rounded-2xl p-6 hover:border-white/10 hover:bg-zinc-900/30 transition-all space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg border border-white/5 bg-white/[0.03] text-white">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-zinc-50 font-sans">
                  One-Click Public RSVPs
                </h3>
              </div>
              <p className="text-sm font-normal leading-relaxed text-zinc-400 font-sans">
                Dispatch secure invitation links that let external cast and crew accept or decline bookings in one click without logging in. Acceptances automatically sync to the contractor's utilization calendar and update the live crew builder.
              </p>
            </div>

          </div>
        </div>
      </section>

    </main>
  );
}
