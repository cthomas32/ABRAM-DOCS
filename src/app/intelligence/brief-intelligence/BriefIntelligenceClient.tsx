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
  BookOpen,
  Calendar,
  Layers
} from "lucide-react";
import BriefIntelligenceSandbox from "@/components/intelligence/BriefIntelligenceSandbox";

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

export default function BriefIntelligenceClient() {
  return (
    <>
      <main className="text-zinc-100 overflow-x-hidden pt-24 pb-20 select-none relative z-10 isolate">
        
        {/* Ambient Page Glows */}
        <div className="absolute top-12 left-1/4 w-[300px] md:w-[600px] h-[300px] bg-gradient-to-tr from-white/[0.01] via-zinc-800/10 to-transparent rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute top-[40%] right-1/4 w-[280px] md:w-[500px] h-[280px] bg-red-950/[0.015] rounded-full blur-[100px] pointer-events-none -z-10" />

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
              Translate briefs to structured plans with Brief Intelligence.
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="text-sm sm:text-base text-zinc-400 font-normal leading-7 max-w-2xl select-text font-sans"
            >
              Experience the power of <strong className="font-semibold text-zinc-200">Brief Blueprinting</strong>. Paste raw creative text, scan for hidden deliverables, map dependencies into an interactive Work Breakdown Structure (WBS), and auto-resolve scoping ambiguities.
            </motion.p>
          </motion.div>
        </div>

        {/* Sandbox Presentation */}
        <section className="relative w-full px-4 sm:px-6 lg:px-8 bg-transparent overflow-visible mb-16 md:mb-24">
          <div className="max-w-7xl mx-auto">
            <BriefIntelligenceSandbox />
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="relative w-full py-16 px-4 sm:px-6 lg:px-8 bg-transparent border-t border-white/[0.08]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <div className="flex flex-col space-y-3">
                <div className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-zinc-300" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 font-sans">Brief Scoping</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Instantly transform unstructured PDF or text briefs into standard production structures. The parser isolates creative phases, maps milestones, and tags technology software suites.
                </p>
              </div>

              <div className="flex flex-col space-y-3">
                <div className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center">
                  <Cpu className="w-4 h-4 text-zinc-300" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 font-sans">Adaptive Confidence Dial</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Avoid costly budgeting mistakes before you hire. The system monitors the density of details and uses quick clarifying questions to boost the scoping confidence rating.
                </p>
              </div>

              <div className="flex flex-col space-y-3">
                <div className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-zinc-300" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 font-sans">Matchmaking Alignment</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  The outputs generated by Brief Intelligence map directly to contractor skills and roles. Seamlessly proceed to matchmaking to fill your work packages with verified talent.
                </p>
              </div>

            </div>
          </div>
        </section>

      </main>
    </>
  );
}
