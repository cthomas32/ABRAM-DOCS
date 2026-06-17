"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { 
  Calendar, 
  Sparkles, 
  Check, 
  AlertCircle, 
  ArrowRight, 
  Clock, 
  Users, 
  Layers, 
  Info, 
  X,
  ShieldAlert,
  Sliders,
  ChevronRight,
  TrendingUp,
  Workflow
} from "lucide-react";

interface CrewMember {
  name: string;
  role: string;
  initials: string;
  color: string;
}

interface TimelineItem {
  id: string;
  title: string;
  track: string;
  startPct: number;
  widthPct: number;
  optStartPct: number;
  optWidthPct: number;
  progress: number;
  color: string;
  crew: CrewMember[];
  description: string;
  milestone?: {
    name: string;
    offsetPct: number;
    optOffsetPct: number;
  };
}

const TIMELINE_DATA: TimelineItem[] = [
  {
    id: "concept",
    title: "Concept Draft & Styling",
    track: "Core Creative",
    startPct: 4,
    widthPct: 18,
    optStartPct: 4,
    optWidthPct: 18,
    progress: 100,
    color: "#CE1C1C", // Abram Crimson
    description: "Create campaign direction, moodboards, draft treatment script, and pitch alignment.",
    crew: [
      { name: "Sarah L.", role: "Director", initials: "SL", color: "bg-purple-600" },
      { name: "Marcus V.", role: "Creative Lead", initials: "MV", color: "bg-emerald-600" }
    ],
    milestone: {
      name: "Brief Approved",
      offsetPct: 22,
      optOffsetPct: 22
    }
  },
  {
    id: "crewing",
    title: "DP Match & Crew Booking",
    track: "DP Allocation",
    startPct: 21,
    widthPct: 20,
    optStartPct: 21,
    optWidthPct: 20,
    progress: 80,
    color: "#8ECAFF", // Abram Sky Blue
    description: "Analyze matching scores, distribute day-rate parameters, and verify team RSVPs.",
    crew: [
      { name: "Alex K.", role: "DP", initials: "AK", color: "bg-blue-600" },
      { name: "Jordan M.", role: "Gaffer", initials: "JM", color: "bg-amber-600" }
    ],
    milestone: {
      name: "Crew Locked",
      offsetPct: 41,
      optOffsetPct: 41
    }
  },
  {
    id: "stage",
    title: "Studio Prep & Shooting",
    track: "Stage Booking",
    startPct: 37,
    widthPct: 15,
    optStartPct: 46, // Shifted to start after the blackout dates (around June 12-15)
    optWidthPct: 15,
    progress: 15,
    color: "#EAB308", // Amber
    description: "Reserve Soundstage A, coordinate grip truck delivery, and record primary plates.",
    crew: [
      { name: "Taylor H.", role: "Stage Lead", initials: "TH", color: "bg-pink-600" },
      { name: "Jordan M.", role: "Gaffer", initials: "JM", color: "bg-amber-600" }
    ],
    milestone: {
      name: "Production Wrap",
      offsetPct: 52,
      optOffsetPct: 61
    }
  },
  {
    id: "post",
    title: "Post-Production Edit",
    track: "Post & Sound",
    startPct: 51,
    widthPct: 23,
    optStartPct: 60, // Shifted to align with prep delay
    optWidthPct: 23,
    progress: 0,
    color: "#10B981", // Emerald
    description: "Primary editor review, digital grading suite sync, and audio design track mix.",
    crew: [
      { name: "Sasha B.", role: "Lead Editor", initials: "SB", color: "bg-teal-600" },
      { name: "Marcus V.", role: "Supervisor", initials: "MV", color: "bg-emerald-600" }
    ],
    milestone: {
      name: "Picture Lock",
      offsetPct: 74,
      optOffsetPct: 83
    }
  },
  {
    id: "delivery",
    title: "Campaign Delivery Cuts",
    track: "Social Deliverables",
    startPct: 73,
    widthPct: 21,
    optStartPct: 82, // Shifted to allow wrap-up
    optWidthPct: 15,
    progress: 0,
    color: "#FAFAF9", // Abram Cream
    description: "Generate 60s and 15s aspect variants, upload approval nodes, and clear invoicing.",
    crew: [
      { name: "Sarah L.", role: "Director", initials: "SL", color: "bg-purple-600" }
    ],
    milestone: {
      name: "Final Wrap",
      offsetPct: 94,
      optOffsetPct: 97
    }
  }
];

