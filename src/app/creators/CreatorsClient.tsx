"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowUpRight, ChevronDown, Check } from "lucide-react";
import AbramMark from "@/components/AbramMark";
import { revealVariants, staggerContainer } from "@/lib/motion";

type Faq = { q: string; a: string };

type Step = {
  index: string;
  heading: string;
  body: string;
  visual: React.ReactNode;
};

/* Compact micro label used inside preview panels. */
function MicroLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[9px] font-semibold tracking-[0.18em] uppercase text-zinc-500 font-sans">
      {children}
    </span>
  );
}

function PreviewPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-zinc-950/40 backdrop-blur-md shadow-xl p-5 md:p-6 select-none">
      {children}
    </div>
  );
}

/* ---- Step 01 · The deal becomes a project ---- */
function DealPreview() {
  const rows = [
    { k: "Brand contact", v: "Nadia Ruiz" },
    { k: "Deal fee", v: "$6,500" },
    { k: "Live date", v: "Mar 14" },
    { k: "Deliverables", v: "4 assets" },
  ];
  return (
    <PreviewPanel>
      <div className="flex items-center justify-between mb-4">
        <MicroLabel>Brand Deal</MicroLabel>
        <span className="inline-flex items-center gap-1.5 text-[10px] text-zinc-400 font-sans">
          <AbramMark size={12} />
          Project
        </span>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 mb-4">
        <div className="text-xs font-medium text-zinc-100 font-sans mb-1">
          Halcyon Motors Spring Campaign
        </div>
        <p className="text-[11px] leading-relaxed text-zinc-400 font-sans">
          One long-form YouTube review, two TikTok cutdowns, and a story set,
          all due in the same three week window.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {rows.map((row) => (
          <div
            key={row.k}
            className="rounded-lg border border-white/[0.06] bg-zinc-900/40 px-3 py-2.5"
          >
            <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-sans mb-0.5">
              {row.k}
            </div>
            <div className="text-xs font-medium text-zinc-100 font-sans truncate">
              {row.v}
            </div>
          </div>
        ))}
      </div>
    </PreviewPanel>
  );
}

