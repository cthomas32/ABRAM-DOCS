"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  CalendarRange, 
  Coins, 
  ShieldAlert, 
  MapPin, 
  Users, 
  ArrowRight,
  TrendingUp,
  Sliders
} from "lucide-react";
import { revealVariants } from "@/lib/motion";

interface Feature {
  id: string;
  tag: string;
  title: string;
  description: string;
  icon: any;
  previewType: "stripboard" | "dood" | "union" | "budget";
}

const features: Feature[] = [
  {
    id: "stripboard",
    tag: "Visual Scheduling",
    title: "Interactive Stripboard",
    description: "Re-order scenes via drag-and-drop. Automatically recalculates daylight windows, set moves, and shooting page counts instantly.",
    icon: CalendarRange,
    previewType: "stripboard"
  },
  {
    id: "dood",
    tag: "Cast Allocation",
    title: "Day Out of Days (DOOD)",
    description: "Track actor work, travel, and hold days. View starts, finishes, and idle periods in a dense, scannable calendar view.",
    icon: Users,
    previewType: "dood"
  },
  {
    id: "union",
    tag: "Labor Compliance",
    title: "Smart Union Rules",
    description: "Built-in compliance checks for SAG-AFTRA, DGA, and IATSE rules. Spot turnaround violations and rest hour penalties automatically.",
    icon: ShieldAlert,
    previewType: "union"
  },
  {
    id: "budget",
    tag: "Financial Control",
    title: "Connected Budgeting",
    description: "Link your stripboard directly to your chart of accounts. See the immediate budget impact of adding a shooting day.",
    icon: Coins,
    previewType: "budget"
  }
];

