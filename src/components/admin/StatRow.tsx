import React from "react";
import { LABEL_CAPS } from "@/lib/crm/blockStyles";

/**
 * The summary figures above a board or a queue.
 *
 * One quiet card holding a grid of readings, ported from the product app's
 * stat strip so both consoles state their numbers the same way: label in the
 * one caps recipe, a plain figure at `text-lg` with tabular numerals, an
 * optional quiet line under it. No per-cell chrome, no dividers, no heavy
 * numerals, and no colour on a value unless it is the amber that means this
 * costs something if it is ignored.
 *
 * The strip never formats. The caller owns units, because only the caller
 * knows the currency.
 */

export interface StatRowItem {
  label: string;
  /** Pre-formatted. */
  value: React.ReactNode;
  /** One line of context. Truncates rather than wrapping. */
  caption?: string;
  /** Marks the figure as needing attention. Spend it rarely. */
  attention?: boolean;
}

const COLUMNS: Record<number, string> = {
  1: "grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
};

export default function StatRow({
  stats,
  className = "",
}: {
  stats: StatRowItem[];
  className?: string;
}) {
  return (
    <div
      className={`grid grid-cols-2 gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-4 ${
        COLUMNS[stats.length] ?? "lg:grid-cols-4"
      } ${className}`}
    >
      {stats.map((stat) => (
        <div key={stat.label}>
          <p className={`${LABEL_CAPS} block mb-1`}>{stat.label}</p>
          <div
            className={`text-lg leading-snug tabular-nums ${
              stat.attention ? "text-amber-400" : "text-white"
            }`}
          >
            {stat.value}
          </div>
          {stat.caption && (
            <p className="mt-1 text-[11px] text-zinc-500 truncate">{stat.caption}</p>
          )}
        </div>
      ))}
    </div>
  );
}
