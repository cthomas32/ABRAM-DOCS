"use client";

import React, { useState } from "react";
import { 
  LayoutGrid, 
  List, 
  ChevronRight, 
  Plus,
  ArrowLeft,
  Check,
  Send
} from "lucide-react";

type ProjectsView = "card" | "list";
type TabKey = "overview" | "ros" | "callsheets" | "scheduling" | "timeline";

interface HubProject {
  id: string;
  title: string;
  type: string;
  description: string;
  status: "In Progress" | "Review Drafts" | "Awaiting Payment" | "Completed";
  calculated_progress: number | null;
  start_date: string;
  end_date: string;
  comment_count: number;
}

interface Quote {
  id: string;
  title: string;
  quote_number: string;
  date: string;
  amount: string;
  status: "Approved" | "Pending" | "Declined";
}

interface ActivityItem {
  id: string;
  text: string;
  time: string;
}

interface Milestone {
  id: string;
  title: string;
  status: "completed" | "in_progress" | "pending";
  target_date: string;
}

interface Deliverable {
  id: string;
  title: string;
  revision_count: number;
  approved_at: string | null;
  due_date: string | null;
}

interface ChatComment {
  id: string;
  sender: "client" | "crew";
  senderName: string;
  role: string;
  text: string;
  time: string;
}

