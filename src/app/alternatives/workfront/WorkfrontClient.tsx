"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  X,
  ChevronDown,
  Gauge,
  Tag,
  Film,
  Wallet,
} from "lucide-react";
import AbramMark from "@/components/AbramMark";
import { revealVariants, staggerContainer } from "@/lib/motion";

type Faq = { q: string; a: string };

const differentiators = [
  {
    icon: Gauge,
    title: "Usable on the first day",
    body:
      "Workfront reviewers often describe a steep learning curve and consultant-led rollouts that run for months. ABRAM is designed to be productive right away, with an AI brief intake that turns a brief into work packages and estimates.",
    points: ["No multi-month implementation", "AI brief intake to start fast"],
  },
  {
    icon: Tag,
    title: "Pricing you can read up front",
    body:
      "Adobe keeps Workfront pricing quote-based across its Select, Prime, and Ultimate tiers. ABRAM publishes its pricing so you can evaluate cost before you talk to anyone.",
    points: ["Published plans, no quote required", "Right-sized for small and mid teams"],
  },
  {
    icon: Film,
    title: "Built for production, not generic work",
    body:
      "ABRAM ships film-grade scheduling with stripboard, Day-out-of-Days, run of show, script breakdown, and call sheets with union rest tracking. These production workflows sit outside a general work management platform.",
    points: ["Stripboard, DooD, and call sheets", "Union rest tracking on the schedule"],
  },
  {
    icon: Wallet,
    title: "Finance and clients in the same place",
    body:
      "ABRAM connects budgets to crew payouts and client-facing approvals, so a production runs from brief to payment without stitching together separate systems.",
    points: ["Budget variance and risk alerts", "Client portals with quote approval and payment"],
  },
];

const comparison = [
  {
    feature: "Enterprise work management",
    abram: "Work packages, milestones, and task tracking for productions",
    them: "Deep, highly configurable enterprise work management",
    abramYes: true,
    themYes: true,
  },
  {
    feature: "Proofing and portfolio planning at scale",
    abram: "Focused on production coordination and delivery",
    them: "Strong proofing, resource, and portfolio planning for large orgs",
    abramYes: false,
    themYes: true,
  },
  {
    feature: "Time to first value",
    abram: "Usable on day one with AI brief intake",
    them: "Commonly a multi-month, consultant-led rollout",
    abramYes: true,
    themYes: false,
  },
  {
    feature: "Published pricing",
    abram: "Plans published for direct evaluation",
    them: "Quote-based across Select, Prime, and Ultimate",
    abramYes: true,
    themYes: false,
  },
  {
    feature: "Film-native scheduling and call sheets",
    abram: "Stripboard, Day-out-of-Days, and union rest tracking",
    them: "General work management, not film specific",
    abramYes: true,
    themYes: false,
  },
  {
    feature: "Crew payouts and client portals",
    abram: "Milestone payouts, invoicing, and token-based portals",
    them: "Not part of the core product",
    abramYes: true,
    themYes: false,
  },
  {
    feature: "AI production copilot",
    abram: "ABRAM Core turns briefs into work packages and executes actions with approval",
    them: "Automation via Workfront Fusion, not a production copilot",
    abramYes: true,
    themYes: false,
  },
];

const migration = [
  {
    step: "1",
    title: "Start with a live brief",
    body: "Drop a brief into ABRAM and let the AI intake build the initial work packages and a rough estimate, so a project is structured in minutes rather than after a rollout.",
  },
  {
    step: "2",
    title: "Add the production layer",
    body: "Bring in scheduling, call sheets, and script breakdown so coordinators work in tools designed for set instead of generic task boards.",
  },
  {
    step: "3",
    title: "Connect budget, crew, and clients",
    body: "Attach budgets, enable crew payouts, and share client portals so approvals and payment run in the same platform your team already uses.",
  },
];