/* ---- Step 02 · Every asset carries a status ---- */
function DeliverablesPreview() {
  const assets = [
    { name: "YouTube review, 8 min", state: "Approved" },
    { name: "TikTok cutdown 01", state: "In Review" },
    { name: "TikTok cutdown 02", state: "In Progress" },
    { name: "Story set, 3 frames", state: "Not Started" },
  ];
  const tone: Record<string, string> = {
    Approved: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
    "In Review": "text-zinc-300 bg-white/[0.04] border-white/[0.1]",
    "In Progress": "text-zinc-300 bg-white/[0.04] border-white/[0.1]",
    "Not Started": "text-zinc-500 bg-white/[0.02] border-white/[0.06]",
  };
  return (
    <PreviewPanel>
      <div className="flex items-center justify-between mb-4">
        <MicroLabel>Deliverables</MicroLabel>
        <span className="text-[10px] text-zinc-400 font-sans">4 assets, 1 deal</span>
      </div>

      <div className="space-y-2">
        {assets.map((a) => (
          <div
            key={a.name}
            className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-zinc-900/40 px-3 py-2.5"
          >
            <span className="text-xs text-zinc-200 font-sans truncate">{a.name}</span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded-full border font-sans shrink-0 ${tone[a.state]}`}
            >
              {a.state}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
        <div className="text-[10px] text-zinc-400 font-sans leading-relaxed">
          Revision requests reopen the asset and keep a count, so a fourth round
          of notes is on the record.
        </div>
      </div>
    </PreviewPanel>
  );
}

/* ---- Step 03 · The brand watches from a portal ---- */
function BrandPortalPreview() {
  const items = [
    { name: "YouTube review", state: "Approved" },
    { name: "TikTok cutdown 01", state: "In Review" },
    { name: "Story set", state: "Not Started" },
  ];
  return (
    <PreviewPanel>
      <div className="flex items-center justify-between mb-4">
        <MicroLabel>Halcyon Brand Portal</MicroLabel>
        <span className="text-[10px] text-emerald-300 font-sans font-semibold">
          58% Done
        </span>
      </div>

      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-4">
        <div className="h-full w-[58%] rounded-full bg-white" />
      </div>

      <div className="space-y-2 mb-4">
        {items.map((d) => (
          <div
            key={d.name}
            className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-zinc-900/40 px-3 py-2"
          >
            <span className="text-xs text-zinc-200 font-sans truncate">{d.name}</span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded-full border font-sans shrink-0 ${
                d.state === "Approved"
                  ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/20"
                  : "text-zinc-400 bg-white/[0.03] border-white/[0.08]"
              }`}
            >
              {d.state}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2.5">
        <div className="text-[10px] text-zinc-400 font-sans leading-relaxed">
          The brand contact opens a private link, reads the current status, and
          approves without making an account.
        </div>
      </div>
    </PreviewPanel>
  );
}

/* ---- Step 04 · The money sits with the deal ---- */
function MoneyPreview() {
  const invoices = [
    { ref: "Halcyon Motors", amount: "$6,500", state: "Paid", days: "Paid Mar 21" },
    { ref: "Meridian Skincare", amount: "$2,800", state: "Sent", days: "Day 48 outstanding" },
    { ref: "Northwind Audio", amount: "$4,100", state: "Overdue", days: "Day 92 outstanding" },
  ];
  const tone: Record<string, string> = {
    Paid: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
    Sent: "text-zinc-300 bg-white/[0.04] border-white/[0.1]",
    Overdue: "text-amber-300 bg-amber-500/10 border-amber-500/20",
  };
  return (
    <PreviewPanel>
      <div className="flex items-center justify-between mb-4">
        <MicroLabel>Money In</MicroLabel>
        <span className="text-[10px] text-zinc-400 font-sans">$6,900 outstanding</span>
      </div>

      <div className="space-y-2">
        {invoices.map((inv) => (
          <div
            key={inv.ref}
            className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-zinc-900/40 px-3 py-2.5"
          >
            <div className="min-w-0">
              <div className="text-xs font-medium text-zinc-100 font-sans truncate">
                {inv.ref}
              </div>
              <div className="text-[10px] text-zinc-500 font-sans truncate">{inv.days}</div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-xs text-zinc-200 font-sans">{inv.amount}</span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-full border font-sans ${tone[inv.state]}`}
              >
                {inv.state}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2.5">
        <div className="text-[10px] text-zinc-400 font-sans leading-relaxed">
          Card payment runs through Stripe into your own account, and the deal
          shows what has landed.
        </div>
      </div>
    </PreviewPanel>
  );
}

const covers = [
  "A project per brand deal, with its own dates, fee and notes",
  "A deliverable per post, video or story, carrying a status through approval",
  "A private portal link for the brand contact to follow and approve",
  "Quotes and invoices raised from the deal, paid by card through Stripe",
  "A calendar of live dates and shoot days across every deal at once",
  "Time tracking on the deals that eat your week",
  "An AI assistant that drafts the deliverable list from a brief you paste in",
];

const stays = [
  "Scheduling and publishing posts stays in your scheduling tool",
  "Views, reach and follower analytics stay in the platform apps",
  "Brand discovery and marketplace matching happen elsewhere",
  "Contract e-signature runs through your signing tool",
  "Usage rights terms live in the contract, tracked as project notes",
];

export default function CreatorsClient({ faqs }: { faqs: Faq[] }) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const toggleFaq = (i: number) => setActiveFaq(activeFaq === i ? null : i);

  const steps: Step[] = [
    {
      index: "01",
      heading: "A brand deal becomes a project the day you sign it.",
      body: "The fee, the live date, the brand contact and the asset list sit on one record, so the whole deal has a single home instead of a Notion page, a spreadsheet tab and a DM thread.",
      visual: <DealPreview />,
    },
    {
      index: "02",
      heading: "Every post, video and story carries its own status.",
      body: "Each asset moves through not started, in progress, in review, approved and completed. A five post campaign shows you which two are still waiting on the brand.",
      visual: <DeliverablesPreview />,
    },
    {
      index: "03",
      heading: "The brand contact checks progress from a portal link.",
      body: "Send one private link. They see current status, leave notes, and approve the assets they are happy with, which ends the round of status emails you were answering by hand.",
      visual: <BrandPortalPreview />,
    },
    {
      index: "04",
      heading: "The invoice and the payment stay attached to the deal.",
      body: "Raise a quote, turn it into an invoice, and take payment by card through Stripe into your own account. The deal page shows what is paid and how long the rest has been outstanding.",
      visual: <MoneyPreview />,
    },
  ];

  return (
    <main className="text-zinc-100 overflow-x-hidden pt-24 pb-20 relative z-10 isolate">
      <div className="absolute top-12 left-1/4 w-[300px] md:w-[600px] h-[300px] bg-gradient-to-tr from-white/[0.01] via-zinc-800/10 to-transparent rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[40%] right-1/4 w-[280px] md:w-[500px] h-[280px] bg-[#8ECAFF]/[0.015] rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Hero */}
      <section className="relative w-full min-h-[40vh] md:min-h-[45vh] flex flex-col justify-center py-16 md:py-24 px-4 sm:px-6 lg:px-8 mb-8 md:mb-12">
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
              className="text-3xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white leading-[1.12] mb-6 font-sans select-text"
            >
              Run your brand deals like the business they are.
            </motion.h1>
            <motion.p
              variants={revealVariants}
              custom={0.15}
              className="text-base sm:text-lg md:text-xl font-normal leading-7 text-zinc-400 max-w-2xl mx-auto mb-8 font-sans select-text"
            >
              Each deal gets a project, each post gets a status, and each brand
              gets a portal link and an invoice.
            </motion.p>
            <motion.div
              variants={revealVariants}
              custom={0.3}
              className="flex flex-col sm:flex-row gap-3 w-full justify-center items-center"
            >
              <Link
                href="/pricing"
                className="btn-glass rounded-full px-4 py-1.5 text-xs font-medium w-full sm:w-auto min-h-[44px] md:min-h-0"
              >
                <span>Start on the free plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/alternatives/metricool"
                className="btn-glass rounded-full px-4 py-1.5 text-xs font-medium w-full sm:w-auto min-h-[44px] md:min-h-0"
              >
                <span>Compare with Metricool</span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* The problem */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 mb-20 md:mb-28">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-white font-sans mb-4">
            Four live brand deals is a small business.
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 leading-7 font-sans max-w-2xl mx-auto">
            Each one carries its own asset list, its own approval thread, its own
            payment terms and its own brand contact asking where things stand.
            The software built for this market points at brands, so creators end
            up stitching a business together from a notes app, a spreadsheet, a
            DM inbox and a generic invoicing tool.
          </p>
        </div>
      </section>

      {/* Numbered workflow */}
      <div className="flex flex-col gap-20 md:gap-32 mb-20 md:mb-32">
        {steps.map((step, i) => {
          const visualFirst = i % 2 === 1;
          return (
            <section key={step.index} className="relative w-full px-4 sm:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto">
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-80px" }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 items-center"
                >
                  <motion.div
                    variants={revealVariants}
                    custom={0.0}
                    className={`space-y-4 ${visualFirst ? "md:order-2" : "md:order-1"}`}
                  >
                    <span className="text-[10px] font-semibold tracking-[0.2em] text-zinc-600 font-sans block">
                      {step.index}
                    </span>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight text-white leading-[1.15] font-sans select-text">
                      {step.heading}
                    </h2>
                    <p className="text-sm sm:text-base leading-7 text-zinc-400 max-w-md font-sans select-text">
                      {step.body}
                    </p>
                  </motion.div>

                  <motion.div
                    variants={revealVariants}
                    custom={0.15}
                    className={visualFirst ? "md:order-1" : "md:order-2"}
                  >
                    {step.visual}
                  </motion.div>
                </motion.div>
              </div>
            </section>
          );
        })}
      </div>

      {/* Scope honesty */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 mb-20 md:mb-28">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-white font-sans mb-3">
              What ABRAM handles, and what your other tools keep
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
              ABRAM covers the business side of creator work. Scheduling and
              audience analytics belong to the apps you already pay for.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/8 bg-zinc-900/30 backdrop-blur-md p-6">
              <h3 className="text-sm font-semibold tracking-tight text-zinc-100 font-sans mb-4">
                ABRAM handles
              </h3>
              <ul className="text-xs text-zinc-400 space-y-2.5 font-sans leading-relaxed">
                {covers.map((c) => (
                  <li key={c} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md p-6">
              <h3 className="text-sm font-semibold tracking-tight text-zinc-100 font-sans mb-4">
                Your other tools keep
              </h3>
              <ul className="text-xs text-zinc-500 space-y-2.5 font-sans leading-relaxed">
                {stays.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 mb-20 md:mb-28">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-white font-sans mb-3">
              Priced for one person running the whole operation
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
              Start free, then move up when the brand portals and the invoicing
              start earning their keep.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md p-6">
              <div className="flex items-baseline gap-2 mb-3">
                <h3 className="text-sm font-semibold tracking-tight text-zinc-100 font-sans">
                  Solo Lite
                </h3>
                <span className="text-lg font-medium text-white font-sans">$19</span>
                <span className="text-[10px] text-zinc-500 font-sans">per month</span>
              </div>
              <ul className="text-xs text-zinc-400 space-y-2 font-sans leading-relaxed">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                  <span>Projects, deliverables and the calendar</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                  <span>Ten invoices a month, paid by card</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                  <span>3 GB of storage for cuts and stills</span>
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border border-white/8 bg-zinc-900/30 backdrop-blur-md p-6">
              <div className="flex items-baseline gap-2 mb-3">
                <h3 className="text-sm font-semibold tracking-tight text-zinc-100 font-sans">
                  Solo Pro
                </h3>
                <span className="text-lg font-medium text-white font-sans">$34</span>
                <span className="text-[10px] text-zinc-500 font-sans">per month</span>
              </div>
              <ul className="text-xs text-zinc-400 space-y-2 font-sans leading-relaxed">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Portals for five brands at once</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Unlimited invoices and financial exports</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>PDF exports that carry your name alone</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>1% Processing Fee, first $10k a month free</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="text-center mt-8">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1 text-sm font-medium text-zinc-200 hover:text-white transition-colors font-sans min-h-[44px]"
            >
              <span>See every plan and limit</span>
              <ArrowUpRight className="w-4 h-4 text-zinc-400" />
            </Link>
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
              Put your next brand deal somewhere it can be tracked.
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto mb-8 font-sans leading-relaxed">
              Set up one deal, add the assets, send the brand a portal link, and
              invoice from the same page when the posts go live.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <a
                href="https://app.abram.network"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-glass rounded-full px-4 py-1.5 text-xs font-medium w-full sm:w-auto min-h-[44px] md:min-h-0"
              >
                <span>Open ABRAM</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              <Link
                href="/pricing"
                className="btn-glass rounded-full px-4 py-1.5 text-xs font-medium w-full sm:w-auto min-h-[44px] md:min-h-0"
              >
                <span>See pricing</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="max-w-5xl mx-auto px-4 mt-12 text-center">
        <p className="text-[10px] text-zinc-500/80 leading-relaxed font-light">
          Brand and campaign names shown in product figures are invented. Plan
          prices and limits on this page reflect the published ABRAM pricing page
          as of August 2026. The Processing Fee applies to payments you receive
          and is computed on your own plan.
        </p>
      </section>
    </main>
  );
}
