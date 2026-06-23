"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ShieldCheck, Star, Check } from "lucide-react";

interface CrewMember {
  name: string;
  initials: string;
  role: string;
  status: "Available" | "Hold" | "Booked";
  statusColor: string;
  skills: string[];
  chemistry: number;
  dayRate: string;
  hourlyRate: string;
}

const CREW_MEMBERS: CrewMember[] = [
  {
    name: "Alex K.",
    initials: "AK",
    role: "Director of Photography",
    status: "Available",
    statusColor: "bg-emerald-500",
    skills: ["ARRI Alexa LF", "Anamorphic", "Lighting Design"],
    chemistry: 98,
    dayRate: "$1,800/day",
    hourlyRate: "$225/hr"
  },
  {
    name: "Jordan M.",
    initials: "JM",
    role: "Gaffer",
    status: "Hold",
    statusColor: "bg-amber-500",
    skills: ["HMI Lighting", "LED Panels", "Power Distrib"],
    chemistry: 95,
    dayRate: "$1,200/day",
    hourlyRate: "$150/hr"
  },
  {
    name: "Sam R.",
    initials: "SR",
    role: "Key Grip",
    status: "Available",
    statusColor: "bg-emerald-500",
    skills: ["Rigging", "Dolly Operator", "Safety Certified"],
    chemistry: 92,
    dayRate: "$1,100/day",
    hourlyRate: "$137.50/hr"
  }
];

