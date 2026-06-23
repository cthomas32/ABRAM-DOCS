"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  ShieldAlert, 
  Check, 
  Sparkles, 
  Clock, 
  Sliders, 
  ArrowRight,
  RefreshCw,
  Info
} from "lucide-react";

interface ScheduleBlock {
  id: string;
  label: string;
  project: string;
  days: number[]; // indices of days (0: Mon, 1: Tue, 2: Wed, etc.)
  color: string;
  conflict?: boolean;
}

interface ResourceRow {
  name: string;
  type: "Personnel" | "Facility";
  blocks: ScheduleBlock[];
}

export default function AgencySchedulingMockup() {
  const [isResolved, setIsResolved] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const [resources, setResources] = useState<ResourceRow[]>([
    {
      name: "Creative Studio A",
      type: "Facility",
      blocks: [
        { id: "b1", label: "Helix Film Shoot", project: "Helix Launch", days: [0, 1, 2], color: "bg-blue-500/10 text-blue-400 border-blue-500/20" }
      ]
    },
    {
      name: "3D Rendering Suite",
      type: "Facility",
      blocks: [
        { id: "b2", label: "Rendering & Post", project: "Onyx Rebrand", days: [1, 2], color: "bg-purple-500/10 text-purple-400 border-purple-500/20" }
      ]
    },
    {
      name: "Sarah Connor (Dir)",
      type: "Personnel",
      blocks: [
        { id: "b3", label: "Director Rehearsals", project: "Helix Launch", days: [0, 1], color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
        { id: "b4", label: "Shoot Turnaround Block", project: "Onyx Rebrand", days: [2], color: "bg-purple-500/10 text-purple-400 border-purple-500/20", conflict: true }
      ]
    },
    {
      name: "Vesper Lin (3D Lead)",
      type: "Personnel",
      blocks: [
        { id: "b5", label: "Helix 3D modeling", project: "Helix Launch", days: [1, 2], color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
        { id: "b6", label: "Onyx Mockup Asset Render", project: "Onyx Rebrand", days: [2], color: "bg-purple-500/10 text-purple-400 border-purple-500/20", conflict: true }
      ]
    }
  ]);

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  const handleResolve = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      // 1. Shift Vesper Lin's Onyx render to Thursday (day 3) to clear double-booking
      // 2. Extend Sarah Connor's Wed turnaround to Thursday (day 3) to resolve turnaround safety margin conflict
      setResources([
        {
          name: "Creative Studio A",
          type: "Facility",
          blocks: [
            { id: "b1", label: "Helix Film Shoot", project: "Helix Launch", days: [0, 1, 2], color: "bg-blue-500/10 text-blue-400 border-blue-500/20" }
          ]
        },
        {
          name: "3D Rendering Suite",
          type: "Facility",
          blocks: [
            { id: "b2", label: "Rendering & Post", project: "Onyx Rebrand", days: [1, 2], color: "bg-purple-500/10 text-purple-400 border-purple-500/20" }
          ]
        },
        {
          name: "Sarah Connor (Dir)",
          type: "Personnel",
          blocks: [
            { id: "b3", label: "Director Rehearsals", project: "Helix Launch", days: [0, 1], color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
            { id: "b4", label: "Shifted: Shoot Turnaround", project: "Onyx Rebrand", days: [3], color: "bg-purple-500/10 text-purple-400 border-purple-500/20" }
          ]
        },
        {
          name: "Vesper Lin (3D Lead)",
          type: "Personnel",
          blocks: [
            { id: "b5", label: "Helix 3D modeling", project: "Helix Launch", days: [1, 2], color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
            { id: "b6", label: "Shifted: Onyx Asset Render", project: "Onyx Rebrand", days: [3], color: "bg-purple-500/10 text-purple-400 border-purple-500/20" }
          ]
        }
      ]);
      setIsResolved(true);
      setIsOptimizing(false);
    }, 1500);
  };

  const handleReset = () => {
    setResources([
      {
        name: "Creative Studio A",
        type: "Facility",
        blocks: [
          { id: "b1", label: "Helix Film Shoot", project: "Helix Launch", days: [0, 1, 2], color: "bg-blue-500/10 text-blue-400 border-blue-500/20" }
        ]
      },
      {
        name: "3D Rendering Suite",
        type: "Facility",
        blocks: [
          { id: "b2", label: "Rendering & Post", project: "Onyx Rebrand", days: [1, 2], color: "bg-purple-500/10 text-purple-400 border-purple-500/20" }
        ]
      },
      {
        name: "Sarah Connor (Dir)",
        type: "Personnel",
        blocks: [
          { id: "b3", label: "Director Rehearsals", project: "Helix Launch", days: [0, 1], color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
          { id: "b4", label: "Shoot Turnaround Block", project: "Onyx Rebrand", days: [2], color: "bg-purple-500/10 text-purple-400 border-purple-500/20", conflict: true }
        ]
      },
      {
        name: "Vesper Lin (3D Lead)",
        type: "Personnel",
        blocks: [
          { id: "b5", label: "Helix 3D modeling", project: "Helix Launch", days: [1, 2], color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
          { id: "b6", label: "Onyx Mockup Asset Render", project: "Onyx Rebrand", days: [2], color: "bg-purple-500/10 text-purple-400 border-purple-500/20", conflict: true }
        ]
      }
    ]);
    setIsResolved(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl border border-white/5 bg-zinc-950/40 p-4 sm:p-6 lg:p-8 backdrop-blur-xl relative overflow-visible">
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[300px] bg-zinc-800/[0.015] rounded-full filter blur-[80px] pointer-events-none -z-10" />

      {/* Banner message */}
      <AnimatePresence mode="wait">
        {!isResolved ? (
          <motion.div
            key="conflict"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-red-500/5 border border-red-500/25 rounded-xl text-red-400 text-xs">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block sm:inline">Scheduling Conflicts Detected:</span>
                  <p className="text-[11px] text-red-400/80 mt-1 sm:mt-0.5">
                    1. Double Booking: <strong className="font-semibold text-red-200">Vesper Lin</strong> is scheduled on Wednesday for both Helix 3D Modeling and Onyx Asset Render. <br />
                    2. Rest Turnaround Warning: <strong className="font-semibold text-red-200">Sarah Connor</strong> finishes Helix prep at 2:00 AM Wed, scheduled for 8:00 AM Onyx shoot (only 6h rest; SAG margin requires 10h).
                  </p>
                </div>
              </div>
              <button
                onClick={handleResolve}
                disabled={isOptimizing}
                className="btn-primary min-h-[44px] px-3.5 shrink-0 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-black cursor-pointer bg-red-400 border-none hover:bg-red-300 rounded-full"
              >
                {isOptimizing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Resolving...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-black" />
                    <span>AI Resolve Overlaps</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="resolved"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="mb-6 overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-emerald-500/5 border border-emerald-500/25 rounded-xl text-emerald-400 text-xs">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-semibold">All Conflicts Resolved & Optimized:</span>
                  <span className="text-[11px] text-emerald-400/80 ml-2">
                    Vesper Lin render task shifted to Thursday. Sarah Connor turnaround expanded to 14 hours.
                  </span>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="btn-ghost min-h-[44px] px-3.5 text-[10px] shrink-0 text-zinc-400 hover:text-white flex items-center justify-center"
              >
                Reset Layout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline Scroll Hint */}
      <div className="flex justify-between items-center px-1 mb-2 text-[10px] text-zinc-500 font-mono md:hidden gap-2">
        <span>Timeline Board</span>
        <span className="text-[9px] text-zinc-400 animate-pulse shrink-0">Swipe to view full schedule →</span>
      </div>

      {/* Timeline Layout */}
      <div className="overflow-x-auto scrollbar-thin">
        <div className="min-w-[650px] md:min-w-0 space-y-4">
          {/* Timeline Header Row (Days of Week) */}
          <div className="grid grid-cols-12 border-b border-white/5 pb-2 text-[10px] uppercase tracking-wider font-semibold text-zinc-500 font-mono">
            <div className="col-span-3 sm:col-span-4 pl-2">Resource Name</div>
            <div className="col-span-9 sm:col-span-8 grid grid-cols-5 text-center">
              {daysOfWeek.map((day) => (
                <div key={day} className="py-1 border-l border-white/5">
                  {day}
                </div>
              ))}
            </div>
          </div>

          {/* Resources Rows */}
          <div className="divide-y divide-white/5 border border-white/5 rounded-xl bg-zinc-950/20 overflow-hidden">
            {resources.map((res, rowIdx) => (
              <div key={rowIdx} className="grid grid-cols-12 items-center min-h-[56px] hover:bg-white/[0.005] transition-all">
                {/* Resource Meta */}
                <div className="col-span-3 sm:col-span-4 p-3 border-r border-white/5 flex flex-col justify-center">
                  <span className="text-xs font-semibold text-white block">{res.name}</span>
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono mt-0.5">{res.type}</span>
                </div>

                {/* Weekly Timeline Blocks */}
                <div className="col-span-9 sm:col-span-8 grid grid-cols-5 relative h-full items-center select-none">
                  {/* Visual Grid Lines */}
                  <div className="absolute inset-0 grid grid-cols-5 pointer-events-none">
                    {daysOfWeek.map((_, i) => (
                      <div key={i} className="h-full border-r border-white/5 last:border-r-0" />
                    ))}
                  </div>

                  {/* Blocks Container */}
                  <div className="absolute inset-0 px-1 py-2 flex flex-col justify-center relative">
                    {res.blocks.map((block) => {
                      const startIdx = block.days[0];
                      const colSpan = block.days.length;
                      const widthPercent = (colSpan / 5) * 100;
                      const leftOffset = (startIdx / 5) * 100;
                      
                      return (
                        <motion.div
                          key={block.id}
                          layout
                          transition={{ type: "spring", stiffness: 200, damping: 25 }}
                          style={{
                            left: `${leftOffset}%`,
                            width: `calc(${widthPercent}% - 8px)`,
                            position: "absolute"
                          }}
                          className={`h-9 border rounded-lg px-2 flex flex-col justify-center overflow-hidden transition-all ${
                            !isResolved && block.conflict
                              ? "bg-red-500/10 border-red-500/30 text-red-400 font-semibold"
                              : block.color
                          }`}
                        >
                          <span className="text-[10px] truncate block font-sans font-semibold">
                            {block.label}
                          </span>
                          <div className="flex items-center justify-between text-[8px] font-mono opacity-80 mt-0.5">
                            <span className="truncate uppercase">{block.project}</span>
                            {!isResolved && block.conflict && (
                              <span className="text-red-400 animate-pulse font-bold text-[9px]">CONFLICT</span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info footer */}
      <div className="mt-4 flex items-center gap-1.5 px-1 text-[10px] text-zinc-500 font-sans">
        <Info className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
        <span>Schedules sync with project briefs & real-time timesheets. Turnaround metrics calculated dynamically based on location distance and check-in telemetry.</span>
      </div>

    </div>
  );
}
