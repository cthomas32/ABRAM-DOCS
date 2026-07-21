"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Boxes,
  CircleCheck,
  Truck,
  Wrench,
  AlertTriangle,
  Check,
} from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  serial: string;
  type: string;
  location: string;
  util: number;
  rate: number;
  status: "Available" | "On Job" | "Maintenance";
}

const INVENTORY: InventoryItem[] = [
  { id: "AS-0417", name: "Vortex Cine 8K Camera", serial: "VX-0417", type: "Camera", location: "Stage A", util: 72, rate: 650, status: "On Job" },
  { id: "AS-0512", name: "Aura LED Panel Kit", serial: "AU-0512", type: "Lighting", location: "Gear Cage", util: 54, rate: 220, status: "Available" },
  { id: "AS-0088", name: "Stage B Cyclorama", serial: "SB-0088", type: "Studio", location: "Studio B", util: 41, rate: 1800, status: "Available" },
  { id: "AS-0301", name: "Helix Wireless Audio Rig", serial: "HX-0301", type: "Audio", location: "Gear Cage", util: 63, rate: 180, status: "Maintenance" },
  { id: "AS-0234", name: "Onyx Gimbal Stabilizer", serial: "ON-0234", type: "Grip", location: "Stage A", util: 68, rate: 140, status: "On Job" },
];

const STATS = [
  { label: "Total", value: 214, icon: Boxes, tone: "text-zinc-300" },
  { label: "Available", value: 180, icon: CircleCheck, tone: "text-emerald-400" },
  { label: "On Job", value: 28, icon: Truck, tone: "text-sky-400" },
  { label: "Maintenance", value: 6, icon: Wrench, tone: "text-orange-400" },
];

