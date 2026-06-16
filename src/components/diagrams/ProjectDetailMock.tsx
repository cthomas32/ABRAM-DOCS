"use client";

import React, { useState } from "react";
import * as LucideIcons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProjectDetailMock() {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "tasks", label: "Tasks" },
    { id: "timeline", label: "Timeline" },
    { id: "team", label: "Team" },
    { id: "financial", label: "Financial" },
    { id: "documents", label: "Documents" },
  ];

  // Mock Data
  const workPackages = [
    {
      id: "wp-1",
      name: "🎥 Pre-Production Scoping",
      status: "completed",
      progress: 100,
      budget: 6500,
      tasks: [
        { id: "t1", name: "Creative Brief & Director's Treatment", status: "Completed", assignee: "Amelia L.", date: "Jun 15" },
        { id: "t2", name: "Location Scouting & Permits", status: "Completed", assignee: "Marcus C.", date: "Jun 18" },
        { id: "t3", name: "Storyboard & Casting Approvals", status: "Completed", assignee: "Amelia L.", date: "Jun 20" },
      ]
    },
    {
      id: "wp-2",
      name: "🎬 Production Shooting",
      status: "in_progress",
      progress: 60,
      budget: 12000,
      tasks: [
        { id: "t4", name: "Principal Photography - Day 1 & 2", status: "Completed", assignee: "Marcus C.", date: "Jun 24" },
        { id: "t5", name: "Specialized Crew Bookings", status: "Completed", assignee: "Amelia L.", date: "Jun 25" },
        { id: "t6", name: "Drone & B-Roll Capture", status: "In Progress", assignee: "Marcus C.", date: "Jun 28" },
      ]
    },
    {
      id: "wp-3",
      name: "🎞️ Post-Production Edit",
      status: "planning",
      progress: 0,
      budget: 6500,
      tasks: [
        { id: "t7", name: "Rough Cut & Audio Assembly", status: "Pending", assignee: "Sarah J.", date: "Jul 10" },
        { id: "t8", name: "Color Grading & Sound Design", status: "Pending", assignee: "David K.", date: "Jul 18" },
        { id: "t9", name: "Final Client Signoff & Delivery", status: "Pending", assignee: "Amelia L.", date: "Jul 25" },
      ]
    }
  ];

  const teamMembers = [
    { name: "Amelia Lewis", role: "Executive Producer", status: "Active", rate: "$850/day", email: "amelia@abram.test", capacity: 80 },
    { name: "Marcus Chen", role: "Director of Photography", status: "Active", rate: "$1,200/day", email: "marcus@abram.test", capacity: 100 },
    { name: "Sarah Jenkins", role: "Lead Editor", status: "Hold", rate: "$700/day", email: "sarah@abram.test", capacity: 0 },
    { name: "David K.", role: "Sound Designer", status: "Pending", rate: "$600/day", email: "david@abram.test", capacity: 0 },
  ];

  const financialItems = [
    { category: "Camera Hire", budget: "$6,500", spent: "$6,500", status: "Paid" },
    { category: "Location Permits", budget: "$2,000", spent: "$1,800", status: "Paid" },
    { category: "Freelancer Rates", budget: "$12,000", spent: "$7,200", status: "Incurred" },
    { category: "Catering & Travel", budget: "$1,500", spent: "$1,200", status: "Approved" },
    { category: "Post Studio", budget: "$3,000", spent: "$0", status: "Pending" },
  ];

  const documents = [
    { name: "creative_brief_v2.pdf", size: "12.4 MB", uploadedBy: "Amelia L.", date: "Jun 14", aiIndexed: true },
    { name: "director_treatment_final.pdf", size: "8.1 MB", uploadedBy: "Marcus C.", date: "Jun 16", aiIndexed: true },
    { name: "storyboard_rev4.pdf", size: "24.2 MB", uploadedBy: "Amelia L.", date: "Jun 19", aiIndexed: false },
    { name: "location_permits_approved.pdf", size: "2.4 MB", uploadedBy: "Amelia L.", date: "Jun 22", aiIndexed: true },
  ];

  const getStatusColor = (status: string) => {
    const colors = {
      planning: 'bg-gray-500/20 border-gray-500/30 text-gray-300',
      in_progress: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
      on_hold: 'bg-amber-500/20 border-amber-500/30 text-amber-300',
      completed: 'bg-green-500/20 border-green-500/30 text-green-300',
    };
    return colors[status as keyof typeof colors] || colors.planning;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      planning: 'Planning',
      in_progress: 'In Progress',
      on_hold: 'On Hold',
      completed: 'Completed',
    };
    return labels[status as keyof typeof labels] || 'Planning';
  };

  return (
    <div className="my-8 w-full border border-white/5 rounded-2xl bg-[#0e0e0e] shadow-2xl relative font-sans text-[#fafaf9]">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 pointer-events-none rounded-2xl" />

      {/* Main Container - Scaled up natively via padding and text sizes for "Zoomed-in" feeling */}
      <div className="p-6 md:p-8 space-y-6 relative z-10">
        
        {/* 1. Compact Header */}
        <div className="space-y-3">
          {/* Back button */}
          <button className="text-gray-400 hover:text-white flex items-center gap-2 text-[13px] font-medium outline-none">
            <LucideIcons.ArrowLeft size={16} />
            <span>Back to Projects</span>
          </button>

          {/* Title and controls */}
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold text-white tracking-tight">Commercial Video Campaign</h1>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-xs rounded-xl border font-medium uppercase tracking-wider ${getStatusColor("planning")}`}>
                {getStatusLabel("planning")}
              </span>
              <button className="h-9 w-9 p-0 rounded-lg border border-white/5 flex items-center justify-center hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                <LucideIcons.MoreHorizontal size={16} />
              </button>
            </div>
          </div>

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
            <span>Budget: <span className="text-white font-medium">$25,000</span></span>
            <span className="text-gray-600">|</span>
            <span className="flex items-center gap-1.5">
              <LucideIcons.CalendarDays size={14} />
              <span>Due: <span className="text-white font-medium">Jul 30, 2026</span></span>
            </span>
            <span className="text-gray-600">|</span>
            <span>Team: <span className="text-white font-medium">4 members</span></span>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 font-medium">Project Progress</span>
              <span className="text-white font-bold">68%</span>
            </div>
            <div className="w-full bg-white/[0.05] h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-full w-[68%]" />
            </div>
          </div>
        </div>

        {/* 2. Tab Navigation */}
        <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-1">
          <div className="bg-[#141414] border border-[#27272a] rounded-full p-1 inline-flex gap-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap px-4 py-1.5 text-[13px] rounded-full font-medium transition-all duration-200 outline-none ${
                    isActive
                      ? "bg-[#27272a]/80 text-white shadow-sm font-semibold"
                      : "text-[#a1a1aa] hover:text-white hover:bg-[#27272a]/30"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Tab Content Area */}
        <div className="min-h-[340px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="w-full space-y-6"
            >
              
              {/* --- OVERVIEW TAB --- */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Project Info Strip */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] gap-3">
                    {/* Description */}
                    <div className="backdrop-blur-xl bg-[#121212]/80 border border-white/5 rounded-2xl p-4 min-h-[72px] flex flex-col justify-start">
                      <div className="flex items-center gap-2 mb-1.5">
                        <LucideIcons.FileText className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Description</span>
                      </div>
                      <p className="text-[13px] text-[#fafaf9]/85 leading-relaxed font-light">
                        Commercial video campaign promoting our summer launch. Managing timelines, talent booking, and editing stages.
                      </p>
                    </div>

                    {/* AI Update */}
                    <div className="backdrop-blur-xl bg-[#141414]/90 border border-[#27272a]/60 rounded-2xl p-4 flex flex-col relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-center justify-between mb-2 relative z-10">
                        <div className="flex items-center gap-2">
                          <LucideIcons.Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                          <span className="text-[10px] text-fuchsia-400/80 uppercase tracking-widest font-semibold">AI Update</span>
                        </div>
                        <button className="h-6 px-2 text-[10px] text-fuchsia-400 hover:text-fuchsia-300 font-medium hover:bg-fuchsia-400/10 rounded-md transition-colors flex items-center gap-1">
                          <LucideIcons.RefreshCw size={10} />
                          <span>Regenerate</span>
                        </button>
                      </div>
                      <div className="relative z-10 flex-1">
                        <p className="text-[13px] text-gray-300 leading-snug font-light">
                          Shoot schedule fully optimized. Drone permits verified. Rough Cut draft scheduled for editor review.
                        </p>
                      </div>
                    </div>

                    {/* Stacked meta cards */}
                    <div className="flex flex-col gap-3 md:min-w-[200px]">
                      <div className="backdrop-blur-xl bg-[#121212]/80 border border-white/5 rounded-2xl px-4 py-3 flex items-start gap-3">
                        <LucideIcons.Hash className="w-3.5 h-3.5 text-gray-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block leading-none mb-1">Project #</span>
                          <span className="text-sm text-[#fafaf9] font-mono tracking-wide font-medium">WP-48201</span>
                        </div>
                      </div>
                      <div className="backdrop-blur-xl bg-[#121212]/80 border border-white/5 rounded-2xl px-4 py-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <LucideIcons.Tag className="w-3.5 h-3.5 text-gray-500" />
                          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Tags</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-gray-400 font-medium">
                            Commercial
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-gray-400 font-medium">
                            Video
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Gantt Timeline Overview */}
                  <div className="bg-[#121212] border border-white/5 px-4 pt-4 pb-3 rounded-2xl overflow-hidden shadow-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-[#fafaf9]">Timeline Overview</h3>
                      <button className="bg-white/10 hover:bg-white/15 text-white rounded-full px-3 py-1 text-xs transition-colors flex items-center gap-1.5 font-medium border border-white/5">
                        <LucideIcons.Sparkles size={12} className="text-fuchsia-400" />
                        <span>AI Optimize</span>
                      </button>
                    </div>

                    <div className="border border-white/5 bg-[#0a0a0a]/50 rounded-xl p-3 text-xs">
                      {/* Timeline dates header */}
                      <div className="grid grid-cols-6 border-b border-white/5 pb-2 text-[10px] text-zinc-500 font-mono text-center font-semibold">
                        <div>Jun 15</div>
                        <div>Jun 22</div>
                        <div>Jun 29</div>
                        <div>Jul 06</div>
                        <div>Jul 13</div>
                        <div>Jul 20</div>
                      </div>

                      {/* Visual Gantt bars */}
                      <div className="space-y-4 pt-3 relative min-h-[90px]">
                        <div className="relative h-6 flex items-center">
                          <div className="absolute left-[5%] w-[35%] bg-gradient-to-r from-purple-500 to-indigo-500 h-4 rounded flex items-center justify-between px-2 text-[9px] text-white font-medium shadow-md">
                            <span>Pre-Prod</span>
                            <span>100%</span>
                          </div>
                        </div>
                        <div className="relative h-6 flex items-center">
                          <div className="absolute left-[38%] w-[40%] bg-gradient-to-r from-pink-500 to-purple-500 h-4 rounded flex items-center justify-between px-2 text-[9px] text-white font-medium shadow-md">
                            <span>Production</span>
                            <span>60%</span>
                          </div>
                          <div className="absolute left-[79%] w-3 h-3 bg-yellow-500 rotate-45 border border-black shadow" title="Milestone: Shoot Wrapped" />
                        </div>
                        <div className="relative h-6 flex items-center">
                          <div className="absolute left-[75%] w-[20%] bg-zinc-800 border border-zinc-700 h-4 rounded flex items-center justify-between px-2 text-[9px] text-zinc-400 font-light">
                            <span>Post-Prod</span>
                            <span>0%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dashboard Metrics Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Budget spent */}
                    <div className="bg-[#121212] border border-white/5 p-4 rounded-2xl flex flex-col justify-between min-h-[100px]">
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Budget Spent</span>
                      <h4 className="text-2xl font-bold text-white mt-1">$17,500</h4>
                      <span className="text-[10px] text-gray-500 mt-1 font-medium">of $25,000 budget (70%)</span>
                    </div>

                    {/* Team capacity */}
                    <div className="bg-[#121212] border border-white/5 p-4 rounded-2xl flex flex-col justify-between min-h-[100px] space-y-2">
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block">Team Capacity</span>
                      <div className="space-y-1.5">
                        {teamMembers.slice(0, 3).map((m, i) => (
                          <div key={i} className="flex items-center justify-between text-[11px]">
                            <span className="text-gray-400 truncate flex-1">{m.name.split(" ").map(n => n[0]).join(".") + "."}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-400" style={{ width: `${m.capacity}%` }} />
                              </div>
                              <span className="text-white font-mono font-medium w-6 text-right">{m.capacity}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Upcoming events */}
                    <div className="bg-[#121212] border border-white/5 p-4 rounded-2xl flex flex-col justify-between min-h-[100px] space-y-1.5">
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block">Upcoming Events</span>
                      <div className="space-y-1 text-[11px] text-gray-300">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0" />
                          <span className="truncate">Drone permits due (Jun 28)</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                          <span className="truncate">Rough Cut Review (Jul 10)</span>
                        </div>
                      </div>
                    </div>

                    {/* Activity feed */}
                    <div className="bg-[#121212] border border-white/5 p-4 rounded-2xl flex flex-col justify-between min-h-[100px] space-y-1.5">
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block">Activity Feed</span>
                      <div className="space-y-1 text-[11px] text-gray-300 truncate">
                        <div className="truncate text-gray-400">
                          <strong className="text-white font-medium">Amelia L.</strong> uploaded Creative Brief
                        </div>
                        <div className="truncate text-gray-400">
                          <strong className="text-white font-medium">Marcus C.</strong> set Drone Capture
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- TASKS TAB --- */}
              {activeTab === "tasks" && (
                <div className="space-y-4">
                  {workPackages.map((wp) => (
                    <div key={wp.id} className="bg-[#121212] border border-white/5 rounded-2xl overflow-hidden shadow">
                      {/* Work package header */}
                      <div className="bg-white/[0.02] px-4 py-3 border-b border-white/5 flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{wp.name}</span>
                          <span className="text-xs text-gray-500">(${wp.budget.toLocaleString()})</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          wp.status === "completed" ? "bg-green-500/10 border-green-500/20 text-green-400" :
                          wp.status === "in_progress" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                          "bg-zinc-500/10 border-zinc-800 text-zinc-400"
                        }`}>
                          {wp.status === "completed" ? "Completed" : wp.status === "in_progress" ? "In Progress" : "Planning"}
                        </span>
                      </div>
                      {/* Task items list */}
                      <div className="divide-y divide-white/[0.03]">
                        {wp.tasks.map((t) => (
                          <div key={t.id} className="p-3 px-4 flex justify-between items-center hover:bg-white/[0.01] transition-colors text-sm">
                            <div className="flex items-center gap-3">
                              {t.status === "Completed" ? (
                                <LucideIcons.CheckCircle2 size={15} className="text-green-500 shrink-0" />
                              ) : t.status === "In Progress" ? (
                                <LucideIcons.Clock size={15} className="text-blue-400 shrink-0 animate-pulse" />
                              ) : (
                                <LucideIcons.Circle size={15} className="text-zinc-700 shrink-0" />
                              )}
                              <span className={t.status === "Completed" ? "text-gray-500 line-through font-light" : "text-gray-200"}>
                                {t.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500 shrink-0">
                              <span className="font-medium text-gray-400">{t.assignee}</span>
                              <span className="font-mono bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded text-[11px] text-gray-300">
                                {t.date}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* --- TIMELINE TAB --- */}
              {activeTab === "timeline" && (
                <div className="bg-[#121212] border border-white/5 p-5 rounded-2xl overflow-hidden shadow-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-white">Full Gantt Project Timeline</h3>
                    <button className="bg-white/10 hover:bg-white/15 text-white rounded-full px-3 py-1 text-xs transition-colors flex items-center gap-1.5 border border-white/5">
                      <LucideIcons.Sparkles size={12} className="text-fuchsia-400" />
                      <span>AI Schedule Optimize</span>
                    </button>
                  </div>

                  <div className="border border-white/5 bg-[#0a0a0a]/50 rounded-xl p-4 text-xs space-y-2">
                    {/* Header timeline calendar dates */}
                    <div className="grid grid-cols-7 border-b border-white/5 pb-2 text-[10px] text-zinc-500 font-mono text-center font-bold">
                      <div>Jun 15</div>
                      <div>Jun 22</div>
                      <div>Jun 29</div>
                      <div>Jul 06</div>
                      <div>Jul 13</div>
                      <div>Jul 20</div>
                      <div>Jul 27</div>
                    </div>

                    {/* Timeline Gantt Rows */}
                    <div className="space-y-4 pt-3 relative min-h-[140px]">
                      <div className="relative h-7 flex items-center">
                        <div className="absolute left-[5%] w-[35%] bg-gradient-to-r from-purple-500 to-indigo-500 h-5 rounded flex items-center justify-between px-3 text-[10px] text-white font-semibold shadow">
                          <span>🎥 Pre-Production Scoping</span>
                          <span>100%</span>
                        </div>
                      </div>
                      <div className="relative h-7 flex items-center">
                        <div className="absolute left-[38%] w-[38%] bg-gradient-to-r from-pink-500 to-purple-500 h-5 rounded flex items-center justify-between px-3 text-[10px] text-white font-semibold shadow">
                          <span>🎬 Production Shooting</span>
                          <span>60%</span>
                        </div>
                        {/* Milestone pin */}
                        <div className="absolute left-[77%] w-3 h-3 bg-yellow-500 rotate-45 border border-black shadow" title="Milestone: Shoots Wrap" />
                      </div>
                      <div className="relative h-7 flex items-center">
                        <div className="absolute left-[75%] w-[22%] bg-zinc-800 border border-zinc-700 h-5 rounded flex items-center justify-between px-3 text-[10px] text-zinc-400 font-light">
                          <span>🎞️ Post-Production Edit</span>
                          <span>0%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- TEAM TAB --- */}
              {activeTab === "team" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {teamMembers.map((member) => (
                    <div key={member.name} className="p-4 border border-white/5 bg-[#121212] rounded-2xl flex items-center justify-between hover:border-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        {/* Gradient avatar circle */}
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-xs font-bold text-white shadow">
                          {member.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <h6 className="text-sm font-semibold text-white !m-0">{member.name}</h6>
                          <span className="text-xs text-gray-500 font-light mt-0.5 block">{member.role}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0 text-right">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded leading-none ${
                          member.status === "Active" ? "bg-green-500/10 border-green-500/20 text-green-400" :
                          member.status === "Hold" ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" :
                          "bg-zinc-500/10 border-zinc-800 text-zinc-400"
                        }`}>{member.status}</span>
                        <span className="text-xs text-gray-400 font-mono font-medium">{member.rate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* --- FINANCIAL TAB --- */}
              {activeTab === "financial" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-2xl bg-[#121212] border border-white/5">
                      <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Paid to Date</span>
                      <span className="text-base font-mono font-bold text-green-400">$8,300</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#121212] border border-white/5">
                      <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Incurred / Pending</span>
                      <span className="text-base font-mono font-bold text-blue-400">$9,200</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#121212] border border-white/5">
                      <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Remaining Budget</span>
                      <span className="text-base font-mono font-bold text-zinc-300">$7,500</span>
                    </div>
                  </div>

                  <div className="border border-white/5 bg-[#121212] rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-white/[0.02] text-[9px] text-gray-500 uppercase font-bold tracking-wider border-b border-white/5">
                          <th className="p-3 px-4">Expense Item</th>
                          <th className="p-3">Budget</th>
                          <th className="p-3">Incurred</th>
                          <th className="p-3 px-4 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.03] text-gray-300 font-light">
                        {financialItems.map((item) => (
                          <tr key={item.category} className="hover:bg-white/[0.01] transition-colors">
                            <td className="p-3 px-4 font-medium text-white">{item.category}</td>
                            <td className="p-3 font-mono">{item.budget}</td>
                            <td className="p-3 font-mono">{item.spent}</td>
                            <td className="p-3 px-4 text-right">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                item.status === "Paid" ? "bg-green-500/10 border-green-500/20 text-green-400" :
                                item.status === "Incurred" || item.status === "Approved" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                                "bg-zinc-500/10 border-zinc-850 text-zinc-400"
                              }`}>{item.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* --- DOCUMENTS TAB --- */}
              {activeTab === "documents" && (
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-[10px] text-gray-500 mb-1 px-1">
                    <span className="font-semibold uppercase tracking-wider">Document Storage</span>
                    <span className="flex items-center gap-1 font-medium"><LucideIcons.Sparkles size={11} className="text-purple-400" /> AI Semantic Search Enabled</span>
                  </div>

                  {documents.map((doc) => (
                    <div key={doc.name} className="p-3.5 px-4 border border-white/5 bg-[#121212] rounded-2xl flex items-center justify-between hover:border-white/10 transition-colors text-sm">
                      <div className="flex items-center gap-3 truncate">
                        <LucideIcons.FileText size={16} className="text-purple-400 shrink-0" />
                        <div className="truncate">
                          <h6 className="text-sm font-semibold text-white !m-0 truncate leading-none">{doc.name}</h6>
                          <span className="text-[11px] text-gray-500 font-light mt-1 block">{doc.size} • Uploaded by {doc.uploadedBy}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2.5 shrink-0 text-xs">
                        {doc.aiIndexed && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center gap-0.5" title="Indexed for AI chatbot queries">
                            <LucideIcons.Sparkles size={8} /> Indexed
                          </span>
                        )}
                        <span className="font-mono bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded text-[11px] text-gray-300">
                          {doc.date}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
