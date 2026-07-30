"use client";

import React, { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { 
  FileCheck, 
  FileText, 
  Users, 
  Calendar, 
  ArrowRight, 
  ShieldCheck, 
  Cpu, 
  Layers,
  Coins,
  Clapperboard,
  Sliders,
  Database
} from "lucide-react";
import AbramMark from "@/components/AbramMark";

// Standard cinematic easing from DESIGN.md
const easeCinematic = [0.16, 1, 0.3, 1] as [number, number, number, number];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const titleVariants = {
  hidden: { opacity: 0, y: 15, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      ease: easeCinematic,
    },
  },
};

// Card Entry Animations
const cardVariantsTL = {
  hidden: { opacity: 0, x: -30, y: -30, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      ease: easeCinematic,
    },
  },
};

const cardVariantsTR = {
  hidden: { opacity: 0, x: 30, y: -30, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      ease: easeCinematic,
    },
  },
};

const cardVariantsBL = {
  hidden: { opacity: 0, x: -30, y: 30, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      ease: easeCinematic,
    },
  },
};

const cardVariantsBR = {
  hidden: { opacity: 0, x: 30, y: 30, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      ease: easeCinematic,
    },
  },
};

interface KnowledgeCategory {
  id: string;
  title: string;
  icon: React.ElementType;
  badge: string;
  items: string[];
}

const KNOWLEDGE_CATEGORIES: KnowledgeCategory[] = [
  {
    id: "crew",
    title: "Crew & Roster Intelligence",
    icon: Users,
    badge: "6 Vectors",
    items: [
      "Crew preferences & history",
      "Rate cards & overtime limits",
      "Union turnaround parameters",
      "Preferred crew pairings",
      "Travel & transit buffers",
      "Skill tags & certifications",
    ],
  },
  {
    id: "finance",
    title: "Financials & Cost Rates",
    icon: Coins,
    badge: "6 Vectors",
    items: [
      "Vendor rental costs",
      "Budget outcomes & actuals",
      "Line-item variance trends",
      "Purchase order approval rules",
      "Payout ledgers & payment terms",
      "Margin calibration",
    ],
  },
  {
    id: "ops",
    title: "Field & Gear Logistics",
    icon: Clapperboard,
    badge: "6 Vectors",
    items: [
      "Actual task durations",
      "Schedule turnarounds",
      "Gear utilization & package gaps",
      "Stage & cyclorama holds",
      "Location permit rules",
      "Shooting ratio estimates",
    ],
  },
  {
    id: "client",
    title: "Client & Post Operations",
    icon: ShieldCheck,
    badge: "6 Vectors",
    items: [
      "Assignment patterns",
      "Client approval patterns",
      "Revision cycle speed",
      "Post edit & color pace",
      "Delivery spec requirements",
      "Brief parsing accuracy",
    ],
  },
];

