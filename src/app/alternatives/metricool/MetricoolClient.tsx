"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  X,
  ChevronDown,
  Layers,
  ListChecks,
  Wallet,
  Link2,
} from "lucide-react";
import AbramMark from "@/components/AbramMark";
import { revealVariants, staggerContainer } from "@/lib/motion";

type Faq = { q: string; a: string };

const differentiators = [
  {
    icon: Layers,
    title: "A brand deal is a project with a fee and a date",
    body: "The deal holds the money, the live date, the brand contact and the full asset list on one record, so a five post campaign reads as one job rather than five scattered drafts.",
    points: [
      "Deal fee and live dates on the record",
      "Every deal visible on one calendar",
    ],
  },
  {
    icon: ListChecks,
    title: "Every asset carries its own status",
    body: "Each post, video and story moves through not started, in progress, in review, approved and completed. Revision requests reopen the asset and keep a count of the rounds.",
    points: [
      "Per asset status across the campaign",
      "Revision rounds recorded on the asset",
    ],
  },
  {
    icon: Link2,
    title: "The brand contact approves from a portal link",
    body: "Send a private link. The brand reads current status, leaves notes and approves the assets they are happy with, without an account and without a password.",
    points: [
      "Five active brand portals on Solo Pro",
      "Approvals and comments in one thread",
    ],
  },
  {
    icon: Wallet,
    title: "Quotes, invoices and payment on the deal",
    body: "Raise a quote, convert it to an invoice, and take card payment through Stripe into your own account. The deal shows what has been paid and what is still open against its due date.",
    points: [
      "Card payment through your own Stripe account",
      "Outstanding balance shown per deal",
    ],
  },
];

const comparison = [
  {
    feature: "Post scheduling and publishing",
    abram: "Not offered. ABRAM plans the work behind a post and leaves publishing to your scheduling tool",
    them: "Scheduling and auto publishing across Instagram, TikTok, YouTube, Facebook, LinkedIn, Pinterest and more",
    abramYes: false,
    themYes: true,
  },
  {
    feature: "Audience and post analytics",
    abram: "Not offered. ABRAM holds no reach, view or follower data",
    them: "Post, profile and audience analytics with historical data",
    abramYes: false,
    themYes: true,
  },
  {
    feature: "Competitor benchmarking",
    abram: "Not offered",
    them: "Tracks competitor accounts and benchmarks performance against them",
    abramYes: false,
    themYes: true,
  },
  {
    feature: "AI reporting on content",
    abram: "Not offered for social performance. ABRAM's assistant drafts deliverable lists and project structure",
    them: "AI generated performance reports and content suggestions",
    abramYes: false,
    themYes: true,
  },
  {
    feature: "Brand deal as a tracked project",
    abram: "Each deal is a project carrying the fee, live date, brand contact and asset list",
    them: "Not offered. Content is organised by brand and calendar rather than by deal",
    abramYes: true,
    themYes: false,
  },
  {
    feature: "Per asset delivery status",
    abram: "Five state lifecycle on every post, video and story, with revision rounds counted",
    them: "Not offered. A post is drafted, scheduled or published",
    abramYes: true,
    themYes: false,
  },
  {
    feature: "Brand approval portal",
    abram: "Token based portal where the brand contact reads status, comments and approves without an account",
    them: "Post approval and collaborator access on Advanced, aimed at approving content before it publishes rather than signing off a deal's deliverables",
    abramYes: true,
    themYes: false,
  },
  {
    feature: "Quotes and invoices",
    abram: "Quotes convert to invoices on the deal they belong to",
    them: "Not offered",
    abramYes: true,
    themYes: false,
  },
  {
    feature: "Taking payment",
    abram: "Card payment through Stripe into your own connected account, with you as merchant of record",
    them: "Not offered",
    abramYes: true,
    themYes: false,
  },
  {
    feature: "Payment tracking per deal",
    abram: "Draft, sent, paid and cancelled shown against the deal, with anything past its due date flagged overdue",
    them: "Not offered",
    abramYes: true,
    themYes: false,
  },
  {
    feature: "Time tracking",
    abram: "Log hours against a deal to see which brands eat the week, from Solo Pro up",
    them: "Not offered",
    abramYes: true,
    themYes: false,
  },
  {
    feature: "Link in bio page",
    abram: "Link Hub page at abram.network/l/yourname, free on every plan, with themes, backgrounds, button styling and scheduled blocks from Solo Lite up",
    them: "SmartLinks bio page with custom URL, design options and click analytics, on paid plans",
    abramYes: true,
    themYes: true,
  },
  {
    feature: "Free plan",
    abram: "Free plan with one active project, deliverables and three invoices a month",
    them: "Free plan covering one brand and 20 published posts a month",
    abramYes: true,
    themYes: true,
  },
  {
    feature: "Entry paid price",
    abram: "Solo Lite $19 a month, Solo Pro $34 a month",
    them: "Starter from €16 a month, Advanced from €43 a month, both scaling with brand count. X connection is a paid add-on on Free and Starter, included on Advanced",
    abramYes: true,
    themYes: true,
  },
];

