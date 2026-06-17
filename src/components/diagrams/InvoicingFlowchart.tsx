"use client";

import React from "react";
import * as LucideIcons from "lucide-react";
import { motion } from "framer-motion";

const getIconComponent = (iconName: string) => {
  const icons = LucideIcons as any;
  return icons[iconName] || LucideIcons.HelpCircle;
};

interface FlowNodeProps {
  title: string;
  description?: string;
  icon: string;
  type?: "default" | "success" | "warning" | "error" | "purple";
  badge?: string;
}

function FlowNode({ title, description, icon, type = "default", badge }: FlowNodeProps) {
  const Icon = getIconComponent(icon);
  
  let borderStyle = "border-zinc-800/80 bg-zinc-950/20";
  let glowStyle = "";
  let iconStyle = "text-zinc-400";
  let badgeStyle = "bg-zinc-800 border-zinc-700 text-zinc-400";

  switch (type) {
    case "success":
      borderStyle = "border-emerald-500/20 bg-emerald-950/5";
      glowStyle = "shadow-[0_0_20px_rgba(22,110,63,0.1)]";
      iconStyle = "text-emerald-400";
      badgeStyle = "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
      break;
    case "warning":
      borderStyle = "border-orange-500/20 bg-orange-950/5";
      glowStyle = "shadow-[0_0_20px_rgba(249,115,22,0.1)]";
      iconStyle = "text-orange-400";
      badgeStyle = "bg-orange-500/10 border-orange-500/30 text-orange-400";
      break;
    case "error":
      borderStyle = "border-red-500/20 bg-red-950/5";
      glowStyle = "shadow-[0_0_20px_rgba(239,68,68,0.1)]";
      iconStyle = "text-red-400";
      badgeStyle = "bg-red-500/10 border-red-500/30 text-red-400";
      break;
    case "purple":
      borderStyle = "border-purple-500/20 bg-purple-950/5";
      glowStyle = "shadow-[0_0_20px_rgba(168,85,247,0.1)]";
      iconStyle = "text-purple-400";
      badgeStyle = "bg-purple-500/10 border-purple-500/30 text-purple-400";
      break;
  }

  return (
    <motion.div 
      whileHover={{ y: -1, borderColor: "rgba(255,255,255,0.1)" }}
      className={`glass-panel border rounded-xl p-4 flex items-start gap-4 transition-all duration-200 ${borderStyle} ${glowStyle} w-full`}
    >
      <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0">
        <Icon size={20} className={iconStyle} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-zinc-100 truncate">{title}</h4>
          {badge && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeStyle}`}>
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-zinc-400 leading-normal mt-1 font-light">
            {description}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function FlowConnector() {
  return (
    <div className="flex justify-center w-full my-2">
      <svg className="w-6 h-8 text-zinc-800 overflow-visible" fill="none">
        <path d="M12 0 L12 32" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
        <path d="M8 24 L12 32 L16 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function InvoicingFlowchart() {
  return (
    <div className="my-8 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 relative w-full">
      {/* Visual Divider Line for Desktop */}
      <div className="hidden lg:block absolute left-1/2 top-4 bottom-4 w-[1px] bg-zinc-900/80 -translate-x-1/2" />

      {/* Column 1: Freelancer-Initiated Invoice Flow */}
      <div className="flex flex-col items-center">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
          <LucideIcons.User size={14} /> Freelancer Invoice Flow
        </h3>
        <div className="w-full flex flex-col">
          <FlowNode 
            title="1. Creates Invoice" 
            description="Initiate and configure invoice builder on Financials dashboard." 
            icon="PlusCircle" 
            type="purple"
          />
          <FlowConnector />
          <FlowNode 
            title="2. Draft" 
            description="Invoice is saved locally; can be edited, reviewed, or deleted." 
            icon="FileText"
          />
          <FlowConnector />
          <FlowNode 
            title="3. Sent / Awaiting Payment" 
            description="The payment system updates billing; producer receives secure checkout invoice link." 
            icon="Mail" 
            type="warning"
            badge="AWAITING ACTION"
          />
          <FlowConnector />
          <FlowNode 
            title="4. Paid" 
            description="Payment processes completely, finalizing the ledger logs." 
            icon="CheckCircle2" 
            type="success"
            badge="TERMINAL"
          />
        </div>
      </div>

      {/* Column 2: Producer-Initiated Purchase Order Flow */}
      <div className="flex flex-col items-center">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
          <LucideIcons.Building size={14} /> Producer PO Flow
        </h3>
        <div className="w-full flex flex-col">
          <FlowNode 
            title="1. Create PO & Authorize Card" 
            description="Configure items and authorize payment method." 
            icon="CreditCard" 
            type="purple"
          />
          <FlowConnector />
          <FlowNode 
            title="2. Authorized Hold" 
            description="The system locks the invoice total on card for a maximum of 7 days." 
            icon="Lock" 
            type="warning"
          />
          <FlowConnector />
          <FlowNode 
            title="3. Pending Freelancer Approval" 
            description="Freelancer holds final decision to capture or cancel funds." 
            icon="HelpCircle" 
            type="warning"
            badge="DECISION GATE"
          />
          
          {/* Branched SVG Split Connector */}
          <div className="w-full flex justify-center my-3">
            <svg viewBox="0 0 320 48" className="w-full max-w-[320px] h-12 text-zinc-800 overflow-visible" fill="none">
              <path d="M 160 0 L 160 12 L 80 12 L 80 48" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
              <path d="M 76 42 L 80 48 L 84 42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              
              <path d="M 160 0 L 160 12 L 240 12 L 240 48" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
              <path d="M 236 42 L 240 48 L 244 42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              
              <rect x="88" y="16" width="46" height="14" rx="3" fill="#064e3b" stroke="#047857" strokeWidth="0.5" />
              <text x="111" y="26" fill="#a7f3d0" fontSize="7" fontWeight="bold" textAnchor="middle">ACCEPT</text>
              
              <rect x="186" y="16" width="46" height="14" rx="3" fill="#7f1d1d" stroke="#b91c1c" strokeWidth="0.5" />
              <text x="209" y="26" fill="#fecaca" fontSize="7" fontWeight="bold" textAnchor="middle">REJECT</text>
            </svg>
          </div>

          {/* Double Columns for Accept/Reject Terminal Nodes */}
          <div className="grid grid-cols-2 gap-3 w-full">
            <div className="flex flex-col items-center">
              <FlowNode 
                title="Paid & Captured" 
                description="The system captures hold; routes funds." 
                icon="ShieldCheck" 
                type="success"
              />
            </div>
            <div className="flex flex-col items-center">
              <FlowNode 
                title="Cancelled" 
                description="Card hold released immediately." 
                icon="XCircle" 
                type="error"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
