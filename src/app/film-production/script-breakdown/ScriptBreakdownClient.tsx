"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Cpu, Sparkles, LayoutGrid, CheckCircle, ArrowDown } from "lucide-react";
import { revealVariants, staggerContainer } from "@/lib/motion";
import ScriptBreakdownTimeline from "@/components/film-production/ScriptBreakdownTimeline";

export default function ScriptBreakdownClient() {
  return (
    <main className="text-zinc-100 overflow-x-hidden pt-16 select-none relative z-10 isolate animate-none">
      
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
              AI Screenplay Parser
            </motion.span>

            {/* Hero Headline */}
            <motion.h1
              variants={revealVariants}
              custom={0.1}
              className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white leading-[1.12] mb-6 font-sans select-text"
            >
              AI Script Breakdown.
              <span className="block mt-[8px] text-zinc-500">
                Instantly map your shoot.
              </span>
            </motion.h1>

            {/* Hero Subtitle */}
            <motion.p
              variants={revealVariants}
              custom={0.2}
              className="text-base sm:text-lg md:text-xl font-normal leading-7 text-zinc-400 max-w-2xl mx-auto mb-8 font-sans select-text"
            >
              Convert flat screenplay PDFs or Word documents into categorizable scheduling items. Automatically detect scenes, character dialogue tracks, props, and conflicts to build your stripboard in seconds.
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
                <span>Launch in Workspace</span>
                <ArrowUpRight className="h-4.5 w-4.5 opacity-75 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
              <a 
                href="#how-it-works" 
                className="btn-glass group flex items-center justify-center gap-1 cursor-pointer w-full sm:w-auto min-h-[44px] md:min-h-0"
              >
                <span>Learn More</span>
                <ArrowDown className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100 group-hover:translate-y-0.5 transition-all duration-200" />
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-6 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent relative z-10" />

      {/* 2. Interactive Timeline Section */}
      <section id="how-it-works" className="relative w-full py-16 md:py-24 bg-transparent overflow-visible border-t border-white/[0.08]">
        
        {/* Ambient Glow behind timeline */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] md:w-[600px] h-[350px] bg-white/[0.015] rounded-full filter blur-[100px] pointer-events-none -z-10" />
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
          
          <div className="text-center space-y-4 max-w-xl mx-auto">
            <span className="font-display text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-3 block">
              Step-by-Step Breakdown Pipeline
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-50 font-sans">
              Watch the Engine in Action
            </h2>
            <p className="text-sm font-normal text-zinc-400 leading-relaxed font-sans">
              Interact with each stage of the parsing pipeline. See how ABRAM handles ingestion, reconstructs layout formats, extracts item metadata, and reconciles revisions.
            </p>
          </div>

          <div className="w-full">
            <ScriptBreakdownTimeline />
          </div>

        </div>
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-6 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent relative z-10" />

      {/* 3. Deep-Dive Capabilities Grid - Value & Marketing Benefits */}
      <section className="relative w-full py-16 md:py-24 bg-transparent overflow-visible">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-4 max-w-xl mx-auto mb-16">
            <span className="font-display text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-3 block">
              Value & Marketing Benefits
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-50 font-sans">
              Accelerate Pre-Production
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="p-6 rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md flex flex-col justify-between min-h-[220px]">
              <div>
                <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center mb-4">
                  <Cpu className="w-4 h-4 text-zinc-400" />
                </div>
                <h3 className="text-sm font-semibold tracking-tight text-zinc-50 font-sans mb-2">
                  Turn Days into Seconds
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  A manual script breakdown takes hours of scanning, highlighting, and copy-pasting. ABRAM does it automatically in under a minute, freeing your team to focus on creative execution.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md flex flex-col justify-between min-h-[220px]">
              <div>
                <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center mb-4">
                  <LayoutGrid className="w-4 h-4 text-zinc-400" />
                </div>
                <h3 className="text-sm font-semibold tracking-tight text-zinc-50 font-sans mb-2">
                  Zero-Config Scheduling
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  The extracted data feeds directly into the Classic Stripboard and Production Scheduling engines. Scenes are instantly color-coded by time of day and location type, ready for drag-and-drop sequencing.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md flex flex-col justify-between min-h-[220px]">
              <div>
                <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center mb-4">
                  <Sparkles className="w-4 h-4 text-zinc-400" />
                </div>
                <h3 className="text-sm font-semibold tracking-tight text-zinc-50 font-sans mb-2">
                  Instant Resource Planning
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Populates the Master Book of Elements and Day Out of Days (DOOD) grids automatically. Track when and where every prop, vehicle, and cast member is required across the entire schedule.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md flex flex-col justify-between min-h-[220px]">
              <div>
                <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center mb-4">
                  <CheckCircle className="w-4 h-4 text-zinc-400" />
                </div>
                <h3 className="text-sm font-semibold tracking-tight text-zinc-50 font-sans mb-2">
                  Flexible Access & Metering
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Features are built into the platform's credit-based model. Basic parsing is included in standard subscriptions, with Custom AI credit allocations tailored for Enterprise scale workspaces.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

    </main>
  );
}
