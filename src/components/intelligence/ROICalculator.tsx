"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  RotateCcw,
  Sparkles,
  Building,
  Briefcase,
  Users2
} from "lucide-react";

interface ScenarioConfig {
  id: string;
  name: string;
  revenue: string;
  minProjects: number;
  maxProjects: number;
  defaultProjects: number;
  minCrew: number;
  maxCrew: number;
  defaultCrew: number;
  minAutomation: number;
  maxAutomation: number;
  defaultAutomation: number;
  hourlyRate: number;
  avgProjectBudget: number;
  leakageRate: number;
  platformCost: number;
  hoursPerProject: number;
  hoursPerCrew: number;
}

const SCENARIOS: ScenarioConfig[] = [
  {
    id: "boutique",
    name: "Boutique",
    revenue: "$1M",
    minProjects: 5,
    maxProjects: 50,
    defaultProjects: 20,
    minCrew: 5,
    maxCrew: 100,
    defaultCrew: 25,
    minAutomation: 10,
    maxAutomation: 100,
    defaultAutomation: 45,
    hourlyRate: 60,
    avgProjectBudget: 25000,
    leakageRate: 0.02, // 2%
    platformCost: 3600, // $300/mo
    hoursPerProject: 18,
    hoursPerCrew: 6,
  },
  {
    id: "midmarket",
    name: "Mid-Market",
    revenue: "$10M",
    minProjects: 20,
    maxProjects: 250,
    defaultProjects: 80,
    minCrew: 30,
    maxCrew: 500,
    defaultCrew: 120,
    minAutomation: 10,
    maxAutomation: 100,
    defaultAutomation: 55,
    hourlyRate: 78,
    avgProjectBudget: 60000,
    leakageRate: 0.035, // 3.5%
    platformCost: 14400, // $1,200/mo
    hoursPerProject: 26,
    hoursPerCrew: 8,
  },
  {
    id: "enterprise",
    name: "SMB / Enterprise",
    revenue: "$50M",
    minProjects: 50,
    maxProjects: 1000,
    defaultProjects: 300,
    minCrew: 100,
    maxCrew: 2000,
    defaultCrew: 500,
    minAutomation: 10,
    maxAutomation: 100,
    defaultAutomation: 65,
    hourlyRate: 95,
    avgProjectBudget: 125000,
    leakageRate: 0.05, // 5%
    platformCost: 48000, // $4,000/mo
    hoursPerProject: 36,
    hoursPerCrew: 10,
  },
];

