"use client";

import Image from "next/image";
import { motion, Variants } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useLenis } from "lenis/react";
import { revealVariants, staggerContainer } from "@/lib/motion";

const titleVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 1.0,
      ease: "easeOut" as const,
      delay: 0.15,
    },
  },
};

const ctaVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 1.0,
      ease: "easeOut" as const,
      delay: 0.27,
    },
  },
};

const exploreVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1.0,
      ease: "easeOut" as const,
      delay: 0.4,
    },
  },
};

export default function HeroSection() {
  const lenis = useLenis();
  return (
    <section className="relative min-h-screen min-h-[100dvh] flex flex-col justify-center py-24 px-4 sm:px-6 lg:px-8 bg-transparent select-none overflow-hidden">
      {/* Top Center Logo (Visible on Hero before Scroll) */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none select-none">
        <Image
          src="/abram-logo-lockup-cream.png"
          alt="ABRAM"
          width={115}
          height={23}
          priority
          className="h-[23px] w-auto opacity-100"
        />
      </div>

      {/* Background Graphic System */}
      <div className="absolute inset-0 w-full h-full pointer-events-none select-none z-0">
        {/* Sky Sunset/Dusk Gradient Behind */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#181320] via-[#0E0C12] to-black" />
        
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

        {/* Dynamic Flying Plane (Custom Sunset Blend) */}
        <motion.div
          initial={{ x: '-15vw', y: '0px', rotate: 0.5 }}
          animate={{
            x: '115vw',
            y: ['0px', '-8px', '-4px'],
            rotate: [0.5, 1.0, 0.5]
          }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: 'linear'
          }}
          className="absolute top-[15%] left-0 pointer-events-none select-none"
          style={{ 
            width: '51px', 
            opacity: 0.49,
            color: '#08080a' 
          }}
        >
          <svg viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M 58,14 L 42,3 C 41,2.5 40,2.5 39,3 L 38,4 C 38,4.5 39,5 40,5.5 L 49,14 Z" opacity="0.45" fill="currentColor"/>
            <path d="M 45,9 C 45,8.2 43.5,8 42,8.5 L 39,9.5 C 38.5,10 39,10.5 40.5,10.5 C 42,10.5 45,9.8 45,9 Z" opacity="0.45" fill="currentColor"/>
            <path d="M 95,17 C 92,15 82,14 74,14 L 24,14 L 10,2 C 9,1 8,1.2 7.5,1.8 C 7,2.4 7.2,3.2 8,4.5 L 16.5,18 L 12,18 L 4,15 C 3,14.6 2.2,15 2,15.6 C 1.8,16.2 2.2,17 3.5,17.5 L 15,20 L 10,23.5 C 9,24.2 9.2,25 10,25.4 C 10.8,25.8 12,25.2 13.5,24 L 21.5,20.5 L 42,20.5 L 26,36 C 25.5,36.5 25.8,37.2 26.5,37.5 C 27.2,37.8 28,37.2 29,35.5 L 52,20.5 L 75,20.5 C 85,20.5 92,19 95,17 Z" fill="currentColor"/>
            <path d="M 40,24.5 L 37,21.5 L 43,21.5 Z" fill="currentColor"/>
            <path d="M 45,26.5 C 45,25.5 43.5,24.5 41.5,25 L 34.5,27.5 C 33.5,28 33.5,29 34.5,29.5 C 35.5,30 37,29.5 39,29 L 43.5,27.5 C 44.5,27.2 45,26.8 45,26.5 Z" fill="currentColor"/>
          </svg>
          <div 
            className="absolute top-1/2 right-[90%] -translate-y-1/2 h-[1px] w-[160px] blur-[0.6px] pointer-events-none origin-right"
            style={{
              background: 'linear-gradient(to left, rgba(8, 8, 10, 0.35), rgba(8, 8, 10, 0.1) 40%, transparent)'
            }}
          />
        </motion.div>

        {/* Smooth gradient overlays to blend edges and maintain typography contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/90" />
        
        {/* Subtle radial vignette centering readability on the text */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_15%,#000000_95%)]" />

        {/* Film Grain Texture */}
        <div className="grain-overlay" />
      </div>

      {/* Grid container to align layout with the main website content grid */}
      <div className="w-full max-w-5xl mx-auto relative z-10">
        {/* Centered content container */}
        <div className="relative flex flex-col items-center justify-center text-center max-w-3xl mx-auto w-full">
          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white leading-[1.12] mb-6 select-text max-w-2xl">
            A new standard
            <span className="block mt-[5px]">for creative production</span>
          </h1>

          {/* Single Minimalist Capsule CTA */}
          <motion.div
            variants={ctaVariants}
            initial="hidden"
            animate="visible"
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
        </div>
      </div>

      {/* Scroll to Explore Indicator */}
      <motion.button
        variants={exploreVariants}
        initial="hidden"
        animate="visible"
        onClick={() => {
          if (lenis) {
            lenis.scrollTo(window.innerHeight);
          } else {
            window.scrollTo({
              top: window.innerHeight,
              behavior: "smooth",
            });
          }
        }}
        className="absolute bottom-20 sm:bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2.5 group cursor-pointer focus:outline-none px-6 py-2 min-w-[64px]"
      >
        <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-400 group-hover:text-white transition-colors duration-300 select-none">
          Explore
        </span>
        {/* Cream Track Line */}
        <div className="w-[1px] h-10 bg-white/20 relative rounded-full group-hover:bg-white/35 transition-colors duration-300">
          {/* Light-Blue Glowing Laser Segment (super thin, non-clipping glow) */}
          <div className="absolute top-0 left-0 w-[1px] h-3 bg-gradient-to-b from-transparent via-[#8ECAFF] to-transparent shadow-[0_0_8px_rgba(142,202,255,0.8),0_0_2px_rgba(59,130,246,0.5)] animate-laser-travel" />
        </div>
      </motion.button>
    </section>
  );
}
