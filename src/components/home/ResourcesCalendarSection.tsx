"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { Tv, Video, Layers } from "lucide-react";
import { revealVariants } from "@/lib/motion";

export default function ResourcesCalendarSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isSectionInView = useInView(sectionRef, { once: false, amount: 0.15 });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const rotateX = useTransform(scrollYProgress, [0, 0.45], [10, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.45], [0.94, 1]);
  const y = useTransform(scrollYProgress, [0, 0.45], [80, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.35], [0, 1]);

  const DAYS = [
    { label: "Mon", date: "Jun 15" },
    { label: "Tue", date: "Jun 16" },
    { label: "Wed", date: "Jun 17" },
    { label: "Thu", date: "Jun 18" },
    { label: "Fri", date: "Jun 19" }
  ];

  return (
    <section ref={sectionRef} className="relative w-full py-24 md:py-32 bg-transparent overflow-hidden flex flex-col items-center justify-center border-t border-white/[0.05]">
      
      {/* Background Ambient Blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] md:w-[800px] md:h-[500px] bg-blue-950/25 rounded-full blur-[120px] pointer-events-none" />

      {/* Header Copy */}
      <div className="text-center z-10 max-w-3xl mx-auto px-6 mb-20">
        <motion.h2 
          variants={revealVariants}
          initial="hidden"
          animate={isSectionInView ? "visible" : "hidden"}
          className="text-3xl md:text-5xl font-medium tracking-tight text-white mb-6 font-sans"
        >
          Visual Schedule Synchronization
        </motion.h2>

        <motion.p 
          variants={revealVariants}
          initial="hidden"
          animate={isSectionInView ? "visible" : "hidden"}
          className="text-base md:text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed font-sans"
        >
          ABRAM automatically maps project work orders to your team's Google and Outlook calendars, providing a unified view of crew and equipment utilization without any manual data entry.
        </motion.p>
      </div>

      {/* Minimal Glass Calendar Container */}
      <motion.div
        style={{ rotateX, scale, y, opacity }}
        className="w-full max-w-5xl px-4 z-10 perspective-[2000px]"
      >
        <div className="glass-panel rounded-2xl border border-white/[0.05] shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-white/[0.01] backdrop-blur-2xl overflow-hidden">
          {/* Mobile scroll hint */}
          <p className="text-[10px] text-zinc-500 text-center py-2 px-4 md:hidden font-mono tracking-wider uppercase">← Swipe to view full schedule →</p>
          <div className="overflow-x-auto md:overflow-visible">
            <div className="min-w-[800px] md:min-w-0">
          
          {/* Header Row */}
          <div className="grid grid-cols-[250px_1fr_1fr_1fr_1fr_1fr] border-b border-white/[0.05] bg-white/[0.01]">
            <div className="p-4 flex items-center text-xs font-semibold text-zinc-500 tracking-wider uppercase font-sans border-r border-white/[0.05]">
              Resource Tracker
            </div>
            {DAYS.map((day, i) => (
              <div key={i} className="p-4 flex flex-col items-center justify-center border-r border-white/[0.05] last:border-0">
                <span className="text-sm font-medium text-zinc-300 font-sans">{day.label}</span>
                <span className="text-[10px] text-zinc-600 font-mono tracking-widest uppercase mt-1">{day.date}</span>
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
                <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase mt-1">Studio Soundstage</span>
              </div>
            </div>
            <div className="col-span-5 relative">
              {/* Timeline Block */}
              <div className="absolute top-1/2 -translate-y-1/2 left-4 w-[calc(60%-16px)] h-14 bg-white/[0.03] border border-white/[0.1] rounded-xl flex items-center px-4 shadow-lg backdrop-blur-md">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white tracking-widest uppercase font-sans">Project Horizon</span>
                  <span className="text-[10px] text-zinc-400 font-mono mt-0.5">Mon - Wed • 9:00 AM</span>
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
                <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase mt-1">Green Screen Cyclorama</span>
              </div>
            </div>
            <div className="col-span-5 relative">
              {/* Timeline Block */}
              <div className="absolute top-1/2 -translate-y-1/2 left-[calc(40%+8px)] w-[calc(60%-24px)] h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center px-4 shadow-[0_0_20px_rgba(16,185,129,0.05)] backdrop-blur-md">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white tracking-widest uppercase font-sans">Studio Rental B</span>
                  <span className="text-[10px] text-zinc-400 font-mono mt-0.5">Wed - Fri • Reallocated</span>
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
                <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase mt-1">8K Cinema Camera Package</span>
              </div>
            </div>
            <div className="col-span-5 relative">
              <div className="absolute top-1/2 -translate-y-1/2 left-4 w-[calc(60%-16px)] h-14 bg-white/[0.03] border border-white/[0.1] rounded-xl flex items-center px-4 shadow-lg backdrop-blur-md">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white tracking-widest uppercase font-sans">Project Horizon</span>
                  <span className="text-[10px] text-zinc-400 font-mono mt-0.5">Camera Rig A</span>
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
                <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase mt-1">Aputure LED & Modifiers</span>
              </div>
            </div>
            <div className="col-span-5 relative">
              <div className="absolute top-1/2 -translate-y-1/2 left-[calc(20%+8px)] w-[calc(80%-24px)] h-14 bg-white/[0.03] border border-white/[0.1] rounded-xl flex items-center px-4 shadow-lg backdrop-blur-md">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white tracking-widest uppercase font-sans">Studio House Package</span>
                  <span className="text-[10px] text-zinc-400 font-mono mt-0.5">Continuous Studio Allocation</span>
                </div>
                <div className="ml-auto px-2 py-1 rounded-md bg-white/[0.05] border border-white/[0.1] text-[10px] text-zinc-400 font-medium font-sans">
                  SYSTEM CONFIRMED
                </div>
              </div>
            </div>
          </div>

          {/* Subtle column dividers */}
          <div className="absolute inset-0 pointer-events-none grid grid-cols-[250px_1fr_1fr_1fr_1fr_1fr]">
            <div className="border-r border-white/[0.02]" />
            <div className="border-r border-white/[0.02]" />
            <div className="border-r border-white/[0.02]" />
            <div className="border-r border-white/[0.02]" />
            <div className="border-r border-white/[0.02]" />
            <div />
          </div>

            </div>{/* min-w wrapper */}
          </div>{/* overflow-x-auto */}
        </div>
      </motion.div>

    </section>
  );
}
