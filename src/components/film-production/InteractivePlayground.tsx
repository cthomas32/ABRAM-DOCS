"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  DollarSign, 
  Layers, 
  ArrowUp, 
  ArrowDown, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Sliders, 
  Grid, 
  List, 
  Play, 
  Info,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
   TYPE DEFINITIONS
   ───────────────────────────────────────────────────────────────────────────── */

export type TabType = 'stripboard' | 'dood' | 'budget';

export interface CastMember {
  id: string;
  name: string;
  role: string;
  color: string; // Theme-aligned highlight color (Tailwind-like color names)
}

export interface Scene {
  id: string;
  sceneNumber: string;
  setting: 'INT' | 'EXT';
  timeOfDay: 'DAY' | 'NIGHT' | 'DAWN' | 'DUSK';
  location: string;
  synopsis: string;
  pages: number; // Stored as decimal (e.g., 1.375 for 1 3/8)
  castIds: string[]; // Associated cast member IDs
}

export type StripboardItem =
  | { type: 'scene'; data: Scene }
  | { type: 'dayBreak'; dayNumber: number; id: string };

export interface BudgetVariable {
  key: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
}

export interface BudgetFormula {
  id: string;
  label: string;
  expression: string; // e.g., "=[SHOOTDAYS] * [CREW_COUNT] * [CREW_RATE]"
  description: string;
}

export type ActorStatus = 'S' | 'W' | 'H' | 'F' | 'SWF' | null;

export interface ActorDoodRow {
  actor: CastMember;
  days: Record<number, ActorStatus>;
  totalWorkDays: number;
  totalHoldDays: number;
  totalPaidDays: number;
}

/* ─────────────────────────────────────────────────────────────────────────────
   CALCULATOR FUNCTIONS & SAFE FORMULA EVALUATOR
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * Converts a decimal page length into standard film notation.
 * e.g., 1.375 -> "1 3/8", 0.5 -> "1/2", 3.0 -> "3"
 */
export function decimalToEighths(decimal: number): string {
  if (decimal <= 0) return '0';
  const integerPart = Math.floor(decimal);
  const fraction = decimal - integerPart;
  const eighths = Math.round(fraction * 8);

  const finalInteger = integerPart + (eighths === 8 ? 1 : 0);
  const finalEighths = eighths === 8 ? 0 : eighths;

  if (finalEighths === 0) {
    return `${finalInteger}`;
  }

  let fractionStr = `${finalEighths}/8`;
  if (finalEighths === 2) fractionStr = '1/4';
  else if (finalEighths === 4) fractionStr = '1/2';
  else if (finalEighths === 6) fractionStr = '3/4';

  if (finalInteger === 0) {
    return fractionStr;
  }

  return `${finalInteger} ${fractionStr}`;
}

/**
 * Formats decimal page count with correct singular/plural page indicators.
 */
export function formatEighths(decimal: number): string {
  const fraction = decimalToEighths(decimal);
  if (fraction === '0') return '0 pgs';
  return `${fraction} ${decimal <= 1 && fraction.indexOf('/') === -1 && fraction !== '0' ? 'pg' : 'pgs'}`;
}

/**
 * Parses standard film notation back into a clean decimal representation.
 * Supports: "1 3/8", "1/2", "3", "0.5"
 */
export function eighthsToDecimal(str: string): number {
  const clean = str.trim().replace(/\s*pgs?$/i, '');
  if (!clean) return 0;
  if (!isNaN(Number(clean))) return parseFloat(clean);

  const match = clean.match(/^(?:(\d+)\s+)?(\d+)\/(\d+)$/);
  if (match) {
    const whole = match[1] ? parseInt(match[1], 10) : 0;
    const num = parseInt(match[2], 10);
    const den = parseInt(match[3], 10);
    return whole + (den === 0 ? 0 : num / den);
  }
  return 0;
}

/**
 * Safely evaluates standard algebraic mathematical expressions with variables.
 * Supports: +, -, *, /, (, ), and bracketed variables: [SHOOTDAYS]
 */
export function safeMathEvaluate(expression: string, variables: Record<string, number>): number {
  let replacedExpr = expression.replace(/\[([^\]]+)\]/g, (match, key) => {
    return variables[key] !== undefined ? variables[key].toString() : '0';
  });

  const tokenRegex = /\d+(?:\.\d+)?|[+\-*/()]/g;
  const tokens = replacedExpr.match(tokenRegex) || [];

  if (tokens.length === 0) return 0;

  const outputQueue: string[] = [];
  const operatorStack: string[] = [];

  const precedence: Record<string, number> = {
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2,
  };

  for (const token of tokens) {
    if (!isNaN(Number(token))) {
      outputQueue.push(token);
    } else if (token === '(') {
      operatorStack.push(token);
    } else if (token === ')') {
      while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
        outputQueue.push(operatorStack.pop()!);
      }
      operatorStack.pop(); // Remove '('
    } else {
      while (
        operatorStack.length > 0 &&
        operatorStack[operatorStack.length - 1] !== '(' &&
        precedence[operatorStack[operatorStack.length - 1]] >= precedence[token]
      ) {
        outputQueue.push(operatorStack.pop()!);
      }
      operatorStack.push(token);
    }
  }

  while (operatorStack.length > 0) {
    outputQueue.push(operatorStack.pop()!);
  }

  const stack: number[] = [];
  for (const token of outputQueue) {
    if (!isNaN(Number(token))) {
      stack.push(parseFloat(token));
    } else {
      const right = stack.pop();
      const left = stack.pop();
      if (left === undefined || right === undefined) return 0;
      switch (token) {
        case '+': stack.push(left + right); break;
        case '-': stack.push(left - right); break;
        case '*': stack.push(left * right); break;
        case '/': stack.push(right === 0 ? 0 : left / right); break;
      }
    }
  }

  return stack[0] || 0;
}

/* ─────────────────────────────────────────────────────────────────────────────
   INITIAL MOCK DATA (Using fictitious brand/project names)
   ───────────────────────────────────────────────────────────────────────────── */

