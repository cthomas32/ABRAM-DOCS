"use client";

import React, { useEffect, useRef } from "react";
import { useScroll, useTransform, motion, MotionValue } from "framer-motion";
import { Brain, Search, Lock, Zap } from "lucide-react";

interface Node {
  pctX: number;
  pctY: number;
  name: string;
}

const NODES: Node[] = [
  { pctX: 18, pctY: 28, name: "Brief Parser" },
  { pctX: 45, pctY: 15, name: "Scope Engine" },
  { pctX: 75, pctY: 22, name: "Roster Matcher" },
  { pctX: 85, pctY: 55, name: "Calendar Sync" },
  { pctX: 62, pctY: 78, name: "Status Cascade" },
  { pctX: 30, pctY: 82, name: "Conflict Check" },
  { pctX: 12, pctY: 58, name: "Slack Link" },
  { pctX: 48, pctY: 48, name: "Milestone Lock" },
  { pctX: 23, pctY: 38, name: "Inventory Book" },
  { pctX: 68, pctY: 42, name: "Rate Priority" },
  { pctX: 52, pctY: 65, name: "Action Plan" },
  { pctX: 25, pctY: 56, name: "Workspace Memory" }
];

const CONNECTIONS: [number, number][] = [
  [0, 1], [0, 7], [0, 11],
  [1, 2], [1, 8], [1, 7],
  [2, 3], [2, 9], [2, 7],
  [3, 4], [3, 9], [3, 10],
  [4, 5], [4, 10],
  [5, 6], [5, 10],
  [6, 0], [6, 11],
  [7, 8], [7, 10],
  [8, 9], [8, 11],
  [9, 10],
  [10, 11]
];

interface NetworkCanvasProps {
  activeCountTransform: MotionValue<number>;
}

