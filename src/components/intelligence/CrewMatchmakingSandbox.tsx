"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Sliders,
  MapPin,
  Calendar as CalendarIcon,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  UserPlus,
  RefreshCw,
  Users,
  Search,
  Check,
  Send,
  HelpCircle
} from "lucide-react";

// Standard cinematic easing
const easeCinematic = [0.16, 1, 0.3, 1] as [number, number, number, number];

// Candidate structure
interface BaseScores {
  skills: number;
  location: number;
  capacity: number;
  budget: number;
}

interface Candidate {
  id: string;
  name: string;
  role: string;
  avatarText: string;
  avatarColor: string;
  baseScores: BaseScores;
  skillsList: string[];
  capacityLabel: string;
  locationLabel: string;
  rateLabel: string;
  holdStatus: "none" | "conflict" | "minor";
  holdDetails: string;
  strengths: string[];
  redFlags: string[];
}

const INITIAL_CANDIDATES: Candidate[] = [
  {
    id: "sarah-chen",
    name: "Sarah Chen",
    role: "Lead Motion Designer",
    avatarText: "SC",
    avatarColor: "from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30",
    baseScores: {
      skills: 98,
      location: 30, // Remote-only (Vancouver-based, physical shoot is NYC)
      capacity: 95, // Open schedule
      budget: 82  // Slightly above target rate ($85/hr vs $75/hr target)
    },
    skillsList: ["After Effects", "Cinema 4D", "Unreal Engine 5", "3D Modeling"],
    capacityLabel: "32 hrs free / 40h max capacity",
    locationLabel: "Vancouver (Remote Only)",
    rateLabel: "$85 / hr",
    holdStatus: "none",
    holdDetails: "No active calendar holds",
    strengths: [
      "Expert-level Cinema 4D and Unreal Engine 5 mastery",
      "Excellent timezone communication overlap"
    ],
    redFlags: [
      "Remote status excludes physical studio tracking",
      "Rate is 13% above target hourly budget"
    ]
  },
  {
    id: "marcus-vance",
    name: "Marcus Vance",
    role: "Cinematographer",
    avatarText: "MV",
    avatarColor: "from-blue-500/20 to-cyan-500/20 text-blue-300 border-blue-500/30",
    baseScores: {
      skills: 92,
      location: 98, // NYC local
      capacity: 45, // Tight calendar
      budget: 95  // Excellent rate alignment ($70/hr vs $7 target)
    },
    skillsList: ["Cinema Cameras", "RED V-Raptor", "Macro Lensing", "Studio Lighting"],
    capacityLabel: "8 hrs free / 40h max capacity",
    locationLabel: "New York City (Local)",
    rateLabel: "$70 / hr",
    holdStatus: "conflict",
    holdDetails: "Active Conflict: June 29 - July 1 (Sensa Agency Hold)",
    strengths: [
      "NYC Local (eliminates travel & accommodation fees)",
      "Owns & operates RED V-Raptor camera kit",
      "Below target slot rate"
    ],
    redFlags: [
      "Major booking conflicts on critical weekdays",
      "Requires 10-day advance lock notice"
    ]
  },
  {
    id: "elena-rostova",
    name: "Elena Rostova",
    role: "Senior Video Editor",
    avatarText: "ER",
    avatarColor: "from-amber-500/20 to-red-500/20 text-amber-300 border-amber-500/30",
    baseScores: {
      skills: 95,
      location: 75, // Boston, hybrid
      capacity: 88, // Mostly open
      budget: 45  // Significant budget overage ($115/hr)
    },
    skillsList: ["DaVinci Resolve", "Color Grading", "Premiere Pro", "Speed Ramps"],
    capacityLabel: "25 hrs free / 40h max capacity",
    locationLabel: "Boston (Hybrid Overlap)",
    rateLabel: "$115 / hr",
    holdStatus: "minor",
    holdDetails: "Minor Option Hold: July 3",
    strengths: [
      "Senior grading specialist with 8+ years experience",
      "Completed 12 consecutive platform milestones"
    ],
    redFlags: [
      "Hourly rate exceeds target budget by 53%",
      "Requires high-speed remote render node setups"
    ]
  },
  {
    id: "david-kim",
    name: "David Kim",
    role: "Gaffer",
    avatarText: "DK",
    avatarColor: "from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30",
    baseScores: {
      skills: 88,
      location: 95, // NYC local
      capacity: 92, // Wide open
      budget: 90  // Spot on budget ($75/hr)
    },
    skillsList: ["Studio Lighting", "DMX Boards", "Aputure Systems", "Rigging"],
    capacityLabel: "35 hrs free / 40h max capacity",
    locationLabel: "New York City (Local)",
    rateLabel: "$75 / hr",
    holdStatus: "none",
    holdDetails: "No active calendar holds",
    strengths: [
      "NYC Local with own vehicle",
      "Expert knowledge of LED/DMX setups",
      "Fits the target budget slot perfectly"
    ],
    redFlags: [
      "Requires specialized generator hire for outdoor sets"
    ]
  }
];

