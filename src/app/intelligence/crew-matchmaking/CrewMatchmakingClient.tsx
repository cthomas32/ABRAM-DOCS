"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Sparkles, 
  Settings, 
  Cpu, 
  CheckCircle2, 
  Info,
  ChevronRight,
  Shield,
  Zap,
  Calendar,
  Grid
} from "lucide-react";
import CrewMatchmakingSandbox from "@/components/intelligence/CrewMatchmakingSandbox";

const easeCinematic = [0.16, 1, 0.3, 1] as [number, number, number, number];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: easeCinematic,
    },
  },
};

export default function CrewMatchmakingClient() {
  return (
    <>
      <main className="text-zinc-100 overflow-x-hidden pt-24 pb-20 select-none relative z-10 isolate">
        
        {/* Ambient Page Glows */}
        <div className="absolute top-12 left-1/4 w-[300px] md:w-[600px] h-[300px] bg-gradient-to-tr from-white/[0.01] via-zinc-800/10 to-transparent rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute top-[40%] right-1/4 w-[280px] md:w-[500px] h-[280px] bg-[#8ECAFF]/[0.01] rounded-full blur-[100px] pointer-events-none -z-10" />

        {/* Navigation & Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 md:mb-12">
          <Link 
            href="/intelligence" 
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-6 font-mono font-semibold uppercase min-h-[44px]"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Intelligence Overview
          </Link>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4 max-w-3xl"
          >
            <motion.span 
              variants={itemVariants}
              className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 font-sans block"
            >
              Intelligence Platform
            </motion.span>
            <motion.h1
              variants={itemVariants}
              className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white leading-tight font-sans select-text"
            >
              Optimize team selection with the Crew Matchmaking Engine.
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="text-sm sm:text-base text-zinc-400 font-normal leading-7 max-w-2xl select-text font-sans"
            >
              Accelerate contractor selection with our 100-point <strong className="font-semibold text-zinc-200">Suitability Matrix</strong>. Match freelancers instantly using <strong className="font-semibold text-zinc-200">3.8x Match Speed</strong> indexes, audit real-time calendars, and place non-intrusive <strong className="font-semibold text-zinc-200">Live Capacity Holds</strong> in seconds.
            </motion.p>
          </motion.div>
        </div>

        {/* Sandbox Presentation */}
        <section className="relative w-full px-4 sm:px-6 lg:px-8 bg-transparent overflow-visible mb-16 md:mb-24">
          <div className="max-w-7xl mx-auto">
            <CrewMatchmakingSandbox />
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="relative w-full py-16 px-4 sm:px-6 lg:px-8 bg-transparent border-t border-white/[0.08]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <div className="flex flex-col space-y-3">
                <div className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center">
                  <Grid className="w-4 h-4 text-zinc-300" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 font-sans">Suitability Matrix</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Scores freelancers from 0 to 100% by evaluating technical skill synonyms, software proficiency, location/travel mode feasibility, timezone overlaps, and target budget margins.
                </p>
              </div>

              <div className="flex flex-col space-y-3">
                <div className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-zinc-300" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 font-sans">3.8x Match Speed</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Say goodbye to manually auditing portfolios and emails. The matchmaking engine scans hundreds of candidates, checks live conflicts, and suggests optimal selections in under a second.
                </p>
              </div>

              <div className="flex flex-col space-y-3">
                <div className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-zinc-300" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 font-sans">Live Capacity Sync</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Acceptance places a non-intrusive `Project Work Capacity Hold` banner at the top of the freelancer's weekly schedule rather than blocking specific hourly slots, maintaining flexibility.
                </p>
              </div>

            </div>
          </div>
        </section>

      </main>
    </>
  );
}
