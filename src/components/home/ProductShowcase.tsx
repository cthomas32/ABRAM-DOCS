"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight, Clapperboard, CalendarRange, Scale, Tv, Video, Layers } from "lucide-react";
import { InteractiveProductionMockup } from "@/components/home/FilmProductionSection";
import { WorkloadPreview } from "@/components/agency/WorkloadBalancerMockup";

const DAYS = [
  { label: "Mon", date: "Jun 15" },
  { label: "Tue", date: "Jun 16" },
  { label: "Wed", date: "Jun 17" },
  { label: "Thu", date: "Jun 18" },
  { label: "Fri", date: "Jun 19" },
];

function ResourceCalendarMockup() {
  return (
    <div className="glass-panel rounded-2xl border border-white/[0.05] shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-white/[0.01] backdrop-blur-2xl overflow-hidden">
      <p className="text-[10px] text-zinc-500 text-center py-2 px-4 md:hidden font-sans tracking-wider uppercase">← Swipe to view full schedule →</p>
      <div className="overflow-x-auto md:overflow-visible">
        <div className="min-w-[800px] md:min-w-0 relative">
          {/* Header Row */}
          <div className="grid grid-cols-[250px_1fr_1fr_1fr_1fr_1fr] border-b border-white/[0.05] bg-white/[0.01]">
            <div className="p-4 flex items-center text-xs font-semibold text-zinc-500 tracking-wider uppercase font-sans border-r border-white/[0.05]">
              Resource Tracker
            </div>
            {DAYS.map((day, i) => (
              <div key={i} className="p-4 flex flex-col items-center justify-center border-r border-white/[0.05] last:border-0">
                <span className="text-sm font-medium text-zinc-300 font-sans">{day.label}</span>
                <span className="text-[10px] text-zinc-600 font-sans tracking-widest uppercase mt-1">{day.date}</span>
              </div>
            ))}
          </div>

          {/* Row 1: Stage A */}
          <div className="grid grid-cols-[250px_1fr_1fr_1fr_1fr_1fr] border-b border-white/[0.05] relative min-h-[80px]">
            <div className="p-4 flex items-center gap-4 border-r border-white/[0.05]">
              <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/[0.08] flex items-center justify-center shrink-0">
                <Tv className="w-5 h-5 text-[#8ECAFF]" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white font-sans">Stage A Studio</span>
                <span className="text-[10px] text-zinc-500 font-sans tracking-widest uppercase mt-1">Studio Soundstage</span>
              </div>
            </div>
            <div className="col-span-5 relative">
              <div className="absolute top-1/2 -translate-y-1/2 left-4 w-[calc(60%-16px)] h-14 bg-white/[0.03] border border-white/[0.1] rounded-xl flex items-center px-4 shadow-lg backdrop-blur-md">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white tracking-widest uppercase font-sans">Project Horizon</span>
                  <span className="text-[10px] text-zinc-400 font-sans mt-0.5">Mon - Wed • 9:00 AM</span>
                </div>
                <div className="ml-auto px-2 py-1 rounded-md bg-white/[0.05] border border-white/[0.1] text-[10px] text-zinc-400 font-medium font-sans">
                  CONFIRMED
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Stage B */}
          <div className="grid grid-cols-[250px_1fr_1fr_1fr_1fr_1fr] border-b border-white/[0.05] relative min-h-[80px]">
            <div className="p-4 flex items-center gap-4 border-r border-white/[0.05]">
              <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/[0.08] flex items-center justify-center shrink-0">
                <Tv className="w-5 h-5 text-zinc-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white font-sans">Stage B Annex</span>
                <span className="text-[10px] text-zinc-500 font-sans tracking-widest uppercase mt-1">Green Screen Cyclorama</span>
              </div>
            </div>
            <div className="col-span-5 relative">
              <div className="absolute top-1/2 -translate-y-1/2 left-[calc(40%+8px)] w-[calc(60%-24px)] h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center px-4 shadow-[0_0_20px_rgba(16,185,129,0.05)] backdrop-blur-md">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white tracking-widest uppercase font-sans">Studio Rental B</span>
                  <span className="text-[10px] text-zinc-400 font-sans mt-0.5">Wed - Fri • Reallocated</span>
                </div>
                <div className="ml-auto px-2 py-1 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-[10px] text-emerald-400 font-medium font-sans">
                  RESOLVED
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: ARRI Alexa 35 */}
          <div className="grid grid-cols-[250px_1fr_1fr_1fr_1fr_1fr] border-b border-white/[0.05] relative min-h-[80px]">
            <div className="p-4 flex items-center gap-4 border-r border-white/[0.05]">
              <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/[0.08] flex items-center justify-center shrink-0">
                <Video className="w-5 h-5 text-[#8ECAFF]" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white font-sans">ARRI Alexa 35</span>
                <span className="text-[10px] text-zinc-500 font-sans tracking-widest uppercase mt-1">8K Cinema Camera Package</span>
              </div>
            </div>
            <div className="col-span-5 relative">
              <div className="absolute top-1/2 -translate-y-1/2 left-4 w-[calc(60%-16px)] h-14 bg-white/[0.03] border border-white/[0.1] rounded-xl flex items-center px-4 shadow-lg backdrop-blur-md">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white tracking-widest uppercase font-sans">Project Horizon</span>
                  <span className="text-[10px] text-zinc-400 font-sans mt-0.5">Camera Rig A</span>
                </div>
                <div className="ml-auto px-2 py-1 rounded-md bg-white/[0.05] border border-white/[0.1] text-[10px] text-zinc-400 font-medium font-sans">
                  RENT
                </div>
              </div>
            </div>
          </div>

          {/* Row 4: Lighting Pack */}
          <div className="grid grid-cols-[250px_1fr_1fr_1fr_1fr_1fr] relative min-h-[80px]">
            <div className="p-4 flex items-center gap-4 border-r border-white/[0.05]">
              <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/[0.08] flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5 text-zinc-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white font-sans">Lighting Pack</span>
                <span className="text-[10px] text-zinc-500 font-sans tracking-widest uppercase mt-1">Aputure LED & Modifiers</span>
              </div>
            </div>
            <div className="col-span-5 relative">
              <div className="absolute top-1/2 -translate-y-1/2 left-[calc(20%+8px)] w-[calc(80%-24px)] h-14 bg-white/[0.03] border border-white/[0.1] rounded-xl flex items-center px-4 shadow-lg backdrop-blur-md">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white tracking-widest uppercase font-sans">Studio House Package</span>
                  <span className="text-[10px] text-zinc-400 font-sans mt-0.5">Continuous Studio Allocation</span>
                </div>
                <div className="ml-auto px-2 py-1 rounded-md bg-white/[0.05] border border-white/[0.1] text-[10px] text-zinc-400 font-medium font-sans">
                  SYSTEM CONFIRMED
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ShowcaseTab {
  key: string;
  label: string;
  icon: React.ElementType;
  caption: string;
  href: string;
  linkLabel: string;
  Mockup: React.ComponentType;
}