function NetworkCanvas({ activeCountTransform }: NetworkCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const draw = (width: number, height: number, time: number, currentActiveCount: number) => {
      ctx.clearRect(0, 0, width, height);

      // Compute drifting coordinates
      const points = NODES.map((node, i) => {
        const dx = Math.sin(time * 0.15 + i) * 4;
        const dy = Math.cos(time * 0.12 + i * 1.4) * 4;
        const x = (node.pctX / 100) * width + dx;
        const y = (node.pctY / 100) * height + dy;
        const isActive = i < currentActiveCount;
        return { x, y, name: node.name, isActive };
      });

      // Draw connections
      CONNECTIONS.forEach(([fromIdx, toIdx]) => {
        const p1 = points[fromIdx];
        const p2 = points[toIdx];
        if (!p1 || !p2) return;

        const bothActive = p1.isActive && p2.isActive;
        const eitherActive = p1.isActive || p2.isActive;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);

        let alpha = 0.02; // extremely faint for inactive
        if (bothActive) {
          alpha = 0.10 + Math.sin(time * 1.2 + fromIdx) * 0.04;
        } else if (eitherActive) {
          alpha = 0.04;
        }

        ctx.strokeStyle = `rgba(142, 202, 255, ${alpha * 1.5})`;
        ctx.lineWidth = bothActive ? 1.2 : 0.8;
        ctx.stroke();

        // Animated signal dot traversing active connection line (sky blue)
        if (bothActive) {
          const speed = 0.12;
          const progress = (time * speed + (fromIdx * 0.15)) % 1.0;
          const dotX = p1.x + (p2.x - p1.x) * progress;
          const dotY = p1.y + (p2.y - p1.y) * progress;

          ctx.beginPath();
          ctx.arc(dotX, dotY, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = "#8ECAFF";
          ctx.shadowColor = "rgba(142, 202, 255, 0.6)";
          ctx.shadowBlur = 4;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Draw nodes
      points.forEach((p, i) => {
        if (p.isActive) {
          // Glow ring/halo (ABRAM Sky Blue Accent Glow)
          ctx.beginPath();
          ctx.arc(p.x, p.y, 6 + Math.sin(time * 1.5 + i) * 1.2, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(142, 202, 255, 0.22)";
          ctx.lineWidth = 1;
          ctx.shadowColor = "rgba(142, 202, 255, 0.3)";
          ctx.shadowBlur = 6;
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Core dot (ABRAM Accent Sky Blue)
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = "#8ECAFF";
          ctx.fill();

          // Floating label in high-contrast cream text
          ctx.font = "400 9px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
          ctx.fillStyle = "rgba(250, 250, 249, 0.95)";
          ctx.fillText(p.name, p.x + 9, p.y + 3);
        } else {
          // Inactive dot
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
          ctx.fill();
        }
      });
    };

    const renderLoop = () => {
      const rect = canvas.getBoundingClientRect();
      const time = Date.now() * 0.001;
      const currentActiveCount = Math.floor(activeCountTransform.get());
      draw(rect.width, rect.height, time, currentActiveCount);
      animationId = requestAnimationFrame(renderLoop);
    };

    animationId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animationId);
  }, [activeCountTransform]);

  return (
    <div ref={containerRef} className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden glass-panel bg-zinc-950/20 border border-white/[0.08]">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}

export default function BrainSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  // Track scroll position to sequentially light up nodes
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "center center"],
  });

  // Map scroll progress to active nodes index
  const activeCountTransform = useTransform(scrollYProgress, [0.1, 0.65], [0, NODES.length]);

  const features = [
    {
      icon: Brain,
      title: "Context Scoping",
      description: "Processes campaign briefs and schedules into structured milestone modules automatically."
    },
    {
      icon: Search,
      title: "Roster Sync",
      description: "Checks availability and maps standard role rates in the background."
    },
    {
      icon: Lock,
      title: "Secure Isolation",
      description: "Complete containment of briefs, schedules, and logs with zero public model training."
    },
    {
      icon: Zap,
      title: "System Learning",
      description: "Refines budget estimations and personnel matching parameters from actual execution."
    }
  ];

  return (
    <section ref={sectionRef} className="relative py-24 md:py-32 border-t border-white/5 bg-abram-black overflow-hidden">
      {/* Ambient Glows - System Core Indigo/Purple */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/[0.035] rounded-full filter blur-[130px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[450px] h-[450px] bg-[#8ECAFF]/[0.02] rounded-full filter blur-[110px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center mb-16">
          {/* Copy Side */}
          <div className="lg:col-span-5 space-y-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/3 text-[#f5f5f3] text-xs font-semibold tracking-wider uppercase">
              System Core
            </div>

            {/* Section Header (h2: text-base to text-lg, font-medium, leading-snug) */}
            <h2
              className="text-base md:text-lg font-medium text-white/90 tracking-wide leading-snug uppercase font-display"
            >
              THE PRODUCTION BRAIN
            </h2>

            {/* Body Paragraph: text-sm font-normal text-white/80 */}
            <p className="text-sm font-normal text-white/80 leading-relaxed max-w-xl">
              A secure, private memory layer for your organization. ABRAM processes campaign data automatically to structure timelines, match rosters, and resolve scheduling conflicts, keeping your intellectual property completely isolated.
            </p>

            {/* Micro-Metadata / Indicators */}
            <div className="flex items-center gap-3 pt-2 text-xs font-medium tracking-wide text-white/30 uppercase">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#8ECAFF] shadow-[0_0_8px_#8ECAFF] " />
                Engine Active
              </span>
              <span className="text-zinc-800">•</span>
              <span>12 Specialized Triggers</span>
            </div>
          </div>

          {/* Canvas Side */}
          <div className="lg:col-span-7 w-full">
            <NetworkCanvas activeCountTransform={activeCountTransform} />
          </div>
        </div>

        {/* Features Columns (No Cards) - aligned with Bento gap-4 specifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-16 mt-16 border-t border-white/5">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="flex flex-col space-y-4 p-4 rounded-xl border border-white/[0.04] bg-abram-black/20 hover:bg-abram-cream/[0.06] transition-all duration-200"
              >
                <div className="text-zinc-500 hover:text-abram-accent transition-colors duration-200">
                  <Icon className="h-6 w-6 stroke-[1.2]" />
                </div>
                {/* Body Title: text-sm font-semibold */}
                <h3
                  className="text-sm font-semibold text-white tracking-tight font-display"
                >
                  {feature.title}
                </h3>
                {/* Body Paragraph: text-sm font-normal text-white/80 */}
                <p className="text-sm font-normal text-white/80 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
