"use client";

import React from "react";
import * as LucideIcons from "lucide-react";
import { motion } from "framer-motion";

interface FlowNode {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  type?: "default" | "success" | "warning" | "error" | "purple";
  badge?: string;
}

interface FlowStage {
  title?: string;
  nodes: FlowNode[];
}

interface StageFlowchartProps {
  stages: FlowStage[];
}

const getIconComponent = (iconName?: string) => {
  if (!iconName) return LucideIcons.HelpCircle;
  const icons = LucideIcons as any;
  const pascalName = iconName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
  return icons[pascalName] || icons[iconName] || LucideIcons.HelpCircle;
};

export default function StageFlowchart({ stages }: StageFlowchartProps) {
  if (!stages || !Array.isArray(stages)) {
    return <div className="text-zinc-500 text-xs">StageFlowchart: No stages data provided</div>;
  }

  return (
    <div className="my-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 w-full overflow-x-auto pb-4">
      {stages.map((stage, stageIndex) => (
        <React.Fragment key={stageIndex}>
          {/* Stage Column */}
          <div className="flex-1 flex flex-col gap-3 min-w-[200px]">
            {stage.title && (
              <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest text-center md:text-left mb-1">
                {stage.title}
              </span>
            )}
            <div className="flex flex-col gap-3">
              {stage.nodes.map((node) => {
                const Icon = getIconComponent(node.icon);
                
                let borderStyle = "border-zinc-800/80 bg-zinc-950/20";
                let glowStyle = "";
                let iconStyle = "text-zinc-400";
                let badgeStyle = "bg-zinc-800 border-zinc-700 text-zinc-400";

                if (node.type === "success") {
                  borderStyle = "border-emerald-500/20 bg-emerald-950/5";
                  glowStyle = "shadow-[0_0_15px_rgba(22,110,63,0.08)]";
                  iconStyle = "text-emerald-400";
                  badgeStyle = "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
                } else if (node.type === "warning") {
                  borderStyle = "border-orange-500/20 bg-orange-950/5";
                  glowStyle = "shadow-[0_0_15px_rgba(249,115,22,0.08)]";
                  iconStyle = "text-orange-400";
                  badgeStyle = "bg-orange-500/10 border-orange-500/30 text-orange-400";
                } else if (node.type === "error") {
                  borderStyle = "border-red-500/20 bg-red-950/5";
                  glowStyle = "shadow-[0_0_15px_rgba(239,68,68,0.08)]";
                  iconStyle = "text-red-400";
                  badgeStyle = "bg-red-500/10 border-red-500/30 text-red-400";
                } else if (node.type === "purple") {
                  borderStyle = "border-purple-500/20 bg-purple-950/5";
                  glowStyle = "shadow-[0_0_15px_rgba(168,85,247,0.08)]";
                  iconStyle = "text-purple-400";
                  badgeStyle = "bg-purple-500/10 border-purple-500/30 text-purple-400";
                }

                return (
                  <motion.div
                    key={node.id}
                    whileHover={{ y: -1, borderColor: "rgba(255,255,255,0.1)" }}
                    className={`glass-panel border rounded-xl p-3.5 flex items-start gap-3 transition-all duration-200 ${borderStyle} ${glowStyle}`}
                  >
                    {node.icon && (
                      <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0">
                        <Icon size={16} className={iconStyle} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-semibold text-zinc-200 truncate">{node.title}</h4>
                        {node.badge && (
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${badgeStyle}`}>
                            {node.badge}
                          </span>
                        )}
                      </div>
                      {node.description && (
                        <p className="text-[10px] text-zinc-400 leading-relaxed mt-1 font-light">
                          {node.description}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Connection Divider */}
          {stageIndex < stages.length - 1 && (
            <div className="flex items-center justify-center shrink-0 self-center">
              <LucideIcons.ChevronRight className="hidden md:block w-5 h-5 text-zinc-800" />
              <LucideIcons.ChevronDown className="md:hidden w-5 h-5 text-zinc-800 my-1" />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
