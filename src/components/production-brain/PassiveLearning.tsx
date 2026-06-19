"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { FileCheck, FileText, Users, Calendar, ArrowRight, ShieldCheck, Cpu, Layers } from "lucide-react";

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

export default function PassiveLearning() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 });

  // Data flow packets representing raw events moving from cards to central sphere
  const packets = [
    // Top-Left path
    { id: "tl-1", start: { x: "20%", y: "20%" }, delay: 0 },
    { id: "tl-2", start: { x: "20%", y: "20%" }, delay: 1.2 },
    { id: "tl-3", start: { x: "20%", y: "20%" }, delay: 2.4 },

    // Top-Right path
    { id: "tr-1", start: { x: "80%", y: "20%" }, delay: 0.4 },
    { id: "tr-2", start: { x: "80%", y: "20%" }, delay: 1.6 },
    { id: "tr-3", start: { x: "80%", y: "20%" }, delay: 2.8 },

    // Bottom-Left path
    { id: "bl-1", start: { x: "20%", y: "80%" }, delay: 0.8 },
    { id: "bl-2", start: { x: "20%", y: "80%" }, delay: 2.0 },
    { id: "bl-3", start: { x: "20%", y: "80%" }, delay: 3.2 },

    // Bottom-Right path
    { id: "br-1", start: { x: "80%", y: "80%" }, delay: 0.2 },
    { id: "br-2", start: { x: "80%", y: "80%" }, delay: 1.4 },
    { id: "br-3", start: { x: "80%", y: "80%" }, delay: 2.6 },
  ];

  return (
    <div
      ref={sectionRef}
      className="relative w-full bg-transparent flex flex-col items-center justify-center font-sans"
    >
      {/* Background Ambient Blurs — Prevent layout shifting on small screens */}
      <div className="absolute top-1/3 right-1/4 w-[250px] md:w-[700px] h-[250px] md:h-[450px] bg-zinc-900/[0.04] rounded-full blur-[80px] md:blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-[250px] md:w-[700px] h-[250px] md:h-[450px] bg-zinc-800/[0.02] rounded-full blur-[80px] md:blur-[120px] pointer-events-none" />

      <div className="w-full max-w-7xl mx-auto px-6 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
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
                  <h4 className="text-sm font-semibold text-zinc-200">Continuous Data Parsing</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed mt-0.5">
                    Extracts structured data from timesheets, brief write-ups, and calendar holds.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 mt-1 rounded flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-4 h-4 text-zinc-300" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-zinc-200">Isolated & Private</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed mt-0.5">
                    Your database is cryptographically partitioned, strictly isolated, and never used to train public models.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 mt-1 rounded flex items-center justify-center flex-shrink-0">
                  <Layers className="w-4 h-4 text-zinc-300" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-zinc-200">Automatic Baselines</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed mt-0.5">
                    Generates day rate structures, Union rules, and schedule baselines on autopilot.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* CTA Button */}
            <motion.div variants={titleVariants} className="pt-4">
              <button
                type="button"
                className="btn-glass min-h-[44px] py-2.5 px-5 text-xs font-semibold rounded-full group cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20"
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

              {/* Central Glowing Sphere representing "Unified Workspace Memory" */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={isInView ? { scale: 1, opacity: 1 } : {}}
                transition={{ duration: 1, ease: easeCinematic }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
              >
                {/* Outermost slow pulse ring */}
                <motion.div
                  animate={{ scale: [1, 1.25, 1], opacity: [0.15, 0.05, 0.15] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -inset-8 sm:-inset-12 rounded-full border border-white/5 bg-white/[0.01] blur-sm pointer-events-none"
                />

                {/* Middle breathing glow */}
                <motion.div
                  animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute -inset-5 sm:-inset-8 rounded-full bg-gradient-to-r from-zinc-500/10 to-zinc-400/5 blur-md pointer-events-none"
                />

                {/* Main Sphere Body */}
                <motion.div
                  animate={{ scale: [1, 1.04, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="w-18 h-18 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full border border-white/10 bg-zinc-950 flex flex-col items-center justify-center relative shadow-[0_0_40px_rgba(255,255,255,0.02)]"
                >
                  <Cpu className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-zinc-100 mb-1 sm:mb-1.5 relative z-10" />
                  <span className="text-[7px] sm:text-[8px] md:text-[9px] font-semibold tracking-wider text-zinc-300 uppercase relative z-10 text-center px-1">
                    Unified
                  </span>
                  <span className="text-[6px] sm:text-[7px] md:text-[8px] font-medium tracking-widest text-zinc-500 uppercase relative z-10 text-center px-1">
                    Memory
                  </span>
                </motion.div>
              </motion.div>

              {/* Data Feeds (Floating Cards) */}

              {/* Card 1: Top-Left - Timesheets */}
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
                    <span className="text-[7px] sm:text-[9px] font-semibold tracking-wider text-zinc-500 uppercase bg-white/[0.02] border border-white/5 px-1.5 py-0.5 rounded-full ml-auto">
                      Parsed
                    </span>
                  </div>
                  <h3 className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-zinc-200 truncate">
                    Approved Timesheets
                  </h3>
                  <p className="text-[7px] sm:text-[9px] md:text-[10px] text-zinc-400 leading-normal mt-0.5 truncate">
                    Helix Shoot — Day 2 Crew
                  </p>
                </motion.div>
              </motion.div>

              {/* Card 2: Top-Right - Intake Briefs */}
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
                    <span className="text-[7px] sm:text-[9px] font-semibold tracking-wider text-zinc-500 uppercase bg-white/[0.02] border border-white/5 px-1.5 py-0.5 rounded-full ml-auto">
                      Analyzed
                    </span>
                  </div>
                  <h3 className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-zinc-200 truncate">
                    Intake Briefs
                  </h3>
                  <p className="text-[7px] sm:text-[9px] md:text-[10px] text-zinc-400 leading-normal mt-0.5 truncate">
                    Apex AW26 Campaign
                  </p>
                </motion.div>
              </motion.div>

              {/* Card 3: Bottom-Left - Roster Reviews */}
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
                    <span className="text-[7px] sm:text-[9px] font-semibold tracking-wider text-zinc-500 uppercase bg-white/[0.02] border border-white/5 px-1.5 py-0.5 rounded-full ml-auto">
                      Synched
                    </span>
                  </div>
                  <h3 className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-zinc-200 truncate">
                    Roster Reviews
                  </h3>
                  <p className="text-[7px] sm:text-[9px] md:text-[10px] text-zinc-400 leading-normal mt-0.5 truncate">
                    6 Camera Ops Confirmed
                  </p>
                </motion.div>
              </motion.div>

              {/* Card 4: Bottom-Right - Calendar Holds */}
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
                    <span className="text-[7px] sm:text-[9px] font-semibold tracking-wider text-zinc-500 uppercase bg-white/[0.02] border border-white/5 px-1.5 py-0.5 rounded-full ml-auto">
                      Locked
                    </span>
                  </div>
                  <h3 className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-zinc-200 truncate">
                    Calendar Holds
                  </h3>
                  <p className="text-[7px] sm:text-[9px] md:text-[10px] text-zinc-400 leading-normal mt-0.5 truncate">
                    Studio C — July 14-16
                  </p>
                </motion.div>
              </motion.div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