const PRESETS = [
  {
    name: "Balanced Fit",
    weights: { skills: 50, location: 50, capacity: 50, budget: 50 }
  },
  {
    name: "Remote Post-Production",
    weights: { skills: 95, location: 15, capacity: 70, budget: 45 }
  },
  {
    name: "Local Studio Shoot",
    weights: { skills: 60, location: 95, capacity: 50, budget: 60 }
  },
  {
    name: "Budget Conscious",
    weights: { skills: 40, location: 35, capacity: 40, budget: 98 }
  }
];

interface Invitation {
  id: string;
  name: string;
  role: string;
  status: "sending" | "pending" | "accepted";
  timestamp: string;
}

export default function CrewMatchmakingSandbox() {
  const [weights, setWeights] = useState({
    skills: 60,
    location: 50,
    capacity: 70,
    budget: 40
  });

  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("All Roles");
  const [selectedCandidateCalendar, setSelectedCandidateCalendar] = useState<Candidate | null>(null);

  // Apply slider presets
  const handlePresetClick = (presetWeights: typeof weights) => {
    setWeights(presetWeights);
  };

  const handleWeightChange = (key: keyof typeof weights, value: number) => {
    setWeights(prev => ({ ...prev, [key]: value }));
  };

  const resetSliders = () => {
    setWeights({ skills: 50, location: 50, capacity: 50, budget: 50 });
  };

  // Suitability algorithm calculation
  const getSuitabilityScore = (candidate: Candidate) => {
    const totalWeight = weights.skills + weights.location + weights.capacity + weights.budget;
    if (totalWeight === 0) return 0;

    const weightedSum =
      weights.skills * candidate.baseScores.skills +
      weights.location * candidate.baseScores.location +
      weights.capacity * candidate.baseScores.capacity +
      weights.budget * candidate.baseScores.budget;

    return Math.round(weightedSum / totalWeight);
  };

  // Dispatch invitation mock
  const dispatchInvitation = (candidate: Candidate) => {
    const isAlreadyInvited = invitations.some(inv => inv.id === candidate.id);
    if (isAlreadyInvited) return;

    const newInvite: Invitation = {
      id: candidate.id,
      name: candidate.name,
      role: candidate.role,
      status: "sending",
      timestamp: "Just now"
    };

    setInvitations(prev => [newInvite, ...prev]);

    // Simulated network delay to show pending hold status
    setTimeout(() => {
      setInvitations(prev =>
        prev.map(inv =>
          inv.id === candidate.id ? { ...inv, status: "pending" } : inv
        )
      );
    }, 1200);

    // Final acceptance simulation
    setTimeout(() => {
      setInvitations(prev =>
        prev.map(inv =>
          inv.id === candidate.id ? { ...inv, status: "accepted" } : inv
        )
      );
    }, 3000);
  };

  // Filter candidates
  const filteredCandidates = candidates
    .filter(c => selectedRole === "All Roles" || c.role === selectedRole)
    .map(c => ({
      ...c,
      suitabilityScore: getSuitabilityScore(c)
    }))
    .sort((a, b) => b.suitabilityScore - a.suitabilityScore);

  // Auto-select first candidate on mount and filter changes
  useEffect(() => {
    if (filteredCandidates.length > 0) {
      const currentId = selectedCandidateCalendar?.id;
      const isStillMatch = filteredCandidates.some(c => c.id === currentId);
      if (!isStillMatch) {
        setSelectedCandidateCalendar(filteredCandidates[0]);
      }
    } else {
      setSelectedCandidateCalendar(null);
    }
  }, [selectedRole, candidates, selectedCandidateCalendar?.id]);

  return (
    <div className="w-full relative z-10 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Interactive Weights Controller & Filters */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          <div className="glass-panel rounded-2xl p-5 md:p-6 border border-white/5 bg-zinc-950/20 backdrop-blur-md flex flex-col space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
                  Matchmaker Scoring
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] uppercase font-bold tracking-wider">
                  3.8x Match Speed
                </span>
              </div>
              <h3 className="text-base font-semibold text-white tracking-tight mt-1">Suitability Index Matrix</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Adjust sliders to re-calculate matching indices in real-time based on your priority criteria.
              </p>
            </div>

            {/* Presets Grid */}
            <div className="space-y-2">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold">Priority Presets</span>
              <div className="grid grid-cols-2 gap-1.5">
                {PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePresetClick(preset.name === "Balanced Fit" ? { skills: 50, location: 50, capacity: 50, budget: 50 } : preset.weights)}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/5 text-[10px] text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all text-left cursor-pointer truncate"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Matrix Sliders */}
            <div className="space-y-4 pt-2 border-t border-white/5">
              {[
                { key: "skills", label: "Technical Skill Fit", desc: "Synonyms & software mastery", val: weights.skills },
                { key: "location", label: "Location & Mode Fit", desc: "On-site local vs remote overlap", val: weights.location },
                { key: "capacity", label: "Calendar Capacity Fit", desc: "Real-time unbooked hours", val: weights.capacity },
                { key: "budget", label: "Budget Alignment", desc: "Rate vs target slot cap", val: weights.budget }
              ].map(slider => (
                <div key={slider.key} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <div>
                      <span className="font-semibold text-zinc-300 block">{slider.label}</span>
                      <span className="text-[10px] text-zinc-500 font-normal">{slider.desc}</span>
                    </div>
                    <span className="font-mono text-zinc-400 font-bold">{slider.val}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={slider.val}
                    onChange={(e) => handleWeightChange(slider.key as any, parseInt(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                </div>
              ))}
            </div>

            {/* Reset Button */}
            <div className="flex justify-end pt-2 border-t border-white/5">
              <button
                onClick={resetSliders}
                className="btn-ghost flex items-center space-x-1.5 px-3 py-1 text-xs text-zinc-500 hover:text-white"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Sliders</span>
              </button>
            </div>
          </div>


        </div>

        {/* Right Column: Candidate Matches list */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          <div className="glass-panel rounded-2xl p-5 md:p-6 border border-white/5 bg-zinc-950/20 backdrop-blur-md flex flex-col space-y-5">
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-white/5">
              <div>
                <h3 className="text-base font-semibold text-white">Roster Matches</h3>
                <span className="text-[10px] text-zinc-500">Sorted dynamically by weighted suitability</span>
              </div>

              {/* Role filter buttons */}
              <div className="flex flex-wrap gap-1.5">
                {["All Roles", "Lead Motion Designer", "Cinematographer", "Senior Video Editor", "Gaffer"].map(role => (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`px-3 py-1 rounded-full border text-[10px] font-medium cursor-pointer transition-all ${
                      selectedRole === role
                        ? "bg-white text-black border-white"
                        : "bg-white/[0.02] border-white/5 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {role === "All Roles" ? "All" : role.replace("Senior ", "").replace("Lead ", "")}
                  </button>
                ))}
              </div>
            </div>

            {/* Candidate List Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {filteredCandidates.map(candidate => {
                  const isInvited = invitations.find(inv => inv.id === candidate.id);
                  return (
                    <motion.div
                      key={candidate.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4, ease: easeCinematic }}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                        selectedCandidateCalendar?.id === candidate.id
                          ? "border-white/20 bg-white/[0.03]"
                          : "border-white/5 bg-black/15 hover:border-white/10"
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          {/* Avatar & Basic Info */}
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <div className={`w-9 h-9 rounded-full border bg-gradient-to-br flex items-center justify-center font-bold text-[10px] shrink-0 ${candidate.avatarColor}`}>
                              {candidate.avatarText}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-semibold text-white truncate">{candidate.name}</h4>
                              <span className="text-[10px] text-zinc-400 block truncate">{candidate.role}</span>
                            </div>
                          </div>

                          {/* Suitability Score Dial */}
                          <div className="flex flex-col items-end shrink-0">
                            <span className="text-[9px] text-zinc-500 font-semibold tracking-wider uppercase">Suitability</span>
                            <span className={`text-base font-bold font-mono ${
                              candidate.suitabilityScore >= 90
                                ? "text-emerald-400"
                                : candidate.suitabilityScore >= 75
                                  ? "text-amber-400"
                                  : "text-zinc-400"
                            }`}>
                              {candidate.suitabilityScore}%
                            </span>
                          </div>
                        </div>

                        {/* Sub-Parameters Breakdowns */}
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-b border-white/5 py-2.5 my-2.5 text-[10px] text-zinc-400">
                          <div className="flex justify-between pr-1.5 border-r border-white/5">
                            <span className="text-zinc-500">Skills</span>
                            <span className="font-semibold text-zinc-300">{candidate.baseScores.skills}%</span>
                          </div>
                          <div className="flex justify-between pl-1.5">
                            <span className="text-zinc-500">Rate</span>
                            <span className="font-semibold text-zinc-300">{candidate.rateLabel}</span>
                          </div>
                          <div className="flex justify-between pr-1.5 border-r border-white/5">
                            <span className="text-zinc-500">Location</span>
                            <span 
                              className="font-semibold text-zinc-300 truncate max-w-[80px]" 
                              title={candidate.locationLabel}
                            >
                              {candidate.locationLabel.replace("New York City (Local)", "NYC Local").replace("Vancouver (Remote Only)", "Vancouver (Remote)").replace("Boston (Hybrid Overlap)", "Boston (Hybrid)")}
                            </span>
                          </div>
                          <div className="flex justify-between pl-1.5">
                            <span className="text-zinc-500">Calendar</span>
                            <button
                              onClick={() => setSelectedCandidateCalendar(candidate)}
                              className="font-semibold text-zinc-300 hover:text-white underline cursor-pointer truncate max-w-[80px] text-left block"
                              title={candidate.capacityLabel}
                            >
                              {candidate.capacityLabel.split(" / ")[0]}
                            </button>
                          </div>
                        </div>

                        {/* Strengths / Concerns */}
                        <div className="space-y-1.5 my-1">
                          <div className="flex items-center space-x-1.5 text-[10px] text-zinc-400">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="truncate text-zinc-300" title={candidate.strengths[0]}>{candidate.strengths[0]}</span>
                          </div>

                          {candidate.holdStatus !== "none" && (
                            <div className="flex items-center space-x-1.5 text-amber-400 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10 text-[9px] min-w-0">
                              <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                              <span className="truncate text-amber-300/90 font-medium" title={candidate.holdDetails}>
                                {candidate.holdDetails}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-2">
                        <button
                          onClick={() => setSelectedCandidateCalendar(candidate)}
                          className="btn-ghost text-[9px] text-zinc-500 hover:text-white px-2 py-0.5"
                        >
                          Check Schedule
                        </button>

                        <button
                          disabled={!!isInvited}
                          onClick={() => dispatchInvitation(candidate)}
                          className={`flex items-center space-x-1 py-0.5 px-2.5 text-[9px] font-semibold rounded-full border transition-all cursor-pointer ${
                            isInvited?.status === "accepted"
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                              : isInvited?.status === "pending"
                                ? "bg-white/[0.04] border-white/10 text-amber-400"
                                : "bg-white text-black border-white hover:bg-zinc-200"
                          }`}
                        >
                          {isInvited?.status === "accepted" ? (
                            <>
                              <Check className="w-2.5 h-2.5 text-current" />
                              <span>Hold Booked</span>
                            </>
                          ) : isInvited?.status === "pending" ? (
                            <>
                              <Clock className="w-2.5 h-2.5 text-current" />
                              <span>Hold Pending</span>
                            </>
                          ) : isInvited?.status === "sending" ? (
                            <>
                              <RefreshCw className="w-2.5 h-2.5 text-current animate-spin" />
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-2.5 h-2.5 text-current" />
                              <span>Invite</span>
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Invitation Dispatches Feed */}
          {invitations.length > 0 && (
            <div className="glass-panel rounded-2xl p-5 border border-white/5 bg-zinc-950/20 backdrop-blur-md flex flex-col space-y-4">
              <div>
                <span className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
                  Invitation Feed
                </span>
                <h4 className="text-sm font-semibold text-white mt-1">Live Hold Dispatches</h4>
              </div>

              <div className="space-y-2">
                {invitations.map(inv => (
                  <div key={inv.id} className="flex justify-between items-center bg-white/[0.01] p-3 rounded-lg border border-white/5 text-xs">
                    <div>
                      <span className="font-semibold text-zinc-300 block">{inv.name}</span>
                      <span className="text-[10px] text-zinc-500 block">{inv.role}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] text-zinc-500 font-mono">{inv.timestamp}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        inv.status === "accepted"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : inv.status === "pending"
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-white/5 text-zinc-400"
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Live Capacity Synchronization Calendar Overlay Preview */}
        {selectedCandidateCalendar && (
          <div className="lg:col-span-12">
            <div className="glass-panel rounded-2xl p-5 md:p-6 border border-white/5 bg-zinc-950/20 backdrop-blur-md flex flex-col space-y-4">
              <div>
                <span className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
                  Live Capacity Sync Check
                </span>
                <h4 className="text-sm font-semibold text-white mt-1">Calendar Hold (Weekly view)</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Visual preview of <strong>Project Work Capacity Hold</strong> showing on {selectedCandidateCalendar.name}'s calendar:
                </p>
              </div>

              {/* Weekly calendar simulation */}
              <div className="rounded-lg border border-white/5 bg-black/40 overflow-hidden font-sans text-xs">
                <div className="grid grid-cols-7 border-b border-white/5 bg-zinc-950/50 p-2 text-center text-[10px] text-zinc-500 uppercase font-semibold">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>
                
                {/* Hold Banner Representation */}
                <div className="relative p-2 h-20 flex flex-col justify-between">
                  <div className="bg-[#8ECAFF]/10 border border-[#8ECAFF]/20 text-[#8ECAFF] px-2 py-1 rounded text-[9px] font-medium tracking-wide flex items-center justify-between">
                    <span>⚡ Project Work Capacity Hold (15h)</span>
                    <span className="text-[9px] opacity-75">All-day banner</span>
                  </div>
                  
                  <div className="grid grid-cols-7 text-center text-[10px] text-zinc-600 font-mono">
                    <span>29</span>
                    <span>30</span>
                    <span>01</span>
                    <span>02</span>
                    <span>03</span>
                    <span>04</span>
                    <span>05</span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-zinc-500 leading-normal flex items-start space-x-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span>Freelancer retains full control of daily hours. Roster synchronizes availability automatically.</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