export default function WorkfrontClient({ faqs }: { faqs: Faq[] }) {
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
              Adobe Workfront Alternative
            </motion.span>
            <motion.h1 variants={revealVariants} custom={0.1} className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white leading-[1.12] mb-6 font-sans">
              ABRAM gives production teams enterprise-grade coordination they can run on the first day, with pricing published up front.
            </motion.h1>
            <motion.p variants={revealVariants} custom={0.2} className="text-base sm:text-lg md:text-xl leading-7 text-zinc-400 max-w-2xl mx-auto mb-8 font-sans">
              Skip the multi-month rollout and per-seat quotes, and manage briefs, schedules, budgets, and client approvals in a platform built for how productions actually work.
            </motion.p>
            <motion.div variants={revealVariants} custom={0.3} className="flex flex-col sm:flex-row gap-3 w-full justify-center items-center">
              <Link href="/pricing" className="btn-glass rounded-full px-4 py-1.5 text-xs w-full sm:w-auto min-h-[44px] md:min-h-0">
                <span>See pricing</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link href="/intelligence" className="btn-glass rounded-full px-4 py-1.5 text-xs w-full sm:w-auto min-h-[44px] md:min-h-0">
                <span>Explore the intelligence suite</span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Where Workfront is strong */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 mb-16 md:mb-24">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-white/8 bg-zinc-950/30 backdrop-blur-md p-6 md:p-8">
            <h2 className="text-sm font-semibold tracking-tight text-zinc-100 font-sans mb-3">Where Adobe Workfront is strong</h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
              Adobe Workfront is a powerful, highly configurable work management platform for large enterprises. Its proofing and review, strategic portfolio planning, resource management, and governance are built for big marketing organizations, and it fits naturally into the wider Adobe ecosystem through Workfront Fusion. For an enterprise standardizing hundreds of users on one system, that depth is a genuine strength. Production teams look for an alternative when they want faster adoption, published pricing, and film-specific workflows.
            </p>
          </div>
        </div>
      </section>

      {/* Differentiators */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 mb-16 md:mb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-50 font-sans mb-3">What ABRAM does differently</h2>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">Enterprise-grade coordination, right-sized and purpose-built for production.</p>
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
            <h2 className="text-xl font-semibold tracking-tight text-zinc-50 font-sans mb-3">ABRAM and Workfront side by side</h2>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">A feature comparison, with credit where Workfront leads at enterprise scale.</p>
          </div>
          <div className="md:hidden text-[10px] text-zinc-500 text-center mb-2 font-sans tracking-wide">Swipe to view →</div>
          <div className="overflow-x-auto rounded-xl border border-white/5 bg-zinc-950/40">
            <table className="w-full text-left border-collapse min-w-[600px] font-sans">
              <thead>
                <tr className="border-b border-white/5 bg-zinc-900/30">
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">Feature</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-zinc-200">ABRAM</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Adobe Workfront</th>
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
            <h2 className="text-xl font-semibold tracking-tight text-zinc-50 font-sans mb-3">Switching from Workfront to ABRAM</h2>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">A production team can be coordinating real work in ABRAM the same week it starts.</p>
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
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 font-sans">Purpose-built</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white font-sans mb-4">Coordinate production without the enterprise overhead</h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto mb-8 font-sans leading-relaxed">Give your team briefs, schedules, budgets, crew payouts, and client approvals in one platform, ready to use from day one.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link href="/pricing" className="btn-glass rounded-full px-4 py-1.5 text-xs w-full sm:w-auto min-h-[44px] md:min-h-0">
                <span>See pricing</span>
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
          Disclaimer: Adobe and Adobe Workfront are trademarks of Adobe Inc. ABRAM is an independent platform with no affiliation, sponsorship, endorsement, or partnership with Adobe Inc. or any other organization mentioned. References to these brands are for comparative and informational purposes only, and product details reflect publicly available information at the time of writing.
        </p>
      </section>
    </main>
  );
}
