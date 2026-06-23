"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Play, RefreshCw, Terminal, TrendingUp, CheckCircle, Activity, User, Shield } from "lucide-react";

// Crew members data
interface CrewMember {
  name: string;
  role: string;
  initials: string;
  threshold: number;
  rate: string;
}

const CREW_MEMBERS: CrewMember[] = [
  { name: "Marcus V.", role: "Gaffer", initials: "MV", threshold: 0.6, rate: "$650/day" },
  { name: "Sarah L.", role: "Designer", initials: "SL", threshold: 0.7, rate: "$800/day" },
  { name: "Emily W.", role: "Director", initials: "EW", threshold: 0.8, rate: "$1,200/day" },
];

// SVG Gauge data helper
interface GaugeData {
  label: string;
  baseYield: number; // base percent at 0.5 efficiency
  maxYield: number;  // max percent at 0.9 efficiency
}

const GAUGES: GaugeData[] = [
  { label: "ARRI Alexa", baseYield: 0.55, maxYield: 0.95 },
  { label: "Stage B Annex", baseYield: 0.40, maxYield: 0.85 },
  { label: "Lighting Kit", baseYield: 0.45, maxYield: 0.78 },
];

// Terminal Log entry helper
interface LogEntry {
  time: string;
  type: "system" | "warn" | "agent" | "savings" | "success";
  text: string;
  threshold: number;
}

const LOGS: LogEntry[] = [
  { time: "08:42:10", type: "system", text: "Roster baseline initialized at 50% efficiency.", threshold: 0.5 },
  { time: "08:42:11", type: "warn", text: "Marcus V. (Gaffer) idle on bench. Daily loss: $650.", threshold: 0.5 },
  { time: "08:42:12", type: "warn", text: "Sarah L. (Designer) idle on bench. Daily loss: $800.", threshold: 0.5 },
  { time: "08:42:13", type: "warn", text: "Emily W. (Director) idle on bench. Daily loss: $1,200.", threshold: 0.5 },
  
  { time: "08:42:15", type: "agent", text: "Scanning active projects for Gaffer requirements...", threshold: 0.6 },
  { time: "08:42:16", type: "agent", text: "Match found! Marcus V. assigned to Project Nova.", threshold: 0.6 },
  { time: "08:42:17", type: "system", text: "Marcus V. status updated: ACTIVE (Billable).", threshold: 0.6 },
  { time: "08:42:18", type: "savings", text: "Marcus V. bench rate recovered: +$650/day.", threshold: 0.6 },
  
  { time: "08:42:21", type: "agent", text: "Checking Stage B design schedule...", threshold: 0.7 },
  { time: "08:42:22", type: "agent", text: "Sarah L. allocated to Stage B Annex design team.", threshold: 0.7 },
  { time: "08:42:23", type: "system", text: "Sarah L. status updated: ACTIVE (Billable).", threshold: 0.7 },
  { time: "08:42:24", type: "savings", text: "Sarah L. bench rate recovered: +$800/day.", threshold: 0.7 },
  
  { time: "08:42:27", type: "agent", text: "Matching Director availability...", threshold: 0.8 },
  { time: "08:42:28", type: "agent", text: "Emily W. assigned to commercial campaign 'Aether'.", threshold: 0.8 },
  { time: "08:42:29", type: "system", text: "Emily W. status updated: ACTIVE (Billable).", threshold: 0.8 },
  { time: "08:42:30", type: "savings", text: "Emily W. bench rate recovered: +$1,200/day.", threshold: 0.8 },
  
  { time: "08:42:33", type: "system", text: "Roster optimization complete. Bench idle rate: 0%.", threshold: 0.85 },
  { time: "08:42:34", type: "success", text: "Peak ROI reached. Capital yield maximized.", threshold: 0.85 }
];

interface AnimatedCounterProps {
  value: number;
}

function AnimatedCounter({ value }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  
  useEffect(() => {
    let start = displayValue;
    const end = value;
    if (start === end) return;
    
    const duration = 400; // ms
    const startTime = performance.now();
    
    let animationFrameId: number;
    
    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease out quad
      const ease = 1 - (1 - progress) * (1 - progress);
      const current = Math.round(start + (end - start) * ease);
      
      setDisplayValue(current);
      
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(update);
      }
    };
    
    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value, displayValue]);
  
  return (
    <span className="font-mono text-4xl md:text-5xl font-bold tracking-tight text-emerald-400">
      +${displayValue.toLocaleString()}
    </span>
  );
}

