"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lock, 
  Unlock, 
  CheckCircle2, 
  Trash2, 
  Plus, 
  Landmark, 
  Shield, 
  HelpCircle,
  FileText,
  DollarSign,
  Clock,
  Sparkles,
  RefreshCw
} from "lucide-react";

interface InvoiceItem {
  id: string;
  description: string;
  amount: number;
}

const PRESET_ITEMS = [
  { label: "Alex K. (DP) - 3 Shoot Days", amount: 4500, category: "Creative" },
  { label: "Jordan M. (Gaffer) - 3 Shoot Days", amount: 3000, category: "Creative" },
  { label: "Sound Mixer - 3 Shoot Days", amount: 2400, category: "Creative" },
  { label: "Studio Booking - Stage A flat rate", amount: 2500, category: "Location" },
  { label: "Camera Package - ARRI Alexa LF", amount: 1500, category: "Equipment" }
];

type EscrowState = "draft" | "holding" | "routing" | "paid";

export default function PaymentsSection() {
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: "preset-dp", description: "Alex K. (DP) - 3 Shoot Days", amount: 4500 },
    { id: "preset-gaffer", description: "Jordan M. (Gaffer) - 3 Shoot Days", amount: 3000 },
    { id: "preset-sound", description: "Sound Mixer - 3 Shoot Days", amount: 2400 }
  ]);

  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");
  const [escrowState, setEscrowState] = useState<EscrowState>("draft");
  
  // Simulated timeline day count (for the 7-day milestone hold)
  const [holdDay, setHoldDay] = useState(1);
  const [routingProgress, setRoutingProgress] = useState(0);

  // Subtotal and Fee calculations
  const subtotal = items.reduce((acc, item) => acc + item.amount, 0);
  const platformFeeRate = 0.015; // 1.5%
  const processingFee = Math.round(subtotal * platformFeeRate * 100) / 100;
  const totalAmount = subtotal + processingFee;

  // Simulate progress when in "routing" state
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (escrowState === "routing") {
      setRoutingProgress(0);
      interval = setInterval(() => {
        setRoutingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setEscrowState("paid");
            }, 800);
            return 100;
          }
          return prev + 10;
        });
      }, 150);
    }
    return () => clearInterval(interval);
  }, [escrowState]);

  // Simulate milestone hold day change
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (escrowState === "holding") {
      setHoldDay(1);
      const incrementDay = () => {
        setHoldDay((prev) => {
          if (prev < 7) {
            timer = setTimeout(incrementDay, 2500); // cycle through days
            return prev + 1;
          }
          return prev;
        });
      };
      timer = setTimeout(incrementDay, 2500);
    }
    return () => clearTimeout(timer);
  }, [escrowState]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemDesc.trim() || !newItemAmount) return;
    const amountNum = parseFloat(newItemAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: newItemDesc.trim(),
      amount: Math.round(amountNum)
    };

    setItems([...items, newItem]);
    setNewItemDesc("");
    setNewItemAmount("");
  };

  const handleAddPreset = (preset: typeof PRESET_ITEMS[number]) => {
    if (escrowState !== "draft") return;
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: `${preset.label}`,
      amount: preset.amount
    };
    setItems([...items, newItem]);
  };

  const handleDeleteItem = (id: string) => {
    if (escrowState !== "draft") return;
    setItems(items.filter((item) => item.id !== id));
  };

  const handleInitiateHold = () => {
    if (items.length === 0) return;
    setEscrowState("holding");
  };

  const handleApproveDelivery = () => {
    setEscrowState("routing");
  };

  const handleReset = () => {
    setEscrowState("draft");
    setItems([
      { id: "preset-dp", description: "Alex K. (DP) - 3 Shoot Days", amount: 4500 },
      { id: "preset-gaffer", description: "Jordan M. (Gaffer) - 3 Shoot Days", amount: 3000 },
      { id: "preset-sound", description: "Sound Mixer - 3 Shoot Days", amount: 2400 }
    ]);
    setHoldDay(1);
    setRoutingProgress(0);
  };

  return (
    <section className="relative w-full py-24 md:py-32 border-t border-white/[0.08] bg-abram-black overflow-hidden selection:bg-zinc-800 selection:text-white">
      {/* Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/[0.025] rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#8ECAFF]/[0.03] rounded-full filter blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative z-10 space-y-12">
        {/* Header Block */}
        <div className="text-center space-y-4 max-w-lg mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/3 text-[#f5f5f3] text-xs font-semibold tracking-wider uppercase">
            Secured Financial Infrastructure
          </div>
          <h2 
            className="text-base md:text-lg font-medium text-white/90 tracking-wide leading-snug uppercase font-display"
          >
            Milestone Escrow &amp; <span className="text-[#8ECAFF] font-semibold">Direct Routing.</span>
          </h2>
          <p className="text-sm font-normal text-white/80 max-w-lg mx-auto leading-relaxed">
            Secure production budgets using automated milestone pre-authorizations and direct bank routing. Hold funds in escrow during creation, and release payouts instantly upon milestone approval.
          </p>
        </div>

        {/* Sandbox Board Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
          
          {/* LEFT: INVOICE BUILDER & LEDGER (7-cols on lg) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="border border-white/[0.08] rounded-xl bg-zinc-950/40 backdrop-blur-xl p-6 shadow-2xl">
              
              {/* Stripe Connect Precheck Alert Banner */}
              <div className="mb-6 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </div>
                  <span className="font-semibold text-emerald-400">Stripe Connect Ready:</span>
                  <span className="text-zinc-400">Roster accounts verified to receive direct payouts.</span>
                </div>
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/[0.04]">
                  acct_1N92X1B
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-[#8ECAFF]" />
                  <div>
                    <h3 className="text-sm font-semibold text-white">Project Payment Ledger</h3>
                    <p className="text-[10px] text-zinc-400">Milestone allocation registry</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold tracking-wide ${
                    escrowState === "draft" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                    escrowState === "holding" ? "bg-[#8ECAFF]/10 text-[#8ECAFF] border border-[#8ECAFF]/20 " :
                    escrowState === "routing" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20 " :
                    "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  }`}>
                    {escrowState === "draft" ? "Drafting" : 
                     escrowState === "holding" ? "Escrow Hold Active" : 
                     escrowState === "routing" ? "Routing Payout" : "Settled"}
                  </span>
                </div>
              </div>

              {/* Ledger Items Table */}
              <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                {items.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 text-xs">
                    No milestone nodes defined yet. Add a preset or custom line below.
                  </div>
                ) : (
                  items.map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs transition hover:bg-white/[0.03]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#8ECAFF]" />
                        <span className="text-zinc-300 font-medium">{item.description}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-white font-semibold font-mono">${item.amount.toLocaleString()}</span>
                        {escrowState === "draft" && (
                          <button 
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-zinc-500 hover:text-red-400 p-1 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Custom Form (Only in draft mode) */}
              {escrowState === "draft" && (
                <form onSubmit={handleAddItem} className="mt-4 pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row gap-3">
                  <input 
                    type="text" 
                    placeholder="Milestone description..."
                    value={newItemDesc}
                    onChange={(e) => setNewItemDesc(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8ECAFF]/50 transition"
                  />
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      placeholder="Cost ($)"
                      value={newItemAmount}
                      onChange={(e) => setNewItemAmount(e.target.value)}
                      className="w-24 bg-zinc-950 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8ECAFF]/50 font-mono transition"
                    />
                    <button 
                      type="submit"
                      className="bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-lg px-3.5 py-2 text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Preset quick buttons (Only in draft mode) */}
              {escrowState === "draft" && (
                <div className="mt-3">
                  <p className="text-[10px] text-zinc-500 tracking-wide mb-2 font-semibold">Quick-Add Presets</p>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_ITEMS.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAddPreset(preset)}
                        className="text-[10px] bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/15 rounded-md px-2 py-1 text-zinc-300 transition cursor-pointer"
                      >
                        +{preset.label} (${preset.amount})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary Block */}
              <div className="mt-6 pt-4 border-t border-white/[0.08] space-y-2 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Milestone Subtotal</span>
                  <span className="font-mono text-zinc-300">${subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span className="flex items-center gap-1">
                    Direct Payout Infrastructure Fee (1.5%)
                    <HelpCircle className="w-3 h-3 text-zinc-600" />
                  </span>
                  <span className="font-mono text-zinc-300">${processingFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-semibold border-t border-white/[0.04] pt-2 mt-2">
                  <span className="text-white">Escrow Authorized Hold</span>
                  <span className="font-mono text-[#8ECAFF]">${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6">
                {escrowState === "draft" ? (
                  <button 
                    onClick={handleInitiateHold}
                    disabled={items.length === 0}
                    className="w-full py-3 bg-[#8ECAFF] hover:bg-[#8ECAFF]/90 disabled:opacity-40 text-black text-xs font-semibold tracking-wide rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#8ECAFF]/10"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Lock Escrow &amp; Authorize Hold</span>
                  </button>
                ) : (
                  <button 
                    onClick={handleReset}
                    className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/[0.08] text-zinc-300 text-xs font-semibold tracking-wide rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Reset Ledger Demonstration</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: ESCROW & BANK ROUTING FLOW (5-cols on lg) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* ESCROW HOLD MODULE */}
            <div className="border border-white/[0.08] rounded-xl bg-zinc-950/40 backdrop-blur-xl p-6 shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-[#8ECAFF]" />
                <h3 className="text-xs font-semibold tracking-wide text-zinc-300">Milestone Hold Pipeline</h3>
              </div>

              <div className="space-y-6">
                
                {/* PIPELINE STEP 1: AUTHENTICATION / HOLD */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                      escrowState === "draft" ? "border-white/10 bg-zinc-900 text-zinc-600" :
                      escrowState === "holding" ? "border-[#8ECAFF] bg-[#8ECAFF]/10 text-[#8ECAFF] shadow-[0_0_12px_rgba(142,202,255,0.2)]" :
                      "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                    }`}>
                      {escrowState === "draft" ? (
                        <Lock className="w-4 h-4" />
                      ) : escrowState === "holding" ? (
                        <motion.div
                          animate={{ scale: [1, 1.15, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        >
                          <Lock className="w-4 h-4" />
                        </motion.div>
                      ) : (
                        <Unlock className="w-4 h-4" />
                      )}
                    </div>
                    <div className="w-0.5 h-12 bg-white/[0.06]" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-white">7-Day Pre-Authorization Hold</h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Funds are verified and locked in secure holding. Adjustments are permitted prior to milestone sign-off.
                    </p>
                    {escrowState === "holding" && (
                      <div className="mt-2 p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                        <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1.5 font-medium">
                          <span>Hold Timeline Progression</span>
                          <span className="text-[#8ECAFF] font-semibold">Day {holdDay} of 7</span>
                        </div>
                        <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                          <motion.div 
                            className="bg-[#8ECAFF] h-1 rounded-full"
                            initial={{ width: "14.28%" }}
                            animate={{ width: `${(holdDay / 7) * 100}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                        <div className="mt-2 text-[10px] text-[#8ECAFF]/90 flex items-center gap-1.5 font-medium">
                          <Clock className="w-3 h-3 text-[#8ECAFF]" />
                          <span>Pre-Authorized holding is fully secured.</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* PIPELINE STEP 2: REVIEW & APPROVE */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                      escrowState === "draft" ? "border-white/10 bg-zinc-900 text-zinc-600" :
                      escrowState === "holding" ? "border-amber-500/50 bg-amber-500/10 text-amber-400 cursor-pointer hover:bg-amber-500/20" :
                      "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                    }`}>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="w-0.5 h-12 bg-white/[0.06]" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <h4 className="text-xs font-semibold text-white">Deliverable Approval Sign-off</h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Review completed assets and approve release of held escrow funds to routing nodes.
                    </p>
                    {escrowState === "holding" && (
                      <div className="mt-2">
                        <button
                          onClick={handleApproveDelivery}
                          className="px-3.5 py-1.5 bg-[#8ECAFF] text-black font-semibold text-[10px] rounded-lg transition-all cursor-pointer tracking-wide flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Approve Deliverables &amp; Release</span>
                        </button>
                        <p className="text-[9px] text-zinc-500 mt-1">
                          Releases hold and transfers ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} to bank node
                        </p>
                      </div>
                    )}
                    {escrowState === "routing" && (
                      <div className="text-[10px] text-purple-400 mt-1 font-semibold flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Processing delivery release triggers...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* PIPELINE STEP 3: DIRECT BANK ROUTING */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                      escrowState === "paid" ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" :
                      escrowState === "routing" ? "border-purple-500 bg-purple-500/10 text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.2)]" :
                      "border-white/10 bg-zinc-900 text-zinc-600"
                    }`}>
                      <Landmark className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-white">Linked Bank Settlement</h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Instant transfer routing directly into linked checking routing structures.
                    </p>
                    
                    {/* Routing State Progress Indicator */}
                    {escrowState === "routing" && (
                      <div className="mt-2 p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                        <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1.5 font-medium">
                          <span>Bank Network Transfer</span>
                          <span className="text-purple-400 font-semibold">{routingProgress}%</span>
                        </div>
                        <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                          <motion.div 
                            className="bg-purple-500 h-1 rounded-full"
                            style={{ width: `${routingProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Paid / Final Payout Settlement State */}
                    {escrowState === "paid" && (
                      <div className="mt-2 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                        <div className="text-[10px] text-emerald-400 font-semibold mb-1.5 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Payout Complete &amp; Settled</span>
                        </div>
                        <div className="space-y-1 text-[9px] text-zinc-400 font-mono">
                          <div>Destination: Bank Account (****9281)</div>
                          <div>Reference: TXN-SECURE-8201B</div>
                          <div>Routed Value: ${subtotal.toLocaleString()}</div>
                          <div>Timestamp: {new Date().toLocaleDateString()} at 10:05 AM</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* VISUAL FLOW DIAGRAM NODE CARDS */}
            <div className="border border-white/[0.08] rounded-xl bg-zinc-950/40 backdrop-blur-xl p-5 shadow-2xl relative">
              <p className="text-[10px] text-zinc-500 tracking-wide font-semibold mb-3">Live Payout Routing View</p>
              
              <div className="flex flex-col gap-3 relative z-10">
                {/* Node 1: Depositor (Escrow source) */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-white/5 flex items-center justify-center">
                      <DollarSign className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-400 font-medium">Fund Depositor</div>
                      <div className="text-xs text-white font-semibold">Production Client</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-500 font-mono block">Status</span>
                    <span className="text-xs text-emerald-400 font-semibold">Funds Verified</span>
                  </div>
                </div>

                {/* Animated Connection Link */}
                <div className="h-6 flex items-center justify-center relative">
                  <div className="w-0.5 h-full bg-white/[0.06] absolute" />
                  {escrowState === "routing" && (
                    <motion.div 
                      className="w-1.5 h-1.5 bg-[#8ECAFF] rounded-full absolute"
                      animate={{ y: [-12, 12] }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                    />
                  )}
                  {escrowState === "paid" && (
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  )}
                </div>

                {/* Node 2: Escrow Hub */}
                <div className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  escrowState === "holding" ? "bg-[#8ECAFF]/5 border-[#8ECAFF]/30" :
                  escrowState === "paid" ? "bg-emerald-500/5 border-emerald-500/20" :
                  "bg-zinc-900/50 border-white/[0.06]"
                }`}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-white/5 flex items-center justify-center">
                      <Shield className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-400 font-medium">Secured Node</div>
                      <div className="text-xs text-white font-semibold">Milestone Escrow</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-500 font-mono block">Secured Balance</span>
                    <span className="text-xs text-white font-semibold font-mono">
                      ${escrowState === "draft" ? "0" : subtotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Animated Connection Link */}
                <div className="h-6 flex items-center justify-center relative">
                  <div className="w-0.5 h-full bg-white/[0.06] absolute" />
                  {escrowState === "routing" && (
                    <motion.div 
                      className="w-1.5 h-1.5 bg-purple-500 rounded-full absolute"
                      animate={{ y: [-12, 12] }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                    />
                  )}
                  {escrowState === "paid" && (
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  )}
                </div>

                {/* Node 3: Recipient Bank Node */}
                <div className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  escrowState === "paid" ? "bg-emerald-500/5 border-emerald-500/30" :
                  "bg-zinc-900/50 border-white/[0.06]"
                }`}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-white/5 flex items-center justify-center">
                      <Landmark className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-400 font-medium">Creator Destination</div>
                      <div className="text-xs text-white font-semibold">Connected Bank Node</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-500 font-mono block">Status</span>
                    <span className={`text-xs font-semibold ${
                      escrowState === "paid" ? "text-emerald-400" : "text-zinc-500"
                    }`}>
                      {escrowState === "paid" ? "Settled" : "Awaiting Release"}
                    </span>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>

        {/* Small Trust footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border border-white/[0.06] rounded-xl bg-zinc-950/20 text-zinc-500 text-[10px] sm:text-xs">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#8ECAFF]" />
            <span>Bank-grade encryption holds, direct payouts routing protocol.</span>
          </div>
          <div className="flex items-center gap-4">
            <span>PCI-DSS Compliant</span>
            <span>Zero Holding Fees</span>
          </div>
        </div>

      </div>
    </section>
  );
}
