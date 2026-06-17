"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { 
  Plus, 
  Minus, 
  Maximize2, 
  X, 
  Paperclip, 
  ArrowUp, 
  Sparkles,
  ChevronDown,
  Loader2,
  Play,
  Check
} from "lucide-react";
import { ArtifactFeature } from "@/lib/artifactsDemoData";

interface ScrollDrivenChatbotProps {
  activeFeature: ArtifactFeature;
  onSequenceComplete: () => void;
  className?: string;
}

export default function ScrollDrivenChatbot({ activeFeature, onSequenceComplete, className = "" }: ScrollDrivenChatbotProps) {
  const [step, setStep] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px 0px" });

  useEffect(() => {
    if (!isInView) return;

    // Reset step for the new feature
    setStep(0);

    const t1 = setTimeout(() => {
      setStep(1); // Show user prompt
    }, 0);

    const t2 = setTimeout(() => {
      setStep(2); // Show agent operations
    }, 1000);

    const t3 = setTimeout(() => {
      setStep(3); // Show assistant response and start typing
    }, 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [activeFeature, isInView]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [step]);

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col bg-[#141414] border border-[#27272a] rounded-[16px] shadow-2xl overflow-hidden font-sans ${className}`}
    >
      
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#27272a]">
        <div className="flex items-center gap-3">
          <span className="text-[#e4e4e7] font-medium text-sm">Chat</span>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#27272a] hover:bg-[#3f3f46] transition-colors">
            <Plus className="w-3.5 h-3.5 text-[#e4e4e7]" />
            <span className="text-[#e4e4e7] text-xs font-medium">New chat</span>
          </button>
        </div>
        <div className="flex items-center gap-4 text-[#52525b]">
          <Minus className="w-4 h-4 cursor-pointer hover:text-[#e4e4e7] transition-colors" />
          <Maximize2 className="w-3.5 h-3.5 cursor-pointer hover:text-[#e4e4e7] transition-colors" />
          <X className="w-4 h-4 cursor-pointer hover:text-[#e4e4e7] transition-colors" />
        </div>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-hidden p-6 space-y-6 flex flex-col scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        data-lenis-prevent="true"
      >
        <style dangerouslySetInnerHTML={{__html: `
          ::-webkit-scrollbar { display: none; }
        `}} />
        <AnimatePresence initial={false}>
          {/* Step 1: User Prompt */}
          {step >= 1 && (
            <motion.div
              key={`user-${activeFeature.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full flex justify-end"
            >
              <div className="max-w-[80%] rounded-2xl px-4 py-2.5 bg-[#27272a]">
                <p className="text-[#e4e4e7] text-[14px] leading-relaxed">
                  {activeFeature.userPrompt}
                </p>
              </div>
            </motion.div>
          )}

          {/* Step 2: Agent Operations */}
          {step >= 2 && activeFeature.agentOperations && activeFeature.agentOperations.length > 0 && (
            <motion.div
              key={`ops-${activeFeature.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full flex flex-col items-start max-w-[85%] mt-2"
            >
              <div className="flex flex-col gap-1.5 mb-3 bg-[#141414]/30 border border-[#27272a]/40 rounded-lg p-2.5 w-fit min-w-[240px]">
                <div className="text-[10px] uppercase tracking-wider text-[#52525b] font-mono mb-1 font-semibold">Agent Operations</div>
                {activeFeature.agentOperations.map((op, idx) => {
                  const isCompleted = step >= 3;
                  return (
                    <div key={`op-${activeFeature.id}-${idx}`} className="flex items-center gap-2 text-xs">
                      {isCompleted ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                      )}
                      <span className="text-[#a1a1aa]">
                        {isCompleted ? 'Completed' : 'Executing'} <code className="font-mono text-white bg-[#27272a]/60 px-1 py-0.5 rounded text-[11px]">{op}</code>
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Step 3: Assistant Response */}
          {step >= 3 && (
            <motion.div
              key={`assistant-${activeFeature.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full flex flex-col items-start max-w-[85%]"
            >
              <div className="flex items-center gap-1 mb-1.5">
                <span className="text-[#52525b] text-[13px] font-medium">ABRAM Agent</span>
                <Play className="w-2.5 h-2.5 text-[#52525b] fill-current" />
              </div>
              <div className="text-[#e4e4e7] text-[15px] leading-relaxed">
                <TypewriterText 
                  text={activeFeature.assistantResponse} 
                  key={activeFeature.id} 
                  onComplete={onSequenceComplete} 
                  scrollRef={scrollRef}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="p-4 pt-0">
        <div className="bg-[#141414] border border-[#27272a] rounded-xl flex flex-col p-3 shadow-lg">
          <textarea 
            disabled
            placeholder="Ask ABRAM..."
            className="w-full bg-transparent border-none text-[#e4e4e7] placeholder:text-[#52525b] text-[14px] leading-relaxed resize-none focus:outline-none min-h-[40px]"
            rows={1}
          />
          <div className="flex items-center justify-between mt-2">
            <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-[#27272a] transition-colors text-[#a1a1aa]">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Skills</span>
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full border border-[#3f3f46] flex items-center justify-center">
                <span className="text-[10px] text-[#52525b]">1</span>
              </div>
              <button className="p-1.5 hover:bg-[#27272a] rounded-md transition-colors text-[#a1a1aa]">
                <Paperclip className="w-4 h-4" />
              </button>
              <button className="p-1.5 bg-[#27272a] rounded-md transition-colors text-[#e4e4e7]">
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple internal typewriter effect component
function TypewriterText({ text, onComplete, scrollRef }: { text: string; onComplete: () => void; scrollRef: React.RefObject<HTMLDivElement | null> }) {
  const [displayed, setDisplayed] = useState("");
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
        // Auto-scroll as it types
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      } else {
        clearInterval(interval);
        onCompleteRef.current();
      }
    }, 15); // Fast typing speed

    return () => clearInterval(interval);
  }, [text, scrollRef]);

  return <span>{displayed}</span>;
}
