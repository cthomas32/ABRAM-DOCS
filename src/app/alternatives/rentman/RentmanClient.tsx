"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  X,
  ChevronDown,
  ShieldCheck,
  Boxes,
  ScanLine,
  Wallet,
} from "lucide-react";
import AbramMark from "@/components/AbramMark";
import ResourceInventoryMockup from "@/components/agency/ResourceInventoryMockup";
import { revealVariants, staggerContainer } from "@/lib/motion";

type Faq = { q: string; a: string };

const differentiators = [
  {
    icon: ShieldCheck,
    title: "The database refuses an overbooking",
    body: "ABRAM checks stock before a reservation is written, and the check lives in the database itself. A reservation that exceeds what you own is rejected at the point of write, so no form, import, or integration can slip one through.",
    points: [
      "Availability checked across every overlapping booking",
      "Enforced below the app, not in the interface",
    ],
  },
  {
    icon: Boxes,
    title: "Gear, crew and cost on one record",
    body: "A booking carries the item, the project, the work package, the work order and the day rate together. Reserving a camera writes a schedule fact, a call sheet entry and a cost line at the same moment.",
    points: [
      "Day rates roll into the project budget as you book",
      "Gear and crew read from one availability picture",
    ],
  },
  {
    icon: ScanLine,
    title: "Barcode batch allocation",
    body: "Scan a cart of gear with a phone camera or a USB scanner, set the dates once, and allocate the whole cart to a project. Conflicts surface per item while you are still scanning.",
    points: [
      "Live shortage flags on every scanned item",
      "Camera scanning and USB scanner input",
    ],
  },
  {
    icon: Wallet,
    title: "Crew, invoicing and payouts included",
    body: "Crewing, quoting, invoicing and contractor payouts are part of the platform rather than separately priced modules, so the gear list and the money it generates stay in one workspace.",
    points: [
      "Quotes and invoices from the same project",
      "Milestone crew payouts through Stripe",
    ],
  },
];

const comparison = [
  {
    feature: "Equipment database",
    abram: "Serial numbers, auto-assigned asset IDs, day and hourly rates, purchase value, condition, and org-defined custom fields",
    them: "Searchable database with shelf locations, prices, photos and maintenance history",
    abramYes: true,
    themYes: true,
  },
  {
    feature: "Grouping and kits",
    abram: "Folders, locations, and reusable kits with an AI kit builder that drafts a package from a brief",
    them: "Custom grouping for flight cases and paired gear such as mic, receiver and batteries",
    abramYes: true,
    themYes: true,
  },
  {
    feature: "Shortage and double-booking warnings",
    abram: "Shortage check before booking, plus a database constraint that rejects the overbooking outright",
    them: "Equipment timelines that surface double bookings and shortages",
    abramYes: true,
    themYes: true,
  },
  {
    feature: "Barcode and QR scanning",
    abram: "Camera and USB scanning with live conflict checks, on Team plans and above",
    them: "QR and serial number tracking, sold as a paid equipment tracking add-on",
    abramYes: true,
    themYes: true,
  },
  {
    feature: "RFID scanning",
    abram: "Not offered. ABRAM stores an RFID tag per item, with no reader integration",
    them: "Natively integrated RFID for scanning whole cases and racks",
    abramYes: false,
    themYes: true,
  },
  {
    feature: "Item photos and maintenance history",
    abram: "Not offered. ABRAM holds one current condition value per item",
    them: "Photos and maintenance history on the item record",
    abramYes: false,
    themYes: true,
  },
  {
    feature: "Digital packing lists",
    abram: "Built from what the project actually booked, with a six-step pack ladder and who-packed-what stamped on every line",
    them: "Real-time digital packing lists that update with project changes",
    abramYes: true,
    themYes: true,
  },
  {
    feature: "Per-unit serial tracking",
    abram: "Optional per item. Give individual bodies their own serial, scannable tag and condition, and scanning one names it",
    them: "Serial number tracking, sold as a paid equipment tracking add-on",
    abramYes: true,
    themYes: true,
  },
  {
    feature: "Warehouse mobile app",
    abram: "Not offered. Packing runs in the browser, and camera scanning needs Chrome or Edge",
    them: "Free mobile app showing photos, serials and handling instructions",
    abramYes: false,
    themYes: true,
  },
  {
    feature: "Subrental and alternative suggestions",
    abram: "Not offered. ABRAM reports the shortage and leaves the substitution to you",
    them: "Shortages module suggests alternatives or subrentals",
    abramYes: false,
    themYes: true,
  },
  {
    feature: "Crew scheduling in the same plan",
    abram: "Crewing, role matching and availability included, reading the same calendar as the gear",
    them: "Crew is a separately priced per-user module on top of the platform fee",
    abramYes: true,
    themYes: false,
  },
  {
    feature: "Quoting, invoicing and crew payouts",
    abram: "Quotes, invoices and milestone contractor payouts included",
    them: "Quoting and invoicing is a paid add-on. Crew payouts are handled elsewhere",
    abramYes: true,
    themYes: false,
  },
  {
    feature: "Client approval portal",
    abram: "Token-based portals where clients approve quotes and pay without an account",
    them: "Not offered",
    abramYes: true,
    themYes: false,
  },
  {
    feature: "AI production copilot",
    abram: "ABRAM Core turns a brief into work packages, drafts kits, and books gear with approval",
    them: "Not offered",
    abramYes: true,
    themYes: false,
  },
];

