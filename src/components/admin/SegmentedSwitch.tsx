"use client";

import React from "react";

/**
 * Two ways of drawing one set, switched in place.
 *
 * The table and the board are two views of one filtered set held in
 * memory, and putting the choice in the URL would throw the filters away
 * on every press. So this one is state rather than a link.
 *
 * Where two views really are two pages, they are two addresses and the
 * choice belongs in `ObjectTabs`, which puts the tab in the URL so it can
 * be linked, bookmarked and redirected to. There was a link-flavoured
 * twin of this control for that job; it pointed at `/deals/board`, an
 * address that stopped existing when deals became one page of tabs, and
 * nothing had imported it since.
 *
 * One control height per toolbar row: h-9, matching every filter and
 * button beside it.
 */
export function SegmentedSwitch<Value extends string>({
  options,
  value,
  onChange,
  className = "",
}: {
  options: { value: Value; label: string; icon?: React.ComponentType<{ className?: string }> }[];
  value: Value;
  onChange: (next: Value) => void;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label="Choose a view"
      className={`inline-flex items-center h-9 p-0.5 rounded-full border border-white/8 bg-white/[0.02] shrink-0 ${className}`}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium transition-colors ${
              active ? "bg-white text-black" : "text-zinc-300 hover:text-white"
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedSwitch;
