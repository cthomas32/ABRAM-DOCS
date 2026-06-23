"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, 
  Video, 
  Users, 
  CheckSquare, 
  Check, 
  X, 
  Sparkles, 
  Clock, 
  MapPin, 
  Folder, 
  FileVideo, 
  Hash, 
  ArrowRight,
  Zap, 
  AlertTriangle, 
  FileUp, 
  CheckCircle2 
} from "lucide-react";

// ==========================================
// 1. CONTEXTUAL PROJECT FEED MOCKUP
// ==========================================
interface FeedItem {
  id: string;
  type: "message" | "deliverable_submitted" | "milestone_completed" | "blocker_reported";
  user?: string;
  avatar?: string;
  role?: string;
  time: string;
  text: string;
}

function ProjectCommentThreadMockup({ triggerSim }: { triggerSim: boolean }) {
  const [feed, setFeed] = useState<FeedItem[]>([
    {
      id: "1",
      type: "message",
      user: "Sarah L.",
      avatar: "SL",
      role: "Designer",
      time: "5m ago",
      text: "Upload complete! Let me know if the font hierarchy is working."
    },
    {
      id: "2",
      type: "deliverable_submitted",
      time: "4m ago",
      text: "Deliverable 'Brand Assets V2.zip' uploaded by Sarah L."
    },
    {
      id: "3",
      type: "message",
      user: "Marcus V.",
      avatar: "MV",
      role: "Gaffer",
      time: "2m ago",
      text: "Looks clean. I'll review with the setup."
    }
  ]);
  const [simAdded, setSimAdded] = useState(false);

  useEffect(() => {
    if (triggerSim && !simAdded) {
      const timer = setTimeout(() => {
        setFeed(prev => [
          ...prev,
          {
            id: "4",
            type: "blocker_reported",
            time: "Just now",
            text: "Blocker reported by Emily W.: 'Need client logo approval before scene 3'."
          },
          {
            id: "5",
            type: "milestone_completed",
            time: "Just now",
            text: "Milestone 'Phase 1 Brand Guidelines' marked complete."
          }
        ]);
        setSimAdded(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [triggerSim, simAdded]);

  useEffect(() => {
    if (!triggerSim) {
      setFeed([
        {
          id: "1",
          type: "message",
          user: "Sarah L.",
          avatar: "SL",
          role: "Designer",
          time: "5m ago",
          text: "Upload complete! Let me know if the font hierarchy is working."
        },
        {
          id: "2",
          type: "deliverable_submitted",
          time: "4m ago",
          text: "Deliverable 'Brand Assets V2.zip' uploaded by Sarah L."
        },
        {
          id: "3",
          type: "message",
          user: "Marcus V.",
          avatar: "MV",
          role: "Gaffer",
          time: "2m ago",
          text: "Looks clean. I'll review with the setup."
        }
      ]);
      setSimAdded(false);
    }
  }, [triggerSim]);

  return (
    <div className="w-full flex flex-col rounded-xl border border-white/5 bg-zinc-950 p-4 shadow-2xl h-80 justify-between select-none">
      <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-2 shrink-0">
        <span className="text-[11px] font-semibold text-zinc-300 font-sans tracking-wide">
          Activity Feed & Comments
        </span>
        <span className="text-[9px] font-mono text-zinc-500 bg-zinc-900 border border-white/5 px-2 py-0.5 rounded">
          live_sync
        </span>
      </div>

      {/* Feed Scroll Container */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-none flex flex-col justify-end">
        {feed.map((item) => {
          if (item.type === "message") {
            const isSarah = item.user === "Sarah L.";
            const avatarColor = isSarah 
              ? "bg-pink-500/10 border-pink-500/30 text-pink-400" 
              : "bg-blue-500/10 border-blue-500/30 text-blue-400";
            return (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2.5"
              >
                <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-semibold border ${avatarColor}`}>
                  {item.avatar}
                </div>
                <div className="flex-1 bg-zinc-900/40 border border-white/5 rounded-lg p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-200">
                      {item.user} <span className="text-[8px] text-zinc-500 font-normal ml-1">({item.role})</span>
                    </span>
                    <span className="text-[8px] text-zinc-500 font-mono">{item.time}</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-normal mt-0.5">
                    {item.text}
                  </p>
                </div>
              </motion.div>
            );
          } else {
            // System Notification items
            let iconColor = "text-zinc-500";
            let bgColor = "bg-zinc-900/20 border-white/5";
            let Icon = CheckCircle2;

            if (item.type === "deliverable_submitted") {
              iconColor = "text-blue-400";
              bgColor = "bg-blue-950/10 border-blue-500/10";
              Icon = FileUp;
            } else if (item.type === "blocker_reported") {
              iconColor = "text-red-400";
              bgColor = "bg-red-950/10 border-red-500/10";
              Icon = AlertTriangle;
            } else if (item.type === "milestone_completed") {
              iconColor = "text-emerald-400";
              bgColor = "bg-emerald-950/10 border-emerald-500/10";
              Icon = CheckCircle2;
            }

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[10px] ${bgColor}`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${iconColor}`} />
                <span className="text-zinc-350 flex-1 leading-normal">{item.text}</span>
                <span className="text-[8px] font-mono text-zinc-500 shrink-0">{item.time}</span>
              </motion.div>
            );
          }
        })}
      </div>
    </div>
  );
}

// ==========================================
// 2. INTEGRATED PRODUCTION ENVIRONMENTS MOCKUP
// ==========================================
interface FrameIoFile {
  name: string;
  size: string;
  version: number;
}

function ProjectFrameioTabMockup({ triggerSim }: { triggerSim: boolean }) {
  const [files, setFiles] = useState<FrameIoFile[]>([
    { name: "vesper_rough_cut.mp4", size: "1.2 GB", version: 2 },
    { name: "vesper_director_cut.mp4", size: "1.4 GB", version: 1 }
  ]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (triggerSim) {
      setIsSyncing(true);
      const timer = setTimeout(() => {
        setIsSyncing(false);
        setFiles(prev => [
          { name: "vesper_final_render.mp4", size: "1.8 GB", version: 1 },
          ...prev
        ]);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [triggerSim]);

  useEffect(() => {
    if (!triggerSim) {
      setFiles([
        { name: "vesper_rough_cut.mp4", size: "1.2 GB", version: 2 },
        { name: "vesper_director_cut.mp4", size: "1.4 GB", version: 1 }
      ]);
      setIsSyncing(false);
    }
  }, [triggerSim]);

  return (
    <div className="w-full flex flex-col rounded-xl border border-white/5 bg-zinc-950 p-4 shadow-2xl h-80 justify-between select-none font-sans">
      <div className="space-y-4">
        
        {/* Sync Integrations Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
          <span className="text-[11px] font-semibold text-zinc-300 tracking-wide">
            Integrations Monitor
          </span>
          <div className="flex gap-2">
            <span className="text-[8px] font-mono text-zinc-500 bg-zinc-900 border border-white/5 px-2 py-0.5 rounded">
              Frame.io v4
            </span>
            <span className="text-[8px] font-mono text-zinc-500 bg-zinc-900 border border-white/5 px-2 py-0.5 rounded">
              Slack Auth
            </span>
          </div>
        </div>

        {/* Slack Channel Mappings */}
        <div className="bg-zinc-900/30 border border-white/5 rounded-lg p-3 space-y-2">
          <div className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider">Slack Channel Connector</div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="flex items-center gap-1.5 text-zinc-350">
              <Hash className="w-3 h-3 text-purple-400" />
              <span>#helix-production</span>
            </div>
            <div className="text-right text-zinc-500">Updates Map (Active)</div>
            
            <div className="flex items-center gap-1.5 text-zinc-350">
              <Hash className="w-3 h-3 text-purple-400" />
              <span>#client-approvals</span>
            </div>
            <div className="text-right text-zinc-500">Deliverable Alerts</div>
          </div>
        </div>

        {/* Frame.io Files Card */}
        <div className="bg-zinc-900/30 border border-white/5 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider">
              Frame.io Workspace Project: Helix
            </span>
            {isSyncing && (
              <span className="text-[9px] font-mono text-purple-400">Syncing...</span>
            )}
          </div>
          
          <div className="space-y-2 max-h-24 overflow-y-auto scrollbar-none">
            {files.map((file, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between p-2 rounded bg-zinc-950/60 border border-white/5 text-[10px]"
              >
                <div className="flex items-center gap-2 truncate">
                  <FileVideo className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                  <span className="text-zinc-200 truncate">{file.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[8px] font-mono text-zinc-500">{file.size}</span>
                  <span className="text-[8px] font-mono bg-zinc-900 border border-white/5 px-1 rounded text-zinc-400">
                    V{file.version}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="text-[9px] text-zinc-650 font-mono text-center border-t border-white/5 pt-2">
        Webhook URL: frame_io_slack_relay.py (Ready)
      </div>
    </div>
  );
}

// ==========================================
// 3. AI MATCHMAKING MOCKUP
// ==========================================
interface CrewRole {
  role: string;
  assigned: string;
  status: "Available" | "Conflicting Call" | "Reassigned";
  avatar: string;
  avatarColor: string;
  backup: string;
  backupScore: number;
}

function CrewAssemblyMockup({ triggerSim }: { triggerSim: boolean }) {
  const [crew, setCrew] = useState<CrewRole[]>([
    {
      role: "Director of Photography",
      assigned: "Marcus V.",
      status: "Available",
      avatar: "MV",
      avatarColor: "bg-blue-500/10 border-blue-500/30 text-blue-400",
      backup: "Aura P.",
      backupScore: 94
    },
    {
      role: "Gaffer",
      assigned: "Sarah L.",
      status: "Conflicting Call",
      avatar: "SL",
      avatarColor: "bg-pink-500/10 border-pink-500/30 text-pink-400",
      backup: "Dave M.",
      backupScore: 92
    },
    {
      role: "Sound Mixer",
      assigned: "Emily W.",
      status: "Available",
      avatar: "EW",
      avatarColor: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
      backup: "David K.",
      backupScore: 89
    }
  ]);
  const [isMatching, setIsMatching] = useState(false);
  const [matchDone, setMatchDone] = useState(false);

  useEffect(() => {
    if (triggerSim && !matchDone) {
      setIsMatching(true);
      const timer = setTimeout(() => {
        setIsMatching(false);
        setCrew(prev => prev.map((c) => {
          if (c.role === "Gaffer") {
            return {
              ...c,
              assigned: "Dave M. (AI Backup)",
              status: "Reassigned",
              avatar: "DM",
              avatarColor: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            };
          }
          return c;
        }));
        setMatchDone(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [triggerSim, matchDone]);

  useEffect(() => {
    if (!triggerSim) {
      setCrew([
        {
          role: "Director of Photography",
          assigned: "Marcus V.",
          status: "Available",
          avatar: "MV",
          avatarColor: "bg-blue-500/10 border-blue-500/30 text-blue-400",
          backup: "Aura P.",
          backupScore: 94
        },
        {
          role: "Gaffer",
          assigned: "Sarah L.",
          status: "Conflicting Call",
          avatar: "SL",
          avatarColor: "bg-pink-500/10 border-pink-500/30 text-pink-400",
          backup: "Dave M.",
          backupScore: 92
        },
        {
          role: "Sound Mixer",
          assigned: "Emily W.",
          status: "Available",
          avatar: "EW",
          avatarColor: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
          backup: "David K.",
          backupScore: 89
        }
      ]);
      setIsMatching(false);
      setMatchDone(false);
    }
  }, [triggerSim]);

  return (
    <div className="w-full flex flex-col rounded-xl border border-white/5 bg-zinc-950 p-4 shadow-2xl h-80 justify-between select-none">
      
      <div>
        <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
          <span className="text-[11px] font-semibold text-zinc-300 font-sans tracking-wide">
            Crew Roster & Backups
          </span>
          <span className="text-[8px] font-mono text-zinc-500 bg-zinc-900 border border-white/5 px-2 py-0.5 rounded">
            {isMatching ? "processing..." : matchDone ? "optimal roster" : "conflicts detected"}
          </span>
        </div>

        {/* Crew Roster Grid */}
        <div className="space-y-2">
          {crew.map((member, i) => (
            <div 
              key={i}
              className={`p-2 rounded-lg border text-[10px] flex items-center justify-between ${
                member.status === "Conflicting Call"
                  ? "bg-red-500/5 border-red-500/15"
                  : member.status === "Reassigned"
                  ? "bg-emerald-500/5 border-emerald-500/15"
                  : "bg-zinc-900/50 border-white/5"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border ${member.avatarColor}`}>
                  {member.avatar}
                </div>
                <div>
                  <div className="text-zinc-400 text-[8px] uppercase tracking-wide leading-none">{member.role}</div>
                  <div className="text-zinc-200 font-semibold mt-0.5">{member.assigned}</div>
                </div>
              </div>

              <div className="text-right space-y-1">
                {/* Status indicator */}
                {member.status === "Available" && (
                  <span className="text-[8px] font-semibold text-emerald-400 bg-emerald-500/5 border border-emerald-500/15 px-2 py-0.5 rounded-full">
                    Available
                  </span>
                )}
                {member.status === "Conflicting Call" && (
                  <span className="text-[8px] font-semibold text-red-400 bg-red-500/5 border border-red-500/15 px-2 py-0.5 rounded-full">
                    Conflict
                  </span>
                )}
                {member.status === "Reassigned" && (
                  <span className="text-[8px] font-semibold text-emerald-400 bg-emerald-500/5 border border-emerald-500/15 px-2 py-0.5 rounded-full">
                    Auto-Resolved
                  </span>
                )}

                {/* Backup suggestion info */}
                {member.status === "Conflicting Call" && (
                  <div className="text-[8px] text-zinc-500 mt-1">
                    Backup: <span className="text-zinc-300 font-medium">{member.backup}</span> ({member.backupScore}%)
                  </div>
                )}
                {member.status === "Reassigned" && (
                  <div className="text-[8px] text-emerald-400/70 mt-1">
                    Swapped with backup Gaffer
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-[9px] text-zinc-650 font-mono text-center border-t border-white/5 pt-2">
        AI matching matrix evaluation complete
      </div>

    </div>
  );
}

// ==========================================
// 4. PUBLIC RSVP MOCKUP
// ==========================================
function PublicRsvpMockup({ triggerSim }: { triggerSim: boolean }) {
  const [attending, setAttending] = useState<boolean | null>(null);
  const [count, setCount] = useState(14);

  useEffect(() => {
    if (triggerSim) {
      setAttending(true);
      setCount(15);
    } else {
      setAttending(null);
      setCount(14);
    }
  }, [triggerSim]);

  const handleRsvp = (status: boolean) => {
    setAttending(status);
    setCount(status ? 15 : 14);
  };

  return (
    <div className="w-full flex flex-col rounded-xl border border-white/5 bg-zinc-950 p-4 shadow-2xl h-80 justify-between select-none relative overflow-hidden">
      
      {/* Top Section: Event Details */}
      <div className="z-10 bg-zinc-950 pb-2 border-b border-white/5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[8px] font-semibold tracking-wider text-[#8ECAFF] uppercase font-sans">
            Call Sheet Invite
          </span>
          <span className="text-[9px] font-mono text-zinc-550">ABRAM PASS #849</span>
        </div>

        <h3 className="text-sm font-semibold text-zinc-150 font-sans tracking-tight">
          Helix Commercial Call & Screening
        </h3>
        
        <div className="mt-2 space-y-1 text-zinc-400 text-[10px]">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>Fri, Oct 24 • 08:00 AM PST Crew Call</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-zinc-500" />
            <span>Nebula Soundstage A, Annex</span>
          </div>
        </div>
      </div>

      {/* Middle Section: RSVP Controls / Count */}
      <div className="z-10 py-3 bg-zinc-950/80 backdrop-blur-sm">
        <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-2">
          <span>Are you available for this setup?</span>
          <span className="font-mono text-zinc-350 font-bold">{count} Crew RSVP&apos;d</span>
        </div>

        {attending === null ? (
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => handleRsvp(true)}
              className="btn-primary py-2 text-[10px] min-h-[36px] justify-center cursor-pointer"
            >
              Accept Invite
            </button>
            <button 
              onClick={() => handleRsvp(false)}
              className="btn-glass py-2 text-[10px] min-h-[36px] justify-center cursor-pointer"
            >
              Decline
            </button>
          </div>
        ) : attending ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-semibold text-emerald-400">RSVP Confirmed (Attending)</span>
            </div>
            <button 
              onClick={() => handleRsvp(false)}
              className="text-[9px] text-zinc-550 hover:text-zinc-350 cursor-pointer"
            >
              Change
            </button>
          </div>
        ) : (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <X className="w-4 h-4 text-red-400" />
              <span className="text-[10px] font-semibold text-red-400">Declined (Not Attending)</span>
            </div>
            <button 
              onClick={() => handleRsvp(true)}
              className="text-[9px] text-zinc-550 hover:text-zinc-350 cursor-pointer"
            >
              Change
            </button>
          </div>
        )}
      </div>

      <div className="text-[9px] text-zinc-650 font-mono text-center border-t border-white/5 pt-2">
        Instant sync: RosterTable & Calendar
      </div>

    </div>
  );
}

// ==========================================
// MAIN COMPONENT: COLLABORATION SECTION
// ==========================================
interface Pillar {
  icon: React.ComponentType<any>;
  title: string;
  shortDesc: string;
  badge: string;
  rationale: string;
  benefits: string[];
  ctaText: string;
}

const PILLARS: Pillar[] = [
  {
    icon: MessageSquare,
    title: "Contextual Project Feed & Smart Mentions",
    shortDesc: "Real-time activity and threaded review comments",
    badge: "PROJECT FEED",
    rationale: "Track user comments alongside automated notifications (such as deliverables, milestone updates, and blockers). Tag crew members in-context to resolve blockers faster.",
    benefits: [
      "Threaded review chats anchored directly to assets.",
      "Instant triggers for blocker reporting and resolution.",
      "Clear chronological system event tracking."
    ],
    ctaText: "Simulate Feed Alert"
  },
  {
    icon: Video,
    title: "Integrated Production Environments (Slack & Frame.io)",
    shortDesc: "Folder sync and messaging integrations",
    badge: "WORKSPACE CONNECTORS",
    rationale: "Link review cut folders from Frame.io with mapped production Slack channels. Automate feedback updates and approvals directly from message channels.",
    benefits: [
      "Frame.io v4 directory folder synchronizations.",
      "Slack channel connector mappings for real-time broadcasts.",
      "Automatic file additions and version lists tracking."
    ],
    ctaText: "Simulate Sync"
  },
  {
    icon: Users,
    title: "AI Matchmaking & Dynamic Crew Assembly",
    shortDesc: "Intelligent suitability matching and backups",
    badge: "AI ASSEMBLY MATRIX",
    rationale: "Build rosters with real-time suitability scoring. Instantly identify call conflicts and auto-assign top backup replacements.",
    benefits: [
      "Automated suitability scoring based on rating history.",
      "Visual schedule conflict identification badges.",
      "One-click backup replacement slot resolution."
    ],
    ctaText: "Resolve Roster Conflict"
  },
  {
    icon: CheckSquare,
    title: "Frictionless On-Set Coordination (Call Sheets & RSVPs)",
    shortDesc: "One-click call sheet check-ins",
    badge: "ON-SET COORDINATION",
    rationale: "Send interactive call sheet notifications. Crew check availability with one-click RSVP, instantly updating the master schedule and logistics table.",
    benefits: [
      "One-click accepting and declining of calls.",
      "Real-time attendee counts for operations and catering.",
      "Instant calendar and location route linking."
    ],
    ctaText: "Simulate RSVP Yes"
  }
];

export default function CollaborationSection() {
  const [activeTab, setActiveTab] = useState(0);
  const [simTriggered, setSimTriggered] = useState(false);

  const handleSimulate = () => {
    setSimTriggered(true);
  };

  const handleTabChange = (idx: number) => {
    setActiveTab(idx);
    setSimTriggered(false);
  };

  const currentPillar = PILLARS[activeTab];

  return (
    <section className="relative py-20 md:py-28 border-t border-white/[0.08] bg-transparent">
      
      {/* Viewport-level horizontal bleed glows - DESIGN.md compliant (avoid container clipping) */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] lg:w-[650px] lg:h-[650px] bg-red-900/[0.015] rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/3 w-[300px] h-[300px] lg:w-[500px] lg:h-[500px] bg-[#8ECAFF]/[0.012] rounded-full filter blur-[90px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 md:mb-20">
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-3 inline-block font-sans">
            Network Operations
          </span>
          <h2 className="text-2xl md:text-4xl font-semibold tracking-tight text-white uppercase font-display leading-tight">
            Seamless Network Collaboration
          </h2>
          <p className="mt-4 text-sm text-zinc-400 leading-7 font-sans">
            Connect crew, agency clients, and producers in a high-fidelity workspace. Exchange real-time frame feedback, auto-assemble crew rosters, and confirm call times instantly.
          </p>
        </div>

        {/* Tab Cockpit Selector Bar */}
        <div className="w-full bg-zinc-950/40 border border-white/5 rounded-2xl p-1.5 mb-10 overflow-x-auto scrollbar-none flex gap-1 select-none">
          {PILLARS.map((pillar, idx) => {
            const Icon = pillar.icon;
            const isActive = activeTab === idx;
            return (
              <button
                key={idx}
                onClick={() => handleTabChange(idx)}
                className={`relative flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer min-w-[200px] sm:min-w-0 flex-1 text-left outline-none ${
                  isActive ? "" : "hover:bg-white/[0.02]"
                }`}
              >
                {/* Active slider backdrop bubble */}
                {isActive && (
                  <motion.div 
                    layoutId="activeTabSlider"
                    className="absolute inset-0 bg-white/[0.04] border border-white/10 rounded-xl z-0"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}

                <div className={`relative z-10 w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-200 shrink-0 ${
                  isActive 
                    ? "bg-[#8ECAFF]/10 border-[#8ECAFF]/30 text-[#8ECAFF]" 
                    : "bg-zinc-900 border-white/5 text-zinc-400"
                }`}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="relative z-10 overflow-hidden">
                  <h4 className={`text-xs font-semibold font-sans leading-none ${isActive ? "text-white" : "text-zinc-400"}`}>
                    {idx + 1}. {pillar.badge}
                  </h4>
                  <p className="text-[10px] text-zinc-550 truncate mt-1 max-w-[170px] hidden sm:block font-medium">
                    {pillar.title.split(" (")[0]}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Cockpit Content Panel Container */}
        <div className="w-full rounded-2xl border border-white/5 bg-zinc-950/20 p-6 md:p-8 backdrop-blur-xl relative overflow-visible">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              {/* Left Column: Feature Copy */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Micro Badge */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-zinc-900 border border-white/5 text-[9px] font-mono font-medium tracking-wide uppercase text-zinc-405">
                  {currentPillar.badge}
                </div>

                {/* Heading */}
                <h3 className="text-xl font-semibold tracking-tight text-zinc-50 font-sans">
                  {currentPillar.title}
                </h3>

                {/* Rationale */}
                <p className="text-sm text-zinc-400 leading-normal font-sans">
                  {currentPillar.rationale}
                </p>

                {/* Benefits List */}
                <ul className="space-y-3.5 pt-2">
                  {currentPillar.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-zinc-350">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      <span className="font-sans leading-relaxed">{benefit}</span>
                    </li>
                  ))}
                </ul>

                {/* Action CTA Trigger */}
                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={handleSimulate}
                    disabled={simTriggered}
                    className={`btn-primary px-4 py-2 text-[11px] min-h-[38px] flex items-center justify-center gap-1.5 cursor-pointer ${
                      simTriggered ? "opacity-40 cursor-not-allowed bg-zinc-350 text-black/60" : ""
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 shrink-0" />
                    <span>{simTriggered ? "Simulation Active" : currentPillar.ctaText}</span>
                  </button>
                  
                  {simTriggered && (
                    <button 
                      onClick={() => setSimTriggered(false)}
                      className="btn-ghost px-4 py-2 text-[11px] min-h-[38px] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Reset Sim
                    </button>
                  )}
                </div>

              </div>

              {/* Right Column: Interactive Mockup Panel */}
              <div className="lg:col-span-7 w-full flex items-center justify-center relative">
                {/* Glow Background */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 bg-[#8ECAFF]/[0.015] rounded-full filter blur-[60px] pointer-events-none -z-10" />
                
                <div className="w-full max-w-[480px] lg:max-w-full">
                  {activeTab === 0 && <ProjectCommentThreadMockup triggerSim={simTriggered} />}
                  {activeTab === 1 && <ProjectFrameioTabMockup triggerSim={simTriggered} />}
                  {activeTab === 2 && <CrewAssemblyMockup triggerSim={simTriggered} />}
                  {activeTab === 3 && <PublicRsvpMockup triggerSim={simTriggered} />}
                </div>
              </div>

            </motion.div>
          </AnimatePresence>

        </div>

      </div>

    </section>
  );
}
