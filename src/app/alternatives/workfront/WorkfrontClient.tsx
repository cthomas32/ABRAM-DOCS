"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  X,
  ShieldCheck,
  Calendar,
  DollarSign,
  Clock,
  Users,
  Zap,
  Sparkles,
  Smartphone,
  ArrowUpRight,
  HelpCircle,
  ChevronDown
} from "lucide-react";
import { revealVariants, staggerContainer } from "@/lib/motion";

export default function WorkfrontClient() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const comparisonFeatures = [
    {
      feature: "Project Scoping",
      abram: "AI Scoping Wizard parses narratives directly into milestones and roles",
      workfront: "Highly robust manual templates and custom form mapping workflows",
      abramCheck: true,
      workfrontCheck: true
    },
    {
      feature: "Payment Integrations",
      abram: "Direct Stripe Connect payouts with escrow capabilities",
      workfront: "Timeline management; relies on external ERP/payroll integrations",
      abramCheck: true,
      workfrontCheck: false
    },
    {
      feature: "Union rest checking",
      abram: "Automated SAG-AFTRA, DGA & IATSE wrap-to-call rest margin tracking",
      workfront: "General task timelines; requires manual compliance checks",
      abramCheck: true,
      workfrontCheck: false
    },
    {
      feature: "Roster Management",
      abram: "Suitability Index scores candidates against active brief specifications",
      workfront: "Strategic enterprise resource planning and capacity grids",
      abramCheck: true,
      workfrontCheck: true
    },
    {
      feature: "Workspace Memory (Brain)",
      abram: "Fuzzy semantic searching across past rates, guides, and sheets",
      workfront: "Enterprise search indexing and document classification cabinets",
      abramCheck: true,
      workfrontCheck: true
    },
    {
      feature: "On-Set Logistics",
      abram: "Dynamic call sheet schedules with one-click contractor RSVPs",
      workfront: "Excellent office/agency coordination; lacks on-set tools",
      abramCheck: true,
      workfrontCheck: false
    }
  ];

  const faqs = [
    {
      q: "How does ABRAM compare to Adobe Workfront for creative operations?",
      a: "Adobe Workfront is a world-class enterprise-grade work management tool designed to align cross-functional corporate campaigns and manage strategic portfolios. ABRAM is a specialized creative operations alternative optimized specifically for physical production, film crews, and boutique studios—unifying screenplay parsing, roster matching, union rest compliance, and Stripe Connect payouts in a single, focused environment."
    },
    {
      q: "Does ABRAM integrate with Adobe Creative Cloud assets?",
      a: "While Adobe Workfront offers native, deep integrations with the wider Adobe Experience Cloud and Creative Cloud apps for corporate design workflows, ABRAM focuses on folder-level synchronization for production reviews. It pulls client comments and aligns version stacks directly with active roster work packages."
    },
    {
      q: "How does ABRAM manage contractor compliance compared to Workfront?",
      a: "Workfront is designed to track task timelines and corporate utilization metrics. ABRAM features active safety compliance telemetry specifically engineered to monitor crew wrap-to-call rest margins (complying with SAG-AFTRA, DGA, and IATSE turnaround windows) and alert coordinators during booking."
    }
  ];

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <main className="text-zinc-100 overflow-x-hidden pt-24 pb-20 select-none relative z-10 isolate">
      {/* Ambient Page Glows */}
      <div className="absolute top-12 left-1/4 w-[300px] md:w-[600px] h-[300px] bg-gradient-to-tr from-white/[0.01] via-zinc-800/10 to-transparent rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[40%] right-1/4 w-[280px] md:w-[500px] h-[280px] bg-[#8ECAFF]/[0.02] rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="relative w-full min-h-[35vh] md:min-h-[45vh] flex flex-col justify-center py-12 md:py-20 px-4 sm:px-6 lg:px-8 bg-transparent overflow-visible mb-8 md:mb-12">
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
              Competitor Comparison
            </motion.span>

            {/* Title */}
            <motion.h1
              variants={revealVariants}
              custom={0.1}
              className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white leading-[1.12] mb-6 font-sans select-text"
            >
              A Unified alternative to
              <span className="block mt-[8px] text-zinc-500">
                Adobe Workfront.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={revealVariants}
              custom={0.2}
              className="text-sm sm:text-base md:text-lg text-zinc-400 font-normal leading-relaxed max-w-2xl mb-8 font-sans select-text"
            >
              Ditch complex enterprise templates. ABRAM combines brief parsing, crew scheduling, and Stripe Connect payouts into a single, high-fidelity creative operations workspace.
            </motion.p>

            {/* CTA Button */}
            <motion.div variants={revealVariants} custom={0.3} className="flex flex-wrap gap-4 justify-center">
              <Link href="/pricing" className="btn-primary">
                View Plans
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link href="/docs" className="btn-glass">
                Explore Docs
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Feature Grid / Side-by-Side Comparison */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 md:mb-28">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-white font-sans">
            How ABRAM Replaces Workfront for Creative Operations
          </h2>
          <p className="text-xs md:text-sm text-zinc-400 mt-2 max-w-xl mx-auto">
            A head-to-head comparison of features built specifically for creative agencies and studios.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden max-w-4xl mx-auto">
          <div className="grid grid-cols-3 bg-white/[0.02] border-b border-white/5 p-4 text-xs font-semibold tracking-wider text-zinc-400 uppercase">
            <div>Feature</div>
            <div className="text-white font-bold">ABRAM</div>
            <div>Adobe Workfront</div>
          </div>
          <div className="divide-y divide-white/5">
            {comparisonFeatures.map((item, idx) => (
              <div key={idx} className="grid grid-cols-3 p-4 items-center gap-4 text-xs sm:text-sm">
                <div className="font-semibold text-zinc-300">{item.feature}</div>
                <div className="text-zinc-100 flex items-start gap-2">
                  {item.abramCheck ? (
                    <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <X className="h-4 w-4 text-red-500/50 shrink-0 mt-0.5" />
                  )}
                  <span>{item.abram}</span>
                </div>
                <div className="text-zinc-500 flex items-start gap-2 col-start-3">
                  {item.workfrontCheck ? (
                    <Check className="h-4 w-4 text-green-500/60 shrink-0 mt-0.5" />
                  ) : (
                    <X className="h-4 w-4 text-red-500/50 shrink-0 mt-0.5" />
                  )}
                  <span>{item.workfront}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 md:mb-28">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Card 1 */}
          <div className="bg-zinc-950/20 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:border-white/10 hover:bg-zinc-900/30 transition-all duration-300">
            <div className="h-10 w-10 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center mb-4">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-200 mb-2 font-sans">AI-Driven Scoping</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
              No more manual configuration of enterprise project files. Upload client briefs to build milestones and cost estimates instantly.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-zinc-950/20 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:border-white/10 hover:bg-zinc-900/30 transition-all duration-300">
            <div className="h-10 w-10 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center mb-4">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-200 mb-2 font-sans">Stripe Connect Pay Rails</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
              Process payments directly from the dashboard. Funds are secured upon milestone approval and routed directly to crew profiles.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-zinc-950/20 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:border-white/10 hover:bg-zinc-900/30 transition-all duration-300">
            <div className="h-10 w-10 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center mb-4">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-200 mb-2 font-sans">Built-In Labor Compliance</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
              Proactively tracks check-in/out travel distances and call-times, alerting planners if crew scheduling violates safety or turnaround rules.
            </p>
          </div>
        </div>
      </section>

      {/* Accordion FAQ Block */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-white font-sans">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="glass-panel rounded-2xl border border-white/5 overflow-hidden transition-all duration-300"
            >
              <button
                onClick={() => toggleFaq(idx)}
                type="button"
                className="w-full flex items-center justify-between p-5 text-left text-sm font-medium text-zinc-200 hover:text-white transition-colors select-none focus:outline-none"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`h-4 w-4 text-zinc-500 transition-transform duration-300 ${
                    activeFaq === idx ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence initial={false}>
                {activeFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden border-t border-white/[0.03]"
                  >
                    <p className="p-5 text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans select-text">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* Non-Affiliation Disclaimer */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/[0.04] pt-8 text-center">
        <p className="text-[9px] text-zinc-600/80 leading-relaxed font-light font-sans select-text">
          Disclaimer: Adobe Workfront is a registered trademark of Adobe Inc. ABRAM is an independent platform and is not affiliated with, endorsed by, or sponsored by Adobe Inc. or any other respective trademark holders. Reference to Adobe Workfront is for comparison, reference, and illustrative purposes only.
        </p>
      </section>
    </main>
  );
}
