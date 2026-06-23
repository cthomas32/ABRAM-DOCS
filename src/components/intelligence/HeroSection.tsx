"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowDown } from "lucide-react";
import { revealVariants, staggerContainer } from "@/lib/motion";

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-[50vh] md:min-h-[60vh] flex flex-col justify-center py-16 md:py-24 px-6 bg-transparent overflow-visible">
      {/* Absolute Ambient Background Glow Layers (Not Clipped) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] md:w-[800px] h-[350px] sm:h-[600px] bg-gradient-to-br from-white/[0.02] via-zinc-800/[0.08] to-transparent rounded-full blur-[130px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-[250px] md:w-[450px] h-[250px] md:h-[450px] bg-[#8ECAFF]/[0.02] rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto w-full relative z-10">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto w-full"
        >
          {/* Category Label (Overline) */}
          <motion.span
            variants={revealVariants}
            custom={0.0}
            className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-4 block"
          >
            Intelligence & Optimization
          </motion.span>

          {/* High-Impact Display Header */}
          <motion.h1
            variants={revealVariants}
            custom={0.1}
            className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white leading-[1.12] mb-6 font-sans select-text"
          >
            Roster Intelligence.
            <span className="block mt-2 text-zinc-500">
              Measure the yield.
            </span>
          </motion.h1>

          {/* Subtitle / Body */}
          <motion.p
            variants={revealVariants}
            custom={0.2}
            className="text-base sm:text-lg md:text-xl font-normal leading-7 text-zinc-400 max-w-2xl mx-auto mb-10 font-sans select-text"
          >
            Quantify the operational efficiency of automated crew scheduling, contract enforcement, and client intake brief matching. Calculate your studio's potential return on investment.
          </motion.p>

          {/* Scroll Hint / Action button */}
          <motion.div
            variants={revealVariants}
            custom={0.3}
            className="flex flex-col items-center gap-2"
          >
            <a
              href="#roi-calculator"
              className="btn-glass px-6 py-2.5 text-xs font-semibold rounded-full flex items-center justify-center gap-2 cursor-pointer select-none transition-all duration-200 hover:bg-white/[0.08] min-h-[44px] md:min-h-0"
            >
              <span>Launch Calculator</span>
              <ArrowDown className="w-3.5 h-3.5 text-zinc-400 animate-bounce" />
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
