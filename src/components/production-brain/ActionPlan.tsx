"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, FileText, Users, ClipboardList, Send, RotateCcw } from "lucide-react";
import AbramMark from "@/components/AbramMark";

type StepStatus = "idle" | "running" | "done";

interface PlanStep {
  icon: typeof FileText;
  label: string;
  detail: string;
  runLabel: string;
  stamp: string;
}

const STEPS: PlanStep[] = [
  {
    icon: FileText,
    label: "Drafting call sheet",
    detail: "Day 4 · Onyx Stage 4",
    runLabel: "Drafting call sheet",
    stamp: "07:04:02",
  },
  {
    icon: ClipboardList,
    label: "Breaking down script",
    detail: "2 scenes · 3 cast tags",
    runLabel: "Breaking down script",
    stamp: "07:04:05",
  },
  {
    icon: Users,
    label: "Staffing crew member",
    detail: "Vesper Lin · Director of Photography",
    runLabel: "Staffing crew member",
    stamp: "07:04:09",
  },
  {
    icon: Send,
    label: "Sending to crew",
    detail: "14 recipients · call times attached",
    runLabel: "Saving to knowledge base",
    stamp: "07:04:12",
  },
];

const STEP_DELAY = 900;

export default function ActionPlan() {
  const [phase, setPhase] = useState<"pending" | "running" | "done">("pending");
  const [statuses, setStatuses] = useState<StepStatus[]>(() => STEPS.map(() => "idle"));
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => clearTimers, []);

  const approve = () => {
    if (phase !== "pending") return;
    setPhase("running");

    STEPS.forEach((_, i) => {
      // start running
      timers.current.push(
        setTimeout(() => {
          setStatuses((prev) => {
            const next = [...prev];
            next[i] = "running";
            return next;
          });
        }, i * STEP_DELAY)
      );
      // mark done
      timers.current.push(
        setTimeout(() => {
          setStatuses((prev) => {
            const next = [...prev];
            next[i] = "done";
            return next;
          });
          if (i === STEPS.length - 1) setPhase("done");
        }, i * STEP_DELAY + STEP_DELAY - 120)
      );
    });
  };

  const reset = () => {
    clearTimers();
    setPhase("pending");
    setStatuses(STEPS.map(() => "idle"));
  };

  const statusLabel =
    phase === "pending" ? "Awaiting approval" : phase === "running" ? "Executing" : "Completed";

  return (
    <div className="max-w-lg mx-auto w-full">
      <div className="glass-panel rounded-2xl p-5 sm:p-6 select-none">
        {/* Header */}
        <div className="flex items-center gap-2.5 pb-4 border-b border-white/5">
          <AbramMark size={16} />
          <span className="text-sm font-semibold tracking-tight text-zinc-100 font-sans">
            Proposed action plan
          </span>
          <span
            className={`ml-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-semibold tracking-[0.15em] uppercase font-sans ${
              phase === "done"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                : phase === "running"
                  ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                  : "border-white/8 bg-white/[0.03] text-zinc-500"
            }`}
          >
            {phase === "running" && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
            {statusLabel}
          </span>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 py-3 text-[10px] text-zinc-500 font-sans">
          <span className="text-zinc-400 font-medium">Helix shoot</span>
          <span className="w-1 h-1 rounded-full bg-zinc-700" />
          <span>Day 4</span>
          <span className="w-1 h-1 rounded-full bg-zinc-700" />
          <span>{STEPS.length} steps</span>
          <span className="ml-auto uppercase tracking-[0.15em] text-zinc-600">
            {statuses.filter((s) => s === "done").length}/{STEPS.length} done
          </span>
        </div>

        {/* Actions */}
        <ul className="space-y-2.5">
          {STEPS.map((action, i) => {
            const Icon = action.icon;
            const status = statuses[i];
            return (
              <li
                key={action.label}
                className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors duration-300 ${
                  status === "running"
                    ? "border-amber-400/25 bg-amber-500/[0.04]"
                    : status === "done"
                      ? "border-emerald-400/20 bg-emerald-500/[0.03]"
                      : "border-white/5 bg-white/[0.02]"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-200 font-sans truncate">
                    {status === "running" ? action.runLabel : action.label}
                  </p>
                  <p className="text-xs text-zinc-500 font-sans truncate">
                    {status === "done" ? `Completed · ${action.stamp}` : action.detail}
                  </p>
                </div>
                <div className="shrink-0 w-6 flex items-center justify-end">
                  <AnimatePresence mode="wait" initial={false}>
                    {status === "done" ? (
                      <motion.span
                        key="done"
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-400/30"
                      >
                        <Check className="w-3 h-3 text-emerald-300" />
                      </motion.span>
                    ) : status === "running" ? (
                      <motion.span
                        key="run"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="wait"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-2 h-2 rounded-full bg-zinc-600"
                      />
                    )}
                  </AnimatePresence>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 pt-4 mt-4 border-t border-white/5">
          {phase === "done" ? (
            <p className="text-xs text-emerald-400 font-sans flex items-center gap-1.5 min-w-0">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">4 actions completed · sent to 14 crew</span>
            </p>
          ) : (
            <p className="text-xs text-zinc-500 font-sans">
              {phase === "running" ? "Running your approved steps" : "Nothing runs until you approve it."}
            </p>
          )}
          <button
            type="button"
            onClick={phase === "done" ? reset : approve}
            disabled={phase === "running"}
            className="btn-glass rounded-full px-4 py-1.5 text-xs inline-flex items-center gap-1.5 shrink-0 min-h-[44px] sm:min-h-0 disabled:opacity-40 disabled:pointer-events-none"
          >
            {phase === "done" ? (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </>
            ) : phase === "running" ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Executing
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                Approve
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