interface HorizontalGaugeProps {
  label: string;
  sublabel: string;
  value: number;
  colorClass?: string;
  isActive: boolean;
}

function HorizontalGaugeRow({ label, sublabel, value, colorClass = "text-[#8ECAFF]", isActive }: HorizontalGaugeProps) {
  const radius = 18;
  const strokeWidth = 3;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - value * circumference;

  return (
    <div className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 ${
      isActive 
        ? "bg-zinc-950/60 border-white/10 shadow-sm" 
        : "bg-zinc-950/10 border-white/5 opacity-50"
    }`}>
      <div className="flex items-center gap-3">
        {/* Compact Circular progress circle */}
        <div className="relative w-10 h-10 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
            <circle
              cx="24"
              cy="24"
              r={radius}
              stroke="currentColor"
              className="text-zinc-800"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            <motion.circle
              cx="24"
              cy="24"
              r={radius}
              stroke="currentColor"
              className={colorClass}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset }}
              transition={{ type: "spring", stiffness: 60, damping: 15 }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-[9px] font-semibold text-white">
              {Math.round(value * 100)}%
            </span>
          </div>
        </div>

        <div>
          <p className={`text-sm font-medium transition-colors duration-300 ${
            isActive ? "text-white" : "text-zinc-400"
          }`}>
            {label}
          </p>
          <p className="text-xs text-zinc-500">{sublabel}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-zinc-400">{Math.round(value * 100)}% Yield</span>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all duration-300 ${
          isActive 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
            : "bg-zinc-900/40 border-white/5 text-zinc-500"
        }`}>
          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
          {isActive ? "Optimized" : "Idle"}
        </div>
      </div>
    </div>
  );
}

