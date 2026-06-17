"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import NeuralNetworkOrb from "./NeuralNetworkOrb";

// Standard cinematic easing from DESIGN.md / motion.ts
const easeCinematic = [0.16, 1, 0.3, 1] as [number, number, number, number];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, filter: "blur(6px)" },
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



export default function HeroSection() {
  return (
    <section className="relative w-full py-20 md:py-28 lg:py-36 overflow-hidden bg-transparent font-sans">
      {/* Ambient Cream & Navy Background Glows */}
      <div className="absolute inset-0 pointer-events-none select-none z-0">
        <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] rounded-full bg-[#FAFAF9]/[0.015] blur-[120px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-[10%] right-[20%] w-[600px] h-[600px] rounded-full bg-[#0B2545]/[0.06] blur-[150px] translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Typography & CTA Column */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-5 flex flex-col space-y-6 text-left"
          >
            {/* Category Label (Overline) */}
            <motion.span
              variants={itemVariants}
              className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500"
            >
              INTRODUCING WORKSPACE MEMORY
            </motion.span>

            {/* Display Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white leading-[1.12]"
            >
              A memory that lasts for years, not minutes.
            </motion.h1>

            {/* Description Body Text */}
            <motion.p
              variants={itemVariants}
              className="text-zinc-400 leading-7 text-base max-w-lg"
            >
              ABRAM's Workspace Memory serves as the secure, persistent cognitive layer for creative productions. It retains crew preferences, rate cards, and Union parameters across campaigns, transforming ad-hoc operations into organized, compound knowledge.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center gap-3 pt-2"
            >
              <a
                href="https://app.abram.network"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                Get Started
              </a>
              <a
                href="#sandbox-section"
                className="btn-glass group cursor-pointer"
              >
                Learn More
                <ArrowDown className="ml-1 h-3.5 w-3.5 opacity-70 group-hover:opacity-100 group-hover:translate-y-0.5 transition-all duration-200" />
              </a>
            </motion.div>
          </motion.div>

          {/* Floating 3D-Effect Animation Column */}
          <div className="lg:col-span-7 flex justify-center items-center w-full">
            <div className="relative w-full aspect-[4/3] max-w-lg overflow-hidden select-none flex items-center justify-center">
              
              {/* Glowing Neural Network 3D Orb */}
              <div className="absolute inset-0 z-10 w-full h-full flex items-center justify-center">
                <NeuralNetworkOrb />
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