const INITIAL_CAST: CastMember[] = [
  { id: 'leo', name: 'Captain Leo', role: 'Lead Actor (Vesper Crew)', color: 'blue' },
  { id: 'lyra', name: 'Officer Lyra', role: 'Lead Actress (Vesper Crew)', color: 'emerald' },
  { id: 'jax', name: 'Jax Thorne', role: 'Supporting Pilot (Onyx Guild)', color: 'amber' },
  { id: 'nova', name: 'Nova Drone Tech', role: 'Day Player (Tech Guild)', color: 'purple' },
];

const INITIAL_SCENES: Scene[] = [
  {
    id: 'scene-1',
    sceneNumber: '1',
    setting: 'INT',
    timeOfDay: 'DAY',
    location: 'Spaceship Cockpit Set',
    synopsis: 'Captain Leo reviews navigation charts as sirens chirp. Officer Lyra enters with warnings.',
    pages: 1.5,
    castIds: ['leo', 'lyra'],
  },
  {
    id: 'scene-2',
    sceneNumber: '2',
    setting: 'EXT',
    timeOfDay: 'DAY',
    location: 'Onyx Plain Runway',
    synopsis: 'The shuttle touches down on the dusty obsidian plains of Onyx. Jax Thorne checks hull readings.',
    pages: 2.125,
    castIds: ['lyra', 'jax'],
  },
  {
    id: 'scene-3',
    sceneNumber: '3',
    setting: 'INT',
    timeOfDay: 'NIGHT',
    location: 'Vesper Habitation Pod',
    synopsis: 'Leo and Lyra argue heatedly over whether they should trust the air filtration readings.',
    pages: 0.875,
    castIds: ['leo', 'lyra'],
  },
  {
    id: 'scene-4',
    sceneNumber: '4',
    setting: 'EXT',
    timeOfDay: 'DUSK',
    location: 'Crater Ridge',
    synopsis: 'Officer Lyra spots a high-frequency anomaly blinking across the desolate crater fields.',
    pages: 1.25,
    castIds: ['lyra'],
  },
  {
    id: 'scene-5',
    sceneNumber: '5',
    setting: 'INT',
    timeOfDay: 'NIGHT',
    location: 'Spaceship Airlock Set',
    synopsis: 'Lyra and Jax seal the airlock. Leo override commands lock them in from the cockpit.',
    pages: 1.75,
    castIds: ['leo', 'lyra', 'jax', 'nova'],
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────────────────────────────────────── */

export default function InteractivePlayground() {
  const [activeTab, setActiveTab] = useState<TabType>('stripboard');
  const [viewMode, setViewMode] = useState<'card' | 'row'>('card');
  
  // State for scenes & items list
  const [cast, setCast] = useState<CastMember[]>(INITIAL_CAST);
  const [scenes, setScenes] = useState<Scene[]>(INITIAL_SCENES);
  const [stripboardItems, setStripboardItems] = useState<StripboardItem[]>(() => {
    const items: StripboardItem[] = [];
    let currentDay = 1;
    
    // Distribute day breaks to start with a realistic schedule
    INITIAL_SCENES.forEach((scene, idx) => {
      items.push({ type: 'scene', data: scene });
      if (idx === 1 || idx === 3) {
        items.push({ type: 'dayBreak', dayNumber: currentDay, id: `break-${idx}` });
        currentDay++;
      }
    });
    return items;
  });

  // State for Budget Variables
  const [crewCount, setCrewCount] = useState<number>(10);
  const [crewRate, setCrewRate] = useState<number>(450);
  const [gearRate, setGearRate] = useState<number>(800);
  const [actorRate, setActorRate] = useState<number>(600);

  // Quick form for adding a scene
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSceneNumber, setNewSceneNumber] = useState('');
  const [newSetting, setNewSetting] = useState<'INT' | 'EXT'>('INT');
  const [newTimeOfDay, setNewTimeOfDay] = useState<'DAY' | 'NIGHT' | 'DAWN' | 'DUSK'>('DAY');
  const [newLocation, setNewLocation] = useState('');
  const [newSynopsis, setNewSynopsis] = useState('');
  const [newPagesString, setNewPagesString] = useState('1');
  const [newCastIds, setNewCastIds] = useState<string[]>([]);

  // 1. Move Item Handler
  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= stripboardItems.length) return;

    const updated = [...stripboardItems];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Resequence day break indices in sequence
    let dayCount = 1;
    const finalItems = updated.map((item) => {
      if (item.type === 'dayBreak') {
        const revised = { ...item, dayNumber: dayCount };
        dayCount++;
        return revised;
      }
      return item;
    });

    setStripboardItems(finalItems);
  };

  // 2. Add Day Break Card
  const addDayBreak = (index: number) => {
    const updated = [...stripboardItems];
    const newBreak: StripboardItem = {
      type: 'dayBreak',
      dayNumber: 0, // reassigned below
      id: `break-${Date.now()}`,
    };
    updated.splice(index + 1, 0, newBreak);

    // Resequence
    let dayCount = 1;
    const finalItems = updated.map((item) => {
      if (item.type === 'dayBreak') {
        const revised = { ...item, dayNumber: dayCount };
        dayCount++;
        return revised;
      }
      return item;
    });

    setStripboardItems(finalItems);
  };

  // 3. Remove Item Card (Day Break or Scene)
  const removeItem = (index: number) => {
    const updated = [...stripboardItems];
    updated.splice(index, 1);

    // Resequence Day Breaks
    let dayCount = 1;
    const finalItems = updated.map((item) => {
      if (item.type === 'dayBreak') {
        const revised = { ...item, dayNumber: dayCount };
        dayCount++;
        return revised;
      }
      return item;
    });

    setStripboardItems(finalItems);
  };

  // 4. Create New Scene
  const handleCreateScene = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSceneNumber || !newLocation || !newSynopsis) return;

    const parsedPages = eighthsToDecimal(newPagesString) || 1.0;
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      sceneNumber: newSceneNumber,
      setting: newSetting,
      timeOfDay: newTimeOfDay,
      location: newLocation,
      synopsis: newSynopsis,
      pages: parsedPages,
      castIds: newCastIds,
    };

    setScenes((prev) => [...prev, newScene]);
    setStripboardItems((prev) => [...prev, { type: 'scene', data: newScene }]);
    
    // Reset form
    setNewSceneNumber('');
    setNewLocation('');
    setNewSynopsis('');
    setNewPagesString('1');
    setNewCastIds([]);
    setShowAddModal(false);
  };

  // 5. Toggle Cast Member in New Scene Form
  const toggleCastSelection = (id: string) => {
    setNewCastIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  /* ─────────────────────────────────────────────────────────────────────────────
     MEMOIZED RESOLUTION ALGORITHMS
     ───────────────────────────────────────────────────────────────────────────── */

  // Resolves scenes into shoot days
  const resolvedDaysData = useMemo(() => {
    const daySlices: { dayNumber: number; scenes: Scene[] }[] = [];
    let currentDayNumber = 1;
    let currentScenes: Scene[] = [];

    stripboardItems.forEach((item) => {
      if (item.type === 'scene') {
        currentScenes.push(item.data);
      } else if (item.type === 'dayBreak') {
        daySlices.push({
          dayNumber: currentDayNumber,
          scenes: currentScenes,
        });
        currentDayNumber = item.dayNumber + 1;
        currentScenes = [];
      }
    });

    // Capture final group
    daySlices.push({
      dayNumber: currentDayNumber,
      scenes: currentScenes,
    });

    return {
      daysCount: daySlices.length,
      daySlices,
    };
  }, [stripboardItems]);

  // Generates DOOD Matrix
  const doodData = useMemo(() => {
    const { daysCount, daySlices } = resolvedDaysData;
    
    // Map scene IDs to day index (1-based)
    const sceneToDayMap: Record<string, number> = {};
    daySlices.forEach((slice) => {
      slice.scenes.forEach((scene) => {
        sceneToDayMap[scene.id] = slice.dayNumber;
      });
    });

    // Track active days for each cast member
    const actorActiveDays: Record<string, Set<number>> = {};
    cast.forEach((actor) => {
      actorActiveDays[actor.id] = new Set<number>();
    });

    stripboardItems.forEach((item) => {
      if (item.type === 'scene') {
        const scheduledDay = sceneToDayMap[item.data.id];
        if (scheduledDay) {
          item.data.castIds.forEach((cId) => {
            if (actorActiveDays[cId]) {
              actorActiveDays[cId].add(scheduledDay);
            }
          });
        }
      }
    });

    const warnings: { actorId: string; actorName: string; holdCount: number; suggestion: string }[] = [];
    let totalCastPaidDays = 0;

    const matrix: ActorDoodRow[] = cast.map((actor) => {
      const activeSet = actorActiveDays[actor.id];
      const activeDaysList = Array.from(activeSet || []).sort((a, b) => a - b);
      
      const dayStatuses: Record<number, ActorStatus> = {};
      let workCount = 0;
      let holdCount = 0;

      if (activeDaysList.length > 0) {
        const firstDay = activeDaysList[0];
        const lastDay = activeDaysList[activeDaysList.length - 1];

        for (let d = 1; d <= daysCount; d++) {
          if (d < firstDay || d > lastDay) {
            dayStatuses[d] = null;
          } else if (firstDay === lastDay) {
            dayStatuses[d] = 'SWF'; // Starts, Works, Finishes on same day
            workCount++;
          } else if (d === firstDay) {
            dayStatuses[d] = 'S';
            workCount++;
          } else if (d === lastDay) {
            dayStatuses[d] = 'F';
            workCount++;
          } else {
            if (activeSet.has(d)) {
              dayStatuses[d] = 'W';
              workCount++;
            } else {
              dayStatuses[d] = 'H';
              holdCount++;
            }
          }
        }
      } else {
        // Unscheduled
        for (let d = 1; d <= daysCount; d++) {
          dayStatuses[d] = null;
        }
      }

      const totalPaid = workCount + holdCount;
      totalCastPaidDays += totalPaid;

      // Rule: Warning alert if consecutive or total hold counts are high
      if (holdCount >= 2) {
        warnings.push({
          actorId: actor.id,
          actorName: actor.name,
          holdCount,
          suggestion: `Try scheduling all scenes for ${actor.name} consecutively to eliminate the ${holdCount} hold days.`,
        });
      }

      return {
        actor,
        days: dayStatuses,
        totalWorkDays: workCount,
        totalHoldDays: holdCount,
        totalPaidDays: totalPaid,
      };
    });

    return {
      matrix,
      holdWarnings: warnings,
      totalCastPaidDays,
    };
  }, [cast, resolvedDaysData, stripboardItems]);

  // Evaluates Live Budget Variables & Formulas
  const budgetData = useMemo(() => {
    const shootDaysCount = resolvedDaysData.daysCount;
    const totalCastPaidDays = doodData.totalCastPaidDays;

    const variablesMap = {
      SHOOTDAYS: shootDaysCount,
      CREW_COUNT: crewCount,
      CREW_RATE: crewRate,
      EQUIPMENT_DAILY: gearRate,
      TOTAL_CAST_PAID_DAYS: totalCastPaidDays,
      ACTOR_RATE: actorRate,
    };

    // Calculate labor formula
    const laborFormula = '=[SHOOTDAYS] * [CREW_COUNT] * [CREW_RATE]';
    const laborCost = safeMathEvaluate(laborFormula, variablesMap);

    // Calculate equipment formula
    const gearFormula = '=[SHOOTDAYS] * [EQUIPMENT_DAILY]';
    const gearCost = safeMathEvaluate(gearFormula, variablesMap);

    // Calculate cast formula
    const castFormula = '=[TOTAL_CAST_PAID_DAYS] * [ACTOR_RATE]';
    const castCost = safeMathEvaluate(castFormula, variablesMap);

    // Calculate grand total formula
    const totalFormula = '=[labor_cost] + [gear_cost] + [cast_cost]';
    const resolvedFormulasContext = {
      ...variablesMap,
      labor_cost: laborCost,
      gear_cost: gearCost,
      cast_cost: castCost,
    };
    const totalCost = safeMathEvaluate(totalFormula, resolvedFormulasContext);

    return {
      shootDaysCount,
      totalCastPaidDays,
      laborCost,
      gearCost,
      castCost,
      totalCost,
    };
  }, [resolvedDaysData.daysCount, doodData.totalCastPaidDays, crewCount, crewRate, gearRate, actorRate]);

  // Overall Statistics for top info display
  const scheduleStats = useMemo(() => {
    const totalPagesDecimal = scenes.reduce((sum, s) => sum + s.pages, 0);
    return {
      sceneCount: scenes.length,
      totalPagesFormatted: formatEighths(totalPagesDecimal),
      shootDays: resolvedDaysData.daysCount,
      holdDays: doodData.matrix.reduce((sum, r) => sum + r.totalHoldDays, 0),
    };
  }, [scenes, resolvedDaysData.daysCount, doodData.matrix]);

  /* ─────────────────────────────────────────────────────────────────────────────
     RENDER COMPONENT HELPER COLORS
     ───────────────────────────────────────────────────────────────────────────── */

  const getActorBadgeColors = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      case 'emerald': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'amber': return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'purple': return 'bg-purple-500/10 border-purple-500/30 text-purple-400';
      default: return 'bg-zinc-500/10 border-zinc-500/20 text-zinc-300';
    }
  };

  const getDoodCellStyles = (status: ActorStatus): string => {
    switch (status) {
      case 'S':
        return 'bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold';
      case 'W':
        return 'bg-zinc-500/10 border border-zinc-500/20 text-zinc-300';
      case 'H':
        return 'bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold animate-pulse';
      case 'F':
        return 'bg-red-500/10 border border-red-500/30 text-red-400 font-bold';
      case 'SWF':
        return 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-bold';
      default:
        return 'text-zinc-600 border border-white/5 bg-zinc-950/20 opacity-30';
    }
  };

  return (
    <div className="w-full text-zinc-100 flex flex-col font-sans select-none pb-12">
      
      {/* 1. Playful Metric Header Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
        <div className="glass-panel rounded-xl p-3 md:p-4 flex flex-col justify-between">
          <span className="text-[9px] md:text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">Scenes Tracked</span>
          <div className="flex items-baseline gap-1 md:gap-2 mt-1 md:mt-2">
            <span className="text-2xl md:text-3xl font-bold tracking-tight text-white">{scheduleStats.sceneCount}</span>
            <span className="text-[10px] md:text-xs text-zinc-400 font-medium">scenes</span>
          </div>
        </div>
        <div className="glass-panel rounded-xl p-3 md:p-4 flex flex-col justify-between">
          <span className="text-[9px] md:text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">Total Script Volume</span>
          <div className="flex items-baseline gap-1 md:gap-2 mt-1 md:mt-2">
            <span className="text-xl md:text-2xl font-bold tracking-tight text-white">{scheduleStats.totalPagesFormatted}</span>
          </div>
        </div>
        <div className="glass-panel rounded-xl p-3 md:p-4 flex flex-col justify-between">
          <span className="text-[9px] md:text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">Production Duration</span>
          <div className="flex items-baseline gap-1 md:gap-2 mt-1 md:mt-2">
            <span className="text-2xl md:text-3xl font-bold tracking-tight text-white">{scheduleStats.shootDays}</span>
            <span className="text-[10px] md:text-xs text-zinc-400 font-medium">{scheduleStats.shootDays === 1 ? 'day' : 'days'}</span>
          </div>
        </div>
        <div className="glass-panel rounded-xl p-3 md:p-4 flex flex-col justify-between border-l border-amber-500/30 bg-amber-500/[0.01]">
          <span className="text-[9px] md:text-[10px] font-semibold tracking-wider text-amber-500 uppercase flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Total Holds
          </span>
          <div className="flex items-baseline gap-1 md:gap-2 mt-1 md:mt-2">
            <span className="text-2xl md:text-3xl font-bold tracking-tight text-amber-400">{scheduleStats.holdDays}</span>
            <span className="text-[10px] md:text-xs text-zinc-400 font-medium">{scheduleStats.holdDays === 1 ? 'day' : 'days'}</span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/8 mb-4 md:mb-6 pb-2 gap-3 md:gap-4">
        <div className="flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none pb-2 sm:pb-0 w-full sm:w-auto">
          {(['stripboard', 'dood', 'budget'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 md:px-4 py-2.5 rounded-full text-xs font-semibold cursor-pointer transition-all duration-200 min-h-[44px] md:min-h-0 flex items-center justify-center ${
                activeTab === tab
                  ? 'bg-white text-black font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              {tab === 'stripboard' && 'Stripboard Schedule'}
              {tab === 'dood' && 'Cast DOOD Matrix'}
              {tab === 'budget' && 'Budget Forecast'}
            </button>
          ))}
        </div>
        
        {activeTab === 'stripboard' && (
          <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:items-center sm:w-auto justify-end">
            <button
              onClick={() => setViewMode(viewMode === 'card' ? 'row' : 'card')}
              className="btn-glass w-full px-3 py-2.5 md:py-1.5 text-xs flex items-center justify-center gap-1.5 min-h-[44px] md:min-h-0"
            >
              {viewMode === 'card' ? <List className="w-3.5 h-3.5" /> : <Grid className="w-3.5 h-3.5" />}
              <span>{viewMode === 'card' ? 'Classic Rows' : 'Cards'}</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary w-full px-4 py-2.5 md:py-1.5 text-xs flex items-center justify-center gap-1 min-h-[44px] md:min-h-0"
            >
              <Plus className="w-3.5 h-3.5 text-black" /> <span>Add Scene</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Tab Contents */}
      <div className="flex-grow">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: STRIPBOARD SCHEDULE */}
          {activeTab === 'stripboard' && (
            <motion.div
              key="stripboard-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              <div className="p-4 bg-zinc-950/20 border border-white/5 rounded-xl text-xs text-zinc-400 leading-relaxed flex items-start gap-3">
                <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-zinc-200">Interactive Stripboard Planning:</strong> Reorder scenes using the <strong className="text-zinc-200">Up</strong> and <strong className="text-zinc-200">Down</strong> arrows on each strip. You can insert <strong className="text-zinc-200">Day Breaks</strong> dynamically between strips to structure your production schedule. Changing the schedule will instantly recompute the Cast DOOD and real-time Labor/Gear costs.
                </div>
              </div>

              <AnimatePresence>
                {showAddModal && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mb-4"
                  >
                    <div className="glass-panel rounded-xl p-4 md:p-5 border border-white/10 space-y-3 md:space-y-4">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Add New Stripboard Scene</h3>
                      
                      <form onSubmit={handleCreateScene} className="space-y-3 md:space-y-3.5 text-xs">
                        
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1 col-span-1">
                            <label className="text-zinc-500 font-medium uppercase tracking-wider block font-sans">Scene #</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. 6"
                              value={newSceneNumber}
                              onChange={(e) => setNewSceneNumber(e.target.value)}
                              className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2.5 min-h-[44px] md:min-h-0 md:p-2 text-white font-sans focus:outline-none focus:border-white/30"
                            />
                          </div>
                          
                          <div className="space-y-1 col-span-2">
                            <label className="text-zinc-500 font-medium uppercase tracking-wider block font-sans">Pages (Eighths)</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. 1 3/8 or 0.5"
                              value={newPagesString}
                              onChange={(e) => setNewPagesString(e.target.value)}
                              className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2.5 min-h-[44px] md:min-h-0 md:p-2 text-white font-sans focus:outline-none focus:border-white/30"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-zinc-500 font-medium uppercase tracking-wider block font-sans">Setting</label>
                            <select
                              value={newSetting}
                              onChange={(e: any) => setNewSetting(e.target.value)}
                              className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2.5 min-h-[44px] md:min-h-0 md:p-2 text-white font-sans focus:outline-none focus:border-white/30"
                            >
                              <option value="INT">INT. (Interior)</option>
                              <option value="EXT">EXT. (Exterior)</option>
                            </select>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-zinc-500 font-medium uppercase tracking-wider block font-sans">Time of Day</label>
                            <select
                              value={newTimeOfDay}
                              onChange={(e: any) => setNewTimeOfDay(e.target.value)}
                              className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2.5 min-h-[44px] md:min-h-0 md:p-2 text-white font-sans focus:outline-none focus:border-white/30"
                            >
                              <option value="DAY">DAY</option>
                              <option value="NIGHT">NIGHT</option>
                              <option value="DAWN">DAWN</option>
                              <option value="DUSK">DUSK</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-zinc-500 font-medium uppercase tracking-wider block font-sans">Location Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Backlot Hangar"
                            value={newLocation}
                            onChange={(e) => setNewLocation(e.target.value)}
                            className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2.5 min-h-[44px] md:min-h-0 md:p-2 text-white font-sans focus:outline-none focus:border-white/30"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-zinc-500 font-medium uppercase tracking-wider block font-sans">Synopsis</label>
                          <textarea
                            required
                            rows={2}
                            placeholder="Brief synopsis of what happens in the scene..."
                            value={newSynopsis}
                            onChange={(e) => setNewSynopsis(e.target.value)}
                            className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2.5 min-h-[44px] md:min-h-0 md:p-2 text-white font-sans focus:outline-none focus:border-white/30 resize-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-zinc-500 font-medium uppercase tracking-wider block font-sans mb-1">Cast Members Involved</label>
                          <div className="flex flex-wrap gap-2">
                            {cast.map((actor) => {
                              const isSelected = newCastIds.includes(actor.id);
                              return (
                                <button
                                  key={actor.id}
                                  type="button"
                                  onClick={() => toggleCastSelection(actor.id)}
                                  className={`px-3 py-2.5 md:px-2.5 md:py-1 rounded-full border text-[10px] font-medium transition-all min-h-[44px] md:min-h-0 flex items-center justify-center ${
                                    isSelected
                                      ? 'bg-white text-black font-semibold border-white'
                                      : 'bg-transparent text-zinc-400 border-white/10 hover:border-white/20'
                                  }`}
                                >
                                  {actor.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex gap-2 pt-3">
                          <button
                            type="button"
                            onClick={() => setShowAddModal(false)}
                            className="btn-glass flex-1 py-2.5 md:py-2 text-xs min-h-[44px] md:min-h-0 flex items-center justify-center"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="btn-primary flex-1 py-2.5 md:py-2 text-xs min-h-[44px] md:min-h-0 flex items-center justify-center"
                          >
                            Create Strip
                          </button>
                        </div>

                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className={viewMode === 'row' ? "overflow-x-auto w-full pb-2" : "w-full"}>
                <div className={viewMode === 'row' ? "min-w-[600px] flex flex-col gap-1.5" : "flex flex-col gap-2"}>
                {stripboardItems.map((item, index) => {
                  
                  // DAY BREAK CARD
                  if (item.type === 'dayBreak') {
                    // Compute aggregates for scenes in this day
                    let dayPageSum = 0;
                    let sceneIdx = index - 1;
                    while (sceneIdx >= 0 && stripboardItems[sceneIdx].type === 'scene') {
                      dayPageSum += (stripboardItems[sceneIdx] as any).data.pages;
                      sceneIdx--;
                    }
                    
                    return (
                      <motion.div
                        key={item.id}
                        layout
                        className="py-2.5 my-2 border-y border-dashed border-amber-500/20 bg-amber-500/[0.02] flex items-center justify-between px-4 text-xs font-semibold text-amber-500"
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-amber-500" />
                          <span>SHOOT DAY {item.dayNumber} CONCLUDES HERE</span>
                          <span className="text-zinc-500 text-[10px] font-normal">
                            (Daily volume: {formatEighths(dayPageSum)})
                          </span>
                        </div>
                        <button
                          onClick={() => removeItem(index)}
                          className="text-[10px] text-zinc-500 hover:text-red-400 transition-colors uppercase tracking-wider p-1 cursor-pointer"
                        >
                          Remove Day Break
                        </button>
                      </motion.div>
                    );
                  }

                  // SCENE ITEM (CARD VIEW)
                  const scene = item.data;
                  
                  if (viewMode === 'card') {
                    return (
                      <motion.div
                        key={scene.id}
                        layout
                        className="glass-panel rounded-xl p-3 md:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 transition-all hover:bg-zinc-900/30 hover:border-white/10"
                      >
                        <div className="flex items-start gap-3 md:gap-4">
                          <div className="flex flex-col items-center justify-center bg-zinc-900/80 border border-white/8 h-14 w-14 rounded-lg flex-shrink-0">
                            <span className="text-[9px] uppercase font-bold text-zinc-500">Scene</span>
                            <span className="text-lg font-bold text-white font-mono">{scene.sceneNumber}</span>
                          </div>
                          
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                                scene.setting === 'INT' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                              }`}>
                                {scene.setting}
                              </span>
                              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                                {scene.timeOfDay} — {scene.location}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-medium px-2 py-0.5 bg-white/5 rounded-full">
                                {formatEighths(scene.pages)}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-300 font-normal leading-relaxed">{scene.synopsis}</p>
                            
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {scene.castIds.map((cId) => {
                                const actor = cast.find((a) => a.id === cId);
                                if (!actor) return null;
                                return (
                                  <span
                                    key={cId}
                                    className={`text-[9px] font-medium px-2 py-0.5 rounded-full border ${getActorBadgeColors(actor.color)}`}
                                  >
                                    {actor.name}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Interactive Move / Action Bar */}
                        <div className="flex items-center gap-2 border-t border-white/5 md:border-t-0 pt-3 md:pt-0 justify-end">
                          <button
                            onClick={() => addDayBreak(index)}
                            title="Insert Day Break After"
                            className="btn-glass sm px-2.5 py-2.5 md:py-1.5 text-zinc-400 hover:text-white min-h-[44px] md:min-h-0 flex items-center justify-center gap-1"
                          >
                            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                            <span className="sr-only md:not-sr-only text-[10px]">Add Break</span>
                          </button>
                          
                          <div className="flex border border-white/8 rounded-full overflow-hidden bg-zinc-900/60">
                            <button
                              onClick={() => moveItem(index, 'up')}
                              disabled={index === 0}
                              className="p-3 md:p-2 hover:bg-white/10 text-zinc-400 hover:text-white disabled:opacity-20 disabled:pointer-events-none cursor-pointer transition-colors min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center"
                              title="Move Scene Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <div className="w-px bg-white/8" />
                            <button
                              onClick={() => moveItem(index, 'down')}
                              disabled={index === stripboardItems.length - 1}
                              className="p-3 md:p-2 hover:bg-white/10 text-zinc-400 hover:text-white disabled:opacity-20 disabled:pointer-events-none cursor-pointer transition-colors min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center"
                              title="Move Scene Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          
                          <button
                            onClick={() => removeItem(index)}
                            title="Remove Scene"
                            className="p-2.5 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer rounded-full hover:bg-red-500/5 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  }

                  // SCENE ITEM (CLASSIC ROW VIEW)
                  return (
                    <motion.div
                      key={scene.id}
                      layout
                      className="bg-zinc-950/40 border border-white/5 py-2 px-3 flex items-center justify-between text-xs font-mono text-zinc-400 transition-all hover:bg-zinc-900/20"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <span className="text-zinc-500 text-[10px] w-6 text-right">#{scene.sceneNumber}</span>
                        <span className={`w-10 text-center text-[9px] px-1.5 py-0.5 rounded font-bold ${
                          scene.setting === 'INT' ? 'text-blue-400 bg-blue-500/5 border border-blue-500/10' : 'text-amber-400 bg-amber-500/5 border border-amber-500/10'
                        }`}>
                          {scene.setting}
                        </span>
                        <span className="w-16 truncate text-zinc-300 font-semibold">{scene.timeOfDay}</span>
                        <span className="w-1/4 truncate text-zinc-300">{scene.location}</span>
                        <span className="w-2/5 truncate text-zinc-500 font-sans italic">{scene.synopsis}</span>
                        <span className="w-16 text-right text-zinc-400 pr-4">{decimalToEighths(scene.pages)} pgs</span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => moveItem(index, 'up')}
                          disabled={index === 0}
                          className="p-2.5 md:p-1 hover:bg-white/5 text-zinc-400 disabled:opacity-10 cursor-pointer min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveItem(index, 'down')}
                          disabled={index === stripboardItems.length - 1}
                          className="p-2.5 md:p-1 hover:bg-white/5 text-zinc-400 disabled:opacity-10 cursor-pointer min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => addDayBreak(index)}
                          className="p-2.5 md:p-1 hover:bg-white/5 text-zinc-500 hover:text-amber-500 cursor-pointer min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removeItem(index)}
                          className="p-2.5 md:p-1 hover:bg-white/5 text-zinc-500 hover:text-red-400 cursor-pointer min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: DAY OUT OF DAYS CAST MATRIX */}
          {activeTab === 'dood' && (
            <motion.div
              key="dood-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6"
            >
              
              {/* Warnings and SAG Rules explanation */}
              <div className="lg:col-span-1 space-y-4">
                <div className="glass-panel rounded-xl p-4">
                  <h3 className="text-sm font-semibold tracking-tight text-white mb-3">SAG Hold Regulations</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans mb-3">
                    Under SAG-AFTRA Day Player contracts, actors are paid continuously from their <strong className="text-zinc-200">Start (S)</strong> date to their <strong className="text-zinc-200">Finish (F)</strong> date. 
                  </p>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    Any calendar day in between where they do not work is designated a <strong className="text-amber-400">Hold Day (H)</strong> and remains fully billable. High holds inflate actor payroll without production yield.
                  </p>
                </div>

                {doodData.holdWarnings.length > 0 ? (
                  <div className="border border-amber-500/20 bg-amber-500/[0.03] rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>Financial Hold Alerts</span>
                    </div>
                    <div className="space-y-2">
                      {doodData.holdWarnings.map((warn, i) => (
                        <div key={i} className="text-[11px] text-zinc-300 leading-relaxed border-t border-white/5 pt-2 first:border-t-0 first:pt-0">
                          {warn.suggestion}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="border border-emerald-500/20 bg-emerald-500/[0.03] rounded-xl p-4 flex items-start gap-2.5 text-xs text-zinc-400">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-emerald-400 block font-semibold mb-0.5">Matrix Optimized</strong>
                      All cast schedules are compact. No excess holding charges detected.
                    </div>
                  </div>
                )}
              </div>

              {/* Matrix Grid */}
              <div className="lg:col-span-3">
                <div className="flex items-center justify-between mb-2 md:hidden">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">Cast Matrix</span>
                  <span className="text-[10px] text-zinc-400 font-mono animate-pulse">Swipe to view →</span>
                </div>
                <div className="overflow-x-auto rounded-xl border border-white/5 bg-zinc-950/20 backdrop-blur-md">
                  <table className="min-w-[600px] lg:min-w-full border-collapse text-left text-xs font-sans text-zinc-300">
                    <thead>
                      <tr className="border-b border-white/8 bg-zinc-900/40">
                        <th className="sticky left-0 z-10 min-w-[180px] bg-zinc-950/80 px-4 py-3 font-semibold text-white backdrop-blur-md">
                          Actor & Role
                        </th>
                        {Array.from({ length: resolvedDaysData.daysCount }).map((_, i) => (
                          <th key={i} className="px-2 py-3 text-center font-semibold text-zinc-400">
                            Day {i + 1}
                          </th>
                        ))}
                        <th className="px-3 py-3 text-center font-semibold text-white">Work</th>
                        <th className="px-3 py-3 text-center font-semibold text-white">Hold</th>
                        <th className="px-3 py-3 text-center font-semibold text-white">Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {doodData.matrix.map((row) => (
                        <tr key={row.actor.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="sticky left-0 z-10 flex flex-col justify-center bg-zinc-950/80 px-4 py-3.5 backdrop-blur-md">
                            <span className="font-semibold text-zinc-100">{row.actor.name}</span>
                            <span className="text-[10px] text-zinc-500 font-normal mt-0.5">{row.actor.role}</span>
                          </td>
                          {Array.from({ length: resolvedDaysData.daysCount }).map((_, i) => {
                            const dayIndex = i + 1;
                            const status = row.days[dayIndex];
                            
                            return (
                              <td key={i} className="p-1 text-center">
                                <div className={`mx-auto flex h-7 w-7 items-center justify-center rounded text-[10px] ${getDoodCellStyles(status)}`}>
                                  {status || '-'}
                                </div>
                              </td>
                            );
                          })}
                          <td className="px-3 py-3 text-center font-mono text-zinc-300 font-medium">
                            {row.totalWorkDays}
                          </td>
                          <td className="px-3 py-3 text-center font-mono text-amber-400/90 font-medium">
                            {row.totalHoldDays}
                          </td>
                          <td className="px-3 py-3 text-center font-mono text-white font-bold bg-white/[0.02]">
                            {row.totalPaidDays}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Legend panel */}
                <div className="flex flex-wrap gap-4 mt-4 px-2 text-[10px] text-zinc-500 uppercase font-semibold">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500/10 border border-blue-500/30 block" /> S = Start Day</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-zinc-500/10 border border-zinc-500/20 block" /> W = Work Day</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500/15 border border-amber-500/30 block" /> H = Hold Day (Paid)</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500/10 border border-red-500/30 block" /> F = Finish Day</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-500/10 border border-indigo-500/30 block" /> SWF = Single Day Run</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: BUDGET FORECAST */}
          {activeTab === 'budget' && (
            <motion.div
              key="budget-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6"
            >
              
              {/* Sliders Control Pane */}
              <div className="lg:col-span-1 space-y-4 md:space-y-6 bg-zinc-950/30 border border-white/5 rounded-2xl p-4 md:p-5">
                <h3 className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-zinc-400" /> Dynamic Variable Board
                </h3>
                
                <div className="space-y-4">
                  
                  {/* Shoot Days Variable (Derived) */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400 font-medium">Production Shoot Days</span>
                      <span className="text-white font-mono font-bold bg-white/5 px-2 py-0.5 rounded">
                        {budgetData.shootDaysCount} days
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-normal">
                      Linked dynamically to stripboard Day Breaks. Reorder items to adjust this value.
                    </p>
                  </div>

                  <div className="h-px bg-white/5 my-2" />

                  {/* Crew Count Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400 font-medium">Crew Count</span>
                      <span className="text-white font-mono font-semibold">{crewCount} people</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={40}
                      step={1}
                      value={crewCount}
                      onChange={(e) => setCrewCount(parseInt(e.target.value, 10))}
                      className="w-full accent-white cursor-pointer bg-zinc-800 rounded-lg appearance-none h-1 py-3 md:py-1.5"
                    />
                  </div>

                  {/* Crew Rate Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400 font-medium">Average Daily Crew Rate</span>
                      <span className="text-white font-mono font-semibold">${crewRate}/day</span>
                    </div>
                    <input
                      type="range"
                      min={150}
                      max={1200}
                      step={50}
                      value={crewRate}
                      onChange={(e) => setCrewRate(parseInt(e.target.value, 10))}
                      className="w-full accent-white cursor-pointer bg-zinc-800 rounded-lg appearance-none h-1 py-3 md:py-1.5"
                    />
                  </div>

                  {/* Gear Daily Rate Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400 font-medium">Daily Gear Package</span>
                      <span className="text-white font-mono font-semibold">${gearRate}/day</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={3000}
                      step={100}
                      value={gearRate}
                      onChange={(e) => setGearRate(parseInt(e.target.value, 10))}
                      className="w-full accent-white cursor-pointer bg-zinc-800 rounded-lg appearance-none h-1 py-3 md:py-1.5"
                    />
                  </div>

                  {/* Actor Daily Rate Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400 font-medium">Actor SAG Daily Rate</span>
                      <span className="text-white font-mono font-semibold">${actorRate}/day</span>
                    </div>
                    <input
                      type="range"
                      min={200}
                      max={2000}
                      step={100}
                      value={actorRate}
                      onChange={(e) => setActorRate(parseInt(e.target.value, 10))}
                      className="w-full accent-white cursor-pointer bg-zinc-800 rounded-lg appearance-none h-1 py-3 md:py-1.5"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Formulas & Large Readouts */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Large Grand Total Board */}
                <div className="glass-panel rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1 relative z-10">
                    <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500">Estimated Project Total</span>
                    <h2 className="text-4xl font-bold tracking-tight text-white font-sans flex items-center">
                      <DollarSign className="w-8 h-8 text-zinc-500 -ml-1.5" />
                      {budgetData.totalCost.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </h2>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      Formula: =[labor_cost] + [gear_cost] + [cast_cost]
                    </p>
                  </div>
                  
                  {/* Small progress meter against hypothetical 50k budget */}
                  <div className="w-full md:w-48 space-y-2 relative z-10">
                    <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-400">
                      <span>Cap Budget</span>
                      <span>$50,000</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 rounded-full ${
                          budgetData.totalCost > 50000 ? 'bg-red-500' : 'bg-emerald-500'
                        }`} 
                        style={{ width: `${Math.min((budgetData.totalCost / 50000) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-zinc-500">
                      <span>Usage: {Math.round((budgetData.totalCost / 50000) * 100)}%</span>
                      {budgetData.totalCost > 50000 ? (
                        <span className="text-red-400 font-semibold uppercase">Over Budget</span>
                      ) : (
                        <span className="text-emerald-400 font-semibold uppercase">Under Budget</span>
                      )}
                    </div>
                  </div>

                  {/* Backdrop subtle ambient blur glow */}
                  <div className="absolute right-0 top-0 w-36 h-36 bg-white/[0.02] blur-[40px] pointer-events-none rounded-full" />
                </div>

                {/* Sub-cost Formulas breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  <div className="border border-white/5 bg-zinc-950/20 rounded-xl p-4 space-y-1">
                    <span className="text-[9px] font-bold tracking-wider text-zinc-500 uppercase">Crew Labor Cost</span>
                    <span className="text-lg font-bold text-white font-mono">
                      ${budgetData.laborCost.toLocaleString()}
                    </span>
                    <p className="text-[9px] text-zinc-600 font-mono">
                      {budgetData.shootDaysCount}d × {crewCount}p × ${crewRate}
                    </p>
                  </div>

                  <div className="border border-white/5 bg-zinc-950/20 rounded-xl p-4 space-y-1">
                    <span className="text-[9px] font-bold tracking-wider text-zinc-500 uppercase">Gear Rental Cost</span>
                    <span className="text-lg font-bold text-white font-mono">
                      ${budgetData.gearCost.toLocaleString()}
                    </span>
                    <p className="text-[9px] text-zinc-600 font-mono">
                      {budgetData.shootDaysCount}d × ${gearRate}
                    </p>
                  </div>

                  <div className="border border-white/5 bg-zinc-950/20 rounded-xl p-4 space-y-1">
                    <span className="text-[9px] font-bold tracking-wider text-zinc-500 uppercase">Cast SAG Cost</span>
                    <span className="text-lg font-bold text-white font-mono">
                      ${budgetData.castCost.toLocaleString()}
                    </span>
                    <p className="text-[9px] text-zinc-600 font-mono">
                      {budgetData.totalCastPaidDays} paid days × ${actorRate}
                    </p>
                  </div>

                </div>

                {/* Formula details panel */}
                <div className="glass-panel rounded-xl p-5 space-y-3.5">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Formula Evaluation Engine</h4>
                  
                  <div className="space-y-3">
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between font-semibold text-zinc-200">
                        <span>1. Crew Labor Cost</span>
                        <code className="text-[11px] text-zinc-400 font-mono bg-zinc-900 px-1 py-0.5 rounded">=[SHOOTDAYS] * [CREW_COUNT] * [CREW_RATE]</code>
                      </div>
                      <p className="text-[10px] text-zinc-500">Calculates general crew day-rate costs.</p>
                    </div>

                    <div className="text-xs space-y-1">
                      <div className="flex justify-between font-semibold text-zinc-200">
                        <span>2. Gear Package Cost</span>
                        <code className="text-[11px] text-zinc-400 font-mono bg-zinc-900 px-1 py-0.5 rounded">=[SHOOTDAYS] * [EQUIPMENT_DAILY]</code>
                      </div>
                      <p className="text-[10px] text-zinc-500">Accumulates daily tech packages & camera rental costs.</p>
                    </div>

                    <div className="text-xs space-y-1">
                      <div className="flex justify-between font-semibold text-zinc-200">
                        <span>3. Cast Talent Cost</span>
                        <code className="text-[11px] text-zinc-400 font-mono bg-zinc-900 px-1 py-0.5 rounded">=[TOTAL_CAST_PAID_DAYS] * [ACTOR_RATE]</code>
                      </div>
                      <p className="text-[10px] text-zinc-500">Linked to DOOD Matrix. Includes active work days + standby hold days.</p>
                    </div>
                  </div>

                </div>

              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </div>



    </div>
  );
}
