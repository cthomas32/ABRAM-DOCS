"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, 
  MapPin, 
  Sun, 
  CloudSun, 
  ShieldAlert, 
  Film, 
  Users, 
  Truck, 
  Coffee, 
  Sliders, 
  Calendar,
  AlertCircle,
  Check,
  Send,
  Plus,
  AlertTriangle,
  CloudRain,
  MessageSquare,
  Trash2,
  Printer,
  Coins,
  FileText,
  Sparkles,
  Link2
} from "lucide-react";

type TabId = "timeline" | "personnel" | "locations" | "autofill" | "billing" | "distribution";

interface Tab {
  id: TabId;
  label: string;
}

export default function CallSheetMockup() {
  const [activeTab, setActiveTab] = useState<TabId>("timeline");
  
  // 1. Polymorphic Timeline State
  const [timeline, setTimeline] = useState([
    { id: 1, type: "scene", time: "08:00 AM", title: "Scene 12 - INT. ATTIC - DAY", desc: "Clara finds the hidden ledger. Character IDs: Clara (A-02). Pages: 2 1/8", tag: "Script Scene", color: "text-amber-400 border-amber-500/20 bg-amber-500/5" },
    { id: 2, type: "non-scene", time: "11:00 AM", title: "Rehearsal: Action blocking", desc: "Stunt coordinator blocking attic window escape route.", tag: "Rehearsal", color: "text-blue-400 border-blue-500/20 bg-blue-500/5" },
    { id: 3, type: "non-scene", time: "01:00 PM", title: "Lunch Break", desc: "Catering tent - mandatory 1-hour rest block.", tag: "Meal", color: "text-zinc-400 border-white/5 bg-white/[0.02]" },
    { id: 4, type: "non-scene", time: "02:00 PM", title: "Travel: Move to secondary location", desc: "Shuttle crew from Basecamp stage to Alleyway Backlot.", tag: "Travel", color: "text-purple-400 border-purple-500/20 bg-purple-500/5" },
    { id: 5, type: "scene", time: "03:00 PM", title: "Scene 14 - EXT. ALLEYWAY - DUSK", desc: "Ethan meets Clara under the bridge. Character IDs: Ethan (A-01), Clara (A-02). Pages: 1 3/8", tag: "Script Scene", color: "text-amber-400 border-amber-500/20 bg-amber-500/5" }
  ]);

  // Timeline Event Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [formType, setFormType] = useState<"scene" | "non-scene">("scene");
  const [formTime, setFormTime] = useState("06:00 PM");
  const [formTitle, setFormTitle] = useState("Scene 15 - INT. HALLWAY - NIGHT");
  const [formDesc, setFormDesc] = useState("Chase sequence through corridors. Pages: 1 4/8");
  const [formTag, setFormTag] = useState("Script Scene");

  // 2. Cast & Crew Roster State (with Activity Statuses W/H/T/R and Character mapping)
  const [roster, setRoster] = useState([
    { id: "DIR", name: "Jane Smith", role: "Director", character: "N/A", call: "07:30 AM", status: "W", dept: "Creative", dispatchStatus: "Pending" },
    { id: "DP", name: "John Doe", role: "Director of Photography", character: "N/A", call: "07:30 AM", status: "W", dept: "Camera", dispatchStatus: "Pending" },
    { id: "A-01", name: "Leo Vance", role: "Ethan (Cast)", character: "Ethan (ID #1)", call: "08:30 AM", status: "W", dept: "Cast", dispatchStatus: "Pending" },
    { id: "A-02", name: "Selene Apex", role: "Clara (Cast)", character: "Clara (ID #2)", call: "07:30 AM", status: "W", dept: "Cast", dispatchStatus: "Pending" },
    { id: "A-03", name: "Marcus Aurelius", role: "Actor 3 (Guard)", character: "Guard (ID #9)", call: "10:00 AM", status: "H", dept: "Cast", dispatchStatus: "Pending" },
    { id: "PD", name: "Sarah Connor", role: "Production Designer", character: "N/A", call: "07:00 AM", status: "W", dept: "Art", dispatchStatus: "Pending" },
    { id: "SND", name: "Vesper Lin", role: "Sound Mixer", character: "N/A", call: "07:30 AM", status: "W", dept: "Sound", dispatchStatus: "Pending" }
  ]);

  // 3. Smart & AI Autofill State
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [dayNumber, setDayNumber] = useState(12);
  const [weatherForecast, setWeatherForecast] = useState("74°F / Sunny");
  const [safetyNotes, setSafetyNotes] = useState("Standard active stage safety protocols in effect.");
  const [deptInstructions, setDeptInstructions] = useState({
    camera: "Prepare low-light lenses for Scene 12 attic shoot.",
    art: "Dressing attic set with period details by 07:30 AM.",
    wardrobe: "Clara wardrobe changes prepped by 08:00 AM.",
    audio: "Lavalier mics and boom sync for attic tight spacing."
  });

  // 4. Location Details State
  const locations = [
    { type: "Basecamp", name: "Vesper Studios - Stage 4", address: "1040 N Las Palmas Ave, Los Angeles, CA 90038", note: "All production office assets, dressing rooms, and catering set up at Stage 4 lot." },
    { type: "Main Location", name: "Helix Industrial Warehouse C", address: "1855 Industrial St, Los Angeles, CA 90021", note: "Primary location for Scene 12 attic setups. Power drops available." },
    { type: "Secondary Location", name: "Alleyway Backlot - Archway", address: "1224 Backlot Way, Los Angeles, CA 90021", note: "Location for Scene 14 EXT setup. Set up lighting packages on lifts." },
    { type: "Parking", name: "Gate 3 Multi-Deck Structure", address: "1045 N Las Palmas Ave, Los Angeles, CA 90038", note: "Crew parking structure. Sheltered shuttle vans run to Basecamp and sets every 10 min." }
  ];

  // 5. Work Order & Billing Integration State
  const [linkedWorkOrderId, setLinkedWorkOrderId] = useState("WO-2026-1024");
  const [isSyncingLedger, setIsSyncingLedger] = useState(false);
  const [ledgerSyncSuccess, setLedgerSyncSuccess] = useState(false);
  const [billingTotalHrs, setBillingTotalHrs] = useState(68.5);

  // 6. Distribution & Print State
  const [dispatchState, setDispatchState] = useState<"idle" | "sending" | "completed">("idle");
  const [dispatchProgress, setDispatchProgress] = useState(0);

  const tabs: Tab[] = [
    { id: "timeline", label: "1. Schedule Timeline" },
    { id: "personnel", label: "2. Cast & Crew Roster" },
    { id: "locations", label: "3. Location Details" },
    { id: "autofill", label: "4. AI Autofill" },
    { id: "billing", label: "5. Work Order & Billing" },
    { id: "distribution", label: "6. Distribution & Print" }
  ];

  // Derived timeline events adjusting for AI rain contingency
  const getTimelineEvents = () => {
    return timeline.map(event => {
      if (aiGenerated && event.title.includes("Scene 14")) {
        return {
          ...event,
          title: "Scene 14 - EXT. ALLEYWAY - RELOCATED - INT. STAGE 4",
          desc: "Stage 4 Rain Contingency. Pages: 1 3/8",
          color: "text-red-400 border-red-500/20 bg-red-500/5 font-semibold"
        };
      }
      return event;
    });
  };

  // Handle Timeline adding
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const newEvent = {
      id: timeline.length + 1,
      type: formType,
      time: formTime,
      title: formTitle,
      desc: formDesc,
      tag: formTag,
      color: formType === "scene" 
        ? "text-amber-400 border-amber-500/20 bg-amber-500/5" 
        : formTag === "Rehearsal" 
        ? "text-blue-400 border-blue-500/20 bg-blue-500/5" 
        : "text-zinc-400 border-white/5 bg-white/[0.02]"
    };
    setTimeline([...timeline, newEvent]);
    setShowAddForm(false);
  };

  // Cycle roster activity status (W -> H -> T -> R -> W)
  const cycleStatus = (id: string) => {
    setRoster(prev => prev.map(member => {
      if (member.id === id) {
        let next = "W";
        if (member.status === "W") next = "H";
        else if (member.status === "H") next = "T";
        else if (member.status === "T") next = "R";
        else next = "W";
        return { ...member, status: next };
      }
      return member;
    }));
  };

  // Run AI Autofill simulation
  const runAIAutofill = () => {
    setIsAutofilling(true);
    setTimeout(() => {
      setDayNumber(12);
      setWeatherForecast("68°F / Light Rain (Rain Contingency Triggered)");
      setSafetyNotes("Wet weather precautions. Watch for slick backlot alley surfaces. Ground fault circuit interrupters required on all exterior power lines.");
      setDeptInstructions({
        camera: "Switch setups to INT. Stage 4. Prepare indoor macro lenses.",
        art: "Pre-dress Stage 4 Attic duplicate set. Stage team standing by.",
        wardrobe: "Pre-dry active costumes. Keep rain covers ready for transit.",
        audio: "Move wireless audio receivers indoors. Shield shotgun mics."
      });
      setAiGenerated(true);
      setIsAutofilling(false);
    }, 1500);
  };

  // Run financial ledger sync simulation
  const runLedgerSync = () => {
    setIsSyncingLedger(true);
    setTimeout(() => {
      setIsSyncingLedger(false);
      setLedgerSyncSuccess(true);
      setBillingTotalHrs(72.0); // Simulated updated hours
      setTimeout(() => setLedgerSyncSuccess(false), 3000);
    }, 1500);
  };

  // Distribution dispatch simulation
  const triggerDistribution = () => {
    if (dispatchState === "sending") return;
    setDispatchState("sending");
    setDispatchProgress(0);
    setRoster(prev => prev.map(m => ({ ...m, dispatchStatus: "Pending" })));

    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      setDispatchProgress(Math.round((current / roster.length) * 100));
      
      setRoster(prevRoster => 
        prevRoster.map((member, idx) => {
          if (idx < current) return { ...member, dispatchStatus: "Sent" };
          if (idx === current) return { ...member, dispatchStatus: "Sending" };
          return member;
        })
      );

      if (current >= roster.length) {
        clearInterval(interval);
        setDispatchState("completed");
      }
    }, 400);
  };

  return (
    <div className="glass-panel rounded-2xl w-full max-w-4xl mx-auto overflow-hidden border border-white/5 shadow-2xl relative">
      
      {/* Top visual glow border */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      {/* Mockup Header */}
      <div className="p-4 sm:p-6 border-b border-white/5 bg-zinc-950/40">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="font-mono text-[9px] tracking-widest text-zinc-400 font-semibold uppercase">
                ABRAM PRODUCTION ENGINE // ACTIVE RUN-OF-SHOW
              </span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white font-sans flex items-center gap-2">
              Day {dayNumber} of 18 Call Board
              {aiGenerated && (
                <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> AI Autofilled
                </span>
              )}
            </h3>
            <p className="text-xs text-zinc-500 font-mono">
              PROJECT: VESPER CHRONICLES (EPISODE 1)
            </p>
          </div>
          <div className="flex flex-row gap-4 text-xs font-mono border-t md:border-t-0 md:border-l border-white/5 pt-3 md:pt-0 md:pl-6 text-zinc-400 justify-between md:justify-start">
            <div className="space-y-1">
              <div className="text-[9px] uppercase tracking-wider text-zinc-500">Weather</div>
              <div className="text-white flex items-center gap-1 font-mono text-xs">
                {aiGenerated ? <CloudRain className="w-3.5 h-3.5 text-blue-400" /> : <CloudSun className="w-3.5 h-3.5 text-amber-400" />}
                {weatherForecast}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[9px] uppercase tracking-wider text-zinc-500">Crew Call</div>
              <div className="text-white font-semibold font-mono text-xs">07:00 AM</div>
            </div>
            <div className="space-y-1">
              <div className="text-[9px] uppercase tracking-wider text-zinc-500">Linked Work Order</div>
              <div className="text-zinc-300 font-semibold flex items-center gap-1 font-mono text-xs">
                <Link2 className="w-3 h-3 text-zinc-500" />
                {linkedWorkOrderId}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="px-4 sm:px-6 pt-4 border-b border-white/5 bg-zinc-950/20">
        <div className="flex items-center justify-between md:hidden mb-2">
          <span className="text-[10px] text-zinc-500 uppercase font-semibold">Options</span>
          <span className="text-[10px] text-zinc-400 font-mono animate-pulse">Swipe tabs →</span>
        </div>
        <div className="flex gap-1 overflow-x-auto whitespace-nowrap scrollbar-none pb-2 select-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-3.5 py-2.5 md:py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all duration-200 min-h-[44px] md:min-h-0 flex items-center justify-center ${
                activeTab === tab.id
                  ? "text-black animate-none"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="active-callsheet-tab"
                  className="absolute inset-0 bg-white rounded-full -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="p-4 sm:p-6 min-h-[380px] bg-zinc-950/10 font-sans">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            
            {/* 1. POLYMORPHIC SCHEDULE TIMELINE */}
            {activeTab === "timeline" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 block">
                    Polymorphic Run-Of-Show
                  </span>
                  <button 
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="btn-glass px-3 py-2.5 md:py-1 text-[10px] min-h-[44px] md:min-h-0 flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Timeline Item
                  </button>
                </div>

                {/* Add Event Form */}
                {showAddForm && (
                  <motion.form 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="p-4 rounded-xl border border-white/10 bg-zinc-950/80 space-y-3 overflow-hidden"
                    onSubmit={handleAddEvent}
                  >
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">New Timeline Event</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase block mb-1">Item Type</label>
                        <select 
                          value={formType}
                          onChange={(e) => {
                            const val = e.target.value as "scene" | "non-scene";
                            setFormType(val);
                            if (val === "scene") {
                              setFormTag("Script Scene");
                              setFormTitle("Scene 15 - INT. HALLWAY - NIGHT");
                            } else {
                              setFormTag("Rehearsal");
                              setFormTitle("Cast Block & Walkthrough");
                            }
                          }}
                          className="w-full bg-zinc-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/20"
                        >
                          <option value="scene">Script Scene</option>
                          <option value="non-scene">Non-Scene Event</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase block mb-1">Sub-Tag</label>
                        {formType === "scene" ? (
                          <input 
                            type="text" 
                            value={formTag} 
                            disabled 
                            className="w-full bg-zinc-955 border border-white/5 rounded px-2.5 py-1.5 text-xs text-zinc-500 cursor-not-allowed outline-none"
                          />
                        ) : (
                          <select 
                            value={formTag}
                            onChange={(e) => setFormTag(e.target.value)}
                            className="w-full bg-zinc-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/20"
                          >
                            <option value="Rehearsal">Rehearsal</option>
                            <option value="Meal">Meal Block</option>
                            <option value="Travel">Travel Block</option>
                            <option value="Note">Custom Banners/Notes</option>
                          </select>
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase block mb-1">Time</label>
                        <input 
                          type="text" 
                          value={formTime}
                          onChange={(e) => setFormTime(e.target.value)}
                          placeholder="e.g. 04:30 PM"
                          className="w-full bg-zinc-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/20"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-1">Title / Label</label>
                      <input 
                        type="text" 
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/20"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-1">Description / Details</label>
                      <textarea 
                        value={formDesc}
                        onChange={(e) => setFormDesc(e.target.value)}
                        rows={2}
                        className="w-full bg-zinc-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/20 resize-none"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-2 pt-1">
                      <button 
                        type="button" 
                        onClick={() => setShowAddForm(false)}
                        className="btn-ghost py-2.5 md:py-1 px-3 text-[10px] min-h-[44px] md:min-h-0 flex items-center justify-center"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="btn-primary py-2.5 md:py-1 px-3.5 text-[10px] min-h-[44px] md:min-h-0 flex items-center justify-center"
                      >
                        Add to Timeline
                      </button>
                    </div>
                  </motion.form>
                )}

                {/* Timeline Items List */}
                <div className="relative border-l border-white/10 pl-6 ml-4 space-y-4 pt-2">
                  {getTimelineEvents().map((event) => (
                    <div key={event.id} className="relative group">
                      <div className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border border-zinc-800 bg-zinc-950 flex items-center justify-center">
                        <div className={`h-1.5 w-1.5 rounded-full ${event.type === "scene" ? "bg-amber-400" : "bg-zinc-500"}`} />
                      </div>
                      <div className={`border rounded-lg p-3 space-y-1 hover:bg-white/[0.01] transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${event.color}`}>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] uppercase tracking-wider bg-white/5 border border-white/5 px-2 py-0.5 rounded font-mono text-zinc-400">
                              {event.tag}
                            </span>
                            <h4 className="text-sm font-semibold text-white">
                              {event.title}
                            </h4>
                          </div>
                          <p className="text-xs text-zinc-400 leading-normal select-text">
                            {event.desc}
                          </p>
                        </div>
                        <div className="sm:text-right shrink-0">
                          <span className="text-xs font-mono font-semibold text-zinc-300 bg-zinc-955 border border-white/5 px-2.5 py-0.5 rounded">
                            {event.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. CAST & CREW PERSONNEL MANAGEMENT */}
            {activeTab === "personnel" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 block">
                      Personnel & Activity Statuses
                    </span>
                    <p className="text-[11px] text-zinc-500 font-sans">
                      Click status badge to cycle contractor activity codes: <span className="font-semibold text-white">W</span> (Work), <span className="font-semibold text-white">H</span> (Hold), <span className="font-semibold text-white">T</span> (Travel), <span className="font-semibold text-white">R</span> (Rehearsal).
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2 md:hidden">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">Personnel Roster</span>
                  <span className="text-[10px] text-zinc-400 font-mono animate-pulse">Swipe to view →</span>
                </div>

                <div className="overflow-x-auto border border-white/5 rounded-xl bg-zinc-950/30">
                  <table className="w-full border-collapse text-left text-xs text-zinc-300 min-w-[800px]">
                    <thead>
                      <tr className="border-b border-white/5 bg-zinc-950/40 text-[9px] uppercase tracking-wider font-semibold text-zinc-500">
                        <th className="px-4 py-3">ID</th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Department</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Character Mapping</th>
                        <th className="px-4 py-3">Call Time</th>
                        <th className="px-4 py-3 text-center">Activity Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-sans">
                      {roster.map((row) => (
                        <tr key={row.id} className="hover:bg-white/[0.01] transition-all">
                          <td className="px-4 py-3 font-mono text-[10px] text-zinc-500">{row.id}</td>
                          <td className="px-4 py-3 font-semibold text-white">{row.name}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-[9px] bg-white/5 text-zinc-400 border border-white/5">
                              {row.dept}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-zinc-400">{row.role}</td>
                          <td className="px-4 py-3 font-mono text-zinc-400">
                            {row.character !== "N/A" ? (
                              <span className="text-zinc-300 font-semibold">{row.character}</span>
                            ) : (
                              <span className="text-zinc-600">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-white">{row.call}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => cycleStatus(row.id)}
                              className={`w-11 h-11 md:w-7 md:h-7 rounded-full text-xs font-mono font-bold transition-all hover:scale-105 cursor-pointer flex items-center justify-center ${
                                row.status === "W"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                                  : row.status === "H"
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/25"
                                  : row.status === "T"
                                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/25"
                                  : "bg-purple-500/10 text-purple-400 border border-purple-500/25"
                              }`}
                              title="Click to cycle status: Work (W), Hold (H), Travel (T), Rehearsal (R)"
                            >
                              {row.status}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. MULTIPLE LOCATIONS */}
            {activeTab === "locations" && (
              <div className="space-y-4">
                <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 block">
                  Location Mapping & Logistics Notes
                </span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {locations.map((loc, idx) => (
                    <div 
                      key={idx} 
                      className="border border-white/5 rounded-xl bg-zinc-950/40 p-4 space-y-2 hover:border-white/10 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-zinc-500 bg-white/5 px-2 py-0.5 rounded">
                            {loc.type}
                          </span>
                          <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                        </div>
                        <h4 className="text-sm font-semibold text-white font-sans">{loc.name}</h4>
                        <p className="text-xs text-zinc-400 font-mono">{loc.address}</p>
                      </div>
                      <p className="text-[11px] text-zinc-500 leading-normal border-t border-white/5 pt-2 mt-2">
                        {loc.note}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. AI & SMART AUTOFILL */}
            {activeTab === "autofill" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 block">
                      AI & Telemetry Integration
                    </span>
                    <h3 className="text-base font-bold text-white">Smart Autofill Engine</h3>
                    <p className="text-xs text-zinc-400">
                      Pulls calendar days, confirmed crew bookings, and coordinates Anthropic Claude to compile safety & department sheets.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={runAIAutofill}
                    disabled={isAutofilling}
                    className="btn-primary w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 min-h-[44px] md:min-h-0"
                  >
                    {isAutofilling ? (
                      <>
                        <span className="h-3 w-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-black" />
                        Run AI & Smart Autofill
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left inputs details */}
                  <div className="md:col-span-1 space-y-4">
                    <div className="p-4 rounded-xl border border-white/5 bg-zinc-950/40 space-y-3">
                      <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Autofill Settings</h4>
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-zinc-500 block">Auto-calculated Day</span>
                          <span className="font-mono text-white font-semibold">Day {dayNumber} of 18</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block">Roster Staff Sync</span>
                          <span className="font-mono text-zinc-300">7 Active Bookings Found</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block">LLM Engine</span>
                          <span className="font-mono text-zinc-400">Anthropic Claude Sonnet</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-white/5 bg-zinc-950/40 space-y-2">
                      <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Weather Conditions</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                        {weatherForecast}
                      </p>
                    </div>
                  </div>

                  {/* Right department outcomes */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="p-4 rounded-xl border border-white/5 bg-zinc-950/40 space-y-3">
                      <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-zinc-500" />
                        AI-Generated Safety Guidelines
                      </h4>
                      <p className="text-xs text-zinc-300 bg-white/[0.02] border border-white/5 p-2.5 rounded leading-relaxed select-text">
                        {safetyNotes}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-white/5 bg-zinc-950/40 space-y-3">
                      <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                        Claude Drafted Department Instructions
                      </h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1 p-2.5 rounded border border-white/5 bg-zinc-900/40">
                          <span className="text-[10px] font-semibold text-zinc-500 tracking-wider uppercase font-mono">Camera</span>
                          <p className="text-zinc-400 leading-normal select-text">{deptInstructions.camera}</p>
                        </div>
                        <div className="space-y-1 p-2.5 rounded border border-white/5 bg-zinc-900/40">
                          <span className="text-[10px] font-semibold text-zinc-500 tracking-wider uppercase font-mono">Art / Props</span>
                          <p className="text-zinc-400 leading-normal select-text">{deptInstructions.art}</p>
                        </div>
                        <div className="space-y-1 p-2.5 rounded border border-white/5 bg-zinc-900/40">
                          <span className="text-[10px] font-semibold text-zinc-500 tracking-wider uppercase font-mono">Wardrobe</span>
                          <p className="text-zinc-400 leading-normal select-text">{deptInstructions.wardrobe}</p>
                        </div>
                        <div className="space-y-1 p-2.5 rounded border border-white/5 bg-zinc-900/40">
                          <span className="text-[10px] font-semibold text-zinc-500 tracking-wider uppercase font-mono">Audio</span>
                          <p className="text-zinc-400 leading-normal select-text">{deptInstructions.audio}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. WORK ORDER & BILLING INTEGRATION */}
            {activeTab === "billing" && (
              <div className="space-y-6">
                <div className="border border-white/5 bg-zinc-950/40 p-5 rounded-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 block">
                        Linked Project Documents
                      </span>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        Work Order Syncing & Financials
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Daily Call Sheets link to scheduled Work Orders to sync verified contractor hours directly with project budgets.
                      </p>
                    </div>
                    <span className="font-mono text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" /> Billing Connected
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-white/5 bg-zinc-900/40 space-y-1.5">
                      <span className="text-[9px] uppercase tracking-wider font-mono text-zinc-500">Linked Work Order ID</span>
                      <span className="text-sm font-semibold text-white block font-mono">{linkedWorkOrderId}</span>
                      <span className="text-[10px] text-zinc-500 leading-normal block">Contractor lists and equipment items mapped.</span>
                    </div>

                    <div className="p-4 rounded-xl border border-white/5 bg-zinc-900/40 space-y-1.5">
                      <span className="text-[9px] uppercase tracking-wider font-mono text-zinc-500">Aggregated Timesheet Hours</span>
                      <span className="text-sm font-semibold text-white block font-mono">{billingTotalHrs} Hours</span>
                      <span className="text-[10px] text-zinc-500 leading-normal block">Calculated from crew call-to-wrap schedules.</span>
                    </div>

                    <div className="p-4 rounded-xl border border-white/5 bg-zinc-900/40 space-y-1.5">
                      <span className="text-[9px] uppercase tracking-wider font-mono text-zinc-500">Budget Invoicing Status</span>
                      <span className="text-sm font-semibold text-zinc-300 block font-mono">Unbilled (Draft)</span>
                      <span className="text-[10px] text-zinc-500 leading-normal block">Ready for payroll timesheet export.</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 w-full">
                    <div className="text-xs text-zinc-500 font-mono w-full sm:w-auto text-center sm:text-left">
                      {ledgerSyncSuccess && (
                        <motion.span 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-emerald-400 font-semibold flex items-center justify-center sm:justify-start gap-1.5"
                        >
                          <Check className="w-4 h-4" /> Financial ledger synced successfully!
                        </motion.span>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={runLedgerSync}
                        disabled={isSyncingLedger}
                        className="btn-glass w-full sm:w-auto px-4 py-2.5 md:py-2 text-xs flex items-center justify-center gap-1.5 min-h-[44px] md:min-h-0"
                      >
                        {isSyncingLedger ? (
                          <>
                            <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Syncing...
                          </>
                        ) : (
                          <>
                            <Coins className="w-3.5 h-3.5" /> Sync Hours to Budget Ledger
                          </>
                        )}
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          alert("Action simulated: New billing Work Order has been generated using active crew assets!");
                        }}
                        className="btn-primary w-full sm:w-auto px-4 py-2.5 md:py-2 text-xs flex items-center justify-center gap-1.5 min-h-[44px] md:min-h-0"
                      >
                        <FileText className="w-3.5 h-3.5 text-black" /> Create Work Order from Call Sheet
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. DISTRIBUTION & PRINT */}
            {activeTab === "distribution" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Distribution Panel */}
                  <div className="border border-white/5 bg-zinc-950/40 p-5 rounded-2xl space-y-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 block">
                        Roster Notification Dispatch
                      </span>
                      <h3 className="text-base font-bold text-white">Portal & Email Distribution</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Dispatch direct links, map files, and personalized call times to the entire team via email and portal.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-white/5 bg-zinc-900/40 space-y-3">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block border-b border-white/5 pb-1">
                        Email & Portal Broadcast Preview
                      </span>
                      <div className="font-mono text-[10px] text-zinc-500 space-y-1 bg-zinc-950/60 p-2.5 rounded select-text">
                        <p className="text-zinc-300 font-semibold">To: [Roster Crew Members]</p>
                        <p>Subject: Day {dayNumber} Call Sheet - Ep 1</p>
                        <p className="text-zinc-400 mt-2">
                          Hi [Name], your call time for Oct 24 is [CallTime] at {locations[0].name}. Weather: {weatherForecast}. View your full crew portal layout: https://abram.network/portal/v1
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={triggerDistribution}
                        disabled={dispatchState === "sending"}
                        className="btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-2"
                      >
                        <Send className="w-3.5 h-3.5 text-black" />
                        {dispatchState === "sending" ? "Dispatching Broadcast..." : "Send to Crew Portal & Dispatch Emails"}
                      </button>

                      {dispatchState === "sending" && (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                            <span>Sending status...</span>
                            <span>{dispatchProgress}%</span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <motion.div 
                              className="h-full bg-white"
                              initial={{ width: 0 }}
                              animate={{ width: `${dispatchProgress}%` }}
                              transition={{ duration: 0.1 }}
                            />
                          </div>
                        </div>
                      )}

                      {dispatchState === "completed" && (
                        <div className="p-2.5 rounded border border-emerald-500/10 bg-emerald-500/5 text-[11px] text-emerald-400 flex items-center gap-2">
                          <Check className="w-4 h-4 shrink-0" />
                          <span>Distribution broadcast sent to all roster members successfully!</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Print Template Panel */}
                  <div className="border border-white/5 bg-zinc-950/40 p-5 rounded-2xl space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 block">
                          Hardcopy Rendering
                        </span>
                        <h3 className="text-base font-bold text-white">PDF & Print CSS Template</h3>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          A dedicated print-friendly stylesheet strips out background panels and interactive controls to format call sheet schedules for physical distribution.
                        </p>
                      </div>

                      <div className="border border-white/5 rounded-xl bg-zinc-900/20 p-4 font-mono text-[9px] text-zinc-500 space-y-1 select-text">
                        <span className="text-[10px] text-zinc-400 font-semibold block border-b border-white/5 pb-1">@media print stylesheet details</span>
                        <p className="text-zinc-600">{"//"} Strip glass backgrounds for ink savings</p>
                        <p className="text-zinc-300">.glass-panel {"{"} background: white !important; color: black !important; border: none !important; {"}"}</p>
                        <p className="text-zinc-300">.btn-glass, .btn-primary, button {"{"} display: none !important; {"}"}</p>
                        <p className="text-zinc-300">table {"{"} width: 100% !important; border: 1px solid #ddd !important; {"}"}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        window.print();
                      }}
                      className="btn-glass w-full py-2.5 text-xs flex items-center justify-center gap-2"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print / Export PDF Call Sheet
                    </button>
                  </div>

                </div>

                {/* Dispatch Status overlay list */}
                {dispatchState !== "idle" && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 rounded-xl border border-white/5 bg-zinc-950/40 space-y-3"
                  >
                    <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 block">
                      Live Delivery Tracking Dash
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      {roster.map((row) => (
                        <div key={row.id} className="p-2 border border-white/5 rounded bg-zinc-900/40 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-white block">{row.name}</span>
                            <span className="text-[9px] text-zinc-500 font-mono block">{row.role}</span>
                          </div>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                            row.dispatchStatus === "Sent" 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : row.dispatchStatus === "Sending"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse"
                              : "bg-white/5 text-zinc-500 border border-white/5"
                          }`}>
                            {row.dispatchStatus}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Footer Info bar */}
      <div className="p-3 border-t border-white/5 bg-zinc-950/40 flex justify-between items-center text-[9px] font-mono text-zinc-500">
        <div>ABRAM Roster Sync & AI Generation Engine</div>
        <div>v2.0-stable</div>
      </div>
    </div>
  );
}
