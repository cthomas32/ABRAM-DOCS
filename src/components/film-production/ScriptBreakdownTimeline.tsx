"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  Layout, 
  Sparkles, 
  GitMerge, 
  Check, 
  FileText, 
  Loader2, 
  Users, 
  MapPin, 
  Package, 
  Shirt, 
  Film, 
  Car, 
  AlertTriangle,
  RotateCcw,
  Plus,
  ChevronRight
} from "lucide-react";

// Types for Step 1
interface MockFile {
  name: string;
  size: string;
  pages: number;
  type: string;
}

// Types for Step 3
interface SceneDetails {
  number: string;
  setting: string;
  length: string;
  synopsis: string;
  characters: string[];
  props: string[];
  wardrobe: string[];
  vfx: string[];
  vehicles: string[];
}

export default function ScriptBreakdownTimeline() {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);

  // ----------------------------------------------------
  // STEP 1: Ingestion State & Handlers
  // ----------------------------------------------------
  const mockFiles: MockFile[] = [
    { name: "vesper_passage_v4_draft.pdf", size: "14.2 MB", pages: 142, type: "PDF" },
    { name: "onyx_reign_pilot.docx", size: "6.4 MB", pages: 58, type: "DOCX" },
    { name: "nebula_outpost_revised.txt", size: "0.8 MB", pages: 110, type: "TXT" }
  ];
  const [selectedFile, setSelectedFile] = useState<MockFile | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "done">("idle");
  const [uploadMessage, setUploadMessage] = useState("");

  const handleSelectFile = (file: MockFile) => {
    setSelectedFile(file);
    setUploadStatus("uploading");
    setUploadProgress(0);
    setUploadMessage("Initiating document parser...");
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (uploadStatus === "uploading") {
      timer = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            setUploadStatus("done");
            setUploadMessage("Screenplay successfully ingested into workspace.");
            return 100;
          }
          const next = prev + 10;
          if (next === 30) setUploadMessage("Scanning characters and formatting structure...");
          if (next === 60) setUploadMessage(`Parsing ${selectedFile?.pages} script pages...`);
          if (next === 90) setUploadMessage("Reassembling structural elements...");
          return next;
        });
      }, 150);
    }
    return () => clearInterval(timer);
  }, [uploadStatus, selectedFile]);

  const handleResetStep1 = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadStatus("idle");
    setUploadMessage("");
  };

  // ----------------------------------------------------
  // STEP 2: Layout Reconstruction State
  // ----------------------------------------------------
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);
  const step2Lines = [
    {
      id: 1,
      raw: "EXT. DOCK 4 - NIGHT",
      parsed: "EXT. DOCK 4 - NIGHT",
      type: "Scene Header",
      desc: "Scene boundary. Automatically marked as Outdoor (EXT) & Night schedule block.",
      color: "border-blue-500/20 bg-blue-500/10 text-blue-400"
    },
    {
      id: 2,
      raw: "Leo checks his chronometer. Water laps against the concrete pylons.",
      parsed: "Leo checks his chronometer. Water laps against the concrete pylons.",
      type: "Action Block",
      desc: "Descriptive prose. Checked for props (chronometer), environment cues (water, concrete).",
      color: "border-zinc-500/20 bg-zinc-500/5 text-zinc-300"
    },
    {
      id: 3,
      raw: "               MAYA",
      parsed: "MAYA",
      type: "Character Name",
      desc: "Centered element detected (3.5-inch left margin). Evaluated as Character Dialogue cue.",
      color: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
    },
    {
      id: 4,
      raw: "          (whispering)",
      parsed: "(whispering)",
      type: "Parenthetical",
      desc: "Paren-enclosed block indicating tone. Mapped under active Character context.",
      color: "border-purple-500/20 bg-purple-500/10 text-purple-400"
    },
    {
      id: 5,
      raw: "     We have three minutes. The guards\n     are shifting to the west gate.",
      parsed: "We have three minutes. The guards are shifting to the west gate.",
      type: "Dialogue",
      desc: "Spoken line. Linked to Character 'Maya'. Added to estimated scene run duration.",
      color: "border-amber-500/20 bg-amber-500/10 text-amber-300"
    }
  ];

  // ----------------------------------------------------
  // STEP 3: Scene & Element Extraction State
  // ----------------------------------------------------
  const [selectedScene, setSelectedScene] = useState<"12" | "13" | "14">("12");
  const [activeCategory, setActiveCategory] = useState<"all" | "cast" | "props" | "vfx" | "wardrobe">("all");
  
  const sceneData: Record<"12" | "13" | "14", SceneDetails> = {
    "12": {
      number: "12",
      setting: "INT. CONTROL TOWER - NIGHT",
      length: "1 4/8 pages",
      synopsis: "Leo overrides the terminal lockdown while security forces sweep the lower deck.",
      characters: ["Leo Vance", "Security Guards"],
      props: ["Terminal Console", "Security Badge", "Screwdriver"],
      wardrobe: ["Security Uniform", "Leather Jacket"],
      vfx: ["Terminal Screen Hack", "Sparking Wire SFX"],
      vehicles: []
    },
    "13": {
      number: "13",
      setting: "EXT. RUNWAY - NIGHT",
      length: "2 2/8 pages",
      synopsis: "Maya hotwires the armored transport as searchlights sweep the tarmac.",
      characters: ["Maya Lin", "Spotlight Operator"],
      props: ["Wiring Harness", "Flashlight"],
      wardrobe: ["Tactical Vest", "Goggles"],
      vfx: ["Searchlight Beam", "Rain simulation"],
      vehicles: ["Armored Transport Vessel"]
    },
    "14": {
      number: "14",
      setting: "INT. TRANSPORT CABIN - NIGHT",
      length: "6/8 pages",
      synopsis: "Escape sequence. Leo and Maya seal the pressure door as bullets graze the exterior hull.",
      characters: ["Leo Vance", "Maya Lin"],
      props: ["Pressure Door Lever", "Armored Ledger"],
      wardrobe: ["Leather Jacket", "Tactical Vest"],
      vfx: ["Sparks", "Muzzle flash reflections", "Bullet impacts"],
      vehicles: ["Armored Transport Vessel"]
    }
  };

  // ----------------------------------------------------
  // STEP 4: Conflict Resolution State
  // ----------------------------------------------------
  const [resolvedCharacter, setResolvedCharacter] = useState(false);
  const [resolvedScene, setResolvedScene] = useState(false);
  const [sceneAction, setSceneAction] = useState<"overwrite" | "split" | "keep">("split");

  const handleResetStep4 = () => {
    setResolvedCharacter(false);
    setResolvedScene(false);
    setSceneAction("split");
  };

  const stepsList = [
    { number: 1, title: "Document Ingestion", icon: Upload, subtitle: "Screenplay parsing intake" },
    { number: 2, title: "Layout Reconstruction", icon: Layout, subtitle: "Formatting & alignment cues" },
    { number: 3, title: "Scene & Element Extraction", icon: Sparkles, subtitle: "AI tag classification" },
    { number: 4, title: "Smart Merging", icon: GitMerge, subtitle: "Reconciling duplicate conflicts" }
  ];

  return (
    <div className="w-full space-y-8 select-none">
      
      {/* 4-Step Interactive Timeline Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-zinc-950/40 p-2.5 rounded-2xl border border-white/5 backdrop-blur-md">
        {stepsList.map((step) => {
          const Icon = step.icon;
          const isActive = activeStep === step.number;
          return (
            <button
              key={step.number}
              onClick={() => setActiveStep(step.number as 1 | 2 | 3 | 4)}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer min-h-[56px] ${
                isActive 
                  ? "bg-white/[0.04] border-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.02)]" 
                  : "bg-transparent border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.01]"
              }`}
            >
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition-all duration-200 ${
                isActive 
                  ? "bg-white text-zinc-950 border-white" 
                  : "bg-zinc-900 border-white/5 text-zinc-400"
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="hidden sm:block overflow-hidden">
                <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-500 block leading-none mb-1">
                  Step 0{step.number}
                </div>
                <div className="text-xs font-semibold truncate leading-tight">
                  {step.title}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Interactive Sandbox Window */}
      <div className="rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-xl p-4 sm:p-6 lg:p-8 relative min-h-[460px] flex flex-col justify-between overflow-visible">
        
        {/* Glow Element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[650px] h-[320px] bg-[#8ECAFF]/[0.015] rounded-full filter blur-[100px] pointer-events-none -z-10" />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1"
          >
            {/* ----------------------------------------------------
                STEP 1: Document Ingestion Content
                ---------------------------------------------------- */}
            {activeStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold tracking-tight text-zinc-50 font-sans mb-1">
                    Step 1: Simple Document Ingestion
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans max-w-2xl">
                    Import screenplay PDF, DOCX, DOC, or TXT formats (up to 20MB, max 180 pages). The engine parses documents directly, identifying metadata structures cleanly.
                  </p>
                </div>

                {uploadStatus === "idle" ? (
                  <div className="space-y-4">
                    <span className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase font-sans block mb-1">
                      Select a Sandbox Screenplay to Parse
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {mockFiles.map((file) => (
                        <button
                          key={file.name}
                          onClick={() => handleSelectFile(file)}
                          className="w-full text-left p-4 rounded-xl border border-white/5 bg-zinc-900/10 hover:bg-zinc-900/30 hover:border-white/10 transition-all duration-200 flex flex-col justify-between cursor-pointer group min-h-[140px]"
                        >
                          <div className="w-8 h-8 rounded bg-zinc-900 border border-white/5 flex items-center justify-center shrink-0 mb-3 group-hover:border-white/10 transition-colors">
                            <FileText className="w-4 h-4 text-zinc-400 group-hover:text-[#8ECAFF] transition-colors" />
                          </div>
                          <div className="min-w-0 flex-1 flex flex-col justify-end">
                            <div className="text-xs font-semibold text-zinc-300 truncate group-hover:text-white transition-colors">
                              {file.name}
                            </div>
                            <div className="text-[10px] text-zinc-500 mt-1">
                              {file.type} • {file.pages} pages • {file.size}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="max-w-xl mx-auto py-8">
                    <div className="p-6 rounded-xl border border-white/5 bg-zinc-950/80 space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-zinc-900 border border-white/5 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-[#8ECAFF]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-zinc-200 truncate">
                            {selectedFile?.name}
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            {selectedFile?.type} • {selectedFile?.pages} pages
                          </div>
                        </div>
                        {uploadStatus === "done" && (
                          <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] text-zinc-500">
                          <span>{uploadMessage}</span>
                          <span className="font-mono">{uploadProgress}%</span>
                        </div>
                        <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-white"
                            initial={{ width: "0%" }}
                            animate={{ width: `${uploadProgress}%` }}
                            transition={{ duration: 0.1 }}
                          />
                        </div>
                      </div>

                      {uploadStatus === "done" && (
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-[10px] text-zinc-400">
                            Structure reconstructed and ready.
                          </span>
                          <button
                            onClick={handleResetStep1}
                            className="btn-ghost !px-3 !py-1 text-[10px] flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reset Upload</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ----------------------------------------------------
                STEP 2: Intelligent Layout Reconstruction
                ---------------------------------------------------- */}
            {activeStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold tracking-tight text-zinc-50 font-sans mb-1">
                    Step 2: Intelligent Layout Reconstruction
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans max-w-2xl">
                    Analyzing page indentations, alignment metrics, and formatting parameters to isolate Scene Headers, Action blocks, Character tags, and Dialogue. Hover over any script element to visualize how the reconstruction engine classifies it.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  
                  {/* Left Column: Screenplay Viewer */}
                  <div className="lg:col-span-6 flex flex-col p-4 rounded-xl border border-white/5 bg-zinc-950/60 min-h-[260px] justify-between">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3 text-[10px] text-zinc-500 font-sans">
                      <span className="font-mono">RAW SCREENPLAY (COURIER INDENTATION)</span>
                      <span>PAGE 12</span>
                    </div>

                    <div className="font-mono text-xs text-zinc-300 leading-relaxed flex-1 space-y-4 py-2">
                      {step2Lines.map((line) => (
                        <div
                          key={line.id}
                          onMouseEnter={() => setHoveredLine(line.id)}
                          onMouseLeave={() => setHoveredLine(null)}
                          className={`p-1.5 rounded transition-all duration-200 cursor-help ${
                            hoveredLine === line.id 
                              ? "bg-white/[0.04] text-white" 
                              : "hover:bg-white/[0.01]"
                          }`}
                        >
                          <pre className="whitespace-pre-wrap font-mono text-[11px] sm:text-xs">
                            {line.raw}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Classification Engine */}
                  <div className="lg:col-span-6 flex flex-col p-4 rounded-xl border border-white/5 bg-zinc-900/10 min-h-[260px]">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-4 text-[10px] text-zinc-500 font-sans">
                      <span>CLASSIFICATION MATRIX</span>
                      <span>HOVER AN ELEMENT TO DECODE</span>
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                      <AnimatePresence mode="wait">
                        {hoveredLine === null ? (
                          <motion.div
                            key="layout-idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/5 rounded-lg bg-zinc-950/20 h-full"
                          >
                            <Layout className="w-7 h-7 text-zinc-500 mb-2 animate-pulse" />
                            <p className="text-xs text-zinc-300 font-sans mb-1 font-semibold">
                              Interactive Analysis Mode
                            </p>
                            <p className="text-[10px] text-zinc-500 font-sans max-w-[240px]">
                              Hover over any lines of text in the screenplay editor on the left to see how the engine extracts structures.
                            </p>
                          </motion.div>
                        ) : (
                          <motion.div
                            key={`layout-active-${hoveredLine}`}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4 h-full flex flex-col justify-between"
                          >
                            {step2Lines.map((line) => {
                              if (line.id !== hoveredLine) return null;
                              return (
                                <div key={line.id} className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
                                      Detected Node
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${line.color}`}>
                                      {line.type}
                                    </span>
                                  </div>

                                  <div className="p-3.5 rounded-lg bg-zinc-950 border border-white/5 font-mono text-xs text-white">
                                    {line.parsed}
                                  </div>

                                  <div className="space-y-2">
                                    <span className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase block">
                                      Parser Rule
                                    </span>
                                    <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                                      {line.desc}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}

                            <div className="p-2 border border-emerald-500/10 bg-emerald-500/[0.02] text-emerald-400/90 rounded text-[10px] font-sans flex items-center gap-1.5 mt-auto">
                              <Check className="w-3.5 h-3.5 shrink-0" />
                              <span>100% confidence rating matches industrial script standards.</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* ----------------------------------------------------
                STEP 3: Scene & Element Extraction
                ---------------------------------------------------- */}
            {activeStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold tracking-tight text-zinc-50 font-sans mb-1">
                    Step 3: Scene & Element Extraction
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans max-w-2xl">
                    Parsing script scenes to classify key production variables: scene lengths, locations, actors, equipment, props, wardrobe, VFX details, and transport vehicles.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  
                  {/* Left Column: Scene Selector */}
                  <div className="lg:col-span-4 flex flex-col gap-2">
                    <span className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase font-sans mb-1">
                      Select Scene
                    </span>
                    {(["12", "13", "14"] as const).map((scNum) => {
                      const isActive = selectedScene === scNum;
                      const details = sceneData[scNum];
                      return (
                        <button
                          key={scNum}
                          onClick={() => setSelectedScene(scNum)}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${
                            isActive 
                              ? "bg-white/[0.04] border-white/10 text-white shadow-sm" 
                              : "bg-zinc-900/10 border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/20"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-semibold font-sans mb-0.5">
                              Scene {details.number}
                            </div>
                            <div className="text-[10px] font-mono truncate text-zinc-500">
                              {details.setting}
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-400 shrink-0 ml-2">
                            {details.length}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Right Column: Extracted Element Tags */}
                  <div className="lg:col-span-8 flex flex-col p-4 rounded-xl border border-white/5 bg-zinc-950/60 justify-between">
                    <div>
                      {/* Sub-header details */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3 mb-4">
                        <div>
                          <div className="text-xs font-semibold text-zinc-200 font-sans">
                            {sceneData[selectedScene].setting}
                          </div>
                          <div className="text-[10px] text-zinc-500 mt-0.5">
                            {sceneData[selectedScene].synopsis}
                          </div>
                        </div>
                      </div>

                      {/* Category Filter Pills */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {(["all", "cast", "props", "vfx", "wardrobe"] as const).map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-3 py-2.5 md:py-1 rounded-full text-[10px] font-medium tracking-wide uppercase transition-all duration-200 cursor-pointer min-h-[44px] md:min-h-0 flex items-center justify-center ${
                              activeCategory === cat 
                                ? "bg-white text-zinc-950 font-semibold" 
                                : "bg-white/[0.03] border border-white/5 text-zinc-400 hover:text-zinc-200"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      {/* Render Extracted Categories */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Cast */}
                        {(activeCategory === "all" || activeCategory === "cast") && sceneData[selectedScene].characters.length > 0 && (
                          <div className="p-3 rounded-lg border border-white/5 bg-zinc-900/10 flex items-start gap-2.5">
                            <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                              <div className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                                Characters
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {sceneData[selectedScene].characters.map((char) => (
                                  <span key={char} className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
                                    {char}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Props */}
                        {(activeCategory === "all" || activeCategory === "props") && sceneData[selectedScene].props.length > 0 && (
                          <div className="p-3 rounded-lg border border-white/5 bg-zinc-900/10 flex items-start gap-2.5">
                            <Package className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <div className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                                Props
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {sceneData[selectedScene].props.map((prop) => (
                                  <span key={prop} className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/10">
                                    {prop}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Wardrobe */}
                        {(activeCategory === "all" || activeCategory === "wardrobe") && sceneData[selectedScene].wardrobe.length > 0 && (
                          <div className="p-3 rounded-lg border border-white/5 bg-zinc-900/10 flex items-start gap-2.5">
                            <Shirt className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                            <div>
                              <div className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                                Wardrobe
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {sceneData[selectedScene].wardrobe.map((item) => (
                                  <span key={item} className="text-[10px] font-medium px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/10">
                                    {item}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* VFX */}
                        {(activeCategory === "all" || activeCategory === "vfx") && sceneData[selectedScene].vfx.length > 0 && (
                          <div className="p-3 rounded-lg border border-white/5 bg-zinc-900/10 flex items-start gap-2.5">
                            <Film className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                            <div>
                              <div className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                                VFX/SFX
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {sceneData[selectedScene].vfx.map((item) => (
                                  <span key={item} className="text-[10px] font-medium px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/10">
                                    {item}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Vehicles */}
                        {activeCategory === "all" && sceneData[selectedScene].vehicles.length > 0 && (
                          <div className="p-3 rounded-lg border border-white/5 bg-zinc-900/10 flex items-start gap-2.5 sm:col-span-2">
                            <Car className="w-3.5 h-3.5 text-[#8ECAFF] shrink-0 mt-0.5" />
                            <div>
                              <div className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                                Vehicles
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {sceneData[selectedScene].vehicles.map((item) => (
                                  <span key={item} className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#8ECAFF]/10 text-[#8ECAFF] border border-[#8ECAFF]/10">
                                    {item}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-[10px] text-zinc-500 pt-4 border-t border-white/5 mt-4 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#8ECAFF]" />
                      <span>Extracted values are cross-checked with project breakdown catalog records.</span>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* ----------------------------------------------------
                STEP 4: Smart Conflict Resolution & Merging
                ---------------------------------------------------- */}
            {activeStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold tracking-tight text-zinc-50 font-sans mb-1">
                    Step 4: Smart Conflict Resolution & Merging
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans max-w-2xl">
                    Reconciling duplicate character profiles and resolving page revisions. If there are new scenes or duplicate scene indices, decide whether to overwrite, split, or ignore edits.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Conflict 1: Character Conflict */}
                  <div className="p-4 rounded-xl border border-white/5 bg-zinc-950/60 space-y-4 flex flex-col justify-between min-h-[220px]">
                    <div>
                      <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                        <span className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
                          Conflict #1: Character Alias
                        </span>
                        {!resolvedCharacter ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" /> Needs Review
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> Resolved
                          </span>
                        )}
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                          The parser detected duplicate identifiers pointing to similar actors:
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                          <div className="p-2 rounded bg-zinc-900 border border-white/5">
                            <span className="text-[9px] text-zinc-500 uppercase block">Name 1 (14 scenes)</span>
                            <span className="text-zinc-200">LEO VANCE</span>
                          </div>
                          <div className="p-2 rounded bg-zinc-900 border border-white/5">
                            <span className="text-[9px] text-zinc-500 uppercase block">Name 2 (2 scenes)</span>
                            <span className="text-zinc-200">LEO</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {!resolvedCharacter ? (
                      <button
                        onClick={() => setResolvedCharacter(true)}
                        className="btn-primary w-full text-xs min-h-[44px] md:min-h-0 flex items-center justify-center"
                      >
                        Merge into single identity "Leo Vance"
                      </button>
                    ) : (
                      <div className="p-2 bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-[10px] rounded-lg text-center">
                        Aliases consolidated successfully.
                      </div>
                    )}
                  </div>

                  {/* Conflict 2: Duplicate Scene Number */}
                  <div className="p-4 rounded-xl border border-white/5 bg-zinc-950/60 space-y-4 flex flex-col justify-between min-h-[220px]">
                    <div>
                      <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                        <span className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
                          Conflict #2: Page Revision Collision
                        </span>
                        {!resolvedScene ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" /> Collision Detected
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> Resolved
                          </span>
                        )}
                      </div>

                      <div className="space-y-3">
                        <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                          Scene 12 already exists. A newly uploaded script page contains modifications for Scene 12.
                        </p>
                        
                        <div className="flex gap-2">
                          {(["overwrite", "split", "keep"] as const).map((opt) => (
                            <button
                              key={opt}
                              onClick={() => setSceneAction(opt)}
                              disabled={resolvedScene}
                              className={`flex-1 px-2.5 py-2.5 md:py-1.5 rounded-lg border text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer min-h-[44px] md:min-h-0 flex items-center justify-center ${
                                sceneAction === opt 
                                  ? "bg-white text-zinc-950 border-white" 
                                  : "bg-zinc-900 border-white/5 text-zinc-400 hover:text-zinc-200 disabled:opacity-50"
                              }`}
                            >
                              {opt === "overwrite" ? "Overwrite" : opt === "split" ? "Split as 12A" : "Ignore Revision"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {!resolvedScene ? (
                      <button
                        onClick={() => setResolvedScene(true)}
                        className="btn-primary w-full text-xs min-h-[44px] md:min-h-0 flex items-center justify-center"
                      >
                        Apply "{sceneAction === "overwrite" ? "Overwrite" : sceneAction === "split" ? "Split as Scene 12A" : "Keep Original"}" Resolution
                      </button>
                    ) : (
                      <div className="p-2 bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-[10px] rounded-lg text-center">
                        Resolution applied successfully: {sceneAction === "overwrite" ? "Overwritten" : sceneAction === "split" ? "Split into 12A" : "Original preserved"}.
                      </div>
                    )}
                  </div>

                </div>

                {resolvedCharacter && resolvedScene && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <span className="text-xs font-semibold text-emerald-400">
                        All conflicts resolved. Ready to synchronize with the scheduling board!
                      </span>
                    </div>
                    <button
                      onClick={handleResetStep4}
                      className="btn-ghost !px-3 !py-1 text-[10px] flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Conflict Simulation</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer info & direction buttons */}
        <div className="mt-8 border-t border-white/5 pt-4 flex items-center justify-between gap-4 font-sans">
          <span className="text-[10px] text-zinc-500">
            Interactive breakdown flow demonstration.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveStep((prev) => (prev > 1 ? (prev - 1) as 1 | 2 | 3 | 4 : 1))}
              disabled={activeStep === 1}
              className="btn-ghost text-[10px] !px-3 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer min-h-[44px] md:min-h-0 flex items-center justify-center"
            >
              Previous Step
            </button>
            <button
              onClick={() => setActiveStep((prev) => (prev < 4 ? (prev + 1) as 1 | 2 | 3 | 4 : 4))}
              disabled={activeStep === 4}
              className="btn-glass text-[10px] !px-3 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1 min-h-[44px] md:min-h-0"
            >
              <span>Next Step</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
