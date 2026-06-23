"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  FileSpreadsheet,
  CheckCircle,
  HelpCircle,
  Clock,
  Sparkles,
  DollarSign,
  Briefcase,
  Wrench,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  Sliders,
  Settings,
  AlertCircle
} from "lucide-react";

// Standard cinematic easing
const easeCinematic = [0.16, 1, 0.3, 1] as [number, number, number, number];

// Template options
const TEMPLATES = [
  {
    id: "filmmaker",
    name: "Filmmaker Template",
    desc: "Luxury product shoot",
    text: "We are producing a 60-second commercial for a luxury watch brand. Shot list includes close-ups of the dial, slow-motion movement, and a hero reveal in a studio environment. We need a cinematographer, a gaffer, and a video editor. Shoot location is not determined yet, and we need delivery by the end of next month."
  },
  {
    id: "marketing",
    name: "Marketing Template",
    desc: "SaaS campaign explainer",
    text: "Campaign launch for a new SaaS platform. Deliverables include a 2-minute explainer video and 3 social media ads (9:16 vertical ratio). Needs scriptwriting, professional voiceover, motion design, and editing. Ideal budget is $12,000. Timeline is tight, targeting a 3-week turnaround."
  },
  {
    id: "creative",
    name: "Creative Template",
    desc: "Interactive VR teaser",
    text: "Interactive VR art exhibit teaser. Seeking a narrative designer, a 3D modeler with Unreal Engine experience, and sound design. The output will be a 3D spatial audio teaser file (Ambisonics format) and a 15-second social teaser. Production starts mid-August in Los Angeles."
  }
];

