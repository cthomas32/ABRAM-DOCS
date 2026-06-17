"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, animate } from "framer-motion";

interface AnimCounterProps {
  to: number;
  prefix?: string;
  suffix?: string;
}

function AnimCounter({ to, prefix = "", suffix = "" }: AnimCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  // Start from 20 for 0 to show countdown, or 0 for upward counting
  const startValue = to === 0 ? 20 : 0;
  const [count, setCount] = useState(startValue);

  useEffect(() => {
    if (isInView) {
      const controls = animate(startValue, to, {
        duration: 1.2,
        ease: "easeOut",
        onUpdate(latest) {
          setCount(Math.round(latest));
        },
      });
      return () => controls.stop();
    }
  }, [isInView, to, startValue]);

  return (
    <span ref={ref} className="font-medium tracking-wide text-white">
      {prefix}
      {count}
      {suffix}
    </span>
  );
}

interface StatItem {
  to?: number;
  prefix?: string;
  suffix?: string;
  value?: string;
  label: string;
  description: string;
}

const statsData: StatItem[] = [
  { 
    to: 2, 
    prefix: "< ", 
    suffix: " min", 
    label: "Crew Response Time", 
    description: "Instantly mobilize teams with automated notifications and calendar routing." 
  },
  { 
    to: 5, 
    suffix: "×", 
    label: "Delivery Acceleration", 
    description: "Accelerate deliverable timelines via parallel workspace nodes and AI assists." 
  },
  { 
    value: "Custom", 
    label: "Campaign Scoping", 
    description: "Scale project structures dynamically from small quick shoots to multi-phase campaigns." 
  },
  { 
    to: 0, 
    suffix: "%", 
    label: "Conflict Rate", 
    description: "Resolve double-booking issues entirely through automated validation checks before scheduling." 
  }
];

export default function StatsSection() {
  return (
    <section className="relative w-full border-t border-white/[0.08] bg-abram-black py-24 sm:py-32 px-4 sm:px-6 lg:px-8 select-none overflow-hidden">
      {/* Ambient Glows - Subtle purple stats glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-purple-500/[0.02] rounded-full filter blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header Section */}
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-white/30 mb-3 inline-block">
            System Performance
          </span>
          {/* Section Header (h2: text-base to text-lg, font-medium, leading-snug) */}
          <h2 
            className="text-base md:text-lg font-medium text-white tracking-tight leading-tight uppercase font-display"
          >
            Engineered for High-Velocity Brands
          </h2>
        </div>

        {/* Stats Grid - aligned with Bento gap-4 specifications */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {statsData.map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center sm:items-start text-center sm:text-left border border-white/[0.04] bg-abram-black/20 p-6 rounded-xl hover:bg-abram-cream/[0.06] transition-all duration-200">
              {/* Stat Value Display (Page Title compact scale: text-xl to text-2xl font-medium) */}
              <div className="text-xl md:text-2xl font-medium tracking-wide text-white mb-3">
                {stat.to !== undefined ? (
                  <AnimCounter to={stat.to} prefix={stat.prefix} suffix={stat.suffix} />
                ) : (
                  <span 
                    className="font-medium tracking-wide text-white"
                  >
                    {stat.value}
                  </span>
                )}
              </div>

              {/* Form Label style: text-xs font-medium tracking-wider */}
              <h3 className="text-xs font-medium text-white/30 uppercase tracking-[0.2em] mb-2">
                {stat.label}
              </h3>
              {/* Body: text-sm font-normal text-white/80 */}
              <p className="text-sm font-normal text-white/80 leading-relaxed">
                {stat.description}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom Quote Block */}
        <div className="mt-24 sm:mt-32 border-t border-white/[0.08] pt-16 max-w-lg mx-auto text-center">
          {/* Body: text-sm leading-relaxed text-white/80 */}
          <blockquote className="text-sm md:text-base text-white/60 font-normal leading-relaxed select-text">
            &ldquo;Every campaign executed on ABRAM builds your private workspace memory, transforming raw project logs into structured operational intelligence.&rdquo;
          </blockquote>
          {/* Micro-Metadata: text-[11px] */}
          <cite className="block mt-6 text-[11px] font-semibold uppercase tracking-widest text-[#8ECAFF] not-italic">
            ABRAM Core Engine
          </cite>
        </div>

      </div>
    </section>
  );
}
