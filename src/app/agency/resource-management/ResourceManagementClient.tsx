"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  AlertTriangle,
  Package,
  ScanLine,
  BarChart3,
} from "lucide-react";
import ResourceInventoryMockup from "@/components/agency/ResourceInventoryMockup";
import { revealVariants, staggerContainer } from "@/lib/motion";

export default function ResourceManagementClient() {
  return (
    <>
      <main className="text-zinc-100 overflow-x-hidden pt-24 pb-20 select-none relative z-10 isolate">
        {/* Absolute Ambient Page Glows */}
        <div className="absolute top-12 left-1/4 w-[300px] md:w-[600px] h-[300px] bg-gradient-to-tr from-white/[0.01] via-zinc-800/10 to-transparent rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute top-[40%] right-1/4 w-[280px] md:w-[500px] h-[280px] bg-[#8ECAFF]/[0.01] rounded-full blur-[100px] pointer-events-none -z-10" />

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
              Equipment & Resource Management
            </motion.span>
            <motion.h1
              variants={revealVariants}
              custom={0.1}
              className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white leading-tight font-sans select-text"
            >
              Know where every camera is and book it without double-booking.
            </motion.h1>
            <motion.p
              variants={revealVariants}
              custom={0.2}
              className="text-sm sm:text-base text-zinc-400 font-normal leading-relaxed max-w-2xl select-text font-sans"
            >
              Track gear, studios, and locations in one hub where the booking calendar flags conflicts against the quantity you actually own.
            </motion.p>
          </motion.div>
        </div>

        {/* Live Interactive Playground */}
        <section className="relative w-full px-4 sm:px-6 lg:px-8 bg-transparent overflow-visible mb-16 md:mb-24">
          <div className="max-w-7xl mx-auto">
            <ResourceInventoryMockup />
          </div>
        </section>

        {/* Features deep dive */}
        <section className="relative w-full py-16 px-4 sm:px-6 lg:px-8 bg-transparent border-t border-white/[0.08]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

              {/* Feature 1 */}
              <div className="space-y-3 p-5 rounded-xl border border-white/5 bg-zinc-950/20 hover:border-white/10 hover:bg-zinc-900/10 transition-all">
                <div className="p-2 rounded-lg border border-white/5 bg-white/[0.02] w-fit">
                  <AlertTriangle className="w-4 h-4 text-zinc-400" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 font-sans">Quantity-Aware Conflicts</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  The calendar flags a clash the moment bookings exceed the number of units you own.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="space-y-3 p-5 rounded-xl border border-white/5 bg-zinc-950/20 hover:border-white/10 hover:bg-zinc-900/10 transition-all">
                <div className="p-2 rounded-lg border border-white/5 bg-white/[0.02] w-fit">
                  <Package className="w-4 h-4 text-zinc-400" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 font-sans">Equipment Kits</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Bundle a full camera package into one reusable kit and book every piece in a single move.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="space-y-3 p-5 rounded-xl border border-white/5 bg-zinc-950/20 hover:border-white/10 hover:bg-zinc-900/10 transition-all">
                <div className="p-2 rounded-lg border border-white/5 bg-white/[0.02] w-fit">
                  <ScanLine className="w-4 h-4 text-zinc-400" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 font-sans">Barcode Check-Out</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Scan barcodes to check a batch of gear out to a shoot and back in when it returns.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="space-y-3 p-5 rounded-xl border border-white/5 bg-zinc-950/20 hover:border-white/10 hover:bg-zinc-900/10 transition-all">
                <div className="p-2 rounded-lg border border-white/5 bg-white/[0.02] w-fit">
                  <BarChart3 className="w-4 h-4 text-zinc-400" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 font-sans">Utilization Analytics</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  See booked hours by week, top used resources, average utilization, and estimated cost.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Compact CTA */}
        <section className="relative w-full px-4 sm:px-6 lg:px-8 bg-transparent">
          <div className="max-w-7xl mx-auto">
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-950/40 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 backdrop-blur-xl">
              <div className="space-y-2 max-w-xl">
                <h2 className="text-xl md:text-2xl font-medium tracking-tight text-white font-sans">
                  Put your whole inventory on one calendar.
                </h2>
                <p className="text-sm text-zinc-400 font-sans leading-relaxed">
                  Bring gear, studios, and locations into a single bookable hub.
                </p>
              </div>
              <Link
                href="/agency"
                className="btn-glass rounded-full px-4 py-1.5 text-xs font-semibold inline-flex items-center justify-center min-h-[44px] shrink-0"
              >
                Explore the agency hub
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
