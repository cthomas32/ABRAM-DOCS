"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import ScrollDrivenChatbot from "./ScrollDrivenChatbot";
import { artifactsDemoData } from "@/lib/artifactsDemoData";

export default function AICopilotTeaser() {
  const [activeIdx, setActiveIdx] = useState(0);
  const activeFeature = artifactsDemoData[activeIdx] || artifactsDemoData[0];

  return (
    <section className="relative w-full py-24 md:py-32 px-4 sm:px-6">
      {/* Subtle ambient radial glow behind section */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] md:w-[700px] md:h-[500px] rounded-full blur-[120px] pointer-events-none z-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, rgba(99, 102, 241, 0.04) 50%, transparent 100%)",
        }}
        aria-hidden="true"
      />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px", amount: 0.1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-2xl mx-auto mb-10 md:mb-14"
        >
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-3 inline-flex items-center gap-2 font-sans">
            <span className="text-zinc-600 font-sans">04</span>
            COPILOT
          </span>
          <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-white leading-tight font-sans">
            Ask for anything. Get call sheets, rosters, and budgets.
          </h2>
          <p className="mt-4 text-sm md:text-base text-zinc-400 leading-relaxed font-sans">
            ABRAM reads your scripts, checks crew availability, and drafts complete project plans—with full human approval before day one.
          </p>
        </motion.div>

        {/* Scenario Selector Pills */}
        <div className="flex justify-center mb-8 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-1">
          <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-zinc-950/40 backdrop-blur-md p-1 shrink-0">
            {artifactsDemoData.map((item, idx) => {
              const isActive = idx === activeIdx;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveIdx(idx)}
                  className={`relative inline-flex items-center gap-1.5 rounded-full px-4 py-2 sm:py-1.5 text-xs font-medium transition-colors duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/40 min-h-[44px] sm:min-h-0 sm:h-8 ${
                    isActive ? "text-white" : "text-zinc-500 hover:text-zinc-200"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="teaser-scenario-pill"
                      className="absolute inset-0 rounded-full bg-white/[0.08] border border-white/[0.15]"
                      transition={{ type: "spring", stiffness: 400, damping: 34 }}
                    />
                  )}
                  <span className="relative z-10 whitespace-nowrap">{item.sectionTitle}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chatbot & CTA Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left / Main Column: Chatbot using the original ScrollDrivenChatbot design */}
          <motion.div
            key={activeFeature.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7"
          >
            <ScrollDrivenChatbot
              activeFeature={activeFeature}
              onSequenceComplete={() => {}}
              className="w-full h-[460px] sm:h-[480px]"
            />
          </motion.div>

          {/* Right Column: Information & Deep Exploration Link */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px", amount: 0.1 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 flex flex-col justify-center space-y-6"
          >
            <div className="space-y-3">
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 font-sans">
                FEATURED WORKFLOW
              </span>
              <h3 className="text-xl md:text-2xl font-medium tracking-tight text-white font-sans">
                {activeFeature.sectionTitle}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-sans">
                {activeFeature.sectionDescription}
              </p>
            </div>

            <div className="border-t border-white/5 pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                  Every action stays in draft for your review. Nothing is booked or sent without sign-off.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                  Call sheets, rosters, and estimates sync across your workspace automatically.
                </p>
              </div>
            </div>

            {/* Primary Action Button to Interactive Sandbox */}
            <div className="pt-2">
              <Link
                href="/intelligence/brain#sandbox-section"
                className="btn-glass rounded-full px-6 py-3 text-xs font-semibold inline-flex items-center gap-2 group transition-all duration-200"
              >
                <span>Explore ABRAM Copilot</span>
                <ArrowUpRight className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
