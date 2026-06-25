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
  Database,
  ChevronDown
} from "lucide-react";
import { revealVariants, staggerContainer } from "@/lib/motion";

export default function MovieMagicClient() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const comparisonFeatures = [
    {
      feature: "Workspace Access",
      abram: "Cloud-native. Access from any device with live collaboration",
      moviemagic: "Highly secure, industry-standard offline desktop installation (.mbd/.mms)",
      abramCheck: true,
      moviemagicCheck: true
    },
    {
      feature: "Milestone Payouts",
      abram: "Integrated Stripe Connect payments directly from approved deliverables",
      moviemagic: "Cost budgeting only; payroll managed through external partners",
      abramCheck: true,
      moviemagicCheck: false
    },
    {
      feature: "Turnaround Safety Checks",
      abram: "Automatic SAG-AFTRA, DGA & IATSE wrap-to-call rest margin warnings",
      moviemagic: "Classic Day Out of Days (DOOD) sheets with manual verification",
      abramCheck: true,
      moviemagicCheck: true
    },
    {
      feature: "Screenplay breakdown",
      abram: "AI screenplay parser maps props, cast, wardrobe in seconds",
      moviemagic: "Precise, manual tagging of elements for deep catalog control",
      abramCheck: true,
      moviemagicCheck: true
    },
    {
      feature: "Availability Calendar",
      abram: "Bi-directional Google/Outlook calendar sync with shared rosters",
      moviemagic: "Dedicated scheduling stripboards designed for static calendar planning",
      abramCheck: true,
      moviemagicCheck: false
    },
    {
      feature: "Call Sheets Integration",
      abram: "Call sheets sync with stripboards and auto-notify crew via Slack/Email",
      moviemagic: "Downstream document export; call sheets managed separately",
      abramCheck: true,
      moviemagicCheck: false
    }
  ];

  const faqs = [
    {
      q: "How does ABRAM compare to Movie Magic for film scheduling and budgeting?",
      a: "Movie Magic is a long-standing offline desktop standard, trusted by studio production accountants for highly granular budgeting structures, complex union rate tables, and standalone scheduling. ABRAM is a cloud-native, real-time alternative designed for collaborative teams—integrating screenplay parsing, live digital call sheets, active union rest checking, and direct crew payouts via Stripe Connect in a single online workspace."
    },
    {
      q: "Does ABRAM support Movie Magic file exports?",
      a: "ABRAM is designed to import standard screenplay formats for automated breakdowns. For scheduling and budgeting, ABRAM operates on its own collaborative database to support multi-user editing, and provides standard CSV and PDF exports to coordinate with external production offices and accounting departments."
    },
    {
      q: "How does ABRAM handle union compliance compared to Movie Magic?",
      a: "Movie Magic provides robust offline tools like Day Out of Days (DOOD) sheets for manual verification. ABRAM features active scheduling safety compliance—automatically checking wrap times against subsequent call times to warn planners of SAG-AFTRA, DGA, or IATSE rest margin violations in real-time."
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
              Cloud-Native Scheduling.
              <span className="block mt-[8px] text-zinc-500">
                A modern alternative to Movie Magic.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={revealVariants}
              custom={0.2}
              className="text-base sm:text-lg md:text-xl font-normal leading-7 text-zinc-400 max-w-2xl mx-auto mb-8 font-sans select-text"
            >
              Move away from legacy, offline desktop files. ABRAM unifies scheduling, script breakdowns, SAG/union compliance checks, and crew payouts into a real-time collaborative hub.
            </motion.p>

            <motion.div
              variants={revealVariants}
              custom={0.3}
              className="flex flex-col sm:flex-row gap-4 w-full justify-center items-center"
            >
              <Link
                href="/pricing"
                className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-full text-xs font-medium min-h-[44px] md:min-h-0"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/film-production/scheduling-budgeting"
                className="btn-glass w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-full text-xs font-medium min-h-[44px] md:min-h-0"
              >
                <span>Launch Schedule Playground</span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Main Differences Cards */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 bg-transparent overflow-visible mb-16 md:mb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-50 font-sans mb-3">
              How ABRAM Complements the Production Pipeline
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Movie Magic has been the offline standard for decades, but modern productions require connectivity. See how ABRAM updates your physical production pipeline.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Cloud Collaboration */}
            <div className="rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md hover:border-white/10 hover:bg-zinc-900/30 transition-all duration-300 p-6 flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center">
                    <Database className="w-4 h-4 text-zinc-400" />
                  </div>
                  <h3 className="text-sm font-semibold tracking-tight text-zinc-50 font-sans">
                    Cloud Workspace vs. Desktop Files
                  </h3>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans mb-4">
                  While Movie Magic excels in offline, single-user desktop precision for complex studio budgets, ABRAM offers a cloud-collaborative alternative. Multiple producers can edit stripboards and update line items concurrently in a shared, web-based workspace with automatic version history.
                </p>
                <ul className="text-xs text-zinc-500 space-y-2 mb-6 font-sans">
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                    <span>Real-time co-authoring with instant timeline rendering</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                    <span>Change tracking histories to easily review historical changes</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Card 2: Stripe Connect Crew Payouts */}
            <div className="rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md hover:border-white/10 hover:bg-zinc-900/30 transition-all duration-300 p-6 flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-zinc-400" />
                  </div>
                  <h3 className="text-sm font-semibold tracking-tight text-zinc-50 font-sans">
                    Direct Payout Infrastructure
                  </h3>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans mb-4">
                  Movie Magic focuses purely on scheduling and cost estimation, leaving payroll to external systems. ABRAM integrates Stripe Connect directly, letting teams process payouts and track invoice ledger balances from approved milestone packages.
                </p>
                <ul className="text-xs text-zinc-500 space-y-2 mb-6 font-sans">
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                    <span>Onboarding safety net keeps payments secure until Stripe setup completes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                    <span>Flat 5% processing fee on contractor payments</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Card 3: Automated Union Rest Checks */}
            <div className="rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md hover:border-white/10 hover:bg-zinc-900/30 transition-all duration-300 p-6 flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-zinc-400" />
                  </div>
                  <h3 className="text-sm font-semibold tracking-tight text-zinc-50 font-sans">
                    Automated Union Rest Checks
                  </h3>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans mb-4">
                  Movie Magic has long been the offline standard for generating detailed Day Out of Days (DOOD) sheets. ABRAM adds active, real-time safety checking—automatically monitoring call sheet wrap times and warning coordinators of SAG-AFTRA, DGA, or IATSE rest period compliance constraints.
                </p>
                <ul className="text-xs text-zinc-500 space-y-2 mb-6 font-sans">
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                    <span>Visual turnaround alerts warning coordinators of penalties</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                    <span>Dynamic schedule blocks lock automatically to avoid overlap errors</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Card 4: Dynamic Script Breakdown & Rosters */}
            <div className="rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md hover:border-white/10 hover:bg-zinc-900/30 transition-all duration-300 p-6 flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-zinc-400" />
                  </div>
                  <h3 className="text-sm font-semibold tracking-tight text-zinc-50 font-sans">
                    AI Ingestion & Unified Roster
                  </h3>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans mb-4">
                  While Movie Magic allows for highly precise, manual element tagging, ABRAM accelerates the breakdown phase by utilizing an automated screenplay parser to extract characters, locations, and props, linking them directly to profiles in your shared roster.
                </p>
                <ul className="text-xs text-zinc-500 space-y-2 mb-6 font-sans">
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                    <span>Automatic location, prop, character, and SFX extraction</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                    <span>Direct links to crew profiles with bi-directional Google/Outlook sync</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Matrix Table */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 bg-transparent overflow-visible mb-16 md:mb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-50 font-sans mb-3">
              Side-by-Side Comparison
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Compare ABRAM and Movie Magic across scheduling, budgeting, and production payroll.
            </p>
          </div>

          {/* Mobile swipe indicator */}
          <div className="md:hidden text-[10px] text-zinc-500 text-center mb-2 font-sans tracking-wide">
            Swipe to view →
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/5 bg-zinc-950/40">
            <table className="w-full text-left border-collapse min-w-[600px] font-sans">
              <thead>
                <tr className="border-b border-white/5 bg-zinc-900/30">
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">Feature</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-zinc-200">ABRAM</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Movie Magic</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {comparisonFeatures.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                    <td className="p-4 text-xs font-semibold text-zinc-100">{row.feature}</td>
                    <td className="p-4 text-xs text-zinc-300">
                      <div className="flex items-center gap-2">
                        {row.abramCheck ? (
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-red-500/50 shrink-0 mt-0.5" />
                        )}
                        <span>{row.abram}</span>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-zinc-500">
                      <div className="flex items-center gap-2">
                        {row.moviemagicCheck ? (
                          <Check className="w-4 h-4 text-emerald-400/60 shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-red-500/50 shrink-0 mt-0.5" />
                        )}
                        <span>{row.moviemagic}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {/* CTA Section */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 bg-transparent overflow-visible">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-white/8 bg-gradient-to-b from-zinc-900/40 to-zinc-950/20 backdrop-blur-md p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-white/[0.01] rounded-full blur-[80px] pointer-events-none -z-10" />
            <h2 className="text-2xl font-bold tracking-tight text-white font-sans mb-4">
              Bring Your Budget & Schedule to the Cloud
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto mb-8 font-sans leading-relaxed">
              Consolidate offline scheduling, script breakdowns, dynamic budgets, and crew payments in a single platform. Make production management faster and completely error-free.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/pricing"
                className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-full text-xs font-medium min-h-[44px] md:min-h-0"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/film-production/scheduling-budgeting"
                className="btn-glass w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-full text-xs font-medium min-h-[44px] md:min-h-0"
              >
                <span>Try Scheduling Playground</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trademark Disclaimer */}
      <section className="max-w-5xl mx-auto px-4 mt-12 text-center">
        <p className="text-[10px] text-zinc-500/80 leading-relaxed font-light select-text">
          Disclaimer: Movie Magic is a registered trademark of Entertainment Partners. ABRAM is an independent platform and has no official affiliation, sponsorship, endorsement, or partnership with Movie Magic, Entertainment Partners, SAG-AFTRA, DGA, IATSE, or any other labor union or platform mentioned. References to these brands or trademarks are for comparative, informational, and illustrative purposes only.
        </p>
      </section>
    </main>
  );
}
