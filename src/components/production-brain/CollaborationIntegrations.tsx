"use client";

import React, { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, 
  Film, 
  Send, 
  Check, 
  Share2, 
  Link2, 
  RefreshCw,
  ArrowRight,
  Clock,
  UserCheck,
  Folder,
  FileText
} from "lucide-react";
import { revealVariants, ease } from "@/lib/motion";

type IntegrationType = "feeds" | "slack" | "frameio";

const Slack = (props: React.ComponentProps<"svg">) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="none"
    className={props.className}
    {...props}
  >
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523 2.528 2.528 0 0 1-2.522-2.523 2.528 2.528 0 0 1 2.522-2.52h2.52v2.52zm1.261 0a2.528 2.528 0 0 1 2.52-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.042a2.528 2.528 0 0 1-2.522 2.52H8.824a2.528 2.528 0 0 1-2.52-2.52v-5.042zM8.824 5.043a2.528 2.528 0 0 1-2.52-2.522A2.528 2.528 0 0 1 8.824 0a2.528 2.528 0 0 1 2.522 2.521v2.522h-2.522zm0 1.261a2.528 2.528 0 0 1 2.522 2.52v5.043a2.528 2.528 0 0 1-2.522 2.52H3.782a2.528 2.528 0 0 1-2.522-2.52V8.824a2.528 2.528 0 0 1 2.522-2.52h5.042zm10.134 3.761a2.528 2.528 0 0 1 2.52-2.52 2.528 2.528 0 0 1 2.522 2.52 2.528 2.528 0 0 1-2.522 2.52h-2.52v-2.52zm-1.262 0a2.528 2.528 0 0 1-2.52 2.52h-5.043a2.528 2.528 0 0 1-2.522-2.52V5.043a2.528 2.528 0 0 1 2.522-2.52h5.043a2.528 2.528 0 0 1 2.52 2.52v5.043zm-3.772 10.153a2.528 2.528 0 0 1 2.52 2.522 2.528 2.528 0 0 1-2.52-2.522 2.528 2.528 0 0 1-2.522-2.522v-2.522h2.522zm0-1.261a2.528 2.528 0 0 1-2.522-2.52v-5.043a2.528 2.528 0 0 1 2.522-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.043a2.528 2.528 0 0 1-2.522 2.52h-5.043z" />
  </svg>
);

