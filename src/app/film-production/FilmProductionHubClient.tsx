"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  MapPin,
  Users,
  DollarSign,
  Clock,
  CloudSun,
  ShieldCheck,
  CheckCircle2,
  Banknote,
} from "lucide-react";
import ScriptBreakdownMockup from "@/components/film-production/ScriptBreakdownMockup";
import AbramMark from "@/components/AbramMark";
import { revealVariants, staggerContainer } from "@/lib/motion";

function StepOverline({ number, label }: { number: string; label: string }) {
  return (
    <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 font-sans">
      <span className="text-zinc-600 mr-2">{number}</span>
      {label}
    </span>
  );
}

function StepLink({ href, label, external }: { href: string; label: string; external?: boolean }) {
  return (
    <Link
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="group inline-flex items-center gap-1 text-sm font-medium text-zinc-300 hover:text-white transition-colors min-h-[44px] md:min-h-0"
    >
      <span>{label}</span>
      <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
    </Link>
  );
}

export default function FilmProductionHubClient() {
  return (
    <main className="text-zinc-100 overflow-x-hidden pt-24 pb-20 select-none relative z-10 isolate">
      {/* Absolute Ambient Page Glows */}
      <div className="absolute top-12 left-1/4 w-[300px] md:w-[600px] h-[300px] bg-gradient-to-tr from-white/[0.01] via-zinc-800/10 to-transparent rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[40%] right-1/4 w-[280px] md:w-[500px] h-[280px] bg-[#8ECAFF]/[0.02] rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="relative w-full min-h-[40vh] md:min-h-[50vh] flex flex-col justify-center py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-transparent overflow-visible mb-16 md:mb-24">
        <div className="max-w-7xl mx-auto w-full">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto w-full"
          >
            <motion.span
              variants={revealVariants}
              custom={0.0}
              className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-4 font-sans block"
            >
              Film Production Suite
            </motion.span>

            <motion.h1
              variants={revealVariants}
              custom={0.1}
              className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white leading-[1.12] mb-6 font-sans select-text"
            >
              Keep every shoot day on schedule and under budget.
            </motion.h1>

            <motion.p
              variants={revealVariants}
              custom={0.2}
              className="text-base sm:text-lg md:text-xl font-normal leading-7 text-zinc-400 max-w-2xl mx-auto mb-8 font-sans select-text"
            >
              Your script, crew, and financials move together from the first breakdown to the final payout.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Numbered Workflow Story */}
      <div className="relative w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-24 md:space-y-40">

          {/* STEP 01: Break Down the Script */}
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
          >
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-2">
                <AbramMark size={14} />
                <StepOverline number="01" label="Break down the script" />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight text-white leading-tight font-sans select-text">
                Turn any screenplay into a tagged shooting list in minutes.
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-sans select-text">
                The parser reads your script and sorts every cast member, location, prop, and wardrobe note into ready-to-schedule categories.
              </p>
              <div className="pt-1">
                <StepLink href="/film-production/script-breakdown" label="Explore Script Breakdown" />
              </div>
            </div>
            <div className="lg:col-span-7">
              <ScriptBreakdownMockup />
            </div>
          </motion.section>

          {/* STEP 02: Build the Stripboard, See the Budget */}
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
          >
            <div className="lg:col-span-5 space-y-4 lg:order-2">
              <StepOverline number="02" label="Build the stripboard, see the budget" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight text-white leading-tight font-sans select-text">
                Watch your budget update the moment you rearrange a shoot day.
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-sans select-text">
                Drag scenes into shooting order and the platform recalculates crew days, rates, and rest-period compliance in real time.
              </p>
              <div className="pt-1">
                <StepLink href="/film-production/scheduling-budgeting" label="Explore Scheduling and Budgeting" />
              </div>
            </div>
            <div className="lg:col-span-7 lg:order-1">
              <div className="rounded-2xl border border-white/8 bg-zinc-950/60 backdrop-blur-md p-5 sm:p-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/8 pb-3 mb-4">
                  <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-zinc-500 font-sans">
                    Stripboard
                  </span>
                  <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-zinc-500 font-sans">
                    Day 1 of 12
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Stripboard rows */}
                  <div className="space-y-2 font-sans text-[11px]">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950/60 border border-white/8 text-zinc-300">
                      <span className="h-4 w-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span className="truncate">Sc. 12 INT. Living Room</span>
                      <span className="ml-auto text-zinc-500 shrink-0">1 4/8</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950/60 border border-white/8 text-zinc-300">
                      <span className="h-4 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span className="truncate">Sc. 13 EXT. Courtyard</span>
                      <span className="ml-auto text-zinc-500 shrink-0">2 1/8</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950/60 border border-white/8 text-zinc-300">
                      <span className="h-4 w-1.5 rounded-full bg-sky-400 shrink-0" />
                      <span className="truncate">Sc. 14 INT. Warehouse</span>
                      <span className="ml-auto text-zinc-500 shrink-0">3 2/8</span>
                    </div>
                  </div>

                  {/* Budget readout */}
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-zinc-950/60 border border-white/8">
                      <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-zinc-500 font-sans block mb-1">
                        Estimated Day Cost
                      </span>
                      <span className="text-2xl font-medium text-white font-sans flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-zinc-400" />
                        42,850
                      </span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15 text-emerald-400 text-[11px] font-sans">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>Rest windows within compliance</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* STEP 03: Send Call Sheets */}
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
          >
            <div className="lg:col-span-5 space-y-4">
              <StepOverline number="03" label="Send call sheets" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight text-white leading-tight font-sans select-text">
                Give every crew member their call time the night before the shoot.
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-sans select-text">
                Publish call times, weather, locations, and transport in one branded sheet that reaches the whole unit at once.
              </p>
              <div className="pt-1">
                <StepLink href="/film-production/call-sheets" label="Explore Call Sheets" />
              </div>
            </div>
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-white/8 bg-zinc-950/60 backdrop-blur-md p-5 sm:p-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/8 pb-3 mb-4">
                  <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-zinc-500 font-sans">
                    Call Sheet
                  </span>
                  <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-zinc-500 font-sans">
                    Day 04
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-sans text-[11px]">
                  <div className="p-3 rounded-lg bg-zinc-950/60 border border-white/8 space-y-1.5">
                    <span className="text-[9px] font-semibold tracking-[0.15em] uppercase text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Crew Call
                    </span>
                    <span className="text-zinc-100 font-semibold text-sm">07:00</span>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-950/60 border border-white/8 space-y-1.5">
                    <span className="text-[9px] font-semibold tracking-[0.15em] uppercase text-zinc-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Location
                    </span>
                    <span className="text-zinc-100 font-semibold text-sm">Stage 6</span>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-950/60 border border-white/8 space-y-1.5">
                    <span className="text-[9px] font-semibold tracking-[0.15em] uppercase text-zinc-500 flex items-center gap-1">
                      <CloudSun className="w-3 h-3" /> Weather
                    </span>
                    <span className="text-zinc-100 font-semibold text-sm">18 sun</span>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-950/60 border border-white/8 space-y-1.5">
                    <span className="text-[9px] font-semibold tracking-[0.15em] uppercase text-zinc-500 flex items-center gap-1">
                      <Users className="w-3 h-3" /> Cast
                    </span>
                    <span className="text-zinc-100 font-semibold text-sm">12 in</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15 text-emerald-400 text-[11px] font-sans">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Delivered to 38 crew members</span>
                </div>
              </div>
            </div>
          </motion.section>

          {/* STEP 04: Wrap and Pay */}
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
          >
            <div className="lg:col-span-5 space-y-4 lg:order-2">
              <StepOverline number="04" label="Wrap and pay" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight text-white leading-tight font-sans select-text">
                Approve timesheets and pay your whole crew the same day you wrap.
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-sans select-text">
                Approved work orders roll straight into secure payouts, so freelancers see their money without chasing an invoice.
              </p>
              <div className="pt-2">
                <Link
                  href="https://app.abram.network"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-glass rounded-full px-4 py-1.5 text-xs inline-flex items-center gap-1.5 min-h-[44px] md:min-h-0"
                >
                  <span>Start a production</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400" />
                </Link>
              </div>
            </div>
            <div className="lg:col-span-7 lg:order-1">
              <div className="rounded-2xl border border-white/8 bg-zinc-950/60 backdrop-blur-md p-5 sm:p-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/8 pb-3 mb-4">
                  <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-zinc-500 font-sans">
                    Wrap Payouts
                  </span>
                  <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-emerald-400 font-sans">
                    Approved
                  </span>
                </div>

                <div className="space-y-2 font-sans text-[11px] mb-4">
                  <div className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-950/60 border border-white/8">
                    <span className="w-7 h-7 rounded-full bg-zinc-900 border border-white/8 flex items-center justify-center text-[10px] font-semibold text-zinc-300 shrink-0">
                      GA
                    </span>
                    <div className="min-w-0">
                      <span className="text-zinc-200 font-medium block truncate">Gaffer</span>
                      <span className="text-zinc-500">12.0 hrs timesheet</span>
                    </div>
                    <span className="ml-auto text-zinc-100 font-semibold shrink-0">$1,860</span>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-950/60 border border-white/8">
                    <span className="w-7 h-7 rounded-full bg-zinc-900 border border-white/8 flex items-center justify-center text-[10px] font-semibold text-zinc-300 shrink-0">
                      1A
                    </span>
                    <div className="min-w-0">
                      <span className="text-zinc-200 font-medium block truncate">1st AC</span>
                      <span className="text-zinc-500">11.5 hrs timesheet</span>
                    </div>
                    <span className="ml-auto text-zinc-100 font-semibold shrink-0">$1,420</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15 text-emerald-400 text-[11px] font-sans">
                  <Banknote className="w-3.5 h-3.5 shrink-0" />
                  <span>38 payouts sent to crew accounts</span>
                </div>
              </div>
            </div>
          </motion.section>

        </div>
      </div>
    </main>
  );
}