const CONNECTIONS = [
  { from: "concept", to: "crewing", fromRowIndex: 0, toRowIndex: 1 },
  { from: "crewing", to: "stage", fromRowIndex: 1, toRowIndex: 2 },
  { from: "stage", to: "post", fromRowIndex: 2, toRowIndex: 3 },
  { from: "post", to: "delivery", fromRowIndex: 3, toRowIndex: 4 }
];

const MONTHS = [
  { name: "May", weeks: ["W1", "W2", "W3", "W4"] },
  { name: "June", weeks: ["W1", "W2", "W3", "W4"] },
  { name: "July", weeks: ["W1", "W2", "W3", "W4"] }
];

export default function TimelineSection() {
  const [isOptimized, setIsOptimized] = useState(false);
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  const sectionRef = useRef<HTMLDivElement>(null);

  // 3D parallax scroll effects matching premium Linear style
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const rotateX = useTransform(scrollYProgress, [0, 0.45], [10, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.45], [0.95, 1]);
  const y = useTransform(scrollYProgress, [0, 0.45], [80, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.35], [0, 1]);

  const selectedTask = TIMELINE_DATA.find(t => t.id === selectedTaskId);

  // Bezier curve connector generator
  const getBezierPath = (startX: number, startY: number, endX: number, endY: number) => {
    const controlX = (startX + endX) / 2;
    return `M ${startX}% ${startY}% C ${controlX}% ${startY}%, ${controlX}% ${endY}%, ${endX}% ${endY}%`;
  };

  return (
    <section 
      ref={sectionRef} 
      className="relative w-full py-24 md:py-32 border-t border-white/[0.08] bg-transparent overflow-hidden selection:bg-zinc-800 selection:text-white"
      style={{ perspective: 1000 }}
    >
      {/* Background radial soft-glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-red-500/[0.02] rounded-full filter blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[600px] h-[600px] bg-[#8ECAFF]/[0.02] rounded-full filter blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative z-10 space-y-12">
        
        {/* Header Block */}
        <div className="text-center space-y-4 max-w-lg mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/3 text-[#f5f5f3] text-xs font-semibold tracking-wider uppercase">
            Campaign Orchestration
          </div>
          <h2 
            className="text-base md:text-lg font-medium text-white/90 tracking-wide leading-snug uppercase font-display"
          >
            Define the campaign direction. <span className="text-[#8ECAFF] font-semibold">Map resources from brief to wrap.</span>
          </h2>
          <p className="text-sm font-normal text-white/80 max-w-lg mx-auto leading-relaxed">
            ABRAM processes your creative milestones and automatically maps role availability. Shift, hover, or inspect scheduling connections on a high-fidelity timeline deck.
          </p>
        </div>

        {/* Scrollable Container with 3D reveal */}
        <motion.div 
          style={{ rotateX, scale, y, opacity }}
          className="relative transform-gpu space-y-6 w-full"
        >
          
          {/* Conflict Resolution Dashboard Panel */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 border border-white/[0.08] rounded-xl bg-zinc-950/60 backdrop-blur-xl">
            <div className="flex items-start sm:items-center gap-3">
              <div className={`p-2 rounded-lg shrink-0 transition-colors ${
                isOptimized 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' 
                  : 'bg-red-500/10 text-red-400 border border-red-500/25'
              }`}>
                {isOptimized ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4 " />
                )}
              </div>
              <div>
                <h3 className="text-xs font-medium text-zinc-200 uppercase tracking-wide flex items-center gap-1.5">
                  <span>{isOptimized ? "Schedule Optimized & Locked" : "Conflict Detected"}</span>
                  {!isOptimized && (
                    <span className="text-[9px] bg-red-500/15 border border-red-500/20 px-1 py-0.2 rounded text-red-400 tracking-wide font-semibold">
                      Action Required
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {isOptimized 
                    ? "Stage Booking shifted to avoid Stage A blackout dates. Deliverables aligned."
                    : "Stage Booking overlaps with soundstage blackout dates (June 12–15)."}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsOptimized(!isOptimized);
                  // deselect task if it was active
                  setSelectedTaskId(null);
                }}
                className={`relative overflow-hidden inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-medium tracking-wide transition-all duration-300 cursor-pointer ${
                  isOptimized 
                    ? 'bg-zinc-900 border-white/10 hover:bg-zinc-800 text-zinc-300' 
                    : 'bg-[#CE1C1C] hover:bg-red-600 border-red-700 hover:border-red-500 text-white shadow-[0_0_15px_rgba(206,28,28,0.3)]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isOptimized ? "Reset Schedule" : "Resolve Conflict"}</span>
              </button>
            </div>
          </div>

          {/* Interactive Gantt Timeline Frame */}
          <div className="w-full overflow-x-auto pb-4" data-lenis-prevent="true">
            <div className="min-w-[850px] border border-white/[0.08] rounded-xl bg-zinc-950/40 backdrop-blur-xl overflow-hidden shadow-2xl relative">
              
              <div className="flex">
                
                {/* Left Side-Panel: Initiatives & Tracks */}
                <div className="w-60 shrink-0 border-r border-white/[0.08] bg-zinc-950/20">
                  {/* Side-Panel Header */}
                  <div className="h-12 border-b border-white/[0.08] flex items-center px-4 text-[10px] font-medium text-zinc-500 uppercase tracking-widest bg-white/[0.01]">
                    <Layers className="w-3.5 h-3.5 mr-2 text-zinc-500" />
                    <span>Tracks &amp; Roles</span>
                  </div>

                  {/* Side-Panel Rows */}
                  <div className="divide-y divide-white/[0.08]">
                    {TIMELINE_DATA.map((item) => {
                      const isHovered = hoveredTaskId === item.id;
                      const isSelected = selectedTaskId === item.id;
                      
                      // Dynamic status calculation
                      let statusText = "Ready";
                      let statusColor = "text-zinc-500 bg-zinc-900 border-zinc-800";
                      
                      if (item.id === "concept") {
                        statusText = "Completed";
                        statusColor = "text-emerald-400 bg-emerald-500/5 border-emerald-500/15";
                      } else if (item.id === "crewing") {
                        statusText = "Locked";
                        statusColor = "text-blue-400 bg-blue-500/5 border-blue-500/15";
                      } else if (item.id === "stage") {
                        statusText = isOptimized ? "Scheduled" : "On Hold";
                        statusColor = isOptimized 
                          ? "text-emerald-400 bg-emerald-500/5 border-emerald-500/15" 
                          : "text-amber-400 bg-amber-500/5 border-amber-500/15";
                      } else {
                        statusText = isOptimized ? "Scheduled" : "Blocked";
                        statusColor = isOptimized
                          ? "text-zinc-400 bg-zinc-900 border-zinc-800"
                          : "text-red-400/80 bg-red-500/5 border-red-500/10";
                      }

                      return (
                        <div
                          key={item.id}
                          className={`h-20 flex flex-col justify-center px-4 transition-all duration-200 cursor-pointer relative ${
                            isSelected 
                              ? "bg-white/[0.04]" 
                              : isHovered 
                                ? "bg-white/[0.02]" 
                                : "hover:bg-white/[0.01]"
                          }`}
                          onMouseEnter={() => setHoveredTaskId(item.id)}
                          onMouseLeave={() => setHoveredTaskId(null)}
                          onClick={() => setSelectedTaskId(isSelected ? null : item.id)}
                        >
                          {/* Active border indicator */}
                          {isSelected && (
                            <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ backgroundColor: item.color }} />
                          )}
                          
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-zinc-300 tracking-wide">
                              {item.track}
                            </span>
                            <span className={`text-[8px] font-medium tracking-wide px-1.5 py-0.2 rounded border ${statusColor}`}>
                              {statusText}
                            </span>
                          </div>
                          
                          {/* Crew indicators */}
                          <div className="flex items-center justify-between mt-1.5">
                            <div className="flex items-center -space-x-1.5 overflow-hidden">
                              {item.crew.map((member, idx) => (
                                <div
                                  key={idx}
                                  className={`w-4 h-4 rounded-full border border-zinc-950 flex items-center justify-center text-[7px] font-medium text-white shrink-0 ${member.color}`}
                                  title={`${member.name} - ${member.role}`}
                                >
                                  {member.initials}
                                </div>
                              ))}
                              <span className="text-[9px] text-zinc-500 font-medium ml-1.5">
                                {item.crew.length} Allocated
                              </span>
                            </div>
                            <ChevronRight className={`w-3.5 h-3.5 text-zinc-600 transition-transform ${isHovered ? 'translate-x-0.5 text-zinc-400' : ''}`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Side: Gantt Board Scheduling Grid */}
                <div className="flex-1 relative overflow-hidden bg-zinc-950/10">
                  
                  {/* Month Lanes Header */}
                  <div className="h-12 border-b border-white/[0.08] flex bg-white/[0.01]">
                    {MONTHS.map((m, idx) => (
                      <div key={idx} className="flex-1 flex flex-col border-r border-white/[0.08] last:border-r-0">
                        {/* Month Title */}
                        <div className="flex-1 flex items-center justify-center text-[10px] font-medium text-zinc-400 uppercase tracking-widest border-b border-white/[0.04]">
                          {m.name}
                        </div>
                        {/* Week Columns Label */}
                        <div className="grid grid-cols-4 text-[8px] font-medium text-zinc-600 text-center py-0.5">
                          {m.weeks.map((w, wIdx) => (
                            <div key={wIdx} className="border-r border-white/[0.02] last:border-r-0">
                              {w}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Gantt Timeline Lanes */}
                  <div className="relative h-[400px]">
                    
                    {/* Background Grid Lines (Vertical columns for 12 weeks) */}
                    {Array.from({ length: 12 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="absolute top-0 bottom-0 border-r border-white/[0.02] pointer-events-none"
                        style={{ left: `${(idx + 1) * (100 / 12)}%` }}
                      />
                    ))}

                    {/* Studio Blackout Date Marker Overlay (June W2-W3, approx 41% to 50%) */}
                    <div 
                      className="absolute top-0 bottom-0 pointer-events-none bg-red-500/[0.02] border-x border-dashed border-red-500/10 transition-all duration-300"
                      style={{ 
                        left: "41.6%", 
                        width: "8.3%",
                        opacity: isOptimized ? 0.2 : 1 
                      }}
                    >
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] text-red-400 bg-red-950/80 border border-red-900/30 px-1.5 py-0.5 rounded font-medium tracking-wide">
                        {isOptimized ? "Blackout Avoided" : "Blackout: Stage Maintenance"}
                      </div>
                    </div>

                    {/* Row Hover Background Highlights */}
                    <div className="absolute inset-0 flex flex-col divide-y divide-white/[0.08] pointer-events-none">
                      {TIMELINE_DATA.map((item) => (
                        <div 
                          key={item.id} 
                          className={`flex-1 transition-colors duration-300 ${
                            hoveredTaskId === item.id ? "bg-white/[0.02]" : ""
                          }`} 
                        />
                      ))}
                    </div>

                    {/* SVG Connector Paths */}
                    <svg className="absolute inset-0 pointer-events-none w-full h-full z-10">
                      <defs>
                        <linearGradient id="ganttLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#CE1C1C" stopOpacity="0.8" />
                          <stop offset="100%" stopColor="#8ECAFF" stopOpacity="0.8" />
                        </linearGradient>
                        <filter id="glow-effect" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="3" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>

                      {CONNECTIONS.map((conn, idx) => {
                        const fromItem = TIMELINE_DATA.find(t => t.id === conn.from);
                        const toItem = TIMELINE_DATA.find(t => t.id === conn.to);
                        if (!fromItem || !toItem) return null;

                        // Start coordinate is the end of the previous task bar
                        const fromLeft = isOptimized ? fromItem.optStartPct : fromItem.startPct;
                        const fromWidth = isOptimized ? fromItem.optWidthPct : fromItem.widthPct;
                        const startX = fromLeft + fromWidth;
                        const startY = conn.fromRowIndex * 20 + 10; // 5 rows = 20% height per row

                        // End coordinate is the start of the next task bar
                        const endX = isOptimized ? toItem.optStartPct : toItem.startPct;
                        const endY = conn.toRowIndex * 20 + 10;

                        const isPathHighlighted = hoveredTaskId === conn.from || hoveredTaskId === conn.to;

                        return (
                          <g key={idx}>
                            {/* Curved connector drop shadow */}
                            <motion.path
                              d={getBezierPath(startX, startY, endX, endY)}
                              fill="none"
                              stroke="rgba(0,0,0,0.5)"
                              strokeWidth={3}
                              transition={{ type: "spring", stiffness: 100, damping: 15 }}
                            />
                            {/* Real connector */}
                            <motion.path
                              d={getBezierPath(startX, startY, endX, endY)}
                              fill="none"
                              stroke={isPathHighlighted ? "url(#ganttLineGradient)" : "rgba(255, 255, 255, 0.08)"}
                              strokeWidth={isPathHighlighted ? 2 : 1}
                              filter={isPathHighlighted ? "url(#glow-effect)" : "none"}
                              strokeDasharray={isPathHighlighted ? "none" : "3 3"}
                              transition={{ 
                                type: "spring", 
                                stiffness: 100, 
                                damping: 15,
                                stroke: { duration: 0.15 } 
                              }}
                            />
                          </g>
                        );
                      })}
                    </svg>

                    {/* Timeline Data Nodes */}
                    <div className="absolute inset-0 z-20 pointer-events-none">
                      {TIMELINE_DATA.map((item, rowIndex) => {
                        const leftPct = isOptimized ? item.optStartPct : item.startPct;
                        const widthPct = isOptimized ? item.optWidthPct : item.widthPct;
                        const isHovered = hoveredTaskId === item.id;
                        const isSelected = selectedTaskId === item.id;

                        return (
                          <div
                            key={item.id}
                            className="absolute w-full pointer-events-auto"
                            style={{ top: `${rowIndex * 80}px`, height: "80px" }}
                          >
                            {/* Task Block Bar */}
                            <motion.div
                              className={`absolute top-5 h-9 rounded-lg border pointer-events-auto cursor-pointer flex items-center justify-between px-3 transition-colors ${
                                isSelected
                                  ? "bg-white/[0.08] shadow-[0_0_20px_rgba(255,255,255,0.03)]"
                                  : isHovered
                                    ? "bg-white/[0.05]"
                                    : "bg-white/[0.02]"
                              }`}
                              style={{
                                borderColor: isSelected ? item.color : isHovered ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.04)",
                                borderLeft: `3px solid ${item.color}`
                              }}
                              animate={{
                                left: `${leftPct}%`,
                                width: `${widthPct}%`
                              }}
                              transition={{ type: "spring", stiffness: 100, damping: 15 }}
                              onMouseEnter={() => setHoveredTaskId(item.id)}
                              onMouseLeave={() => setHoveredTaskId(null)}
                              onClick={() => setSelectedTaskId(isSelected ? null : item.id)}
                            >
                              {/* Background Progress Slider */}
                              <div
                                className="absolute left-0 top-0 bottom-0 opacity-15 pointer-events-none transition-all duration-300"
                                style={{ width: `${item.progress}%`, backgroundColor: item.color }}
                              />

                              <span className="text-[10px] font-medium text-zinc-300 truncate pr-2 select-none relative z-10">
                                {item.title}
                              </span>

                              <div className="flex items-center gap-1.5 shrink-0 relative z-10 select-none">
                                {item.progress === 100 ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <span className="text-[8.5px] text-zinc-500 font-medium">{item.progress}%</span>
                                )}
                              </div>

                              {/* Hover Floating Details Card */}
                              <AnimatePresence>
                                {isHovered && !selectedTaskId && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.96 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 z-40 w-64 p-4 glass-panel rounded-xl shadow-2xl pointer-events-none text-xs border border-white/10"
                                    style={{
                                      boxShadow: `0 10px 30px rgba(0, 0, 0, 0.6), 0 0 15px ${item.color}15`
                                    }}
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium tracking-wide text-[9px]" style={{ color: item.color }}>
                                        {item.track}
                                      </span>
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/5 font-semibold">
                                        {item.progress}% Done
                                      </span>
                                    </div>
                                    <h4 className="font-medium text-zinc-200 text-xs mb-1">{item.title}</h4>
                                    <p className="text-[10px] text-zinc-400 leading-relaxed mb-3">
                                      {item.description}
                                    </p>
                                    
                                    <div className="border-t border-white/5 pt-2.5 space-y-1.5">
                                      <span className="text-[8.5px] text-zinc-500 font-medium tracking-wide block">Allocated Crew:</span>
                                      <div className="space-y-1">
                                        {item.crew.map((member, idx) => (
                                          <div key={idx} className="flex items-center gap-2 text-[10px]">
                                            <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-medium text-white shrink-0 ${member.color}`}>
                                              {member.initials}
                                            </span>
                                            <span className="text-zinc-300 font-medium">{member.name}</span>
                                            <span className="text-zinc-500 text-[8.5px] ml-auto">{member.role}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {item.id === "stage" && !isOptimized && (
                                      <div className="mt-2.5 p-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-[9px] text-red-400 flex items-center gap-1.5">
                                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                        <span>Schedule overlaps blackout stage maintenance.</span>
                                      </div>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>

                            {/* Milestone Marker Diamond */}
                            {item.milestone && (
                              <motion.div
                                className="absolute top-5 flex flex-col items-center pointer-events-auto cursor-pointer group"
                                style={{ height: "36px" }}
                                animate={{
                                  left: `${isOptimized ? item.milestone.optOffsetPct : item.milestone.offsetPct}%`
                                }}
                                transition={{ type: "spring", stiffness: 100, damping: 15 }}
                                onMouseEnter={() => setHoveredTaskId(item.id)}
                                onMouseLeave={() => setHoveredTaskId(null)}
                                onClick={() => setSelectedTaskId(isSelected ? null : item.id)}
                              >
                                {/* Dotted vertical line down the grid */}
                                <div className="absolute top-9 w-[1px] h-11 border-l border-dashed border-white/10 group-hover:border-white/30 transition-colors" />

                                {/* Diamond */}
                                <div 
                                  className="w-2.5 h-2.5 rotate-45 border transition-all duration-300 relative z-20"
                                  style={{
                                    backgroundColor: isSelected || isHovered ? item.color : "#0A0A0A",
                                    borderColor: item.color,
                                    boxShadow: isSelected || isHovered ? `0 0 10px ${item.color}` : "none"
                                  }}
                                />

                                {/* Milestone Name Label */}
                                <div className="absolute top-[-18px] whitespace-nowrap bg-zinc-900/90 text-zinc-400 border border-white/5 text-[8px] font-medium tracking-wide px-1.5 py-0.5 rounded opacity-60 group-hover:opacity-100 group-hover:text-white transition-all select-none z-30">
                                  {item.milestone.name}
                                </div>
                              </motion.div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Click Drawer (Detailed Inspector Panel) */}
                    <AnimatePresence>
                      {selectedTaskId && selectedTask && (
                        <motion.div
                          initial={{ x: "100%", opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: "100%", opacity: 0 }}
                          transition={{ type: "spring", stiffness: 180, damping: 22 }}
                          className="absolute top-0 right-0 bottom-0 w-80 bg-zinc-950/95 border-l border-white/10 p-5 z-30 glass-panel shadow-2xl flex flex-col justify-between"
                        >
                          <div className="space-y-5">
                            {/* Close & Title */}
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <span className="text-[9px] font-medium tracking-wide px-2 py-0.5 rounded border"
                                  style={{ 
                                    borderColor: `${selectedTask.color}30`, 
                                    backgroundColor: `${selectedTask.color}08`, 
                                    color: selectedTask.color 
                                  }}
                                >
                                  {selectedTask.track}
                                </span>
                                <h3 className="text-sm font-medium text-zinc-100 tracking-wide pt-1">
                                  {selectedTask.title}
                                </h3>
                              </div>
                              <button 
                                onClick={() => setSelectedTaskId(null)}
                                className="p-1 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 transition-colors cursor-pointer text-zinc-500 hover:text-zinc-300"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Task Description */}
                            <p className="text-xs text-zinc-400 leading-relaxed">
                              {selectedTask.description}
                            </p>

                            {/* Timeline parameters details */}
                            <div className="space-y-3 pt-3 border-t border-white/5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-zinc-500 font-medium">Timeline Allocation</span>
                                <span className="text-zinc-300 font-medium">
                                  {selectedTask.id === "concept" && "May 2 – May 18"}
                                  {selectedTask.id === "crewing" && "May 19 – June 5"}
                                  {selectedTask.id === "stage" && (isOptimized ? "June 16 – June 28" : "June 8 – June 20")}
                                  {selectedTask.id === "post" && (isOptimized ? "June 29 – July 18" : "June 21 – July 10")}
                                  {selectedTask.id === "delivery" && (isOptimized ? "July 19 – August 2" : "July 11 – July 28")}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-zinc-500 font-medium">Progress Threshold</span>
                                <span className="text-zinc-300 font-medium">{selectedTask.progress}% Complete</span>
                              </div>
                              
                              {/* Progress bar visual */}
                              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${selectedTask.progress}%`, backgroundColor: selectedTask.color }} />
                              </div>
                            </div>

                            {/* Crew Checklist */}
                            <div className="space-y-2 pt-3 border-t border-white/5">
                              <span className="text-[9px] text-zinc-500 font-medium tracking-wide block">Roster &amp; Assignment RSVPs</span>
                              <div className="space-y-2">
                                {selectedTask.crew.map((member, idx) => (
                                  <div key={idx} className="flex items-center justify-between bg-white/[0.01] border border-white/3 p-2 rounded-lg text-xs">
                                    <div className="flex items-center gap-2">
                                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium text-white shrink-0 ${member.color}`}>
                                        {member.initials}
                                      </span>
                                      <div>
                                        <p className="font-medium text-zinc-200">{member.name}</p>
                                        <p className="text-[9px] text-zinc-500 font-medium">{member.role}</p>
                                      </div>
                                    </div>
                                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium tracking-wide">
                                      RSVP Yes
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Inspector Action Footer */}
                          <div className="pt-4 border-t border-white/5 space-y-2.5">
                            {selectedTask.id === "stage" && !isOptimized && (
                              <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] text-red-400 flex items-start gap-2">
                                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-medium">Soundstage Blocked</p>
                                  <p className="mt-0.5 text-zinc-400 leading-normal">Dates conflict with Stage A blackout. Optimizing will auto-shift the stage booking track.</p>
                                </div>
                              </div>
                            )}

                            {selectedTask.id === "stage" ? (
                              <button
                                onClick={() => setIsOptimized(!isOptimized)}
                                className={`w-full py-2.5 rounded-full text-xs font-medium tracking-wide transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                                  isOptimized
                                    ? "bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-zinc-300"
                                    : "bg-[#CE1C1C] hover:bg-red-600 border border-red-700 hover:border-red-500 text-white shadow-[0_0_15px_rgba(206,28,28,0.25)]"
                                }`}
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>{isOptimized ? "Reset Schedule" : "Resolve Stage Block"}</span>
                              </button>
                            ) : (
                              <div className="text-center py-2 text-[10px] text-zinc-500 font-medium">
                                Track automatically coordinates with project dependencies.
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* Bottom helper metadata panel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-white/5 rounded-xl bg-zinc-950/20 hover:bg-zinc-950/40 transition-colors">
              <div className="flex items-center gap-2 text-[#8ECAFF] mb-1.5">
                <Clock className="w-4 h-4" />
                <h4 className="text-xs font-medium tracking-wide">Roster Auto-Alignment</h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Adjusting any upstream deliverable automatically cascades downstream bookings, recalculating crew availability thresholds.
              </p>
            </div>
            
            <div className="p-4 border border-white/5 rounded-xl bg-zinc-950/20 hover:bg-zinc-950/40 transition-colors">
              <div className="flex items-center gap-2 text-yellow-500 mb-1.5">
                <Workflow className="w-4 h-4" />
                <h4 className="text-xs font-medium tracking-wide">Dependency Checkers</h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Pre-defined studio blackout and team holiday boundaries are continually evaluated, raising real-time alerts if overlaps occur.
              </p>
            </div>

            <div className="p-4 border border-white/5 rounded-xl bg-zinc-950/20 hover:bg-zinc-950/40 transition-colors">
              <div className="flex items-center gap-2 text-emerald-400 mb-1.5">
                <TrendingUp className="w-4 h-4" />
                <h4 className="text-xs font-medium tracking-wide">Zero Crew Overruns</h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                By shift-optimizing tasks, double-booking is resolved programmatically, saving production managers hours of manual calendar audits.
              </p>
            </div>
          </div>

        </motion.div>

      </div>
    </section>
  );
}
