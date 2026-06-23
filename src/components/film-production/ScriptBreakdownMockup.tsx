"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  RotateCcw, 
  FileText, 
  MapPin, 
  Users, 
  Package, 
  Shirt, 
  CheckCircle2, 
  Loader2 
} from "lucide-react";

export default function ScriptBreakdownMockup() {
  const [status, setStatus] = useState<"idle" | "parsing" | "complete">("idle");
  const [parsingStep, setParsingStep] = useState(0);

  const parsingStatusTexts = [
    "Analyzing scene headers & structure...",
    "Scanning for character introductions...",
    "Correlating props and wardrobe items...",
    "Finalizing structural breakdown tags..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === "parsing") {
      setParsingStep(0);
      interval = setInterval(() => {
        setParsingStep((prev) => {
          if (prev >= parsingStatusTexts.length - 1) {
            clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, 300);
    }
    return () => clearInterval(interval);
  }, [status]);

  const handleRunBreakdown = () => {
    setStatus("parsing");
    setTimeout(() => {
      setStatus("complete");
    }, 1250);
  };

  const handleReset = () => {
    setStatus("idle");
  };

  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl border border-white/5 bg-zinc-950/40 p-4 sm:p-6 lg:p-8 backdrop-blur-xl relative overflow-visible">
      {/* Decorative background glow for the card context (avoiding clipping on container) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[300px] bg-[#8ECAFF]/[0.015] rounded-full filter blur-[80px] pointer-events-none -z-10" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: Screenplay view (Courier format) */}
        <div className="lg:col-span-7 flex flex-col min-h-[380px] rounded-xl border border-white/5 bg-zinc-950/80 p-5 relative overflow-hidden shadow-inner select-none">
          {/* Editor Header */}
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4 text-xs text-zinc-500 font-sans">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              <span className="font-mono text-zinc-400">scene_12_breakdown.fdx</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] tracking-wide text-zinc-500">
              <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-white/5">Courier 12pt</span>
              <span>SCENE 12</span>
            </div>
          </div>

          {/* Screenplay Content */}
          <div className="flex-1 relative overflow-y-auto pr-1">
            <div className={`font-mono text-xs sm:text-sm leading-relaxed transition-all duration-300 ${status === "parsing" ? "text-zinc-500 opacity-60" : "text-zinc-300"}`}>
              <div className="mb-4 text-zinc-400 font-semibold tracking-wider">SCENE 12</div>
              
              <div className="mb-4">
                {status === "complete" ? (
                  <motion.span 
                    initial={{ backgroundColor: "rgba(59, 130, 246, 0)" }}
                    animate={{ backgroundColor: "rgba(59, 130, 246, 0.12)", color: "#8ECAFF" }}
                    className="px-1.5 py-0.5 rounded border border-blue-500/25 font-bold"
                  >
                    INT. LIVING ROOM - DAY
                  </motion.span>
                ) : (
                  <span>INT. LIVING ROOM - DAY</span>
                )}
              </div>

              <div className="mb-4 leading-normal">
                {status === "complete" ? (
                  <>
                    <motion.span 
                      initial={{ backgroundColor: "rgba(16, 185, 129, 0)" }}
                      animate={{ backgroundColor: "rgba(16, 185, 129, 0.12)", color: "#34d399" }}
                      className="px-1.5 py-0.5 rounded border border-emerald-500/25 font-bold"
                    >
                      LEO VANCE
                    </motion.span>
                    <span> (40s), dressed in </span>
                    <motion.span 
                      initial={{ backgroundColor: "rgba(168, 85, 247, 0)" }}
                      animate={{ backgroundColor: "rgba(168, 85, 247, 0.12)", color: "#c084fc" }}
                      className="px-1.5 py-0.5 rounded border border-purple-500/25 font-bold"
                    >
                      casual wear
                    </motion.span>
                    <span>, paces the floor. He holds a leather-bound </span>
                    <motion.span 
                      initial={{ backgroundColor: "rgba(245, 158, 11, 0)" }}
                      animate={{ backgroundColor: "rgba(245, 158, 11, 0.12)", color: "#fbbf24" }}
                      className="px-1.5 py-0.5 rounded border border-amber-500/25 font-bold"
                    >
                      ledger
                    </motion.span>
                    <span>, scanning the columns of numbers.</span>
                  </>
                ) : (
                  <span>LEO VANCE (40s), dressed in casual wear, paces the floor. He holds a leather-bound ledger, scanning the columns of numbers.</span>
                )}
              </div>

              <div className="mb-4 leading-normal">
                {status === "complete" ? (
                  <>
                    <motion.span 
                      initial={{ backgroundColor: "rgba(16, 185, 129, 0)" }}
                      animate={{ backgroundColor: "rgba(16, 185, 129, 0.12)", color: "#34d399" }}
                      className="px-1.5 py-0.5 rounded border border-emerald-500/25 font-bold"
                    >
                      MAYA LIN
                    </motion.span>
                    <span> (30s) enters, carrying a steaming mug. She stops, watching him.</span>
                  </>
                ) : (
                  <span>MAYA LIN (30s) enters, carrying a steaming mug. She stops, watching him.</span>
                )}
              </div>

              <div className="pl-[25%] pr-[10%] mb-2">
                <div className="pl-[10%] font-semibold text-zinc-100">MAYA</div>
                <div>Did you find what you were looking for?</div>
              </div>

              <div className="pl-[25%] pr-[10%] mb-2">
                <div className="pl-[10%] font-semibold text-zinc-100">LEO</div>
                <div>It's all here. Every single transaction in the ledger.</div>
              </div>
            </div>
          </div>

          {/* Action indicator bar for parsing */}
          {status === "parsing" && (
            <div className="mt-3 py-2 px-3 bg-zinc-900/60 border border-white/5 rounded-lg flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 text-[#8ECAFF] animate-spin" />
              <span className="text-xs text-zinc-400 font-sans">{parsingStatusTexts[parsingStep]}</span>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: AI Extracted Elements */}
        <div className="lg:col-span-5 flex flex-col rounded-xl border border-white/5 bg-zinc-950/80 p-5 shadow-inner">
          <h3 className="text-sm font-semibold tracking-tight text-zinc-100 font-sans mb-1">
            AI Extracted Elements
          </h3>
          <p className="text-[11px] text-zinc-500 font-sans mb-4">
            Structured breakdown of scheduling requirements.
          </p>

          <div className="flex-1 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              {status === "idle" && (
                <motion.div
                  key="idle-state"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-white/5 rounded-lg bg-zinc-950/40 h-full"
                >
                  <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center mb-3">
                    <Sparkles className="w-5 h-5 text-zinc-500" />
                  </div>
                  <p className="text-xs text-zinc-400 font-medium font-sans mb-1">
                    Ready for Breakdown
                  </p>
                  <p className="text-[10px] text-zinc-600 font-sans max-w-[200px]">
                    Click the action below to scan the screenplay segment and populate shooting categories.
                  </p>
                </motion.div>
              )}

              {status === "parsing" && (
                <motion.div
                  key="parsing-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4 py-4 h-full flex flex-col justify-center"
                >
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-start gap-3 animate-pulse">
                      <div className="w-8 h-8 rounded bg-zinc-900 border border-white/5 shrink-0" />
                      <div className="flex-1 space-y-1.5 py-1">
                        <div className="h-2.5 bg-zinc-800 rounded w-1/4" />
                        <div className="h-3.5 bg-zinc-900 rounded w-3/4" />
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {status === "complete" && (
                <motion.div
                  key="complete-state"
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.1,
                      },
                    },
                  }}
                  className="space-y-4 py-2 font-sans"
                >
                  {/* Category: Location */}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, x: 15 },
                      show: { opacity: 1, x: 0 },
                    }}
                    className="flex items-start gap-3 p-2 rounded-lg border border-white/5 bg-zinc-900/20"
                  >
                    <div className="w-7 h-7 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
                        Locations
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
                          INT. LIVING ROOM
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Category: Cast */}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, x: 15 },
                      show: { opacity: 1, x: 0 },
                    }}
                    className="flex items-start gap-3 p-2 rounded-lg border border-white/5 bg-zinc-900/20"
                  >
                    <div className="w-7 h-7 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
                        Cast
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          Leo Vance (Actor 1)
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          Maya Lin (Actor 2)
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Category: Props */}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, x: 15 },
                      show: { opacity: 1, x: 0 },
                    }}
                    className="flex items-start gap-3 p-2 rounded-lg border border-white/5 bg-zinc-900/20"
                  >
                    <div className="w-7 h-7 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <Package className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
                        Props
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          Ledger
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Category: Wardrobe */}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, x: 15 },
                      show: { opacity: 1, x: 0 },
                    }}
                    className="flex items-start gap-3 p-2 rounded-lg border border-white/5 bg-zinc-900/20"
                  >
                    <div className="w-7 h-7 rounded bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                      <Shirt className="w-3.5 h-3.5 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
                        Wardrobe
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          Casual Wear
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* FOOTER ACTIONS BAR */}
      <div className="mt-6 border-t border-white/5 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans">
        <div>
          {status === "complete" ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Extracted 4 metadata tags successfully.</span>
            </div>
          ) : (
            <p className="text-xs text-zinc-500">
              {status === "parsing" ? "AI Pipeline executing..." : "Demonstration sandbox environment."}
            </p>
          )}
        </div>

        <div>
          {status === "idle" && (
            <button
              onClick={handleRunBreakdown}
              className="btn-primary flex items-center gap-1.5 text-xs select-none"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Run AI Breakdown</span>
            </button>
          )}

          {status === "parsing" && (
            <button
              disabled
              className="btn-glass flex items-center gap-1.5 text-xs select-none opacity-50 cursor-not-allowed"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing Screenplay...</span>
            </button>
          )}

          {status === "complete" && (
            <button
              onClick={handleReset}
              className="btn-glass flex items-center gap-1.5 text-xs select-none"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
