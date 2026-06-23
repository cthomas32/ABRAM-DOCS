"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
  HelpCircle
} from "lucide-react";
import { revealVariants, staggerContainer } from "@/lib/motion";

export default function StudioBinderClient() {
  const comparisonFeatures = [
    {
      feature: "Digital Call Sheets",
      abram: "Dynamic, live call sheets with active SMS & Slack broadcasts",
      studiobinder: "Static PDF generator or basic email distributions",
      winner: "abram"
    },
    {
      feature: "Crew Payments & Payroll",
      abram: "Integrated Stripe Connect payouts (5% processing fee)",
      studiobinder: "No financial processing; requires external tools",
      winner: "abram"
    },
    {
      feature: "Union Turnaround Checking",
      abram: "Automatic SAG-AFTRA, DGA & IATSE wrap-to-call margin warnings",
      studiobinder: "Manual calculations only; no automated safety guards",
      winner: "abram"
    },
    {
      feature: "Unified Roster Calendar",
      abram: "Bi-directional Google/Outlook sync with live shared availability",
      studiobinder: "Isolated project calendars; no unified cross-project roster search",
      winner: "abram"
    },
    {
      feature: "Screenplay Breakdown Engine",
      abram: "AI-assisted parsing of characters, props, VFX with auto-matching",
      studiobinder: "Manual tag-and-click breakdown workflow",
      winner: "abram"
    },
    {
      feature: "Brief-to-Schedule Ingestion",
      abram: "AI analysis parses client briefs directly into milestone estimates",
      studiobinder: "Manual project creation from scratch only",
      winner: "abram"
    }
  ];

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
                  StudioBinder leaves crew invoicing and payroll completely up to you. ABRAM has a native integration with Stripe Connect. You can approve a milestone work package and payout your contractors directly with a single click.
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
                  Keep crew safe and avoid SAG-AFTRA, DGA, or IATSE turnaround penalties. ABRAM automatically tracks daily wrap times and warns planners when call sheets violate mandatory union rest windows.
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
                  StudioBinder generates beautiful static call sheets, but they don't sync. If the shoot schedule changes in ABRAM, the call sheets update automatically. Crew members receive live SMS and Slack notifications with directions, weather, and call times.
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
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{row.abram}</span>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-zinc-500">
                      <div className="flex items-center gap-2">
                        <X className="w-3.5 h-3.5 text-rose-500/80 shrink-0" />
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
