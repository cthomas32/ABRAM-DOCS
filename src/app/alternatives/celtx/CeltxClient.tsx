"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  X,
  ChevronDown,
  Scissors,
  PieChart,
  Wallet,
  Layers,
} from "lucide-react";
import AbramMark from "@/components/AbramMark";
import { revealVariants, staggerContainer } from "@/lib/motion";

type Faq = { q: string; a: string };

const differentiators = [
  {
    icon: Scissors,
    title: "Breakdown that drives the production",
    body:
      "ABRAM turns AI script breakdown into scheduling, budget lines, and client-ready quotes on the same production. Elements you tag once carry through the whole workflow.",
    points: ["AI breakdown of characters and elements", "One dataset from script to schedule"],
  },
  {
    icon: PieChart,
    title: "Deeper budget tracking",
    body:
      "ABRAM tracks budget variance, raises risk alerts as spend moves, and calibrates future estimates from your real actuals, extending well past pre-production planning.",
    points: ["Live variance and risk alerts", "Estimates that learn from your data"],
  },
  {
    icon: Wallet,
    title: "Crew payouts and client portals",
    body:
      "ABRAM pays crew from approved milestones, invoices clients, and shares token-based portals where clients approve quotes and pay without a login.",
    points: ["Milestone crew payouts", "Client quote approval and payment"],
  },
  {
    icon: Layers,
    title: "One platform across tiers",
    body:
      "ABRAM keeps scheduling, budgeting, payouts, and client workflows in a single platform, so capabilities stay together as a production grows.",
    points: ["Scheduling, finance, and clients together", "AI brief intake to start fast"],
  },
];

const comparison = [
  {
    feature: "Scriptwriting and storyboarding",
    abram: "Focused on production management around the script",
    them: "Strong dedicated screenwriting and storyboarding tools",
    abramYes: false,
    themYes: true,
  },
  {
    feature: "Script breakdown",
    abram: "AI-assisted breakdown that flows into scheduling and budget",
    them: "Tagged breakdown and reports for pre-production",
    abramYes: true,
    themYes: true,
  },
  {
    feature: "Shooting schedule",
    abram: "Stripboard, Day-out-of-Days, and call sheets",
    them: "Scheduling and shot planning tools",
    abramYes: true,
    themYes: true,
  },
  {
    feature: "Budget tracking with variance",
    abram: "Variance, risk alerts, and calibration from actuals",
    them: "Budget management focused on pre-production planning",
    abramYes: true,
    themYes: false,
  },
  {
    feature: "Crew payouts and invoicing",
    abram: "Milestone crew payouts and client invoicing built in",
    them: "Not part of the product",
    abramYes: true,
    themYes: false,
  },
  {
    feature: "Client approval portal",
    abram: "Token-based portals with quote approval and payment",
    them: "Not offered",
    abramYes: true,
    themYes: false,
  },
  {
    feature: "AI production copilot",
    abram: "ABRAM Core turns briefs into work packages and executes actions with approval",
    them: "Not offered",
    abramYes: true,
    themYes: false,
  },
];

const migration = [
  {
    step: "1",
    title: "Bring your breakdown into ABRAM",
    body: "Import or run an AI breakdown of your script so characters, props, and elements populate the production and feed the schedule directly.",
  },
  {
    step: "2",
    title: "Attach the budget and schedule",
    body: "Build the shooting schedule on the stripboard and connect a budget so variance and risk alerts track against actuals as the production moves.",
  },
  {
    step: "3",
    title: "Turn on payouts and client access",
    body: "Enable crew payouts and share a token-based client portal so approvals, invoicing, and payment run in the same platform as your creative work.",
  },
];