export default function CollaborationIntegrations() {
  const [activeTab, setActiveTab] = useState<IntegrationType>("feeds");
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 });

  const tabs = [
    {
      id: "feeds" as IntegrationType,
      icon: MessageSquare,
      badge: "Pillar 1",
      title: "Contextual Activity Feeds",
      description: "Unify comments and logs using project-bound UI components to keep team collaboration synchronized with specific work tasks.",
      details: [
        "Comment threads pinned directly to project files",
        "Chronological activity history tracking",
        "Direct mentions to alert specific team members"
      ]
    },
    {
      id: "slack" as IntegrationType,
      icon: Slack,
      badge: "Pillar 2",
      title: "Interactive Slack Broadcasts",
      description: "Trigger real-time updates and interactive responses to mapped project channels via secure integration hooks.",
      details: [
        "Instant interactive Slack response relays",
        "Real-time notifications sent to project channels",
        "Immediate alerts for milestones and call sheet updates"
      ]
    },
    {
      id: "frameio" as IntegrationType,
      icon: Film,
      badge: "Pillar 3",
      title: "Frame.io Workspace Sync",
      description: "Map production folders and sync workspace assets directly using native integrations inside project dashboards.",
      details: [
        "Synchronized folder and file catalog browsing",
        "Automatic creation of project directories",
        "Secure connection linking and decoupling features"
      ]
    }
  ];

  return (
    <section 
      ref={sectionRef}
      className="relative w-full py-24 md:py-36 bg-transparent overflow-hidden selection:bg-zinc-800 selection:text-white"
    >
      {/* Background Ambient Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[750px] h-[350px] md:h-[450px] bg-indigo-950/20 rounded-full blur-[120px] pointer-events-none z-0" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Section Header */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0, y: 30, filter: "blur(6px)" },
            visible: { 
              opacity: 1, 
              y: 0, 
              filter: "blur(0px)",
              transition: { duration: 0.8, ease: "easeOut" } 
            }
          }}
          className="text-center max-w-3xl mx-auto mb-16 md:mb-20"
        >
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 block mb-3 font-sans">
            COLLABORATION INTEGRATIONS
          </span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4 font-sans">
            Unified Production Sync
          </h2>
          <p className="text-base md:text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed font-sans">
            Connect your team, tools, and reviews in one central hub. ABRAM bridges daily logistics with instant messaging and review workspaces.
          </p>
        </motion.div>

        {/* Core Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:items-stretch items-start max-w-6xl mx-auto">
          
          {/* Left Block: Interactive Tabs */}
          <div className="lg:col-span-5 flex flex-col gap-4 order-2 lg:order-1">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <motion.div
                  key={tab.id}
                  variants={revealVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={0.1 + index * 0.1}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative flex flex-col rounded-2xl p-5 md:p-6 cursor-pointer transition-all duration-300 border text-left ${
                    isActive 
                      ? "bg-zinc-900/30 border-white/10 shadow-lg shadow-black/40" 
                      : "bg-zinc-950/20 border-white/5 hover:border-white/10 hover:bg-zinc-900/10"
                  }`}
                >
                  {/* Subtle active status indicator glow */}
                  {isActive && (
                    <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-zinc-400/30 to-transparent" />
                  )}

                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[9px] font-semibold tracking-widest uppercase text-zinc-500">
                      {tab.badge}
                    </span>
                    {isActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-pulse" />
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border transition-colors ${
                      isActive ? "bg-white/5 border-white/15 text-white" : "bg-white/[0.02] border-white/5 text-zinc-500 group-hover:text-zinc-300"
                    }`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <h3 className={`text-base font-semibold tracking-tight transition-colors ${
                      isActive ? "text-white" : "text-zinc-300 group-hover:text-white"
                    }`}>
                      {tab.title}
                    </h3>
                  </div>

                  <p className="mt-3 text-xs font-normal leading-relaxed text-zinc-400">
                    {tab.description}
                  </p>

                  <div className="mt-4 flex flex-col gap-1.5 border-t border-white/5 pt-3">
                    {tab.details.map((detail, dIdx) => (
                      <div key={dIdx} className="flex items-center gap-2 text-[11px] text-zinc-400">
                        <Check className="h-3 w-3 text-zinc-500 shrink-0" />
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Right Block: Live High-Fidelity Previews */}
          <div className="lg:col-span-7 flex items-center justify-center relative order-1 lg:order-2 min-h-[350px] lg:min-h-full">
            <div className="relative w-full h-[420px] rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md overflow-hidden flex flex-col">
              
              {/* Preview Window Header */}
              <div className="px-4 py-3 border-b border-white/5 bg-zinc-950/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  </div>
                  <span className="font-mono text-[9px] tracking-widest text-zinc-500 font-semibold uppercase ml-2">
                    INTEGRATION PREVIEW // {activeTab.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                  <RefreshCw className="h-2.5 w-2.5 animate-spin" style={{ animationDuration: '4s' }} />
                  <span>LIVE SYNC</span>
                </div>
              </div>

              {/* Dynamic Simulated Outputs */}
              <div className="flex-1 p-5 overflow-y-auto bg-zinc-950/10 font-sans flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  
                  {/* TAB 1: CONTEXTUAL FEEDS PREVIEW */}
                  {activeTab === "feeds" && (
                    <motion.div
                      key="feeds-preview"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="text-[9px] uppercase font-mono tracking-wider text-zinc-500 block mb-1">
                        PROTOCOL: COLLABORATION FEED
                      </div>

                      {/* Comments Feed Mockup */}
                      <div className="space-y-3">
                        <div className="flex items-start gap-2.5 bg-zinc-900/30 border border-white/5 p-3 rounded-xl">
                          <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[10px] text-zinc-200 font-bold shrink-0">
                            JD
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-white">John Doe</span>
                              <span className="text-[9px] text-zinc-500 font-mono">10:42 AM</span>
                            </div>
                            <p className="text-xs text-zinc-300 leading-normal">
                              Uploaded the workspace layout file. Let's get <span className="text-white font-medium">@Selene Apex</span> to review.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5 bg-zinc-900/30 border border-white/5 p-3 rounded-xl ml-6">
                          <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[10px] text-zinc-200 font-bold shrink-0">
                            SA
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-white">Selene Apex</span>
                              <span className="text-[9px] text-zinc-500 font-mono">10:48 AM</span>
                            </div>
                            <p className="text-xs text-zinc-300 leading-normal">
                              The folder architecture in the project directory is perfect. Approved.
                            </p>
                          </div>
                        </div>

                        {/* Chronological Log Banner */}
                        <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-lg text-emerald-400 font-mono text-[10px]">
                          <Check className="h-3.5 w-3.5" />
                          <span>LOG: Document status changed to Approved by @Selene Apex.</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 2: SLACK BROADCASTS PREVIEW */}
                  {activeTab === "slack" && (
                    <motion.div
                      key="slack-preview"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="text-[9px] uppercase font-mono tracking-wider text-zinc-500 block mb-1">
                        PROTOCOL: SECURE UPDATE RELAY
                      </div>

                      {/* Slack Message Container */}
                      <div className="border border-white/10 bg-zinc-900/40 rounded-xl p-4 space-y-3 font-sans text-left">
                        <div className="flex items-center gap-2 text-xs text-zinc-400 pb-1.5 border-b border-white/5">
                          <Slack className="h-4 w-4 text-purple-400" />
                          <span className="font-semibold text-zinc-300">#production-updates</span>
                          <span className="text-[10px] text-zinc-500 ml-auto">CONNECTED</span>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded bg-zinc-950 border border-white/5 flex items-center justify-center shrink-0 text-white font-bold text-xs">
                            AB
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-white">ABRAM Bot</span>
                              <span className="text-[8px] bg-white/10 text-zinc-300 px-1 rounded uppercase tracking-wider font-mono">APP</span>
                            </div>
                            <div className="text-xs text-zinc-300 leading-normal space-y-1">
                              <p className="font-semibold text-white">🎉 Milestone Complete for Project Vesper:</p>
                              <p className="text-zinc-400">Task <span className="text-zinc-300">\"Deliverables Upload\"</span> was marked as complete.</p>
                            </div>

                            {/* Slack Interactive Buttons */}
                            <div className="flex flex-wrap gap-2 pt-1.5">
                              <button 
                                onClick={() => alert("Action Simulated: Approved in Slack!")}
                                className="bg-white hover:bg-zinc-200 text-black font-semibold text-[10px] px-3 py-1.5 rounded-md cursor-pointer transition-all"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => alert("Action Simulated: Revision requested in Slack!")}
                                className="bg-white/[0.05] border border-white/10 hover:bg-white/[0.08] text-white text-[10px] px-3 py-1.5 rounded-md cursor-pointer transition-all"
                              >
                                Request Revision
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Crew Check-in Event */}
                        <div className="flex items-start gap-3 border-t border-white/5 pt-3">
                          <div className="w-8 h-8 rounded bg-zinc-950 border border-white/5 flex items-center justify-center shrink-0 text-white font-bold text-xs">
                            AB
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-white">ABRAM Bot</span>
                              <span className="text-[8px] bg-white/10 text-zinc-300 px-1 rounded uppercase tracking-wider font-mono">APP</span>
                            </div>
                            <p className="text-xs text-zinc-400 leading-normal">
                              📅 <span className="text-zinc-200 font-semibold">Call sheet published:</span> Day 12 Call is 07:00 AM at Stage 4.
                            </p>
                            <button 
                              onClick={() => alert("Action Simulated: Checked-in successfully from Slack!")}
                              className="bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 text-[10px] px-3 py-1.5 rounded-md cursor-pointer transition-all flex items-center gap-1"
                            >
                              <UserCheck className="h-3 w-3" /> Mark On-Site
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 3: FRAME.IO WORKSPACES PREVIEW */}
                  {activeTab === "frameio" && (
                    <motion.div
                      key="frameio-preview"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="text-[9px] uppercase font-mono tracking-wider text-zinc-500 block mb-1">
                        PROTOCOL: WORKSPACE STORAGE
                      </div>

                      {/* Frame.io Folders and Files Mockup */}
                      <div className="border border-white/5 bg-zinc-900/30 rounded-xl p-4 space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <div className="space-y-0.5">
                            <span className="text-[9px] uppercase tracking-wider font-mono text-zinc-500">Workspace Tree</span>
                            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                              <Folder className="h-3.5 w-3.5 text-zinc-400" />
                              Vesper Chronicles /
                            </h4>
                          </div>
                          <span className="text-[10px] font-mono bg-white/5 border border-white/5 px-2.5 py-0.5 rounded text-zinc-400">
                            Frame.io V4 API
                          </span>
                        </div>

                        {/* Folders & Files Hierarchy */}
                        <div className="space-y-2">
                          
                          {/* Folder 1 */}
                          <div className="flex items-center gap-3 p-2.5 rounded-lg border border-white/5 bg-zinc-950/40 hover:border-white/10 transition-all">
                            <div className="w-8 h-8 bg-zinc-800/60 border border-white/5 rounded flex items-center justify-center shrink-0">
                              <Folder className="h-4 w-4 text-zinc-400" />
                            </div>
                            <div className="space-y-0.5 flex-1 min-w-0">
                              <h5 className="text-[11px] font-semibold text-zinc-200 truncate">📁 Day_12_Rushes /</h5>
                              <p className="text-[9px] text-zinc-500 font-mono">12 items • synced with platform workspace</p>
                            </div>
                          </div>

                          {/* Folder 2 */}
                          <div className="flex items-center gap-3 p-2.5 rounded-lg border border-white/5 bg-zinc-950/40 hover:border-white/10 transition-all">
                            <div className="w-8 h-8 bg-zinc-800/60 border border-white/5 rounded flex items-center justify-center shrink-0">
                              <Folder className="h-4 w-4 text-zinc-400" />
                            </div>
                            <div className="space-y-0.5 flex-1 min-w-0">
                              <h5 className="text-[11px] font-semibold text-zinc-200 truncate">📁 Sound_Logs /</h5>
                              <p className="text-[9px] text-zinc-500 font-mono">3 items</p>
                            </div>
                          </div>

                          {/* File 1 */}
                          <div className="flex items-center gap-3 p-2.5 rounded-lg border border-white/5 bg-zinc-950/40 hover:border-white/10 transition-all ml-4">
                            <div className="w-8 h-8 bg-zinc-800/40 border border-white/5 rounded flex items-center justify-center shrink-0">
                              <FileText className="h-4 w-4 text-zinc-500" />
                            </div>
                            <div className="space-y-0.5 flex-1 min-w-0">
                              <h5 className="text-[11px] font-semibold text-zinc-300 truncate">📄 shoot_timeline_v1.pdf</h5>
                              <p className="text-[9px] text-zinc-500 font-mono">1.2 MB</p>
                            </div>
                          </div>

                        </div>

                        {/* Sync stats */}
                        <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-2 rounded-lg text-[10px] text-zinc-400 font-mono">
                          <span className="flex items-center gap-1.5">
                            <Share2 className="h-3.5 w-3.5 text-zinc-500" />
                            Active Folder References
                          </span>
                          <span className="text-[9px] text-zinc-500">Last Synced: 2 min ago</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* Bottom Footer Info */}
              <div className="px-4 py-3 border-t border-white/5 bg-zinc-950/40 flex items-center justify-between text-[10px] text-zinc-500">
                <span>Secure App Authorization Protocols</span>
                <a 
                  href="https://app.abram.network" 
                  className="hover:text-white flex items-center gap-1 transition-colors"
                >
                  Configure Integrations <ArrowRight className="h-3 w-3" />
                </a>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
