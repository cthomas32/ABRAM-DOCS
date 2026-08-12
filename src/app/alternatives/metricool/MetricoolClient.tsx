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
    body: "Raise a quote, convert it to an invoice, and take card payment through Stripe into your own account. The deal shows what has landed and how long the rest has been outstanding.",
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
    them: "Shareable and white label performance reports, with no deliverable approval flow",
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
    abram: "Paid, sent and overdue shown against the deal, with the age of every outstanding invoice",
    them: "Not offered",
    abramYes: true,
    themYes: false,
  },
  {
    feature: "Time tracking",
    abram: "Log hours against a deal to see which brands eat the week",
    them: "Not offered",
    abramYes: true,
    themYes: false,
  },
  {
    feature: "Link in bio page",
    abram: "Link Hub page at abram.network/l/yourname, free on every plan, with themes, backgrounds, button styling and scheduled blocks from Solo Lite up",
    them: "SmartLinks bio page with custom URL, design options and click analytics",
    abramYes: true,
    themYes: true,
  },
  {
    feature: "Free plan",
    abram: "Free plan with projects, deliverables and three invoices a month",
    them: "Free plan covering one brand and 20 scheduled posts a month",
    abramYes: true,
    themYes: true,
  },
  {
    feature: "Entry paid price",
    abram: "Solo Lite $19 a month, Solo Pro $34 a month",
    them: "Starter from €16 a month billed annually, Advanced from €43 a month, X connection sold as a paid add-on",
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
      <section className="relative w-full flex flex-col justify-center py-12 md:py-20 px-4 sm:px-6 lg:px-8 mb-8 md:mb-12">
        <div className="max-w-7xl mx-auto w-full">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center text-center max-w-4xl mx-auto w-full"
          >
            <motion.h1
              variants={revealVariants}
              custom={0.0}
              className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white leading-[1.12] mb-6 font-sans"
            >
              Metricool Runs Your Content. ABRAM Runs Your Brand Deals.
            </motion.h1>
            <motion.p
              variants={revealVariants}
              custom={0.15}
              className="text-base sm:text-lg md:text-xl leading-7 text-zinc-400 max-w-2xl mx-auto mb-8 font-sans"
            >
              Metricool schedules the posts and reports how they performed. ABRAM
              holds the deal behind them: the asset list, the brand approvals,
              the invoice and the payment.
            </motion.p>
            <motion.div
              variants={revealVariants}
              custom={0.3}
              className="flex flex-col sm:flex-row gap-3 w-full justify-center items-center"
            >
              <Link
                href="/creators"
                className="btn-glass rounded-full px-4 py-1.5 text-xs font-medium w-full sm:w-auto min-h-[44px] md:min-h-0"
              >
                <span>See ABRAM for creators</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/alternatives"
                className="btn-glass rounded-full px-4 py-1.5 text-xs font-medium w-full sm:w-auto min-h-[44px] md:min-h-0"
              >
                <span>See all comparisons</span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Differentiators */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 mb-16 md:mb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-50 font-sans mb-3">
              What ABRAM adds to a creator business
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Four things that come from treating a paid partnership as a project
              with money attached.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {differentiators.map((d, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md hover:border-white/10 hover:bg-zinc-900/30 transition-all duration-300 p-6 shadow-lg"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center">
                    <d.icon className="w-4 h-4 text-zinc-400" />
                  </div>
                  <h3 className="text-sm font-semibold tracking-tight text-zinc-50 font-sans">
                    {d.title}
                  </h3>
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
            <h2 className="text-xl font-semibold tracking-tight text-zinc-50 font-sans mb-3">
              ABRAM and Metricool side by side
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              The first four rows go to Metricool. Scheduling, publishing and
              audience analytics are theirs, and ABRAM has none of it.
            </p>
          </div>
          <div className="md:hidden text-[10px] text-zinc-500 text-center mb-2 font-sans tracking-wide">
            Swipe to view →
          </div>
          <div className="overflow-x-auto rounded-xl border border-white/5 bg-zinc-950/40">
            <table className="w-full text-left border-collapse min-w-[600px] font-sans">
              <thead>
                <tr className="border-b border-white/5 bg-zinc-900/30">
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Feature
                  </th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-zinc-200">
                    ABRAM
                  </th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Metricool
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {comparison.map((row, i) => (
                  <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                    <td className="p-4 text-xs font-semibold text-zinc-100">{row.feature}</td>
                    <td className="p-4 text-xs text-zinc-300">
                      <div className="flex items-start gap-2">
                        {row.abramYes ? (
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <X className="h-4 w-4 text-zinc-600 shrink-0 mt-0.5" />
                        )}
                        <span>{row.abram}</span>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-zinc-500">
                      <div className="flex items-start gap-2">
                        {row.themYes ? (
                          <Check className="w-4 h-4 text-emerald-400/60 shrink-0 mt-0.5" />
                        ) : (
                          <X className="h-4 w-4 text-zinc-600 shrink-0 mt-0.5" />
                        )}
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

      {/* Who each one fits */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 mb-16 md:mb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-50 font-sans mb-3">
              Which one fits your week
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              The honest split, so you spend your evaluation time on the right
              product.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md p-6">
              <h3 className="text-sm font-semibold tracking-tight text-zinc-100 font-sans mb-3">
                Metricool alone is enough if
              </h3>
              <ul className="text-xs text-zinc-400 space-y-2 font-sans leading-relaxed">
                <li>Your income comes from platform payouts rather than paid partnerships.</li>
                <li>Publishing on time across several platforms is the hard part of the week.</li>
                <li>You want competitor benchmarking and audience analytics in one dashboard.</li>
                <li>The brand work you take is one post at a time, invoiced once and forgotten.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-white/8 bg-zinc-900/30 backdrop-blur-md p-6">
              <h3 className="text-sm font-semibold tracking-tight text-zinc-100 font-sans mb-3">
                Add ABRAM if
              </h3>
              <ul className="text-xs text-zinc-400 space-y-2 font-sans leading-relaxed">
                <li>Several brand deals run at once, each with its own asset list and deadline.</li>
                <li>Brand contacts ask for status updates you answer by hand.</li>
                <li>Chasing a Net-90 invoice takes more of your week than filming does.</li>
                <li>Your deal history lives across a notes app, a spreadsheet and a DM thread.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Running both */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 mb-16 md:mb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-50 font-sans mb-3">
              Running both together
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Most creators who adopt ABRAM keep their scheduling tool. ABRAM
              takes over the notes app, the spreadsheet and the invoicing tool.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {together.map((m, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md p-6"
              >
                <div className="text-[10px] font-semibold tracking-widest text-zinc-500 mb-3 font-sans">
                  STEP {m.step}
                </div>
                <h3 className="text-sm font-semibold tracking-tight text-zinc-100 font-sans mb-2">
                  {m.title}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">{m.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-white font-sans">
            Frequently asked questions
          </h2>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="glass-panel rounded-2xl border border-white/5 overflow-hidden transition-all duration-300"
            >
              <button
                onClick={() => toggleFaq(i)}
                type="button"
                className="w-full flex items-center justify-between p-5 text-left text-sm font-medium text-zinc-200 hover:text-white transition-colors focus:outline-none"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`h-4 w-4 text-zinc-500 transition-transform duration-300 ${
                    activeFaq === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence initial={false}>
                {activeFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden border-t border-white/[0.03]"
                  >
                    <p className="p-5 text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
                      {faq.a}
                    </p>
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
            </div>
            <h2 className="text-2xl font-medium tracking-tight text-white font-sans mb-4">
              Give your brand deals a system of their own
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto mb-8 font-sans leading-relaxed">
              Deals, deliverables, brand approvals, invoices and payments in one
              workspace, alongside whichever scheduling tool you already trust.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link
                href="/pricing"
                className="btn-glass rounded-full px-4 py-1.5 text-xs font-medium w-full sm:w-auto min-h-[44px] md:min-h-0"
              >
                <span>Get started free</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/creators"
                className="btn-glass rounded-full px-4 py-1.5 text-xs font-medium w-full sm:w-auto min-h-[44px] md:min-h-0"
              >
                <span>ABRAM for creators</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="max-w-5xl mx-auto px-4 mt-12 text-center">
        <p className="text-[10px] text-zinc-500/80 leading-relaxed font-light">
          Disclaimer: Metricool is a trademark of its respective owner. ABRAM is
          an independent platform with no affiliation, sponsorship, endorsement,
          or partnership with Metricool. References are for comparative and
          informational purposes only. Metricool product and pricing details on
          this page reflect their published pages as read in August 2026 and may
          have changed since. Metricool prices are listed in euros by the vendor
          and ABRAM prices in US dollars.
        </p>
      </section>
    </main>
  );
}
