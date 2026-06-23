"use client";

import React, { useEffect, useRef } from "react";
import { useScroll, useTransform, motion, MotionValue, useInView } from "framer-motion";
import { Brain, Search, Lock, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";

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
  const mouseRef = useRef({ x: -1000, y: -1000 });

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
      const mouse = mouseRef.current;

      // Compute drifting coords & apply mouse hover physics
      const points = NODES.map((node, i) => {
        // Slow organic drift physics
        const dx = Math.sin(time * 0.15 + i) * 4;
        const dy = Math.cos(time * 0.12 + i * 1.4) * 4;
        const x = (node.pctX / 100) * width + dx;
        const y = (node.pctY / 100) * height + dy;

        // Mouse distance calculations for magnetic interactive effect
        const dist = Math.hypot(x - mouse.x, y - mouse.y);
        const isHovered = dist < 80; // 80px interaction radius
        const isActive = i < currentActiveCount || isHovered;

        return { x, y, name: node.name, isActive, isHovered, dist };
      });

      // Draw dynamic interactive connection lines
      CONNECTIONS.forEach(([fromIdx, toIdx]) => {
        const p1 = points[fromIdx];
        const p2 = points[toIdx];
        if (!p1 || !p2) return;

        const bothActive = p1.isActive && p2.isActive;
        const eitherActive = p1.isActive || p2.isActive;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);

        let alpha = 0.02; // ultra-faint fallback for structure
        if (bothActive) {
          alpha = 0.10 + Math.sin(time * 1.2 + fromIdx) * 0.04;
        } else if (eitherActive) {
          alpha = 0.04;
        }

        ctx.strokeStyle = `rgba(142, 202, 255, ${alpha * 1.5})`;
        ctx.lineWidth = bothActive ? 1.2 : 0.8;
        ctx.stroke();

        // Traversing signal data packets (Light Blue #8ECAFF)
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

      // Draw cursor interactive magnetic connection lines
      if (mouse.x > 0 && mouse.y > 0) {
        points.forEach((p) => {
          if (p.dist < 80) {
            const cursorAlpha = (1 - p.dist / 80) * 0.08;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(142, 202, 255, ${cursorAlpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        });
      }

      // Draw synaptic nodes & text labels
      points.forEach((p, i) => {
        if (p.isActive) {
          // Glow halo
          ctx.beginPath();
          const haloRadius = (p.isHovered ? 8 : 6) + Math.sin(time * 1.5 + i) * 1.2;
          ctx.arc(p.x, p.y, haloRadius, 0, Math.PI * 2);
          
          const glowAlpha = p.isHovered ? 0.32 : 0.22;
          ctx.strokeStyle = `rgba(142, 202, 255, ${glowAlpha})`;
          ctx.lineWidth = 1;
          ctx.shadowColor = "rgba(142, 202, 255, 0.3)";
          ctx.shadowBlur = p.isHovered ? 8 : 6;
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Core node dot (ABRAM Light Blue)
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.isHovered ? 3 : 2.5, 0, Math.PI * 2);
          ctx.fillStyle = "#8ECAFF";
          ctx.fill();

          // Floating monospace tag in High-Contrast Cream/White
          ctx.font = "400 9px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
          ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
          ctx.fillText(p.name, p.x + 9, p.y + 3);
        } else {
          // Dark inactive state
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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseLeave = () => {
    mouseRef.current = { x: -1000, y: -1000 };
  };

  return (
    <div 
      ref={containerRef} 
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-[280px] sm:h-[360px] lg:h-[480px]"
    >
      <canvas ref={canvasRef} className="block w-full h-full cursor-crosshair" />
    </div>
  );
}

export default function BrainSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const isGridInView = useInView(gridRef, { once: true, amount: 0.2 });

  // Scroll tracking to activate nodes sequentially
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "center center"],
  });

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
    <section 
      ref={sectionRef} 
      className="relative py-16 md:py-24 lg:py-32 border-t border-white/5 bg-transparent overflow-hidden"
    >
      {/* Ambient Glows (Strictly Light Blue and Purple core tints) */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] lg:w-[600px] lg:h-[600px] bg-purple-500/[0.03] rounded-full filter blur-[80px] lg:blur-[130px] pointer-events-none" 
      />
      <div 
        className="absolute top-1/3 left-1/3 w-[250px] h-[250px] lg:w-[450px] lg:h-[450px] bg-[#8ECAFF]/[0.015] rounded-full filter blur-[90px] lg:blur-[110px] pointer-events-none" 
      />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center mb-16">
          
          {/* Copy Side */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Overline Badge in clean glass styling */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/[0.02] text-zinc-400 text-[10px] font-semibold tracking-[0.2em] uppercase w-fit">
              ABRAM CORE
            </div>

            {/* Section Header (H2: uppercase display font on landing page) */}
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-50 uppercase font-display leading-tight">
              The foundation of it all.
            </h2>

            {/* Body Paragraph (leading-7 text-zinc-400) */}
            <p className="text-sm md:text-base font-normal leading-7 text-zinc-400 max-w-xl">
              A private workspace memory that unifies briefs, budgets, and crew availability. It learns from past projects to automate team matching and resource planning.
            </p>



            {/* Primary CTA (Using btn-glass variant with adequate hit target area) */}
            <div className="pt-4">
              <Link 
                href="/intelligence/brain"
                className="btn-glass px-5 py-2.5 text-xs rounded-full inline-flex items-center gap-1.5 transition-all duration-200 min-h-[44px] group"
              >
                <span>Explore the Brain</span>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-400 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* Canvas Side */}
          <div className="lg:col-span-7 w-full">
            <NetworkCanvas activeCountTransform={activeCountTransform} />
          </div>
        </div>

        {/* Features Columns (Strictly conforms to Feature Card specs in DESIGN.md) */}
        <div 
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-16 border-t border-white/5"
        >
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={isGridInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: idx * 0.08, ease: "easeOut" }}
                className="flex flex-col space-y-4 p-6 rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md hover:border-white/12 hover:bg-zinc-900/30 transition-all duration-200 select-none group"
              >
                <div className="text-zinc-400 group-hover:text-zinc-100 transition-colors duration-200">
                  <Icon className="h-5 w-5 stroke-[1.4]" />
                </div>
                {/* Body Title: font-sans for card titles */}
                <h3 className="text-sm font-semibold text-zinc-200 tracking-tight font-sans">
                  {feature.title}
                </h3>
                {/* Body Paragraph: text-sm font-normal text-zinc-400 */}
                <p className="text-sm font-normal leading-relaxed text-zinc-400">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
