"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, AlertTriangle, Check, Sliders, HardDrive, UserCheck, Clock, ShieldAlert } from "lucide-react";

export default function SchedulingSection() {
  const [stageAConflictResolved, setStageAConflictResolved] = useState(false);
  const [jordanConfirmed, setJordanConfirmed] = useState(false);

  // States for Date & Time Picker
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set([16, 17, 18, 19, 20]));
  const [selectedHour, setSelectedHour] = useState("09");
  const [selectedMinute, setSelectedMinute] = useState("30");
  const [selectedPeriod, setSelectedPeriod] = useState("AM");

  const toggleDay = (day: number) => {
    const next = new Set(selectedDays);
    if (next.has(day)) {
      next.delete(day);
    } else {
      next.add(day);
    }
    setSelectedDays(next);
  };

  const getFormattedDays = (daysSet: Set<number>) => {
    if (daysSet.size === 0) return "No days selected";
    const days = Array.from(daysSet).sort((a, b) => a - b);
    
    // Check if it is a continuous range
    let isContinuous = true;
    for (let i = 1; i < days.length; i++) {
      if (days[i] !== days[i - 1] + 1) {
        isContinuous = false;
        break;
      }
    }
    
    if (isContinuous && days.length > 1) {
      return `June ${days[0]}–${days[days.length - 1]}`;
    }
    
    return `June ${days.join(", ")}`;
  };

  const handleToggleApollo = () => {
    setStageAConflictResolved(!stageAConflictResolved);
  };

  const handleToggleJordan = () => {
    setJordanConfirmed(!jordanConfirmed);
  };

  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  return (
    <section className="relative w-full py-24 md:py-32 border-t border-white/[0.08] bg-abram-black overflow-hidden selection:bg-zinc-800 selection:text-white">
      {/* Ambient Glows - Violet/Blue schedule grid */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#8ECAFF]/[0.035] rounded-full filter blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[500px] h-[500px] bg-purple-500/[0.025] rounded-full filter blur-[110px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative z-10 space-y-12">
        
        {/* Header Block */}
        <div className="text-center space-y-4 max-w-lg mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/3 text-[#f5f5f3] text-xs font-semibold tracking-wider uppercase">
            Resource Scheduling
          </div>
          {/* Section Header (h2: text-base to text-lg, font-medium, leading-snug) */}
          <h2 
            className="text-base md:text-lg font-medium text-white/90 tracking-wide leading-snug uppercase font-display"
          >
            Coordinate assets & crew in <span className="text-[#8ECAFF] font-semibold">real-time.</span>
          </h2>
          {/* Body Paragraph: text-sm font-normal text-white/80 */}
          <p className="text-sm font-normal text-white/80 max-w-lg mx-auto leading-relaxed">
            Manage your physical resources and crew rosters in a high-fidelity timeline. Click cards to resolve scheduling holds, clear booking overlaps, and coordinate timeline allocations.
          </p>
        </div>

        {/* Calendar Core Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl mx-auto w-full">
          
          {/* Left Column: Timeline Schedule Grid */}
          <div className="lg:col-span-8 space-y-4 w-full">
            {/* Collapsible Conflict Warning Banner */}
            <AnimatePresence initial={false}>
              {!stageAConflictResolved && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 25 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-red-500/5 border border-red-500/25 rounded-xl text-red-400 text-xs">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                      <span className="font-medium">
                        <strong>Conflict detected:</strong> Stage A booking overlap on Wednesday (Orion &amp; Apollo).
                      </span>
                    </div>
                    <button
                      onClick={() => setStageAConflictResolved(true)}
                      className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-[10px] text-red-300 transition-all cursor-pointer tracking-wide font-semibold"
                    >
                      Resolve Overlap
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {stageAConflictResolved && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 25 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-emerald-500/5 border border-emerald-500/25 rounded-xl text-emerald-400 text-xs">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-medium">
                        <strong>All Clear:</strong> Booking overlap resolved. Project Apollo shifted to Thu–Fri.
                      </span>
                    </div>
                    <button
                      onClick={() => setStageAConflictResolved(false)}
                      className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-[10px] text-emerald-300 transition-all cursor-pointer tracking-wide font-semibold"
                    >
                      Reset Conflict
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Timeline Table Container */}
            <div className="w-full overflow-x-auto pb-2" data-lenis-prevent="true">
              <div className="min-w-[680px] border border-white/[0.08] rounded-xl bg-zinc-950/40 backdrop-blur-xl overflow-hidden shadow-2xl">
                
                {/* Timeline Header (Days) */}
                <div className="flex border-b border-white/[0.08] bg-white/[0.02]">
                  {/* Column 1 Label */}
                  <div className="w-48 md:w-56 shrink-0 border-r border-white/[0.08] p-4 flex items-center gap-2 text-white/30 text-[11px] font-medium tracking-wide">
                    <Sliders className="w-3.5 h-3.5 text-white/30" />
                    <span>Resources &amp; Crew Tracks</span>
                  </div>
                  
                  {/* Days Grid Headers */}
                  <div className="flex-1 grid grid-cols-5">
                    {DAYS.map((day, idx) => (
                      <div key={idx} className="border-r border-white/[0.08] last:border-r-0 p-4 flex items-center justify-between text-zinc-400 text-xs font-semibold">
                        <span>{day}</span>
                        <span className="text-[9px] text-zinc-600 font-medium">Day {idx + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline Rows */}
                <div className="divide-y divide-white/[0.08]">
                  
                  {/* ROW 1: Stage A Booking (Asset) — Project Work conflict */}
                  <div 
                    className={`flex relative transition-all duration-500 ${
                      stageAConflictResolved ? "h-20" : "h-32"
                    }`}
                  >
                    {/* Left Label */}
                    <div className="w-48 md:w-56 shrink-0 border-r border-white/[0.08] p-4 flex flex-col justify-center bg-white/[0.01]">
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-3.5 h-3.5 text-zinc-400 " />
                        <span className="text-xs font-medium text-zinc-200 tracking-wide">Stage A Booking</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 mt-1 font-medium">Physical Studio Asset</span>
                    </div>

                    {/* Right Timeline Grid */}
                    <div className="flex-1 grid grid-cols-5 relative p-2">
                      {/* Background column lines */}
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <div key={idx} className="border-r border-white/[0.04] h-full last:border-r-0 pointer-events-none" />
                      ))}

                      {/* Booking 1: Project Orion (Project Work) */}
                      <motion.div
                        layout
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="absolute inset-y-2 left-2 pointer-events-none"
                        style={{
                          width: "calc(60% - 16px)", // Mon - Wed
                          top: "8px",
                          height: "40px"
                        }}
                      >
                        <div className="h-full rounded-lg bg-zinc-900 border border-white/[0.08] p-2 flex items-center justify-between select-none">
                          <div>
                            <div className="text-[10px] font-medium text-white tracking-wide">Project Orion</div>
                            <div className="text-[8px] text-zinc-500">Project Work • Mon - Wed</div>
                          </div>
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium tracking-wide border border-emerald-500/10">
                            Confirmed
                          </span>
                        </div>
                      </motion.div>

                      {/* Booking 2: Project Apollo (Conflict Hold shifting on Resolve) */}
                      <motion.div
                        layout
                        onClick={handleToggleApollo}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="absolute inset-y-2 cursor-pointer group"
                        style={{
                          left: stageAConflictResolved ? "calc(60% + 8px)" : "calc(40% + 8px)",
                          width: stageAConflictResolved ? "calc(40% - 16px)" : "calc(60% - 16px)",
                          top: stageAConflictResolved ? "8px" : "56px",
                          height: "40px"
                        }}
                      >
                        <div 
                          className={`h-full rounded-lg p-2 flex items-center justify-between transition-all duration-300 ${
                            stageAConflictResolved 
                              ? "bg-zinc-900 border border-[#8ECAFF]/20 shadow-[0_0_15px_rgba(142,202,255,0.06)] hover:border-[#8ECAFF]/40"
                              : "bg-red-500/5 border border-dashed border-red-500/35 hover:border-red-500/50"
                          }`}
                        >
                          <div>
                            <div className="text-[10px] font-medium tracking-wide text-zinc-200">Project Apollo</div>
                            <div className="text-[8px] text-zinc-500">
                              {stageAConflictResolved ? "Confirmed • Thu - Fri" : "Overlap Hold • Wed - Fri"}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[8px] px-1.5 py-0.5 rounded font-medium tracking-wide border transition-all ${
                              stageAConflictResolved 
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/10" 
                                : "bg-red-500/10 text-red-400 border-red-500/25 "
                            }`}>
                              {stageAConflictResolved ? "Confirmed" : "Conflict"}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  {/* ROW 2: Alex K. (DP) — Holds, Meetings, Vacation */}
                  <div className="flex h-20 relative">
                    {/* Left Label */}
                    <div className="w-48 md:w-56 shrink-0 border-r border-white/[0.08] p-4 flex flex-col justify-center bg-white/[0.01]">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="text-xs font-medium text-zinc-200 tracking-wide">Alex K. (DP)</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 mt-1 font-medium">Director of Photography</span>
                    </div>

                    {/* Right Timeline Grid */}
                    <div className="flex-1 grid grid-cols-5 relative p-2">
                      {/* Background column lines */}
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <div key={idx} className="border-r border-white/[0.04] h-full last:border-r-0 pointer-events-none" />
                      ))}

                      {/* Mon-Tue: Project Work */}
                      <div
                        className="absolute inset-y-2 left-2"
                        style={{
                          width: "calc(40% - 12px)",
                          height: "40px"
                        }}
                      >
                        <div className="h-full rounded-lg bg-zinc-900 border border-white/[0.08] p-2 flex items-center justify-between select-none">
                          <div>
                            <div className="text-[9px] font-medium text-zinc-200 tracking-wide">Project Orion</div>
                            <div className="text-[7px] text-zinc-500 font-mono">Shoot Days</div>
                          </div>
                        </div>
                      </div>

                      {/* Wed: Meeting Slot */}
                      <div
                        className="absolute inset-y-2"
                        style={{
                          left: "calc(40% + 4px)",
                          width: "calc(20% - 8px)",
                          height: "40px"
                        }}
                      >
                        <div className="h-full rounded-lg bg-purple-500/5 border border-purple-500/25 p-2 flex flex-col justify-center select-none">
                          <span className="text-[9px] font-medium text-purple-300 tracking-wide block">Kickoff</span>
                          <span className="text-[7px] text-purple-400/80 font-mono">10:00 AM Meeting</span>
                        </div>
                      </div>

                      {/* Thu-Fri: Vacation / OOO */}
                      <div
                        className="absolute inset-y-2"
                        style={{
                          left: "calc(60% + 4px)",
                          width: "calc(40% - 8px)",
                          height: "40px"
                        }}
                      >
                        <div className="h-full rounded-lg bg-white/[0.02] border border-dashed border-white/10 p-2 flex flex-col justify-center select-none">
                          <span className="text-[9px] font-medium text-zinc-500 tracking-wide block">Vacation</span>
                          <span className="text-[7px] text-zinc-600 font-mono">Out of Office</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ROW 3: Jordan M. (Gaffer) — Holds & Meetings */}
                  <div className="flex h-20 relative">
                    {/* Left Label */}
                    <div className="w-48 md:w-56 shrink-0 border-r border-white/[0.08] p-4 flex flex-col justify-center bg-white/[0.01]">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="text-xs font-medium text-zinc-200 tracking-wide">Jordan M. (Gaffer)</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 mt-1 font-medium">Chief Lighting Tech</span>
                    </div>

                    {/* Right Timeline Grid */}
                    <div className="flex-1 grid grid-cols-5 relative p-2">
                      {/* Background column lines */}
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <div key={idx} className="border-r border-white/[0.04] h-full last:border-r-0 pointer-events-none" />
                      ))}

                      {/* Wed: Kickoff Meeting */}
                      <div
                        className="absolute inset-y-2"
                        style={{
                          left: "calc(40% + 4px)",
                          width: "calc(20% - 8px)",
                          height: "40px"
                        }}
                      >
                        <div className="h-full rounded-lg bg-purple-500/5 border border-purple-500/25 p-2 flex flex-col justify-center select-none">
                          <span className="text-[9px] font-medium text-purple-300 tracking-wide block">Kickoff</span>
                          <span className="text-[7px] text-purple-400/80 font-mono">10:00 AM Meeting</span>
                        </div>
                      </div>

                      {/* Wed-Thu Hold or Confirmed (Toggleable) */}
                      <motion.div
                        layout
                        onClick={handleToggleJordan}
                        className="absolute inset-y-2 cursor-pointer"
                        style={{
                          left: "calc(60% + 4px)",
                          width: "calc(40% - 8px)",
                          height: "40px"
                        }}
                      >
                        <div 
                          className={`h-full rounded-lg p-2 flex items-center justify-between transition-all duration-300 ${
                            jordanConfirmed 
                              ? "bg-zinc-900 border border-[#8ECAFF]/20 shadow-[0_0_15px_rgba(142,202,255,0.06)] hover:border-[#8ECAFF]/40"
                              : "bg-amber-500/5 border border-dashed border-amber-500/25 hover:border-amber-500/40"
                          }`}
                        >
                          <div>
                            <div className="text-[9px] font-medium tracking-wide text-zinc-200">Apollo Gaffer Hold</div>
                            <div className="text-[7px] text-zinc-500">Thu - Fri</div>
                          </div>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-medium tracking-wide border transition-all ${
                            jordanConfirmed 
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/10" 
                              : "bg-amber-500/10 text-amber-400 border-amber-500/25"
                          }`}>
                            {jordanConfirmed ? "Confirmed" : "Hold"}
                          </span>
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  {/* ROW 4: ARRI Alexa LF Kit (Asset) — Hold & Project Work */}
                  <div className="flex h-20 relative">
                    {/* Left Label */}
                    <div className="w-48 md:w-56 shrink-0 border-r border-white/[0.08] p-4 flex flex-col justify-center bg-white/[0.01]">
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="text-xs font-medium text-zinc-200 tracking-wide">ARRI Alexa LF Kit</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 mt-1 font-medium">Physical Camera Package</span>
                    </div>

                    {/* Right Timeline Grid */}
                    <div className="flex-1 grid grid-cols-5 relative p-2">
                      {/* Background column lines */}
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <div key={idx} className="border-r border-white/[0.04] h-full last:border-r-0 pointer-events-none" />
                      ))}

                      {/* Wed-Thu: Hold */}
                      <div
                        className="absolute inset-y-2"
                        style={{
                          left: "calc(40% + 4px)",
                          width: "calc(20% - 8px)",
                          height: "40px"
                        }}
                      >
                        <div className="h-full rounded-lg bg-amber-500/5 border border-dashed border-amber-500/20 p-2 flex flex-col justify-center select-none">
                          <span className="text-[9px] font-medium text-amber-300 tracking-wide block">Holds Block</span>
                          <span className="text-[7px] text-zinc-500 font-mono">Camera Hold</span>
                        </div>
                      </div>

                      {/* Thu-Fri: Project Apollo */}
                      <div
                        className="absolute inset-y-2"
                        style={{
                          left: "calc(60% + 4px)",
                          width: "calc(40% - 8px)",
                          height: "40px"
                        }}
                      >
                        <div className="h-full rounded-lg bg-zinc-900 border border-white/[0.08] p-2 flex items-center justify-between select-none">
                          <div>
                            <div className="text-[9px] font-medium text-white tracking-wide">Project Apollo</div>
                            <div className="text-[7px] text-zinc-500">Camera Rig</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>

            {/* Interactive hints */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-[10px] text-white/30 tracking-wider">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Amber indicates an unconfirmed holds reservation.</span>
              </div>
              <div className="flex items-center gap-4">
                <span>💡 Click elements to resolve conflicts &amp; confirm bookings</span>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-zinc-900 border border-white/[0.08]" /> Work</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500/10 border border-dashed border-amber-500/20" /> Hold</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-purple-500/10 border border-purple-500/20" /> Meeting</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Date & Time Picker Preview */}
          <div className="lg:col-span-4 w-full space-y-4">
            <div className="w-full glass-panel rounded-xl border border-white/[0.08] p-5 bg-zinc-950/60 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-5">
              
              {/* Picker Title Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#8ECAFF]" />
                  <span className="text-[11px] font-medium text-zinc-200 tracking-wide">Active Scheduler</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono font-medium">June 2026</span>
              </div>

              {/* Date Picker (Calendar Grid) */}
              <div className="space-y-3">
                <div className="grid grid-cols-7 text-center text-[9px] text-zinc-500 font-medium uppercase tracking-widest">
                  <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                </div>
                
                <div className="grid grid-cols-7 gap-1 text-xs">
                  {/* June 2026 starts on Monday (1 empty cell for Sunday) */}
                  <div className="h-8" />
                  
                  {Array.from({ length: 30 }).map((_, idx) => {
                    const day = idx + 1;
                    const isSelected = selectedDays.has(day);
                    return (
                      <button
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`h-8 w-8 mx-auto rounded-lg flex items-center justify-center transition-all cursor-pointer font-semibold ${
                          isSelected
                            ? "bg-[#8ECAFF]/20 text-white border border-[#8ECAFF]/40 shadow-[0_0_15px_rgba(142,202,255,0.35)]"
                            : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Picker */}
              <div className="space-y-3.5 pt-4 border-t border-white/[0.08]">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#8ECAFF]" />
                  <span className="text-[10px] text-zinc-400 font-semibold tracking-wide">Time Select</span>
                </div>
                
                <div className="flex items-center justify-between gap-2 bg-zinc-950/40 p-2 border border-white/[0.04] rounded-lg">
                  {/* Hours column */}
                  <div className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-[8px] text-zinc-600 font-medium tracking-wide">Hour</span>
                    <div className="flex flex-wrap gap-1 justify-center max-h-[70px] overflow-y-auto scrollbar-none py-1">
                      {["08", "09", "10", "11", "12", "01", "02", "03", "04", "05"].map((hr) => {
                        const isActive = selectedHour === hr;
                        return (
                          <button
                            key={hr}
                            onClick={() => setSelectedHour(hr)}
                            className={`text-[10px] px-2 py-0.5 rounded transition-all cursor-pointer font-medium ${
                              isActive
                                ? "bg-[#8ECAFF] text-zinc-950 shadow-[0_0_8px_rgba(142,202,255,0.4)]"
                                : "text-zinc-400 hover:text-white bg-white/5 border border-white/[0.04]"
                            }`}
                          >
                            {hr}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="text-zinc-700 font-medium text-xs select-none">:</div>

                  {/* Minutes column */}
                  <div className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-[8px] text-zinc-600 font-medium tracking-wide">Min</span>
                    <div className="flex flex-wrap gap-1 justify-center max-h-[70px] overflow-y-auto scrollbar-none py-1">
                      {["00", "15", "30", "45"].map((min) => {
                        const isActive = selectedMinute === min;
                        return (
                          <button
                            key={min}
                            onClick={() => setSelectedMinute(min)}
                            className={`text-[10px] px-2 py-0.5 rounded transition-all cursor-pointer font-medium ${
                              isActive
                                ? "bg-[#8ECAFF] text-zinc-950 shadow-[0_0_8px_rgba(142,202,255,0.4)]"
                                : "text-zinc-400 hover:text-white bg-white/5 border border-white/[0.04]"
                            }`}
                          >
                            {min}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="w-[1px] h-8 bg-white/10 select-none" />

                  {/* Period column */}
                  <div className="flex flex-col items-center gap-1.5 shrink-0 px-1">
                    <span className="text-[8px] text-zinc-600 font-medium tracking-wide">Period</span>
                    <div className="flex flex-col gap-1 py-1">
                      {["AM", "PM"].map((p) => {
                        const isActive = selectedPeriod === p;
                        return (
                          <button
                            key={p}
                            onClick={() => setSelectedPeriod(p)}
                            className={`text-[10px] px-2.5 py-0.5 rounded transition-all cursor-pointer font-medium ${
                              isActive
                                ? "bg-[#8ECAFF] text-zinc-950 shadow-[0_0_8px_rgba(142,202,255,0.4)]"
                                : "text-zinc-400 hover:text-white bg-white/5 border border-white/[0.04]"
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Preview Box */}
              <div className="mt-1 p-3 bg-blue-500/[0.03] border border-blue-500/15 rounded-lg flex items-center justify-between text-zinc-300 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-zinc-500 font-medium tracking-wide block">Target Schedule</span>
                  <span className="font-semibold text-white font-mono">
                    {getFormattedDays(selectedDays)}
                  </span>
                </div>
                <div className="text-right space-y-0.5">
                  <span className="text-[9px] text-zinc-500 font-medium tracking-wide block">Time Slot</span>
                  <span className="font-medium text-[#8ECAFF] font-mono">
                    {selectedHour}:{selectedMinute} {selectedPeriod}
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
