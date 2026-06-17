"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  MapPin, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle,
  Sliders,
  Users,
  RotateCcw
} from "lucide-react";

interface BaseScores {
  skills: number;
  location: number;
  calendar: number;
  budget: number;
}

interface Candidate {
  id: string;
  name: string;
  role: string;
  avatarGradient: string;
  avatarText: string;
  baseScores: BaseScores;
  strengths: string[];
  redFlags: string[];
}

const INITIAL_CANDIDATES: Candidate[] = [
  {
    id: "sarah-chen",
    name: "Sarah Chen",
    role: "Lead Motion Designer",
    avatarGradient: "from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30",
    avatarText: "SC",
    baseScores: {
      skills: 98,     // Expert Cinema 4D, After Effects, Unreal Engine
      location: 30,   // Remote-only (Vancouver based, physical shoot is NYC)
      calendar: 95,   // Wide open availability
      budget: 82      // Slightly above target rate ($85/hr vs $75/hr target)
    },
    strengths: [
      "Mastery of Cinema 4D & Unreal Engine",
      "Immediate availability with zero conflicts"
    ],
    redFlags: [
      "Remote-only limits physical studio collaboration",
      "Hourly rate is 13% above slot target rate"
    ]
  },
  {
    id: "marcus-vance",
    name: "Marcus Vance",
    role: "Director of Photography",
    avatarGradient: "from-blue-500/20 to-cyan-500/20 text-blue-300 border-blue-500/30",
    avatarText: "MV",
    baseScores: {
      skills: 84,     // Solid portfolio, Arri Alexa owner
      location: 98,   // NYC local, fits physical shoot perfectly
      calendar: 45,   // Tight schedule, holds on key weekdays
      budget: 95      // Under target budget ($70/hr vs $75/hr target)
    },
    strengths: [
      "NYC Local (eliminates travel & lodging cost)",
      "Excellent budget alignment, below target rate"
    ],
    redFlags: [
      "Overbooked next Tuesday & Thursday (critical shoot days)",
      "Requires 2-week advance notice for schedule shifts"
    ]
  },
  {
    id: "elena-rostova",
    name: "Elena Rostova",
    role: "Senior Video Editor",
    avatarGradient: "from-amber-500/20 to-red-500/20 text-amber-300 border-amber-500/30",
    avatarText: "ER",
    baseScores: {
      skills: 92,     // Premiere Pro, DaVinci Resolve colorist expert
      location: 75,   // Hybrid (Boston, 3-hour train to NYC, overlaps timezones)
      calendar: 82,   // Open availability, minor evening conflict
      budget: 45      // Significant budget overage ($115/hr vs $75/hr target)
    },
    strengths: [
      "Senior colorist with 8+ years of commercial projects",
      "Full Eastern Time Zone availability & hybrid flexibility"
    ],
    redFlags: [
      "Rate exceeds slot target budget limit by 53%",
      "Requires premium workstations and remote render nodes"
    ]
  }
];

const PRESETS = [
  {
    name: "Balanced",
    weights: { skills: 50, location: 50, calendar: 50, budget: 50 }
  },
  {
    name: "VFX / High Skill",
    weights: { skills: 95, location: 20, calendar: 50, budget: 45 }
  },
  {
    name: "Local Production",
    weights: { skills: 45, location: 98, calendar: 65, budget: 50 }
  },
  {
    name: "Budget Optimization",
    weights: { skills: 55, location: 40, calendar: 45, budget: 95 }
  }
];

