'use client';

import { motion } from "framer-motion";

export default function FinalCTASection() {
  return (
    <section className="relative w-full py-24 md:py-32 overflow-hidden flex flex-col items-center justify-center bg-abram-black">
      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[250px] md:w-[900px] md:h-[400px] bg-gradient-to-r from-[#8ECAFF]/8 via-[#3B82F6]/5 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[40%] w-[500px] h-[300px] bg-gradient-to-b from-purple-500/4 to-transparent rounded-full blur-[100px] pointer-events-none" />

      {/* Wide Glass Banner — matches pillar card styling */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-5xl mx-auto px-6"
      >
        <div className="group relative rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md px-8 py-16 md:px-16 md:py-20 text-center flex flex-col items-center overflow-hidden hover:border-white/10 hover:bg-zinc-900/30 transition-all duration-300 shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
          {/* Viewfinder brackets — matching pillar cards */}
          <div className="absolute top-0 left-0 w-[6px] h-[6px] border-l border-t border-white/5 group-hover:border-white/15 transition-colors duration-300" />
          <div className="absolute top-0 right-0 w-[6px] h-[6px] border-r border-t border-white/5 group-hover:border-white/15 transition-colors duration-300" />
          <div className="absolute bottom-0 left-0 w-[6px] h-[6px] border-l border-b border-white/5 group-hover:border-white/15 transition-colors duration-300" />
          <div className="absolute bottom-0 right-0 w-[6px] h-[6px] border-r border-b border-white/5 group-hover:border-white/15 transition-colors duration-300" />

          {/* Ambient neutral glow */}
          <div className="absolute -top-20 -left-20 w-44 h-44 rounded-full bg-white/[0.015] filter blur-3xl pointer-events-none transition-opacity group-hover:opacity-100" />

          {/* Headline */}
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight">
            One Platform, End-to-End
          </h2>

          {/* Subtitle — constrained to never exceed headline width */}
          <p className="mt-4 text-sm md:text-base text-zinc-400 leading-relaxed">
            Everything you need to plan, crew, and deliver.
          </p>

          {/* Single CTA */}
          <div className="mt-10">
            <a
              href="https://app.abram.network"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white px-10 py-3.5 text-sm font-semibold hover:bg-white/10 hover:border-white/20 transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-[#8ECAFF]/50 cursor-pointer shadow-[0_0_30px_rgba(142,202,255,0.06)]"
            >
              Get Started
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