export default function CrewSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track scroll relative to viewport entry/exit
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "center center"], // Fanning finishes as section enters center
  });

  // Card 0 (Alex - Left card): wider horizontal fan-out and tilt
  const xCard0 = useTransform(scrollYProgress, [0.2, 0.85], [0, -90]);
  const yCard0 = useTransform(scrollYProgress, [0.2, 0.85], [0, 20]);
  const rCard0 = useTransform(scrollYProgress, [0.2, 0.85], [0, -12]);

  // Card 1 (Jordan - Center card): slide up on scroll
  const yCard1 = useTransform(scrollYProgress, [0.2, 0.85], [0, -35]);

  // Card 2 (Sam - Right card): wider horizontal fan-out and tilt
  const xCard2 = useTransform(scrollYProgress, [0.2, 0.85], [0, 90]);
  const yCard2 = useTransform(scrollYProgress, [0.2, 0.85], [0, 20]);
  const rCard2 = useTransform(scrollYProgress, [0.2, 0.85], [0, 12]);

  // Spring hover transition config
  const hoverSpring = {
    type: "spring",
    stiffness: 300,
    damping: 20
  } as const;

  return (
    <section ref={containerRef} className="relative w-full py-24 md:py-32 border-t border-white/[0.08] bg-transparent overflow-hidden selection:bg-zinc-800 selection:text-white">
      {/* Ambient Glows - Sky Blue and Fuchsia/Purple */}
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#8ECAFF]/[0.035] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-fuchsia-500/[0.018] rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left Side: Fanning Roster Cards on Scroll */}
          <div className="lg:col-span-6 flex items-center justify-center h-[450px] relative">
            <div className="relative w-full max-w-[320px] h-[340px] flex items-center justify-center">
              
              {/* Card 0 (Alex) */}
              <motion.div
                style={{ x: xCard0, y: yCard0, rotate: rCard0, zIndex: 30, transformOrigin: "bottom center" }}
                whileHover={{ scale: 1.05, zIndex: 45 }}
                transition={hoverSpring}
                className="absolute w-full max-w-[270px] rounded-xl glass-panel border border-white/[0.08] p-5 bg-zinc-950/80 shadow-[0_15px_35px_rgba(0,0,0,0.6)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/5 border border-white/[0.08] flex items-center justify-center text-[#8ECAFF] font-semibold text-sm">
                        {CREW_MEMBERS[0].initials}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white tracking-wide">
                          {CREW_MEMBERS[0].name}
                        </h4>
                        <p className="text-xs text-zinc-400">{CREW_MEMBERS[0].role}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/[0.08] text-[9px] text-zinc-300">
                      <span className={`w-1.5 h-1.5 rounded-full ${CREW_MEMBERS[0].statusColor} `} />
                      <span>{CREW_MEMBERS[0].status}</span>
                    </div>
                  </div>

                  <div className="space-y-1 mb-4">
                    <span className="text-[9px] tracking-wide text-zinc-500 font-semibold block">Verified Skills</span>
                    <div className="flex flex-wrap gap-1">
                      {CREW_MEMBERS[0].skills.map((skill) => (
                        <span
                          key={skill}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-abram-black/40 text-white/80 border border-white/[0.08] flex items-center gap-1"
                        >
                          <Check className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                          <span>{skill}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/[0.08] pt-3 space-y-3">
                  <div>
                    <div className="flex justify-between items-center text-[10px] mb-1.5">
                      <span className="text-zinc-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#8ECAFF]" />
                        Chemistry Score
                      </span>
                      <span className="font-semibold text-white">{CREW_MEMBERS[0].chemistry}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-900 border border-white/[0.08] overflow-hidden">
                      <motion.div
                        style={{ width: `${CREW_MEMBERS[0].chemistry}%` }}
                        className="h-full bg-[#8ECAFF] rounded-full"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-1 text-xs">
                    <span className="font-semibold text-white">{CREW_MEMBERS[0].dayRate}</span>
                    <span className="text-zinc-500 text-[10px] font-mono">{CREW_MEMBERS[0].hourlyRate}</span>
                  </div>
                </div>
              </motion.div>

              {/* Card 1 (Jordan) */}
              <motion.div
                style={{ y: yCard1, zIndex: 20, transformOrigin: "bottom center" }}
                whileHover={{ scale: 1.05, zIndex: 45 }}
                transition={hoverSpring}
                className="absolute w-full max-w-[270px] rounded-xl glass-panel border border-white/[0.08] p-5 bg-zinc-950/80 shadow-[0_15px_35px_rgba(0,0,0,0.6)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/5 border border-white/[0.08] flex items-center justify-center text-[#8ECAFF] font-semibold text-sm">
                        {CREW_MEMBERS[1].initials}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white tracking-wide">
                          {CREW_MEMBERS[1].name}
                        </h4>
                        <p className="text-xs text-zinc-400">{CREW_MEMBERS[1].role}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/[0.08] text-[9px] text-zinc-300">
                      <span className={`w-1.5 h-1.5 rounded-full ${CREW_MEMBERS[1].statusColor} `} />
                      <span>{CREW_MEMBERS[1].status}</span>
                    </div>
                  </div>

                  <div className="space-y-1 mb-4">
                    <span className="text-[9px] tracking-wide text-zinc-500 font-semibold block">Verified Skills</span>
                    <div className="flex flex-wrap gap-1">
                      {CREW_MEMBERS[1].skills.map((skill) => (
                        <span
                          key={skill}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-abram-black/40 text-white/80 border border-white/[0.08] flex items-center gap-1"
                        >
                          <Check className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                          <span>{skill}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/[0.08] pt-3 space-y-3">
                  <div>
                    <div className="flex justify-between items-center text-[10px] mb-1.5">
                      <span className="text-zinc-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#8ECAFF]" />
                        Chemistry Score
                      </span>
                      <span className="font-semibold text-white">{CREW_MEMBERS[1].chemistry}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-900 border border-white/[0.08] overflow-hidden">
                      <motion.div
                        style={{ width: `${CREW_MEMBERS[1].chemistry}%` }}
                        className="h-full bg-[#8ECAFF] rounded-full"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-1 text-xs">
                    <span className="font-semibold text-white">{CREW_MEMBERS[1].dayRate}</span>
                    <span className="text-zinc-500 text-[10px] font-mono">{CREW_MEMBERS[1].hourlyRate}</span>
                  </div>
                </div>
              </motion.div>

              {/* Card 2 (Sam) */}
              <motion.div
                style={{ x: xCard2, y: yCard2, rotate: rCard2, zIndex: 10, transformOrigin: "bottom center" }}
                whileHover={{ scale: 1.05, zIndex: 45 }}
                transition={hoverSpring}
                className="absolute w-full max-w-[270px] rounded-xl glass-panel border border-white/[0.08] p-5 bg-zinc-950/80 shadow-[0_15px_35px_rgba(0,0,0,0.6)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/5 border border-white/[0.08] flex items-center justify-center text-[#8ECAFF] font-semibold text-sm">
                        {CREW_MEMBERS[2].initials}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white tracking-wide">
                          {CREW_MEMBERS[2].name}
                        </h4>
                        <p className="text-xs text-zinc-400">{CREW_MEMBERS[2].role}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/[0.08] text-[9px] text-zinc-300">
                      <span className={`w-1.5 h-1.5 rounded-full ${CREW_MEMBERS[2].statusColor} `} />
                      <span>{CREW_MEMBERS[2].status}</span>
                    </div>
                  </div>

                  <div className="space-y-1 mb-4">
                    <span className="text-[9px] tracking-wide text-zinc-500 font-semibold block">Verified Skills</span>
                    <div className="flex flex-wrap gap-1">
                      {CREW_MEMBERS[2].skills.map((skill) => (
                        <span
                          key={skill}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-abram-black/40 text-white/80 border border-white/[0.08] flex items-center gap-1"
                        >
                          <Check className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                          <span>{skill}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/[0.08] pt-3 space-y-3">
                  <div>
                    <div className="flex justify-between items-center text-[10px] mb-1.5">
                      <span className="text-zinc-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#8ECAFF]" />
                        Chemistry Score
                      </span>
                      <span className="font-semibold text-white">{CREW_MEMBERS[2].chemistry}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-900 border border-white/[0.08] overflow-hidden">
                      <motion.div
                        style={{ width: `${CREW_MEMBERS[2].chemistry}%` }}
                        className="h-full bg-[#8ECAFF] rounded-full"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-1 text-xs">
                    <span className="font-semibold text-white">{CREW_MEMBERS[2].dayRate}</span>
                    <span className="text-zinc-500 text-[10px] font-mono">{CREW_MEMBERS[2].hourlyRate}</span>
                  </div>
                </div>
              </motion.div>

            </div>
          </div>

          {/* Right Side: Copy */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/3 text-[#f5f5f3] text-xs font-semibold tracking-wider uppercase">
              Dynamic Crewing
            </div>

            {/* Section Header (h2: text-base to text-lg, font-medium, leading-snug) */}
            <h2
              className="text-base md:text-lg font-medium tracking-tight text-white/90 leading-snug uppercase font-display"
            >
              Verified roster matching and holds.
            </h2>

            {/* Body Paragraph: text-sm font-normal text-white/80 */}
            <p className="text-sm font-normal text-white/80 leading-relaxed">
              Coordinate your team with precision. ABRAM’s matchmaking engine analyzes your project requirements against real-time availability, travel feasibility, and synonym-mapped skills to find and rank candidates. Send holds instantly—external crew receive a secure link to review project details and RSVP in a single click, with no sign-up or login required.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-1 rounded bg-white/5 text-[#8ECAFF] border border-white/10">
                  <Star className="w-4 h-4" />
                </div>
                <div>
                  {/* Icon Bullet Subhead: text-sm font-semibold */}
                  <h4 className="text-sm font-semibold text-white tracking-wide font-display">
                    Synonym-Aware Matchmaking
                  </h4>
                  {/* Body Paragraph: text-sm font-normal text-white/80 */}
                  <p className="text-sm font-normal text-white/80 leading-relaxed">
                    Instantly links candidate skills, automatically equating related proficiencies (like "Sensa Cut" and "Sensa Editor").
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 p-1 rounded bg-white/5 text-[#8ECAFF] border border-white/10">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white tracking-wide font-display">
                    Friction-Free RSVPs
                  </h4>
                  <p className="text-sm font-normal text-white/80 leading-relaxed">
                    External crew review terms and accept calendar holds directly with zero signup or login friction.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
