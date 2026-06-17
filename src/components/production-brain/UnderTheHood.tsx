"use client";

import React, { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { 
  Database, 
  Cpu, 
  Lock, 
  Terminal as TerminalIcon, 
  Check, 
  Sparkles,
  Zap,
  ShieldCheck,
  Code
} from "lucide-react";
import { revealVariants, ease } from "@/lib/motion";

type SectionType = "vector-search" | "smart-caching" | "data-isolation";

export default function UnderTheHood() {
  const [activeSection, setActiveSection] = useState<SectionType>("vector-search");
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 });

  const specs = [
    {
      id: "vector-search" as SectionType,
      icon: Database,
      badge: "Indexing",
      title: "Vector Similarity Search",
      description: "High-performance 384-dimensional dense vector embeddings match historical knowledge nodes, crew profiles, and project guidelines in real-time.",
      details: [
        "Sub-50ms query and scoring latency",
        "Cosine similarity matching algorithm",
        "Sparse & dense hybrid retrieval system"
      ]
    },
    {
      id: "smart-caching" as SectionType,
      icon: Cpu,
      badge: "Optimization",
      title: "Smart Prompt Caching",
      description: "Intelligent caching matches repetitive context inputs. Reads from prompt cache are billed at a heavily discounted rate to maximize efficiency.",
      details: [
        "Reads billed at ~10% of standard cost",
        "Initial cache writes priced at ~125%",
        "Up to 85% cost reduction for iterative agents"
      ]
    },
    {
      id: "data-isolation" as SectionType,
      icon: Lock,
      badge: "Security",
      title: "Isolated Security Architecture",
      description: "Cryptographically partitioned workspaces ensure your studio guidelines, rosters, and financial benchmarks remain completely private.",
      details: [
        "Strictly zero data leakage between profiles",
        "Workspace data is never used to train public models",
        "Enterprise-grade AES-256 transit and rest encryption"
      ]
    }
  ];

  return (
    <div
      ref={sectionRef}
      className="relative w-full bg-transparent overflow-hidden flex flex-col items-center justify-center font-sans"
    >
      {/* Background Ambient Blurs */}
      <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[280px] md:w-[600px] h-[280px] md:h-[400px] bg-[#8ECAFF]/[0.015] rounded-full blur-[80px] md:blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 translate-x-1/2 translate-y-1/2 w-[280px] md:w-[600px] h-[280px] md:h-[400px] bg-[#CE1C1C]/[0.015] rounded-full blur-[80px] md:blur-[120px] pointer-events-none" />

      <div className="w-full max-w-5xl mx-auto px-6 z-10">
        
        {/* Core Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:items-stretch items-start">
          
          {/* Left Block: Interactive Specs */}
          <div className="lg:col-span-5 flex flex-col gap-4 order-2 lg:order-1">
            {specs.map((spec, index) => {
              const Icon = spec.icon;
              const isActive = activeSection === spec.id;
              
              return (
                <motion.div
                  key={spec.id}
                  variants={revealVariants}
                  initial="hidden"
                  animate={isInView ? "visible" : "hidden"}
                  custom={0.3 + index * 0.1}
                  onClick={() => setActiveSection(spec.id)}
                  className={`group relative flex flex-col rounded-2xl p-5 md:p-6 cursor-pointer transition-all duration-300 border text-left ${
                    isActive 
                      ? "bg-zinc-900/30 border-white/10 shadow-lg shadow-black/40" 
                      : "bg-zinc-950/20 border-white/5 hover:border-white/10 hover:bg-zinc-900/10"
                  }`}
                >
                  {/* Subtle active status indicator glow */}
                  {isActive && (
                    <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-zinc-400/30 to-transparent" />
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 border ${
                      isActive 
                        ? "bg-white/[0.06] border-white/15 text-white" 
                        : "bg-white/[0.02] border-white/5 text-zinc-400 group-hover:text-zinc-300"
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    <span className={`text-[9px] font-medium tracking-widest uppercase px-2 py-0.5 rounded-full border transition-all duration-300 ${
                      isActive 
                        ? "bg-white/[0.05] border-white/10 text-white" 
                        : "bg-white/[0.02] border-white/5 text-zinc-500"
                    }`}>
                      {spec.badge}
                    </span>
                  </div>

                  <h3 className={`text-base font-semibold tracking-tight transition-colors duration-200 ${
                    isActive ? "text-white" : "text-zinc-200 group-hover:text-white"
                  }`}>
                    {spec.title}
                  </h3>

                  <p className="text-xs font-normal leading-relaxed text-zinc-400 mt-2">
                    {spec.description}
                  </p>

                  {/* Expandable Specifications Details List */}
                  <AnimatePresence initial={false}>
                    {isActive && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-white/[0.04] space-y-2">
                          {spec.details.map((detail, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                                isActive ? "bg-white/10" : "bg-white/[0.03]"
                              }`}>
                                <Check className={`w-2 h-2 ${isActive ? "text-zinc-200" : "text-zinc-500"}`} />
                              </div>
                              <span className={`text-[11px] transition-colors ${
                                isActive ? "text-zinc-300" : "text-zinc-500 group-hover:text-zinc-400"
                              }`}>
                                {detail}
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* Right Block: Terminal Mockup */}
          <div className="lg:col-span-7 order-1 lg:order-2 lg:h-full flex flex-col">
            <div className="relative w-full lg:h-full rounded-2xl border border-white/5 bg-zinc-950/40 p-2 md:p-3 tech-grid-overlay flex flex-col">
              
              {/* Decorative side accent flare */}
              <div className="absolute top-0 right-1/4 w-32 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              
              {/* Terminal Window */}
              <div className="w-full lg:h-full rounded-xl border border-white/8 bg-zinc-950 shadow-2xl overflow-hidden flex flex-col font-mono text-xs">
                
                {/* Terminal Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/60 border-b border-white/5 select-none">
                  
                  {/* Mac style dots */}
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                  </div>

                  {/* Window Title */}
                  <div className="text-[10px] text-zinc-500 font-medium tracking-wide flex items-center gap-1.5">
                    <TerminalIcon className="w-3.5 h-3.5 text-zinc-600" />
                    <span>bash - abram-brain-daemon</span>
                  </div>

                  {/* Empty spacer for alignment */}
                  <div className="w-[38px]" />
                </div>

                {/* Terminal Tabs */}
                <div className="flex bg-zinc-950 border-b border-white/5 text-[10px] text-zinc-500">
                  {specs.map((spec) => {
                    const isActive = activeSection === spec.id;
                    return (
                      <button
                        key={spec.id}
                        onClick={() => setActiveSection(spec.id)}
                        className={`flex items-center gap-1.5 px-4 py-2 border-r border-white/5 transition-all duration-200 cursor-pointer ${
                          isActive 
                            ? "bg-zinc-900/40 text-zinc-300 font-semibold border-b-2 border-b-zinc-400" 
                            : "hover:bg-zinc-900/10 hover:text-zinc-400"
                        }`}
                      >
                        <Code className="w-3 h-3 text-zinc-600" />
                        <span>{spec.id.replace("-", "_")}.py</span>
                      </button>
                    );
                  })}
                </div>

                {/* Terminal Content Screen */}
                <div className="p-4 md:p-6 min-h-[360px] max-h-[380px] lg:min-h-0 lg:max-h-none lg:flex-1 overflow-y-auto text-zinc-300 leading-normal select-text scrollbar-thin">
                  <AnimatePresence mode="wait">
                    {activeSection === "vector-search" && (
                      <motion.div
                        key="vector-search"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        <div className="space-y-1">
                          <span className="text-zinc-500">&gt;&gt;&gt; </span>
                          <span className="text-[#8ECAFF]">from</span>
                          <span> abram.brain </span>
                          <span className="text-[#8ECAFF]">import</span>
                          <span> match_knowledge_nodes</span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-zinc-500">&gt;&gt;&gt; </span>
                          <span>query = </span>
                          <span className="text-[#CE1C1C]">"Find available commercial DP in NY with day rates under $800"</span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-zinc-500">&gt;&gt;&gt; </span>
                          <span>results = match_knowledge_nodes(query, limit=2, min_similarity=0.8)</span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-zinc-500">&gt;&gt;&gt; </span>
                          <span className="text-[#8ECAFF]">print</span>
                          <span>(results)</span>
                        </div>

                        <div className="pt-2 text-[11px] leading-relaxed text-zinc-400 overflow-x-auto whitespace-pre">
{`[`}
{`  {`}
{`    "node_id": "node_8f7b2c9a",`}
{`    "category": "crew_roster",`}
{`    "metadata": {`}
{`      "name": "Marcus Vance",`}
{`      "role": "Director of Photography",`}
{`      "location": "New York, NY",`}
{`      "day_rate": 750`}
{`    },`}
{`    "embedding_dimension": 384,`}
{`    "similarity_score": `}<span className="text-emerald-400 font-semibold">0.94125893</span>{`,`}
{`    "status": "matches_criteria"`}
{`  },`}
{`  {`}
{`    "node_id": "node_2a9c4e8f",`}
{`    "category": "crew_roster",`}
{`    "metadata": {`}
{`      "name": "Sarah Chen",`}
{`      "role": "Gaffer",`}
{`      "location": "Brooklyn, NY",`}
{`      "day_rate": 680`}
{`    },`}
{`    "embedding_dimension": 384,`}
{`    "similarity_score": `}<span className="text-emerald-400 font-semibold">0.88410294</span>{`,`}
{`    "status": "matches_criteria"`}
{`  }`}
{`]`}</div>
                      </motion.div>
                    )}

                    {activeSection === "smart-caching" && (
                      <motion.div
                        key="smart-caching"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        <div className="space-y-1">
                          <span className="text-zinc-500">$ </span>
                          <span>abram-cli brain stats --cache-details --workspace-id ws_prod_01</span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-zinc-500 border-b border-white/5 pb-2">
                          <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                          <span>Smart caching evaluation: active</span>
                        </div>

                        <div className="text-[11px] leading-relaxed text-zinc-400 overflow-x-auto whitespace-pre">
{`{`}
{`  "cache_status": "HIT",`}
{`  "stats": {`}
{`    "prompt_tokens": 4096,`}
{`    "cached_tokens": 3840,`}
{`    "uncached_tokens": 256`}
{`  },`}
{`  "billing_multiplier": {`}
{`    "cache_read_rate": `}<span className="text-emerald-400 font-semibold">0.10</span>{`,  // Billed at ~10% of standard rate`}
{`    "cache_write_rate": `}<span className="text-amber-500 font-semibold">1.25</span>{`, // First write billed at ~125%`}
{`    "cost_savings": "`}<span className="text-emerald-400 font-semibold">84.3%</span>{`"`}
{`  },`}
{`  "metrics": {`}
{`    "retrieval_latency_ms": 14.2,`}
{`    "cache_utilization_ratio": 0.9375`}
{`  }`}
{`]`}</div>
                      </motion.div>
                    )}

                    {activeSection === "data-isolation" && (
                      <motion.div
                        key="data-isolation"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        <div className="space-y-1">
                          <span className="text-zinc-500">$ </span>
                          <span>abram-cli auth verify-isolation --workspace-id ws_prod_01</span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-zinc-500 border-b border-white/5 pb-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Workspace isolation verification handshake complete.</span>
                        </div>

                        <div className="text-[11px] leading-relaxed text-zinc-400 overflow-x-auto whitespace-pre">
{`{`}
{`  "workspace_id": "ws_prod_01",`}
{`  "tenant_isolation": "ENABLED",`}
{`  "encryption": {`}
{`    "algorithm": "AES-256-GCM",`}
{`    "key_scope": "workspace_kms_key",`}
{`    "status": "verified"`}
{`  },`}
{`  "model_training_policy": {`}
{`    "opt_out_public_training": `}<span className="text-emerald-400 font-semibold">true</span>{`,`}
{`    "data_usage": "isolated_workspace_inference_only",`}
{`    "status": "`}<span className="text-emerald-400 font-semibold">enforced</span>{`"`}
{`  },`}
{`  "compliance": {`}
{`    "soc2": "compliant",`}
{`    "gdpr": "compliant",`}
{`    "data_boundary": "us-east-1"`}
{`  }`}
{`]`}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              {/* Background ambient glow behind terminal */}
              <div className="absolute -inset-1 rounded-2xl bg-white/[0.01] -z-10 blur-xl" />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
