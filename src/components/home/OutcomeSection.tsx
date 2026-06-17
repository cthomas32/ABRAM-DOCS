"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { Sparkles } from "lucide-react";
import { revealVariants } from "@/lib/motion";
import AnimatedChatbot, { ChatMessage } from "./AnimatedChatbot";

const TALENT_SEARCH_SEQUENCE: ChatMessage[] = [
  {
    id: "msg1",
    type: "user",
    content: "Find me a Gaffer for the Horizon Campaign shooting June 24-25. Must be local to LA and under $1000/day.",
    delayMs: 1000,
  },
  {
    id: "msg2",
    type: "tool_execution",
    content: "",
    toolName: "search_talent_network",
    delayMs: 2500,
  },
  {
    id: "msg3",
    type: "tool_result",
    content: (
      <div className="flex flex-col space-y-2 font-sans">
        <span className="text-emerald-400 text-sm font-medium border-b border-emerald-500/20 pb-2 mb-2">3 Matches Found</span>
        <div className="flex items-center justify-between text-sm text-[#e4e4e7]">
          <div className="flex flex-col">
            <span className="font-semibold">Marcus T.</span>
            <span className="text-[#a1a1aa] text-xs">Local: Los Angeles • Rate: $950/day</span>
          </div>
          <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-md text-[10px] font-bold tracking-wider">96% MATCH</span>
        </div>
        <div className="flex items-center justify-between text-sm text-[#e4e4e7] opacity-60">
          <div className="flex flex-col">
            <span className="font-semibold">Sarah K.</span>
            <span className="text-[#a1a1aa] text-xs">Local: Los Angeles • Rate: $1000/day</span>
          </div>
          <span className="bg-emerald-500/10 text-emerald-500/70 px-2 py-1 rounded-md text-[10px] font-bold tracking-wider">88% MATCH</span>
        </div>
      </div>
    ),
    delayMs: 4000,
  },
  {
    id: "msg4",
    type: "assistant",
    content: "I found 3 matching Gaffers. Marcus T. is your strongest match at 96% based on his previous work on similar campaigns. His rate is $950/day and his calendar is clear for June 24-25. Should I lock the hold and send the PO?",
    delayMs: 5500,
  }
];

export default function OutcomeSection() {
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

  return (
    <section ref={sectionRef} className="relative w-full py-32 md:py-48 bg-transparent overflow-hidden flex flex-col items-center justify-center">
      
      {/* Background Ambient Blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#8ECAFF]/[0.03] rounded-full blur-[120px] pointer-events-none" />

      {/* Header Copy */}
      <div className="text-center z-10 max-w-3xl mx-auto px-6 mb-20">
        <motion.div
          variants={revealVariants}
          initial="hidden"
          animate={isSectionInView ? "visible" : "hidden"}
          custom={0}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] mb-6"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#8ECAFF]" />
          <span className="text-xs font-medium tracking-wide text-zinc-300 uppercase">Platform Co-pilot</span>
        </motion.div>

        <motion.h2 
          variants={revealVariants}
          initial="hidden"
          animate={isSectionInView ? "visible" : "hidden"}
          custom={1}
          className="text-3xl md:text-5xl font-medium tracking-tight text-white mb-6"
        >
          An assistant that actually<br />understands production.
        </motion.h2>

        <motion.p 
          variants={revealVariants}
          initial="hidden"
          animate={isSectionInView ? "visible" : "hidden"}
          custom={2}
          className="text-base md:text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed"
        >
          Stop hunting through spreadsheets. The ABRAM Co-pilot actively monitors your roster, detects calendar collisions, and suggests verified replacements before you even know there's a problem.
        </motion.p>
      </div>

      {/* Reusable Animated Chatbot Demo Box */}
      <motion.div
        style={{ rotateX, scale, y, opacity }}
        className="w-full max-w-3xl px-4 z-10 perspective-[2000px] mx-auto flex justify-center"
      >
        <AnimatedChatbot 
          sequence={TALENT_SEARCH_SEQUENCE} 
          className="w-full sm:w-[450px] h-[650px]" 
        />
      </motion.div>

    </section>
  );
}
