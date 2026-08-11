"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Settings, 
  Cpu, 
  CheckCircle2, 
  Info,
  ChevronRight
} from "lucide-react";
import AgencyIntakeMockup from "@/components/agency/AgencyIntakeMockup";
import { revealVariants, staggerContainer } from "@/lib/motion";

export default function ClientIntakeClient() {
  return (
    <>
      <main className="text-zinc-100 overflow-x-hidden pt-24 pb-20 select-none relative z-10 isolate">
        {/* Absolute Ambient Page Glows */}
        <div className="absolute top-12 left-1/4 w-[300px] md:w-[600px] h-[300px] bg-gradient-to-tr from-white/[0.01] via-zinc-800/10 to-transparent rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute top-[40%] right-1/4 w-[280px] md:w-[500px] h-[280px] bg-[#8ECAFF]/[0.01] rounded-full blur-[100px] pointer-events-none -z-10" />

        {/* Navigation & Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 md:mb-12">
          <Link 
            href="/agency" 
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-6 font-sans font-semibold uppercase min-h-[44px]"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to agency hub
          </Link>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-4 max-w-3xl"
          >
            <motion.span 
              variants={revealVariants}
              custom={0.0}
              className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 font-sans block"
            >
              Intake Scoping Portal
            </motion.span>
            <motion.h1
              variants={revealVariants}
              custom={0.1}
              className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white leading-tight font-sans select-text"
            >
              Turn client briefs into scoped, staffed projects in minutes.
            </motion.h1>
            <motion.p
              variants={revealVariants}
              custom={0.2}
              className="text-sm sm:text-base text-zinc-400 font-normal leading-relaxed max-w-2xl select-text font-sans"
            >
              Brief Intelligence extracts deliverables and drafts milestone timelines instantly.
            </motion.p>
          </motion.div>
        </div>

        {/* Live Interactive Playground */}
        <section className="relative w-full px-4 sm:px-6 lg:px-8 bg-transparent overflow-visible mb-16 md:mb-24">
          <div className="max-w-7xl mx-auto">
            <AgencyIntakeMockup />
          </div>
        </section>

        {/* Features deep dive */}
        <section className="relative w-full py-16 px-4 sm:px-6 lg:px-8 bg-transparent border-t border-white/[0.08]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Feature 1 */}
              <div className="space-y-3 p-5 rounded-xl border border-white/5 bg-zinc-950/20 hover:border-white/10 hover:bg-zinc-900/10 transition-all">
                <div className="p-2 rounded-lg border border-white/5 bg-white/[0.02] text-white w-fit">
                  <Cpu className="w-4 h-4 text-zinc-400" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 font-sans">Natural Language Parsing</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Brief Intelligence reads descriptions to identify deliverables and separate high-effort work from quick tasks.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="space-y-3 p-5 rounded-xl border border-white/5 bg-zinc-950/20 hover:border-white/10 hover:bg-zinc-900/10 transition-all">
                <div className="p-2 rounded-lg border border-white/5 bg-white/[0.02] text-white w-fit">
                  <Settings className="w-4 h-4 text-zinc-400" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 font-sans">Direct Field Mapping</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Connect questionnaire fields directly to crewing requirements and scheduling boards.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="space-y-3 p-5 rounded-xl border border-white/5 bg-zinc-950/20 hover:border-white/10 hover:bg-zinc-900/10 transition-all">
                <div className="p-2 rounded-lg border border-white/5 bg-white/[0.02] text-white w-fit">
                  <CheckCircle2 className="w-4 h-4 text-zinc-400" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 font-sans">Self-Healing Budget Guardrails</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  The system flags scope creep before requests are approved.
                </p>
              </div>

            </div>
          </div>
        </section>
      </main>
    </>
  );
}
