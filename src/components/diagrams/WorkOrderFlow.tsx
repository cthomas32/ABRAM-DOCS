"use client";

import React from "react";
import * as LucideIcons from "lucide-react";
import { motion } from "framer-motion";

interface NodeCardProps {
  title: string;
  description?: string;
  icon: string;
  type?: "default" | "success" | "warning" | "error" | "purple";
  badge?: string;
}

function NodeCard({ title, description, icon, type = "default", badge }: NodeCardProps) {
  const Icon = (LucideIcons as any)[icon] || LucideIcons.HelpCircle;
  
  let borderStyle = "border-zinc-800 bg-zinc-950/20";
  let glowStyle = "";
  let iconStyle = "text-zinc-400";
  let badgeStyle = "bg-zinc-800 border-zinc-700 text-zinc-400";

  switch (type) {
    case "success":
      borderStyle = "border-emerald-500/20 bg-emerald-950/5";
      glowStyle = "shadow-[0_0_15px_rgba(22,110,63,0.08)]";
      iconStyle = "text-emerald-400";
      badgeStyle = "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
      break;
    case "warning":
      borderStyle = "border-orange-500/20 bg-orange-950/5";
      glowStyle = "shadow-[0_0_15px_rgba(249,115,22,0.08)]";
      iconStyle = "text-orange-400";
      badgeStyle = "bg-orange-500/10 border-orange-500/30 text-orange-400";
      break;
    case "error":
      borderStyle = "border-red-500/20 bg-red-950/5";
      glowStyle = "shadow-[0_0_15px_rgba(239,68,68,0.08)]";
      iconStyle = "text-red-400";
      badgeStyle = "bg-red-500/10 border-red-500/30 text-red-400";
      break;
    case "purple":
      borderStyle = "border-purple-500/20 bg-purple-950/5";
      glowStyle = "shadow-[0_0_15px_rgba(168,85,247,0.08)]";
      iconStyle = "text-purple-400";
      badgeStyle = "bg-purple-500/10 border-purple-500/30 text-purple-400";
      break;
  }

  return (
    <motion.div 
      whileHover={{ y: -1, borderColor: "rgba(255,255,255,0.1)" }}
      className={`glass-panel border rounded-xl p-3.5 flex items-start gap-3 transition-all duration-200 ${borderStyle} ${glowStyle} w-full`}
    >
      <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0">
        <Icon size={16} className={iconStyle} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-semibold text-zinc-150 truncate">{title}</h4>
          {badge && (
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${badgeStyle}`}>
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-[10px] text-zinc-400 leading-relaxed mt-1 font-light">
            {description}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default function WorkOrderFlow() {
  return (
    <div className="my-8 flex flex-col gap-2 w-full border border-zinc-900 rounded-xl bg-zinc-950/10 p-5 overflow-x-auto">
      {/* Scrollable Canvas for Desktop, adapts layout */}
      <div className="min-w-[800px] flex flex-col relative py-2">
        
        {/* Row 1: Linear main flow */}
        <div className="flex justify-between items-center w-full relative z-10">
          <div className="w-[22%]">
            <NodeCard 
              title="Draft Work Order" 
              description="Define tasks, dates, and pre-auth budget details."
              icon="FileText"
              type="purple"
            />
          </div>
          
          <div className="w-[4%] flex justify-center">
            <svg className="w-5 h-4 text-zinc-850" fill="none" viewBox="0 0 20 16">
              <path d="M 0 8 L 20 8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
              <path d="M 14 4 L 20 8 L 14 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          
          <div className="w-[22%]">
            <NodeCard 
              title="Send Invitations" 
              description="Dispatch notifications to matched crew candidates."
              icon="Send"
            />
          </div>
          
          <div className="w-[4%] flex justify-center">
            <svg className="w-5 h-4 text-zinc-850" fill="none" viewBox="0 0 20 16">
              <path d="M 0 8 L 20 8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
              <path d="M 14 4 L 20 8 L 14 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div className="w-[22%]">
            <NodeCard 
              title="Freelancer Decision" 
              description="Freelancer reviews terms and holds the booking decision."
              icon="HelpCircle"
              type="warning"
              badge="GATEWAY"
            />
          </div>
          
          <div className="w-[4%] flex justify-center relative">
            {/* Direct Connect Accept Arrow */}
            <svg className="w-5 h-4 text-zinc-850 overflow-visible" fill="none" viewBox="0 0 20 16">
              <path d="M 0 8 L 20 8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
              <path d="M 14 4 L 20 8 L 14 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="-13" y="-12" width="26" height="10" rx="2" fill="#064e3b" stroke="#047857" strokeWidth="0.5" />
              <text x="0" y="-5" fill="#a7f3d0" fontSize="5" fontWeight="bold" textAnchor="middle">ACCEPT</text>
            </svg>
          </div>

          <div className="w-[22%]">
            <NodeCard 
              title="Confirmed Booking" 
              description="Booking locked, calendar capacity synced, and PO generated."
              icon="CheckCircle2"
              type="success"
              badge="TERMINAL"
            />
          </div>
        </div>

        {/* Row 2: Branch connector down */}
        <div className="w-full h-12 relative z-0">
          <svg className="w-full h-12 text-zinc-850 overflow-visible" fill="none">
            {/* Draw curve from column 3 down, then right to column 4 (approximate percentages) */}
            {/* Column 3 center is at ~61%. Column 4 center is at ~89%. */}
            {/* Let's draw using absolute percentages or exact path relative to diagram sizing */}
            <path d="M 500 0 L 500 24 L 700 24 L 700 48" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
            <path d="M 696 42 L 700 48 L 704 42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            
            {/* Label box for REJECT */}
            <rect x="520" y="14" width="30" height="12" rx="2.5" fill="#7f1d1d" stroke="#b91c1c" strokeWidth="0.5" />
            <text x="535" y="22" fill="#fecaca" fontSize="5.5" fontWeight="bold" textAnchor="middle">REJECT</text>
          </svg>
        </div>

        {/* Row 3: Branched output */}
        <div className="flex w-full justify-end relative z-10">
          <div className="w-[22%]">
            <NodeCard 
              title="Re-Staffing Required" 
              description="Releases previous locks; alerts project manager to match new crew."
              icon="UserMinus"
              type="error"
              badge="TERMINAL"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