export default function BriefIntelligenceSandbox() {
  const [activeStep, setActiveStep] = useState<"input" | "parsing" | "questions" | "blueprint">("input");
  const [briefText, setBriefText] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [parsingLogs, setParsingLogs] = useState<string[]>([]);
  const [logIndex, setLogIndex] = useState(0);
  const [confidence, setConfidence] = useState(65);

  // Clarifying questions state
  const [answers, setAnswers] = useState({
    location: "",
    deliverables: "",
    gear: ""
  });

  // Handle template selection
  const selectTemplate = (id: string) => {
    const template = TEMPLATES.find(t => t.id === id);
    if (template) {
      setBriefText(template.text);
      setSelectedTemplate(id);
    }
  };

  // Drag and drop mock
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // Mock parsing drop
      const file = e.dataTransfer.files[0];
      setBriefText(
        `[Imported: ${file.name}]
We are scoping a premium fashion campaign video shoot. Require a 4-person crew: Director, Camera Operator, Sound Recordist, and Post-Production VFX Editor. Production will take place on-site at a studio. High-end cinema camera packages are required. Deliverables must be formatted for both landscape desktop presentation and portrait social cutdowns.`
      );
      setSelectedTemplate(null);
    }
  };

  // Run brief analysis animation sequence
  const startAnalysis = () => {
    if (briefText.length < 100) return;
    setActiveStep("parsing");
    setLogIndex(0);
    setParsingLogs([]);
  };

  const logs = [
    "Initializing Brief Intelligence Engine...",
    "Extracting metadata & industry focus...",
    "Parsing work packages & production phases...",
    "Extracting roles: mapping skill requirements...",
    "Scanning deliverable list & target durations...",
    "Identifying schedule constraints & equipment needs...",
    "Running Project Scoping Check for gaps..."
  ];

  useEffect(() => {
    if (activeStep !== "parsing") return;

    if (logIndex < logs.length) {
      const timer = setTimeout(() => {
        setParsingLogs(prev => [...prev, logs[logIndex]]);
        setLogIndex(prev => prev + 1);
      }, 700);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setActiveStep("questions");
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [activeStep, logIndex]);

  // Recalculate confidence based on answers completed
  useEffect(() => {
    let baseConfidence = 65;
    if (answers.location) baseConfidence += 12;
    if (answers.deliverables) baseConfidence += 11;
    if (answers.gear) baseConfidence += 12;
    setConfidence(baseConfidence);
  }, [answers]);

  const handleAnswerChange = (field: keyof typeof answers, value: string) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
  };

  const finalizeBlueprint = () => {
    setActiveStep("blueprint");
  };

  const resetSandbox = () => {
    setBriefText("");
    setSelectedTemplate(null);
    setAnswers({ location: "", deliverables: "", gear: "" });
    setActiveStep("input");
  };

  // blueprint tab control
  const [blueprintTab, setBlueprintTab] = useState<"work-packages" | "deliverables" | "roles" | "specs">("work-packages");

  // Dynamic WBS data based on templates
  const getBlueprintData = () => {
    if (selectedTemplate === "marketing") {
      return {
        title: "SaaS Campaign Launch Explainer",
        industry: "Marketing / Technology",
        budget: "$10,500 – $14,000",
        hours: "90 hrs",
        workPackages: [
          {
            phase: "Pre-Production",
            tasks: [
              { name: "SaaS explainer scriptwriting", role: "Scriptwriter", duration: "15 hrs" },
              { name: "Visual storyboard development", role: "Art Director", duration: "10 hrs" }
            ]
          },
          {
            phase: "Production",
            tasks: [
              { name: "Professional Voiceover recording", role: "Voice Artist", duration: "5 hrs" },
              { name: "A-Roll audio/visual capture", role: "Videographer", duration: "20 hrs" }
            ]
          },
          {
            phase: "Post-Production",
            tasks: [
              { name: "Motion graphic design (explainer)", role: "Motion Designer", duration: "25 hrs" },
              { name: "Video assembly & music sync", role: "Video Editor", duration: "15 hrs" }
            ]
          }
        ],
        deliverables: [
          { name: "2-minute Master Explainer (16:9)", format: "ProRes 422 HQ", deadline: "Wk 3", priority: "High" },
          { name: "Social Ad Cutdown A (9:16)", format: "H.264 MP4", deadline: "Wk 3", priority: "Medium" },
          { name: "Social Ad Cutdown B (9:16)", format: "H.264 MP4", deadline: "Wk 3", priority: "Medium" }
        ],
        roles: [
          { name: "Video Editor", skills: ["Sensa Cut", "Sound Design", "Color Grading"] },
          { name: "Motion Designer", skills: ["Vortex Motion", "Onyx Vector", "2D Animation"] },
          { name: "Art Director", skills: ["Storyboarding", "Creative Direction"] },
          { name: "Voice Artist", skills: ["Narration", "Vocal Performance"] }
        ],
        specs: {
          software: ["Sensa Cut Pro", "Vortex Motion", "Sensa Audio"],
          gear: ["Studio condenser mic", "Mirrorless camera package"]
        }
      };
    }

    if (selectedTemplate === "creative") {
      return {
        title: "VR Art Exhibit Teaser",
        industry: "Interactive / Immersive Art",
        budget: "$18,000 – $24,500",
        hours: "135 hrs",
        workPackages: [
          {
            phase: "Pre-Production",
            tasks: [
              { name: "Narrative exhibit scripting", role: "Narrative Designer", duration: "20 hrs" },
              { name: "3D spatial scene layout", role: "3D Modeler", duration: "15 hrs" }
            ]
          },
          {
            phase: "Production",
            tasks: [
              { name: "3D modeling & texture baking", role: "3D Modeler", duration: "40 hrs" },
              { name: "Unreal Engine project setup", role: "Unreal Engine Technical Director", duration: "25 hrs" }
            ]
          },
          {
            phase: "Post-Production",
            tasks: [
              { name: "Ambisonics spatial audio design", role: "Sound Designer", duration: "25 hrs" },
              { name: "Social cutdowns & visual assembly", role: "Video Editor", duration: "10 hrs" }
            ]
          }
        ],
        deliverables: [
          { name: "3D spatial audio teaser file", format: "Ambisonics WAV", deadline: "Wk 4", priority: "Critical" },
          { name: "15-second social teaser (9:16)", format: "H.264 MP4", deadline: "Wk 4", priority: "High" }
        ],
        roles: [
          { name: "3D Modeler", skills: ["Blender", "Substance Painter", "Optimized geometry"] },
          { name: "Unreal Engine Tech Director", skills: ["Unreal Engine 5", "Blueprints", "Lumen lighting"] },
          { name: "Sound Designer", skills: ["Spatial Audio", "Reaper", "Ambisonics plugins"] },
          { name: "Narrative Designer", skills: ["Creative writing", "Interactive scripting"] }
        ],
        specs: {
          software: ["Unreal Engine 5", "Blender", "Reaper", "Substance"],
          gear: ["Spatial microphone arrays", "VR Headset (Meta Quest 3/Pro)"]
        }
      };
    }

    // Default to filmmaker template
    return {
      title: "Luxury Watch Commercial",
      industry: "Commercial Film",
      budget: "$15,000 – $21,000",
      hours: "110 hrs",
      workPackages: [
        {
          phase: "Pre-Production",
          tasks: [
            { name: "Shot list & creative styling", role: "Director", duration: "12 hrs" },
            { name: "Lighting diagram creation", role: "Gaffer", duration: "8 hrs" }
          ]
        },
        {
          phase: "Production",
          tasks: [
            { name: "Product macro close-up captures", role: "Cinematographer", duration: "25 hrs" },
            { name: "Studio key & fill lighting setups", role: "Gaffer", duration: "15 hrs" },
            { name: "A-Roll commercial tracking", role: "Cinematographer", duration: "20 hrs" }
          ]
        },
        {
          phase: "Post-Production",
          tasks: [
            { name: "Rough assembly & speed ramps", role: "Video Editor", duration: "20 hrs" },
            { name: "Commercial color grade alignment", role: "Video Editor / Colorist", duration: "10 hrs" }
          ]
        }
      ],
      deliverables: [
        { name: "60-second Master Commercial (16:9)", format: "ProRes 4444 XQ", deadline: "Wk 4", priority: "High" },
        { name: "30-second Cutdown version", format: "ProRes 422 HQ", deadline: "Wk 4", priority: "Medium" }
      ],
      roles: [
        { name: "Cinematographer", skills: ["Cinema cameras", "Macro lensing", "Camera rigs"] },
        { name: "Gaffer", skills: ["Studio lighting", "DMX control", "High-output fixtures"] },
        { name: "Video Editor", skills: ["Onyx Resolve", "Sensa Cut", "Speed ramping"] }
      ],
      specs: {
        software: ["Onyx Resolve Studio", "Sensa Cut Pro"],
        gear: [
          answers.gear === "cinema" ? "Spire V-Raptor Cinema Package" : answers.gear === "mirrorless" ? "Sensa FX3/FX6 Mirrorless Package" : "High-Speed Macro Probe Lens",
          "Nebula Light Storm studio lights",
          "Precision product turntable"
        ]
      }
    };
  };

  const blueprint = getBlueprintData();

  return (
    <div className="w-full relative z-10 font-sans">
      <div className="glass-panel rounded-2xl p-6 md:p-8 border border-white/5 bg-zinc-950/20 backdrop-blur-md animate-fade-in">
        
        {/* Step Indicator Bar */}
        <div className="flex items-center justify-between border-b border-white/5 pb-5 mb-6 md:mb-8 overflow-x-auto whitespace-nowrap">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${activeStep === "input" ? "bg-white text-black" : "bg-white/10 text-zinc-400"}`}>1</span>
              <span className={`text-xs font-semibold ${activeStep === "input" ? "text-white" : "text-zinc-500"}`}>Intake</span>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600" />
            <div className="flex items-center space-x-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${activeStep === "parsing" ? "bg-white text-black" : "bg-white/10 text-zinc-400"}`}>2</span>
              <span className={`text-xs font-semibold ${activeStep === "parsing" ? "text-white" : "text-zinc-500"}`}>Analysis</span>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600" />
            <div className="flex items-center space-x-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${activeStep === "questions" ? "bg-white text-black" : "bg-white/10 text-zinc-400"}`}>3</span>
              <span className={`text-xs font-semibold ${activeStep === "questions" ? "text-white" : "text-zinc-500"}`}>Scoping Check</span>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600" />
            <div className="flex items-center space-x-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${activeStep === "blueprint" ? "bg-white text-black" : "bg-white/10 text-zinc-400"}`}>4</span>
              <span className={`text-xs font-semibold ${activeStep === "blueprint" ? "text-white" : "text-zinc-500"}`}>Work Packages</span>
            </div>
          </div>

          {activeStep !== "input" && (
            <button 
              onClick={resetSandbox} 
              className="btn-ghost flex items-center space-x-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Dynamic Step Content */}
        <AnimatePresence mode="wait">
          
          {/* STEP 1: INPUT BRIEF */}
          {activeStep === "input" && (
            <motion.div
              key="step-input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: easeCinematic }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              <div className="lg:col-span-8 flex flex-col space-y-5">
                <div>
                  <h3 className="text-lg font-semibold text-white tracking-tight">Brief Intelligence</h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    Upload a creative brief document or select a mockup template to test the deliverable parsing engine.
                  </p>
                </div>

                {/* Template Selection Chips */}
                <div className="flex flex-wrap gap-2">
                  {TEMPLATES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => selectTemplate(t.id)}
                      className={`px-4 py-2 rounded-full border text-xs font-medium transition-all duration-200 cursor-pointer ${
                        selectedTemplate === t.id
                          ? "bg-white text-black border-white"
                          : "bg-white/[0.03] border-white/5 text-zinc-400 hover:border-white/10 hover:text-white"
                      }`}
                    >
                      <span className="block font-semibold">{t.name}</span>
                      <span className={`text-[10px] block font-normal ${selectedTemplate === t.id ? "text-zinc-700" : "text-zinc-500"}`}>{t.desc}</span>
                    </button>
                  ))}
                </div>

                {/* Input Textarea / Drop Zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-xl p-5 transition-all duration-200 flex flex-col ${
                    dragActive 
                      ? "border-white/40 bg-white/[0.04]" 
                      : "border-white/5 bg-black/25 hover:border-white/10"
                  }`}
                >
                  <textarea
                    value={briefText}
                    onChange={(e) => {
                      setBriefText(e.target.value);
                      setSelectedTemplate(null);
                    }}
                    placeholder="Enter brief description (min 100 characters) or drag & drop a PDF/DOCX brief..."
                    className="w-full min-h-[160px] bg-transparent text-sm text-zinc-300 placeholder-zinc-500 outline-none resize-none leading-relaxed"
                  />

                  <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4 text-xs text-zinc-500">
                    <div className="flex items-center space-x-1">
                      <span className={briefText.length >= 100 ? "text-emerald-400" : "text-zinc-500"}>
                        {briefText.length}
                      </span>
                      <span>/ 100 characters minimum</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Upload className="w-3.5 h-3.5 opacity-70" />
                      <span>Drop file under 5MB</span>
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <div>
                  <button
                    disabled={briefText.length < 100}
                    onClick={startAnalysis}
                    className={`btn-primary flex items-center space-x-2 transition-all ${
                      briefText.length < 100 
                        ? "opacity-40 cursor-not-allowed bg-zinc-800 text-zinc-500 hover:bg-zinc-800" 
                        : "hover:scale-[1.02]"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-current" />
                    <span>Analyze Brief & Scope Project</span>
                  </button>
                </div>
              </div>

              {/* Sidebar Help Card */}
              <div className="lg:col-span-4 flex flex-col space-y-4">
                <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] flex flex-col space-y-4">
                  <div className="flex items-center space-x-2 text-white">
                    <Sparkles className="w-4 h-4 text-zinc-300" />
                    <span className="text-sm font-semibold">Parser Capabilities</span>
                  </div>
                  
                  <ul className="space-y-3 text-xs text-zinc-400">
                    <li className="flex items-start space-x-2">
                      <span className="text-zinc-500 mt-0.5">•</span>
                      <span><strong>Work Packages:</strong> Suggests task phases (Pre-Production, Production, Post).</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-zinc-500 mt-0.5">•</span>
                      <span><strong>Roles & Deliverables:</strong> Identifies crew slots and maps deliverables with hours.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-zinc-500 mt-0.5">•</span>
                      <span><strong>Ambient Integration:</strong> Links camera/equipment packages and location limits directly to parameters.</span>
                    </li>
                  </ul>

                  <div className="border-t border-white/5 pt-4 mt-2">
                    <div className="flex items-center space-x-2 text-[10px] text-zinc-500 font-semibold tracking-wider uppercase">
                      <AlertCircle className="w-3 h-3 text-zinc-600" />
                      <span>Intelligent Scoping Checks</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                      If details are missing, the system prompts with clarifying questions to prevent under-budgeting and scheduling overruns.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: PROCESSING / PARSING */}
          {activeStep === "parsing" && (
            <motion.div
              key="step-parsing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 space-y-6"
            >
              <div className="relative flex items-center justify-center">
                {/* Spinning/pulsing elements */}
                <div className="w-16 h-16 rounded-full border border-white/5 animate-ping absolute" />
                <div className="w-12 h-12 rounded-full border-t-2 border-white animate-spin" />
                <Sparkles className="w-5 h-5 text-white absolute" />
              </div>

              <div className="text-center max-w-sm">
                <h4 className="text-sm font-semibold text-white">Extracting Scopes & Deliverables</h4>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  Analyzing document contents, matching role taxonomy, and structuring work modules.
                </p>
              </div>

              {/* Console log simulation */}
              <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs text-zinc-400 space-y-1.5 shadow-inner">
                {parsingLogs.map((log, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>{log}</span>
                  </div>
                ))}
                {parsingLogs.length < logs.length && (
                  <div className="flex items-center space-x-2 text-zinc-600">
                    <span>▶</span>
                    <span>Running heuristics...</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 3: SCOPING CHECK (QUESTIONS) */}
          {activeStep === "questions" && (
            <motion.div
              key="step-questions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              <div className="lg:col-span-8 flex flex-col space-y-6">
                <div>
                  <div className="inline-flex items-center px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] uppercase font-bold tracking-wider mb-2">
                    Scoping Gap Alert
                  </div>
                  <h3 className="text-lg font-semibold text-white tracking-tight">Project Scoping Check</h3>
                  <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
                    We found a few details missing or ambiguous. Answering these quick questions increases the <strong>AI Scoping Confidence Score</strong> before creating the Work Packages.
                  </p>
                </div>

                <div className="space-y-5">
                  {/* Q1 */}
                  <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-3">
                    <span className="text-xs font-semibold text-zinc-300 flex items-center space-x-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-zinc-500" />
                      <span>1. What is the primary shoot / production location?</span>
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { val: "nyc", label: "On-site (New York)" },
                        { val: "la", label: "On-site (Los Angeles)" },
                        { val: "remote", label: "Fully Remote / Post-only" }
                      ].map(opt => (
                        <button
                          key={opt.val}
                          onClick={() => handleAnswerChange("location", opt.val)}
                          className={`p-3 rounded-lg border text-xs font-medium text-left transition-all ${
                            answers.location === opt.val
                              ? "bg-white text-black border-white font-semibold"
                              : "bg-black/25 border-white/5 text-zinc-400 hover:border-white/10 hover:text-white"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Q2 */}
                  <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-3">
                    <span className="text-xs font-semibold text-zinc-300 flex items-center space-x-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-zinc-500" />
                      <span>2. What is the target deliverable aspect ratio?</span>
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { val: "widescreen", label: "Widescreen Only (16:9)" },
                        { val: "social", label: "Social First (9:16 + 1:1)" },
                        { val: "cross-platform", label: "Cross-Platform Package" }
                      ].map(opt => (
                        <button
                          key={opt.val}
                          onClick={() => handleAnswerChange("deliverables", opt.val)}
                          className={`p-3 rounded-lg border text-xs font-medium text-left transition-all ${
                            answers.deliverables === opt.val
                              ? "bg-white text-black border-white font-semibold"
                              : "bg-black/25 border-white/5 text-zinc-400 hover:border-white/10 hover:text-white"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Q3 */}
                  <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-3">
                    <span className="text-xs font-semibold text-zinc-300 flex items-center space-x-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-zinc-500" />
                      <span>3. What is the hardware / camera equipment requirement?</span>
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { val: "cinema", label: "Cinema Package (Spire / Sensa)" },
                        { val: "mirrorless", label: "Mirrorless Camera Setup" },
                        { val: "none", label: "None (Digital Assets Only)" }
                      ].map(opt => (
                        <button
                          key={opt.val}
                          onClick={() => handleAnswerChange("gear", opt.val)}
                          className={`p-3 rounded-lg border text-xs font-medium text-left transition-all ${
                            answers.gear === opt.val
                              ? "bg-white text-black border-white font-semibold"
                              : "bg-black/25 border-white/5 text-zinc-400 hover:border-white/10 hover:text-white"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    onClick={finalizeBlueprint}
                    className="btn-primary flex items-center space-x-2 font-semibold hover:scale-[1.02] transition-transform"
                  >
                    <span>Finalize Work Packages & Project Scope</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Scoping Confidence Meter */}
              <div className="lg:col-span-4 flex flex-col space-y-4">
                <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] flex flex-col items-center justify-center text-center space-y-4">
                  <span className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
                    Scoping Confidence
                  </span>
                  
                  {/* Radial progress representation */}
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="rgba(255,255,255,0.03)"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke={confidence === 100 ? "#10b981" : "#f59e0b"}
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (251.2 * confidence) / 100}
                        className="transition-all duration-500 ease-out"
                      />
                    </svg>
                    <span className="absolute text-xl font-bold text-white font-mono">
                      {confidence}%
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-zinc-300">
                      {confidence === 100 ? "Ready to Dispatch" : "Scoping Incomplete"}
                    </span>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                      {confidence === 100 
                        ? "Perfect. Gaps resolved. All deliverables and roles map cleanly."
                        : "Complete the questions above to remove cost ambiguities and lock rates."}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: BLUEPRINT OUTPUT (WBS, Deliverables, Specs) */}
          {activeStep === "blueprint" && (
            <motion.div
              key="step-blueprint"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Output Header banner */}
              <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
                    Parsed Project Scoping Summary
                  </span>
                  <h3 className="text-lg font-bold text-white mt-0.5">{blueprint.title}</h3>
                  <p className="text-xs text-zinc-400 mt-1">Industry Focus: {blueprint.industry}</p>
                </div>

                <div className="flex flex-wrap gap-4 text-left border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                  <div className="px-3 py-1 bg-white/[0.03] border border-white/5 rounded-lg">
                    <span className="text-[9px] text-zinc-500 block uppercase font-medium">Estimated Scope Range</span>
                    <span className="text-sm font-bold text-white font-mono">{blueprint.budget}</span>
                  </div>
                  
                  <div className="px-3 py-1 bg-white/[0.03] border border-white/5 rounded-lg">
                    <span className="text-[9px] text-zinc-500 block uppercase font-medium">Total Project Effort</span>
                    <span className="text-sm font-bold text-white font-mono">{blueprint.hours}</span>
                  </div>

                  <div className="px-3 py-1 bg-white/[0.03] border border-white/5 rounded-lg">
                    <span className="text-[9px] text-zinc-500 block uppercase font-medium">Scoping Confidence</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">100%</span>
                  </div>
                </div>
              </div>

              {/* Tabs navigation */}
              <div className="border-b border-white/5 flex space-x-6 overflow-x-auto whitespace-nowrap scrollbar-none">
                {[
                  { id: "work-packages", label: "Work Packages", icon: Briefcase },
                  { id: "deliverables", label: "Parsed Deliverables", icon: FileText },
                  { id: "roles", label: "Required Roster Roles", icon: Sliders },
                  { id: "specs", label: "Technical Specs", icon: Wrench }
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setBlueprintTab(tab.id as any)}
                      className={`flex items-center space-x-1.5 pb-3.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                        blueprintTab === tab.id
                          ? "border-white text-white"
                          : "border-transparent text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab Panels */}
              <div className="min-h-[220px]">
                {/* Tab 1: Work Packages */}
                {blueprintTab === "work-packages" && (
                  <div className="space-y-4">
                    {blueprint.workPackages.map((phase, i) => (
                      <div key={i} className="rounded-xl border border-white/5 bg-black/20 p-4">
                        <h4 className="text-xs font-bold text-white tracking-wide uppercase mb-3 flex items-center space-x-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                          <span>{phase.phase}</span>
                        </h4>
                        
                        <div className="space-y-2">
                          {phase.tasks.map((task, j) => (
                            <div key={j} className="flex justify-between items-center bg-white/[0.02] hover:bg-white/[0.04] p-3 rounded-lg border border-white/5 transition-colors">
                              <span className="text-xs text-zinc-300 font-medium">{task.name}</span>
                              <div className="flex items-center space-x-3 text-xs text-zinc-500 font-mono">
                                <span className="px-2 py-0.5 rounded bg-white/5 text-zinc-400 text-[10px]">
                                  {task.role}
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3 text-zinc-600" />
                                  <span>{task.duration}</span>
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab 2: Deliverables */}
                {blueprintTab === "deliverables" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2 md:hidden">
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold">Deliverables List</span>
                      <span className="text-[10px] text-zinc-400 font-mono animate-pulse">Swipe to view →</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs text-zinc-400 min-w-[550px]">
                        <thead>
                          <tr className="border-b border-white/5 text-[10px] text-zinc-500 uppercase tracking-wider">
                            <th className="py-2.5 px-3">Deliverable Name</th>
                            <th className="py-2.5 px-3">Target Format</th>
                            <th className="py-2.5 px-3">Target Deadline</th>
                            <th className="py-2.5 px-3">Priority</th>
                          </tr>
                        </thead>
                        <tbody>
                          {blueprint.deliverables.map((del, index) => (
                            <tr key={index} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                              <td className="py-3 px-3 text-zinc-300 font-medium">{del.name}</td>
                              <td className="py-3 px-3 font-mono">{del.format}</td>
                              <td className="py-3 px-3">{del.deadline}</td>
                              <td className="py-3 px-3">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  del.priority === "Critical" 
                                    ? "bg-red-500/10 text-red-400" 
                                    : del.priority === "High" 
                                      ? "bg-amber-500/10 text-amber-400" 
                                      : "bg-blue-500/10 text-blue-400"
                                }`}>
                                  {del.priority}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tab 3: Required Roles */}
                {blueprintTab === "roles" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {blueprint.roles.map((role, index) => (
                      <div key={index} className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex flex-col justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-white">{role.name}</h4>
                          <span className="text-[10px] text-zinc-500 mt-0.5 block">Estimated effort allocation sequence: AI Estimate</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-4">
                          {role.skills.map((skill, sIdx) => (
                            <span key={sIdx} className="px-2 py-1 rounded bg-white/5 border border-white/5 text-[10px] text-zinc-400">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab 4: Technical Specs */}
                {blueprintTab === "specs" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Required Software Stack</h4>
                      <ul className="space-y-2 text-xs text-zinc-300">
                        {blueprint.specs.software.map((sw, i) => (
                          <li key={i} className="flex items-center space-x-2">
                            <CheckCircle className="w-3.5 h-3.5 text-zinc-500" />
                            <span>{sw}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Target Hardware & Equipment</h4>
                      <ul className="space-y-2 text-xs text-zinc-300">
                        {blueprint.specs.gear.map((g, i) => (
                          <li key={i} className="flex items-center space-x-2">
                            <CheckCircle className="w-3.5 h-3.5 text-zinc-500" />
                            <span>{g}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons to Transition to Matchmaking */}
              <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <span className="text-xs text-zinc-500 max-w-md">
                  This blueprint will pre-populate the crew matchmaking sliders and role requirements for <strong>3.8x faster matchmaking</strong> speed.
                </span>

                <div className="flex items-center space-x-3">
                  <a
                    href="/intelligence/crew-matchmaking"
                    className="btn-primary flex items-center space-x-1.5 font-semibold hover:scale-[1.02] transition-transform"
                  >
                    <span>Run AI Crew Matchmaking</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

      </div>
    </div>
  );
}
