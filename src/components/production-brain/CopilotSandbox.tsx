"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Paperclip,
  Send,
  Globe,
  ChevronDown,
  ChevronUp,
  FileText,
  FileSpreadsheet,
  Check,
  Loader2,
  Sparkles,
  X,
  FileUp,
  RotateCcw,
  ArrowUp,
  Plus,
  Minus,
  Maximize2,
  Play
} from "lucide-react";

// Document Interface
interface Document {
  id: string;
  name: string;
  category: string;
  status: "complete" | "processing";
  wordCount: string;
  uploadDate: string;
}

// Chat Message Interface
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
    title: string;
    steps: string[];
    status: "pending" | "approved" | "cancelled";
  };
}

// Initial Documents
const initialDocuments: Document[] = [
  {
    id: "doc-1",
    name: "ABRAM_Brand_Voice_v2.1.pdf",
    category: "Brand Guidelines",
    status: "complete",
    wordCount: "4,250 words",
    uploadDate: "June 12, 2026"
  },
  {
    id: "doc-2",
    name: "Crew_Onboarding_Standard_v4.docx",
    category: "Onboarding Sheets",
    status: "complete",
    wordCount: "1,820 words",
    uploadDate: "June 14, 2026"
  },
  {
    id: "doc-3",
    name: "Cast_Release_Form_Template.pdf",
    category: "Onboarding Sheets",
    status: "complete",
    wordCount: "940 words",
    uploadDate: "June 15, 2026"
  },
  {
    id: "doc-4",
    name: "Stage_4_Site_Spec_Safety.pdf",
    category: "Location Guides",
    status: "complete",
    wordCount: "3,110 words",
    uploadDate: "June 10, 2026"
  },
  {
    id: "doc-5",
    name: "Brooklyn_Warehouse_Permits.pdf",
    category: "Location Guides",
    status: "processing",
    wordCount: "Calculating...",
    uploadDate: "June 17, 2026"
  },
  {
    id: "doc-6",
    name: "Camera_Rigging_Manifest_Final.xlsx",
    category: "Equipment Lists",
    status: "complete",
    wordCount: "5,620 words",
    uploadDate: "June 16, 2026"
  },
  {
    id: "doc-7",
    name: "Transport_Catering_Directory_NY.xlsx",
    category: "Vendor Contacts",
    status: "complete",
    wordCount: "1,200 words",
    uploadDate: "June 15, 2026"
  }
];

