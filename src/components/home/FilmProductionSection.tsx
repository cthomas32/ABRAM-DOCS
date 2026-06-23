"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  ArrowRight, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle,
  Zap,
  ArrowUpRight
} from "lucide-react";
import Link from "next/link";

interface Scene {
  id: string;
  number: string;
  header: string;
  characters: string;
  timeOfDay: string;
  pages: string;
}

const SCENES: Scene[] = [
  { id: "1", number: "12", header: "INT. LIVING ROOM", characters: "LEO, MAYA", timeOfDay: "DAY", pages: "1 4/8 pgs" },
  { id: "2", number: "13", header: "EXT. COURTYARD", characters: "LEO, MAYA", timeOfDay: "NIGHT", pages: "2 1/8 pgs" },
  { id: "3", number: "14", header: "INT. KITCHEN", characters: "LEO", timeOfDay: "DAY", pages: "1 2/8 pgs" }
];

function InteractiveProductionMockup() {
  const [optimized, setOptimized] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleOptimize = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setOptimized(true);
      setIsOptimizing(false);
    }, 700);
  };

  const handleReset = () => {
    setOptimized(false);
  };

  return (
    <div className="w-full rounded-2xl border border-white/5 bg-zinc-950/40 p-4 sm:p-6 backdrop-blur-xl relative overflow-visible select-none">
      {/* Glow highlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] sm:w-[450px] h-[250px] bg-[#8ECAFF]/[0.015] rounded-full filter blur-[70px] pointer-events-none -z-10" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* LEFT COLUMN: Stripboard Schedule */}
        <div className="lg:col-span-7 flex flex-col rounded-xl border border-white/5 bg-zinc-950/80 p-4 shadow-inner">
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3 text-[10px] sm:text-xs text-zinc-500 font-sans">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span className="font-mono text-zinc-400">shooting_stripboard.sch</span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-white/5 font-mono text-[9px] uppercase tracking-wide">
              Day 1 of 5
            </span>
          </div>

          {/* Stripboard List */}
          <div className="space-y-2 flex-1">
            {SCENES.map((scene, idx) => {
              const isNight = scene.timeOfDay === "NIGHT";
              return (
                <div 
                  key={scene.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border transition-all duration-300 ${
                    idx === 1 
                      ? "bg-amber-500/5 border-amber-500/10 text-amber-400" 
                      : "bg-zinc-900/30 border-white/5 text-zinc-300"
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-2">
                    <div className={`w-8 text-[10px] font-mono text-center py-0.5 rounded shrink-0 ${
                      isNight ? "bg-purple-950/60 border border-purple-500/20 text-purple-300" : "bg-zinc-950 border border-white/5 text-zinc-400"
                    }`}>
                      Sc. {scene.number}
                    </div>
                    <div>
                      <div className="text-xs font-semibold font-sans">{scene.header}</div>
                      <div className="text-[9px] text-zinc-500 font-mono mt-0.5">{scene.characters} • {scene.timeOfDay}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-white/5 sm:border-t-0">
                    <span className="font-mono text-[10px] text-zinc-500">{scene.pages}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-medium border ${
                      idx === 0 
                        ? "bg-zinc-900/55 border-white/5 text-zinc-500" 
                        : idx === 1 
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                        : "bg-zinc-900/55 border-white/5 text-zinc-400"
                    }`}>
                      {idx === 0 ? "Completed" : idx === 1 ? "Night Shoot (Wrap 3AM)" : "Scheduled"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: SAG-AFTRA Compliance Panel */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-white/5 bg-zinc-950/80 p-4 shadow-inner">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-semibold tracking-wider text-zinc-500 uppercase font-sans">
                Compliance Monitor
              </span>
              <div className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${optimized ? "bg-emerald-400 animate-pulse" : "bg-red-400 animate-pulse"}`} />
                <span className="font-mono text-[9px] text-zinc-400">SAG Rule 14B</span>
              </div>
            </div>

            {/* Turnaround Rest Info */}
            <div className="space-y-3.5">
              <div className="bg-zinc-900/30 border border-white/5 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-sans">
                  <span>Crew Wrap Time:</span>
                  <span className="font-mono text-zinc-300">03:00 AM</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-sans">
                  <span>Next Crew Call:</span>
                  <motion.span 
                    key={optimized ? "opt-call" : "unopt-call"}
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`font-mono font-semibold ${optimized ? "text-emerald-400" : "text-amber-400"}`}
                  >
                    {optimized ? "03:00 PM" : "01:00 PM"}
                  </motion.span>
                </div>
                <div className="border-t border-white/5 my-1.5" />
                <div className="flex items-center justify-between text-[11px] text-zinc-300 font-sans">
                  <span className="font-medium">Calculated Rest:</span>
                  <motion.span 
                    key={optimized ? "opt-rest" : "unopt-rest"}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`font-mono font-bold ${optimized ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {optimized ? "12.0 hours" : "10.0 hours"}
                  </motion.span>
                </div>
              </div>

              {/* Status Banner */}
              <AnimatePresence mode="wait">
                {!optimized ? (
                  <motion.div 
                    key="violation-alert"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-[10px] font-semibold text-red-400 uppercase tracking-wide">
                        SAG Violation Detected
                      </h4>
                      <p className="text-[10px] text-red-300/80 leading-relaxed font-sans mt-0.5">
                        Rest period under 12 hours. Estimated union penalty fee: $3,500/day.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="compliant-alert"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide">
                        Turnaround Compliant
                      </h4>
                      <p className="text-[10px] text-emerald-300/80 leading-relaxed font-sans mt-0.5">
                        12 hours SAG rest period satisfied. Union penalty fees avoided (+$3,500).
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="mt-4 pt-3 border-t border-white/5 flex justify-end">
            {isOptimizing ? (
              <button 
                disabled 
                className="btn-glass px-4 py-2 text-[11px] min-h-[38px] w-full flex items-center justify-center opacity-50 cursor-not-allowed"
              >
                <span>Optimizing schedule...</span>
              </button>
            ) : optimized ? (
              <button 
                onClick={handleReset}
                className="btn-glass px-4 py-2 text-[11px] min-h-[38px] w-full flex items-center justify-center gap-1.5 hover:bg-white/[0.08]"
              >
                <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                <span>Reset Demo</span>
              </button>
            ) : (
              <button 
                onClick={handleOptimize}
                className="btn-primary px-4 py-2 text-[11px] min-h-[38px] w-full flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-zinc-950 shrink-0" />
                <span>Resolve Rest Violation</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function FilmProductionSection() {
  const features = [
    {
      icon: Calendar,
      title: "Stripboard Scheduling",
      description: "Visual timeline scheduling with Day Out of Days actor tracking."
    },
    {
      icon: Sparkles,
      title: "Script Breakdown",
      description: "Automated screenplay parsing into tagged shooting elements."
    },
    {
      icon: Clock,
      title: "Digital Call Sheets",
      description: "Dynamic logistics tracking for basecamp, crew calls, and transport."
    },
    {
      icon: ShieldCheck,
      title: "Union Compliance",
      description: "Real-time SAG rest checks and daily turnaround margins."
    }
  ];

  return (
    <section className="relative py-16 md:py-24 lg:py-32 border-t border-white/5 bg-transparent overflow-hidden">
      {/* Ambient background glows */}
      <div 
        className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] lg:w-[600px] lg:h-[600px] bg-blue-900/[0.03] rounded-full filter blur-[80px] lg:blur-[130px] pointer-events-none" 
      />
      <div 
        className="absolute top-1/3 right-1/4 w-[250px] h-[250px] lg:w-[450px] lg:h-[450px] bg-[#8ECAFF]/[0.012] rounded-full filter blur-[90px] lg:blur-[110px] pointer-events-none" 
      />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center mb-16">
          
          {/* Copy Side */}
          <div className="lg:col-span-5 space-y-6">
            {/* Overline Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/[0.02] text-zinc-400 text-[10px] font-semibold tracking-[0.2em] uppercase w-fit">
              FILM OPERATIONS
            </div>

            {/* Header */}
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-50 uppercase font-display leading-tight">
              Streamline physical production.
            </h2>

            {/* Description */}
            <p className="text-sm md:text-base font-normal leading-7 text-zinc-400 max-w-xl">
              Connect daily call sheets, stripboard scheduling, and SAG-AFTRA rest-period tracking. Turn script breakdown data directly into shooting days with real-time labor compliance monitors.
            </p>

            {/* CTA */}
            <div className="pt-4">
              <Link 
                href="/film-production"
                className="btn-glass px-5 py-2.5 text-xs rounded-full inline-flex items-center gap-1.5 transition-all duration-200 min-h-[44px] group"
              >
                <span>Open Film Suite</span>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-400 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* Graphic Side */}
          <div className="lg:col-span-7 w-full">
            <InteractiveProductionMockup />
          </div>
        </div>

        {/* 4 Bottom Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-16 border-t border-white/5">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="flex flex-col space-y-4 p-6 rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md hover:border-white/12 hover:bg-zinc-900/30 transition-all duration-200 select-none group"
              >
                <div className="text-zinc-400 group-hover:text-zinc-100 transition-colors duration-200">
                  <Icon className="h-5 w-5 stroke-[1.4]" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-200 tracking-tight font-sans">
                  {feature.title}
                </h3>
                <p className="text-sm font-normal leading-relaxed text-zinc-400">
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