export default function FeatureCatalogList() {
  const [activeTab, setActiveTab] = useState<string>("stripboard");

  const activeFeature = features.find((f) => f.id === activeTab) || features[0];

  return (
    <div id="features" className="w-full py-16 px-4 sm:px-6 lg:px-8 bg-transparent overflow-visible">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="font-display text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-3 block">
            Core Toolkit
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-50 mb-4 font-sans">
            Built for professional physical production
          </h2>
          <p className="text-sm sm:text-base font-normal leading-relaxed text-zinc-400 max-w-xl mx-auto font-sans">
            Traditional film workflow tools meet modern software design. Fast, secure, and responsive on all devices.
          </p>
        </div>

        {/* Dynamic Split Screen Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Interactive Feature List (5 Cols) */}
          <div className="lg:col-span-5 space-y-4 w-full">
            {features.map((feature) => {
              const IconComponent = feature.icon;
              const isActive = activeTab === feature.id;

              return (
                <button
                  key={feature.id}
                  onClick={() => setActiveTab(feature.id)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all duration-250 cursor-pointer flex gap-4 items-start ${
                    isActive 
                      ? "border-white/10 bg-zinc-950/40 shadow-[0_4px_20px_rgba(255,255,255,0.02)]" 
                      : "border-white/5 bg-transparent hover:border-white/8 hover:bg-zinc-950/10"
                  }`}
                >
                  <div className={`p-2.5 rounded-lg border transition-colors ${
                    isActive 
                      ? "bg-white/5 border-white/10 text-white" 
                      : "bg-zinc-950/20 border-white/5 text-zinc-500"
                  }`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-display text-[9px] font-medium tracking-widest uppercase text-zinc-500 mb-1 block">
                      {feature.tag}
                    </span>
                    <h3 className={`text-base font-semibold tracking-tight transition-colors mb-1 ${
                      isActive ? "text-zinc-50" : "text-zinc-300"
                    }`}>
                      {feature.title}
                    </h3>
                    <p className="text-xs font-normal leading-relaxed text-zinc-400">
                      {feature.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Interactive Sandbox Preview Panel (7 Cols) */}
          <div className="lg:col-span-7 w-full h-full min-h-[380px] flex">
            <div className="w-full rounded-2xl border border-white/8 bg-zinc-950/30 backdrop-blur-md p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden">
              
              {/* Top Accent Bar */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              
              {/* Dynamic Interactive Title */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                <div>
                  <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-500">Live Preview</span>
                  <h4 className="text-sm font-semibold text-zinc-200 mt-0.5">{activeFeature.title}</h4>
                </div>
                <div className="flex items-center gap-2">
                  {activeFeature.previewType === "dood" && (
                    <span className="text-[10px] text-zinc-400 md:hidden block font-mono animate-pulse mr-2">Swipe to view →</span>
                  )}
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-zinc-800" />
                    <span className="h-2 w-2 rounded-full bg-zinc-800" />
                    <span className="h-2 w-2 rounded-full bg-zinc-800" />
                  </div>
                </div>
              </div>

              {/* Sandbox Contents based on selected tab */}
              <div className="flex-1 flex items-center justify-center w-full">
                
                {/* 1. Stripboard Preview */}
                {activeFeature.previewType === "stripboard" && (
                  <div className="w-full space-y-2.5">
                    <div className="text-[10px] font-medium text-zinc-500 flex justify-between px-1">
                      <span>Order (Drag handle active)</span>
                      <span>3 Scenes Selected</span>
                    </div>
                    
                    <div className="grid grid-cols-[14px_45px_30px_1fr_60px_40px] items-center gap-2 p-2 rounded-lg border border-white/10 bg-zinc-900/30 text-xs text-zinc-300">
                      <div className="h-3.5 w-full rounded bg-amber-400" />
                      <span className="font-mono text-zinc-500">Sc. 1</span>
                      <span className="font-mono text-zinc-500">INT</span>
                      <span className="truncate text-zinc-100 text-left font-medium">Exterior Gate - Setup</span>
                      <span className="text-zinc-400 text-right">0 4/8 pgs</span>
                      <span className="text-zinc-500 text-center font-mono">1, 3</span>
                    </div>

                    <div className="grid grid-cols-[14px_45px_30px_1fr_60px_40px] items-center gap-2 p-2 rounded-lg border border-white/5 bg-zinc-900/10 text-xs text-zinc-400 opacity-60">
                      <div className="h-3.5 w-full rounded bg-indigo-500" />
                      <span className="font-mono">Sc. 2</span>
                      <span className="font-mono">INT</span>
                      <span className="truncate text-left">Foyer Escape</span>
                      <span className="text-right">1 2/8 pgs</span>
                      <span className="text-center font-mono">1, 2, 3</span>
                    </div>

                    <div className="grid grid-cols-[14px_45px_30px_1fr_60px_40px] items-center gap-2 p-2 rounded-lg border border-white/5 bg-zinc-900/10 text-xs text-zinc-400 opacity-60">
                      <div className="h-3.5 w-full rounded bg-emerald-500" />
                      <span className="font-mono">Sc. 3</span>
                      <span className="font-mono">EXT</span>
                      <span className="truncate text-left">Rear Garden</span>
                      <span className="text-right">2 0/8 pgs</span>
                      <span className="text-center font-mono">1, 2</span>
                    </div>
                  </div>
                )}

                {/* 2. DOOD Grid Preview */}
                {activeFeature.previewType === "dood" && (
                  <div className="w-full overflow-x-auto scrollbar-none">
                    <div className="min-w-[400px] border border-white/5 rounded-xl bg-zinc-950/20 p-3">
                      {/* Days Header */}
                      <div className="grid grid-cols-[100px_repeat(5,1fr)] gap-1 border-b border-white/5 pb-2 mb-2 text-[9px] font-mono text-zinc-500 text-center">
                        <div className="text-left">Actor (ID)</div>
                        <div>Day 1</div>
                        <div>Day 2</div>
                        <div>Day 3</div>
                        <div>Day 4</div>
                        <div>Day 5</div>
                      </div>
                      
                      {/* Actor 1 Rows */}
                      <div className="grid grid-cols-[100px_repeat(5,1fr)] gap-1 text-xs items-center text-center py-1">
                        <div className="text-left font-medium text-zinc-200 truncate">Leo Vance (1)</div>
                        {/* Start (SW) */}
                        <div className="h-7 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-semibold flex items-center justify-center text-[10px]">SW</div>
                        {/* Work (W) */}
                        <div className="h-7 rounded border border-white/5 bg-zinc-800/40 text-zinc-200 flex items-center justify-center text-[10px]">W</div>
                        {/* Hold (H) */}
                        <div className="h-7 rounded border border-white/5 border-dashed bg-zinc-900/60 text-zinc-400 flex items-center justify-center text-[10px]">H</div>
                        {/* Work (W) */}
                        <div className="h-7 rounded border border-white/5 bg-zinc-800/40 text-zinc-200 flex items-center justify-center text-[10px]">W</div>
                        {/* Finish (WF) */}
                        <div className="h-7 rounded border border-red-500/30 bg-red-500/10 text-red-400 font-semibold flex items-center justify-center text-[10px]">WF</div>
                      </div>

                      {/* Actor 2 Rows */}
                      <div className="grid grid-cols-[100px_repeat(5,1fr)] gap-1 text-xs items-center text-center py-1">
                        <div className="text-left font-medium text-zinc-200 truncate">Maya Lin (2)</div>
                        <div className="h-7 rounded border border-white/[0.02] bg-zinc-950/40 text-zinc-600 flex items-center justify-center text-[10px]">-</div>
                        <div className="h-7 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-semibold flex items-center justify-center text-[10px]">SW</div>
                        <div className="h-7 rounded border border-white/5 bg-zinc-800/40 text-zinc-200 flex items-center justify-center text-[10px]">W</div>
                        <div className="h-7 rounded border border-white/5 bg-zinc-800/40 text-zinc-200 flex items-center justify-center text-[10px]">W</div>
                        <div className="h-7 rounded border border-white/5 bg-zinc-800/40 text-zinc-200 flex items-center justify-center text-[10px]">W</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Union Rule Alerts */}
                {activeFeature.previewType === "union" && (
                  <div className="w-full space-y-3">
                    <div className="p-4 rounded-xl border border-amber-500/25 bg-amber-500/5 flex items-start gap-3">
                      <div className="p-1 rounded bg-amber-500/10 text-amber-400 mt-0.5">
                        <ShieldAlert className="h-4 w-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-semibold text-amber-200">SAG-AFTRA Turnaround Conflict</h5>
                        <p className="text-[11px] text-zinc-400 leading-normal mt-1">
                          Actor Leo Vance scheduled for Camera Wrap Day 4 (23:30) and Call Time Day 5 (08:30). 
                          Required rest: 12 hours. Provided: 9.0 hours.
                        </p>
                        <span className="inline-block mt-2 px-2 py-0.5 rounded bg-amber-500/15 text-[9px] font-semibold text-amber-400 uppercase tracking-wider">
                          Auto-calculated penalty: 3 hrs Forced Call
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex items-start gap-3 opacity-65">
                      <div className="p-1 rounded bg-zinc-800 text-zinc-400 mt-0.5">
                        <Sliders className="h-4 w-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-semibold text-zinc-300">DGA 6th Consecutive Day Check</h5>
                        <p className="text-[11px] text-zinc-500 leading-normal mt-1">
                          Director has completed 5 active shoot days. Rest period requirements validated for Day 7.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Live Budget Forecast */}
                {activeFeature.previewType === "budget" && (
                  <div className="w-full space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg border border-white/5 bg-white/[0.01]">
                        <span className="text-[9px] font-mono text-zinc-500 uppercase block">Shoot Day cost</span>
                        <span className="font-mono text-lg font-semibold text-white mt-1 block">$118,400</span>
                      </div>
                      <div className="p-3 rounded-lg border border-white/5 bg-white/[0.01]">
                        <span className="text-[9px] font-mono text-zinc-500 uppercase block">Active Fringe Rate</span>
                        <span className="font-mono text-lg font-semibold text-emerald-400 mt-1 block">+18.5% (Escrowed)</span>
                      </div>
                    </div>

                    <div className="border border-white/5 rounded-lg overflow-hidden bg-zinc-950/20">
                      <div className="grid grid-cols-3 px-3 py-1.5 bg-white/5 text-[9px] font-mono uppercase tracking-widest text-zinc-500 border-b border-white/5">
                        <span>Account</span>
                        <span className="text-right">Projected</span>
                        <span className="text-right">Variance</span>
                      </div>
                      
                      <div className="grid grid-cols-3 px-3 py-2 text-[11px] border-b border-white/5">
                        <span className="text-zinc-200">1100 - Cast Payroll</span>
                        <span className="text-right font-mono text-zinc-300">$64,500</span>
                        <span className="text-right font-mono text-zinc-500">-$2,100</span>
                      </div>

                      <div className="grid grid-cols-3 px-3 py-2 text-[11px] border-b border-white/5">
                        <span className="text-zinc-200">2200 - Grip & Electric</span>
                        <span className="text-right font-mono text-zinc-300">$22,000</span>
                        <span className="text-right font-mono text-emerald-400">+$1,450</span>
                      </div>
                      
                      <div className="grid grid-cols-3 px-3 py-2 text-[11px]">
                        <span className="text-zinc-200">3100 - Locations</span>
                        <span className="text-right font-mono text-zinc-300">$18,900</span>
                        <span className="text-right font-mono text-zinc-500">--</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Bottom Feature Footer */}
              <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-zinc-400" />
                  Calculations update in real-time
                </span>
                <a 
                  href="/docs/scheduling" 
                  className="inline-flex items-center gap-1 text-white hover:underline hover:text-zinc-200"
                >
                  Read Docs
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
