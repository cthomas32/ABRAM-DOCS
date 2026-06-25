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

export default function StudioBinderClient() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const comparisonFeatures = [
    {
      feature: "Digital Call Sheets",
      abram: "Dynamic, live call sheets with active Email & Slack broadcasts",
      studiobinder: "Visually elegant, templated call sheets with manual email distribution",
      abramCheck: true,
      studiobinderCheck: true
    },
    {
      feature: "Crew Payments & Payroll",
      abram: "Integrated Stripe Connect payouts (5% processing fee)",
      studiobinder: "Focuses on logistics; payroll requires external accounting integrations",
      abramCheck: true,
      studiobinderCheck: false
    },
    {
      feature: "Union Turnaround Checking",
      abram: "Automatic SAG-AFTRA, DGA & IATSE wrap-to-call margin warnings",
      studiobinder: "Flexible scheduling parameters with manual compliance validation",
      abramCheck: true,
      studiobinderCheck: false
    },
    {
      feature: "Unified Roster Calendar",
      abram: "Bi-directional Google/Outlook sync with live shared availability",
      studiobinder: "Project-level calendar schedules and contact directories",
      abramCheck: true,
      studiobinderCheck: false
    },
    {
      feature: "Screenplay Breakdown Engine",
      abram: "AI-assisted parsing of characters, props, VFX with auto-matching",
      studiobinder: "Highly visual, manual click-and-tag breakdown workspace",
      abramCheck: true,
      studiobinderCheck: true
    },
    {
      feature: "Project Scheduling",
      abram: "Drag-and-drop calendar boards with auto-turnaround safety alerts",
      studiobinder: "Visual stripboards and calendar tools for scene scheduling",
      abramCheck: true,
      studiobinderCheck: true
    }
  ];

  const faqs = [
    {
      q: "How does ABRAM compare to StudioBinder for production management?",
      a: "StudioBinder is a widely respected, visually elegant cloud platform known for its shot list builders and call sheet templates. ABRAM is a unified creative operations alternative built to bridge logistics and finance—adding direct Stripe Connect crew payouts, bi-directional calendar synchronization, and automated union rest compliance warnings to the scheduling and call sheet workflow."
    },
    {
      q: "Can I manage crew payouts directly inside ABRAM?",
      a: "Yes. While StudioBinder focuses exclusively on pre-production planning and scheduling logistics, ABRAM includes built-in Stripe Connect integrations. This enables production managers to pay freelance crew members directly from approved milestones and track expenses against the project budget."
    },
    {
      q: "How does ABRAM handle call sheet updates compared to StudioBinder?",
      a: "StudioBinder generates beautiful static call sheets that can be emailed or sent as PDFs. ABRAM links call sheets dynamically to the live schedule stripboard. If a producer updates shoot times on the stripboard, call sheets update instantly, and crew members are notified of the changes via Slack or Email with one-click RSVP confirmation."
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
                StudioBinder.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={revealVariants}
              custom={0.2}
              className="text-base sm:text-lg md:text-xl font-normal leading-7 text-zinc-400 max-w-2xl mx-auto mb-8 font-sans select-text"
            >
              Ditch fragmented spreadsheets and isolated calendars. ABRAM brings screenplay parsing, digital call sheets, active union compliance checks, and direct contractor payments into one secure platform.
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
                href="/docs"
                className="btn-glass w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-full text-xs font-medium min-h-[44px] md:min-h-0"
              >
                <span>Explore Documentation</span>
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
              Why Teams are Moving to ABRAM
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              While StudioBinder provides modular tools for templates and scheduling, it operates in silos. Here is how ABRAM bridges the gaps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Stripe Connect Payouts */}
            <div className="rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md hover:border-white/10 hover:bg-zinc-900/30 transition-all duration-300 p-6 flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-zinc-400" />
                  </div>
                  <h3 className="text-sm font-semibold tracking-tight text-zinc-50 font-sans">
                    Integrated Stripe Payouts
                  </h3>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans mb-4">
                  While StudioBinder focuses exclusively on production planning and scheduling logistics, ABRAM extends the workflow into the financial pipeline with native Stripe Connect integration, allowing you to pay crew directly from approved milestones.
                </p>
                <ul className="text-xs text-zinc-500 space-y-2 mb-6 font-sans">
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                    <span>Onboarding safety net holds funds securely until setup completes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                    <span>Transparent 5% payment processing fee on all subcontractor payouts</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Card 2: Union Wrap-to-Call Compliance */}
            <div className="rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md hover:border-white/10 hover:bg-zinc-900/30 transition-all duration-300 p-6 flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-zinc-400" />
                  </div>
                  <h3 className="text-sm font-semibold tracking-tight text-zinc-50 font-sans">
                    Union Rest Margin Checks
                  </h3>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans mb-4">
                  Ensure scheduling safety and track union compliance automatically. ABRAM monitors daily wrap times and alerts coordinators of SAG-AFTRA, DGA, or IATSE rest window alignments directly on the schedule.
                </p>
                <ul className="text-xs text-zinc-500 space-y-2 mb-6 font-sans">
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                    <span>Automatic warning overlays directly on the shoot calendar stripboard</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                    <span>Configurable threshold alerts for customized localized union contracts</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Card 3: Dynamic Digital Call Sheets */}
            <div className="rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md hover:border-white/10 hover:bg-zinc-900/30 transition-all duration-300 p-6 flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-zinc-400" />
                  </div>
                  <h3 className="text-sm font-semibold tracking-tight text-zinc-50 font-sans">
                    Live Call Sheet Ecosystem
                  </h3>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans mb-4">
                  StudioBinder is renowned for generating visually stunning call sheets. ABRAM builds on this by keeping call sheets dynamically linked to the live schedule. If scheduling times update, call sheets sync automatically, and notifications (via Slack or Email) alert the crew instantly.
                </p>
                <ul className="text-xs text-zinc-500 space-y-2 mb-6 font-sans">
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                    <span>One-click digital signature confirmation of call receipt</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                    <span>Real-time logistics, basecamp status, and location updates</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Card 4: Unified Calendar & Shared Rosters */}
            <div className="rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md hover:border-white/10 hover:bg-zinc-900/30 transition-all duration-300 p-6 flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-zinc-400" />
                  </div>
                  <h3 className="text-sm font-semibold tracking-tight text-zinc-50 font-sans">
                    Unified Availability Hub
                  </h3>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans mb-4">
                  Rosters shouldn't be isolated within single projects. ABRAM's unified organization dashboard matches crew profiles, tracks availability via bi-directional calendar syncs, and lets managers run booking simulations.
                </p>
                <ul className="text-xs text-zinc-500 space-y-2 mb-6 font-sans">
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                    <span>Syncs with Google Calendar and Microsoft Outlook automatically</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                    <span>Dispatches smart public RSVP links to confirm bookings instantly</span>
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
              See how ABRAM compares with StudioBinder across the complete production lifecycle.
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
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">StudioBinder</th>
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
                        {row.studiobinderCheck ? (
                          <Check className="w-4 h-4 text-emerald-400/60 shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-red-500/50 shrink-0 mt-0.5" />
                        )}
                        <span>{row.studiobinder}</span>
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

      {/* FAQ Callout / CTA */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 bg-transparent overflow-visible">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-white/8 bg-gradient-to-b from-zinc-900/40 to-zinc-950/20 backdrop-blur-md p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-white/[0.01] rounded-full blur-[80px] pointer-events-none -z-10" />
            <h2 className="text-2xl font-bold tracking-tight text-white font-sans mb-4">
              Ready to Upgrade Your Production Workflow?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto mb-8 font-sans leading-relaxed">
              Consolidate call sheets, scheduling, script breakdowns, rosters, and crew payments into a single, cloud-native operational cockpit. Empower your team to produce more, faster.
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
                href="/agency/crew-roster"
                className="btn-glass w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-full text-xs font-medium min-h-[44px] md:min-h-0"
              >
                <span>Learn Roster Management</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trademark Disclaimer */}
      <section className="max-w-5xl mx-auto px-4 mt-12 text-center">
        <p className="text-[10px] text-zinc-500/80 leading-relaxed font-light select-text">
          Disclaimer: StudioBinder is a trademark of StudioBinder Inc. ABRAM is an independent platform and has no official affiliation, sponsorship, endorsement, or partnership with StudioBinder Inc., SAG-AFTRA, DGA, IATSE, or any other labor union or platform mentioned. References to these brands or trademarks are for comparative, informational, and illustrative purposes only.
        </p>
      </section>
    </main>
  );
}