export default function PassiveLearning() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 });
  const [activeTab, setActiveTab] = useState<string>("all");

  // Data flow packets representing raw events moving from cards to central sphere
  const packets = [
    { id: "tl-1", start: { x: "20%", y: "20%" }, delay: 0 },
    { id: "tl-2", start: { x: "20%", y: "20%" }, delay: 1.2 },
    { id: "tl-3", start: { x: "20%", y: "20%" }, delay: 2.4 },

    { id: "tr-1", start: { x: "80%", y: "20%" }, delay: 0.4 },
    { id: "tr-2", start: { x: "80%", y: "20%" }, delay: 1.6 },
    { id: "tr-3", start: { x: "80%", y: "20%" }, delay: 2.8 },

    { id: "bl-1", start: { x: "20%", y: "80%" }, delay: 0.8 },
    { id: "bl-2", start: { x: "20%", y: "80%" }, delay: 2.0 },
    { id: "bl-3", start: { x: "20%", y: "80%" }, delay: 3.2 },

    { id: "br-1", start: { x: "80%", y: "80%" }, delay: 0.2 },
    { id: "br-2", start: { x: "80%", y: "80%" }, delay: 1.4 },
    { id: "br-3", start: { x: "80%", y: "80%" }, delay: 2.6 },
  ];

  const filteredCategories = activeTab === "all"
    ? KNOWLEDGE_CATEGORIES
    : KNOWLEDGE_CATEGORIES.filter((cat) => cat.id === activeTab);

  return (
    <div
      ref={sectionRef}
      className="relative w-full bg-transparent flex flex-col items-center justify-center font-sans"
    >
      {/* Background Ambient Blurs */}
      <div className="absolute top-1/3 right-1/4 w-[250px] md:w-[700px] h-[250px] md:h-[450px] bg-zinc-900/[0.04] rounded-full blur-[80px] md:blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-[250px] md:w-[700px] h-[250px] md:h-[450px] bg-zinc-800/[0.02] rounded-full blur-[80px] md:blur-[120px] pointer-events-none" />

      <div className="w-full max-w-7xl mx-auto px-6 z-10">
        {/* Top Split Section: Explanation & Central Memory Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center mb-24">
          
          {/* Copy Explanation Column */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="lg:col-span-5 flex flex-col space-y-6 text-left"
          >
            {/* Feature List */}
            <motion.div variants={titleVariants} className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 mt-1 rounded flex items-center justify-center flex-shrink-0">
                  <Cpu className="w-4 h-4 text-zinc-300" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-zinc-200 font-sans">Continuous Data Parsing</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed mt-0.5 font-sans">
                    Extracts structured data from timesheets, brief write-ups, and calendar holds.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 mt-1 rounded flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-4 h-4 text-zinc-300" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-zinc-200 font-sans">Isolated & Private</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed mt-0.5 font-sans">
                    Your database is cryptographically partitioned, strictly isolated, and never used to train public models.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 mt-1 rounded flex items-center justify-center flex-shrink-0">
                  <Layers className="w-4 h-4 text-zinc-300" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-zinc-200 font-sans">Automatic Baselines</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed mt-0.5 font-sans">
                    Generates day rate structures, Union rules, and schedule baselines on autopilot.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* CTA Button */}
            <motion.div variants={titleVariants} className="pt-4">
              <button
                type="button"
                className="btn-glass min-h-[44px] py-2.5 px-5 text-xs font-semibold rounded-full group cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20 font-sans"
              >
                <span>View Security Architecture</span>
                <ArrowRight className="w-3 h-3 text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 transition-transform duration-200" />
              </button>
            </motion.div>
          </motion.div>

          {/* Interactive Visualization Column */}
          <div className="lg:col-span-7 flex items-center justify-center relative">
            <div className="relative w-full h-[400px] xs:h-[430px] sm:h-[480px] rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md overflow-hidden flex items-center justify-center">
              
              {/* Connection Paths SVG */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-white/5 stroke-[0.75] z-0" fill="none">
                <line x1="20%" y1="20%" x2="50%" y2="50%" strokeDasharray="3 3" />
                <line x1="80%" y1="20%" x2="50%" y2="50%" strokeDasharray="3 3" />
                <line x1="20%" y1="80%" x2="50%" y2="50%" strokeDasharray="3 3" />
                <line x1="80%" y1="80%" x2="50%" y2="50%" strokeDasharray="3 3" />
              </svg>

              {/* Data Flow Packets */}
              {packets.map((packet) => (
                <motion.div
                  key={packet.id}
                  className="absolute w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-zinc-200 blur-[0.5px] pointer-events-none z-10"
                  initial={{ left: packet.start.x, top: packet.start.y, opacity: 0, scale: 0.5 }}
                  animate={isInView ? {
                    left: "50%",
                    top: "50%",
                    opacity: [0, 0.8, 0.8, 0],
                    scale: [0.5, 1, 1, 0.2],
                  } : {}}
                  transition={{
                    duration: 2.8,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: packet.delay,
                  }}
                />
              ))}

              {/* Central Glowing Sphere */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={isInView ? { scale: 1, opacity: 1 } : {}}
                transition={{ duration: 1, ease: easeCinematic }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
              >
                <motion.div
                  animate={{ scale: [1, 1.25, 1], opacity: [0.15, 0.05, 0.15] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -inset-8 sm:-inset-12 rounded-full border border-white/5 bg-white/[0.01] blur-sm pointer-events-none"
                />

                <motion.div
                  animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute -inset-5 sm:-inset-8 rounded-full bg-gradient-to-r from-zinc-500/10 to-zinc-400/5 blur-md pointer-events-none"
                />

                <motion.div
                  animate={{ scale: [1, 1.04, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="w-18 h-18 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full border border-white/10 bg-zinc-950 flex flex-col items-center justify-center relative shadow-[0_0_40px_rgba(255,255,255,0.02)]"
                >
                  <Cpu className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-zinc-100 mb-1 sm:mb-1.5 relative z-10" />
                  <span className="text-[7px] sm:text-[8px] md:text-[9px] font-semibold tracking-wider text-zinc-300 uppercase relative z-10 text-center px-1 font-sans">
                    Unified
                  </span>
                  <span className="text-[6px] sm:text-[7px] md:text-[8px] font-medium tracking-widest text-zinc-500 uppercase relative z-10 text-center px-1 font-sans">
                    Memory
                  </span>
                </motion.div>
              </motion.div>

              {/* Data Feeds (Floating Cards) */}
              <motion.div
                variants={cardVariantsTL}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                className="absolute top-[6%] left-[4%] xs:left-[6%] sm:top-[8%] sm:left-[8%] z-30"
              >
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0 }}
                  className="glass-panel rounded-xl p-2 sm:p-3 md:p-3.5 border border-white/5 bg-zinc-900/40 backdrop-blur-md w-[105px] xs:w-[125px] sm:w-[155px] md:w-[185px] flex flex-col transition-colors duration-200 hover:border-white/10 hover:bg-zinc-800/40 cursor-default group"
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-5 h-5 rounded-lg bg-zinc-950 border border-white/5 flex items-center justify-center flex-shrink-0">
                      <FileCheck className="w-3 h-3 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
                    </div>
                    <span className="text-[7px] sm:text-[9px] font-semibold tracking-wider text-zinc-500 uppercase bg-white/[0.02] border border-white/5 px-1.5 py-0.5 rounded-full ml-auto font-sans">
                      Parsed
                    </span>
                  </div>
                  <h3 className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-zinc-200 truncate font-sans">
                    Approved Timesheets
                  </h3>
                  <p className="text-[7px] sm:text-[9px] md:text-[10px] text-zinc-400 leading-normal mt-0.5 truncate font-sans">
                    Helix Shoot, Day 2 Crew
                  </p>
                </motion.div>
              </motion.div>

              <motion.div
                variants={cardVariantsTR}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                className="absolute top-[6%] right-[4%] xs:right-[6%] sm:top-[8%] sm:right-[8%] z-30"
              >
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="glass-panel rounded-xl p-2 sm:p-3 md:p-3.5 border border-white/5 bg-zinc-900/40 backdrop-blur-md w-[105px] xs:w-[125px] sm:w-[155px] md:w-[185px] flex flex-col transition-colors duration-200 hover:border-white/10 hover:bg-zinc-800/40 cursor-default group"
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-5 h-5 rounded-lg bg-zinc-950 border border-white/5 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-3 h-3 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
                    </div>
                    <span className="text-[7px] sm:text-[9px] font-semibold tracking-wider text-zinc-500 uppercase bg-white/[0.02] border border-white/5 px-1.5 py-0.5 rounded-full ml-auto font-sans">
                      Analyzed
                    </span>
                  </div>
                  <h3 className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-zinc-200 truncate font-sans">
                    Intake Briefs
                  </h3>
                  <p className="text-[7px] sm:text-[9px] md:text-[10px] text-zinc-400 leading-normal mt-0.5 truncate font-sans">
                    Apex AW26 Campaign
                  </p>
                </motion.div>
              </motion.div>

              <motion.div
                variants={cardVariantsBL}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                className="absolute bottom-[6%] left-[4%] xs:left-[6%] sm:bottom-[8%] sm:left-[8%] z-30"
              >
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="glass-panel rounded-xl p-2 sm:p-3 md:p-3.5 border border-white/5 bg-zinc-900/40 backdrop-blur-md w-[105px] xs:w-[125px] sm:w-[155px] md:w-[185px] flex flex-col transition-colors duration-200 hover:border-white/10 hover:bg-zinc-800/40 cursor-default group"
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-5 h-5 rounded-lg bg-zinc-950 border border-white/5 flex items-center justify-center flex-shrink-0">
                      <Users className="w-3 h-3 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
                    </div>
                    <span className="text-[7px] sm:text-[9px] font-semibold tracking-wider text-zinc-500 uppercase bg-white/[0.02] border border-white/5 px-1.5 py-0.5 rounded-full ml-auto font-sans">
                      Synched
                    </span>
                  </div>
                  <h3 className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-zinc-200 truncate font-sans">
                    Roster Reviews
                  </h3>
                  <p className="text-[7px] sm:text-[9px] md:text-[10px] text-zinc-400 leading-normal mt-0.5 truncate font-sans">
                    6 Camera Ops Confirmed
                  </p>
                </motion.div>
              </motion.div>

              <motion.div
                variants={cardVariantsBR}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                className="absolute bottom-[6%] right-[4%] xs:right-[6%] sm:bottom-[8%] sm:right-[8%] z-30"
              >
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                  className="glass-panel rounded-xl p-2 sm:p-3 md:p-3.5 border border-white/5 bg-zinc-900/40 backdrop-blur-md w-[105px] xs:w-[125px] sm:w-[155px] md:w-[185px] flex flex-col transition-colors duration-200 hover:border-white/10 hover:bg-zinc-800/40 cursor-default group"
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-5 h-5 rounded-lg bg-zinc-950 border border-white/5 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-3 h-3 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
                    </div>
                    <span className="text-[7px] sm:text-[9px] font-semibold tracking-wider text-zinc-500 uppercase bg-white/[0.02] border border-white/5 px-1.5 py-0.5 rounded-full ml-auto font-sans">
                      Locked
                    </span>
                  </div>
                  <h3 className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-zinc-200 truncate font-sans">
                    Calendar Holds
                  </h3>
                  <p className="text-[7px] sm:text-[9px] md:text-[10px] text-zinc-400 leading-normal mt-0.5 truncate font-sans">
                    Studio C, July 14-16
                  </p>
                </motion.div>
              </motion.div>

            </div>
          </div>

        </div>

        {/* EXPANDED & REDESIGNED: What Your Production Brain Remembers */}
        <motion.div
          variants={titleVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="mt-16 md:mt-24 border-t border-white/5 pt-16 flex flex-col items-center"
        >
          {/* Section Sub-Header */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-3 inline-flex items-center gap-2 font-sans">
              <Database className="w-3 h-3 text-zinc-500" />
              INSTITUTIONAL WORKSPACE MEMORY
            </span>
            <h3 className="text-2xl md:text-3xl font-medium tracking-tight text-white font-sans mb-3">
              What Your Production Brain Remembers
            </h3>
            <p className="text-xs md:text-sm text-zinc-400 leading-relaxed font-sans">
              Unlike generic AI tools that forget everything between sessions, ABRAM continuously aggregates operational patterns across 24+ intelligence vectors.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex justify-center mb-10 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-1 w-full">
            <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-zinc-950/40 backdrop-blur-md p-1 shrink-0">
              <button
                onClick={() => setActiveTab("all")}
                className={`relative inline-flex items-center gap-1.5 rounded-full px-4 py-2 sm:py-1.5 text-xs font-medium transition-colors duration-200 cursor-pointer outline-none min-h-[44px] sm:min-h-0 sm:h-8 ${
                  activeTab === "all" ? "text-white" : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                {activeTab === "all" && (
                  <motion.span
                    layoutId="brain-category-pill"
                    className="absolute inset-0 rounded-full bg-white/[0.08] border border-white/[0.15]"
                    transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  />
                )}
                <span className="relative z-10 font-sans">All Vectors (24)</span>
              </button>

              {KNOWLEDGE_CATEGORIES.map((cat) => {
                const isActive = activeTab === cat.id;
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveTab(cat.id)}
                    className={`relative inline-flex items-center gap-1.5 rounded-full px-4 py-2 sm:py-1.5 text-xs font-medium transition-colors duration-200 cursor-pointer outline-none min-h-[44px] sm:min-h-0 sm:h-8 ${
                      isActive ? "text-white" : "text-zinc-500 hover:text-zinc-200"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="brain-category-pill"
                        className="absolute inset-0 rounded-full bg-white/[0.08] border border-white/[0.15]"
                        transition={{ type: "spring", stiffness: 400, damping: 34 }}
                      />
                    )}
                    <Icon className="relative z-10 w-3.5 h-3.5" />
                    <span className="relative z-10 font-sans whitespace-nowrap">{cat.title.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Categorized Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
            <AnimatePresence mode="popLayout">
              {filteredCategories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <motion.div
                    key={cat.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.3, ease: easeCinematic }}
                    className="rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md p-6 hover:border-white/10 hover:bg-zinc-900/30 transition-all duration-300 shadow-sm flex flex-col group relative overflow-hidden"
                  >


                    {/* Card Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/8 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-zinc-300" />
                        </div>
                        <h4 className="text-sm font-semibold text-zinc-200 font-sans tracking-tight">
                          {cat.title}
                        </h4>
                      </div>
                      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[9px] uppercase tracking-wider font-semibold text-zinc-400 font-sans">
                        {cat.badge}
                      </span>
                    </div>

                    {/* Intelligence Vector Chips Grid */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {cat.items.map((item) => (
                        <div
                          key={item}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15 px-3 py-2 text-xs text-zinc-300 font-sans transition-all duration-200 group/chip"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 group-hover/chip:bg-emerald-400 transition-colors shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
