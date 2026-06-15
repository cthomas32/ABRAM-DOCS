"use client";

import React from "react";
import * as LucideIcons from "lucide-react";
import { motion } from "framer-motion";

interface ParticipantCardProps {
  name: string;
  icon: string;
  colorClass: string;
  glowClass: string;
}

function ParticipantCard({ name, icon, colorClass, glowClass }: ParticipantCardProps) {
  const icons = LucideIcons as any;
  const Icon = icons[icon] || LucideIcons.HelpCircle;

  return (
    <div className={`glass-panel border border-white/5 bg-zinc-950/30 rounded-xl p-3 flex items-center justify-center gap-2.5 w-40 shrink-0 ${glowClass}`}>
      <div className={`p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 ${colorClass}`}>
        <Icon size={16} />
      </div>
      <span className="text-xs font-semibold tracking-tight text-zinc-100">{name}</span>
    </div>
  );
}

interface MessageArrowProps {
  from: 1 | 2 | 3 | 4;
  to: 1 | 2 | 3 | 4;
  y: number;
  label: string;
  isReply?: boolean;
  color?: string;
}

function MessageArrow({ from, to, y, label, isReply = false, color = "#a855f7" }: MessageArrowProps) {
  const cols = [0, 12.5, 37.5, 62.5, 87.5];
  const x1 = cols[from];
  const x2 = cols[to];
  
  const left = Math.min(x1, x2);
  const width = Math.abs(x1 - x2);
  const pointingRight = x2 > x1;

  return (
    <div 
      className="absolute h-8 flex flex-col justify-end pointer-events-none"
      style={{
        left: `${left}%`,
        width: `${width}%`,
        top: `${y}px`,
      }}
    >
      <span className="text-[9px] text-zinc-400 font-mono text-center w-full pb-0.5 block truncate px-2 select-text pointer-events-auto">
        {label}
      </span>
      <svg className="w-full h-3 overflow-visible" fill="none">
        <line 
          x1={pointingRight ? "0" : "100%"} 
          y1="6" 
          x2={pointingRight ? "100%" : "0"} 
          y2="6" 
          stroke={color} 
          strokeWidth="1.25" 
          strokeDasharray={isReply ? "3 3" : "none"} 
        />
        {pointingRight ? (
          <path d="M calc(100% - 5px) 2 L 100% 6 L calc(100% - 5px) 10" stroke={color} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M 5 2 L 0 6 L 5 10" stroke={color} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </div>
  );
}

interface ActivationBlockProps {
  col: 1 | 2 | 3 | 4;
  top: number;
  height: number;
  color?: string;
}

function ActivationBlock({ col, top, height, color = "border-purple-500/30 bg-purple-500/10" }: ActivationBlockProps) {
  const cols = [0, 12.5, 37.5, 62.5, 87.5];
  const left = cols[col];
  
  return (
    <div 
      className={`absolute w-3 -translate-x-1.5 rounded border ${color}`}
      style={{
        left: `${left}%`,
        top: `${top}px`,
        height: `${height}px`
      }}
    />
  );
}

interface AltBoxProps {
  top: number;
  height: number;
  dividerY: number;
  cond1: string;
  cond2: string;
}

function AltBox({ top, height, dividerY, cond1, cond2 }: AltBoxProps) {
  return (
    <div 
      className="absolute left-[4%] right-[4%] border border-white/5 bg-zinc-950/10 rounded-xl overflow-hidden pointer-events-none"
      style={{
        top: `${top}px`,
        height: `${height}px`
      }}
    >
      <div className="absolute top-0 left-0 bg-purple-500/15 border-r border-b border-white/5 px-2.5 py-0.5 rounded-br-lg text-[9px] font-bold text-purple-300 uppercase tracking-wider">
        alt
      </div>
      
      <div className="absolute left-3 text-[10px] font-semibold text-zinc-500 font-mono" style={{ top: "8px" }}>
        [{cond1}]
      </div>

      <div 
        className="absolute left-0 right-0 border-t border-dashed border-white/5"
        style={{ top: `${dividerY}px` }}
      />

      <div className="absolute left-3 text-[10px] font-semibold text-zinc-500 font-mono" style={{ top: `${dividerY + 8}px` }}>
        [{cond2}]
      </div>
    </div>
  );
}

export default function SequenceDiagram() {
  return (
    <div className="my-8 overflow-x-auto w-full border border-zinc-900 rounded-xl bg-zinc-950/15 py-6">
      {/* Scroll canvas wrapper */}
      <div className="min-w-[820px] relative h-[610px] select-none px-4">
        
        {/* Step 1: Lifelines */}
        <div className="absolute left-0 right-0 top-[56px] bottom-[56px] flex pointer-events-none">
          <div className="w-[12.5%]" />
          <div className="w-[25%] border-l border-dashed border-zinc-900/80" />
          <div className="w-[25%] border-l border-dashed border-zinc-900/80" />
          <div className="w-[25%] border-l border-dashed border-zinc-900/80" />
          <div className="w-[12.5%] border-l border-dashed border-zinc-900/80" />
        </div>

        {/* Step 2: Participant Headers (Top) */}
        <div className="absolute left-0 right-0 top-0 flex justify-between px-[4.5%]">
          <ParticipantCard name="Producer UI" icon="User" colorClass="text-sky-400" glowClass="shadow-[0_0_15px_rgba(2,132,199,0.08)]" />
          <ParticipantCard name="Platform Server" icon="Server" colorClass="text-purple-400" glowClass="shadow-[0_0_15px_rgba(168,85,247,0.08)]" />
          <ParticipantCard name="Billing Ledger" icon="CreditCard" colorClass="text-emerald-400" glowClass="shadow-[0_0_15px_rgba(22,110,63,0.08)]" />
          <ParticipantCard name="AI Engine" icon="Cpu" colorClass="text-pink-400" glowClass="shadow-[0_0_15px_rgba(236,72,153,0.08)]" />
        </div>

        {/* Step 3: Activation Blocks */}
        {/* Server Block 1 (Init) */}
        <ActivationBlock col={2} top={74} height={112} />
        {/* Ledger Block 1 (Verify) */}
        <ActivationBlock col={3} top={114} height={72} color="border-emerald-500/30 bg-emerald-500/10" />

        {/* Server Block 2 (Alt Branch 1) */}
        <ActivationBlock col={2} top={224} height={82} />
        {/* Ledger Block 2 (Insufficient balance) */}
        <ActivationBlock col={3} top={224} height={32} color="border-emerald-500/30 bg-emerald-500/10" />

        {/* Server Block 3 (Alt Branch 2) */}
        <ActivationBlock col={2} top={334} height={202} />
        {/* AI Block (Running model) */}
        <ActivationBlock col={4} top={334} height={72} color="border-pink-500/30 bg-pink-500/10" />
        {/* Ledger Block 3 (Deduction & audit logging) */}
        <ActivationBlock col={3} top={414} height={82} color="border-emerald-500/30 bg-emerald-500/10" />

        {/* Step 4: Alt/Else Bounding Frame */}
        <AltBox top={194} height={354} dividerY={120} cond1="Balance <= 0" cond2="Balance > 0" />

        {/* Step 5: Message Arrows */}
        {/* Standard initialization messages */}
        <MessageArrow from={1} to={2} y={76} label="Request Brief Analysis" color="#38bdf8" />
        <MessageArrow from={2} to={3} y={116} label="1. Resolve Billing Entity (User or Org)" color="#a855f7" />
        <MessageArrow from={2} to={3} y={156} label="2. Check Credit Balance" color="#a855f7" />

        {/* alt section 1: Insufficient Funds */}
        <MessageArrow from={3} to={2} y={226} label="Insufficient Credits" isReply color="#10b981" />
        <MessageArrow from={2} to={1} y={266} label="Show Payment Required / Recharge Modal" isReply color="#38bdf8" />

        {/* alt section 2: Successful run */}
        <MessageArrow from={2} to={4} y={336} label="Invoke Analysis Engine" color="#a855f7" />
        <MessageArrow from={4} to={2} y={376} label="Return Analysis JSON" isReply color="#ec4899" />
        <MessageArrow from={2} to={3} y={416} label="Deduct Credits for usage" color="#a855f7" />
        <MessageArrow from={3} to={2} y={456} label="Deduct & Log Transaction details" isReply color="#10b981" />
        <MessageArrow from={2} to={1} y={496} label="Return Completed Analysis PDF/Markdown" isReply color="#38bdf8" />

        {/* Step 6: Participant Footers (Bottom) */}
        <div className="absolute left-0 right-0 bottom-0 flex justify-between px-[4.5%]">
          <ParticipantCard name="Producer UI" icon="User" colorClass="text-sky-400" glowClass="shadow-[0_0_15px_rgba(2,132,199,0.08)]" />
          <ParticipantCard name="Platform Server" icon="Server" colorClass="text-purple-400" glowClass="shadow-[0_0_15px_rgba(168,85,247,0.08)]" />
          <ParticipantCard name="Billing Ledger" icon="CreditCard" colorClass="text-emerald-400" glowClass="shadow-[0_0_15px_rgba(22,110,63,0.08)]" />
          <ParticipantCard name="AI Engine" icon="Cpu" colorClass="text-pink-400" glowClass="shadow-[0_0_15px_rgba(236,72,153,0.08)]" />
        </div>

      </div>
    </div>
  );
}