export default function ROICalculator() {
  const [activeTier, setActiveTier] = useState<string>("midmarket");
  
  // Slider states
  const [projects, setProjects] = useState<number>(80);
  const [crew, setCrew] = useState<number>(120);
  const [automation, setAutomation] = useState<number>(55);

  // Sync inputs when active tier changes
  const activeConfig = SCENARIOS.find((s) => s.id === activeTier) || SCENARIOS[1];

  useEffect(() => {
    setProjects(activeConfig.defaultProjects);
    setCrew(activeConfig.defaultCrew);
    setAutomation(activeConfig.defaultAutomation);
  }, [activeTier, activeConfig]);

  // Reset function
  const handleReset = () => {
    setProjects(activeConfig.defaultProjects);
    setCrew(activeConfig.defaultCrew);
    setAutomation(activeConfig.defaultAutomation);
  };

  // Calculations
  const timeSaved = Math.round(
    ((projects * activeConfig.hoursPerProject) + (crew * activeConfig.hoursPerCrew)) * 
    (automation / 100)
  );

  const laborSavings = Math.round(timeSaved * activeConfig.hourlyRate);

  const totalProjectRevenue = projects * activeConfig.avgProjectBudget;
  const leakagePrevention = Math.round(
    totalProjectRevenue * activeConfig.leakageRate * (automation / 100)
  );

  const totalSavings = laborSavings + leakagePrevention;
  const netSavings = Math.max(0, totalSavings - activeConfig.platformCost);

  const netROI = activeConfig.platformCost > 0 
    ? Math.round((netSavings / activeConfig.platformCost) * 100) 
    : 0;

  const paybackPeriod = totalSavings > 0
    ? Number(((activeConfig.platformCost / totalSavings) * 12).toFixed(1))
    : 0;

  // Format currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Format number helper
  const formatNumber = (val: number) => {
    return new Intl.NumberFormat("en-US").format(val);
  };

  return (
    <div id="roi-calculator" className="relative w-full py-12 px-4 sm:px-6 lg:px-8 bg-transparent overflow-visible">
      {/* Outer Card with Glass-Panel */}
      <div className="max-w-5xl mx-auto glass-panel rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md p-6 sm:p-8 md:p-10 shadow-2xl relative">
        
        {/* Decorative inner corner borders */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-white/10 rounded-tl-2xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-white/10 rounded-tr-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-white/10 rounded-bl-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-white/10 rounded-br-2xl pointer-events-none" />

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-8 border-b border-white/5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 font-sans">
              <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
              Dynamic ROI Modeler
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white font-sans">
              Interactive ROI Calculator
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans max-w-xl">
              Model your agency or studio's workload and automation capabilities to see the cumulative impact on time, administrative labor, and leakage prevention.
            </p>
          </div>

          {/* Tier Tabs Selector */}
          <div className="flex items-center bg-zinc-950/60 p-1.5 rounded-full border border-white/5 shrink-0 self-start md:self-auto">
            {SCENARIOS.map((tier) => (
              <button
                key={tier.id}
                onClick={() => setActiveTier(tier.id)}
                className={`px-4 py-3 md:py-1.5 rounded-full text-xs font-semibold font-sans transition-all duration-200 cursor-pointer min-h-[44px] md:min-h-0 flex items-center justify-center ${
                  activeTier === tier.id
                    ? "bg-white text-black shadow-lg"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.03]"
                }`}
              >
                {tier.name} ({tier.revenue})
              </button>
            ))}
          </div>
        </div>

        {/* Calculator Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Sliders Form Controls (7 Columns) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Slider 1: Projects/Year */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-medium font-sans">
                <label className="text-zinc-200 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-zinc-400" />
                  Projects per Year
                </label>
                <span className="text-white font-mono text-sm px-2.5 py-0.5 rounded bg-zinc-900 border border-white/5">
                  {formatNumber(projects)}
                </span>
              </div>
              <input
                type="range"
                min={activeConfig.minProjects}
                max={activeConfig.maxProjects}
                value={projects}
                onChange={(e) => setProjects(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-white"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>Min: {activeConfig.minProjects}</span>
                <span>Max: {activeConfig.maxProjects}</span>
              </div>
            </div>

            {/* Slider 2: Crew Roster Size */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-medium font-sans">
                <label className="text-zinc-200 flex items-center gap-2">
                  <Users2 className="w-4 h-4 text-zinc-400" />
                  Crew Roster Size
                </label>
                <span className="text-white font-mono text-sm px-2.5 py-0.5 rounded bg-zinc-900 border border-white/5">
                  {formatNumber(crew)}
                </span>
              </div>
              <input
                type="range"
                min={activeConfig.minCrew}
                max={activeConfig.maxCrew}
                value={crew}
                onChange={(e) => setCrew(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-white"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>Min: {activeConfig.minCrew}</span>
                <span>Max: {activeConfig.maxCrew}</span>
              </div>
            </div>

            {/* Slider 3: Automation Rate / Yield */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-medium font-sans">
                <label className="text-zinc-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-zinc-400" />
                  Automation Yield (Efficiency Rate)
                </label>
                <span className="text-white font-mono text-sm px-2.5 py-0.5 rounded bg-zinc-900 border border-white/5">
                  {automation}%
                </span>
              </div>
              <input
                type="range"
                min={activeConfig.minAutomation}
                max={activeConfig.maxAutomation}
                value={automation}
                onChange={(e) => setAutomation(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-white"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>Min: {activeConfig.minAutomation}%</span>
                <span>Max: {activeConfig.maxAutomation}%</span>
              </div>
            </div>

            {/* Config metadata callout */}
            <div className="p-4 rounded-xl border border-white/5 bg-zinc-950/40 space-y-2 text-xs text-zinc-400 font-sans">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="block text-zinc-500">Hourly Rate Cap</span>
                  <span className="font-mono text-white text-xs font-semibold">{formatCurrency(activeConfig.hourlyRate)}/hr</span>
                </div>
                <div>
                  <span className="block text-zinc-500">Avg. Project Budget</span>
                  <span className="font-mono text-white text-xs font-semibold">{formatCurrency(activeConfig.avgProjectBudget)}</span>
                </div>
                <div>
                  <span className="block text-zinc-500">Operational Leakage</span>
                  <span className="font-mono text-white text-xs font-semibold">{(activeConfig.leakageRate * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="block text-zinc-500">License Cost / Yr</span>
                  <span className="font-mono text-white text-xs font-semibold">{formatCurrency(activeConfig.platformCost)}</span>
                </div>
              </div>
            </div>

            {/* Reset Action */}
            <div className="flex justify-end">
              <button
                onClick={handleReset}
                className="btn-ghost flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Defaults
              </button>
            </div>

          </div>

          {/* Results Summary Box (5 Columns) */}
          <div className="lg:col-span-5 w-full">
            <div className="rounded-xl border border-white/10 bg-zinc-950/70 p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
              
              {/* Top glow overlay inside results */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.015] rounded-full blur-[40px] pointer-events-none" />

              {/* Main Net ROI Callout */}
              <div className="space-y-1 relative z-10">
                <span className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase font-sans">
                  NET ROI ESTIMATE
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-bold tracking-tight text-white font-sans">
                    {netROI}%
                  </span>
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-0.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    +{formatCurrency(netSavings)}/yr
                  </span>
                </div>
              </div>

              {/* Sub-metrics list */}
              <div className="space-y-4 pt-4 border-t border-white/5 relative z-10">
                
                {/* Metric: Time Saved */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    Time Saved
                  </span>
                  <span className="text-white font-semibold font-mono text-right">
                    {formatNumber(timeSaved)} hours/yr
                  </span>
                </div>

                {/* Metric: Labor Savings */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5 text-zinc-500" />
                    Labor Savings
                  </span>
                  <span className="text-white font-semibold font-mono text-right">
                    {formatCurrency(laborSavings)}/yr
                  </span>
                </div>

                {/* Metric: Leakage Prevention */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
                    Leakage Prevented
                  </span>
                  <span className="text-white font-semibold font-mono text-right">
                    {formatCurrency(leakagePrevention)}/yr
                  </span>
                </div>

                {/* Metric: Payback Period */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-zinc-500" />
                    Payback Period
                  </span>
                  <span className="text-emerald-400 font-semibold font-mono text-right">
                    {paybackPeriod <= 0.1 ? "Immediate" : `${paybackPeriod} months`}
                  </span>
                </div>

              </div>

              {/* Call to action */}
              <div className="pt-6 relative z-10">
                <a
                  href="/pricing"
                  className="btn-primary w-full"
                >
                  View Deployment Plans
                </a>
                <p className="text-[9px] text-zinc-500 text-center mt-3 font-mono">
                  *Formulations are linear approximations based on industry averages.
                </p>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
