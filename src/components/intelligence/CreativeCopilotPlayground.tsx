"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Paperclip,
  Check,
  Loader2,
  Sparkles,
  X,
  Plus,
  Minus,
  Maximize2,
  Play,
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
  Layers,
  ArrowUp,
  ArrowDown,
  Trash2,
  Users,
  Clock,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Globe,
  FileUp,
  Folder,
  Database,
  DollarSign,
  MapPin
} from "lucide-react";

// Types & Interfaces
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinking?: {
    logs: string[];
    isExpanded: boolean;
    isFinished: boolean;
  };
  actionPlan?: {
    id: string;
    title: string;
    steps: string[];
    status: "pending" | "approved" | "rejected";
    scenario: "setup" | "breakdown" | "crewing" | "equipment" | "roms";
  };
  isFallback?: boolean;
}

interface ProjectSetup {
  title: string;
  type: string;
  budget: string;
  status: string;
  startDate: string;
  location: string;
  description: string;
}

interface BreakdownItem {
  id: string;
  sceneNo?: string;
  title: string;
  type: "scene" | "brief";
  location?: string;
  characters?: string[];
  props?: string[];
  notes: string;
}

interface CrewMatch {
  id: string;
  role: string;
  matchedName: string;
  rate: string;
  matchScore: string;
  status: "Assigned" | "Pending Approval" | "Roster Shortlist";
}

interface EquipmentMatch {
  id: string;
  name: string;
  category: string;
  qty: number;
  inventoryStatus: "In Inventory" | "Requires Rental";
  fitRating: string;
  notes: string;
}

interface BudgetROMItem {
  id: string;
  category: string;
  description: string;
  estimate: string;
  percentage: string;
}

// Initial Mock Data
const INITIAL_PROJECT: ProjectSetup = {
  title: "Project Vesper",
  type: "Sci-Fi Short Film",
  budget: "$75,000 (Target ROM)",
  status: "Pre-Production",
  startDate: "Oct 12, 2026",
  location: "Vesper Crater Set / Obsidian Soundstage",
  description: "A survival thriller following an astronaut trying to seal an airlock on a remote, electromagnetic planet before nightfall."
};

const INITIAL_BREAKDOWNS: BreakdownItem[] = [
  {
    id: "b-1",
    sceneNo: "1",
    title: "INT. VESPER COMMAND CENTER - DUSK",
    type: "scene",
    location: "Command Center Set",
    characters: ["Captain Leo", "Officer Lyra"],
    props: ["Transceiver Unit", "Holotable"],
    notes: "Leo tries to scan the transceiver. Lyra enters with a broken rig component."
  },
  {
    id: "b-2",
    sceneNo: "2",
    title: "EXT. OBSIDIAN PLAINS - DAY",
    type: "scene",
    location: "Obsidian Plains Location",
    characters: ["Officer Lyra", "Jax Thorne"],
    props: ["Airlock Sealing Torch", "Shuttle Scanners"],
    notes: "The shuttle touches down. Jax Thorne checks hull readings on the dusty plains."
  },
  {
    id: "b-3",
    title: "Creative Brief Parameters",
    type: "brief",
    notes: "Visual tone: High-contrast anamorphic, cold zinc/obsidian color palette. Sound design: Low-frequency electromagnetic hums, dynamic wind sweeps."
  }
];

const INITIAL_CREW: CrewMatch[] = [
  {
    id: "cr-1",
    role: "Director of Photography",
    matchedName: "Vesper Lin",
    rate: "$800/day",
    matchScore: "98%",
    status: "Assigned"
  },
  {
    id: "cr-2",
    role: "VFX Supervisor",
    matchedName: "Jax Thorne",
    rate: "$850/day",
    matchScore: "91%",
    status: "Pending Approval"
  },
  {
    id: "cr-3",
    role: "Video Editor",
    matchedName: "Officer Lyra",
    rate: "$650/day",
    matchScore: "92%",
    status: "Roster Shortlist"
  },
  {
    id: "cr-4",
    role: "3D Motion Designer",
    matchedName: "Nova Tech",
    rate: "$700/day",
    matchScore: "88%",
    status: "Roster Shortlist"
  }
];

const INITIAL_EQUIPMENT: EquipmentMatch[] = [
  {
    id: "eq-1",
    name: "RED V-Raptor 8K Camera",
    category: "Camera Package",
    qty: 1,
    inventoryStatus: "In Inventory",
    fitRating: "Perfect Match",
    notes: "Matches the Sci-Fi Anamorphic visual requirements perfectly."
  },
  {
    id: "eq-2",
    name: "Arri Skypanel S60-C LED",
    category: "Lighting",
    qty: 3,
    inventoryStatus: "In Inventory",
    fitRating: "Perfect Match",
    notes: "Own 4 units in primary warehouse inventory."
  },
  {
    id: "eq-3",
    name: "Cooke S7/i Full Frame Anamorphic Lenses",
    category: "Lenses",
    qty: 1,
    inventoryStatus: "Requires Rental",
    fitRating: "Ideal Creative Choice",
    notes: "Not in active inventory. Sourced from preferred rental vendor."
  },
  {
    id: "eq-4",
    name: "DJI Ronin 2 3-Axis Stabilizer",
    category: "Grip / Support",
    qty: 1,
    inventoryStatus: "In Inventory",
    fitRating: "Perfect Match",
    notes: "Compatible with RED package for tracking shots."
  }
];

