"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import AbramMark from "@/components/AbramMark";

/* Track scale: $80k to $165k */
const SCALE_MIN = 80_000;
const SCALE_MAX = 165_000;

interface CatRange {
  min: number;
  max: number;
}

interface Stage {
  projects: number;
  romMin: number;
  romMax: number;
  confidence: number;
  insight: string;
  calibration: string;
  learned: string[];
  taskIntel: string[];
  categories: {
    labor: CatRange;
    gear: CatRange;
    post: CatRange;
  };
}

const STAGES: Stage[] = [
  {
    projects: 0,
    romMin: 86_000,
    romMax: 158_000,
    confidence: 58,
    insight: "No history yet. This range comes from standard rates alone.",
    calibration: "Awaiting first actuals to calibrate.",
    learned: [],
    taskIntel: [
      "Color grade · planned 12h from standard rates",
      "Editorial · planned 32h, no actuals logged yet",
      "Assignments · no staffing history yet",
    ],
    categories: {
      labor: { min: 40_000, max: 78_000 },
      gear: { min: 22_000, max: 46_000 },
      post: { min: 24_000, max: 52_000 },
    },
  },
  {
    projects: 6,
    romMin: 98_000,
    romMax: 139_000,
    confidence: 74,
    insight: "Post-production actuals ran 1.4x estimates. Range adjusted.",
    calibration: "Calibrated against 6 project actuals.",
    learned: ["Rate cards"],
    taskIntel: [
      "Color grade · planned 12h · actual 15h across 4 projects",
      "Maya Chen · staffed on 3 of your last 4 edit jobs",
    ],
    categories: {
      labor: { min: 46_000, max: 66_000 },
      gear: { min: 26_000, max: 40_000 },
      post: { min: 30_000, max: 44_000 },
    },
  },
  {
    projects: 12,
    romMin: 104_000,
    romMax: 126_000,
    confidence: 88,
    insight: "Actuals ran 1.35x estimates across 12 projects. Vendor costs learned.",
    calibration: "Calibrated against 12 project actuals.",
    learned: ["Rate cards", "Crew preferences", "Vendor costs"],
    taskIntel: [
      "Color grade · planned 12h · actual 16h across 6 projects",
      "3D animation · Vesper Lin delivers 1.1x faster than plan",
      "Maya Chen · staffed on 4 of your last 5 edit-heavy jobs",
    ],
    categories: {
      labor: { min: 50_000, max: 60_000 },
      gear: { min: 28_000, max: 36_000 },
      post: { min: 32_000, max: 40_000 },
    },
  },
  {
    projects: 24,
    romMin: 109_000,
    romMax: 118_000,
    confidence: 96,
    insight: "Crew rates, vendor costs, and edit timelines are fully calibrated.",
    calibration: "Calibrated against 24 project actuals.",
    learned: ["Rate cards", "Crew preferences", "Vendor costs", "Union parameters"],
    taskIntel: [
      "Color grade · planned 12h · actual 16h across 8 projects",
      "3D animation · Vesper Lin delivers 1.1x faster than plan",
      "Maya Chen · staffed on 4 of your last 5 edit-heavy jobs",
    ],
    categories: {
      labor: { min: 52_000, max: 57_000 },
      gear: { min: 30_000, max: 34_000 },
      post: { min: 34_000, max: 38_000 },
    },
  },
];

const LAST_ACTUAL = 112_400;

/* Local scales for the per-category mini range bars */
const CATEGORIES = [
  { key: "labor" as const, label: "Labor", scaleMin: 36_000, scaleMax: 82_000 },
  { key: "gear" as const, label: "Gear", scaleMin: 20_000, scaleMax: 50_000 },
  { key: "post" as const, label: "Post", scaleMin: 22_000, scaleMax: 56_000 },
];

function moneyK(value: number) {
  return `$${Math.round(value / 1000)}k`;
}

