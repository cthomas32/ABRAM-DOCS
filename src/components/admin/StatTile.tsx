/**
 * The summary figures at the top of a screen.
 *
 * Ported from `StatStrip` in the product app (abram-network,
 * src/components/ui/stat-strip.tsx) so the console and the product read as
 * one family. Two things came across from it and both matter more than
 * they look:
 *
 * 1. **One card, a grid of readings.** Not four floating cards with four
 *    borders. A row of separate boxes reads as four unrelated facts; one
 *    quiet card reads as a summary, which is what it is.
 * 2. **The number is not heavy.** `text-lg tabular-nums`, no bold display
 *    size, no colour. A figure that shouts is a figure somebody has to
 *    decide to ignore.
 *
 * `StatTile` stays exported under that name because the CRM plan names it
 * and the deals, accounts and tasks screens are being written against it.
 * A tile used on its own still draws its own card; inside `StatRow` it
 * draws a cell.
 */

import React from "react";

export default function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  /** Already formatted. The tile never formats: the caller owns units. */
  value: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-4">
      <StatCell label={label} value={value} hint={hint} />
    </div>
  );
}

/** One reading. Used by `StatRow`, which owns the card around it. */
export function StatCell({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <span className="block text-xs uppercase font-bold tracking-widest text-gray-400 font-sans mb-0.5">
        {label}
      </span>
      <div className="text-lg leading-snug tabular-nums text-white">{value}</div>
      {hint && (
        <p className="mt-1 text-[11px] text-zinc-400 leading-relaxed">{hint}</p>
      )}
    </div>
  );
}

export interface StatRowItem {
  label: string;
  /** Pre-formatted. The strip never formats: only the caller knows units. */
  value: React.ReactNode;
  /** One quiet line under the figure. */
  hint?: React.ReactNode;
  /**
   * Alias of `hint`, kept because the board and the queue were written
   * against that name. Truncates rather than wrapping.
   */
  caption?: string;
  /** Marks the figure as needing attention. Spend it rarely. */
  attention?: boolean;
}

// Explicit, because Tailwind cannot see an interpolated class name.
const COLUMNS: Record<number, string> = {
  1: "grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
};

/**
 * The strip. Two-up on a phone, N-up from `lg`, one card around the lot.
 *
 * This is the only stat strip in the console. Every screen that states
 * figures above a list, a board or a queue uses it, so the numbers all
 * read the same way: label in the one caps recipe, a plain figure at
 * `text-lg` with tabular numerals, no per-cell chrome and no colour on a
 * value unless it is the amber that means this costs something if it is
 * ignored.
 */
export function StatRow({
  stats,
  loading = false,
  className = "",
}: {
  stats: StatRowItem[];
  /** Shows a shimmer where each figure will be. Never blanks the row. */
  loading?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`grid grid-cols-2 gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-4 ${
        COLUMNS[stats.length] ?? "lg:grid-cols-4"
      } ${className}`}
    >
      {stats.map((stat) => {
        const under = stat.hint ?? stat.caption;
        return (
          <div key={stat.label} className="min-w-0">
            <span className="block text-xs uppercase font-bold tracking-widest text-gray-400 font-sans mb-0.5">
              {stat.label}
            </span>
            {loading ? (
              <div className="mt-1 h-5 w-16 rounded bg-white/[0.06] animate-pulse" />
            ) : (
              <div
                className={`text-lg leading-snug tabular-nums ${
                  stat.attention ? "text-amber-400" : "text-white"
                }`}
              >
                {stat.value}
              </div>
            )}
            {under && !loading && (
              <p className="mt-1 text-[11px] text-zinc-400 leading-relaxed truncate">{under}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** The strip's own loading shape, for a page that has no figures yet. */
export function StatRowSkeleton({ cells = 4 }: { cells?: number }) {
  return (
    <div
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-4"
      aria-hidden="true"
    >
      {Array.from({ length: cells }).map((_, i) => (
        <div key={i} className="min-w-0">
          <span className="block h-3 w-20 rounded bg-white/[0.06] animate-pulse" />
          <span className="block h-5 w-16 rounded bg-white/[0.06] animate-pulse mt-2" />
        </div>
      ))}
    </div>
  );
}
