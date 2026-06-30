"use client";
import React, { useRef } from "react";
import { motion, useScroll, useTransform, Variants } from "framer-motion";

/* ─────────────────────────────────────────────
   SVG Data Visualizations (inline sub-components)
   ───────────────────────────────────────────── */

/** Card 1 — Production Managers: Animated Gantt / Timeline bars */
function GanttVisualization() {
  const bars = [
    { width: 82, y: 16, delay: "0s" },
    { width: 56, y: 36, delay: "0.3s" },
    { width: 68, y: 56, delay: "0.6s" },
    { width: 44, y: 76, delay: "0.9s" },
    { width: 72, y: 96, delay: "1.2s" },
  ];

  return (
    <svg
      viewBox="0 0 160 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-hidden="true"
    >
      <style>{`
        .gantt-bar {
          transform-origin: left center;
        }
        .gantt-shimmer {
          opacity: 0.25;
        }
        .gantt-active {
          opacity: 0.75;
        }
        @media (min-width: 768px) {
          @keyframes gantt-slide {
            0% { transform: scaleX(0); opacity: 0; }
            15% { transform: scaleX(1); opacity: 1; }
            100% { transform: scaleX(1); opacity: 1; }
          }
          @keyframes gantt-shimmer {
            0%, 100% { opacity: 0.25; }
            50% { opacity: 0.45; }
          }
          .gantt-bar {
            animation: gantt-slide 3s ease-out forwards;
          }
          .gantt-shimmer {
            animation: gantt-shimmer 4s ease-in-out infinite;
          }
        }
      `}</style>

      {/* Faint vertical grid lines */}
      {[32, 64, 96, 128].map((x) => (
        <line
          key={x}
          x1={x}
          y1="6"
          x2={x}
          y2="118"
          stroke="white"
          strokeOpacity="0.08"
          strokeDasharray="2 4"
        />
      ))}

      {/* Timeline bars */}
      {bars.map((bar, i) => (
        <g key={i}>
          {/* Bar track */}
          <rect
            x="12"
            y={bar.y}
            width="136"
            height="12"
            rx="3"
            fill="white"
            fillOpacity="0.08"
          />
          {/* Animated bar fill */}
          <rect
            x="12"
            y={bar.y}
            width={bar.width}
            height="12"
            rx="3"
            fill="white"
            fillOpacity={i === 2 ? "0.4" : "0.2"}
            className={i === 2 ? "gantt-bar gantt-active" : "gantt-bar gantt-shimmer"}
            style={{ animationDelay: bar.delay }}
          />
          {/* Left label dot */}
          <circle
            cx="6"
            cy={bar.y + 6}
            r="2"
            fill="white"
            fillOpacity="0.3"
          />
        </g>
      ))}

      {/* "Now" marker line */}
      <line
        x1="80"
        y1="6"
        x2="80"
        y2="118"
        stroke="white"
        strokeOpacity="0.3"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      <circle cx="80" cy="6" r="2.5" fill="white" fillOpacity="0.45" />
    </svg>
  );
}

/** Card 2 — Creative Directors: Expanding mind-map / tree */
function MindMapVisualization() {
  const branches = [
    { cx: 42, cy: 30 },
    { cx: 118, cy: 30 },
    { cx: 36, cy: 98 },
    { cx: 124, cy: 98 },
  ];

  return (
    <svg
      viewBox="0 0 160 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-hidden="true"
    >
      <style>{`
        .mm-center {
          opacity: 0.75;
        }
        .mm-node {
          opacity: 0.6;
        }
        .mm-line {
          stroke-dasharray: 80;
          stroke-dashoffset: 0;
          opacity: 0.35;
        }
        .mm-child {
          opacity: 1;
        }
        @media (min-width: 768px) {
          @keyframes child-fade {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
          @keyframes line-draw {
            0% { stroke-dashoffset: 80; opacity: 0; }
            30% { opacity: 0.3; }
            100% { stroke-dashoffset: 0; opacity: 0.35; }
          }
          .mm-line {
            stroke-dashoffset: 80;
            animation: line-draw 2s ease-out forwards;
          }
          .mm-child {
            opacity: 0;
            animation: child-fade 1.5s ease-out forwards;
          }
        }
      `}</style>

      {/* Connection lines from center to branches */}
      {branches.map((b, i) => (
        <line
          key={`line-${i}`}
          x1="80"
          y1="64"
          x2={b.cx}
          y2={b.cy}
          stroke="white"
          strokeOpacity="0.3"
          strokeWidth="1"
          className="mm-line"
          style={{ animationDelay: `${i * 0.25}s` }}
        />
      ))}

      {/* Secondary connection lines (sub-branches) */}
      {branches.map((b, i) => {
        const offX = b.cx < 80 ? -16 : 16;
        const offY = b.cy < 64 ? -12 : 12;
        return (
          <line
            key={`sub-${i}`}
            x1={b.cx}
            y1={b.cy}
            x2={b.cx + offX}
            y2={b.cy + offY}
            stroke="white"
            strokeOpacity="0.18"
            strokeWidth="0.75"
            className="mm-line"
            style={{ animationDelay: `${1.2 + i * 0.2}s` }}
          />
        );
      })}

      {/* Sub-branch terminal nodes */}
      {branches.map((b, i) => {
        const offX = b.cx < 80 ? -16 : 16;
        const offY = b.cy < 64 ? -12 : 12;
        return (
          <circle
            key={`sub-node-${i}`}
            cx={b.cx + offX}
            cy={b.cy + offY}
            r="2.5"
            fill="white"
            fillOpacity="0.3"
            className="mm-child"
            style={{ animationDelay: `${1.8 + i * 0.2}s` }}
          />
        );
      })}

      {/* Center node glow ring */}
      <circle cx="80" cy="64" r="14" fill="white" fillOpacity="0.08" />

      {/* Center node */}
      <circle
        cx="80"
        cy="64"
        r="8"
        fill="white"
        fillOpacity="0.5"
        className="mm-center"
      />
      <circle cx="80" cy="64" r="3" fill="white" fillOpacity="0.75" />

      {/* Branch nodes */}
      {branches.map((b, i) => (
        <g key={`branch-${i}`} className="mm-child" style={{ animationDelay: `${0.5 + i * 0.25}s` }}>
          <circle
            cx={b.cx}
            cy={b.cy}
            r="5"
            fill="white"
            fillOpacity="0.45"
            className="mm-node"
            style={{ animationDelay: `${i * 0.6}s` }}
          />
          <circle cx={b.cx} cy={b.cy} r="2" fill="white" fillOpacity="0.65" />
        </g>
      ))}
    </svg>
  );
}