function pct(value: number) {
  return ((value - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100;
}

function money(value: number) {
  return `$${value.toLocaleString()}`;
}

export default function EstimateLearning() {
  const [stageIdx, setStageIdx] = useState(0);
  const stage = STAGES[stageIdx];
  const hasHistory = stage.projects > 0;

  return (
    <div className="w-full max-w-4xl mx-auto rounded-2xl border border-white/5 bg-zinc-950/40 p-5 sm:p-8 backdrop-blur-xl relative overflow-visible select-none">
      {/* Panel header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5 mb-6">
        <div className="flex items-center gap-2">
          <AbramMark size={16} />
          <span className="text-xs font-semibold text-zinc-200 font-sans">Horizon Campaign · ROM Estimate</span>
        </div>

        {/* Projects-in-memory stepper */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-semibold tracking-wider uppercase text-zinc-500 font-sans">
            Projects in memory
          </span>
          <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-zinc-950/40 p-1">
            {STAGES.map((s, i) => (
              <button
                key={s.projects}
                onClick={() => setStageIdx(i)}
                className={`rounded-full px-3 h-7 text-xs font-medium transition-colors duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                  i === stageIdx
                    ? "bg-white/[0.10] text-white border border-white/[0.20]"
                    : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                {s.projects}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ROM Range Bar */}
      <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-zinc-500 font-sans font-semibold">
        <span>ROM Min</span>
        <span>ROM Max</span>
      </div>
      <div className="relative h-14">
        {/* Track */}
        <div className="absolute top-1/2 -translate-y-1/2 w-full h-2 rounded-full bg-zinc-900 border border-white/5" />

        {/* Animated range */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 h-2 rounded-full bg-gradient-to-r from-zinc-300/70 via-white/80 to-zinc-300/70 shadow-[0_0_16px_rgba(255,255,255,0.15)]"
          animate={{
            left: `${pct(stage.romMin)}%`,
            width: `${pct(stage.romMax) - pct(stage.romMin)}%`,
          }}
          transition={{ type: "spring", stiffness: 170, damping: 26 }}
        />

        {/* Min label */}
        <motion.div
          className="absolute top-0 -translate-x-1/2 text-xs font-semibold text-white font-sans"
          animate={{ left: `${pct(stage.romMin)}%` }}
          transition={{ type: "spring", stiffness: 170, damping: 26 }}
        >
          {money(stage.romMin)}
        </motion.div>

        {/* Max label */}
        <motion.div
          className="absolute top-0 -translate-x-1/2 text-xs font-semibold text-white font-sans"
          animate={{ left: `${pct(stage.romMax)}%` }}
          transition={{ type: "spring", stiffness: 170, damping: 26 }}
        >
          {money(stage.romMax)}
        </motion.div>

        {/* Last actual marker */}
        <AnimatePresence>
          {hasHistory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-0 -translate-x-1/2 flex flex-col items-center"
              style={{ left: `${pct(LAST_ACTUAL)}%` }}
            >
              <div className="w-[2px] h-4 bg-emerald-400/80 rounded-full mb-1" />
              <span className="text-[9px] text-emerald-400 font-sans whitespace-nowrap">
                Last actual {money(LAST_ACTUAL)}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confidence + insight */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
        <div className="rounded-xl border border-white/5 bg-zinc-950/60 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-semibold tracking-wider uppercase text-zinc-500 font-sans">
              Confidence Score
            </span>
            <motion.span
              key={stage.confidence}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-sm font-bold font-sans ${stage.confidence >= 88 ? "text-emerald-400" : "text-zinc-200"}`}
            >
              {stage.confidence}%
            </motion.span>
          </div>
          <div className="h-1.5 rounded-full bg-zinc-900 border border-white/5 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${stage.confidence >= 88 ? "bg-emerald-400/80" : "bg-zinc-300/70"}`}
              animate={{ width: `${stage.confidence}%` }}
              transition={{ type: "spring", stiffness: 170, damping: 26 }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-zinc-950/60 p-4">
          <span className="text-[9px] font-semibold tracking-wider uppercase text-zinc-500 font-sans block mb-2">
            Brain Insight
          </span>
          <AnimatePresence mode="wait">
            <motion.p
              key={stage.insight}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="text-xs text-zinc-300 leading-relaxed font-sans"
            >
              {stage.insight}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Per-category breakdown */}
      <div className="mt-6 rounded-xl border border-white/5 bg-zinc-950/60 p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[9px] font-semibold tracking-wider uppercase text-zinc-500 font-sans">
            Category breakdown
          </span>
          <span className="text-[9px] text-zinc-600 font-sans">Ranges tighten with memory</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {CATEGORIES.map((cat) => {
            const range = stage.categories[cat.key];
            const span = cat.scaleMax - cat.scaleMin;
            const left = ((range.min - cat.scaleMin) / span) * 100;
            const width = ((range.max - range.min) / span) * 100;
            return (
              <div key={cat.key}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-medium text-zinc-300 font-sans">{cat.label}</span>
                  <motion.span
                    key={`${cat.key}-${range.min}-${range.max}`}
                    initial={{ opacity: 0, y: -3 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] text-zinc-500 font-sans tabular-nums"
                  >
                    {moneyK(range.min)} – {moneyK(range.max)}
                  </motion.span>
                </div>
                <div className="relative h-1.5 rounded-full bg-zinc-900 border border-white/5">
                  <motion.div
                    className="absolute top-0 h-full rounded-full bg-zinc-300/70"
                    animate={{ left: `${left}%`, width: `${width}%` }}
                    transition={{ type: "spring", stiffness: 170, damping: 26 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-white/5">
          <AbramMark size={12} />
          <AnimatePresence mode="wait">
            <motion.span
              key={stage.calibration}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.25 }}
              className="text-[10px] text-zinc-400 font-sans"
            >
              {stage.calibration}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* Task intelligence */}
      <div className="mt-6 rounded-xl border border-white/5 bg-zinc-950/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[9px] font-semibold tracking-wider uppercase text-zinc-500 font-sans">
            Task intelligence
          </span>
          <span className="text-[9px] text-zinc-600 font-sans">
            {hasHistory ? "Learned from your org history" : "Standard assumptions"}
          </span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={stageIdx}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="space-y-2"
          >
            {stage.taskIntel.map((row) => (
              <p key={row} className="text-xs text-zinc-300 leading-relaxed font-sans tabular-nums">
                {row}
              </p>
            ))}
          </motion.div>
        </AnimatePresence>
        <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-white/5">
          <AbramMark size={12} />
          <span className="text-[10px] text-zinc-400 font-sans">
            {hasHistory
              ? "Knows real task hours and who delivers them"
              : "Estimating from standard rates until actuals arrive"}
          </span>
        </div>
      </div>

      {/* Learned chips */}
      <div className="flex flex-wrap items-center gap-2 mt-5 min-h-[28px]">
        <AnimatePresence>
          {stage.learned.map((item) => (
            <motion.span
              key={item}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-zinc-300 font-sans"
            >
              <Check className="w-3 h-3 text-emerald-400" />
              {item}
            </motion.span>
          ))}
        </AnimatePresence>
        {!hasHistory && (
          <span className="text-[10px] text-zinc-600 font-sans">Nothing learned yet. Add completed projects.</span>
        )}
      </div>
    </div>
  );
}