export default function AgencyClientPortalMockup() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectTab, setProjectTab] = useState<TabKey>("overview");
  const [projectsView, setProjectsView] = useState<ProjectsView>("card");

  // Project List
  const [projects] = useState<HubProject[]>([
    {
      id: "P-01",
      title: "Helix Brand Reinvigoration",
      type: "Video Campaign",
      description: "Concept development and high-fidelity 3D motion layouts for the Q3 brand relaunch.",
      status: "Review Drafts",
      calculated_progress: 65,
      start_date: "Jul 01, 2026",
      end_date: "Aug 10, 2026",
      comment_count: 3
    },
    {
      id: "P-02",
      title: "Onyx Studio Rebrand",
      type: "Brand Identity",
      description: "Logo redesign, color palette exploration, and brand typography guidelines.",
      status: "In Progress",
      calculated_progress: 30,
      start_date: "Jul 10, 2026",
      end_date: "Sep 05, 2026",
      comment_count: 0
    },
    {
      id: "P-03",
      title: "Sensa App Social Launch",
      type: "Social Content Bundle",
      description: "Interactive short-form video sequences, assets package, and templates.",
      status: "Awaiting Payment",
      calculated_progress: 90,
      start_date: "Jun 15, 2026",
      end_date: "Jul 25, 2026",
      comment_count: 0
    }
  ]);

  const [quotes] = useState<Quote[]>([
    {
      id: "Q-01",
      title: "Phase 2 Production - Social Reels",
      quote_number: "Q-2026-004",
      date: "July 12, 2026",
      amount: "$14,500.00",
      status: "Approved"
    }
  ]);

  const [activities] = useState<ActivityItem[]>([
    { id: "A-01", text: "Sarah Chen approved Helix 3D product reel - Draft V2.mp4", time: "1h ago" },
    { id: "A-02", text: "Vesper Lin uploaded Helix 3D product reel - Draft V2.mp4", time: "2h ago" },
    { id: "A-03", text: "Sarah Chen requested changes on Helix 3D product reel - Draft V1.mp4", time: "4h ago" }
  ]);

  // Project Specific Detailed Data (Helix Brand Reinvigoration)
  const [deliverables, setDeliverables] = useState<Deliverable[]>([
    { id: "D-01", title: "Helix 3D product reel - Draft V2.mp4", revision_count: 2, approved_at: null, due_date: "Jul 20, 2026" },
    { id: "D-02", title: "Brand Guidelines Deck - Final V1.pdf", revision_count: 1, approved_at: "Jul 10, 2026", due_date: null },
    { id: "D-03", title: "Style Frames Concept Package.zip", revision_count: 1, approved_at: "Jul 05, 2026", due_date: null }
  ]);

  const [milestones] = useState<Milestone[]>([
    { id: "M-01", title: "Creative Concept & Scoping", status: "completed", target_date: "Jul 05, 2026" },
    { id: "M-02", title: "3D Animation Draft Submission", status: "completed", target_date: "Jul 12, 2026" },
    { id: "M-03", title: "Revision Adjustments & Approvals", status: "in_progress", target_date: "Jul 22, 2026" },
    { id: "M-04", title: "Final Deliverable Handoff", status: "pending", target_date: "Aug 10, 2026" }
  ]);

  const [comments, setComments] = useState<ChatComment[]>([
    { id: "C-01", sender: "client", senderName: "Sarah Chen", role: "Helix CEO", text: "Hi team! We are looking for slightly stronger lighting highlights in the initial intro sequence. Can we update the render?", time: "10:14 AM" },
    { id: "C-02", sender: "crew", senderName: "Vesper Lin", role: "3D Lead", text: "Got it! I will increase the key light intensity and update the V2 render by this afternoon.", time: "10:30 AM" },
    { id: "C-03", sender: "client", senderName: "Sarah Chen", role: "Helix CEO", text: "Perfect. V2 draft looks excellent. Approving that deliverable now.", time: "Just Now" }
  ]);

  const [newCommentText, setNewCommentText] = useState("");

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    const item: ChatComment = {
      id: `C-${Date.now()}`,
      sender: "client",
      senderName: "Sarah Chen",
      role: "Helix CEO",
      text: newCommentText,
      time: "Just Now"
    };
    setComments([...comments, item]);
    setNewCommentText("");
  };

  const handleApproveDeliverable = (id: string) => {
    setDeliverables(
      deliverables.map((d) => 
        d.id === id ? { ...d, approved_at: new Date().toISOString() } : d
      )
    );
  };

  // Find the selected project object
  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl border border-white/5 bg-zinc-950/40 p-4 sm:p-6 lg:p-8 backdrop-blur-xl relative overflow-visible select-none">
      {/* Background glow avoiding container clipping */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] sm:w-[600px] h-[200px] sm:h-[300px] bg-zinc-800/[0.015] rounded-full filter blur-[80px] pointer-events-none -z-10" />

      {/* View Wrapper */}
      <div className="w-full rounded-xl border border-white/8 bg-zinc-950/85 overflow-hidden shadow-2xl relative min-h-[500px]">
        
        {/* Viewport Content */}
        <div className="p-4 sm:p-6 md:p-8 bg-zinc-950/20 space-y-6 text-left">
          
          {!selectedProjectId ? (
            /* ──────── VIEW 1: PORTAL HUB (HOME) ──────── */
            <>
              {/* Header */}
              <header className="flex items-center gap-4 border-b border-white/5 pb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-950 border border-white/10 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-white font-sans">HX</span>
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-semibold text-white truncate font-sans">Helix Creative Brand Team</h1>
                  <p className="text-xs text-zinc-500 mt-0.5 font-sans">with ABRAM Network</p>
                </div>
              </header>

              {/* Projects Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-baseline gap-2.5">
                    <h2 className="text-[11px] font-medium text-zinc-400 tracking-wide font-sans uppercase">Projects</h2>
                    <span className="text-[10px] text-zinc-600 font-sans">{projects.length} active</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full border border-white/[0.08] bg-white/[0.02] text-[10px] font-semibold text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors font-sans cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      New request
                    </button>

                    {/* Card/List toggle */}
                    <div className="inline-flex items-center gap-0.5 rounded-full border border-white/[0.08] bg-white/[0.02] p-0.5">
                      <button
                        type="button"
                        onClick={() => setProjectsView("card")}
                        aria-label="Card view"
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                          projectsView === "card"
                            ? "bg-white/[0.08] text-white"
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        <LayoutGrid className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setProjectsView("list")}
                        aria-label="List view"
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                          projectsView === "list"
                            ? "bg-white/[0.08] text-white"
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        <List className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {projectsView === "card" ? (
                  /* Card view grid */
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {projects.map((project) => (
                      <button
                        key={project.id}
                        type="button"
                        onClick={() => {
                          setSelectedProjectId(project.id);
                          setProjectTab("overview");
                        }}
                        className="group flex flex-col gap-3 bg-white/[0.03] backdrop-blur-xl border border-white/[0.07] rounded-2xl p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all hover:bg-white/[0.05] hover:border-white/10 text-left w-full cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-3 w-full">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-xs sm:text-sm text-zinc-100 font-semibold truncate font-sans">
                              {project.title}
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 shrink-0 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                        </div>

                        <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2 -mt-1 font-sans">
                          {project.description}
                        </p>

                        <div className="mt-auto pt-2 w-full">
                          {project.calculated_progress != null ? (
                            <div className="flex items-center gap-2.5">
                              <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-white rounded-full transition-all duration-300"
                                  style={{ width: `${project.calculated_progress}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-zinc-400 font-sans">{project.calculated_progress}%</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-zinc-500 font-sans">
                              {project.end_date ? `Target ${project.end_date}` : "In progress"}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between border-t border-white/[0.05] pt-2.5 mt-1 w-full">
                          {/* StatusBadge */}
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-sans font-semibold border ${
                            project.status === "Review Drafts" 
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
                              : project.status === "Completed"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : project.status === "Awaiting Payment"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          }`}>
                            {project.status}
                          </span>
                          <span className="text-[10px] text-zinc-600 font-sans">
                            {project.comment_count > 0
                              ? `${project.comment_count} ${project.comment_count === 1 ? "message" : "messages"}`
                              : "No messages"}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  /* List view card */
                  <div className="border border-white/[0.07] bg-white/[0.03] backdrop-blur-xl rounded-2xl p-2.5 overflow-hidden">
                    <div className="flex flex-col">
                      {projects.map((project) => (
                        <button
                          key={project.id}
                          type="button"
                          onClick={() => {
                            setSelectedProjectId(project.id);
                            setProjectTab("overview");
                          }}
                          className="flex items-center gap-3.5 px-3 py-3 rounded-xl hover:bg-white/[0.04] transition-colors group cursor-pointer text-left w-full"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="block text-xs sm:text-sm text-zinc-100 font-semibold truncate font-sans">
                              {project.title}
                            </span>
                            <span className="block text-[11px] text-zinc-500 truncate mt-0.5 font-sans">
                              {project.description}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 pl-4 shrink-0">
                            {project.comment_count > 0 && (
                              <span className="text-[10px] text-zinc-600 font-sans hidden sm:inline">
                                {project.comment_count} {project.comment_count === 1 ? "message" : "messages"}
                              </span>
                            )}
                            <span className="text-xs text-zinc-500 font-sans hidden sm:inline">
                              {project.calculated_progress != null ? `${project.calculated_progress}%` : project.end_date}
                            </span>
                            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Quotes Section */}
              <section className="border border-white/[0.07] bg-white/[0.03] backdrop-blur-xl rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between px-2 pt-2">
                  <h3 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider font-sans">Quotes</h3>
                  <span className="text-[10px] text-zinc-600 font-sans">{quotes.length} total</span>
                </div>
                <div className="flex flex-col">
                  {quotes.map((quote) => (
                    <div
                      key={quote.id}
                      className="flex items-center gap-3.5 px-3 py-3 rounded-xl hover:bg-white/[0.04] transition-colors group cursor-pointer"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="block text-xs sm:text-sm text-zinc-100 font-semibold truncate font-sans">
                          {quote.title}
                        </span>
                        <span className="block text-[11px] text-zinc-500 truncate mt-0.5 font-sans">
                          {quote.quote_number} · {quote.date}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 pl-4 shrink-0">
                        <span className="text-xs text-zinc-400 font-sans hidden sm:inline">
                          {quote.amount}
                        </span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-sans font-semibold border ${
                          quote.status === "Approved"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}>
                          {quote.status}
                        </span>
                        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Activity Section */}
              <section className="border border-white/[0.07] bg-white/[0.03] backdrop-blur-xl rounded-2xl p-5 space-y-4">
                <h3 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider font-sans">Recent activity</h3>
                <div className="space-y-3.5">
                  {activities.map((act) => (
                    <div key={act.id} className="flex items-start justify-between gap-4 text-xs font-sans">
                      <div className="flex items-start gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 mt-1.5 shrink-0" />
                        <p className="text-zinc-300 leading-normal font-sans select-text">{act.text}</p>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-sans shrink-0 pt-0.5">{act.time}</span>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : (
            /* ──────── VIEW 2: PORTAL PROJECT (DETAILS) ──────── */
            <div className="space-y-5">
              
              {/* Back to all projects link */}
              <button
                type="button"
                onClick={() => setSelectedProjectId(null)}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                All projects
              </button>

              {/* Project Header */}
              <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-lg font-semibold text-white truncate font-sans">
                      {activeProject.title}
                    </h1>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-sans font-semibold border ${
                      activeProject.status === "Review Drafts" 
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
                        : activeProject.status === "Completed"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    }`}>
                      {activeProject.status}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1.5 font-sans">
                    {activeProject.start_date} to {activeProject.end_date} · 8 on the crew · {deliverables.filter(d => d.approved_at).length}/{deliverables.length} approved
                  </p>
                </div>
                
                {activeProject.calculated_progress != null && (
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-36 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white rounded-full transition-all duration-300" 
                        style={{ width: `${activeProject.calculated_progress}%` }} 
                      />
                    </div>
                    <span className="text-xs text-zinc-400 font-sans">{activeProject.calculated_progress}%</span>
                  </div>
                )}
              </header>

              {/* Sub-tabs row */}
              <div className="flex items-center gap-2 border-b border-white/8 mt-6 mb-5">
                {[
                  { key: "overview", label: "Overview" },
                  { key: "ros", label: "Run of Show" },
                  { key: "callsheets", label: "Call Sheets" },
                  { key: "scheduling", label: "Scheduling" },
                  { key: "timeline", label: "Timeline" }
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setProjectTab(t.key as TabKey)}
                    className={`relative px-3 pb-2.5 text-xs font-semibold transition-colors cursor-pointer -mb-[1px] ${
                      projectTab === t.key
                        ? "text-white"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {t.label}
                    {projectTab === t.key && (
                      <span className="absolute left-3 right-3 bottom-0 h-[2px] bg-white rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              {/* Sub-tab viewport panels */}
              {projectTab === "overview" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                  
                  {/* Left panel: Deliverables & Milestones */}
                  <div className="lg:col-span-7 flex flex-col gap-4">
                    
                    {/* Deliverables */}
                    <div className="border border-white/[0.07] bg-white/[0.03] backdrop-blur-xl rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider font-sans">Deliverables</h3>
                        <span className="text-[10px] text-zinc-600 font-sans">{deliverables.filter(d => d.approved_at).length}/{deliverables.length} approved</span>
                      </div>
                      
                      <div className="flex flex-col">
                        {deliverables.map((d) => (
                          <div
                            key={d.id}
                            className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors justify-between"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${d.approved_at ? "bg-emerald-400" : "bg-amber-400"}`} />
                              <span className="text-xs font-semibold text-zinc-200 truncate font-sans">{d.title}</span>
                              <span className="text-[9px] text-zinc-500 font-sans">v{d.revision_count}.0</span>
                            </div>
                            
                            <div>
                              {d.approved_at ? (
                                <span className="text-[10px] text-emerald-400 font-sans">Approved</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleApproveDeliverable(d.id)}
                                  className="h-6 px-2.5 rounded-full border border-white/15 bg-white/[0.06] text-white hover:bg-white/15 text-[10px] font-semibold transition-all cursor-pointer"
                                >
                                  Approve
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Milestones */}
                    <div className="border border-white/[0.07] bg-white/[0.03] backdrop-blur-xl rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider font-sans">Milestones</h3>
                        <span className="text-[10px] text-zinc-600 font-sans">
                          {milestones.filter(m => m.status === "completed").length}/{milestones.length} completed
                        </span>
                      </div>
                      
                      <div className="flex flex-col">
                        {milestones.map((m) => {
                          const done = m.status === "completed";
                          return (
                            <div
                              key={m.id}
                              className="flex items-center gap-3.5 py-2.5 border-b border-white/[0.04] last:border-0 justify-between"
                            >
                              <div className="flex items-center gap-3.5">
                                {done ? (
                                  <span className="w-4 h-4 shrink-0 rounded-full bg-white flex items-center justify-center">
                                    <Check className="w-2.5 h-2.5 text-zinc-950" strokeWidth={3} />
                                  </span>
                                ) : (
                                  <span className="w-4 h-4 shrink-0 rounded-full border-[1.5px] border-zinc-700" />
                                )}
                                <span className={`text-xs font-semibold ${done ? "text-zinc-500" : "text-zinc-200"}`}>{m.title}</span>
                              </div>
                              <span className="text-[10px] text-zinc-500 font-sans">{m.target_date}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                  {/* Right panel: Discussion thread */}
                  <div className="lg:col-span-5 border border-white/[0.07] bg-white/[0.03] backdrop-blur-xl rounded-2xl p-5 flex flex-col justify-between h-[380px]">
                    <div className="space-y-2 pb-2">
                      <h3 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider font-sans">Discussion</h3>
                      <span className="text-[10px] text-zinc-600 font-sans block">{comments.length} messages</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pb-3 pr-1 max-h-[220px]">
                      {comments.map((c) => (
                        <div
                          key={c.id}
                          className={`flex flex-col ${c.sender === "client" ? "items-end" : "items-start"}`}
                        >
                          <div className="max-w-[85%] space-y-1">
                            <span className="text-[9px] font-semibold text-zinc-500 block">
                              {c.senderName} ({c.role})
                            </span>
                            <div className={`p-2.5 rounded-xl text-xs leading-normal font-sans ${
                              c.sender === "client" 
                                ? "bg-white/[0.12] text-white border border-white/[0.12] rounded-tr-none" 
                                : "bg-zinc-900 border border-white/5 text-zinc-300 rounded-tl-none"
                            }`}>
                              {c.text}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handlePostComment} className="flex gap-2 pt-2 border-t border-white/5">
                      <input
                        type="text"
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        placeholder="Message the team..."
                        className="flex-1 bg-zinc-900 border border-white/5 rounded-full px-3.5 py-1.5 text-xs text-white outline-none font-sans"
                      />
                      <button
                        type="submit"
                        className="w-10 h-7 rounded-full border border-white/[0.15] bg-white/[0.08] flex items-center justify-center shrink-0 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5 text-black" />
                      </button>
                    </form>

                  </div>

                </div>
              )}

              {/* Sub-tab: Run of Show */}
              {projectTab === "ros" && (
                <div className="border border-white/[0.07] bg-white/[0.03] backdrop-blur-xl rounded-2xl p-5 space-y-4">
                  <h3 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider font-sans">Run of Show</h3>
                  <div className="flex flex-col">
                    <div className="hidden sm:grid grid-cols-12 gap-3 px-2 pb-2 text-[9px] uppercase tracking-wider text-zinc-500 font-semibold border-b border-white/5">
                      <span className="col-span-2">Time</span>
                      <span className="col-span-5">Segment</span>
                      <span className="col-span-2">Duration</span>
                      <span className="col-span-3">Talent</span>
                    </div>
                    {[
                      { id: "S1", start: "09:00 AM", title: "Intro & Client Kickoff Remarks", duration: 15, talent: "Sarah Chen, Exec Crew" },
                      { id: "S2", start: "09:15 AM", title: "A-Roll Studio Scene Setup", duration: 45, talent: "Lead Cast" },
                      { id: "S3", start: "10:00 AM", title: "Product Closeups & Macro Lighting", duration: 90, talent: "Macro Cast" },
                      { id: "S4", start: "11:30 AM", title: "B-Roll Capture & Ambient Plates", duration: 30, talent: "TBD" }
                    ].map((seg) => (
                      <div
                        key={seg.id}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 px-2 py-3 border-b border-white/[0.04] last:border-0 items-baseline"
                      >
                        <span className="sm:col-span-2 text-xs text-zinc-400 font-sans">{seg.start}</span>
                        <div className="sm:col-span-5">
                          <p className="text-xs font-semibold text-zinc-200 font-sans">{seg.title}</p>
                        </div>
                        <span className="sm:col-span-2 text-xs text-zinc-500 font-sans">{seg.duration} min</span>
                        <span className="sm:col-span-3 text-xs text-zinc-500 truncate font-sans">{seg.talent}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-tab: Call Sheets */}
              {projectTab === "callsheets" && (
                <div className="border border-white/[0.07] bg-white/[0.03] backdrop-blur-xl rounded-2xl p-5 space-y-4">
                  <h3 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider font-sans">Call Sheets</h3>
                  
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-xs font-semibold text-zinc-200 font-sans">Day 1 of 2 (Shoot Day)</span>
                      <span className="text-xs text-zinc-500 font-sans">Jul 12, 2026</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-zinc-500 block">General Call</span>
                        <span className="text-xs text-zinc-300 font-sans">08:00 AM</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-zinc-500 block">Shoot Call</span>
                        <span className="text-xs text-zinc-300 font-sans">09:00 AM</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-zinc-500 block">Lunch</span>
                        <span className="text-xs text-zinc-300 font-sans">01:00 PM</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-zinc-500 block">Location Zone</span>
                        <span className="text-xs text-zinc-300 font-sans">Stage A, Brooklyn</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/[0.05]">
                      <span className="text-[9px] uppercase tracking-wider text-zinc-500 block mb-1">Safety Notes</span>
                      <p className="text-xs text-zinc-400 leading-normal font-sans">
                        Please wear closed-toe shoes on set. Standard safety briefing commences at 08:45 AM.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab: Scheduling */}
              {projectTab === "scheduling" && (
                <div className="border border-white/[0.07] bg-white/[0.03] backdrop-blur-xl rounded-2xl p-5 space-y-4">
                  <h3 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider font-sans">Scheduling</h3>
                  
                  <div className="flex flex-col">
                    <div className="hidden sm:grid grid-cols-12 gap-3 px-2 pb-2 text-[9px] uppercase tracking-wider text-zinc-500 font-semibold border-b border-white/5">
                      <span className="col-span-2">Scene</span>
                      <span className="col-span-6">Slug</span>
                      <span className="col-span-2">Pages</span>
                      <span className="col-span-2">Est. Time</span>
                    </div>
                    {[
                      { num: "Scene 1", slug: "INT. STUDIO - DAY", pages: 1.5, est: "45 min" },
                      { num: "Scene 2", slug: "INT. CYC WALL - DAY", pages: 0.8, est: "30 min" },
                      { num: "Scene 3", slug: "INT. CONTROL ROOM - NIGHT", pages: 2.2, est: "75 min" }
                    ].map((sc) => (
                      <div
                        key={sc.num}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 px-2 py-3 border-b border-white/[0.04] last:border-0 items-baseline"
                      >
                        <span className="sm:col-span-2 text-xs font-semibold text-zinc-300 font-sans">{sc.num}</span>
                        <span className="sm:col-span-6 text-xs text-zinc-200 font-sans">{sc.slug}</span>
                        <span className="sm:col-span-2 text-xs text-zinc-500 font-sans">{sc.pages} pg</span>
                        <span className="sm:col-span-2 text-xs text-zinc-500 font-sans">{sc.est}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-tab: Timeline */}
              {projectTab === "timeline" && (
                <div className="border border-white/[0.07] bg-white/[0.03] backdrop-blur-xl rounded-2xl p-5 space-y-4">
                  <h3 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider font-sans">Timeline</h3>
                  
                  <div className="relative pl-5 py-1">
                    {/* Timeline Spine */}
                    <span className="absolute left-[5px] top-1 bottom-1 w-px bg-white/[0.07]" />
                    
                    <div className="flex flex-col gap-4">
                      {[
                        { title: "Creative Concept & Scoping", kind: "milestone", date: "Jul 05, 2026", done: true },
                        { title: "Style Frames Concept Package.zip", kind: "deliverable", date: "Jul 05, 2026", done: true },
                        { title: "Brand Guidelines Deck - Final V1.pdf", kind: "deliverable", date: "Jul 10, 2026", done: true },
                        { title: "3D Animation Draft Submission", kind: "milestone", date: "Jul 12, 2026", done: true },
                        { title: "Helix 3D product reel - Draft V2.mp4", kind: "deliverable", date: "Jul 20, 2026", done: false },
                        { title: "Revision Adjustments & Approvals", kind: "milestone", date: "Jul 22, 2026", done: false },
                        { title: "Final Deliverable Handoff", kind: "milestone", date: "Aug 10, 2026", done: false }
                      ].map((item, idx) => (
                        <div key={idx} className="relative">
                          <span className={`absolute -left-5 top-1 w-2.5 h-2.5 rounded-full border border-zinc-950 ${
                            item.done ? "bg-emerald-400" : "bg-zinc-700"
                          }`} />
                          
                          <div className="flex items-baseline justify-between gap-3">
                            <div>
                              <p className={`text-xs font-semibold ${item.done ? "text-zinc-500" : "text-zinc-200"}`}>{item.title}</p>
                              <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-sans mt-0.5 block">{item.kind}</span>
                            </div>
                            <span className="text-xs text-zinc-500 font-sans">{item.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
