"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, LayoutGrid, AlertTriangle, GitCompare, PencilLine, ArrowUpRight } from "lucide-react";
import WorkloadBalancerMockup from "@/components/agency/WorkloadBalancerMockup";
import { revealVariants, staggerContainer } from "@/lib/motion";

export default function CapacityPlanningClient() {
  const cards = [
    {
      icon: LayoutGrid,
      title: "Unassigned demand surfaced",
      body: "Every deliverable that nobody is staffed on lists at the top of the grid, tagged when it is only partially covered.",
    },
    {
      icon: AlertTriangle,
      title: "Over-allocation flagged in amber",
      body: "Any day where someone is booked past their capacity turns amber so you spot the overload before it lands.",
    },
    {
      icon: GitCompare,
      title: "Planned versus actual hours",
      body: "Each cell shows the planned hours with the actual logged figure underneath so plans stay honest.",
    },
    {
      icon: PencilLine,
      title: "Edit hours in place",
      body: "Click any day to adjust planned hours and the grid rebalances the row and the summary tiles instantly.",
    },
  ];

  return (
    <>
      <main className="text-zinc-100 overflow-x-hidden pt-24 pb-20 select-none relative z-10 isolate">
        {/* Absolute Ambient Page Glows */}
        <div className="absolute top-12 left-1/4 w-[300px] md:w-[600px] h-[300px] bg-gradient-to-tr from-white/[0.01] via-zinc-800/10 to-transparent rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute top-[40%] right-1/4 w-[280px] md:w-[500px] h-[280px] bg-[#8b5cf6]/[0.02] rounded-full blur-[100px] pointer-events-none -z-10" />

        {/* Navigation & Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 md:mb-12">
          <Link
            href="/agency"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-6 font-sans font-semibold uppercase min-h-[44px]"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to agency hub
          </Link>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-4 max-w-3xl"
          >
            <motion.span
              variants={revealVariants}
              custom={0.0}
              className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 font-sans block"
            >
              Workload Balancer
            </motion.span>
            <motion.h1
              variants={revealVariants}
              custom={0.1}
              className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white leading-tight font-sans select-text"
            >
              See who is overloaded and fix it before it costs you a week.
            </motion.h1>
            <motion.p
              variants={revealVariants}
              custom={0.2}
              className="text-sm sm:text-base text-zinc-400 font-normal leading-relaxed max-w-2xl select-text font-sans"
            >
              One capacity grid shows planned hours, over-allocation, and unstaffed work across your whole team, day by day.
            </motion.p>
          </motion.div>
        </div>

        {/* Live Interactive Mockup */}
        <section className="relative w-full px-4 sm:px-6 lg:px-8 bg-transparent overflow-visible mb-16 md:mb-24">
          <div className="max-w-7xl mx-auto">
            <WorkloadBalancerMockup />
          </div>
        </section>

        {/* Feature cards */}
        <section className="relative w-full py-16 px-4 sm:px-6 lg:px-8 bg-transparent border-t border-white/[0.08]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {cards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.title}
                    className="space-y-3 p-5 rounded-xl border border-white/5 bg-zinc-950/20 hover:border-white/10 hover:bg-zinc-900/10 transition-all"
                  >
                    <div className="p-2 rounded-lg border border-white/5 bg-white/[0.02] text-white w-fit">
                      <Icon className="w-4 h-4 text-zinc-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-100 font-sans">{card.title}</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans">{card.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative w-full px-4 sm:px-6 lg:px-8 bg-transparent">
          <div className="max-w-7xl mx-auto">
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-950/40 backdrop-blur-md p-8 md:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-1.5">
                <h2 className="text-lg sm:text-xl font-medium text-white font-sans">
                  Balance the workload across your studio.
                </h2>
                <p className="text-sm text-zinc-400 font-sans">
                  Open ABRAM and see your team&apos;s capacity in one grid.
                </p>
              </div>
              <a
                href="https://app.abram.network"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-glass inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium shrink-0 w-fit"
              >
                <span>Open ABRAM</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400" />
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
