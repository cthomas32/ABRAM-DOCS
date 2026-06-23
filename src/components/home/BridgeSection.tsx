"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

export default function BridgeSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      className="relative w-full min-h-[40vh] md:min-h-[50vh] flex items-center justify-center overflow-hidden py-24 px-6"
    >
      {/* Subtle radial glow behind the text, mathematically eased */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[600px] md:h-[600px] rounded-full blur-[60px] pointer-events-none z-0"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.012) 30%, rgba(255, 255, 255, 0.004) 60%, transparent 100%)' }}
        aria-hidden="true"
      />

      <div className="max-w-[1380px] mx-auto w-full text-center relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl md:text-5xl font-medium tracking-tight font-sans leading-tight md:leading-normal"
        >
          <span className="text-white block">
            Production intelligence, for the people
          </span>
          <span className="text-zinc-400 block mt-2">
            who can't be replaced.
          </span>
        </motion.h2>
      </div>
    </section>
  );
}
