"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  FileText, 
  Layers, 
  DollarSign, 
  Users, 
  Calendar, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Settings,
  FileCheck,
  ChevronRight
} from "lucide-react";

type FormTemplate = "video-campaign" | "brand-identity" | "social-bundle";

interface ScopedResult {
  deliverables: { name: string; complexity: string; qty: number }[];
  roles: { title: string; suitability: number; estHours: number }[];
  estimatedCost: number;
  timelineDays: number;
  milestones: { name: string; targetDay: number }[];
}

export default function AgencyIntakeMockup() {
  const [template, setTemplate] = useState<FormTemplate>("video-campaign");
  const [projectName, setProjectName] = useState("Helix Brand Reinvigoration");
  const [briefText, setBriefText] = useState(
    "A high-energy social campaign targeting Gen Z creators with 3D product reels, short-form lifestyle videos, and digital style guides. Deliverables must be optimized for multi-platform distribution within a 3-week window."
  );
  const [budgetCap, setBudgetCap] = useState(25000);
  const [isScoping, setIsScoping] = useState(false);
  const [scopingStep, setScopingStep] = useState(0);
  const [scopedOutput, setScopedOutput] = useState<ScopedResult | null>(null);
  const [isApproved, setIsApproved] = useState(false);

  const scopingSteps = [
    "Analyzing creative brief text...",
    "Extracting explicit & implicit deliverables...",
    "Calculating resource capacity & optimal roles...",
    "Drafting production milestones & budget allocations..."
  ];

  const handleTemplateChange = (type: FormTemplate) => {
    setTemplate(type);
    setIsApproved(false);
    setScopedOutput(null);
    if (type === "video-campaign") {
      setProjectName("Helix Brand Reinvigoration");
      setBriefText("A high-energy social campaign targeting Gen Z creators with 3D product reels, short-form lifestyle videos, and digital style guides. Deliverables must be optimized for multi-platform distribution within a 3-week window.");
      setBudgetCap(25000);
    } else if (type === "brand-identity") {
      setProjectName("Onyx Studio Rebrand");
      setBriefText("Full brand identity redesign for a premium coffee brand. Needs a new vector logo mark, typographic guidelines, digital brand deck, custom product packaging templates, and design assets for web storefront rollout.");
      setBudgetCap(18000);
    } else {
      setProjectName("Sensa App Social Launch");
      setBriefText("Multi-channel digital assets rollout. Includes 5 custom graphics templates for social posts, 2 short-form animated UI walkthrough videos, and copy draft versions for newsletter announcements and social captions.");
      setBudgetCap(12000);
    }
  };

  const handleRunScoping = () => {
    setIsScoping(true);
    setScopingStep(0);
    setIsApproved(false);
    
    // Simulate scoping steps
    const stepInterval = setInterval(() => {
      setScopingStep((prev) => {
        if (prev >= scopingSteps.length - 1) {
          clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 400);

    setTimeout(() => {
      let result: ScopedResult;
      
      if (template === "video-campaign") {
        result = {
          deliverables: [
            { name: "3D Product Video Reel", complexity: "High", qty: 2 },
            { name: "Lifestyle Video Cutdowns", complexity: "Medium", qty: 3 },
            { name: "Digital Campaign Style Guide", complexity: "Low", qty: 1 }
          ],
          roles: [
            { title: "3D Motion Designer", suitability: 98, estHours: 45 },
            { title: "Creative Director", suitability: 95, estHours: 15 },
            { title: "Video Editor", suitability: 92, estHours: 30 }
          ],
          estimatedCost: 19800,
          timelineDays: 18,
          milestones: [
            { name: "Concept Deck & Storyboards Approved", targetDay: 3 },
            { name: "3D Animatic & Editor Draft V1", targetDay: 10 },
            { name: "Final Renders & Social Hand-off", targetDay: 17 }
          ]
        };
      } else if (template === "brand-identity") {
        result = {
          deliverables: [
            { name: "Vector Logo & Style Book", complexity: "High", qty: 1 },
            { name: "Storefront Packaging Layouts", complexity: "Medium", qty: 4 },
            { name: "Digital Asset Guidelines Deck", complexity: "Medium", qty: 1 }
          ],
          roles: [
            { title: "Brand Identity Designer", suitability: 99, estHours: 40 },
            { title: "Art Director", suitability: 96, estHours: 12 },
            { title: "Copywriter", suitability: 88, estHours: 10 }
          ],
          estimatedCost: 14500,
          timelineDays: 14,
          milestones: [
            { name: "Logo Concept Selection Round 1", targetDay: 4 },
            { name: "Brand Book Draft & Packaging Approvals", targetDay: 9 },
            { name: "Style Guide PDF & Asset Archive Handover", targetDay: 14 }
          ]
        };
      } else {
        result = {
          deliverables: [
            { name: "Social Templates (Figma)", complexity: "Low", qty: 5 },
            { name: "UI Animated Explainer", complexity: "Medium", qty: 2 },
            { name: "Social Copy Framework Doc", complexity: "Low", qty: 1 }
          ],
          roles: [
            { title: "Social Content Designer", suitability: 94, estHours: 20 },
            { title: "Motion Designer", suitability: 90, estHours: 16 },
            { title: "Creative Copywriter", suitability: 96, estHours: 8 }
          ],
          estimatedCost: 8800,
          timelineDays: 9,
          milestones: [
            { name: "Design & Copy Templates Round 1", targetDay: 3 },
            { name: "Animated Explainer V1 Review", targetDay: 6 },
            { name: "Asset Bundle ZIP Export", targetDay: 9 }
          ]
        };
      }

      setScopedOutput(result);
      setIsScoping(false);
    }, 1700);
  };

  const handleApprove = () => {
    setIsApproved(true);
  };

  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl border border-white/5 bg-zinc-950/40 p-4 sm:p-6 lg:p-8 backdrop-blur-xl relative overflow-visible">
      {/* Background glow avoiding container clipping */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[300px] bg-zinc-800/[0.015] rounded-full filter blur-[80px] pointer-events-none -z-10" />

      {/* Templates Selector */}
      <div className="flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none pb-4 border-b border-white/5 mb-6">
        <button
          onClick={() => handleTemplateChange("video-campaign")}
          className={`px-4 rounded-full text-xs font-semibold cursor-pointer transition-all duration-200 min-h-[44px] flex items-center justify-center ${
            template === "video-campaign"
              ? "bg-white text-black"
              : "bg-white/5 text-zinc-400 hover:text-zinc-200 border border-white/5"
          }`}
        >
          Video Campaign Form
        </button>
        <button
          onClick={() => handleTemplateChange("brand-identity")}
          className={`px-4 rounded-full text-xs font-semibold cursor-pointer transition-all duration-200 min-h-[44px] flex items-center justify-center ${
            template === "brand-identity"
              ? "bg-white text-black"
              : "bg-white/5 text-zinc-400 hover:text-zinc-200 border border-white/5"
          }`}
        >
          Brand Identity Form
        </button>
        <button
          onClick={() => handleTemplateChange("social-bundle")}
          className={`px-4 rounded-full text-xs font-semibold cursor-pointer transition-all duration-200 min-h-[44px] flex items-center justify-center ${
            template === "social-bundle"
              ? "bg-white text-black"
              : "bg-white/5 text-zinc-400 hover:text-zinc-200 border border-white/5"
          }`}
        >
          Social Content Bundle
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Column: Form Builder View */}
        <div className="lg:col-span-6 flex flex-col justify-between rounded-xl border border-white/5 bg-zinc-950/80 p-5 shadow-inner">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="font-mono text-[10px] tracking-widest text-zinc-400 font-semibold uppercase flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5" /> Client Portal View
              </span>
              <span className="text-[10px] text-zinc-500 bg-white/5 px-2 py-0.5 rounded">
                Draft
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase text-zinc-400 block font-mono">Project Name</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full bg-zinc-900 border border-white/5 rounded-lg px-3.5 py-2 text-xs text-white outline-none focus:border-white/10 min-h-[44px]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase text-zinc-400 block font-mono">Creative Brief Details</label>
              <textarea
                value={briefText}
                onChange={(e) => setBriefText(e.target.value)}
                rows={5}
                className="w-full bg-zinc-900 border border-white/5 rounded-lg px-3.5 py-2.5 text-xs text-white outline-none focus:border-white/10 resize-none leading-relaxed"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-semibold uppercase text-zinc-400 font-mono">
                <span>Target Budget Cap</span>
                <span className="text-white">${budgetCap.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={5000}
                max={50000}
                step={1000}
                value={budgetCap}
                onChange={(e) => setBudgetCap(Number(e.target.value))}
                className="w-full accent-white bg-zinc-900 h-1.5 rounded-lg appearance-none cursor-pointer py-3"
              />
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={handleRunScoping}
              disabled={isScoping}
              className="btn-primary w-full min-h-[44px] text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              {isScoping ? (
                <>
                  <span className="h-3 w-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Generating Scope Blueprint...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-black" />
                  Run AI Brief Scoper
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: AI Output Blueprint */}
        <div className="lg:col-span-6 flex flex-col rounded-xl border border-white/5 bg-zinc-950/20 p-5 relative overflow-hidden justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="font-mono text-[10px] tracking-widest text-zinc-400 font-semibold uppercase flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Scope Blueprint
              </span>
              {scopedOutput && (
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                  Calculated
                </span>
              )}
            </div>

            {/* In-progress state */}
            {isScoping && (
              <div className="h-64 flex flex-col items-center justify-center text-center space-y-4">
                <span className="h-6 w-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <div className="space-y-1">
                  <p className="text-xs text-white font-semibold font-mono">Scoping Engine Running</p>
                  <p className="text-[10px] text-zinc-500 animate-pulse">{scopingSteps[scopingStep]}</p>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!isScoping && !scopedOutput && (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/5 rounded-lg bg-zinc-950/20">
                <Sparkles className="w-8 h-8 text-zinc-600 mb-3 animate-pulse" />
                <p className="text-xs font-semibold text-zinc-300 font-sans mb-1">Scope Engine Ready</p>
                <p className="text-[11px] text-zinc-500 leading-normal max-w-xs">
                  Submit the intake parameters on the left to extract deliverables, assign matched crew, and structure milestones automatically.
                </p>
              </div>
            )}

            {/* Content Output State */}
            {!isScoping && scopedOutput && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Financials & Timeline Meta */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg border border-white/5 bg-zinc-950/40 space-y-1">
                      <span className="text-[9px] uppercase tracking-wider font-mono text-zinc-500 block">Est. Scoped Cost</span>
                      <span className="text-sm font-semibold text-white font-mono flex items-center">
                        <DollarSign className="w-3.5 h-3.5 text-zinc-500 mr-0.5" />
                        {scopedOutput.estimatedCost.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg border border-white/5 bg-zinc-950/40 space-y-1">
                      <span className="text-[9px] uppercase tracking-wider font-mono text-zinc-500 block">Duration Target</span>
                      <span className="text-sm font-semibold text-zinc-300 font-mono flex items-center">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500 mr-1" />
                        {scopedOutput.timelineDays} Days
                      </span>
                    </div>
                  </div>

                  {/* Extracted Deliverables */}
                  <div className="space-y-2">
                    <span className="text-[9px] uppercase font-mono tracking-wider text-zinc-500 block">Extracted Deliverables</span>
                    <div className="space-y-1.5 text-xs">
                      {scopedOutput.deliverables.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded bg-zinc-950/60 border border-white/5 gap-2 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <Layers className="w-3 h-3 text-zinc-500 shrink-0" />
                            <span className="text-zinc-200 truncate">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 border border-white/5 text-zinc-400 font-mono uppercase">
                              {item.complexity}
                            </span>
                            <span className="text-white font-mono font-semibold">x{item.qty}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Required Crew Matches */}
                  <div className="space-y-2">
                    <span className="text-[9px] uppercase font-mono tracking-wider text-zinc-500 block">AI Crew Matchmaking Matches</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      {scopedOutput.roles.map((role, idx) => (
                        <div key={idx} className="p-2.5 rounded bg-zinc-950/40 border border-white/5 flex flex-col justify-between">
                          <span className="text-zinc-300 font-semibold truncate block mb-1">{role.title}</span>
                          <div className="flex justify-between items-center text-[9px] font-mono mt-1 border-t border-white/5 pt-1">
                            <span className="text-zinc-500">{role.estHours}h allocated</span>
                            <span className="text-emerald-400 font-semibold">{role.suitability}% Match</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Milestones Timeline */}
                  <div className="space-y-2">
                    <span className="text-[9px] uppercase font-mono tracking-wider text-zinc-500 block">Structured Milestone Targets</span>
                    <div className="space-y-1 text-xs">
                      {scopedOutput.milestones.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-1.5 text-zinc-400 border-l border-white/10 pl-3 ml-2 min-w-0">
                          <span className="truncate mr-2">{item.name}</span>
                          <span className="text-[9px] font-mono text-zinc-500 font-semibold shrink-0">Day {item.targetDay}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {scopedOutput && !isScoping && (
            <div className="pt-6 border-t border-white/5 mt-6">
              {isApproved ? (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center gap-2 text-emerald-400 text-xs min-h-[44px]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-semibold font-mono text-[10px] uppercase tracking-wider">Project Scoped & Pushed to Crew Roster</span>
                </div>
              ) : (
                <button
                  onClick={handleApprove}
                  className="btn-glass w-full min-h-[44px] text-xs flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Approve Blueprint & Allocate Resources</span>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