function statusChip(status: InventoryItem["status"]) {
  if (status === "Available") return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
  if (status === "On Job") return "bg-sky-500/10 text-sky-400 border border-sky-500/20";
  return "bg-orange-500/10 text-orange-400 border border-orange-500/20";
}

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export default function ResourceInventoryMockup() {
  const [view, setView] = useState<"Inventory" | "Conflicts">("Inventory");
  const [searchTerm, setSearchTerm] = useState("");
  const [resolved, setResolved] = useState(false);

  const filtered = INVENTORY.filter((item) => {
    const q = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.serial.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q) ||
      item.type.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl border border-white/[0.08] bg-zinc-950/40 p-4 sm:p-6 lg:p-8 backdrop-blur-xl relative overflow-visible">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[300px] bg-zinc-800/[0.015] rounded-full filter blur-[80px] pointer-events-none -z-10" />

      {/* Stat Card Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 mb-6">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="p-3 sm:p-4 rounded-xl border border-white/[0.08] bg-zinc-950/40 flex flex-col gap-1.5"
          >
            <span className="text-[9px] font-semibold tracking-[0.15em] uppercase text-zinc-500 font-sans flex items-center gap-1.5">
              <s.icon className={`w-3.5 h-3.5 ${s.tone}`} />
              {s.label}
            </span>
            <span className={`text-2xl font-medium font-sans ${s.tone}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* View Toggle + Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4 mb-6">
        <div className="flex gap-1 p-1 rounded-full border border-white/[0.08] bg-zinc-950/40 w-fit">
          {(["Inventory", "Conflicts"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 rounded-full text-xs font-semibold cursor-pointer transition-all duration-200 min-h-[44px] flex items-center justify-center ${
                view === v
                  ? "bg-white/[0.10] text-white border border-white/[0.20]"
                  : "text-zinc-400 hover:text-zinc-200 border border-transparent"
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {view === "Inventory" && (
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search name, serial, asset ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-white/[0.08] rounded-full pl-9 pr-4 text-xs text-white outline-none focus:border-white/20 min-h-[44px]"
            />
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {view === "Inventory" ? (
          <motion.div
            key="inventory"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center justify-between mb-2 md:hidden">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold">Inventory</span>
              <span className="text-[10px] text-zinc-400 font-sans">Swipe to view →</span>
            </div>

            <div className="border border-white/[0.08] rounded-xl bg-zinc-950/30 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs min-w-[700px]">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-zinc-950/40 text-[9px] uppercase tracking-wider font-semibold text-zinc-500 font-sans">
                      <th className="px-4 py-3">Asset</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-3 py-3 text-center">Utilization</th>
                      <th className="px-4 py-3">Daily Rate</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.08] font-sans text-zinc-300">
                    {filtered.map((item) => (
                      <tr key={item.id} className="hover:bg-white/[0.01] transition-all">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">{item.name}</div>
                          <div className="text-[10px] text-zinc-500">
                            Serial {item.serial} · Asset {item.id}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-zinc-400 text-[10px]">{item.type}</td>
                        <td className="px-4 py-3 text-zinc-400 text-[10px]">{item.location}</td>
                        <td className="px-3 py-3 text-center">
                          <span
                            className={`font-bold text-xs ${
                              item.util >= 70 ? "text-emerald-400" : item.util >= 50 ? "text-zinc-300" : "text-zinc-500"
                            }`}
                          >
                            {item.util}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white font-semibold">${item.rate}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-medium ${statusChip(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="conflicts"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
              <div>
                <span className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase font-sans block">
                  Booking calendar · Vortex Cine 8K Camera
                </span>
                <span className="text-[10px] text-zinc-500 font-sans">You own 2 of this item</span>
              </div>
              <button
                onClick={() => setResolved((r) => !r)}
                className="btn-glass rounded-full px-4 py-1.5 text-xs inline-flex items-center gap-1.5 cursor-pointer font-semibold w-fit"
              >
                {resolved ? "Show conflict" : "Resolve conflict"}
              </button>
            </div>

            <div className="border border-white/[0.08] rounded-xl bg-zinc-950/30 p-4 overflow-x-auto">
              <div className="min-w-[520px] grid grid-cols-5 gap-2">
                {WEEK.map((day) => {
                  const isConflictDay = day === "Wed";
                  return (
                    <div key={day} className="space-y-2">
                      <div className="text-[9px] uppercase tracking-wider font-semibold text-zinc-500 text-center font-sans">
                        {day}
                      </div>
                      {isConflictDay ? (
                        resolved ? (
                          <>
                            <div className="rounded-md border border-sky-500/20 bg-sky-500/10 text-sky-400 text-[9px] font-medium px-2 py-2 text-center">
                              Booking A
                            </div>
                            <div className="rounded-md border border-sky-500/20 bg-sky-500/10 text-sky-400 text-[9px] font-medium px-2 py-2 text-center">
                              Booking B
                            </div>
                            <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[9px] font-medium px-2 py-2 text-center flex items-center justify-center gap-1">
                              <Check className="w-3 h-3" /> Rebooked
                            </div>
                          </>
                        ) : (
                          <div className="rounded-md border border-orange-500/30 bg-orange-500/10 px-2 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1 text-orange-400 text-[9px] font-semibold">
                              <AlertTriangle className="w-3 h-3" /> Conflict
                            </div>
                            <div className="text-orange-300 text-[9px] font-medium mt-1">3 booked · 2 owned</div>
                          </div>
                        )
                      ) : (
                        <div className="rounded-md border border-white/[0.06] bg-white/[0.02] text-zinc-500 text-[9px] px-2 py-2 text-center">
                          {day === "Mon" || day === "Fri" ? "Booking" : "Open"}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              className={`text-[11px] font-sans rounded-lg border px-3 py-2.5 ${
                resolved
                  ? "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-300"
                  : "border-orange-500/20 bg-orange-500/[0.06] text-orange-300"
              }`}
            >
              {resolved
                ? "Conflict cleared. The third Wednesday booking moved to a spare unit."
                : "Wednesday has 3 bookings against 2 owned units. Reassign or reschedule one."}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