/** Card 3 — Producers: Animated budget ticker with progress ring */
function BudgetTickerVisualization() {
  const circumference = 2 * Math.PI * 24; // ~150.8
  const fillPercent = 0.72;
  const dashOffset = circumference * (1 - fillPercent);

  return (
    <svg
      viewBox="0 0 160 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-hidden="true"
    >
      <style>{`
        .ring-progress {
          transform: rotate(-90deg);
          transform-origin: 56px 64px;
          stroke-dashoffset: ${dashOffset};
          opacity: 0.65;
        }
        .ticker-item {
          opacity: 1;
        }
        .status-dot {
          opacity: 0.6;
        }
        @media (min-width: 768px) {
          @keyframes ticker-fade {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
          @keyframes ring-fill {
            0% { stroke-dashoffset: ${circumference}; opacity: 0.25; }
            60% { opacity: 0.65; }
            100% { stroke-dashoffset: ${dashOffset}; opacity: 0.65; }
          }
          .ring-progress {
            animation: ring-fill 2.5s ease-out forwards;
          }
          .ticker-item {
            opacity: 0;
            animation: ticker-fade 0.8s ease-out forwards;
          }
        }
      `}</style>

      {/* Progress ring — background track */}
      <circle
        cx="56"
        cy="64"
        r="24"
        stroke="white"
        strokeOpacity="0.12"
        strokeWidth="3"
        fill="none"
      />

      {/* Progress ring — filled arc */}
      <circle
        cx="56"
        cy="64"
        r="24"
        stroke="white"
        strokeOpacity="0.65"
        strokeWidth="3"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={circumference}
        strokeLinecap="round"
        className="ring-progress"
      />

      {/* Center percentage text */}
      <text
        x="56"
        y="62"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fillOpacity="0.85"
        fontSize="11"
        fontFamily="system-ui, sans-serif"
        fontWeight="500"
      >
        72%
      </text>
      <text
        x="56"
        y="74"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fillOpacity="0.45"
        fontSize="6"
        fontFamily="system-ui, sans-serif"
        letterSpacing="0.5"
      >
        UTILIZED
      </text>

      {/* Right side — ticker values */}
      <g className="ticker-item" style={{ animationDelay: "0.5s" }}>
        <text
          x="100"
          y="28"
          fill="white"
          fillOpacity="0.45"
          fontSize="6"
          fontFamily="system-ui, sans-serif"
          letterSpacing="1"
        >
          BUDGET
        </text>
        <text
          x="100"
          y="40"
          fill="white"
          fillOpacity="0.85"
          fontSize="12"
          fontFamily="system-ui, sans-serif"
          fontWeight="400"
        >
          $48,200
        </text>
      </g>

      <g className="ticker-item" style={{ animationDelay: "0.8s" }}>
        <text
          x="100"
          y="60"
          fill="white"
          fillOpacity="0.45"
          fontSize="6"
          fontFamily="system-ui, sans-serif"
          letterSpacing="1"
        >
          COMMITTED
        </text>
        <text
          x="100"
          y="72"
          fill="white"
          fillOpacity="0.8"
          fontSize="12"
          fontFamily="system-ui, sans-serif"
          fontWeight="400"
        >
          $34,700
        </text>
      </g>

      {/* Status indicators */}
      <g className="ticker-item" style={{ animationDelay: "1.2s" }}>
        <circle cx="102" cy="92" r="3" fill="white" fillOpacity="0.5" className="status-dot" />
        <text
          x="109"
          y="94"
          fill="white"
          fillOpacity="0.55"
          fontSize="6.5"
          fontFamily="system-ui, sans-serif"
        >
          3 POs Active
        </text>
      </g>

      <g className="ticker-item" style={{ animationDelay: "1.5s" }}>
        <circle cx="102" cy="106" r="3" fill="white" fillOpacity="0.35" className="status-dot" style={{ animationDelay: "0.5s" }} />
        <text
          x="109"
          y="108"
          fill="white"
          fillOpacity="0.45"
          fontSize="6.5"
          fontFamily="system-ui, sans-serif"
        >
          2 Pending
        </text>
      </g>

      {/* Subtle horizontal separators */}
      <line x1="100" y1="50" x2="148" y2="50" stroke="white" strokeOpacity="0.12" />
      <line x1="100" y1="82" x2="148" y2="82" stroke="white" strokeOpacity="0.12" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Main Section
   ───────────────────────────────────────────── */

const pillars = [
  {
    label: "For Production Managers",
    title: "Plan with precision.",
    description:
      "Allocate crews, manage capacity, and keep every shoot on schedule — all from one timeline.",
    Visualization: GanttVisualization,
  },
  {
    label: "For Creative Directors",
    title: "Scope with clarity.",
    description:
      "Turn any brief into structured deliverables, roles, and milestones — powered by AI that understands production.",
    Visualization: MindMapVisualization,
  },
  {
    label: "For Producers",
    title: "Control with confidence.",
    description:
      "Track budgets in real-time, lock purchase orders, and pay crews directly — no spreadsheets, no surprises.",
    Visualization: BudgetTickerVisualization,
  },
];

export default function PillarsSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const yValue = useTransform(scrollYProgress, [0, 1], [30, -30]);

  const cardVariants: Variants = {
    initial: { opacity: 0 },
    animate: (i: number) => ({
      opacity: 1,
      transition: { duration: 1.0, ease: "easeOut", delay: i * 0.12 },
    }),
  };

  return (
    <section
      ref={containerRef}
      className="relative w-full py-24 md:py-36 bg-transparent overflow-hidden selection:bg-zinc-800 selection:text-white"
    >
      {/* Background glow structures with parallax scroll-drift - Seamless Navy Glow */}
      <motion.div
        style={{ y: yValue }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[250px] md:w-[850px] md:h-[450px] bg-blue-950/25 rounded-full blur-[140px] pointer-events-none z-0"
      />

      {/* Subtle tech grid mesh */}
      <div className="absolute inset-0 tech-grid-overlay opacity-30 pointer-events-none z-0" />

      <div className="max-w-[1380px] mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { 
              opacity: 1, 
              y: 0, 
              transition: { duration: 0.8, ease: "easeOut" } 
            }
          }}
          className="text-center max-w-3xl mx-auto px-4 mb-20"
        >
          <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-white mb-4 font-sans">
            Every production runs on people.
          </h2>
          <p className="text-base md:text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed font-sans">
            To the directors, producers, and creators who turn dreams into reality. This is built for you.
          </p>
        </motion.div>

        {/* 3-Column Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map((pillar, i) => (
            <motion.div
              key={pillar.label}
              custom={i}
              variants={cardVariants}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: "-100px" }}
              className="group rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md p-6 hover:border-white/10 hover:bg-zinc-900/30 transition-all duration-300 flex flex-col overflow-hidden relative min-h-[320px] md:min-h-[420px] shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
            >
              {/* Viewfinder brackets */}
              <div className="absolute top-0 left-0 w-[6px] h-[6px] border-l border-t border-white/5 group-hover:border-white/15 transition-colors duration-300" />
              <div className="absolute top-0 right-0 w-[6px] h-[6px] border-r border-t border-white/5 group-hover:border-white/15 transition-colors duration-300" />
              <div className="absolute bottom-0 left-0 w-[6px] h-[6px] border-l border-b border-white/5 group-hover:border-white/15 transition-colors duration-300" />
              <div className="absolute bottom-0 right-0 w-[6px] h-[6px] border-r border-b border-white/5 group-hover:border-white/15 transition-colors duration-300" />

              {/* Ambient neutral glow */}
              <div className="absolute -top-20 -left-20 w-44 h-44 rounded-full bg-white/[0.015] filter blur-3xl pointer-events-none transition-opacity group-hover:opacity-100" />

              {/* Animated data visualization */}
              <div className="w-full h-52 flex items-center justify-center relative bg-black/20 rounded-xl border border-white/5 overflow-hidden mb-6">
                <pillar.Visualization />
              </div>

              {/* Copy */}
              <div className="space-y-2 flex-1 flex flex-col">
                <span className="text-[10px] font-medium text-zinc-500/85 tracking-widest block uppercase">
                  {pillar.label}
                </span>
                <h3 className="text-base font-medium text-zinc-100 tracking-tight">
                  {pillar.title}
                </h3>
                <p className="text-sm font-light text-zinc-400 leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
