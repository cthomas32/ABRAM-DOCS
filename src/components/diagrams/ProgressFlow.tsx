"use client";

import React from "react";
import * as LucideIcons from "lucide-react";
import { motion } from "framer-motion";

export interface ProgressStep {
  title: string;
  description?: string;
  icon?: string;
  status?: "completed" | "active" | "pending";
}

interface ProgressFlowProps {
  steps: ProgressStep[];
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

export default function ProgressFlow({ steps }: ProgressFlowProps) {
  if (!steps || !Array.isArray(steps)) {
    return <div className="text-zinc-500 text-xs">ProgressFlow: No steps data provided</div>;
  }

  return (
    <div className="my-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 w-full">
      {steps.map((step, index) => {
        const Icon = getIconComponent(step.icon);
        const isActive = step.status === "active";
        const isCompleted = step.status === "completed";
        
        let borderClass = "border-zinc-800/80";
        let bgClass = "bg-zinc-950/20";
        let glowClass = "";
        let badgeClass = "bg-zinc-900 border-zinc-800 text-zinc-500";
        let textClass = "text-zinc-500";
        let iconClass = "text-zinc-500";

        if (isActive) {
          borderClass = "border-purple-500/30";
          bgClass = "bg-purple-950/10";
          glowClass = "shadow-[0_0_20px_rgba(168,85,247,0.1)]";
          badgeClass = "bg-purple-500/20 border-purple-500/40 text-purple-300";
          textClass = "text-zinc-200";
          iconClass = "text-purple-400";
        } else if (isCompleted) {
          borderClass = "border-emerald-500/20";
          bgClass = "bg-emerald-950/5";
          glowClass = "shadow-[0_0_15px_rgba(22,110,63,0.05)]";
          badgeClass = "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
          textClass = "text-zinc-300";
          iconClass = "text-emerald-400";
        }

        return (
          <React.Fragment key={index}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              whileHover={{ 
                y: -2, 
                borderColor: isActive ? "rgba(168,85,247,0.5)" : isCompleted ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.1)" 
              }}
              className={`flex-1 min-w-0 glass-panel ${borderClass} ${bgClass} ${glowClass} rounded-xl p-5 border relative overflow-hidden transition-all duration-200 flex flex-col gap-3`}
            >
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 animate-pulse" />
              )}

              <div className="flex items-center justify-between gap-3">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeClass}`}>
                  Step {index + 1}
                </span>
                <Icon size={18} className={iconClass} />
              </div>
              <div>
                <h4 className={`text-sm font-semibold tracking-tight ${isActive ? "text-white" : "text-zinc-200"}`}>
                  {step.title}
                </h4>
                {step.description && (
                  <p className="text-xs text-zinc-400 leading-normal mt-1.5 font-light">
                    {step.description}
                  </p>
                )}
              </div>
            </motion.div>

            {index < steps.length - 1 && (
              <div className="flex items-center justify-center shrink-0 self-center">
                <LucideIcons.ChevronRight className="hidden md:block w-5 h-5 text-zinc-700" />
                <LucideIcons.ChevronDown className="md:hidden w-5 h-5 text-zinc-700 my-1" />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
