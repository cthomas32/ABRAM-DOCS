"use client";

import Image from "next/image";
import { motion, Variants } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { revealVariants, staggerContainer } from "@/lib/motion";

const titleVariants: Variants = {
  hidden: { opacity: 0, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      duration: 1.0,
      ease: "easeOut" as const,
      delay: 0.15,
    },
  },
};

const ctaVariants: Variants = {
  hidden: { opacity: 0, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      duration: 1.0,
      ease: "easeOut" as const,
      delay: 0.27,
    },
  },
};

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center py-24 px-4 sm:px-6 lg:px-8 bg-[#0A0A0A] select-none overflow-hidden">
      {/* Top Center Logo (Visible on Hero before Scroll) */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none select-none">
        <Image
          src="/abram-logo-lockup-cream.png"
          alt="ABRAM"
          width={100}
          height={20}
          priority
          className="h-5 w-auto opacity-100"
        />
      </div>

      {/* Background Graphic System */}
      <div className="absolute inset-0 w-full h-full pointer-events-none select-none z-0">
        {/* Sky Sunset/Dusk Gradient Behind */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#181320] via-[#0E0C12] to-[#0A0A0A]" />
        
        {/* Mountains Backdrop */}
        <div className="absolute inset-0 w-full h-full opacity-80 blur-[2.5px] scale-105">
          <Image
            src="/images/cinematic-sunset-mountains.png"
            alt="Cinematic Sunset Mountains"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center select-none"
          />
        </div>

        {/* Smooth gradient overlays to blend edges and maintain typography contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-[#0A0A0A]/10" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/30 via-transparent to-[#0A0A0A]/90" />
        
        {/* Subtle radial vignette centering readability on the text */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_15%,#0A0A0A_95%)]" />

        {/* Film Grain Texture */}
        <div className="grain-overlay" />
      </div>

      {/* Grid container to align layout with the main website content grid */}
      <div className="w-full max-w-5xl mx-auto relative z-10">
        {/* Centered content container */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="relative flex flex-col items-center justify-center text-center max-w-3xl mx-auto w-full"
        >
          {/* Headline */}
          <motion.h1
            variants={titleVariants}
            className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white leading-[1.12] mb-10 select-text max-w-2xl"
          >
            A new standard
            <span className="block mt-[5px]">for creative production</span>
          </motion.h1>

          {/* Single Minimalist Capsule CTA */}
          <motion.div
            variants={ctaVariants}
            className="flex justify-center w-full"
          >
            <a
              href="https://app.abram.network"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.03] backdrop-blur-[8px] hover:border-white/30 hover:bg-white hover:text-black px-7 py-3 text-xs sm:text-sm font-medium transition-all duration-355 outline-none focus-visible:ring-2 focus-visible:ring-white/50 cursor-pointer text-white shadow-[0_0_30px_rgba(255,255,255,0.02)]"
            >
              Start Building
              <ArrowUpRight className="h-4 w-4 opacity-75 group-hover:opacity-100 transition-opacity" />
            </a>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll to Explore Indicator */}
      <button
        onClick={() => {
          window.scrollTo({
            top: window.innerHeight,
            behavior: "smooth",
          });
        }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center group cursor-pointer focus:outline-none"
      >
        {/* Cream Track Line (1px thin) */}
        <div className="w-[1px] h-10 bg-[#FAFAF9]/15 relative rounded-full">
          {/* Light-Blue Glowing Laser Segment (super thin, non-clipping glow) */}
          <div className="absolute top-0 left-0 w-[1px] h-3 bg-gradient-to-b from-transparent via-[#8ECAFF] to-transparent shadow-[0_0_8px_rgba(142,202,255,0.8),0_0_2px_rgba(59,130,246,0.5)] animate-laser-travel" />
        </div>
      </button>
    </section>
  );
}
