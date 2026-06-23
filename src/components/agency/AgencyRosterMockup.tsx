"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Search, 
  Sparkles, 
  Sliders, 
  Check, 
  UserCheck, 
  DollarSign, 
  TrendingUp, 
  Award,
  CircleDot,
  Loader2
} from "lucide-react";

interface CrewMember {
  id: string;
  name: string;
  role: string;
  dept: "Creative" | "Production" | "Post-Production" | "Assets";
  suitability: number;
  rate: number;
  status: "Available" | "Hold" | "Booked";
  skills: string[];
  isShortlisted?: boolean;
}

export default function AgencyRosterMockup() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("All");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedText, setOptimizedText] = useState("");
  const [roster, setRoster] = useState<CrewMember[]>([
    { id: "CR-01", name: "Sarah Connor", role: "Creative Director", dept: "Creative", suitability: 95, rate: 850, status: "Available", skills: ["Branding", "Pitching", "Typography"] },
    { id: "CR-02", name: "Vesper Lin", role: "3D Motion Designer", dept: "Post-Production", suitability: 98, rate: 700, status: "Available", skills: ["3D Animation", "Octane Render", "Cinema4D"] },
    { id: "CR-03", name: "John Doe", role: "Director of Photography", dept: "Production", suitability: 92, rate: 1000, status: "Booked", skills: ["Arri Alexa", "Lighting", "Storyboarding"] },
    { id: "CR-04", name: "Leo Vance", role: "Lead Video Editor", dept: "Post-Production", suitability: 90, rate: 600, status: "Hold", skills: ["Premiere Pro", "Color Grading", "Sound Sync"] },
    { id: "CR-05", name: "Emma Helix", role: "Copywriter & Concept Lead", dept: "Creative", suitability: 96, rate: 500, status: "Available", skills: ["Gen Z Copy", "Social Briefs", "Scriptwriting"] },
    { id: "CR-06", name: "Marcus Aurelius", role: "Production Coordinator", dept: "Production", suitability: 87, rate: 450, status: "Available", skills: ["Logistics", "Scheduling", "SAG Compliance"] },
    { id: "AS-01", name: "Vesper Studio Stage 4", role: "Production Stage", dept: "Assets", suitability: 100, rate: 1500, status: "Available", skills: ["Acoustic Treatment", "Grid Lighting", "Grid Power"] },
    { id: "AS-02", name: "Red Raptor 8K Package", role: "Camera Package", dept: "Assets", suitability: 95, rate: 600, status: "Hold", skills: ["8K Sensor", "Prime Lenses", "Wireless Video"] }
  ]);

  const depts = ["All", "Creative", "Production", "Post-Production", "Assets"];

  const handleToggleShortlist = (id: string) => {
    setRoster(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, isShortlisted: !m.isShortlisted };
      }
      return m;
    }));
  };

  const handleRunOptimizer = () => {
    setIsOptimizing(true);
    setOptimizedText("Analyzing core brief skills...");
    
    setTimeout(() => {
      setOptimizedText("Checking contractor day rates and availability schedules...");
    }, 600);

    setTimeout(() => {
      setOptimizedText("Finalizing optimal crewing matrix...");
    }, 1200);

    setTimeout(() => {
      setRoster(prev => prev.map(m => {
        // Automatically shortlist the best matches that are available or hold
        if (m.id === "CR-01" || m.id === "CR-02" || m.id === "CR-05" || m.id === "AS-01") {
          return { ...m, isShortlisted: true, status: "Hold" };
        }
        return { ...m, isShortlisted: false };
      }));
      setIsOptimizing(false);
    }, 1800);
  };

  const filteredRoster = roster.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDept = selectedDept === "All" || m.dept === selectedDept;
    return matchesSearch && matchesDept;
  });

  const shortlistedCrew = roster.filter(m => m.isShortlisted);
  const totalDayRate = shortlistedCrew.reduce((acc, curr) => acc + curr.rate, 0);
  const avgSuitability = shortlistedCrew.length > 0 
    ? Math.round(shortlistedCrew.reduce((acc, curr) => acc + curr.suitability, 0) / shortlistedCrew.length)
    : 0;

  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl border border-white/5 bg-zinc-950/40 p-4 sm:p-6 lg:p-8 backdrop-blur-xl relative overflow-visible">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[300px] bg-zinc-800/[0.015] rounded-full filter blur-[80px] pointer-events-none -z-10" />

      {/* Roster Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:max-w-xl">
          {/* Search Box */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search crew, skills, gear..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-white/5 rounded-full pl-9 pr-4 text-xs text-white outline-none focus:border-white/10 min-h-[44px]"
            />
          </div>
          
          {/* Department Filter Tabs */}
          <div className="flex gap-1 overflow-x-auto whitespace-nowrap scrollbar-none max-w-full">
            {depts.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDept(d)}
                className={`px-3.5 rounded-full text-xs font-semibold cursor-pointer transition-all duration-200 min-h-[44px] flex items-center justify-center shrink-0 ${
                  selectedDept === d
                    ? "bg-white text-black"
                    : "bg-white/5 text-zinc-400 hover:text-zinc-200 border border-white/5"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Optimizer Action */}
        <button
          onClick={handleRunOptimizer}
          disabled={isOptimizing}
          className="btn-primary shrink-0 flex items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold min-h-[44px] px-4"
        >
          {isOptimizing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Optimizing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-black" />
              <span>AI Roster Matcher</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Column: Roster List */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <div className="flex justify-between items-center px-1 gap-2">
            <span className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase font-mono truncate">
              Roster database ({filteredRoster.length} matches)
            </span>
            <span className="text-[9px] text-zinc-400 font-mono md:hidden shrink-0 animate-pulse">
              Swipe to view →
            </span>
            <span className="text-[9px] text-zinc-400 hidden md:block font-mono shrink-0">
              Click ROW to shortlist crew asset
            </span>
          </div>

          <div className="border border-white/5 rounded-xl bg-zinc-950/30 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-zinc-950/40 text-[9px] uppercase tracking-wider font-semibold text-zinc-500 font-mono">
                    <th className="px-4 py-3">Asset / Contractor</th>
                    <th className="px-4 py-3">Dept</th>
                    <th className="px-3 py-3 text-center">Match Index</th>
                    <th className="px-4 py-3">Day Rate</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans text-zinc-300">
                  {filteredRoster.map((m) => (
                    <tr 
                      key={m.id} 
                      onClick={() => handleToggleShortlist(m.id)}
                      className={`hover:bg-white/[0.01] transition-all cursor-pointer ${
                        m.isShortlisted ? "bg-white/[0.02]" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${m.isShortlisted ? "bg-white" : "bg-transparent border border-white/30"}`} />
                          <div>
                            <div className="font-semibold text-white flex items-center gap-1.5">
                              {m.name}
                              {m.isShortlisted && (
                                <span className="text-[8px] bg-white text-black font-mono font-bold px-1 py-0.2 rounded uppercase">
                                  Shortlisted
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-zinc-500">{m.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 font-mono text-[10px]">{m.dept}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`font-mono font-bold text-xs ${
                          m.suitability >= 95 ? "text-emerald-400" : m.suitability >= 90 ? "text-zinc-300" : "text-zinc-500"
                        }`}>
                          {m.suitability}%
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-white font-semibold">
                        ${m.rate}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-mono font-medium ${
                          m.status === "Available"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : m.status === "Hold"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-zinc-800 text-zinc-500 border border-white/5"
                        }`}>
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: AI Optimization Panel & Summary */}
        <div className="lg:col-span-4 flex flex-col rounded-xl border border-white/5 bg-zinc-950/20 p-5 justify-between relative overflow-hidden">
          
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="font-mono text-[10px] tracking-widest text-zinc-400 font-semibold uppercase flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" /> Shortlist Allocation
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                {shortlistedCrew.length} Selected
              </span>
            </div>

            {/* AI Optimization progress */}
            {isOptimizing ? (
              <div className="h-48 flex flex-col items-center justify-center text-center space-y-3">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
                <div className="space-y-1">
                  <p className="text-xs text-white font-semibold font-mono">AI Roster Matcher Running</p>
                  <p className="text-[10px] text-zinc-500 animate-pulse">{optimizedText}</p>
                </div>
              </div>
            ) : shortlistedCrew.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/5 rounded-lg bg-zinc-950/20">
                <Users className="w-8 h-8 text-zinc-600 mb-3 animate-pulse" />
                <p className="text-xs font-semibold text-zinc-300 font-sans mb-1">Roster Allocation Empty</p>
                <p className="text-[11px] text-zinc-500 leading-normal">
                  Click on crew records to manually allocate them, or use the **AI Roster Matcher** to auto-select optimal members.
                </p>
              </div>
            ) : (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {/* Financial & Skill aggregation */}
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3 rounded-lg border border-white/5 bg-zinc-950/40 space-y-1">
                      <span className="text-[9px] uppercase tracking-wider font-mono text-zinc-500 block">Total Roster Rate</span>
                      <span className="text-sm font-semibold text-white font-mono flex items-center">
                        <DollarSign className="w-3.5 h-3.5 text-zinc-500" />
                        {totalDayRate.toLocaleString()}/d
                      </span>
                    </div>
                    <div className="p-3 rounded-lg border border-white/5 bg-zinc-950/40 space-y-1">
                      <span className="text-[9px] uppercase tracking-wider font-mono text-zinc-500 block">Avg. Match Score</span>
                      <span className="text-sm font-semibold text-zinc-300 font-mono flex items-center">
                        <TrendingUp className="w-3.5 h-3.5 text-zinc-500 mr-1" />
                        {avgSuitability}%
                      </span>
                    </div>
                  </div>

                  {/* List of shortlists */}
                  <div className="space-y-2">
                    <span className="text-[9px] uppercase font-mono tracking-wider text-zinc-500 block">Shortlisted Assets</span>
                    <div className="space-y-1.5 text-xs max-h-[160px] overflow-y-auto pr-1">
                      {shortlistedCrew.map((c) => (
                        <div key={c.id} className="flex items-center justify-between p-2 rounded bg-zinc-950/60 border border-white/5">
                          <div>
                            <span className="font-semibold text-zinc-200 block">{c.name}</span>
                            <span className="text-[10px] text-zinc-500">{c.role}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-white font-mono font-semibold block">${c.rate}/d</span>
                            <span className="text-[9px] font-mono text-emerald-400 font-medium">{c.suitability}% Match</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {shortlistedCrew.length > 0 && !isOptimizing && (
            <div className="pt-6 border-t border-white/5 mt-6">
              <button
                onClick={() => {
                  alert("Roster shortlist locked! Invites dispatched to the 4 shortlisted contractors via SMS & Portal.");
                }}
                className="btn-glass w-full min-h-[44px] text-xs flex items-center justify-center gap-1.5 cursor-pointer font-sans"
              >
                <UserCheck className="w-4 h-4" />
                <span>Lock Shortlist & Dispatch Invites</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