const INITIAL_ROMS: BudgetROMItem[] = [
  {
    id: "rom-1",
    category: "Crew Personnel",
    description: "Director of Photography, VFX Supervisor, Editor, Coordinator (10 days)",
    estimate: "$35,000",
    percentage: "46.6%"
  },
  {
    id: "rom-2",
    category: "Equipment Package",
    description: "Internal inventory use fees + Cooke lens external rental",
    estimate: "$18,000",
    percentage: "24.0%"
  },
  {
    id: "rom-3",
    category: "Soundstage & Locations",
    description: "Vesper Crater location fee + Obsidian stage booking (3 days)",
    estimate: "$12,000",
    percentage: "16.0%"
  },
  {
    id: "rom-4",
    category: "Production Contingency",
    description: "Insurance, data management, and buffer",
    estimate: "$10,000",
    percentage: "13.4%"
  }
];

export default function CreativeCopilotPlayground() {
  const [activeTab, setActiveTab] = useState<string>("project");
  const [inputValue, setInputValue] = useState<string>("");
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);

  const [showPaperclipDropdown, setShowPaperclipDropdown] = useState<boolean>(false);
  const [isWebSearchActive, setIsWebSearchActive] = useState<boolean>(false);
  const [executedPrompts, setExecutedPrompts] = useState<string[]>([]);

  // Playground Data States
  const [project, setProject] = useState<ProjectSetup>(INITIAL_PROJECT);
  const [breakdowns, setBreakdowns] = useState<BreakdownItem[]>(INITIAL_BREAKDOWNS);
  const [crew, setCrew] = useState<CrewMatch[]>(INITIAL_CREW);
  const [equipment, setEquipment] = useState<EquipmentMatch[]>(INITIAL_EQUIPMENT);
  const [roms, setRoms] = useState<BudgetROMItem[]>(INITIAL_ROMS);

  const scrollRef = useRef<HTMLDivElement>(null);

  const welcomeMessage: ChatMessage = {
    id: "welcome",
    role: "assistant",
    content: "Welcome to the ABRAM Sandbox. Select a pre-configured simulation below to run project setups, breakdowns, crewing matches, equipment audits, or ROM budget plans."
  };

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([welcomeMessage]);

  const suggestedPrompts = [
    { id: "setup", text: "Initialize Project Vesper setup" },
    { id: "breakdown", text: "Parse screenplay & brief" },
    { id: "crewing", text: "Optimize crew matching" },
    { id: "equipment", text: "Audit equipment vs inventory" },
    { id: "roms", text: "Generate Budget ROM projection" }
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCommandTrigger = (
    scenario: "setup" | "breakdown" | "crewing" | "equipment" | "roms",
    userText: string
  ) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setExecutedPrompts((prev) => [...prev, scenario]);
    setShowPaperclipDropdown(false);

    const tabMap: Record<string, string> = {
      setup: "project",
      breakdown: "breakdown",
      crewing: "crewing",
      equipment: "equipment",
      roms: "roms"
    };
    if (tabMap[scenario]) {
      setActiveTab(tabMap[scenario]);
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userText
    };

    const assistantMsgId = `assistant-${Date.now()}`;
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      thinking: {
        logs: [],
        isExpanded: true,
        isFinished: false
      }
    };

    setChatHistory((prev) => [...prev, userMsg, initialAssistantMsg]);
    setInputValue("");

    let logsList: string[] = [];
    let responseText = "";
    let actionSteps: string[] = [];

    if (scenario === "setup") {
      logsList = [
        "Establishing Project Vesper workspace repository...",
        "Parsing production target constraints...",
        "Validating calendar timelines against studio standards...",
        "Resolving organizational metadata parameters..."
      ];
      responseText = "I have initialized Project Vesper. The structure has been configured with target shooting dates, locations, and default budget markers. Let me know if you would like to run the screenplay breakdown.";
      actionSteps = [
        "Create project file structures",
        "Configure shooting locations database",
        "Set default ROM budget parameters"
      ];
    } else if (scenario === "breakdown") {
      logsList = [
        "Scanning screenplay text assets...",
        "Extracting scene boundaries and headings...",
        "Identifying cast character tags and prop references...",
        "Reading creative brief style guidelines..."
      ];
      responseText = "I've processed the creative briefs and screenplay. I successfully parsed the scene locations (Vesper Command Set & Obsidian Plains) along with core visual style targets from the brief. Click Approve to inject these breakdown specs.";
      actionSteps = [
        "Parse 2 shooting scenes and brief parameters",
        "Tag Captain Leo, Officer Lyra, and Jax Thorne",
        "Extract critical props: transceiver unit, sealing torch"
      ];
    } else if (scenario === "crewing") {
      logsList = [
        "Accessing active crew roster database...",
        "Checking contractor calendars & availability indicators...",
        "Calculating position suitability index...",
        "Validating double-booking safety guardrails..."
      ];
      responseText = "I have performed roster matchmaking for Project Vesper's crew positions. Vesper Lin is assigned as DP, Jax Thorne is pending, and Officer Lyra has been shortlisted for Video Editor. Check the Roster to approve the plan.";
      actionSteps = [
        "Match Vesper Lin as Director of Photography (98% fit)",
        "Shortlist Officer Lyra for Video Editor (92% fit)",
        "Flag Jax Thorne as VFX Supervisor (91% fit, Pending)"
      ];
    } else if (scenario === "equipment") {
      logsList = [
        "Analyzing script visual/technical requirements...",
        "Scanning active warehouse inventory records...",
        "Comparing fit indexes for camera & lighting gear...",
        "Identifying external rental line-items..."
      ];
      responseText = "I have completed the inventory check for our gear requirements. The RED V-Raptor camera and Arri Skypanels are available in stock. The Cooke S7 lenses require external rental. You can approve the action plan to allocate resources.";
      actionSteps = [
        "Assign RED V-Raptor package from Internal Inventory",
        "Reserve 3x Arri Skypanel units from Internal Inventory",
        "Flag Cooke S7/i Lenses as external rental requirement"
      ];
    } else if (scenario === "roms") {
      logsList = [
        "Aggregating estimated personnel rates...",
        "Summing internal usage fees & external rental costs...",
        "Applying location booking fee projections...",
        "Adding contingency factor to total ROM sum..."
      ];
      responseText = "I have compiled the Rough Order of Magnitude (ROM) budget estimation. The projected costs sum to $75,000, with Personnel taking up 46.6% and Gear at 24%. Approve the action plan to lock the ROM model.";
      actionSteps = [
        "Verify estimated crew personnel costs ($35K)",
        "Verify gear inventory allocation and rentals ($18K)",
        "Lock total projected ROM schedule at $75,000"
      ];
    }

    let logIdx = 0;
    const interval = setInterval(() => {
      if (logIdx < logsList.length) {
        const currentLog = logsList[logIdx];
        setChatHistory((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId && msg.thinking
              ? {
                  ...msg,
                  thinking: {
                    ...msg.thinking,
                    logs: [...msg.thinking.logs, currentLog]
                  }
                }
              : msg
          )
        );
        logIdx++;
      } else {
        clearInterval(interval);

        setChatHistory((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId && msg.thinking
              ? {
                  ...msg,
                  thinking: {
                    ...msg.thinking,
                    isFinished: true,
                    isExpanded: false
                  }
                }
              : msg
          )
        );

        streamText(assistantMsgId, responseText, actionSteps, scenario);
      }
    }, 400);
  };

  const streamText = (
    msgId: string,
    text: string,
    steps: string[],
    scenario: "setup" | "breakdown" | "crewing" | "equipment" | "roms"
  ) => {
    const words = text.split(" ");
    let wordIdx = 0;
    let currentContent = "";

    const textInterval = setInterval(() => {
      if (wordIdx < words.length) {
        currentContent += (wordIdx === 0 ? "" : " ") + words[wordIdx];
        setChatHistory((prev) =>
          prev.map((msg) =>
            msg.id === msgId
              ? {
                  ...msg,
                  content: currentContent
                }
              : msg
          )
        );
        wordIdx++;
      } else {
        clearInterval(textInterval);

        setChatHistory((prev) =>
          prev.map((msg) =>
            msg.id === msgId
              ? {
                  ...msg,
                  actionPlan: {
                    id: `action-${Date.now()}`,
                    title: "Proposed Action Plan",
                    steps,
                    status: "pending",
                    scenario
                  }
                }
              : msg
          )
        );
        setIsAnimating(false);
      }
    }, 45);
  };

  const handleCustomSend = () => {
    if (!inputValue.trim() || isAnimating) return;

    const trimmed = inputValue.trim().toLowerCase();

    if (trimmed.includes("setup") || trimmed.includes("project") || trimmed.includes("init")) {
      handleCommandTrigger("setup", inputValue);
    } else if (trimmed.includes("breakdown") || trimmed.includes("script") || trimmed.includes("brief")) {
      handleCommandTrigger("breakdown", inputValue);
    } else if (trimmed.includes("crew") || trimmed.includes("roster") || trimmed.includes("people")) {
      handleCommandTrigger("crewing", inputValue);
    } else if (trimmed.includes("equipment") || trimmed.includes("gear") || trimmed.includes("inventory")) {
      handleCommandTrigger("equipment", inputValue);
    } else if (trimmed.includes("rom") || trimmed.includes("budget") || trimmed.includes("cost")) {
      handleCommandTrigger("roms", inputValue);
    } else {
      setIsAnimating(true);
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: inputValue
      };

      const assistantMsgId = `assistant-${Date.now()}`;
      const initialMsg: ChatMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        thinking: {
          logs: ["Evaluating query...", "Searching project directories..."],
          isExpanded: true,
          isFinished: false
        }
      };

      setChatHistory((prev) => [...prev, userMsg, initialMsg]);
      setInputValue("");

      setTimeout(() => {
        setChatHistory((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId && msg.thinking
              ? {
                  ...msg,
                  thinking: {
                    ...msg.thinking,
                    isFinished: true,
                    isExpanded: false
                  }
                }
              : msg
          )
        );

        const responseText = `I analyzed your custom request. In this simulator workspace, you can trigger specific project setups, breakdowns, crewing matches, equipment audits, or ROM budget plans using the presets:`;

        let words = responseText.split(" ");
        let wordIdx = 0;
        let currentContent = "";
        const textInterval = setInterval(() => {
          if (wordIdx < words.length) {
            currentContent += (wordIdx === 0 ? "" : " ") + words[wordIdx];
            setChatHistory((prev) =>
              prev.map((msg) =>
                msg.id === assistantMsgId ? { ...msg, content: currentContent } : msg
              )
            );
            wordIdx++;
          } else {
            clearInterval(textInterval);
            setChatHistory((prev) =>
              prev.map((msg) =>
                msg.id === assistantMsgId ? { ...msg, isFallback: true } : msg
              )
            );
            setIsAnimating(false);
          }
        }, 45);
      }, 800);
    }
  };

  const handleApproveAction = (
    msgId: string,
    scenario: "setup" | "breakdown" | "crewing" | "equipment" | "roms"
  ) => {
    setChatHistory((prev) =>
      prev.map((msg) =>
        msg.id === msgId && msg.actionPlan
          ? {
              ...msg,
              actionPlan: {
                ...msg.actionPlan,
                status: "approved"
              }
            }
          : msg
      )
    );

    if (scenario === "setup") {
      setProject({
        ...INITIAL_PROJECT,
        status: "Active Setup"
      });
      setActiveTab("project");
      showToast("Project setup initialized");
    } else if (scenario === "breakdown") {
      setBreakdowns([
        {
          id: "b-1",
          sceneNo: "1",
          title: "INT. VESPER COMMAND CENTER - DUSK",
          type: "scene",
          location: "Command Center Set",
          characters: ["Captain Leo", "Officer Lyra"],
          props: ["Transceiver Unit", "Holotable"],
          notes: "Leo tries to scan the transceiver. Lyra enters with a broken rig component."
        },
        {
          id: "b-2",
          sceneNo: "2",
          title: "EXT. OBSIDIAN PLAINS - DAY",
          type: "scene",
          location: "Obsidian Plains Location",
          characters: ["Officer Lyra", "Jax Thorne"],
          props: ["Airlock Sealing Torch", "Shuttle Scanners"],
          notes: "The shuttle touches down. Jax Thorne checks hull readings on the dusty plains."
        },
        {
          id: "b-3",
          sceneNo: "3",
          title: "INT. VESPER CRATER AIRLOCK - NIGHT",
          type: "scene",
          location: "Airlock Pod",
          characters: ["Captain Leo", "Officer Lyra", "Jax Thorne"],
          props: ["Suit Scanners", "Manual Airlock Lever"],
          notes: "Tension rises as they attempt to seal the primary airlock door before temperature drops."
        },
        {
          id: "b-4",
          title: "Creative Brief Parameters",
          type: "brief",
          notes: "Visual tone: High-contrast anamorphic, cold zinc/obsidian color palette. Sound design: Low-frequency electromagnetic hums, dynamic wind sweeps."
        }
      ]);
      setActiveTab("breakdown");
      showToast("Full script & brief breakdown loaded");
    } else if (scenario === "crewing") {
      setCrew((prev) =>
        prev.map((c) =>
          c.id === "cr-2" ? { ...c, status: "Assigned" } : c
        )
      );
      setActiveTab("crewing");
      showToast("Crew match confirmed & assigned");
    } else if (scenario === "equipment") {
      setEquipment((prev) =>
        prev.map((e) =>
          e.id === "eq-3" ? { ...e, inventoryStatus: "In Inventory", fitRating: "Perfect Match (Secured Rental)" } : e
        )
      );
      setActiveTab("equipment");
      showToast("Cooke S7 Anamorphic rental secured!");
    } else if (scenario === "roms") {
      setRoms((prev) =>
        prev.map((r) =>
          r.category === "Production Contingency" ? { ...r, estimate: "$9,500", percentage: "12.7%" } : r
        )
      );
      setActiveTab("roms");
      showToast("ROM Budget approved & locked");
    }
  };

  const handleRejectAction = (msgId: string) => {
    setChatHistory((prev) =>
      prev.map((msg) =>
        msg.id === msgId && msg.actionPlan
          ? {
              ...msg,
              actionPlan: {
                ...msg.actionPlan,
                status: "rejected"
              }
            }
          : msg
      )
    );
    showToast("Action discarded.");
  };

  const resetSandbox = () => {
    if (isAnimating) return;
    setProject(INITIAL_PROJECT);
    setBreakdowns(INITIAL_BREAKDOWNS);
    setCrew(INITIAL_CREW);
    setEquipment(INITIAL_EQUIPMENT);
    setRoms(INITIAL_ROMS);
    setChatHistory([welcomeMessage]);
    setInputValue("");
    setActiveTab("project");
    setExecutedPrompts([]);
    setShowPaperclipDropdown(false);
    setIsWebSearchActive(false);
    showToast("Sandbox reset to default specifications");
  };

  const toggleThinkingExpansion = (msgId: string) => {
    setChatHistory((prev) =>
      prev.map((msg) =>
        msg.id === msgId && msg.thinking
          ? { ...msg, thinking: { ...msg.thinking, isExpanded: !msg.thinking.isExpanded } }
          : msg
      )
    );
  };

  const handleNestedScrollWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const deltaY = e.deltaY;
    const canScrollUp = scrollTop > 0 && deltaY < 0;
    const canScrollDown = scrollTop + clientHeight < scrollHeight - 1 && deltaY > 0;
    if (canScrollUp || canScrollDown) {
      e.stopPropagation();
    }
  };

  return (
    <div className="w-full font-sans text-zinc-100 selection:bg-zinc-800">
      
      {/* Toast Banner */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-20 left-1/2 -translate-x-1/2 px-4 py-2.5 bg-zinc-905/90 border border-white/10 text-white text-[10px] sm:text-xs font-semibold tracking-wider rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.5)] z-50 flex items-center gap-2 backdrop-blur-md font-sans"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-7xl mx-auto w-full">
        
        {/* Left Side: Mock Chat Interface */}
        <div className="col-span-1 lg:col-span-5 flex flex-col h-[620px] lg:h-[720px] bg-[#141414] rounded-2xl border border-[#27272a] overflow-hidden shadow-2xl relative font-sans">
          
          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#27272a] shrink-0 font-sans bg-zinc-950/20">
            <div className="flex items-center gap-3">
              <span className="text-[#e4e4e7] font-medium text-sm">Chat</span>
              <button
                onClick={resetSandbox}
                disabled={isAnimating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#27272a] hover:bg-[#3f3f46] transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
              >
                <Plus className="w-3.5 h-3.5 text-[#e4e4e7]" />
                <span className="text-[#e4e4e7] text-xs font-medium">New chat</span>
              </button>
            </div>
            <div className="flex items-center gap-4 text-[#52525b] select-none">
              <Minus className="w-4 h-4 cursor-pointer hover:text-[#e4e4e7] transition-colors" onClick={resetSandbox} />
              <Maximize2 className="w-3.5 h-3.5 cursor-pointer hover:text-[#e4e4e7] transition-colors" />
              <X 
                onClick={resetSandbox}
                className="w-4 h-4 cursor-pointer hover:text-[#e4e4e7] transition-colors" 
              />
            </div>
          </div>

          {/* Chat Logs List */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-none flex flex-col"
            onWheel={handleNestedScrollWheel}
          >
            {chatHistory.map((message) => (
              <div key={message.id} className="w-full">
                
                {/* User Message */}
                {message.role === "user" && (
                  <div className="flex justify-end w-full">
                    <div className="max-w-[80%] rounded-2xl px-4 py-2.5 bg-[#27272a] text-[#e4e4e7] text-[14px] leading-relaxed">
                      {message.content}
                    </div>
                  </div>
                )}

                {/* Assistant Message */}
                {message.role === "assistant" && (
                  <div className="flex flex-col items-start w-full">
                    
                    {/* Assistant Metadata */}
                    <div className="flex items-center gap-1 mb-1.5 font-sans">
                      <span className="text-[#52525b] text-[13px] font-medium">ABRAM Agent</span>
                      <Play className="w-2.5 h-2.5 text-[#52525b] fill-current" />
                    </div>

                    {/* Thinking Panel Replica (Agent Operations style) */}
                    {message.thinking && message.thinking.logs.length > 0 && (
                      <div className="w-full flex flex-col items-start mt-2">
                        <div className="flex flex-col gap-1.5 mb-3 bg-[#141414]/30 border border-[#27272a]/40 rounded-lg p-2.5 w-fit min-w-[240px]">
                          <div 
                            onClick={() => toggleThinkingExpansion(message.id)}
                            className="text-[10px] uppercase tracking-wider text-[#52525b] font-mono mb-1 font-semibold flex items-center gap-2 cursor-pointer select-none hover:text-zinc-400"
                          >
                            <span>Agent Operations</span>
                            {message.thinking.isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-[#52525b]" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-[#52525b]" />
                            )}
                          </div>
                          
                          {message.thinking.isExpanded && (
                            <div className="space-y-1.5">
                              {message.thinking.logs.map((log, lIdx) => {
                                const isCompleted = message.thinking!.isFinished || lIdx < message.thinking!.logs.length - 1;
                                return (
                                  <div key={lIdx} className="flex items-center gap-2 text-xs">
                                    {isCompleted ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    ) : (
                                      <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin shrink-0" />
                                    )}
                                    <span className="text-[#a1a1aa] text-[11px] sm:text-xs">
                                      {isCompleted ? 'Completed' : 'Executing'}{" "}
                                      <code className="font-mono text-white bg-[#27272a]/60 px-1 py-0.5 rounded text-[10px] sm:text-[11px]">{log}</code>
                                    </span>
                                  </div>
                                );
                              })}
                              {!message.thinking.isFinished && (
                                <div className="flex items-center gap-2 text-xs">
                                  <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin shrink-0" />
                                  <span className="text-zinc-500 font-mono text-[9px] uppercase tracking-widest">
                                    Running step...
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Main text content */}
                    {message.content && (
                      <div className="text-[#e4e4e7] text-[14px] sm:text-[15px] font-sans font-normal leading-relaxed max-w-full select-text">
                        {message.content}
                      </div>
                    )}

                    {/* Action Plan Card */}
                    {message.actionPlan && (
                      <div className="glass-panel border border-white/10 rounded-xl p-4 mt-4 w-full max-w-md bg-zinc-950/30 flex flex-col gap-3">
                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold font-sans">
                          {message.actionPlan.title}
                        </div>
                        
                        <div className="space-y-2.5">
                          {message.actionPlan.steps.map((step, sIdx) => (
                            <div key={sIdx} className="flex items-start gap-2.5">
                              <div className="w-4 h-4 border border-white/20 rounded flex items-center justify-center text-emerald-400 bg-white/[0.02] shrink-0 mt-0.5">
                                <Check className="w-3 h-3 text-emerald-400" />
                              </div>
                              <span className="text-zinc-300 text-xs font-normal font-sans leading-tight">
                                {step}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Conditional Buttons Row */}
                        {message.actionPlan.status === "pending" ? (
                          <div className="flex items-center gap-2.5 mt-2">
                            <button
                              onClick={() => handleApproveAction(message.id, message.actionPlan!.scenario)}
                              className="btn-primary min-h-[44px] sm:min-h-[36px] px-5 py-2 text-xs flex-1 rounded-full font-bold flex items-center justify-center bg-white text-black hover:bg-zinc-200 transition-colors select-none cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectAction(message.id)}
                              className="btn-ghost min-h-[44px] sm:min-h-[36px] px-4 py-2 text-xs flex-1 rounded-full border border-white/5 hover:border-white/15 text-zinc-400 hover:text-white transition-colors flex items-center justify-center select-none cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : message.actionPlan.status === "approved" ? (
                          <div className="text-emerald-400 font-semibold text-xs mt-1 flex items-center gap-1.5">
                            <Check className="w-4 h-4 text-emerald-400" />
                            Action approved & saved to project
                          </div>
                        ) : (
                          <div className="text-zinc-500 font-semibold text-xs mt-1 flex items-center gap-1.5">
                            <X className="w-4 h-4 text-zinc-500" />
                            Action cancelled & draft discarded
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Suggested Prompts & Inputs Wrapper */}
          <div className="p-4 bg-transparent relative shrink-0">
            
            {/* Suggested clickable prompt cards (rendered when no active simulation) */}
            <AnimatePresence>
              {!isAnimating && suggestedPrompts.some(p => !executedPrompts.includes(p.id)) && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="mb-4 space-y-2"
                >
                  <div className="text-[10px] text-zinc-550 uppercase tracking-widest font-semibold mb-2 block font-sans">
                    Suggested Scenarios
                  </div>
                  {suggestedPrompts
                    .filter((prompt) => !executedPrompts.includes(prompt.id))
                    .map((prompt) => (
                      <button
                        key={prompt.id}
                        onClick={() => handleCommandTrigger(prompt.id as any, prompt.text)}
                        className="w-full text-left p-3 rounded-xl border border-[#27272a] bg-[#27272a]/10 hover:border-white/10 hover:bg-[#27272a]/20 transition-all cursor-pointer min-h-[44px] flex items-center justify-between gap-3 text-xs font-normal text-zinc-300 hover:text-white"
                      >
                        <span>{prompt.text}</span>
                        <Sparkles className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      </button>
                    ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Box Wrapper */}
            <div className="bg-[#141414] border border-[#27272a] rounded-xl flex flex-col p-3 shadow-lg relative">
              
              {/* Dropdown for paperclip (attach and skills) */}
              <AnimatePresence>
                {showPaperclipDropdown && (
                  <>
                    {/* Click backdrop to close */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowPaperclipDropdown(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-16 left-3 w-48 bg-[#141414] border border-[#27272a] rounded-xl shadow-2xl p-1 z-20 flex flex-col"
                    >
                      <button
                        onClick={() => {
                          setShowPaperclipDropdown(false);
                          showToast("Mock: File upload modal triggered");
                        }}
                        className="flex items-center gap-2.5 px-3 py-2.5 text-xs text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer min-h-[44px] md:min-h-0"
                      >
                        <FileUp className="w-3.5 h-3.5 text-zinc-500" />
                        Attach File
                      </button>
                      <button
                        onClick={() => {
                          setShowPaperclipDropdown(false);
                          showToast("Mock: Agent Skills panel opened");
                        }}
                        className="flex items-center gap-2.5 px-3 py-2.5 text-xs text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer min-h-[44px] md:min-h-0"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
                        Agent Skills
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value.slice(0, 2000))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleCustomSend();
                  }
                }}
                disabled={isAnimating}
                placeholder="Ask ABRAM..."
                className="w-full bg-transparent border-none text-[#e4e4e7] placeholder:text-[#52525b] text-[14px] leading-relaxed resize-none focus:outline-none min-h-[40px] py-1"
                rows={1}
              />

              <div className="flex items-center justify-between mt-2 select-none font-sans">
                <div className="flex items-center gap-2">
                  
                  {/* Skills Button */}
                  <button
                    onClick={() => setShowPaperclipDropdown(!showPaperclipDropdown)}
                    disabled={isAnimating}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-[#27272a] transition-colors text-[#a1a1aa] cursor-pointer disabled:opacity-30"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Skills</span>
                    <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                  </button>

                  {/* Web search toggle button */}
                  <button
                    onClick={() => {
                      const nextState = !isWebSearchActive;
                      setIsWebSearchActive(nextState);
                      showToast(nextState ? "Web search activated" : "Web search deactivated");
                    }}
                    disabled={isAnimating}
                    className={`px-2 py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all select-none cursor-pointer border border-transparent ${
                      isWebSearchActive
                        ? "bg-[#8ECAFF]/10 border-[#8ECAFF]/30 text-[#8ECAFF] font-semibold shadow-[0_0_15px_rgba(142,202,255,0.15)] animate-pulse"
                        : "text-[#a1a1aa] hover:bg-[#27272a] hover:text-white"
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Web</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full border border-[#3f3f46] flex items-center justify-center">
                    <span className="text-[10px] text-[#52525b]">1</span>
                  </div>
                  
                  {/* Paperclip Button */}
                  <button
                    onClick={() => {
                      showToast("Mock: File upload modal triggered");
                    }}
                    disabled={isAnimating}
                    className="p-1.5 hover:bg-[#27272a] rounded-md transition-colors text-[#a1a1aa] cursor-pointer disabled:opacity-30"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  
                  {/* Send Button */}
                  <button
                    onClick={handleCustomSend}
                    disabled={!inputValue.trim() || isAnimating}
                    className="p-1.5 bg-[#27272a] rounded-md transition-colors text-[#e4e4e7] hover:bg-[#3f3f46] disabled:opacity-30 disabled:hover:bg-[#27272a] cursor-pointer"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Tabbed Sandbox Canvas */}
        <div className="col-span-1 lg:col-span-7 flex flex-col h-[620px] lg:h-[720px] bg-[#141414]/40 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden shadow-2xl font-sans">
          
          {/* Header Navigation Tabs (Premium sliding background) */}
          <div className="flex items-center justify-between border-b border-white/5 bg-transparent px-4 py-2 shrink-0 font-sans">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1 w-full">
              {[
                { id: "project", label: "Project Setup", icon: Folder },
                { id: "breakdown", label: "Breakdowns", icon: FileText },
                { id: "crewing", label: "Crewing", icon: Users },
                { id: "equipment", label: "Equipment & Inventory", icon: Database },
                { id: "roms", label: "Budget ROMs", icon: DollarSign }
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="relative flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-semibold transition-colors cursor-pointer select-none whitespace-nowrap min-h-[38px] group"
                  >
                    {active && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute inset-0 bg-white rounded-full"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <Icon className={`relative z-10 w-3.5 h-3.5 transition-colors duration-200 ${
                      active ? "text-black" : "text-zinc-400 group-hover:text-zinc-200"
                    }`} />
                    <span className={`relative z-10 transition-colors duration-200 ${
                      active ? "text-black font-semibold" : "text-zinc-400 group-hover:text-zinc-200"
                    }`}>
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Canvas Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 scrollbar-none">
            <AnimatePresence mode="wait">
              
              {/* PROJECT SETUP VIEW */}
              {activeTab === "project" && (
                <motion.div
                  key="project-tab"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div className="p-3 bg-zinc-950/40 border border-white/5 rounded-xl text-xs text-zinc-400 leading-relaxed flex items-start gap-2.5">
                    <Folder className="w-4 h-4 text-[#8ECAFF] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-zinc-200 font-semibold">Project Configuration:</span> View target budget ROMs, production schedules, and core studio coordinates. Project configuration is synchronized via agent-driven orchestration.
                    </div>
                  </div>

                  <div className="glass-panel rounded-xl border border-white/5 bg-zinc-900/40 p-5 space-y-4">
                    <div className="flex justify-between items-start border-b border-white/5 pb-3">
                      <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">{project.title}</h4>
                        <span className="text-[10px] text-zinc-500 font-mono">{project.type}</span>
                      </div>
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border uppercase tracking-wider ${
                        project.status === "Active Setup" 
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                          : "bg-zinc-800 border-white/5 text-zinc-405"
                      }`}>
                        {project.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-zinc-500 block uppercase font-mono text-[9px] tracking-wider font-semibold">Target ROM</span>
                        <span className="text-zinc-200 font-medium font-mono block mt-0.5">{project.budget}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block uppercase font-mono text-[9px] tracking-wider font-semibold">Shoot Date</span>
                        <span className="text-zinc-200 font-medium font-mono block mt-0.5">{project.startDate}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-zinc-500 block uppercase font-mono text-[9px] tracking-wider font-semibold">Locations</span>
                        <span className="text-zinc-200 font-medium flex items-center gap-1.5 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          {project.location}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-3">
                      <span className="text-zinc-500 block uppercase font-mono text-[9px] tracking-wider mb-1 font-semibold">Production Brief</span>
                      <p className="text-xs text-zinc-400 leading-relaxed font-sans select-text">
                        {project.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* BREAKDOWNS VIEW */}
              {activeTab === "breakdown" && (
                <motion.div
                  key="breakdown-tab"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div className="p-3 bg-zinc-950/40 border border-white/5 rounded-xl text-xs text-zinc-400 leading-relaxed flex items-start gap-2.5">
                    <FileText className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-zinc-200 font-semibold">Script & Brief Breakdown:</span> Read-only list of parsed scenes and creative briefs. Use the chat simulator to run breakdowns from screenplays.
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                    {breakdowns.map((item) => (
                      <div
                        key={item.id}
                        className="bg-zinc-900/60 border border-white/5 rounded-xl p-4 space-y-2 hover:border-white/10 hover:bg-zinc-900/90 transition-all duration-200"
                      >
                        {item.type === "scene" ? (
                          <>
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <span className="px-1.5 py-0.5 bg-zinc-800 border border-white/10 rounded font-mono text-[10px] text-zinc-300 font-bold">
                                  Scene {item.sceneNo}
                                </span>
                                <span className="text-xs font-semibold text-zinc-100">{item.location}</span>
                              </div>
                              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-bold">Screenplay</span>
                            </div>
                            <h5 className="text-[11px] font-medium text-zinc-400 font-mono tracking-wide mt-1">{item.title}</h5>
                            <p className="text-xs text-zinc-350 leading-relaxed font-sans mt-1.5">{item.notes}</p>
                            {item.characters && item.characters.length > 0 && (
                              <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                                {item.characters.map((char) => (
                                  <span key={char} className="text-[9px] font-semibold px-2.5 py-0.5 bg-zinc-800/80 text-zinc-300 border border-white/5 rounded-full capitalize">
                                    {char}
                                  </span>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between items-start border-b border-white/5 pb-1.5">
                              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">{item.title}</span>
                              <span className="text-[9px] text-amber-500/85 uppercase tracking-widest font-mono font-bold">Creative Brief</span>
                            </div>
                            <p className="text-xs text-zinc-350 leading-relaxed font-sans">{item.notes}</p>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* CREWING VIEW */}
              {activeTab === "crewing" && (
                <motion.div
                  key="crewing-tab"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div className="p-3 bg-zinc-950/40 border border-white/5 rounded-xl text-xs text-zinc-400 leading-relaxed flex items-start gap-2.5">
                    <Users className="w-4 h-4 text-[#8ECAFF] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-zinc-200 font-semibold">Crewing Matchmaker:</span> Assess roster match suggestions based on schedule suitability and day rates. Confirm alignments using the simulator options.
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {crew.map((member) => (
                      <div
                        key={member.id}
                        className={`bg-zinc-900/60 border rounded-xl p-4 flex flex-col justify-between gap-4 transition-all duration-300 ${
                          member.status === "Assigned"
                            ? "border-emerald-500/20 bg-emerald-500/[0.01]"
                            : member.status === "Pending Approval"
                            ? "border-amber-500/20 bg-amber-500/[0.01]"
                            : "border-white/5 hover:border-white/10 hover:bg-zinc-900/80"
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-xs font-semibold text-zinc-50">{member.role}</h4>
                              <span className="text-[10px] text-zinc-450 font-mono tracking-wide font-medium mt-0.5 block">{member.matchedName}</span>
                            </div>
                            <span className={`px-2 py-0.5 text-[8px] font-bold border rounded-full uppercase tracking-wider ${
                              member.status === "Assigned"
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                : member.status === "Pending Approval"
                                ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                : "bg-zinc-800 border-white/5 text-zinc-500"
                            }`}>
                              {member.status}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-zinc-500 font-medium">Suitability Index</span>
                              <span className="text-emerald-400 font-bold font-mono">{member.matchScore}</span>
                            </div>
                            <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                style={{ width: member.matchScore }}
                                className="h-full bg-emerald-500"
                              />
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-zinc-500">Day Rate</span>
                            <span className="text-zinc-300 font-mono font-medium">{member.rate}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end border-t border-white/5 pt-3">
                          <button
                            onClick={() => {
                              setCrew((prev) =>
                                prev.map((c) =>
                                  c.id === member.id
                                    ? {
                                        ...c,
                                        status: c.status === "Assigned" ? "Roster Shortlist" : "Assigned"
                                      }
                                    : c
                                )
                              );
                              showToast(`Crew status for ${member.matchedName} modified`);
                            }}
                            className={`px-3 py-1 rounded-full text-[9px] font-bold border transition-all duration-250 cursor-pointer ${
                              member.status === "Assigned"
                                ? "bg-transparent text-zinc-400 border-white/10 hover:text-white"
                                : "bg-white text-black border-transparent hover:bg-zinc-200"
                            }`}
                          >
                            {member.status === "Assigned" ? "Release Position" : "Assign Crew"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* EQUIPMENT VIEW */}
              {activeTab === "equipment" && (
                <motion.div
                  key="equipment-tab"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div className="p-3 bg-zinc-950/40 border border-white/5 rounded-xl text-xs text-zinc-400 leading-relaxed flex items-start gap-2.5">
                    <Database className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-zinc-200 font-semibold">Equipment & Inventory Matching:</span> Analyzes visual requirements and lists gear matching our active warehouse inventory. Rental requirements are auto-flagged.
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                    {equipment.map((item) => (
                      <div
                        key={item.id}
                        className={`bg-zinc-900/60 border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-900/90 transition-all duration-200 ${
                          item.inventoryStatus.includes("Rental")
                            ? "border-amber-500/20 bg-amber-500/[0.005]"
                            : "border-white/5"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-zinc-50">{item.name}</span>
                            <span className="text-[9px] font-mono text-zinc-555">Qty: {item.qty}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] mt-0.5">
                            <span className="text-zinc-500 font-mono">{item.category}</span>
                            <span className="text-zinc-700 font-mono">•</span>
                            <span className="text-emerald-400 font-medium">{item.fitRating}</span>
                          </div>
                          <p className="text-xs text-zinc-400 leading-relaxed max-w-md mt-1">{item.notes}</p>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3.5 border-t border-white/5 sm:border-0 pt-2 sm:pt-0 shrink-0">
                          <span className={`px-2 py-0.5 text-[8.5px] font-bold border rounded-full uppercase tracking-wider ${
                            item.inventoryStatus === "In Inventory"
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                              : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                          }`}>
                            {item.inventoryStatus}
                          </span>
                          <button
                            onClick={() => {
                              setEquipment((prev) =>
                                prev.map((e) =>
                                  e.id === item.id
                                    ? {
                                        ...e,
                                        inventoryStatus: e.inventoryStatus === "In Inventory" ? "Requires Rental" : "In Inventory"
                                      }
                                    : e
                                )
                              );
                              showToast(`Inventory status for ${item.name} toggled`);
                            }}
                            className="px-2.5 py-1 bg-zinc-950 border border-white/5 text-zinc-450 hover:text-white rounded text-[9px] font-mono cursor-pointer"
                          >
                            Toggle Status
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* BUDGET ROMS VIEW */}
              {activeTab === "roms" && (
                <motion.div
                  key="roms-tab"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div className="p-3 bg-zinc-950/40 border border-white/5 rounded-xl text-xs text-zinc-400 leading-relaxed flex items-start gap-2.5">
                    <DollarSign className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-zinc-200 font-semibold">Rough Order of Magnitude (ROM) Budget:</span> Track projected costs across all operational columns. Calculations update dynamically based on inventory rentals and crew day rates.
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                      {roms.map((item) => (
                        <div
                          key={item.id}
                          className="bg-zinc-900/60 border border-white/5 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-white/10 hover:bg-zinc-900/90 transition-all duration-200"
                        >
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-widest font-mono">{item.category}</span>
                            <p className="text-xs text-zinc-355 leading-relaxed font-sans mt-0.5">{item.description}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-bold text-zinc-100 font-mono block">{item.estimate}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">{item.percentage}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center bg-zinc-950/50 border border-white/5 rounded-xl p-4 mt-2">
                      <div>
                        <div className="text-[9px] text-zinc-500 uppercase font-mono font-bold tracking-wider">Aggregate ROM Summary</div>
                        <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                          $75,000 Total Estimated Cost
                        </div>
                      </div>
                      <span className="px-2 py-0.5 text-[8.5px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full uppercase tracking-wider">
                        ROM Confirmed
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </div>

      </div>

    </div>
  );
}