export default function RosterROISection() {
  const [efficiency, setEfficiency] = useState(0.5); // float 0.5 to 0.9
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Normalize pct from 0.0 to 1.0 (mapping 0.5 to 0.9)
  const pct = (efficiency - 0.5) / 0.4;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    trackRef.current.setPointerCapture(e.pointerId);
    updateValue(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!trackRef.current || !trackRef.current.hasPointerCapture(e.pointerId)) return;
    updateValue(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (trackRef.current) {
      trackRef.current.releasePointerCapture(e.pointerId);
    }
  };

  const updateValue = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pos = (clientX - rect.left) / rect.width;
    const clampedPos = Math.max(0, Math.min(1, pos));
    const newVal = 0.5 + clampedPos * 0.4;
    setEfficiency(newVal);
  };

  // Recovered Capital Calculations
  const baseCapital = 4200;
  const maxCapital = 22800;
  const currentCapital = Math.round(baseCapital + pct * (maxCapital - baseCapital));

  // Gauges Calculations
  const alexaYield = Math.min(0.95, 0.55 + pct * 0.40);
  const stageBYield = Math.min(0.85, 0.40 + pct * 0.45);
  const lightingYield = Math.min(0.78, 0.45 + pct * 0.33);

  // Filter logs that are triggered by current efficiency
  const activeLogs = LOGS.filter((log) => log.threshold <= efficiency);

  // Keep terminal scrolled to bottom
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [activeLogs]);

  // Sparkline Spark Data points
  const points = Array.from({ length: 20 }, (_, i) => {
    const t = i / 19;
    const x = 10 + t * 220;
    const y = 70 - (t * t * 50); // parabolic growth curve
    return { x, y };
  });
  const pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1].x} 80 L ${points[0].x} 80 Z`;

  return (
    <section className="relative w-full border-t border-white/[0.08] bg-transparent py-24 md:py-32 overflow-hidden flex flex-col items-center justify-center">
      {/* Floating Ambient Glow Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] md:w-[600px] md:h-[600px] bg-blue-950/15 blur-[120px] rounded-full pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 flex flex-col items-center">
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-3 inline-block">
            Capital Optimization
          </span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight font-sans">
            Maximize Roster ROI
          </h2>
          <p className="mt-4 text-sm md:text-base text-zinc-400 leading-relaxed font-sans">
            Move from idle bench time to optimized billable output. Slide to adjust allocation efficiency parameters in real-time.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
          
          {/* Slider Control Panel Card */}
          <div className="lg:col-span-12 rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md p-6 md:p-8 hover:border-white/10 hover:bg-zinc-900/30 transition-all duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-shrink-0">
                <span className="text-[10px] font-semibold tracking-wider text-[#8ECAFF] uppercase font-sans">
                  Efficiency Control
                </span>
                <h3 className="text-xl font-semibold text-white mt-1 font-sans">
                  Roster Efficiency Target
                </h3>
                <p className="text-xs text-zinc-500 mt-1 font-sans">
                  Configure real-time crew and asset dispatch thresholds
                </p>
              </div>

              {/* Custom Slider Track and Handle */}
              <div className="flex-1 max-w-xl w-full flex items-center gap-6">
                <div 
                  ref={trackRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className="relative h-10 w-full flex items-center cursor-pointer select-none"
                >
                  {/* Slider Track background */}
                  <div className="w-full h-1.5 bg-zinc-900 border border-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 via-blue-500 to-[#8ECAFF]"
                      style={{ width: `${pct * 100}%` }}
                    />
                  </div>

                  {/* Slider Drag Handle Touch Target */}
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center cursor-grab active:cursor-grabbing z-20"
                    style={{ left: `${pct * 100}%`, width: "44px", height: "44px" }}
                  >
                    <div className="w-5 h-5 rounded-full bg-white shadow-lg border border-zinc-300 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform duration-150">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    </div>
                  </div>
                </div>

                {/* Slider Readout */}
                <div className="flex-shrink-0 w-16 text-right">
                  <span className="font-mono text-2xl font-semibold text-white">
                    {Math.round(efficiency * 100)}%
                  </span>
                </div>
              </div>
            </div>
            
            {/* Visually Hidden Input for Accessibility */}
            <input 
              type="range" 
              min="50" 
              max="90" 
              value={Math.round(efficiency * 100)} 
              onChange={(e) => setEfficiency(Number(e.target.value) / 100)} 
              className="sr-only"
            />
          </div>

          {/* Card 1: Roster Bench */}
          <div className="lg:col-span-6 rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md p-6 hover:border-white/10 hover:bg-zinc-900/30 transition-all duration-300 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase font-sans">
                Crew Allocation
              </span>
              <h3 className="text-lg font-semibold text-zinc-100 mt-1 font-sans">
                Active Crew Roster
              </h3>
              <p className="text-xs text-zinc-500 mt-1 mb-6 font-sans">
                Crew members auto-assign as capacity limits clear
              </p>
            </div>

            <div className="space-y-4">
              {CREW_MEMBERS.map((member) => {
                const isActive = efficiency >= member.threshold;
                return (
                  <div 
                    key={member.name}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 ${
                      isActive 
                        ? "bg-zinc-950/60 border-white/10 shadow-sm" 
                        : "bg-zinc-950/10 border-white/5 opacity-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border transition-colors duration-300 ${
                        isActive 
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                          : "bg-zinc-900 border-white/5 text-zinc-400"
                      }`}>
                        {member.initials}
                      </div>
                      <div>
                        <p className={`text-sm font-medium transition-colors duration-300 ${
                          isActive ? "text-white" : "text-zinc-400"
                        }`}>
                          {member.name}
                        </p>
                        <p className="text-xs text-zinc-500">{member.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-zinc-400">{member.rate}</span>
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all duration-300 ${
                        isActive 
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                          : "bg-zinc-900/40 border-white/5 text-zinc-500"
                      }`}>
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                        {isActive ? "Active" : "Bench"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 2: Equipment Yield */}
          <div className="lg:col-span-6 rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md p-6 hover:border-white/10 hover:bg-zinc-900/30 transition-all duration-300 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase font-sans">
                Asset Optimization
              </span>
              <h3 className="text-lg font-semibold text-zinc-100 mt-1 font-sans">
                Equipment Yield Rates
              </h3>
              <p className="text-xs text-zinc-500 mt-1 mb-6 font-sans">
                Live utilization efficiency rates of physical hardware & stages
              </p>
            </div>

            <div className="space-y-4">
              <HorizontalGaugeRow 
                label="ARRI Alexa 35" 
                sublabel="8K Cinema Camera Package"
                value={alexaYield} 
                colorClass={alexaYield >= 0.8 ? "text-emerald-400" : "text-[#8ECAFF]"} 
                isActive={efficiency >= 0.6}
              />
              <HorizontalGaugeRow 
                label="Stage B Annex" 
                sublabel="Green Screen Cyclorama"
                value={stageBYield} 
                colorClass={stageBYield >= 0.8 ? "text-emerald-400" : "text-[#8ECAFF]"} 
                isActive={efficiency >= 0.7}
              />
              <HorizontalGaugeRow 
                label="Lighting Kit" 
                sublabel="Aputure LED Array"
                value={lightingYield} 
                colorClass={lightingYield >= 0.8 ? "text-emerald-400" : "text-[#8ECAFF]"} 
                isActive={efficiency >= 0.75}
              />
            </div>
          </div>

          {/* Card 3: Recovered Capital */}
          <div className="lg:col-span-5 rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md p-6 hover:border-white/10 hover:bg-zinc-900/30 transition-all duration-300 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase font-sans">
                Yield Metrics
              </span>
              <h3 className="text-lg font-semibold text-zinc-100 mt-1 font-sans">
                Recovered Capital
              </h3>
              <p className="text-xs text-zinc-500 mt-1 mb-4 font-sans">
                Estimated savings capture on recovered bench/idle assets
              </p>
            </div>

            <div className="my-2">
              <AnimatedCounter value={currentCapital} />
              <span className="text-xs text-zinc-500 ml-1.5 font-mono">/ mo</span>
            </div>

            <div className="relative">
              {/* Dynamic Sparkline Visualizer */}
              <svg className="w-full h-20 overflow-visible mt-4" viewBox="0 0 240 80">
                <defs>
                  <clipPath id="roster-roi-clip">
                    <rect x="0" y="0" width={`${pct * 240}`} height="80" />
                  </clipPath>
                  <linearGradient id="roster-roi-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Background path (entire range) */}
                <path
                  d={pathD}
                  fill="none"
                  className="stroke-zinc-800"
                  strokeWidth="1.5"
                />
                {/* Active path (clipped to efficiency slider position) */}
                <path
                  d={pathD}
                  fill="none"
                  className={efficiency >= 0.75 ? "stroke-emerald-400" : "stroke-[#8ECAFF]"}
                  strokeWidth="2"
                  clipPath="url(#roster-roi-clip)"
                />
                {/* Filled gradient under curve */}
                <path
                  d={areaD}
                  fill="url(#roster-roi-grad)"
                  clipPath="url(#roster-roi-clip)"
                />
                {/* Target Point Tracker */}
                {pct > 0 && (
                  <circle
                    cx={10 + pct * 220}
                    cy={70 - (pct * pct * 50)}
                    r="4.5"
                    className={efficiency >= 0.75 ? "fill-emerald-400" : "fill-[#8ECAFF]"}
                  />
                )}
              </svg>
            </div>
          </div>

          {/* Card 4: AI Agent Log Stream */}
          <div className="lg:col-span-7 rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md p-6 hover:border-white/10 hover:bg-zinc-900/30 transition-all duration-300 flex flex-col justify-between">
            <div className="mb-4">
              <span className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase font-sans">
                Real-time Allocation Logs
              </span>
              <h3 className="text-lg font-semibold text-zinc-100 mt-1 font-sans">
                AI Agent Log Stream
              </h3>
            </div>

            {/* Terminal Window container */}
            <div className="w-full rounded-xl border border-white/5 bg-zinc-950 overflow-hidden shadow-inner flex flex-col h-48">
              {/* Terminal Title Bar */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-zinc-900/50">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                </div>
                <div className="text-[10px] font-mono text-zinc-500 select-none flex items-center gap-1.5">
                  <Terminal className="w-3 h-3 text-[#8ECAFF]" />
                  scheduler_agent.py
                </div>
                <div className="w-8" /> {/* Spacer */}
              </div>

              {/* Terminal Logs Scroll Container */}
              <div 
                ref={scrollContainerRef}
                className="flex-1 p-4 overflow-y-auto font-mono text-xs leading-relaxed space-y-2 select-text"
              >
                {activeLogs.map((log, index) => {
                  let badgeColor = "text-zinc-400";
                  let prefix = "SYS";
                  if (log.type === "warn") {
                    badgeColor = "text-zinc-500";
                    prefix = "WRN";
                  } else if (log.type === "agent") {
                    badgeColor = "text-[#8ECAFF]";
                    prefix = "AGT";
                  } else if (log.type === "savings") {
                    badgeColor = "text-blue-400";
                    prefix = "ROI";
                  } else if (log.type === "success") {
                    badgeColor = "text-emerald-400";
                    prefix = "OK ";
                  }

                  return (
                    <div key={index} className="flex items-start gap-2 text-zinc-300">
                      <span className="text-zinc-600 flex-shrink-0 select-none">
                        [{log.time}]
                      </span>
                      <span className={`${badgeColor} font-semibold flex-shrink-0 select-none`}>
                        {prefix}:
                      </span>
                      <span>{log.text}</span>
                    </div>
                  );
                })}
                {/* Blinking cursor */}
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-3 bg-[#8ECAFF] inline-block" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