const together = [
  {
    step: "1",
    title: "Keep scheduling where it is",
    body: "Metricool stays in charge of the calendar, the publishing queue and the numbers a post earns after it goes live. Nothing about that workflow changes.",
  },
  {
    step: "2",
    title: "Move the deals into ABRAM",
    body: "Create a project per live brand deal, add the fee and the live date, and list each post as a deliverable. This is the part currently living in a notes app and a spreadsheet.",
  },
  {
    step: "3",
    title: "Send the brand a portal link and an invoice",
    body: "The brand contact follows status and approves from a private link, then pays the invoice by card. Your outstanding balance sits on the deal instead of in a separate invoicing tool.",
  },
];

export default function MetricoolClient({ faqs }: { faqs: Faq[] }) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const toggleFaq = (i: number) => setActiveFaq(activeFaq === i ? null : i);

  return (
    <main className="text-zinc-100 overflow-x-hidden pt-24 pb-20 relative z-10 isolate">
      <div className="absolute top-12 left-1/4 w-[300px] md:w-[600px] h-[300px] bg-gradient-to-tr from-white/[0.01] via-zinc-800/10 to-transparent rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[40%] right-1/4 w-[280px] md:w-[500px] h-[280px] bg-[#8ECAFF]/[0.02] rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Hero */}
      <section className="relative w-full flex flex-col justify-center py-16 md:py-24 px-4 sm:px-6 lg:px-8 border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto w-full text-center">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center max-w-4xl mx-auto w-full space-y-6"
          >
            <motion.span
              variants={revealVariants}
              custom={0.0}
              className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 font-sans"
            >
              ABRAM vs METRICOOL
            </motion.span>

            <motion.h1
              variants={revealVariants}
              custom={0.05}
              className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white leading-[1.08] font-sans"
            >
              Metricool runs your content. ABRAM runs your brand deals.
            </motion.h1>

            <motion.p
              variants={revealVariants}
              custom={0.15}
              className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto font-sans leading-relaxed"
            >
              Metricool schedules posts and reports performance. ABRAM holds the commercial deal behind them: the asset list, client approval portals, invoices, and Stripe payouts.
            </motion.p>

            <motion.div
              variants={revealVariants}
              custom={0.3}
              className="flex flex-wrap gap-3 justify-center items-center pt-2"
            >
              <Link
                href="/pricing"
                className="btn-primary rounded-full px-7 py-3 text-xs font-medium flex items-center gap-2"
              >
                <span>Start Free Plan</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/creators"
                className="btn-glass rounded-full px-7 py-3 text-xs font-medium"
              >
                ABRAM for Creators
              </Link>
            </motion.div>

            {/* Quick System Summary Pills */}
            <motion.div
              variants={revealVariants}
              custom={0.4}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full pt-8 border-t border-white/[0.08] text-left"
            >
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/[0.06]">
                <div className="text-[10px] text-zinc-500 font-sans uppercase tracking-wider mb-1">Post Scheduling</div>
                <div className="text-sm font-semibold text-white font-sans">Metricool</div>
                <div className="text-[10px] text-zinc-400 font-sans mt-0.5">Keep existing workflow</div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/[0.06]">
                <div className="text-[10px] text-zinc-500 font-sans uppercase tracking-wider mb-1">Brand Deal CRM</div>
                <div className="text-sm font-semibold text-emerald-400 font-sans">ABRAM</div>
                <div className="text-[10px] text-emerald-400/80 font-sans mt-0.5">Fees, dates & scope</div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/[0.06]">
                <div className="text-[10px] text-zinc-500 font-sans uppercase tracking-wider mb-1">Client Portals</div>
                <div className="text-sm font-semibold text-emerald-400 font-sans">ABRAM</div>
                <div className="text-[10px] text-emerald-400/80 font-sans mt-0.5">Passwordless review link</div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/[0.06]">
                <div className="text-[10px] text-zinc-500 font-sans uppercase tracking-wider mb-1">Stripe Invoicing</div>
                <div className="text-sm font-semibold text-emerald-400 font-sans">ABRAM</div>
                <div className="text-[10px] text-emerald-400/80 font-sans mt-0.5">Direct card settlement</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Four Core Differentiators */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-white/[0.06]">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-2 inline-block font-sans">
            COMMERCIAL DIFFERENCE
          </span>
          <h2 className="text-2xl sm:text-3xl font-medium text-white font-sans">
            What ABRAM adds to creator operations
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {differentiators.map((d, i) => (
            <div
              key={i}
              className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-zinc-900/30 space-y-4 hover:border-white/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white shrink-0">
                  <d.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">0{i + 1} MODULE</div>
                  <h3 className="text-base font-semibold text-white font-sans">{d.title}</h3>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 font-sans leading-relaxed">{d.body}</p>
              <ul className="space-y-2 pt-2 border-t border-white/[0.04]">
                {d.points.map((p, j) => (
                  <li key={j} className="flex items-center gap-2 text-xs text-zinc-300 font-sans">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Side-by-Side Comparison Table */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-white/[0.06]">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-2 inline-block font-sans">
            FEATURE MATRIX
          </span>
          <h2 className="text-2xl sm:text-3xl font-medium text-white font-sans mb-3">
            ABRAM and Metricool side by side
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-sans">
            Metricool leads on scheduling and analytics. ABRAM leads on brand deal projects, client portals, and payments.
          </p>
        </div>

        <div className="w-full p-6 rounded-2xl border border-white/10 bg-zinc-900/30 overflow-x-auto">
          <p className="text-[10px] text-zinc-500 mb-2 md:hidden">Swipe to view →</p>
          <table className="w-full text-left border-collapse min-w-[700px] font-sans">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase font-semibold tracking-wider text-zinc-500">
                <th className="py-3 px-4 w-1/3">Feature Capability</th>
                <th className="py-3 px-4 w-1/3 text-emerald-400">ABRAM</th>
                <th className="py-3 px-4 w-1/3 text-zinc-400">Metricool</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {comparison.map((row, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors text-xs">
                  <td className="py-3.5 px-4 font-semibold text-white">{row.feature}</td>
                  <td className="py-3.5 px-4 text-zinc-300">
                    <div className="flex items-start gap-2">
                      {row.abramYes ? (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                      )}
                      <span>{row.abram}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-400">
                    <div className="flex items-start gap-2">
                      {row.themYes ? (
                        <Check className="w-4 h-4 text-emerald-400/70 shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                      )}
                      <span>{row.them}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Which One Fits Your Week */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-white/[0.06]">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-2 inline-block font-sans">
            WORKFLOW EVALUATION
          </span>
          <h2 className="text-2xl sm:text-3xl font-medium text-white font-sans">
            Which system fits your operation
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-zinc-900/30 space-y-4">
            <h3 className="text-base font-semibold text-white font-sans">Metricool alone is enough if:</h3>
            <ul className="space-y-3 text-xs sm:text-sm text-zinc-400 font-sans leading-relaxed">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                <span>Your income comes from platform payouts rather than paid brand partnerships.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                <span>Publishing on time across social networks is the primary challenge of your week.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                <span>You rely heavily on competitor benchmarking and audience growth analytics.</span>
              </li>
            </ul>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.02] space-y-4">
            <h3 className="text-base font-semibold text-emerald-400 font-sans">Add ABRAM if:</h3>
            <ul className="space-y-3 text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>You run multiple brand deals simultaneously, each with distinct deliverable schedules.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Brand clients ask for progress updates that you currently answer manually.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Chasing Net-30 or Net-90 invoices takes more time than producing content.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Running Both Together 3-Step Flow */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-white/[0.06]">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-2 inline-block font-sans">
            INTEGRATED WORKFLOW
          </span>
          <h2 className="text-2xl sm:text-3xl font-medium text-white font-sans">
            Running both systems together
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {together.map((m, i) => (
            <div key={i} className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-zinc-900/30 space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">STEP 0{m.step}</span>
              <h3 className="text-base font-semibold text-white font-sans">{m.title}</h3>
              <p className="text-xs sm:text-sm text-zinc-400 font-sans leading-relaxed">{m.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section className="w-full py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-2 inline-block font-sans">
            FREQUENTLY ASKED QUESTIONS
          </span>
          <h2 className="text-2xl sm:text-3xl font-medium text-white font-sans">
            Questions & Answers
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={faq.q} className="rounded-xl border border-white/[0.06] bg-zinc-900/40 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleFaq(i)}
                className="w-full flex items-center justify-between p-4 text-left font-sans text-xs sm:text-sm font-medium text-zinc-200 hover:text-white"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${activeFaq === i ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {activeFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 pb-4 text-xs text-zinc-400 font-sans leading-relaxed border-t border-white/[0.04] pt-3"
                  >
                    {faq.a}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="w-full py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-8 sm:p-12">
          <h2 className="text-2xl sm:text-4xl font-medium text-white font-sans mb-3">
            Give your brand deals a system of their own.
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto mb-8 font-sans leading-relaxed">
            Deals, deliverables, brand approval portals, and Stripe invoices in one workspace, alongside whichever social scheduler you already use.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <a href="https://app.abram.network" target="_blank" rel="noopener noreferrer" className="btn-primary rounded-full px-6 py-2.5 text-xs font-medium w-full sm:w-auto flex items-center justify-center gap-2">
              <span>Open ABRAM</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <Link href="/pricing" className="btn-glass rounded-full px-6 py-2.5 text-xs font-medium w-full sm:w-auto">
              See All Plans
            </Link>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="max-w-4xl mx-auto px-4 text-center">
        <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">
          Disclaimer: Metricool is a registered trademark of its respective owner. ABRAM is an independent platform with no affiliation, endorsement, or sponsorship with Metricool. Product and pricing comparison data reflects published pages as of August 2026.
        </p>
      </section>
    </main>
  );
}
