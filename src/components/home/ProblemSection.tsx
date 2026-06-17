"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  LayoutGrid, 
  MessageSquare, 
  Users, 
  FileText, 
  Sliders, 
  AlertTriangle, 
  CheckCircle2,
  XCircle,
  HelpCircle
} from "lucide-react";

export default function ProblemSection() {
  return (
    <section className="relative w-full max-w-7xl mx-auto px-6 py-20 md:py-32 bg-abram-black text-white">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-0 w-80 h-80 bg-amber-500/[0.02] rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-10 w-96 h-96 bg-[#8ECAFF]/[0.02] rounded-full filter blur-[120px] pointer-events-none" />

      {/* Header and Core Statistic */}
      <div className="text-center max-w-xl mx-auto mb-16 space-y-4 relative z-10">
        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-[#8ECAFF] block">
          THE CHALLENGE
        </span>
        <h2 
          className="text-xl sm:text-2xl font-medium text-white tracking-tight uppercase leading-tight font-display"
        >
          The friction of creative campaign coordination
        </h2>
        <p className="text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
          Siloed systems and manual updates drain resources. <strong className="text-white font-medium">71%</strong> of campaign prep hours are spent on administrative coordination rather than creative execution.
        </p>
      </div>

      {/* Bento Grid (col-span-12 system with 5 elements) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 relative z-10">
        
        {/* Card 1: Tool Fragmentation (col-span-8) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="col-span-12 md:col-span-8 glass-panel p-6 rounded-2xl border border-white/[0.05] hover:border-white/10 transition-all duration-300 flex flex-col justify-between group overflow-hidden min-h-[340px]"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-black border border-white/[0.08] text-[#8ECAFF] group-hover:text-white transition-colors">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Tool Fragmentation
              </h3>
              <p className="text-xs text-white/60 leading-relaxed max-w-xl">
                Siloed platforms for intake, scheduling, and agreements create administrative friction, duplicate-entry errors, and coordination gaps.
              </p>
            </div>
          </div>

          {/* Visual Wireframe Mockup */}
          <div className="mt-6 border border-white/[0.06] rounded-xl bg-black/40 p-4 relative overflow-hidden h-40 flex flex-col justify-center gap-3">
            <div className="flex justify-between items-center text-[10px] text-zinc-500 pb-2 border-b border-white/[0.06]">
              <span className="font-mono">CAMPAIGN OPERATIONAL STATE</span>
              <span className="flex items-center gap-1 text-red-400 font-mono text-[9px]">
                <AlertTriangle className="w-3 h-3" /> DISCONNECTED SYSTEMS
              </span>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {[
                { title: "Briefs", value: "Airtable", color: "border-blue-500/20" },
                { title: "Roster", value: "Spreadsheets", color: "border-green-500/20" },
                { title: "Timeline", value: "Google Calendar", color: "border-yellow-500/20" },
                { title: "Contracts", value: "DocuSign", color: "border-purple-500/20" }
              ].map((sys, idx) => (
                <div key={idx} className={`p-2.5 rounded-lg border ${sys.color} bg-white/[0.02] flex flex-col justify-between h-20`}>
                  <span className="text-[10px] text-zinc-500 font-mono uppercase">{sys.title}</span>
                  <span className="text-xs font-semibold text-white/80 tracking-tight">{sys.value}</span>
                </div>
              ))}
            </div>

            {/* Dotted fragmented connection line */}
            <div className="absolute inset-x-0 top-[62%] h-[1px] border-t border-dashed border-red-500/30 pointer-events-none" />
          </div>
        </motion.div>

        {/* Card 2: Communication Silos (col-span-4) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="col-span-12 md:col-span-4 glass-panel p-6 rounded-2xl border border-white/[0.05] hover:border-white/10 transition-all duration-300 flex flex-col justify-between group overflow-hidden min-h-[340px]"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-black border border-white/[0.08] text-[#8ECAFF] group-hover:text-white transition-colors">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Communication Silos
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Crew coordination remains scattered across email, text messages, and fragmented chat threads.
              </p>
            </div>
          </div>

          {/* Visual Chat Thread Mockup */}
          <div className="mt-6 border border-white/[0.06] rounded-xl bg-black/40 p-4 space-y-2 relative overflow-hidden h-40 flex flex-col justify-end">
            <div className="absolute top-2 left-4 text-[9px] font-mono text-white/30 uppercase">Active Threads</div>
            
            <div className="p-2 rounded-lg bg-blue-500/5 border border-blue-500/10 text-[11px] self-start max-w-[85%] space-y-0.5">
              <div className="font-semibold text-blue-400 text-[9px] uppercase font-mono">Slack</div>
              <p className="text-white/70">"Did we lock the DP availability?"</p>
            </div>
            <div className="p-2 rounded-lg bg-green-500/5 border border-green-500/10 text-[11px] self-end max-w-[85%] space-y-0.5">
              <div className="font-semibold text-green-400 text-[9px] uppercase font-mono">WhatsApp</div>
              <p className="text-white/70">"Still waiting on the call sheet details."</p>
            </div>
            <div className="p-2 rounded-lg bg-purple-500/5 border border-purple-500/10 text-[11px] self-start max-w-[85%] space-y-0.5">
              <div className="font-semibold text-purple-400 text-[9px] uppercase font-mono">Email</div>
              <p className="text-white/70">"Attached draft version 4.pdf"</p>
            </div>
          </div>
        </motion.div>

        {/* Card 3: Crewing Bottlenecks (col-span-4) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="col-span-12 md:col-span-4 glass-panel p-6 rounded-2xl border border-white/[0.05] hover:border-white/10 transition-all duration-300 flex flex-col justify-between group overflow-hidden min-h-[340px]"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-black border border-white/[0.08] text-[#8ECAFF] group-hover:text-white transition-colors">
              <Users className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Crewing Bottlenecks
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Vetting and managing freelancer availability relies on outdated spreadsheets and slow manual outreach loops.
              </p>
            </div>
          </div>

          {/* Visual Availability Matrix Mockup */}
          <div className="mt-6 border border-white/[0.06] rounded-xl bg-black/40 p-3.5 space-y-2.5 h-40 overflow-hidden text-xs">
            <div className="flex justify-between items-center text-[9px] text-white/30 font-mono uppercase pb-1.5 border-b border-white/[0.05]">
              <span>Roster List</span>
              <span>Availability</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70 font-mono">Director of Photography</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono">Locked</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70 font-mono">Creative Director</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono">Hold (2d)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70 font-mono">Production Designer</span>
              <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-mono">Declined</span>
            </div>
          </div>
        </motion.div>

        {/* Card 4: Agreement Silos (col-span-4) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="col-span-12 md:col-span-4 glass-panel p-6 rounded-2xl border border-white/[0.05] hover:border-white/10 transition-all duration-300 flex flex-col justify-between group overflow-hidden min-h-[340px]"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-black border border-white/[0.08] text-[#8ECAFF] group-hover:text-white transition-colors">
              <FileText className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Agreement Silos
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Drafting, executing, and tracking independent contractor agreements remains a manual, slow workflow.
              </p>
            </div>
          </div>

          {/* Visual Contract Verification Mockup */}
          <div className="mt-6 border border-white/[0.06] rounded-xl bg-black/40 p-4 space-y-3 h-40 flex flex-col justify-between relative overflow-hidden">
            <div className="text-[9px] font-mono text-white/30 uppercase">Agreement Status</div>
            
            <div className="space-y-2 flex-1 flex flex-col justify-center">
              <div className="h-2 w-3/4 bg-white/10 rounded-full" />
              <div className="h-2 w-1/2 bg-white/10 rounded-full" />
              <div className="h-2 w-2/3 bg-white/10 rounded-full" />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
              <span className="text-[10px] text-zinc-400 font-mono">ICA_v3_revised.pdf</span>
              <span className="flex items-center gap-1.5 text-amber-400 text-[10px] font-mono">
                <ClockIcon className="w-3.5 h-3.5" /> Pending Signature
              </span>
            </div>
          </div>
        </motion.div>

        {/* Card 5: Resource Conflicts (col-span-4) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="col-span-12 md:col-span-4 glass-panel p-6 rounded-2xl border border-white/[0.05] hover:border-white/10 transition-all duration-300 flex flex-col justify-between group overflow-hidden min-h-[340px]"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-black border border-white/[0.08] text-[#8ECAFF] group-hover:text-white transition-colors">
              <Sliders className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Resource Conflicts
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Double-booking camera gear, studios, or key creative leads causes shoot delays and budget overflows.
              </p>
            </div>
          </div>

          {/* Visual Timeline Conflict Mockup */}
          <div className="mt-6 border border-white/[0.06] rounded-xl bg-black/40 p-4 space-y-3 h-40 flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-center text-[9px] text-white/30 font-mono uppercase">
              <span>Resource Timeline</span>
              <span>June 16</span>
            </div>

            <div className="space-y-2 flex-1 flex flex-col justify-center">
              <div className="relative h-7 bg-white/[0.02] border border-white/[0.05] rounded-md overflow-hidden flex items-center px-2">
                <span className="text-[10px] text-white/60 font-mono">ARRI Alexa 35 — Cam A</span>
                <div className="absolute inset-y-0 right-2 w-1/2 bg-red-500/10 border-l border-red-500/30 flex items-center px-2 text-[9px] text-red-400 font-semibold font-mono">
                  CONFLICT (2 SHOOTS)
                </div>
              </div>
              <div className="h-7 bg-white/[0.02] border border-white/[0.05] rounded-md flex items-center px-2">
                <span className="text-[10px] text-white/60 font-mono">Studio Stage A — Brooklyn</span>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}

// A custom Clock helper icon for UI consistency
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