export default function CeltxClient({ faqs }: { faqs: Faq[] }) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const toggleFaq = (i: number) => setActiveFaq(activeFaq === i ? null : i);

  return (
    <main className="text-zinc-100 overflow-x-hidden pt-24 pb-20 relative z-10 isolate">
      <div className="absolute top-12 left-1/4 w-[300px] md:w-[600px] h-[300px] bg-gradient-to-tr from-white/[0.01] via-zinc-800/10 to-transparent rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[40%] right-1/4 w-[280px] md:w-[500px] h-[280px] bg-[#8ECAFF]/[0.02] rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Hero */}
      <section className="relative w-full flex flex-col justify-center py-12 md:py-20 px-4 sm:px-6 lg:px-8 mb-8 md:mb-12">
        <div className="max-w-7xl mx-auto w-full">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col items-center text-center max-w-4xl mx-auto w-full">
            <motion.span variants={revealVariants} custom={0.0} className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-4 font-sans block">
              Celtx Alternative
            </motion.span>
            <motion.h1 variants={revealVariants} custom={0.1} className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white leading-[1.12] mb-6 font-sans">
              ABRAM carries your script breakdown all the way into budgets, crew payouts, and client-ready approvals.
            </motion.h1>
            <motion.p variants={revealVariants} custom={0.2} className="text-base sm:text-lg md:text-xl leading-7 text-zinc-400 max-w-2xl mx-auto mb-8 font-sans">
              Keep writing and breaking down scripts, and run the money, the crew, and the client relationship from the same platform.
            </motion.p>
            <motion.div variants={revealVariants} custom={0.3} className="flex flex-col sm:flex-row gap-3 w-full justify-center items-center">
              <Link href="/pricing" className="btn-glass rounded-full px-4 py-1.5 text-xs w-full sm:w-auto min-h-[44px] md:min-h-0">
                <span>Get started free</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link href="/film-production/script-breakdown" className="btn-glass rounded-full px-4 py-1.5 text-xs w-full sm:w-auto min-h-[44px] md:min-h-0">
                <span>See script breakdown</span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Where Celtx is strong */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 mb-16 md:mb-24">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-white/8 bg-zinc-950/30 backdrop-blur-md p-6 md:p-8">
            <h2 className="text-sm font-semibold tracking-tight text-zinc-100 font-sans mb-3">Where Celtx is strong</h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
              Celtx is a capable, affordable script-first suite with genuinely good scriptwriting, storyboarding, breakdown, and collaborative pre-production, which has earned it a large following among indie filmmakers and students. If your center of gravity is writing and planning the shoot, Celtx does that well. Teams look for an alternative when they need deeper budget tracking, crew payments, and client-facing approvals in the same place, and when capabilities feel spread across separate tiers.
            </p>
          </div>
        </div>
      </section>

      {/* Differentiators */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 mb-16 md:mb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-50 font-sans mb-3">What ABRAM does differently</h2>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">The production, finance, and client layers that sit beyond script-first tools.</p>
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
            <h2 className="text-xl font-semibold tracking-tight text-zinc-50 font-sans mb-3">ABRAM and Celtx side by side</h2>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">A feature comparison, with credit where Celtx is the stronger script-first choice.</p>
          </div>
          <div className="md:hidden text-[10px] text-zinc-500 text-center mb-2 font-sans tracking-wide">Swipe to view →</div>
          <div className="overflow-x-auto rounded-xl border border-white/5 bg-zinc-950/40">
            <table className="w-full text-left border-collapse min-w-[600px] font-sans">
              <thead>
                <tr className="border-b border-white/5 bg-zinc-900/30">
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">Feature</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-zinc-200">ABRAM</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Celtx</th>
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
            <h2 className="text-xl font-semibold tracking-tight text-zinc-50 font-sans mb-3">Switching from Celtx to ABRAM</h2>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">Move one production across first, keeping your writing tool if you prefer, and let ABRAM run everything around it.</p>
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
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 font-sans">Script to screen</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white font-sans mb-4">Run the production around your script</h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto mb-8 font-sans leading-relaxed">Take your breakdown into scheduling, budgets, crew payouts, and client approvals, with ABRAM Core helping at every step.</p>
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
          Disclaimer: Celtx is a trademark of its respective owner. ABRAM is an independent platform with no affiliation, sponsorship, endorsement, or partnership with Celtx or any other organization mentioned. References to these brands are for comparative and informational purposes only, and product details reflect publicly available information at the time of writing.
        </p>
      </section>
    </main>
  );
}
