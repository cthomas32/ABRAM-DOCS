"use client";

import React from "react";
import * as LucideIcons from "lucide-react";
import { motion } from "framer-motion";

export default function ProductionBrainAccess() {
  return (
    <div className="my-8 flex flex-col items-center w-full gap-6">
      {/* Top Node: Production Brain */}
      <motion.div 
        whileHover={{ y: -2, borderColor: "rgba(168, 85, 247, 0.4)" }}
        className="glass-panel border border-purple-500/20 bg-purple-950/10 shadow-[0_0_25px_rgba(168,85,247,0.12)] rounded-xl p-5 max-w-md w-full flex items-center gap-4 relative overflow-hidden transition-all duration-200"
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse" />
        <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0 text-purple-400">
          <LucideIcons.Database size={24} />
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Database Core</h3>
          <h4 className="text-base font-bold text-zinc-100">Production Brain</h4>
          <p className="text-xs text-zinc-400 mt-1 font-light leading-relaxed">
            Consolidated knowledge store containing Roster history, Budgets, Crew rates, and Gear inventories.
          </p>
        </div>
      </motion.div>

      {/* Connective Line / Arrow down */}
      <div className="w-full max-w-4xl flex justify-center h-12 overflow-visible relative">
        <svg viewBox="0 0 600 48" className="w-full h-12 text-zinc-800 overflow-visible" fill="none">
          {/* Main vertical stem */}
          <path d="M 300 0 L 300 16" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
          {/* Horizontal crossbar */}
          <path d="M 100 16 L 500 16" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
          {/* Three branch drops */}
          <path d="M 100 16 L 100 48" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M 100 42 L 100 48" stroke="currentColor" strokeWidth="1.5" />
          
          <path d="M 300 16 L 300 48" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M 300 42 L 300 48" stroke="currentColor" strokeWidth="1.5" />
          
          <path d="M 500 16 L 500 48" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M 500 42 L 500 48" stroke="currentColor" strokeWidth="1.5" />
          
          {/* Arrowheads */}
          <path d="M 96 42 L 100 48 L 104 42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 296 42 L 300 48 L 304 42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 496 42 L 500 48 L 504 42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Access Levels Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
        {/* Column 1: Owners & Admins */}
        <motion.div 
          whileHover={{ y: -2, borderColor: "rgba(168, 85, 247, 0.3)" }}
          className="glass-panel border border-zinc-800 bg-zinc-950/20 rounded-xl p-5 flex flex-col gap-4 transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-purple-400">
              <LucideIcons.Key size={18} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-100">Owners & Admins</h4>
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Full Access</span>
            </div>
          </div>
          <ul className="text-xs text-zinc-400 space-y-2 border-t border-zinc-900 pt-3 flex-1 font-light leading-relaxed">
            <li className="flex items-start gap-2">
              <LucideIcons.Check size={12} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>Deep search across full roster & crew history</span>
            </li>
            <li className="flex items-start gap-2">
              <LucideIcons.Check size={12} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>Modify custom intake forms & workspace rules</span>
            </li>
            <li className="flex items-start gap-2">
              <LucideIcons.Check size={12} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>View global billing ledgers and transfer records</span>
            </li>
          </ul>
        </motion.div>

        {/* Column 2: Workspace Members */}
        <motion.div 
          whileHover={{ y: -2, borderColor: "rgba(14, 165, 233, 0.3)" }}
          className="glass-panel border border-zinc-800 bg-zinc-950/20 rounded-xl p-5 flex flex-col gap-4 transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sky-400">
              <LucideIcons.FolderGit2 size={18} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-100">Workspace Member</h4>
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Project-Bound</span>
            </div>
          </div>
          <ul className="text-xs text-zinc-400 space-y-2 border-t border-zinc-900 pt-3 flex-1 font-light leading-relaxed">
            <li className="flex items-start gap-2">
              <LucideIcons.Check size={12} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>Query active matching lists for current projects</span>
            </li>
            <li className="flex items-start gap-2">
              <LucideIcons.X size={12} className="text-red-500 shrink-0 mt-0.5" />
              <span>Cannot view billing budgets or contract details</span>
            </li>
            <li className="flex items-start gap-2">
              <LucideIcons.Check size={12} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>Restricted crew search within approved list</span>
            </li>
          </ul>
        </motion.div>

        {/* Column 3: Freelancers */}
        <motion.div 
          whileHover={{ y: -2, borderColor: "rgba(239, 68, 68, 0.2)" }}
          className="glass-panel border border-zinc-800 bg-zinc-950/20 rounded-xl p-5 flex flex-col gap-4 transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500">
              <LucideIcons.Lock size={18} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-100">Freelancer</h4>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-semibold">Zero Access</span>
            </div>
          </div>
          <ul className="text-xs text-zinc-400 space-y-2 border-t border-zinc-900 pt-3 flex-1 font-light leading-relaxed">
            <li className="flex items-start gap-2">
              <LucideIcons.X size={12} className="text-red-500 shrink-0 mt-0.5" />
              <span>No direct query access to Production Brain core</span>
            </li>
            <li className="flex items-start gap-2">
              <LucideIcons.X size={12} className="text-red-500 shrink-0 mt-0.5" />
              <span>No search visibility on roster or database assets</span>
            </li>
            <li className="flex items-start gap-2">
              <LucideIcons.Check size={12} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>Isolated view of own assigned work details</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
