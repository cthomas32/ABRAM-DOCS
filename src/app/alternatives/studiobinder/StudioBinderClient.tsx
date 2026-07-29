"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  X,
  ChevronDown,
  PieChart,
  Wallet,
  ShieldCheck,
  MonitorSmartphone,
} from "lucide-react";
import AbramMark from "@/components/AbramMark";
import CallSheetMockup from "@/components/film-production/CallSheetMockup";
import { revealVariants, staggerContainer } from "@/lib/motion";

type Faq = { q: string; a: string };

const differentiators = [
  {
    icon: PieChart,
    title: "Native budget tracking",
    body: "ABRAM tracks live budget variance, raises risk alerts before overruns land, and calibrates future estimates directly from real production actuals.",
    points: [
      "Live variance against approved budgets",
      "Automated risk alerts for overruns",
    ],
  },
  {
    icon: Wallet,
    title: "Crew payouts and invoicing",
    body: "Pay freelance crew directly from approved milestones and issue client invoices from the same workspace without extra software.",
    points: [
      "Milestone-based payouts via Stripe",
      "Client invoicing without external tools",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Union rest tracking",
    body: "ABRAM monitors wrap-to-call turnaround on the schedule and alerts coordinators when rest windows violate SAG-AFTRA, DGA, or IATSE rules.",
    points: [
      "Turnaround warnings on the stripboard",
      "Configurable thresholds per union contract",
    ],
  },
  {
    icon: MonitorSmartphone,
    title: "Client approval portals",
    body: "Token-based portals let clients review quotes, sign off on deliverables, and submit payments without creating an account.",
    points: [
      "Quote approval with zero account setup",
      "Instant payments on the same secure link",
    ],
  },
];

const comparison = [
  {
    feature: "Digital call sheets",
    abram: "Live call sheets linked to schedule with email/Slack dispatch & one-click RSVP",
    them: "Polished call sheet templates sent via email",
    abramYes: true,
    themYes: true,
  },
  {
    feature: "Shooting schedule & stripboard",
    abram: "Interactive stripboard, Day-out-of-Days, and rest period violation alerts",
    them: "Visual shooting schedules and calendar views",
    abramYes: true,
    themYes: true,
  },
  {
    feature: "Script breakdown",
    abram: "AI-assisted breakdown of characters, props, locations, and elements",
    them: "Manual click-and-tag breakdown workspace",
    abramYes: true,
    themYes: true,
  },
  {
    feature: "Budget tracking",
    abram: "Native budget variance, risk alerts, and cost-to-complete tracking",
    them: "Not built in (requires external tools)",
    abramYes: true,
    themYes: false,
  },
  {
    feature: "Crew payouts & invoicing",
    abram: "Milestone crew payouts and client invoicing built in",
    them: "Planning only (payments handled in separate tools)",
    abramYes: true,
    themYes: false,
  },
  {
    feature: "Client approval portal",
    abram: "Token-based portals for quote approvals and payments",
    them: "Not offered",
    abramYes: true,
    themYes: false,
  },
  {
    feature: "AI production copilot",
    abram: "ABRAM Core parses briefs, builds work packages, and automates logistics",
    them: "Not offered",
    abramYes: true,
    themYes: false,
  },
];

const migration = [
  {
    step: "1",
    title: "Import active productions & roster",
    body: "Import your active projects and crew contacts, then set up your shooting schedule on the live stripboard.",
  },
  {
    step: "2",
    title: "Connect budget & payouts",
    body: "Attach budgets to projects to track live variance and enable automated milestone payouts to crew.",
  },
  {
    step: "3",
    title: "Share client portals",
    body: "Send token-based portal links for fast quote approvals and payments without new logins.",
  },
];

export default function StudioBinderClient({ faqs }: { faqs: Faq[] }) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const toggleFaq = (i: number) => setActiveFaq(activeFaq === i ? null : i);

  return (
    <main className="text-zinc-100 overflow-x-hidden pt-24 pb-20 relative z-10 isolate">
      <div className="absolute top-12 left-1/4 w-[300px] md:w-[600px] h-[300px] bg-gradient-to-tr from-white/[0.01] via-zinc-800/10 to-transparent rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[40%] right-1/4 w-[280px] md:w-[500px] h-[280px] bg-[#8ECAFF]/[0.02] rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Hero */}
      <section className="relative w-full flex flex-col justify-center py-12 md:py-20 px-4 sm:px-6 lg:px-8 mb-8 md:mb-12">
        <div className="max-w-7xl mx-auto w-full">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center text-center max-w-4xl mx-auto w-full"
          >
            <motion.span variants={revealVariants} custom={0.0} className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-4 font-sans block">
              StudioBinder Alternative
            </motion.span>
            <motion.h1 variants={revealVariants} custom={0.1} className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white leading-[1.12] mb-6 font-sans">
              Connect Your Call Sheets to Live Budgets, Crew Payouts & Client Sign-Offs
            </motion.h1>
            <motion.p variants={revealVariants} custom={0.2} className="text-base sm:text-lg md:text-xl leading-7 text-zinc-400 max-w-2xl mx-auto mb-8 font-sans">
              Keep the clean call sheets you expect from StudioBinder, and add the native budgeting, crew payouts, and client portals that usually live in separate tools.
            </motion.p>
            <motion.div variants={revealVariants} custom={0.3} className="flex flex-col sm:flex-row gap-3 w-full justify-center items-center">
              <Link href="/pricing" className="btn-glass rounded-full px-4 py-1.5 text-xs w-full sm:w-auto min-h-[44px] md:min-h-0">
                <span>Get started free</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link href="/film-production" className="btn-glass rounded-full px-4 py-1.5 text-xs w-full sm:w-auto min-h-[44px] md:min-h-0">
                <span>Explore film production</span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Visual Call Sheet Component Section */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 mb-16 md:mb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-2 inline-block font-sans">
              LIVE CALL SHEET WORKFLOW
            </span>
            <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-white font-sans">
              Call Sheets That Automatically Update with Your Schedule & Budget
            </h2>
          </div>
          <div className="rounded-2xl border border-white/10 bg-zinc-950/60 backdrop-blur-md p-4 sm:p-6 shadow-2xl">
            <CallSheetMockup />
          </div>
        </div>
      </section>

      {/* Differentiators */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 mb-16 md:mb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-50 font-sans mb-3">Where Teams Outgrow StudioBinder</h2>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">Key capabilities ABRAM unifies around your scheduling workflow.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {differentiators.map((d, i) => (
              <div key={i} className="rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md hover:border-white/10 hover:bg-zinc-900/30 transition-all duration-300 p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center">
                    <d.icon className="w-4 h-4 text-zinc-400" />
                  </div>
                  <h3 className="text-sm font-semibold tracking-tight text-zinc-50 font-sans">{d.title}</h3>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans mb-4">{d.body}</p>
                <ul className="text-xs text-zinc-500 space-y-2 font-sans">
                  {d.points.map((p, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Comparison table */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 mb-16 md:mb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-50 font-sans mb-3">ABRAM and StudioBinder side by side</h2>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">A feature comparison across the production lifecycle, with credit where StudioBinder is strong.</p>
          </div>
          <div className="md:hidden text-[10px] text-zinc-500 text-center mb-2 font-sans tracking-wide">Swipe to view →</div>
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
                {comparison.map((row, i) => (
                  <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                    <td className="p-4 text-xs font-semibold text-zinc-100">{row.feature}</td>
                    <td className="p-4 text-xs text-zinc-300">
                      <div className="flex items-start gap-2">
                        {row.abramYes ? <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <X className="h-4 w-4 text-red-500/50 shrink-0 mt-0.5" />}
                        <span>{row.abram}</span>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-zinc-500">
                      <div className="flex items-start gap-2">
                        {row.themYes ? <Check className="w-4 h-4 text-emerald-400/60 shrink-0 mt-0.5" /> : <X className="h-4 w-4 text-red-500/50 shrink-0 mt-0.5" />}
                        <span>{row.them}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Migration */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 mb-16 md:mb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-50 font-sans mb-3">Switching from StudioBinder to ABRAM</h2>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">Most teams move one active production first and expand once the finance and client workflow is in place.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {migration.map((m, i) => (
              <div key={i} className="rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md p-6">
                <div className="text-[10px] font-semibold tracking-widest text-zinc-500 mb-3 font-sans">STEP {m.step}</div>
                <h3 className="text-sm font-semibold tracking-tight text-zinc-100 font-sans mb-2">{m.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">{m.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-white font-sans">Frequently asked questions</h2>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="glass-panel rounded-2xl border border-white/5 overflow-hidden transition-all duration-300">
              <button onClick={() => toggleFaq(i)} type="button" className="w-full flex items-center justify-between p-5 text-left text-sm font-medium text-zinc-200 hover:text-white transition-colors focus:outline-none">
                <span>{faq.q}</span>
                <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform duration-300 ${activeFaq === i ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence initial={false}>
                {activeFaq === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden border-t border-white/[0.03]">
                    <p className="p-5 text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-white/8 bg-gradient-to-b from-zinc-900/40 to-zinc-950/20 backdrop-blur-md p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-white/[0.01] rounded-full blur-[80px] pointer-events-none -z-10" />
            <div className="flex items-center justify-center gap-2 mb-4">
              <AbramMark size={16} />
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 font-sans">One platform</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white font-sans mb-4">Run the whole production in one place</h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto mb-8 font-sans leading-relaxed">Bring call sheets, scheduling, script breakdown, budgets, crew payouts, and client approvals together, then let ABRAM Core help you move faster.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link href="/pricing" className="btn-glass rounded-full px-4 py-1.5 text-xs w-full sm:w-auto min-h-[44px] md:min-h-0">
                <span>Get started free</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link href="/intelligence/brain" className="btn-glass rounded-full px-4 py-1.5 text-xs w-full sm:w-auto min-h-[44px] md:min-h-0">
                <span>Meet ABRAM Core</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="max-w-5xl mx-auto px-4 mt-12 text-center">
        <p className="text-[10px] text-zinc-500/80 leading-relaxed font-light">
          Disclaimer: StudioBinder is a trademark of StudioBinder, Inc. ABRAM is an independent platform with no affiliation, sponsorship, endorsement, or partnership with StudioBinder, Inc., SAG-AFTRA, DGA, IATSE, or any other organization mentioned. References to these brands are for comparative and informational purposes only, and product details reflect publicly available information at the time of writing.
        </p>
      </section>
    </main>
  );
}
