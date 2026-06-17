"use client";

import React, { useState } from "react";
import * as LucideIcons from "lucide-react";
import { motion } from "framer-motion";

interface LifecycleNode {
  id: string;
  label: string;
  description: string;
  type?: "default" | "success" | "error" | "purple";
  icon: string;
}

export default function WorkPackageLifecycle() {
  const [selectedNode, setSelectedNode] = useState<string>("planning");

  const nodes: LifecycleNode[] = [
    { 
      id: "planning", 
      label: "Planning", 
      description: "Initial state. The work package container is created, and parameters like budget allocation, dates, and sequencing order are defined.",
      icon: "FileEdit",
      type: "purple"
    },
    { 
      id: "matching", 
      label: "Matching", 
      description: "Roster search is active. The system scans matchmaking criteria based on required skills, rates, and availability.",
      icon: "Users"
    },
    { 
      id: "staffed", 
      label: "Staffed", 
      description: "Freelancers are booked. Invitations have been successfully sent and holds/agreements are accepted.",
      icon: "UserCheck",
      type: "success"
    },
    { 
      id: "in_progress", 
      label: "In Progress", 
      description: "Work is active. Triggers automatically when the sequence start date arrives and timesheets open.",
      icon: "Activity"
    },
    { 
      id: "completed", 
      label: "Completed", 
      description: "Deliverables are signed off, assets verified in the review system, and payment milestones locked.",
      icon: "Lock",
      type: "success"
    }
  ];

  const cancelledNode: LifecycleNode = {
    id: "cancelled",
    label: "Cancelled (Terminal)",
    description: "Terminal state. Work is stopped, immediately releasing any booked crew holds, capacity, and remaining funds back to the billing ledger.",
    icon: "XCircle",
    type: "error"
  };

  const activeNodeInfo = selectedNode === "cancelled" ? cancelledNode : nodes.find(n => n.id === selectedNode)!;

  const handleNodeClick = (id: string) => {
    setSelectedNode(id);
  };

  return (
    <div className="my-8 w-full border border-zinc-900 rounded-xl bg-zinc-950/15 p-5 flex flex-col gap-6">
      <div className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest text-center">
        Interactive Status Lifecycle Flow (Click nodes to inspect)
      </div>

      {/* Lifecycle Flow Graphic */}
      <div className="relative w-full flex flex-col items-center select-none pt-2">
        {/* Main Flow Grid */}
        <div className="w-full flex justify-between items-center px-4 relative z-10">
          {nodes.map((node, idx) => {
            const isSelected = selectedNode === node.id;
            const Icon = (LucideIcons as any)[node.icon] || LucideIcons.HelpCircle;

            let glowStyle = "border-zinc-800 bg-zinc-950 text-zinc-400";
            if (isSelected) {
              glowStyle = node.type === "success" 
                ? "border-emerald-500 bg-emerald-950/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                : "border-purple-500 bg-purple-950/20 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]";
            }

            return (
              <React.Fragment key={node.id}>
                {/* Node Item */}
                <div 
                  onClick={() => handleNodeClick(node.id)}
                  className="flex flex-col items-center cursor-pointer group"
                >
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all ${glowStyle}`}
                  >
                    <Icon size={18} />
                  </motion.div>
                  <span className={`text-[10px] font-semibold tracking-tight mt-2 transition-colors ${
                    isSelected ? "text-zinc-100 font-bold" : "text-zinc-500 group-hover:text-zinc-350"
                  }`}>
                    {node.label}
                  </span>
                </div>

                {/* Connecting Line */}
                {idx < nodes.length - 1 && (
                  <div className="flex-1 h-[2px] bg-zinc-900 mx-2 self-center relative -translate-y-2.5">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-[6px] border-t-transparent border-b-transparent border-l-zinc-800" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Bounded Branch Lines leading to Cancelled */}
        <div className="w-full h-16 relative mt-2 px-10">
          <svg viewBox="0 0 600 64" className="w-full h-16 text-zinc-900 overflow-visible" fill="none">
            {/* Horizontal branch base */}
            <path d="M 50 20 L 500 20" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
            
            {/* Connecting drops from Planning, Matching, Staffed, In Progress */}
            {/* Planning */}
            <path d="M 50 0 L 50 20" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
            {/* Matching */}
            <path d="M 175 0 L 175 20" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
            {/* Staffed */}
            <path d="M 300 0 L 300 20" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
            {/* In Progress */}
            <path d="M 425 0 L 425 20" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
            
            {/* Route from base center to Cancelled */}
            <path d="M 275 20 L 275 64" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
            <path d="M 275 58 L 275 64" stroke="currentColor" strokeWidth="1.5" />
            {/* Arrowhead */}
            <path d="M 271 58 L 275 64 L 279 58" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Cancelled Terminal Node */}
        <div 
          onClick={() => handleNodeClick("cancelled")}
          className="flex flex-col items-center cursor-pointer group -mt-1 relative z-10"
        >
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all ${
              selectedNode === "cancelled"
                ? "border-red-500 bg-red-950/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                : "border-zinc-800 bg-zinc-950 text-zinc-400"
            }`}
          >
            <LucideIcons.XCircle size={18} />
          </motion.div>
          <span className={`text-[10px] font-semibold tracking-tight mt-2 transition-colors ${
            selectedNode === "cancelled" ? "text-red-400 font-bold" : "text-zinc-500 group-hover:text-zinc-350"
          }`}>
            Cancelled (Terminal)
          </span>
        </div>
      </div>

      {/* Selected Node Details Box */}
      <motion.div 
        key={selectedNode}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass-panel border rounded-xl p-4 mt-2 ${
          activeNodeInfo.id === "cancelled" ? "border-red-500/20 bg-red-950/5" :
          activeNodeInfo.type === "success" ? "border-emerald-500/20 bg-emerald-950/5" :
          activeNodeInfo.type === "purple" ? "border-purple-500/20 bg-purple-950/5" :
          "border-zinc-800 bg-zinc-950/20"
        }`}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
            activeNodeInfo.id === "cancelled" ? "bg-red-500/10 border-red-500/30 text-red-400" :
            activeNodeInfo.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
            activeNodeInfo.type === "purple" ? "bg-purple-500/10 border-purple-500/30 text-purple-400" :
            "bg-zinc-900 border-zinc-800 text-zinc-400"
          }`}>
            STATUS STATE
          </span>
          <h4 className="text-sm font-semibold text-zinc-200">{activeNodeInfo.label}</h4>
        </div>
        <p className="text-xs text-zinc-400 leading-normal font-light">
          {activeNodeInfo.description}
        </p>
      </motion.div>
    </div>
  );
}
