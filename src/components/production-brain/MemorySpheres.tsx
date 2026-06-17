"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Lock, Shield, Layers, Settings, Key } from "lucide-react";
import { revealVariants } from "@/lib/motion";

export default function MemorySpheres() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 });

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-transparent flex flex-col items-center justify-center font-sans"
    >
      {/* Background Ambient Blurs — Scaled down for mobile to prevent layout shifting */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[800px] h-[300px] md:h-[500px] bg-[#8ECAFF]/[0.02] rounded-full blur-[80px] md:blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[300px] md:w-[800px] h-[300px] md:h-[500px] bg-[#CE1C1C]/[0.02] rounded-full blur-[80px] md:blur-[120px] pointer-events-none" />

      <div className="w-full max-w-4xl mx-auto px-6 z-10">
        
        {/* Symmetrical, Blending Side-by-Side Cards (No surrounding boxes/borders) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-stretch">
          
          {/* Card 1: Private User Brain */}
          <motion.div
            variants={revealVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            custom={0.3}
            className="flex flex-col h-full"
          >
            <div className="flex flex-col justify-between h-full py-4 transition-all duration-300 group relative">
              <div>
                {/* Header Icon */}
                <div className="flex items-center justify-between mb-6">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
                    <Lock className="w-4.5 h-4.5 text-zinc-400" />
                  </div>
                  <span className="text-[9px] font-medium tracking-widest uppercase text-zinc-500 bg-white/[0.02] border border-white/5 px-2 py-0.5 rounded-full">
                    Private Scope
                  </span>
                </div>

                {/* Scope Title */}
                <h3 className="text-lg font-semibold tracking-tight text-zinc-100 mb-2.5">
                  Private User Memory
                </h3>

                {/* Scope Description */}
                <p className="text-xs font-normal leading-relaxed text-zinc-400 mb-6">
                  Your personal, encrypted environment. This memory is isolated to your profile, guaranteeing that personal preferences and private work records are completely hidden from the rest of the company.
                </p>

                {/* Core Concepts */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-4 h-4 mt-0.5 rounded flex items-center justify-center flex-shrink-0">
                      <Settings className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-200">Personal Preferences</h4>
                      <p className="text-[11px] text-zinc-400 leading-relaxed mt-0.5">
                        Custom interface styles, notification configurations, and editor display templates.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-4 h-4 mt-0.5 rounded flex items-center justify-center flex-shrink-0">
                      <Key className="w-3.5 h-3.5 text-[#8ECAFF]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-200">Private Drafts</h4>
                      <p className="text-[11px] text-zinc-400 leading-relaxed mt-0.5">
                        Personal scratchpads, draft specifications, and personal task lists.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-4 h-4 mt-0.5 rounded flex items-center justify-center flex-shrink-0">
                      <Lock className="w-3.5 h-3.5 text-[#8ECAFF]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-200">Individual Networks</h4>
                      <p className="text-[11px] text-zinc-400 leading-relaxed mt-0.5">
                        Personal contact directories and custom interaction logs.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Footer */}
              <div className="pt-4 mt-auto">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#8ECAFF] animate-pulse" />
                  <span className="text-[9px] font-semibold tracking-wider text-zinc-400 uppercase">
                    Personal Encryption Enabled
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Protected by secure credentials. Data is mathematically segmented, ensuring that team owners or platform administrators cannot view your workspace notes.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Company Brain */}
          <motion.div
            variants={revealVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            custom={0.4}
            className="flex flex-col h-full"
          >
            <div className="flex flex-col justify-between h-full py-4 transition-all duration-300 group relative">
              <div>
                {/* Header Icon */}
                <div className="flex items-center justify-between mb-6">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
                    <Shield className="w-4.5 h-4.5 text-[#CE1C1C]" />
                  </div>
                  <span className="text-[9px] font-medium tracking-widest uppercase text-zinc-500 bg-white/[0.02] border border-white/5 px-2 py-0.5 rounded-full">
                    Organization Scope
                  </span>
                </div>

                {/* Scope Title */}
                <h3 className="text-lg font-semibold tracking-tight text-zinc-100 mb-2.5">
                  Shared Company Memory
                </h3>

                {/* Scope Description */}
                <p className="text-xs font-normal leading-relaxed text-zinc-400 mb-6">
                  Your organization's central knowledge base. This memory is shared dynamically across authorized workspaces, maintaining consistent project context for active crew members.
                </p>

                {/* Core Concepts */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-4 h-4 mt-0.5 rounded flex items-center justify-center flex-shrink-0">
                      <Layers className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-200">Brand Guidelines</h4>
                      <p className="text-[11px] text-zinc-400 leading-relaxed mt-0.5">
                        Shared visual assets, design requirements, and marketing assets.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-4 h-4 mt-0.5 rounded flex items-center justify-center flex-shrink-0">
                      <Shield className="w-3.5 h-3.5 text-[#CE1C1C]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-200">Standard Procedures</h4>
                      <p className="text-[11px] text-zinc-400 leading-relaxed mt-0.5">
                        Interactive handbooks, standard operating procedures, and safety checklists.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-4 h-4 mt-0.5 rounded flex items-center justify-center flex-shrink-0">
                      <Settings className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-200">Location Manuals</h4>
                      <p className="text-[11px] text-zinc-400 leading-relaxed mt-0.5">
                        Pre-scouted venue directions, local permitting guidelines, and contact numbers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Footer */}
              <div className="pt-4 mt-auto">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#CE1C1C] animate-pulse" />
                  <span className="text-[9px] font-semibold tracking-wider text-zinc-400 uppercase">
                    Workspace-Bound Security
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Access is automatically controlled. Information is only queried and visible to active, verified team members linked to the workspace, automatically locking out external entities.
                </p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