export default function CopilotSandbox() {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [activeTab, setActiveTab] = useState<string>("Brand Guidelines");
  const [inputValue, setInputValue] = useState<string>("");
  const [isWebSearchActive, setIsWebSearchActive] = useState<boolean>(false);
  const [showPaperclipDropdown, setShowPaperclipDropdown] = useState<boolean>(false);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);
  
  // Tracking current draft info for the active simulation
  const [newDraftDocId, setNewDraftDocId] = useState<string | null>(null);
  const [newDraftDocName, setNewDraftDocName] = useState<string>("");
  const [executedPrompts, setExecutedPrompts] = useState<string[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<number | null>(null);

  const welcomeMessage: ChatMessage = {
    id: "welcome",
    role: "assistant",
    content: "Welcome to the ABRAM Co-pilot Sandbox. I have access to your active workspace memory. You can ask me to synthesize brand onboarding material, audit rigging gear budgets, or draft transportation SLAs. Click a suggested prompt below to begin a live simulation."
  };

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([welcomeMessage]);

  const categories = [
    "Brand Guidelines",
    "Onboarding Sheets",
    "Location Guides",
    "Equipment Lists",
    "Vendor Contacts"
  ];

  const suggestedPrompts = [
    {
      id: "prompt-1",
      text: "Synthesize brand guidelines and format onboarding PDF",
    },
    {
      id: "prompt-2",
      text: "Audit equipment list against budget constraints",
    },
    {
      id: "prompt-3",
      text: "Generate vendor agreement draft for crew transportation",
    }
  ];

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  };

  // Helper lists for simulation
  const getLogsForPrompt = (promptId: string) => {
    switch (promptId) {
      case "prompt-1":
        return [
          "Searching workspace for 'ABRAM_Brand_Voice_v2.1.pdf'...",
          "Analyzing 'Crew_Onboarding_Standard_v4.docx' templates...",
          "Synthesizing corporate identity markers with crew standards...",
          "Formatting layout structures & compiling PDF draft..."
        ];
      case "prompt-2":
        return [
          "Parsing 'Camera_Rigging_Manifest_Final.xlsx'...",
          "Cross-referencing rates with equipment budget sheet...",
          "Detecting duplicate rig entries on Day 3...",
          "Compiling audit rate card variance report..."
        ];
      case "prompt-3":
        return [
          "Accessing 'Transport_Catering_Directory_NY.xlsx' directory...",
          "Querying historic vendor SLAs for New York county...",
          "Applying transport safety liability templates...",
          "Formulating pick-up grace thresholds and fuel schedules..."
        ];
      default:
        return [
          "Parsing query parameters...",
          "Indexing project directories...",
          "Structuring workspace summary..."
        ];
    }
  };

  const getResponseForPrompt = (promptId: string) => {
    switch (promptId) {
      case "prompt-1":
        return "I've successfully synthesized the ABRAM brand voice guidelines with the standard crew onboarding sheet. A new PDF draft, 'Onboarding_Voice_Guidelines.pdf', has been generated in your workspace under 'Onboarding Sheets'. I have adjusted the tone of voice to align with your guidelines and updated standard terminology. Please review the action plan below and approve to finalize the file in the project directory.";
      case "prompt-2":
        return "I've completed an audit of the rigging manifest. I compared the items in 'Camera_Rigging_Manifest_Final.xlsx' against your budget limits. I detected a duplicate rigging package on Day 3 (-$1,200.00) and a 15% rate surcharge on the transmitter rental (-$350.00). I've drafted an audit report ('Equipment_Audit_Report.pdf') and proposed cost corrections. Approve the plan to save these changes.";
      case "prompt-3":
        return "I have compiled a Service Level Agreement (SLA) template draft for New York transit vendors. I cross-referenced your vendor contacts directory and historical location contracts to structure pickup windows, default liability thresholds, and cancellation clauses. Please review and approve to compile the final SLA document.";
      default:
        return "I've processed your custom query. I scanned the project directory and verified the current guidelines. Let me know if you would like me to draft a specific onboarding sheet, audit equipment configurations, or compile agreements based on this.";
    }
  };

  const getActionPlanForPrompt = (promptId: string) => {
    switch (promptId) {
      case "prompt-1":
        return [
          "Apply brand identity structure (Tone: Professional-Empathetic)",
          "Format document layout (12 pages, compiled PDF)",
          "Deploy document directly to 'Onboarding Sheets' category"
        ];
      case "prompt-2":
        return [
          "Remove duplicate camera rigging package (-$1,200.00)",
          "Apply corrected rate card to transmitter rental (-$350.00)",
          "Export updated manifest as 'Camera_Rigging_Manifest_Final_v2.xlsx'"
        ];
      case "prompt-3":
        return [
          "Set default pickup liability threshold at $500,000",
          "Establish 15-minute grace threshold for location transfers",
          "Publish 'NY_Transport_SLA_Draft.pdf' to vendor contacts directory"
        ];
      default:
        return [];
    }
  };

  const handlePromptClick = (promptText: string, promptId: string) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setExecutedPrompts((prev) => [...prev, promptId]);

    // 1. Add User Message
    const userMsgId = `user-${Date.now()}`;
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: promptText
    };

    setInputValue("");
    setShowPaperclipDropdown(false);

    // 2. Set Active Tab and Insert Draft Document in Processing State
    let targetTab = "Brand Guidelines";
    let draftDocId = `draft-${Date.now()}`;
    let draftDocName = "";

    if (promptId === "prompt-1") {
      targetTab = "Onboarding Sheets";
      draftDocName = "Onboarding_Voice_Guidelines.pdf";
    } else if (promptId === "prompt-2") {
      targetTab = "Equipment Lists";
      draftDocName = "Equipment_Audit_Report.pdf";
    } else if (promptId === "prompt-3") {
      targetTab = "Vendor Contacts";
      draftDocName = "NY_Transport_SLA_Draft.pdf";
    }

    setActiveTab(targetTab);
    setNewDraftDocId(draftDocId);
    setNewDraftDocName(draftDocName);

    // Insert draft document into state
    const newDoc: Document = {
      id: draftDocId,
      name: draftDocName,
      category: targetTab,
      status: "processing",
      wordCount: "Calculating...",
      uploadDate: "June 17, 2026"
    };
    setDocuments((prev) => [...prev, newDoc]);

    // 3. Insert Assistant Message with empty content but thinking state
    const assistantMsgId = `assistant-${Date.now()}`;
    const newAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      thinking: {
        logs: [],
        isExpanded: true,
        isFinished: false
      }
    };

    setChatHistory((prev) => [...prev, newUserMsg, newAssistantMsg]);

    const logsList = getLogsForPrompt(promptId);
    const responseText = getResponseForPrompt(promptId);
    const actionPlanSteps = getActionPlanForPrompt(promptId);

    let currentLogIdx = 0;

    // Stream logs one by one
    const logInterval = setInterval(() => {
      if (currentLogIdx < logsList.length) {
        const nextLog = logsList[currentLogIdx];
        setChatHistory((prev) => {
          return prev.map((msg) => {
            if (msg.id === assistantMsgId && msg.thinking) {
              return {
                ...msg,
                thinking: {
                  ...msg.thinking,
                  logs: [...msg.thinking.logs, nextLog]
                }
              };
            }
            return msg;
          });
        });
        currentLogIdx++;
      } else {
        clearInterval(logInterval);

        // Mark logs finished and auto-collapse to focus on text stream
        setChatHistory((prev) => {
          return prev.map((msg) => {
            if (msg.id === assistantMsgId && msg.thinking) {
              return {
                ...msg,
                thinking: {
                  ...msg.thinking,
                  isFinished: true,
                  isExpanded: false
                }
              };
            }
            return msg;
          });
        });

        // Start typing out response text
        streamResponseText(assistantMsgId, responseText, actionPlanSteps);
      }
    }, 600);
  };

  const streamResponseText = (msgId: string, text: string, actionSteps: string[]) => {
    const words = text.split(" ");
    let wordIdx = 0;
    let currentText = "";

    const typeInterval = setInterval(() => {
      if (wordIdx < words.length) {
        currentText += (wordIdx === 0 ? "" : " ") + words[wordIdx];
        setChatHistory((prev) => {
          return prev.map((msg) => {
            if (msg.id === msgId) {
              return {
                ...msg,
                content: currentText
              };
            }
            return msg;
          });
        });
        wordIdx++;
      } else {
        clearInterval(typeInterval);

        // Add action plan card once typed out
        setChatHistory((prev) => {
          return prev.map((msg) => {
            if (msg.id === msgId) {
              return {
                ...msg,
                actionPlan: {
                  title: "Action Plan Steps",
                  steps: actionSteps,
                  status: "pending"
                }
              };
            }
            return msg;
          });
        });

        setIsAnimating(false);
      }
    }, 45); // Typing speed
  };

  const handleSendCustomInput = () => {
    if (!inputValue.trim() || isAnimating) return;

    const text = inputValue;
    setIsAnimating(true);

    const userMsgId = `user-${Date.now()}`;
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: text
    };

    setInputValue("");
    setShowPaperclipDropdown(false);

    const assistantMsgId = `assistant-${Date.now()}`;
    const newAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      thinking: {
        logs: [],
        isExpanded: true,
        isFinished: false
      }
    };

    setChatHistory((prev) => [...prev, newUserMsg, newAssistantMsg]);

    const logsList = [
      "Parsing query string...",
      "Querying local vector database...",
      "Generating contextual response..."
    ];
    const responseText = `I've analyzed your custom prompt: "${text}". I have searched your active directories. While I don't have a configured automated action for this input, you can use the suggestions below to compile onboarding voice guidelines, audit rigging sheets, or draft contracts. Let me know how you would like me to assist.`;

    let currentLogIdx = 0;
    const logInterval = setInterval(() => {
      if (currentLogIdx < logsList.length) {
        const nextLog = logsList[currentLogIdx];
        setChatHistory((prev) => {
          return prev.map((msg) => {
            if (msg.id === assistantMsgId && msg.thinking) {
              return {
                ...msg,
                thinking: {
                  ...msg.thinking,
                  logs: [...msg.thinking.logs, nextLog]
                }
              };
            }
            return msg;
          });
        });
        currentLogIdx++;
      } else {
        clearInterval(logInterval);

        setChatHistory((prev) => {
          return prev.map((msg) => {
            if (msg.id === assistantMsgId && msg.thinking) {
              return {
                ...msg,
                thinking: {
                  ...msg.thinking,
                  isFinished: true,
                  isExpanded: false
                }
              };
            }
            return msg;
          });
        });

        streamResponseText(assistantMsgId, responseText, []);
      }
    }, 600);
  };

  const handleApproveAction = (msgId: string) => {
    // 1. Update action plan status to approved
    setChatHistory((prev) => {
      return prev.map((msg) => {
        if (msg.id === msgId && msg.actionPlan) {
          return {
            ...msg,
            actionPlan: {
              ...msg.actionPlan,
              status: "approved"
            }
          };
        }
        return msg;
      });
    });

    // 2. Set the draft document in the Canvas to complete & resolve word count
    setDocuments((prev) => {
      return prev.map((doc) => {
        if (doc.id === newDraftDocId) {
          let wordCountResult = "2,480 words";
          if (doc.name === "Equipment_Audit_Report.pdf") {
            wordCountResult = "1,150 words";
          } else if (doc.name === "NY_Transport_SLA_Draft.pdf") {
            wordCountResult = "3,200 words";
          }

          return {
            ...doc,
            status: "complete",
            wordCount: wordCountResult
          };
        }
        // Special interaction: if rigging manifest audit approved, rename primary rigging list
        if (doc.name === "Camera_Rigging_Manifest_Final.xlsx" && newDraftDocName === "Equipment_Audit_Report.pdf") {
          return {
            ...doc,
            name: "Camera_Rigging_Manifest_Final_v2.xlsx",
            uploadDate: "June 17, 2026"
          };
        }
        return doc;
      });
    });

    // 3. Add success confirmation text in chat
    const successMsgId = `assistant-success-${Date.now()}`;
    let successText = `✓ Action approved. 'Onboarding_Voice_Guidelines.pdf' has been compiled and saved to Onboarding Sheets.`;
    if (newDraftDocName === "Equipment_Audit_Report.pdf") {
      successText = `✓ Action approved. 'Equipment_Audit_Report.pdf' has been generated and 'Camera_Rigging_Manifest_Final_v2.xlsx' has been saved.`;
    } else if (newDraftDocName === "NY_Transport_SLA_Draft.pdf") {
      successText = `✓ Action approved. 'NY_Transport_SLA_Draft.pdf' has been published to Vendor Contacts.`;
    }

    setChatHistory((prev) => [
      ...prev,
      {
        id: successMsgId,
        role: "assistant",
        content: successText
      }
    ]);

    showToast("Action approved & workspace saved");
  };

  const handleCancelAction = (msgId: string) => {
    // 1. Update action plan status to cancelled
    setChatHistory((prev) => {
      return prev.map((msg) => {
        if (msg.id === msgId && msg.actionPlan) {
          return {
            ...msg,
            actionPlan: {
              ...msg.actionPlan,
              status: "cancelled"
            }
          };
        }
        return msg;
      });
    });

    // 2. Remove the draft document from workspace
    setDocuments((prev) => prev.filter((doc) => doc.id !== newDraftDocId));

    // 3. Add cancellation message
    const cancelMsgId = `assistant-cancel-${Date.now()}`;
    setChatHistory((prev) => [
      ...prev,
      {
        id: cancelMsgId,
        role: "assistant",
        content: `✗ Action cancelled. Draft '${newDraftDocName}' discarded.`
      }
    ]);

    showToast("Action cancelled & draft deleted");
  };

  const resetSandbox = () => {
    if (isAnimating) return;
    setDocuments(initialDocuments);
    setActiveTab("Brand Guidelines");
    setChatHistory([welcomeMessage]);
    setInputValue("");
    setIsWebSearchActive(false);
    setShowPaperclipDropdown(false);
    setNewDraftDocId(null);
    setNewDraftDocName("");
    setExecutedPrompts([]);
    showToast("Sandbox reset to initial state");
  };

  const toggleThinkingExpansion = (msgId: string) => {
    setChatHistory((prev) => {
      return prev.map((msg) => {
        if (msg.id === msgId && msg.thinking) {
          return {
            ...msg,
            thinking: {
              ...msg.thinking,
              isExpanded: !msg.thinking.isExpanded
            }
          };
        }
        return msg;
      });
    });
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

  const handleNestedScrollTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartRef.current = e.touches[0].clientY;
  };

  const handleNestedScrollTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartRef.current === null) return;

    const container = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const currentY = e.touches[0].clientY;
    const deltaY = touchStartRef.current - currentY;

    const canScrollUp = scrollTop > 0 && deltaY < 0;
    const canScrollDown = scrollTop + clientHeight < scrollHeight - 1 && deltaY > 0;

    if (canScrollUp || canScrollDown) {
      e.stopPropagation();
    }
  };

  return (
    <div className="w-full font-sans">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-20 left-1/2 -translate-x-1/2 px-4 py-2 bg-zinc-900/90 border border-white/10 text-white text-[10px] sm:text-xs font-semibold tracking-wider rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.5)] z-50 flex items-center gap-2 backdrop-blur-md font-sans"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid wrapper stacked on mobile, side-by-side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side: Chat Panel */}
        <div className="col-span-1 lg:col-span-5 flex flex-col h-[600px] sm:h-[680px] lg:h-[750px] bg-[#141414] rounded-2xl border border-[#27272a] overflow-hidden shadow-2xl relative font-sans">
          
          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#27272a] shrink-0">
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
            <div className="flex items-center gap-4 text-[#52525b]">
              <Minus className="w-4 h-4 cursor-pointer hover:text-[#e4e4e7] transition-colors" />
              <Maximize2 className="w-3.5 h-3.5 cursor-pointer hover:text-[#e4e4e7] transition-colors" />
              <X 
                onClick={resetSandbox}
                className="w-4 h-4 cursor-pointer hover:text-[#e4e4e7] transition-colors" 
              />
            </div>
          </div>

          {/* Chat Messages Log */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-none"
            onWheel={handleNestedScrollWheel}
            onTouchStart={handleNestedScrollTouchStart}
            onTouchMove={handleNestedScrollTouchMove}
          >
            {chatHistory.map((message, idx) => (
              <div key={message.id || idx} className="w-full">
                
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
                    <div className="flex items-center gap-1 mb-1.5">
                      <span className="text-[#52525b] text-[13px] font-medium">ABRAM Agent</span>
                      <Play className="w-2.5 h-2.5 text-[#52525b] fill-current" />
                    </div>

                    {/* Thinking Panel Replica (Agent Operations style) */}
                    {(() => {
                      const thinking = message.thinking;
                      if (!thinking || thinking.logs.length === 0) return null;
                      return (
                        <div className="w-full flex flex-col items-start mt-2">
                          <div className="flex flex-col gap-1.5 mb-3 bg-[#141414]/30 border border-[#27272a]/40 rounded-lg p-2.5 w-fit min-w-[240px]">
                            <div 
                              onClick={() => toggleThinkingExpansion(message.id)}
                              className="text-[10px] uppercase tracking-wider text-[#52525b] font-mono mb-1 font-semibold flex items-center gap-2 cursor-pointer select-none hover:text-zinc-400"
                            >
                              <span>Agent Operations</span>
                              {thinking.isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 text-[#52525b]" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-[#52525b]" />
                              )}
                            </div>
                            
                            {thinking.isExpanded && (
                              <div className="space-y-1.5">
                                {thinking.logs.map((log, lIdx) => {
                                  const isCompleted = thinking.isFinished || lIdx < thinking.logs.length - 1;
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
                                {!thinking.isFinished && (
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
                      );
                    })()}

                    {/* Main text content */}
                    {message.content && (
                      <div className="text-[#e4e4e7] text-[14px] sm:text-[15px] font-sans font-normal leading-relaxed max-w-full">
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
                              onClick={() => handleApproveAction(message.id)}
                              className="btn-primary min-h-[44px] sm:min-h-[36px] px-5 py-2 text-xs flex-1 rounded-full font-bold flex items-center justify-center bg-white text-black hover:bg-zinc-200 transition-colors select-none cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleCancelAction(message.id)}
                              className="btn-ghost min-h-[44px] sm:min-h-[36px] px-4 py-2 text-xs flex-1 rounded-full border border-white/5 hover:border-white/15 text-zinc-400 hover:text-white transition-colors flex items-center justify-center select-none cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : message.actionPlan.status === "approved" ? (
                          <div className="text-emerald-400 font-semibold text-xs mt-1 flex items-center gap-1.5">
                            <Check className="w-4 h-4" />
                            Action approved & saved to project
                          </div>
                        ) : (
                          <div className="text-zinc-500 font-semibold text-xs mt-1 flex items-center gap-1.5">
                            <X className="w-4 h-4" />
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
            {!isAnimating && suggestedPrompts.some(p => !executedPrompts.includes(p.id)) && (
              <div className="mb-4 space-y-2 animate-fade-in">
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-2 block font-sans">
                  Suggested Scenarios
                </div>
                {suggestedPrompts
                  .filter((prompt) => !executedPrompts.includes(prompt.id))
                  .map((prompt) => (
                    <button
                      key={prompt.id}
                      onClick={() => handlePromptClick(prompt.text, prompt.id)}
                      className="w-full text-left p-3 rounded-xl border border-[#27272a] bg-[#27272a]/10 hover:border-white/10 hover:bg-[#27272a]/20 transition-all cursor-pointer min-h-[44px] flex items-center justify-between gap-3 text-xs font-normal text-zinc-300 hover:text-white"
                    >
                      <span>{prompt.text}</span>
                      <Sparkles className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    </button>
                  ))}
              </div>
            )}

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
                    handleSendCustomInput();
                  }
                }}
                disabled={isAnimating}
                placeholder="Ask ABRAM..."
                className="w-full bg-transparent border-none text-[#e4e4e7] placeholder:text-[#52525b] text-[14px] leading-relaxed resize-none focus:outline-none min-h-[40px] py-1"
                rows={1}
              />

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  
                  {/* Skills Button */}
                  <button
                    onClick={() => setShowPaperclipDropdown(!showPaperclipDropdown)}
                    disabled={isAnimating}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-[#27272a] transition-colors text-[#a1a1aa] cursor-pointer disabled:opacity-30"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Skills</span>
                    <ChevronDown className="w-3 h-3 ml-0.5" />
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
                        ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 font-semibold shadow-[0_0_15px_rgba(6,182,212,0.15)] animate-pulse"
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
                    aria-label="Attach files"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  
                  {/* Send Button */}
                  <button
                    onClick={handleSendCustomInput}
                    disabled={!inputValue.trim() || isAnimating}
                    className="p-1.5 bg-[#27272a] rounded-md transition-colors text-[#e4e4e7] hover:bg-[#3f3f46] disabled:opacity-30 disabled:hover:bg-[#27272a] cursor-pointer"
                    aria-label="Send message"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Artifact Canvas */}
        <div className="col-span-1 lg:col-span-7 flex flex-col h-[600px] sm:h-[680px] lg:h-[750px] bg-zinc-950/20 backdrop-blur-md rounded-2xl border border-white/5 p-4 sm:p-6 overflow-hidden shadow-xl">
          
          {/* Header */}
          <div>
            <h2 className="text-zinc-50 font-bold text-base sm:text-lg tracking-tight font-sans">
              Artifact Canvas
            </h2>
            <p className="text-zinc-500 text-xs mt-1 font-sans">
              Active workspace memory & indexable documents
            </p>
          </div>

          {/* Swipe Hint for categories tabs (Mobile viewports only) */}
          <div className="text-[9px] text-zinc-600 tracking-wider uppercase mt-4 mb-1 select-none flex items-center gap-1.5 lg:hidden font-sans">
            Swipe categories <span className="animate-pulse">→</span>
          </div>

          {/* Category Tabs */}
          <div className="flex border-b border-white/5 overflow-x-auto scrollbar-none flex-nowrap mt-1 shrink-0">
            {categories.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 px-4 text-xs font-semibold whitespace-nowrap min-h-[44px] flex items-center shrink-0 border-b-2 select-none cursor-pointer transition-all ${
                    isActive
                      ? "text-white border-white font-semibold"
                      : "text-zinc-500 border-transparent hover:text-zinc-300 hover:border-white/5 font-medium"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Documents display area */}
          <div
            className="flex-1 overflow-y-auto mt-6 pr-1 space-y-4"
            onWheel={handleNestedScrollWheel}
            onTouchStart={handleNestedScrollTouchStart}
            onTouchMove={handleNestedScrollTouchMove}
          >
            <AnimatePresence mode="popLayout">
              {documents
                .filter((doc) => doc.category === activeTab)
                .map((doc) => {
                  const isSpreadsheet = doc.name.endsWith(".xlsx") || doc.name.endsWith(".xls");
                  
                  return (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="glass-panel glass-panel-hover rounded-xl p-4 border border-white/5 flex flex-col justify-between gap-4 relative overflow-hidden select-none"
                    >
                      {/* Top metadata row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 bg-white/[0.02] border border-white/5 rounded-lg text-zinc-400 shrink-0">
                            {isSpreadsheet ? (
                              <FileSpreadsheet className="w-4 h-4" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-zinc-100 font-semibold text-xs sm:text-sm truncate max-w-[160px] sm:max-w-[240px] md:max-w-[320px] font-sans">
                              {doc.name}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-[10px] text-zinc-500 font-sans">
                                {doc.wordCount}
                              </span>
                              <span className="w-1 h-1 rounded-full bg-zinc-700" />
                              <span className="text-[10px] text-zinc-500 font-sans">
                                {doc.uploadDate}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0">
                          {doc.status === "complete" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] uppercase tracking-wider font-semibold font-sans">
                              <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                              complete
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] uppercase tracking-wider font-semibold font-sans animate-pulse">
                              <Loader2 className="w-3 h-3 text-amber-400 animate-spin shrink-0" />
                              processing
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bottom action row */}
                      <div className="flex items-center justify-between border-t border-white/5 pt-3">
                        <span className="text-[9px] font-bold text-zinc-600 tracking-wider uppercase font-sans">
                          ID: {doc.id}
                        </span>
                        
                        <button
                          onClick={() => showToast(`Opening inspector for ${doc.name}`)}
                          className="btn-ghost px-3 py-1.5 text-[10px] text-zinc-400 hover:text-white transition-colors border border-white/5 hover:border-white/10 rounded-lg uppercase tracking-wider font-semibold font-sans min-h-[44px] sm:min-h-0 flex items-center justify-center cursor-pointer select-none"
                        >
                          Inspect File
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
            </AnimatePresence>

            {documents.filter((doc) => doc.category === activeTab).length === 0 && (
              <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-500 border border-dashed border-white/5 rounded-xl bg-white/[0.01]">
                <FileText className="w-8 h-8 text-zinc-700 mb-2" />
                <p className="text-xs text-zinc-500 font-sans">
                  No documents found under this category.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
