"use client";

import React, { useState } from "react";
import * as LucideIcons from "lucide-react";
import { motion } from "framer-motion";

export default function ProjectDetailMock() {
  const [activeTab, setActiveTab] = useState("Overview");

  const tabs = ["Overview", "Tasks", "Timeline", "Team", "Financial", "Documents"];

  return (
    <div className="my-8 w-full border border-zinc-850 rounded-xl bg-zinc-950/30 overflow-hidden shadow-2xl relative">
      {/* Background radial glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-purple-500/5 blur-3xl pointer-events-none" />
      
      {/* 1. Mock Header */}
      <div className="border-b border-zinc-900 bg-zinc-950/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 cursor-pointer hover:text-white transition-colors">
            <LucideIcons.ArrowLeft size={14} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-zinc-150 !m-0">Commercial Video Campaign</h4>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Planning
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 font-light">Project ID: WP-48201</span>
          </div>
        </div>

        {/* Progress block */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Progress</span>
          <div className="w-24 bg-zinc-900 border border-zinc-800 rounded-full h-2 relative overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-full w-[68%]" />
          </div>
          <span className="text-[10px] font-mono font-bold text-zinc-300">68%</span>
        </div>
      </div>

      {/* 2. Info Strip */}
      <div className="bg-zinc-900/40 border-b border-zinc-900 px-5 py-3 flex flex-wrap gap-6 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <LucideIcons.Tv size={12} className="text-zinc-500" />
          <span>Industry: <strong className="text-zinc-350 font-medium">Commercial</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <LucideIcons.DollarSign size={12} className="text-zinc-500" />
          <span>Budget Allocation: <strong className="text-zinc-350 font-medium">$25,000</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <LucideIcons.CalendarRange size={12} className="text-zinc-500" />
          <span>Timeline: <strong className="text-zinc-350 font-medium">Jun 15 - Jul 30</strong></span>
        </div>
      </div>

      {/* 3. Minimal Tab Nav */}
      <div className="bg-zinc-950/20 border-b border-zinc-900 px-4 flex gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-4 py-3 text-xs font-semibold tracking-tight transition-colors whitespace-nowrap outline-none ${
                isActive ? "text-purple-400" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab}
              {isActive && (
                <motion.div 
                  layoutId="activeMockTab" 
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-purple-500" 
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 4. Active Tab Content Area */}
      <div className="p-5 min-h-[160px] bg-black/20 flex flex-col justify-center">
        {activeTab === "Overview" && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            <div className="p-4 rounded-lg bg-zinc-950/40 border border-zinc-900">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Active Crews</span>
              <h5 className="text-xl font-bold text-zinc-200 mt-1">12 Booked</h5>
              <p className="text-[10px] text-zinc-400 mt-0.5">3 holds pending RSVPs</p>
            </div>
            <div className="p-4 rounded-lg bg-zinc-950/40 border border-zinc-900">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Milestones Locked</span>
              <h5 className="text-xl font-bold text-zinc-200 mt-1">4 of 6 Completed</h5>
              <p className="text-[10px] text-zinc-400 mt-0.5">Next up: Rough Cut Review</p>
            </div>
            <div className="p-4 rounded-lg bg-zinc-950/40 border border-zinc-900">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Deliverables In Review</span>
              <h5 className="text-xl font-bold text-zinc-200 mt-1">2 Pending Signoff</h5>
              <p className="text-[10px] text-zinc-400 mt-0.5">Review queue: Frame.io sync active</p>
            </div>
          </motion.div>
        )}
        
        {activeTab !== "Overview" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-6 text-zinc-500 text-xs font-light"
          >
            <LucideIcons.LayoutGrid className="mx-auto text-zinc-700 mb-2" size={20} />
            <span>Interactive Mock: <strong className="text-zinc-400">{activeTab} Details</strong> view model content.</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