const migration = [
  {
    step: "1",
    title: "Import the inventory",
    body: "Bring your item list in by CSV. ABRAM assigns readable asset IDs by type, keeps your serial numbers, and takes day rates, purchase values and any custom fields your team already tracks.",
  },
  {
    step: "2",
    title: "Set up locations, folders and kits",
    body: "Group items by warehouse or stage, file them into folders, and build the kits you send out together so a whole package books in one action.",
  },
  {
    step: "3",
    title: "Book gear against real projects",
    body: "Allocate items to projects and work orders. The shortage check runs on every booking, day rates land on the budget, and the equipment timeline shows what is out and when it returns.",
  },
];

export default function RentmanClient({ faqs }: { faqs: Faq[] }) {
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
              Rentman Alternative
            </motion.span>
            <motion.h1 variants={revealVariants} custom={0.1} className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white leading-[1.12] mb-6 font-sans">
              Track Your Gear Inside the Project That Pays For It
            </motion.h1>
            <motion.p variants={revealVariants} custom={0.2} className="text-base sm:text-lg md:text-xl leading-7 text-zinc-400 max-w-2xl mx-auto mb-8 font-sans">
              Rentman is built around the warehouse. ABRAM books the same gear inside the production, so a camera reservation is a schedule fact, a budget line and a call sheet entry in one write.
            </motion.p>
            <motion.div variants={revealVariants} custom={0.3} className="flex flex-col sm:flex-row gap-3 w-full justify-center items-center">
              <Link href="/pricing" className="btn-glass rounded-full px-4 py-1.5 text-xs w-full sm:w-auto min-h-[44px] md:min-h-0">
                <span>Get started free</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link href="/alternatives" className="btn-glass rounded-full px-4 py-1.5 text-xs w-full sm:w-auto min-h-[44px] md:min-h-0">
                <span>See all comparisons</span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Inventory mockup */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 mb-16 md:mb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-2 inline-block font-sans">
              LIVE INVENTORY
            </span>
            <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-white font-sans">
              Every Item, Its Status, and the Job It Is On
            </h2>
          </div>
          <div className="rounded-2xl border border-white/10 bg-zinc-950/60 backdrop-blur-md p-4 sm:p-6 shadow-2xl">
            <ResourceInventoryMockup />
          </div>
        </div>
      </section>

      {/* Differentiators */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 mb-16 md:mb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-50 font-sans mb-3">What Changes When Gear Lives in the Production</h2>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">Four things ABRAM does because the inventory shares a database with the schedule, the crew and the budget.</p>
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
            <h2 className="text-xl font-semibold tracking-tight text-zinc-50 font-sans mb-3">ABRAM and Rentman side by side</h2>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">Three rows below go to Rentman. If RFID, item photos or a warehouse mobile app are what you came for, they have those today and we do not.</p>
          </div>
          <div className="md:hidden text-[10px] text-zinc-500 text-center mb-2 font-sans tracking-wide">Swipe to view →</div>
          <div className="overflow-x-auto rounded-xl border border-white/5 bg-zinc-950/40">
            <table className="w-full text-left border-collapse min-w-[600px] font-sans">
              <thead>
                <tr className="border-b border-white/5 bg-zinc-900/30">
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">Feature</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-zinc-200">ABRAM</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Rentman</th>
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

      {/* Who each one fits */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 mb-16 md:mb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-50 font-sans mb-3">Which one fits your operation</h2>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">The honest split, so you spend your evaluation time on the right product.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md p-6">
              <h3 className="text-sm font-semibold tracking-tight text-zinc-100 font-sans mb-3">Stay with Rentman if</h3>
              <ul className="text-xs text-zinc-400 space-y-2 font-sans leading-relaxed">
                <li>Renting equipment out is the business, and the warehouse floor is where the work happens.</li>
                <li>You need RFID to scan full cases and racks in seconds.</li>
                <li>Your crew packs from photo-led lists on a phone, in a native app.</li>
                <li>You want the system to propose subrentals the moment stock runs short.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-white/8 bg-zinc-900/30 backdrop-blur-md p-6">
              <h3 className="text-sm font-semibold tracking-tight text-zinc-100 font-sans mb-3">Move to ABRAM if</h3>
              <ul className="text-xs text-zinc-400 space-y-2 font-sans leading-relaxed">
                <li>You own gear to make work with, and the gear list only matters next to the schedule and the budget.</li>
                <li>The same people book the crew and the kit, and you are tired of reconciling two systems.</li>
                <li>You want day rates on the project budget the moment the item is reserved.</li>
                <li>Clients approve and pay against the work the gear was booked for.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Migration */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 mb-16 md:mb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-50 font-sans mb-3">Moving your inventory across</h2>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">Most teams import the item list first and book one live production against it before moving everything.</p>
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
            <h2 className="text-2xl font-bold tracking-tight text-white font-sans mb-4">Put the kit list back next to the job</h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto mb-8 font-sans leading-relaxed">Inventory, kits, crew, schedules, budgets, client approvals and payouts in one workspace, with ABRAM Core helping you move faster through all of it.</p>
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
          Disclaimer: Rentman is a trademark of its respective owner. ABRAM is an independent platform with no affiliation, sponsorship, endorsement, or partnership with Rentman. References are for comparative and informational purposes only. Rentman product details on this page reflect their published product and pricing pages as read in August 2026 and may have changed since. Barcode scanning is available on ABRAM Team plans and above.
        </p>
      </section>
    </main>
  );
}