export default function MatchmakingEngine() {
  const [weights, setWeights] = useState({
    skills: 60,
    location: 50,
    calendar: 70,
    budget: 40
  });

  const handleWeightChange = (key: keyof typeof weights, value: number) => {
    setWeights(prev => ({ ...prev, [key]: value }));
  };

  const applyPreset = (presetWeights: typeof weights) => {
    setWeights(presetWeights);
  };

  const resetWeights = () => {
    setWeights({ skills: 50, location: 50, calendar: 50, budget: 50 });
  };

  const totalWeight = weights.skills + weights.location + weights.calendar + weights.budget;

  // Process candidates and calculate weighted suitability score
  const candidatesWithScores = INITIAL_CANDIDATES.map(candidate => {
    let score = 0;
    if (totalWeight > 0) {
      const weightedSum =
        weights.skills * candidate.baseScores.skills +
        weights.location * candidate.baseScores.location +
        weights.calendar * candidate.baseScores.calendar +
        weights.budget * candidate.baseScores.budget;
      score = Math.round(weightedSum / totalWeight);
    }
    return { ...candidate, score };
  });

  // Sort candidates dynamically: highest score at the top
  const sortedCandidates = [...candidatesWithScores].sort((a, b) => b.score - a.score);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#8ECAFF"; // Light Blue highlight (Excellent match)
    if (score >= 55) return "#3B82F6"; // Standard Blue (Moderate match)
    return "#CE1C1C"; // ABRAM Accent Red (Weak match)
  };

  return (
    <div className="w-full font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Left Side: Priority Configuration */}
        <div className="glass-panel rounded-2xl p-6 md:p-8 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/8 flex items-center justify-center">
                <Sliders className="w-4 h-4 text-zinc-400" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-zinc-50">
                Priority Configuration
              </h3>
            </div>
            <p className="text-sm font-normal leading-relaxed text-zinc-400">
              Adjust matching criteria weights to prioritize candidates. Changes instantly recalculate roster suitability scores.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500">
              Scoring Presets
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => {
                const isActive = 
                  weights.skills === preset.weights.skills &&
                  weights.location === preset.weights.location &&
                  weights.calendar === preset.weights.calendar &&
                  weights.budget === preset.weights.budget;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyPreset(preset.weights)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-200 cursor-pointer ${
                      isActive 
                        ? "bg-white text-black font-semibold border border-white"
                        : "bg-white/[0.02] border border-white/5 text-zinc-400 hover:bg-white/[0.05] hover:border-white/10 hover:text-zinc-200"
                    }`}
                  >
                    {preset.name}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={resetWeights}
                className="btn-ghost px-3 py-1.5 text-[11px] flex items-center gap-1"
                title="Reset to 50%"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>
          </div>

          {/* Sliders Container */}
          <div className="space-y-6 mt-2">
            
            {/* Criteria 1: Skills & Tools */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label htmlFor="slider-skills" className="text-sm font-medium text-zinc-200">
                  Skills & Tools
                </label>
                <span className="text-xs font-semibold text-white bg-white/[0.04] px-2 py-0.5 rounded border border-white/5">
                  {weights.skills}%
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-normal">
                Software proficiency, verified capabilities, portfolio grade
              </p>
              <div className="h-11 flex items-center relative w-full">
                <input
                  id="slider-skills"
                  type="range"
                  min="0"
                  max="100"
                  value={weights.skills}
                  onChange={(e) => handleWeightChange("skills", Number(e.target.value))}
                  className="w-full appearance-none bg-transparent cursor-pointer focus:outline-none h-11 
                             [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-zinc-800 
                             [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-150 [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:active:scale-90 
                             [&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-zinc-800 
                             [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-150 [&::-moz-range-thumb]:hover:scale-125 [&::-moz-range-thumb]:active:scale-90"
                />
              </div>
            </div>

            {/* Criteria 2: Location & Work Mode */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label htmlFor="slider-location" className="text-sm font-medium text-zinc-200">
                  Location & Work Mode
                </label>
                <span className="text-xs font-semibold text-white bg-white/[0.04] px-2 py-0.5 rounded border border-white/5">
                  {weights.location}%
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-normal">
                Local crew prioritization, on-set capability, travel offset
              </p>
              <div className="h-11 flex items-center relative w-full">
                <input
                  id="slider-location"
                  type="range"
                  min="0"
                  max="100"
                  value={weights.location}
                  onChange={(e) => handleWeightChange("location", Number(e.target.value))}
                  className="w-full appearance-none bg-transparent cursor-pointer focus:outline-none h-11 
                             [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-zinc-800 
                             [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-150 [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:active:scale-90 
                             [&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-zinc-800 
                             [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-150 [&::-moz-range-thumb]:hover:scale-125 [&::-moz-range-thumb]:active:scale-90"
                />
              </div>
            </div>

            {/* Criteria 3: Calendar Capacity */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label htmlFor="slider-calendar" className="text-sm font-medium text-zinc-200">
                  Calendar Capacity
                </label>
                <span className="text-xs font-semibold text-white bg-white/[0.04] px-2 py-0.5 rounded border border-white/5">
                  {weights.calendar}%
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-normal">
                Real-time availability, schedule conflicts, booking hold status
              </p>
              <div className="h-11 flex items-center relative w-full">
                <input
                  id="slider-calendar"
                  type="range"
                  min="0"
                  max="100"
                  value={weights.calendar}
                  onChange={(e) => handleWeightChange("calendar", Number(e.target.value))}
                  className="w-full appearance-none bg-transparent cursor-pointer focus:outline-none h-11 
                             [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-zinc-800 
                             [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-150 [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:active:scale-90 
                             [&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-zinc-800 
                             [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-150 [&::-moz-range-thumb]:hover:scale-125 [&::-moz-range-thumb]:active:scale-90"
                />
              </div>
            </div>

            {/* Criteria 4: Budget Alignment */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label htmlFor="slider-budget" className="text-sm font-medium text-zinc-200">
                  Budget Alignment
                </label>
                <span className="text-xs font-semibold text-white bg-white/[0.04] px-2 py-0.5 rounded border border-white/5">
                  {weights.budget}%
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-normal">
                Hourly/day rates vs. slot budget ceiling
              </p>
              <div className="h-11 flex items-center relative w-full">
                <input
                  id="slider-budget"
                  type="range"
                  min="0"
                  max="100"
                  value={weights.budget}
                  onChange={(e) => handleWeightChange("budget", Number(e.target.value))}
                  className="w-full appearance-none bg-transparent cursor-pointer focus:outline-none h-11 
                             [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-zinc-800 
                             [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-150 [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:active:scale-90 
                             [&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-zinc-800 
                             [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-150 [&::-moz-range-thumb]:hover:scale-125 [&::-moz-range-thumb]:active:scale-90"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Right Side: Roster Suitability Matches */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/8 flex items-center justify-center">
                <Users className="w-4 h-4 text-zinc-400" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-zinc-50">
                Roster Suitability Matches
              </h3>
            </div>
            <span className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase bg-white/[0.03] border border-white/8 px-2 py-1 rounded-full">
              Dynamic Sorting Enabled
            </span>
          </div>

          {/* Candidates Roster Stack */}
          <div className="flex flex-col gap-4">
            <AnimatePresence mode="popLayout">
              {sortedCandidates.map((candidate) => {
                const scoreColor = getScoreColor(candidate.score);
                const radius = 18;
                const circumference = 2 * Math.PI * radius;
                const strokeDashoffset = circumference - (circumference * candidate.score) / 100;

                return (
                  <motion.div
                    key={candidate.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                      mass: 0.8
                    }}
                    className="glass-panel glass-panel-hover rounded-2xl p-5 md:p-6 flex flex-col justify-between group relative overflow-hidden"
                  >
                    {/* Top Row: Info & Circular Progress */}
                    <div className="flex items-start justify-between gap-4">
                      
                      {/* Left: Avatar & Info */}
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr border flex items-center justify-center text-sm font-semibold shrink-0 select-none ${candidate.avatarGradient}`}>
                          {candidate.avatarText}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-zinc-50 tracking-tight">
                            {candidate.name}
                          </h4>
                          <p className="text-xs text-zinc-400 font-medium">
                            {candidate.role}
                          </p>
                        </div>
                      </div>

                      {/* Right: Circular Score Gauge */}
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[9px] font-semibold tracking-[0.1em] uppercase text-zinc-500 block">
                            Suitability
                          </span>
                          <span className="text-xs font-bold text-zinc-200" style={{ color: scoreColor }}>
                            {candidate.score}%
                          </span>
                        </div>
                        <div className="relative w-12 h-12 flex items-center justify-center">
                          <svg className="w-12 h-12 -rotate-90">
                            <circle
                              cx="24"
                              cy="24"
                              r={radius}
                              className="stroke-white/5 fill-transparent"
                              strokeWidth="3"
                            />
                            <circle
                              cx="24"
                              cy="24"
                              r={radius}
                              className="transition-all duration-500 ease-out fill-transparent"
                              stroke={scoreColor}
                              strokeWidth="3"
                              strokeDasharray={circumference}
                              strokeDashoffset={strokeDashoffset}
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>
                      </div>

                    </div>

                    {/* Middle Row: Score breakdown details */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-white/5 text-[11px] text-zinc-400">
                      <div className="flex items-center gap-1" title="Skills & Tools">
                        <Sparkles className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span>Skills: <strong className="text-zinc-200 font-medium">{candidate.baseScores.skills}%</strong></span>
                      </div>
                      <div className="flex items-center gap-1" title="Location & Work Mode">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span>Location: <strong className="text-zinc-200 font-medium">{candidate.baseScores.location}%</strong></span>
                      </div>
                      <div className="flex items-center gap-1" title="Calendar Capacity">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span>Calendar: <strong className="text-zinc-200 font-medium">{candidate.baseScores.calendar}%</strong></span>
                      </div>
                      <div className="flex items-center gap-1" title="Budget Alignment">
                        <DollarSign className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span>Budget: <strong className="text-zinc-200 font-medium">{candidate.baseScores.budget}%</strong></span>
                      </div>
                    </div>

                    {/* Bottom Row: AI Matching Explainer Reasoning */}
                    <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                      <div className="flex flex-col gap-2">
                        {candidate.strengths.map((strength, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-[11px] text-zinc-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#8ECAFF] mt-0.5 shrink-0" />
                            <span className="leading-relaxed">{strength}</span>
                          </div>
                        ))}
                        {candidate.redFlags.map((flag, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-[11px] text-zinc-400">
                            <AlertTriangle className="w-3.5 h-3.5 text-[#CE1C1C] mt-0.5 shrink-0" />
                            <span className="leading-relaxed">{flag}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
