"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

export type MessageType = "user" | "assistant" | "tool_execution" | "tool_result";

export interface ChatMessage {
  id: string;
  type: MessageType;
  content: string | React.ReactNode;
  toolName?: string;
  delayMs: number; // How long to wait before showing this message
}

interface AnimatedChatbotProps {
  sequence: ChatMessage[];
  className?: string;
}

export default function AnimatedChatbot({ sequence, className = "" }: AnimatedChatbotProps) {
  const [visibleMessages, setVisibleMessages] = useState<ChatMessage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentIndex >= sequence.length) return;

    const currentMsg = sequence[currentIndex];
    const timer = setTimeout(() => {
      setVisibleMessages((prev) => [...prev, currentMsg]);
      setCurrentIndex((prev) => prev + 1);
    }, currentMsg.delayMs);

    return () => clearTimeout(timer);
  }, [currentIndex, sequence]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleMessages]);

  return (
    <div className={`flex flex-col bg-[#141414] border border-[#27272a] rounded-[16px] shadow-2xl overflow-hidden font-sans ${className}`}>
      
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
        className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col hide-scrollbar scroll-smooth"
        data-lenis-prevent="true"
      >
        <AnimatePresence initial={false}>
          {visibleMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full"
            >
              {msg.type === "user" && (
                <div className="flex justify-end w-full">
                  <div className="max-w-[80%] rounded-2xl px-4 py-2.5 bg-[#27272a]">
                    <p className="text-[#e4e4e7] text-[14px] leading-relaxed">
                      {msg.content}
                    </p>
                  </div>
                </div>
              )}

              {msg.type === "assistant" && (
                <div className="flex flex-col items-start w-full max-w-[85%]">
                  <div className="flex items-center gap-1 mb-1.5">
                    <span className="text-[#52525b] text-[13px] font-medium">ABRAM Agent</span>
                    <Play className="w-2.5 h-2.5 text-[#52525b] fill-current" />
                  </div>
                  <div className="text-[#e4e4e7] text-[15px] leading-relaxed">
                    <TypewriterText text={msg.content as string} />
                  </div>
                </div>
              )}

              {msg.type === "tool_execution" && (() => {
                const msgIndex = visibleMessages.findIndex(m => m.id === msg.id);
                const isCompleted = visibleMessages.some((m, idx) => m.type === "tool_result" && idx > msgIndex);
                
                return (
                  <div className="flex flex-col items-start w-full max-w-[85%] mt-2">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-md">
                      {isCompleted ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Loader2 className="w-3.5 h-3.5 text-[#8ECAFF] animate-spin" />
                      )}
                      <span className="text-[#a1a1aa] text-xs font-mono">
                        {isCompleted ? 'Finished tool:' : 'Running tool:'} <span className={isCompleted ? "text-zinc-500" : "text-[#8ECAFF]"}>{msg.toolName}</span>
                      </span>
                    </div>
                  </div>
                );
              })()}

              {msg.type === "tool_result" && (
                <div className="flex flex-col items-start w-full max-w-[95%] mt-2">
                  <div className="p-4 rounded-xl border border-emerald-500/10 bg-[#141414] shadow-[0_0_20px_rgba(16,185,129,0.03)] w-full">
                    {msg.content}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
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
              <button 
                className="p-1.5 hover:bg-[#27272a] rounded-md transition-colors text-[#a1a1aa]"
                aria-label="Attach files"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <button 
                className="p-1.5 bg-[#27272a] rounded-md transition-colors text-[#e4e4e7]"
                aria-label="Send message"
              >
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
function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 15); // Fast typing speed

    return () => clearInterval(interval);
  }, [text]);

  return <span>{displayed}</span>;
}
