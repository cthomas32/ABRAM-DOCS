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
import AgencyClientPortalMockup from "@/components/agency/AgencyClientPortalMockup";
import { revealVariants, staggerContainer } from "@/lib/motion";

type Faq = { q: string; a: string };

const differentiators = [
  {
    icon: Gauge,
    title: "Usable on day one",
    body: "Skip multi-month consultant rollouts. ABRAM's AI brief intake turns creative briefs into work packages and estimates in minutes.",
    points: ["Zero multi-month onboarding", "AI brief intake to launch immediately"],
  },
  {
    icon: Tag,
    title: "Transparent, published pricing",
    body: "No sales calls or hidden enterprise tiers. ABRAM publishes simple, predictable plans right on the site.",
    points: ["Transparent pricing tiers", "Right-sized for studios and agile agencies"],
  },
  {
    icon: Film,
    title: "Purpose-built for production sets",
    body: "Includes stripboard scheduling, script breakdown, call sheets, and union rest window tracking out of the box.",
    points: ["Native stripboard & call sheets", "SAG-AFTRA / DGA turnaround alerts"],
  },
  {
    icon: Wallet,
    title: "Integrated finance & client portals",
    body: "Connect budget variance tracking directly to Stripe crew payouts and token-based client approval links.",
    points: ["Live budget variance tracking", "Client approval portals with instant payments"],
  },
];

const comparison = [
  {
    feature: "Creative work management",
    abram: "Work packages, milestones, and asset tracking for productions",
    them: "Configurable enterprise ticket queues and work management",
    abramYes: true,
    themYes: true,
  },
  {
    feature: "Strategic portfolio governance",
    abram: "Focused on production delivery and financial actuals",
    them: "Heavy corporate portfolio governance for enterprise marketing",
    abramYes: false,
    themYes: true,
  },
  {
    feature: "Time to first value",
    abram: "Usable on day one with AI brief intake",
    them: "Commonly a multi-month consultant-led rollout",
    abramYes: true,
    themYes: false,
  },
  {
    feature: "Transparent pricing",
    abram: "Published plans available immediately online",
    them: "Quote-based custom sales pricing",
    abramYes: true,
    themYes: false,
  },
  {
    feature: "Film & video production tools",
    abram: "Stripboard, Day-out-of-Days, and union rest tracking",
    them: "General ticket management (not production-native)",
    abramYes: true,
    themYes: false,
  },
  {
    feature: "Crew payouts & client portals",
    abram: "Milestone payouts, invoicing, and zero-login client portals",
    them: "Not offered",
    abramYes: true,
    themYes: false,
  },
  {
    feature: "AI production copilot",
    abram: "ABRAM Core parses briefs and automates operational tasks",
    them: "Basic integration rules via Workfront Fusion",
    abramYes: true,
    themYes: false,
  },
];

const migration = [
  {
    step: "1",
    title: "Upload your brief",
    body: "Drop a creative brief into ABRAM to automatically generate work packages and estimates in minutes.",
  },
  {
    step: "2",
    title: "Activate production set tools",
    body: "Deploy stripboard scheduling, call sheets, and crew rosters tailored specifically for production teams.",
  },
  {
    step: "3",
    title: "Connect client portals & payouts",
    body: "Enable Stripe payouts and share client approval portals for frictionless billing.",
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
              Agile Creative Operations Without the Enterprise Complexity
            </motion.h1>
            <motion.p variants={revealVariants} custom={0.2} className="text-base sm:text-lg md:text-xl leading-7 text-zinc-400 max-w-2xl mx-auto mb-8 font-sans">
              Skip multi-month consultant implementations. Manage briefs, schedules, budgets, and client approvals in a system built for creative sets.
            </motion.p>
            <motion.div variants={revealVariants} custom={0.3} className="flex flex-col sm:flex-row gap-3 w-full justify-center items-center">
              <Link href="/pricing" className="btn-glass rounded-full px-4 py-1.5 text-xs w-full sm:w-auto min-h-[44px] md:min-h-0">
                <span>See pricing</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link href="/intelligence" className="btn-glass rounded-full px-4 py-1.5 text-xs w-full sm:w-auto min-h-[44px] md:min-h-0">
                <span>Explore intelligence suite</span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Agency Client Portal Visual Section */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 mb-16 md:mb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-2 inline-block font-sans">
              FRICTIONLESS CLIENT PORTALS & APPROVALS
            </span>
            <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-white font-sans">
              Token-Based Client Portals for Fast Quote Approval & Sign-Off
            </h2>
          </div>
          <div className="rounded-2xl border border-white/10 bg-zinc-950/60 backdrop-blur-md p-4 sm:p-6 shadow-2xl">
            <AgencyClientPortalMockup />
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
