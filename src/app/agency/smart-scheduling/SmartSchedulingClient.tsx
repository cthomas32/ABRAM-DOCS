"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Sparkles, 
  Calendar, 
  Clock, 
  ShieldAlert,
  CheckCircle2
} from "lucide-react";
import AgencySchedulingMockup from "@/components/agency/AgencySchedulingMockup";
import { revealVariants, staggerContainer } from "@/lib/motion";

export default function SmartSchedulingClient() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "ABRAM Smart Resource & Crew Scheduling",
    "description": "Multi-row resource calendar and conflict resolution in the ABRAM creative production platform.",
    "url": "https://abram.network/agency/smart-scheduling",
    "isPartOf": { "@id": "https://abram.network/#website" },
    "publisher": { "@id": "https://abram.network/#organization" },
    "mainEntity": {
      "@type": "SoftwareApplication",
      "name": "ABRAM Scheduling Engine",
      "applicationCategory": "BusinessApplication",
      "featureList": [
        "Double-Booking Prevention Scanning",
        "Union Labor Margin Rest Verifications",
        "Automated Calendar Allocation Overlaps",
        "Multi-Day Resource Timeline Visualizer"
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
        <div className="absolute top-12 left-1/4 w-[300px] md:w-[600px] h-[300px] bg-gradient-to-tr from-white/[0.01] via-zinc-800/10 to-transparent rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute top-[40%] right-1/4 w-[280px] md:w-[500px] h-[280px] bg-[#8ECAFF]/[0.01] rounded-full blur-[100px] pointer-events-none -z-10" />

        {/* Navigation & Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 md:mb-12">
          <Link 
            href="/agency" 
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-6 font-mono font-semibold uppercase"
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
              Timeline Scheduling
            </motion.span>
            <motion.h1
              variants={revealVariants}
              custom={0.1}
              className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white leading-tight font-sans select-text"
            >
              Resolve scheduling overlaps with automated conflict detection.
            </motion.h1>
            <motion.p
              variants={revealVariants}
              custom={0.2}
              className="text-sm sm:text-base text-zinc-400 font-normal leading-relaxed max-w-2xl select-text font-sans"
            >
              Coordinate physical assets and personnel inside an interactive horizontal calendar timeline. The system scans allocations in real-time, warning producers of turnaround or double-booking conflicts.
            </motion.p>
          </motion.div>
        </div>

        {/* Live Interactive Playground */}
        <section className="relative w-full px-4 sm:px-6 lg:px-8 bg-transparent overflow-visible mb-16 md:mb-24">
          <div className="max-w-7xl mx-auto">
            <AgencySchedulingMockup />
          </div>
        </section>

        {/* Features deep dive */}
        <section className="relative w-full py-16 px-4 sm:px-6 lg:px-8 bg-transparent border-t border-white/[0.08]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Feature 1 */}
              <div className="space-y-3 p-5 rounded-xl border border-white/5 bg-zinc-950/20 hover:border-white/10 hover:bg-zinc-900/10 transition-all">
                <div className="p-2 rounded-lg border border-white/5 bg-white/[0.02] text-white w-fit">
                  <ShieldAlert className="w-4 h-4 text-zinc-400" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 font-sans">Conflict Detection</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Instantly flag overlapping tasks or multi-booked studio spaces. Prevent schedule errors before final work packages are dispatched to team members.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="space-y-3 p-5 rounded-xl border border-white/5 bg-zinc-950/20 hover:border-white/10 hover:bg-zinc-900/10 transition-all">
                <div className="p-2 rounded-lg border border-white/5 bg-white/[0.02] text-white w-fit">
                  <Clock className="w-4 h-4 text-zinc-400" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 font-sans">Turnaround Compliance</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  The system measures check-in/out telemetry alongside travel distances, alerting producers if a contractor call-time violates union rest intervals.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="space-y-3 p-5 rounded-xl border border-white/5 bg-zinc-950/20 hover:border-white/10 hover:bg-zinc-900/10 transition-all">
                <div className="p-2 rounded-lg border border-white/5 bg-white/[0.02] text-white w-fit">
                  <Calendar className="w-4 h-4 text-zinc-400" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 font-sans">AI Resolve & Shift</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Resolve scheduling blocks automatically with AI. The scheduling engine re-allocates task items based on priority weight parameters to maximize utilization.
                </p>
              </div>

            </div>
          </div>
        </section>
      </main>
    </>
  );
}