const TABS: ShowcaseTab[] = [
  {
    key: "shoot-day",
    label: "Shoot Day",
    icon: Clapperboard,
    caption:
      "The live stripboard tracks every scene and flags union rest violations before they cost you.",
    href: "/film-production/scheduling-budgeting",
    linkLabel: "Explore Scheduling",
    Mockup: InteractiveProductionMockup,
  },
  {
    key: "workload",
    label: "Workload",
    icon: Scale,
    caption:
      "The capacity grid shows who is overloaded and what work has no one on it.",
    href: "/agency/capacity-planning",
    linkLabel: "Explore Capacity Planning",
    Mockup: WorkloadPreview,
  },
  {
    key: "resources",
    label: "Resource Calendar",
    icon: CalendarRange,
    caption:
      "Stages, cameras, and crews on one synced timeline. Conflicts surface and resolve themselves.",
    href: "/agency/smart-scheduling",
    linkLabel: "Explore Smart Scheduling",
    Mockup: ResourceCalendarMockup,
  },
];

export default function ProductShowcase() {
  const [active, setActive] = useState(0);
  const tab = TABS[active];
  const Mockup = tab.Mockup;

  return (
    <section className="relative w-full py-24 md:py-32 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-2xl mx-auto mb-10 md:mb-14"
        >
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-3 inline-flex items-center gap-2 font-sans">
            <span className="text-zinc-600 font-sans">02</span>
            SCHEDULE
          </span>
          <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-white leading-tight">
            Change the schedule once and everything follows.
          </h2>
          <p className="mt-4 text-sm md:text-base text-zinc-400 leading-relaxed">
            A moved scene updates call sheets, bookings, and the budget instantly.
          </p>
        </motion.div>

        {/* Tab bar */}
        <div className="flex mb-10 overflow-x-auto sm:overflow-visible sm:justify-center [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-1">
          <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-zinc-950/40 backdrop-blur-md p-1 mx-auto sm:mx-0 shrink-0">
            {TABS.map((t, i) => {
              const Icon = t.icon;
              const isActive = i === active;
              return (
                <button
                  key={t.key}
                  onClick={() => setActive(i)}
                  className={`relative inline-flex items-center gap-1.5 rounded-full px-4 py-2 sm:py-1.5 text-xs font-medium transition-colors duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/40 min-h-[44px] sm:min-h-0 sm:h-8 ${
                    isActive ? "text-white" : "text-zinc-500 hover:text-zinc-200"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="showcase-tab-pill"
                      className="absolute inset-0 rounded-full bg-white/[0.08] border border-white/[0.15]"
                      transition={{ type: "spring", stiffness: 400, damping: 34 }}
                    />
                  )}
                  <Icon className="relative z-10 w-3.5 h-3.5" />
                  <span className="relative z-10 whitespace-nowrap">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <Mockup />
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-center">
              <p className="text-sm text-zinc-400 leading-relaxed max-w-md">{tab.caption}</p>
              <Link
                href={tab.href}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-300 hover:text-white transition-colors duration-200 whitespace-nowrap"
              >
                {tab.linkLabel}
                <ArrowUpRight className="w-4 h-4 opacity-60" />
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
