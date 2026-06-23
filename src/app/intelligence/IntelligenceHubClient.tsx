"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Cpu, 
  ShieldCheck, 
  Workflow, 
  Clock, 
  Coins, 
  Gauge 
} from "lucide-react";
import HeroSection from "@/components/intelligence/HeroSection";
import ROICalculator from "@/components/intelligence/ROICalculator";
import { revealVariants, staggerContainer } from "@/lib/motion";

export default function IntelligenceHubClient() {
  return (
    <>
      <main className="text-zinc-100 overflow-x-hidden pt-24 pb-20 select-none relative z-10 isolate">
        
        {/* Absolute Ambient Page Glows (Ensured not to be clipped by overflow-hidden) */}
        <div className="absolute top-12 left-1/4 w-[300px] md:w-[600px] h-[300px] bg-gradient-to-tr from-white/[0.01] via-zinc-800/10 to-transparent rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute top-[40%] right-1/4 w-[280px] md:w-[500px] h-[280px] bg-[#8ECAFF]/[0.015] rounded-full blur-[100px] pointer-events-none -z-10" />
        <div className="absolute bottom-[20%] left-1/3 w-[300px] md:w-[600px] h-[300px] bg-white/[0.01] rounded-full blur-[120px] pointer-events-none -z-10" />

        {/* Hero Section */}
        <HeroSection />

        {/* Interactive ROI Calculator */}
        <section className="relative w-full px-4 sm:px-6 lg:px-8 bg-transparent overflow-visible mb-16 md:mb-24">
          <ROICalculator />
        </section>

        {/* Intelligence Pillars */}
        <section className="relative w-full py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-transparent overflow-visible border-t border-white/[0.08]">
          <div className="max-w-7xl mx-auto">
            
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 font-sans block">
                SYSTEM ARCHITECTURE
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
                Three Pillars of Roster Yield
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
                ABRAM doesn't just manage rosters; it optimizes the cost structure of your entire production workflow.
              </p>
            </div>

            {/* Grid of features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              
              {/* Feature 1 */}
              <div className="rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md hover:border-white/10 hover:bg-zinc-900/30 transition-all duration-300 p-6 flex flex-col justify-between shadow-lg">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold tracking-tight text-zinc-50 font-sans">
                        Admin Time Reduction
                      </h3>
                      <span className="text-[9px] font-medium tracking-widest uppercase text-zinc-500 font-mono">
                        Workflow Efficiency
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    Accelerate brief-to-crew cycle times. Remove manual spreadsheets, emails, and availability tracking. Automatically parse requirements and match against verified contractor datasets.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md hover:border-white/10 hover:bg-zinc-900/30 transition-all duration-300 p-6 flex flex-col justify-between shadow-lg">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center">
                      <Coins className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold tracking-tight text-zinc-50 font-sans">
                        Leakage Prevention
                      </h3>
                      <span className="text-[9px] font-medium tracking-widest uppercase text-zinc-500 font-mono">
                        Financial Guardrails
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    Avoid overlapping crew bookings, idle contractor billing, and rest-turnaround compliance fees. Enforce contract constraints automatically before they result in financial penalty.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md hover:border-white/10 hover:bg-zinc-900/30 transition-all duration-300 p-6 flex flex-col justify-between shadow-lg">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center">
                      <Gauge className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold tracking-tight text-zinc-50 font-sans">
                        Capacity Optimization
                      </h3>
                      <span className="text-[9px] font-medium tracking-widest uppercase text-zinc-500 font-mono">
                        Resource Utilization
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    Analyze roster availability in real-time. Distribute workloads evenly to avoid contractor burnout while maintaining high active utilization across active agency projects.
                  </p>
                </div>
              </div>

            </div>

            {/* Bottom Call to Action banner */}
            <div className="mt-16 glass-panel rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <h3 className="text-lg font-bold text-white font-sans">
                  Ready to deploy ABRAM?
                </h3>
                <p className="text-xs text-zinc-400 max-w-lg font-sans">
                  Connect with our systems engineers for a custom analysis of your roster's potential ROI.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Link
                  href="/pricing"
                  className="btn-primary px-6 py-2.5 text-xs font-semibold rounded-full text-center"
                >
                  View Pricing
                </Link>
                <a
                  href="https://app.abram.network"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-glass px-6 py-2.5 text-xs font-semibold rounded-full text-center flex items-center justify-center gap-1.5"
                >
                  <span>Start Building</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                </a>
              </div>
            </div>

          </div>
        </section>

      </main>
    </>
  );
}
