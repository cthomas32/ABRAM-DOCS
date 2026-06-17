"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useInView } from "framer-motion";
import { Check, Terminal, Sparkles, AlertCircle, DollarSign, ShieldCheck } from "lucide-react";

type ParserState = "idle" | "typing" | "processing" | "result";

const promptText = "Creative Brief: NYC Fashion Campaign, 3 shoot days. Budget: $20k. Need DP, Gaffer, and Sound. Deliverables: 1x 60s commercial, 3x 15s socials.";

export default function BriefSection() {
  const [state, setState] = useState<ParserState>("idle");
  const [typedText, setTypedText] = useState("");

  const sectionRef = useRef<HTMLDivElement>(null);
  
  // Track scroll relative to viewport entry/exit
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Apply a subtle 3D hover/tilt effect as it slides in
  const rotateX = useTransform(scrollYProgress, [0, 0.45], [12, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.45], [0.93, 1]);
  const y = useTransform(scrollYProgress, [0, 0.45], [100, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.35], [0, 1]);

  // Viewport observer to play animation only when card is visible
  const isMockupInView = useInView(sectionRef, { once: false, amount: 0.35 });

  useEffect(() => {
    if (!isMockupInView) {
      setState("idle");
      setTypedText("");
      return;
    }

    if (state === "idle") {
      setTypedText("");
      const timer = setTimeout(() => {
        setState("typing");
      }, 800);
      return () => clearTimeout(timer);
    } else if (state === "typing") {
      setTypedText("");
      let charIndex = 0;
      const typingInterval = setInterval(() => {
        if (charIndex < promptText.length) {
          setTypedText(promptText.slice(0, charIndex + 1));
          charIndex++;
        } else {
          clearInterval(typingInterval);
          const transitionTimeout = setTimeout(() => {
            setState("processing");
          }, 800);
          return () => clearTimeout(transitionTimeout);
        }
      }, 30);

      return () => clearInterval(typingInterval);
    } else if (state === "processing") {
      const timer = setTimeout(() => {
        setState("result");
      }, 2000);
      return () => clearTimeout(timer);
    } else if (state === "result") {
      const timer = setTimeout(() => {
        setState("idle");
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [state, isMockupInView]);

  // Dynamic log texts during processing
  const [processingLog, setProcessingLog] = useState("Initializing analyzer...");
  useEffect(() => {
    if (state !== "processing") return;
    const logs = [
      "Analyzing campaign parameters...",
      "Extracting deliverables (1x 60s, 3x 15s socials)...",
      "Mapping required crew roles: DP, Gaffer, Sound...",
      "Checking budget threshold constraints ($20,000)...",
      "Validating day rates against market averages...",
      "Generating scoping configuration node..."
    ];
    let logIndex = 0;
    setProcessingLog(logs[0]);
    const logInterval = setInterval(() => {
      logIndex++;
      if (logIndex < logs.length) {
        setProcessingLog(logs[logIndex]);
      }
    }, 320);
    return () => clearInterval(logInterval);
  }, [state]);

  return (
    <section ref={sectionRef} className="relative w-full max-w-7xl mx-auto px-6 py-20 md:py-32 bg-[#0A0A0A] text-white">
      {/* Ambient Glows - Subtle Purple and Sky Blue for AI brief processing */}
      <div className="absolute top-1/3 left-1/4 w-[450px] h-[450px] bg-purple-500/[0.03] rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[450px] h-[450px] bg-[#8ECAFF]/[0.02] rounded-full filter blur-[120px] pointer-events-none" />

      <div className="max-w-lg mx-auto space-y-12 relative z-10">
        {/* Header Block */}
        <div className="text-center space-y-4 max-w-lg mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/3 text-[#f5f5f3] text-xs font-semibold tracking-wider uppercase">
            Brief Intelligence
          </div>
          {/* Section Header (h2: text-base to text-lg, font-medium, leading-snug) */}
          <h2 
            className="text-base md:text-lg font-medium text-white/90 tracking-wide leading-snug uppercase font-display"
          >
            Translate raw briefs into <span className="text-[#8ECAFF] font-semibold">scoped work packages.</span>
          </h2>
          {/* Body Paragraph: text-sm font-normal text-white/80 */}
          <p className="text-sm font-normal text-white/80 max-w-lg mx-auto leading-relaxed">
            Drag in a creative brief, upload a treatment, or type a rough outline. ABRAM automatically processes text inputs into initial timeline drafts, mapping deliverables and role specifications.
          </p>
        </div>

        {/* Central Mockup Card Container with 3D scroll tilt */}
        <motion.div 
          style={{ rotateX, scale, y, opacity, perspective: 1000 }} 
          className="w-full glass-panel rounded-2xl border border-white/[0.08] overflow-hidden shadow-2xl relative"
        >
          {/* Windows-like Title Bar */}
          <div className="bg-white/[0.02] border-b border-white/[0.08] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/30" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/30" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/30" />
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
              <Terminal className="w-3.5 h-3.5 text-zinc-500" />
              <span>Brief Analyzer</span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-medium">
              <span className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                state === "idle" ? "bg-zinc-600" :
                state === "typing" ? "bg-abram-accent " :
                state === "processing" ? "bg-white/40 " : "bg-emerald-500"
              }`} />
              <span className="text-zinc-500 capitalize">
                {state === "idle" ? "idle" :
                 state === "typing" ? "typing" :
                 state === "processing" ? "parsing" : "scoped"}
              </span>
            </div>
          </div>

          {/* Window Body */}
          <div className="p-6 md:p-8 min-h-[300px] flex flex-col justify-center relative bg-zinc-950/40">
            <AnimatePresence mode="wait">
              
              {/* STATE: IDLE */}
              {state === "idle" && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="font-mono text-xs text-zinc-600 leading-relaxed bg-white/[0.01] border border-white/[0.08] rounded-xl p-5 min-h-[120px] relative select-none flex items-center"
                >
                  <span>Waiting for campaign input...</span>
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="inline-block w-1.5 h-4 bg-white/40 ml-0.5 align-middle"
                  />
                </motion.div>
              )}

              {/* STATE: TYPING */}
              {state === "typing" && (
                <motion.div
                  key="typing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="font-mono text-xs text-white/80 leading-relaxed bg-white/[0.01] border border-white/[0.08] rounded-xl p-5 min-h-[120px] relative select-none flex items-center"
                >
                  <div>
                    {typedText}
                    <motion.span
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ repeat: Infinity, duration: 0.8 }}
                      className="inline-block w-1.5 h-4 bg-abram-accent ml-0.5 align-middle"
                    />
                  </div>
                </motion.div>
              )}

              {/* STATE: PROCESSING */}
              {state === "processing" && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col justify-center items-center py-6 min-h-[120px]"
                >
                  {/* Bouncing sky-blue Bars Loader */}
                  <div className="flex items-end gap-1.5 justify-center h-10 mb-4">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 rounded-full bg-abram-accent"
                        animate={{
                          height: ["12px", "32px", "12px"]
                        }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: i * 0.15
                        }}
                      />
                    ))}
                  </div>

                  <div className="text-xs text-zinc-400 font-mono">
                    {processingLog}
                  </div>
                </motion.div>
              )}

              {/* STATE: RESULT */}
              {state === "result" && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6 flex-1 flex flex-col justify-between"
                >
                  {/* Header Title with Check */}
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="rounded-full bg-emerald-500/10 border border-emerald-500/20 p-1 text-emerald-400 shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-medium text-white tracking-wide">
                          Brief Scoping Complete
                        </h3>
                        <p className="text-[10px] text-zinc-500">Campaign structure successfully parsed</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] bg-white/[0.03] border border-white/[0.08] px-2 py-0.5 rounded-full font-mono">
                      <Sparkles className="w-3 h-3 text-abram-accent" />
                      <span className="text-zinc-400">Confidence:</span>
                      <span className="text-white font-semibold">98%</span>
                    </div>
                  </div>

                  {/* Scoped Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    
                    {/* Deliverables Block */}
                    <div className="md:col-span-5 bg-white/[0.01] border border-white/[0.04] p-3 rounded-lg space-y-2">
                      <div className="text-[9px] uppercase tracking-widest text-zinc-500 font-semibold">Parsed Deliverables</div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-zinc-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-abram-accent" />
                          <span>1x 60s Main Spot (Hero)</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-abram-accent" />
                          <span>3x 15s Social Cutdowns</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px]">
                        <span className="text-zinc-500">Complexity Level:</span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium uppercase tracking-wide border border-amber-500/10 text-[9px]">
                          Medium
                        </span>
                      </div>
                    </div>

                    {/* Role Slots & Budget Mapping */}
                    <div className="md:col-span-7 bg-white/[0.01] border border-white/[0.04] p-3 rounded-lg space-y-2.5">
                      <div className="flex justify-between items-center text-[9px] uppercase tracking-widest text-zinc-500 font-semibold">
                        <span>Role Slots &amp; Budget Checks</span>
                        <span className="text-[10px] text-zinc-400 font-mono">Shoot Days: 3</span>
                      </div>

                      <div className="space-y-1.5">
                        {/* DP slot */}
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-zinc-300">DP (RED Raptor Kit)</span>
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-500">$1,500/day × 3</span>
                            <span className="text-emerald-400 font-semibold text-[10px] bg-emerald-500/5 px-1.5 py-0.2 rounded border border-emerald-500/10">OK</span>
                          </div>
                        </div>

                        {/* Gaffer slot */}
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-zinc-300">Gaffer (LED Package)</span>
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-500">$1,000/day × 3</span>
                            <span className="text-emerald-400 font-semibold text-[10px] bg-emerald-500/5 px-1.5 py-0.2 rounded border border-emerald-500/10">OK</span>
                          </div>
                        </div>

                        {/* Sound slot */}
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-zinc-300">Sound Mixer (Kit)</span>
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-500">$800/day × 3</span>
                            <span className="text-emerald-400 font-semibold text-[10px] bg-emerald-500/5 px-1.5 py-0.2 rounded border border-emerald-500/10">OK</span>
                          </div>
                        </div>
                      </div>

                      {/* Budget summary */}
                      <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px]">
                        <span className="text-zinc-500">Roster Est. Subtotal:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-white font-medium">$9,900</span>
                          <span className="text-zinc-600">/</span>
                          <span className="font-mono text-[#8ECAFF] font-semibold">$20,000 Budget Cap</span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Matching Progress Bar */}
                  <div className="space-y-1.5 pt-3 border-t border-white/[0.06]">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-zinc-400 tracking-wide flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Roster Availability Check
                      </span>
                      <span className="text-emerald-400 font-medium">100% Feasible</span>
                    </div>
                    <div className="w-full bg-zinc-900 rounded-full h-1 overflow-hidden border border-white/[0.08]">
                      <motion.div
                        className="bg-emerald-500 h-full rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>

        {/* Stats Grid Underneath - aligned with Bento gap-4 specifications */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              value: "75%",
              title: "Completion Rate",
              desc: "Processes and resolves specifications automatically in the background."
            },
            {
              value: "< 2 min",
              title: "Setup Time",
              desc: "Translate treatments or rough text notes into structured campaign packages."
            },
            {
              value: "Direct",
              title: "Oversight",
              desc: "Review and approve action plans before inviting crew or reserving resources."
            }
          ].map((stat, i) => (
            <div 
              key={i}
              className="glass-panel p-6 rounded-2xl border border-white/[0.08] hover:border-abram-cream/20 hover:bg-abram-cream/[0.06] transition-all duration-200 space-y-2"
            >
              {/* Stats Title (Page Title compact style: text-xl to text-2xl font-medium) */}
              <div 
                className="text-xl md:text-2xl font-medium text-white tracking-wide font-display"
              >
                {stat.value}
              </div>
              {/* Form Label style: text-xs font-medium tracking-wider */}
              <div className="text-xs font-medium tracking-wider text-white/30 uppercase">
                {stat.title}
              </div>
              {/* Body: text-sm font-normal text-white/80 */}
              <p className="text-sm font-normal text-white/80 leading-relaxed">
                {stat.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
