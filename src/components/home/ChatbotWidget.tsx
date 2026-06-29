"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Paperclip, ArrowUp, ChevronDown, Minimize2, Maximize2, Plus } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "assistant";
  callSheet?: boolean;
  workOrder?: boolean;
  budget?: boolean;
}

const MOCK_RESPONSES: Record<string, Message> = {
  "Help me draft a project brief.": {
    id: "1",
    sender: "assistant",
    text: "Let's draft a new campaign brief. I've initialized the **AI Brief Analyzer**. Describe the shoot parameters (locations, roles, and budget cap) to begin scoping.",
  },
  "Create a work order for Gaffer Jordan M.": {
    id: "2",
    sender: "assistant",
    text: "Analyzing roster... Gaffer **Jordan M.** has been matched. Generating Work Order for *Apparel Brand Campaign* at **$1,200/day**.\n\nStatus: **Scheduled & Confirmed**. Booking hold locked on resource timeline calendar.",
    workOrder: true
  },
  "Generate a Call Sheet for Shoot Day 1.": {
    id: "3",
    sender: "assistant",
    text: "Parsing linked work orders and location resources. Call Sheet generated successfully for **Shoot Day 1**.",
    callSheet: true
  },
  "Check how Jordan M.'s booking impacts matching.": {
    id: "4",
    sender: "assistant",
    text: "Gaffer **Jordan M.** is locked on Shoot Day 1 Work Order. Availability shifted to **Busy** (🔴 100% capacity).\n\nMatch score for Gaffer Jordan M. shifted to 0%. Backup candidate Gaffer **Marcus T.** shifted to **#1 Match Rank** (Chemistry score: **94%**, Day Rate: **$1,150/day**).",
  },
  "Create a ROM budget": {
    id: "5",
    sender: "assistant",
    text: "Calculating Rough Order of Magnitude (ROM) budget estimate for *Apparel Campaign*... Here is the cost summary:",
    budget: true
  }
};

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [activePreset, setActivePreset] = useState<Message | null>(null);

  const chatAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const streamingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages, streamingText, isGenerating, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  const handleInputHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputVal);
    }
  };

  const startStreaming = (presetResponse: Message) => {
    setIsStreaming(true);
    setStreamingText("");
    setActivePreset(presetResponse);

    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
    }

    const words = presetResponse.text.split(" ");
    let currentWordIndex = 0;
    let currentText = "";

    streamingIntervalRef.current = setInterval(() => {
      if (currentWordIndex < words.length) {
        currentText += (currentWordIndex === 0 ? "" : " ") + words[currentWordIndex];
        setStreamingText(currentText);
        currentWordIndex++;
      } else {
        if (streamingIntervalRef.current) {
          clearInterval(streamingIntervalRef.current);
        }
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            text: presetResponse.text,
            sender: "assistant",
            callSheet: presetResponse.callSheet,
            workOrder: presetResponse.workOrder,
            budget: presetResponse.budget
          },
        ]);
        setIsStreaming(false);
        setStreamingText("");
        setIsGenerating(false);
        setActivePreset(null);
        
        // Dispatch global window events to trigger mockup animations on complete
        if (presetResponse.text.includes("Brief Analyzer")) {
          window.dispatchEvent(new CustomEvent("abram-trigger-brief-extraction"));
        }
        if (presetResponse.workOrder) {
          window.dispatchEvent(new CustomEvent("abram-lock-gaffer-hold"));
        }
        if (presetResponse.callSheet) {
          window.dispatchEvent(new CustomEvent("abram-show-call-sheet"));
        }
        if (presetResponse.text.includes("Marcus T.")) {
          window.dispatchEvent(new CustomEvent("abram-update-crew-matching"));
        }
        if (presetResponse.budget) {
          window.dispatchEvent(new CustomEvent("abram-populate-payment-ledger"));
        }
      }
    }, 50);
  };

  const handleSend = (textToSend: string) => {
    const cleanText = textToSend.trim();
    if (!cleanText || isGenerating || isStreaming) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        text: cleanText,
        sender: "user",
      },
    ]);

    setInputVal("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "36px";
    }

    setIsGenerating(true);

    // Dynamic triggers based on message content
    setTimeout(() => {
      let matchedResponse = MOCK_RESPONSES[cleanText];
      
      if (!matchedResponse) {
        const lowerText = cleanText.toLowerCase();
        if (lowerText.includes("brief") || lowerText.includes("draft")) {
          matchedResponse = MOCK_RESPONSES["Help me draft a project brief."];
        } else if (lowerText.includes("work order") || lowerText.includes("jordan")) {
          matchedResponse = MOCK_RESPONSES["Create a work order for Gaffer Jordan M."];
        } else if (lowerText.includes("call sheet")) {
          matchedResponse = MOCK_RESPONSES["Generate a Call Sheet for Shoot Day 1."];
        } else if (lowerText.includes("matching") || lowerText.includes("impact")) {
          matchedResponse = MOCK_RESPONSES["Check how Jordan M.'s booking impacts matching."];
        } else if (lowerText.includes("rom") || lowerText.includes("budget") || lowerText.includes("cost")) {
          matchedResponse = MOCK_RESPONSES["Create a ROM budget"];
        } else {
          matchedResponse = {
            id: "default",
            sender: "assistant",
            text: `Processing query: "${cleanText}". I have updated the system indexes. What is the next production command?`
          };
        }
      }

      // Scroll smoothly to target section
      if (cleanText.includes("brief") || cleanText.includes("draft")) {
        const el = document.getElementById("brief-section");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      } else if (cleanText.includes("work order") || cleanText.includes("jordan") || cleanText.includes("schedule")) {
        const el = document.getElementById("scheduling-section");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      } else if (cleanText.includes("matching") || cleanText.includes("impact")) {
        const el = document.getElementById("crew-section");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      } else if (cleanText.includes("rom") || cleanText.includes("budget") || cleanText.includes("cost") || cleanText.includes("payment")) {
        const el = document.getElementById("payments-section");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }

      startStreaming(matchedResponse);
    }, 1200);
  };

  const handleReset = () => {
    setMessages([]);
    setInputVal("");
    setIsGenerating(false);
    setIsStreaming(false);
    setStreamingText("");
    window.dispatchEvent(new CustomEvent("abram-reset-mockups"));
  };

  const parseMarkdown = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* Floating Orb Trigger */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center bg-[#0c0c0c] border border-white/8 shadow-[0_8px_30px_rgba(0,0,0,0.6)] cursor-pointer overflow-hidden group outline-none"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative z-10 text-white flex items-center justify-center">
          {isOpen ? (
            <X className="w-5 h-5 transition-transform duration-300" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.2)"></circle>
              <circle cx="12" cy="12" r="5" stroke="#fafaf9"></circle>
              <circle cx="12" cy="12" r="1.5" fill="#fafaf9"></circle>
            </svg>
          )}
        </div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed bottom-24 right-4 sm:right-6 z-50 flex flex-col items-center justify-center">
            {/* Ambient Sweep Gradient */}
            <div className="absolute -inset-[220px] pointer-events-none z-0 flex items-center justify-center opacity-30">
              <svg className="w-[800px] h-[800px]" viewBox="0 0 1000 1000">
                <circle cx="500" cy="500" r="320" stroke="rgba(255,255,255,0.01)" strokeWidth="1" />
                <circle cx="500" cy="500" r="420" stroke="rgba(255,255,255,0.005)" strokeWidth="1" />
                <motion.g
                  animate={isGenerating ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  style={{ transformOrigin: "500px 500px" }}
                >
                  <circle cx="500" cy="500" r="320" stroke="url(#sweep-grad)" strokeWidth="1.5" style={{ filter: "blur(3px)" }} />
                  <circle cx="500" cy="500" r="320" stroke="url(#sweep-grad)" strokeWidth="1" />
                </motion.g>
                <defs>
                  <linearGradient id="sweep-grad" x1="-100%" y1="0%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="transparent" />
                    <stop offset="50%" stopColor="rgba(255, 255, 255, 0.4)" />
                    <stop offset="100%" stopColor="transparent" />
                    <animate attributeName="x1" values="-100%;100%" dur={isGenerating ? "2s" : "6s"} repeatCount="indefinite" />
                    <animate attributeName="x2" values="0%;200%" dur={isGenerating ? "2s" : "6s"} repeatCount="indefinite" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Chat Panel Window */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-[calc(100vw-2rem)] sm:w-[440px] h-[640px] max-h-[calc(100vh-8rem)] rounded-2xl bg-[#0c0c0c]/85 border border-white/[0.08] backdrop-blur-[24px] shadow-[0_24px_60px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden"
            >
              {/* Header Controls (Minimize, Expand, Close, New Chat) */}
              <div className="flex items-center justify-between px-4 py-3 bg-[#0c0c0c]/90 border-b border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-white tracking-wide font-sans">Chat</span>
                  <button 
                    onClick={handleReset}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] transition text-[10px] font-medium text-white/70 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New chat</span>
                  </button>
                </div>
                
                {/* Control Action Buttons */}
                <div className="flex items-center gap-3 text-zinc-400">
                  <button
                    className="hover:text-white transition cursor-pointer"
                    onClick={() => setIsOpen(false)}
                    aria-label="Minimize chat"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    className="hover:text-white transition cursor-pointer"
                    aria-label="Maximize chat"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    className="hover:text-white transition cursor-pointer"
                    onClick={() => setIsOpen(false)}
                    aria-label="Close chat"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Chat Content Panel */}
              <div 
                ref={chatAreaRef}
                data-lenis-prevent
                className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 scrollbar-none bg-zinc-950/40"
              >
                {messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-4 my-auto">
                    
                    {/* Stylized White ABRAM Icon */}
                    <div className="w-12 h-12 mb-6 flex items-center justify-center select-none">
                      <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M35 15C35 12.2386 37.2386 10 40 10H44C46.7614 10 49 12.2386 49 15V85C49 87.7614 46.7614 90 44 90H40C37.2386 90 35 87.7614 35 85V15Z" fill="white" />
                        <path d="M51 15C51 12.2386 53.2386 10 56 10H60C62.7614 10 65 12.2386 65 15V85C65 87.7614 62.7614 90 60 90H56C53.2386 90 51 87.7614 51 85V15Z" fill="white" />
                        <rect x="44" y="45" width="12" height="10" fill="white" />
                      </svg>
                    </div>

                    <h2 className="text-base font-medium text-white mb-1 tracking-tight font-sans">
                      Rise and shine, Connor!
                    </h2>
                    <p className="text-xs text-zinc-400 mb-6 font-sans">
                      Ready to crush today's projects?
                    </p>

                    {/* Suggestions Buttons */}
                    <div className="flex flex-col gap-2 w-full max-w-[320px] font-sans">
                      <button 
                        onClick={() => handleSend("Create a work order for Gaffer Jordan M.")}
                        className="w-full bg-[#121212] hover:bg-[#181818] border border-white/[0.05] hover:border-white/10 text-zinc-300 hover:text-white px-3.5 py-2.5 rounded-xl text-xs text-left cursor-pointer flex items-center gap-3 transition-all duration-200"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                        <span>Create a work order for Gaffer Jordan M.</span>
                      </button>
                      
                      <button 
                        onClick={() => handleSend("Generate a Call Sheet for Shoot Day 1.")}
                        className="w-full bg-[#121212] hover:bg-[#181818] border border-white/[0.05] hover:border-white/10 text-zinc-300 hover:text-white px-3.5 py-2.5 rounded-xl text-xs text-left cursor-pointer flex items-center gap-3 transition-all duration-200"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                        <span>Generate a Call Sheet for Shoot Day 1.</span>
                      </button>

                      <button 
                        onClick={() => handleSend("Check how Jordan M.'s booking impacts matching.")}
                        className="w-full bg-[#121212] hover:bg-[#181818] border border-white/[0.05] hover:border-white/10 text-zinc-300 hover:text-white px-3.5 py-2.5 rounded-xl text-xs text-left cursor-pointer flex items-center gap-3 transition-all duration-200"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                        <span>Check how Jordan's hold impacts matching.</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Messages Stack */}
                    {messages.map((msg) => (
                      <div key={msg.id} className="flex flex-col gap-2">
                        <div
                          className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed animate-in fade-in slide-in-from-bottom-2 ${
                            msg.sender === "user"
                              ? "self-end bg-white/[0.06] border border-white/[0.08] text-white rounded-br-none"
                              : "self-start bg-transparent text-zinc-200 rounded-bl-none pl-0"
                          }`}
                        >
                          {parseMarkdown(msg.text)}
                        </div>

                        {/* Interactive Call Sheet Embed */}
                        {msg.callSheet && (
                          <div className="self-start w-full max-w-[350px] border border-white/[0.08] rounded-xl bg-zinc-900/60 p-4 space-y-4 shadow-xl animate-in zoom-in-95 duration-300 font-sans text-xs">
                            <div className="flex justify-between items-start border-b border-white/[0.06] pb-2">
                              <div>
                                <span className="text-[9px] tracking-wide text-[#8ECAFF] font-medium">Apparel Campaign</span>
                                <h4 className="font-medium text-white text-sm">Shoot Day 1</h4>
                              </div>
                              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium uppercase">Active</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 font-mono text-[10px]">
                              <div>
                                <span className="text-zinc-500 block">Crew Call</span>
                                <span className="text-white font-medium">08:30 AM</span>
                              </div>
                              <div>
                                <span className="text-zinc-500 block">General Call</span>
                                <span className="text-white font-medium">07:00 AM</span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-zinc-500 block">Main Location</span>
                                <span className="text-white font-medium">Stage A Booking, Flatiron NYC</span>
                              </div>
                            </div>
                            <div className="border-t border-white/[0.06] pt-3 flex justify-between items-center text-[10px] text-zinc-400">
                              <span>Weather: Sunny, 75°F</span>
                              <span className="text-[#8ECAFF] font-semibold flex items-center gap-1">Linked Work Order ✓</span>
                            </div>
                          </div>
                        )}

                        {/* Interactive Work Order Embed */}
                        {msg.workOrder && (
                          <div className="self-start w-full max-w-[340px] border border-white/[0.08] rounded-xl bg-zinc-900/60 p-4 space-y-3 shadow-xl animate-in zoom-in-95 duration-300 font-sans text-xs">
                            <div className="flex justify-between items-center border-b border-white/[0.06] pb-2">
                              <span className="font-medium text-white">Work Order: CLT-202</span>
                              <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">Scheduled</span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-zinc-400">
                                <span>Assignee:</span>
                                <span className="text-white">Jordan M. (Gaffer)</span>
                              </div>
                              <div className="flex justify-between text-zinc-400">
                                <span>Project:</span>
                                <span className="text-white">Apparel Brand Campaign</span>
                              </div>
                              <div className="flex justify-between text-zinc-400">
                                <span>Timeline:</span>
                                <span className="text-white">June 18 - June 20</span>
                              </div>
                              <div className="flex justify-between text-zinc-400">
                                <span>Day Rate:</span>
                                <span className="text-white font-mono">$1,200 / day</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Interactive ROM Budget Embed */}
                        {msg.budget && (
                          <div className="self-start w-full max-w-[340px] border border-white/[0.08] rounded-xl bg-zinc-900/60 p-4 space-y-3 shadow-xl animate-in zoom-in-95 duration-300 font-sans text-xs">
                            <div className="border-b border-white/[0.06] pb-2">
                              <span className="text-[10px] text-zinc-500 uppercase font-semibold">Rough Order of Magnitude</span>
                              <h4 className="font-medium text-white text-sm">Apparel Campaign ROM</h4>
                            </div>
                            <div className="space-y-2.5 font-mono text-xs">
                              <div className="flex justify-between text-zinc-400">
                                <span>1. Creative Roster:</span>
                                <span className="text-white">$5,100</span>
                              </div>
                              <div className="flex justify-between text-zinc-400">
                                <span>2. Assets & Equipment:</span>
                                <span className="text-white">$4,000</span>
                              </div>
                              <div className="flex justify-between text-zinc-400">
                                <span>3. Direct Payout Fees (1.5%):</span>
                                <span className="text-white">$136</span>
                              </div>
                              <div className="flex justify-between items-center text-sm font-semibold border-t border-white/[0.06] pt-2 mt-2 text-[#8ECAFF]">
                                <span className="font-sans">Total Estimate:</span>
                                <span>$9,236</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Streaming Text Container */}
                    {isStreaming && streamingText && (
                      <div className="max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed self-start bg-transparent text-zinc-200 rounded-bl-none pl-0">
                        {parseMarkdown(streamingText)}
                      </div>
                    )}

                    {/* Spinner Status */}
                    {isGenerating && !isStreaming && (
                      <div className="self-start flex items-center gap-2.5 text-xs text-zinc-400 py-2 ">
                        <span className="w-3.5 h-3.5 border border-white/20 border-t-[#8ECAFF] rounded-full animate-spin shrink-0" />
                        <span>Formulating response...</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Chat Input Area (Charcoal Rounded Border) */}
              <div className="p-3 border-t border-white/[0.08] bg-[#0c0c0c] flex flex-col font-sans">
                
                {/* Input Frame */}
                <div className="bg-[#121212] border border-[#262626] rounded-xl flex flex-col p-2 gap-1.5 focus-within:border-zinc-700 transition">
                  <textarea
                    ref={textareaRef}
                    data-lenis-prevent
                    value={inputVal}
                    onChange={(e) => {
                      setInputVal(e.target.value);
                      handleInputHeight();
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask ABRAM..."
                    rows={1}
                    disabled={isGenerating || isStreaming}
                    className="w-full bg-transparent border-none outline-none text-[#fafaf9] text-xs px-2 py-1.5 resize-none h-[36px] max-h-[120px] overflow-y-auto placeholder:text-zinc-600 scrollbar-none"
                  />
                  
                  {/* Bottom Controls Row inside input box */}
                  <div className="flex items-center justify-between border-t border-white/[0.03] pt-2 px-1">
                    
                    {/* Skills Selector Dropdown */}
                    <div className="flex items-center gap-1 text-[10px] text-zinc-400 bg-white/[0.02] border border-white/[0.05] rounded-lg px-2.5 py-1 hover:bg-white/[0.05] transition cursor-pointer">
                      <Sparkles className="w-3 h-3 text-[#8ECAFF]" />
                      <span className="font-semibold text-zinc-300">Skills</span>
                      <ChevronDown className="w-3 h-3 text-zinc-500" />
                    </div>

                    {/* Meta stats and Send Button */}
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-zinc-600 select-none">0</span>
                      <Paperclip className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300 transition cursor-pointer" />
                      <button
                        onClick={() => handleSend(inputVal)}
                        disabled={!inputVal.trim() || isGenerating || isStreaming}
                        className="w-6.5 h-6.5 rounded-full bg-white text-black hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer transition"
                        aria-label="Send message"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                </div>

                {/* Bottom Disclaimer */}
                <div className="text-[9px] text-zinc-600 text-center select-none leading-relaxed">
                  ABRAM uses AI and can make mistakes. Please double-check responses.
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
