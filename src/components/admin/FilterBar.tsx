"use client";

import React, { useState } from "react";
import { Search, X } from "lucide-react";
import { CONTROL_HEIGHT } from "@/lib/crm/blockStyles";

/**
 * Free text, a row of typed chips, and what is on right now.
 *
 * The screens this replaces had a grid of eight permanently-open
 * dropdowns, which takes a third of the fold before a single row is
 * drawn and says nothing when they are all set to "any". A chip bar
 * inverts that: nothing is shown until it constrains something, and what
 * is constraining is then readable in one line rather than by scanning
 * eight selects for the one that is not on its default.
 *
 * Every chip is the same object: a label, the values it can take, and
 * what is set. Adding a filter is a row in an array, so the People screen
 * and the Deals screen cannot drift into two filter bars.
 */

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterSpec {
  id: string;
  label: string;
  /** A picker of one value, or a switch that is simply on or off. */
  kind: "select" | "toggle";
  options?: FilterOption[];
  /** What it says when it is on, for a toggle. */
  onLabel?: string;
  /** Why it exists. Shown as the chip's title attribute. */
  hint?: string;
}

export interface FilterBarProps {
  /** What may be filtered on. */
  specs: FilterSpec[];
  /** What is set right now. Absent or empty string means off. */
  values: Record<string, string | boolean | undefined>;
  onChange: (id: string, value: string | boolean | undefined) => void;
  query: string;
  onQueryChange: (value: string) => void;
  queryPlaceholder?: string;
  onClear: () => void;
  /** Saved lists, smart lists, a view switch: whatever the screen adds. */
  children?: React.ReactNode;
  /** Said on the right of the bar. "42 of 900 shown". */
  summary?: React.ReactNode;
}

function isOn(value: string | boolean | undefined): boolean {
  return value === true || (typeof value === "string" && value !== "");
}

export default function FilterBar({
  specs,
  values,
  onChange,
  query,
  onQueryChange,
  queryPlaceholder = "Search",
  onClear,
  children,
  summary,
}: FilterBarProps) {
  const [adding, setAdding] = useState(false);

  const active = specs.filter((spec) => isOn(values[spec.id]));
  const available = specs.filter((spec) => !isOn(values[spec.id]));
  const anything = active.length > 0 || query.trim() !== "";

  return (
    <div className="space-y-2.5">
      {/* One toolbar row, one control height. */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={queryPlaceholder}
            aria-label={queryPlaceholder}
            className={`admin-input ${CONTROL_HEIGHT} py-0 pl-9`}
          />
        </div>
        {children}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {active.map((spec) => {
          const value = values[spec.id];
          return (
            <span
              key={spec.id}
              title={spec.hint}
              className="inline-flex items-center gap-1 h-9 rounded-full border border-white/20 bg-white/[0.06] pl-3 pr-1.5 text-[11px] text-white"
            >
              <span className="text-zinc-400">{spec.label}</span>
              {spec.kind === "toggle" ? (
                <span>{spec.onLabel ?? "on"}</span>
              ) : (
                <select
                  value={String(value ?? "")}
                  onChange={(event) => onChange(spec.id, event.target.value)}
                  aria-label={spec.label}
                  className="bg-transparent text-white text-[11px] outline-none cursor-pointer"
                >
                  {(spec.options ?? []).map((option) => (
                    <option key={option.value} value={option.value} className="bg-zinc-950">
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                onClick={() => onChange(spec.id, spec.kind === "toggle" ? false : "")}
                aria-label={`Stop filtering by ${spec.label}`}
                className="ml-0.5 h-6 w-6 rounded-full inline-flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          );
        })}

        {available.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setAdding((open) => !open)}
              aria-expanded={adding}
              className={`px-3.5 ${CONTROL_HEIGHT} rounded-full text-[11px] font-medium border border-dashed border-white/15 text-zinc-400 hover:text-zinc-200 transition-colors`}
            >
              Add a filter
            </button>

            {adding && (
              <div className="absolute left-0 top-11 z-20 w-56 rounded-xl border border-white/10 bg-zinc-950 p-2 shadow-xl">
                {available.map((spec) => (
                  <button
                    key={spec.id}
                    type="button"
                    title={spec.hint}
                    onClick={() => {
                      setAdding(false);
                      if (spec.kind === "toggle") onChange(spec.id, true);
                      else onChange(spec.id, spec.options?.[0]?.value ?? "");
                    }}
                    className="block w-full rounded-lg px-2 py-1.5 text-left text-[11px] text-zinc-300 hover:bg-white/[0.04]"
                  >
                    {spec.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {anything && (
          <button
            type="button"
            onClick={onClear}
            className={`btn-ghost px-3.5 ${CONTROL_HEIGHT} text-[11px] font-medium rounded-full`}
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}

        {summary && <span className="text-[11px] text-zinc-400 ml-auto">{summary}</span>}
      </div>
    </div>
  );
}
