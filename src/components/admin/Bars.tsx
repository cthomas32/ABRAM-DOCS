/**
 * The one chart on this console.
 *
 * No charting library. Every reading these screens state is a set of
 * labelled quantities compared against the largest of them, which is a
 * row and a rule wide, and shipping a rendering engine to draw a rule is
 * how a marketing console ends up with a two hundred kilobyte report page.
 *
 * The style follows the rest of the console rather than a chart
 * convention: no axes, no gridlines, no legend, no colour per series. One
 * neutral fill, one violet for the row being pointed at, the number said
 * in words beside the bar rather than inferred from its length. A chart
 * here is a table that happens to be sorted.
 */

import React from "react";

export interface BarDatum {
  /** Unique within the set. Also what is drawn on the left. */
  id: string;
  label: string;
  /** The quantity. Negative values are clamped: a bar cannot run backwards. */
  value: number;
  /** Already formatted, because only the caller knows whether this is money. */
  display: React.ReactNode;
  /** One quiet line under the label. */
  hint?: React.ReactNode;
  /** Draws this row in the accent. Spend it on one row, or none. */
  accent?: boolean;
}

export default function Bars({
  data,
  /** Compare against this rather than the largest value present. */
  max,
  emptyLabel = "Nothing to compare yet.",
  className = "",
}: {
  data: BarDatum[];
  max?: number;
  emptyLabel?: string;
  className?: string;
}) {
  const ceiling = Math.max(max ?? 0, ...data.map((row) => Math.max(0, row.value)), 1);

  if (data.length === 0) {
    return <p className={`text-[11px] text-zinc-400 ${className}`}>{emptyLabel}</p>;
  }

  return (
    <ul className={`space-y-2.5 ${className}`}>
      {data.map((row) => {
        const width = Math.min(100, Math.round((Math.max(0, row.value) / ceiling) * 100));
        return (
          <li key={row.id}>
            <div className="flex items-baseline justify-between gap-3 mb-1.5">
              <span className="text-xs text-zinc-300 truncate">
                {row.label}
                {row.hint && <span className="text-zinc-500 ml-2">{row.hint}</span>}
              </span>
              <span className="text-xs text-white tabular-nums shrink-0">{row.display}</span>
            </div>
            <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className={`h-full rounded-full ${row.accent ? "bg-violet-400" : "bg-zinc-600"}`}
                style={{ width: `${width}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * A week by week row, drawn as columns rather than as a line.
 *
 * Columns because the underlying quantity is a count of things that
 * happened in a bucket, and a line between two buckets implies values in
 * between that nobody measured.
 */
export function WeekColumns({
  weeks,
  className = "",
}: {
  weeks: { week: string; events: number }[];
  className?: string;
}) {
  if (weeks.length === 0) {
    return <span className={`text-[11px] text-zinc-500 ${className}`}>Nothing logged.</span>;
  }

  const ceiling = Math.max(1, ...weeks.map((week) => week.events));

  return (
    <span className={`inline-flex items-end gap-[3px] h-6 ${className}`} aria-hidden="true">
      {weeks.map((week) => (
        <span
          key={week.week}
          title={`${week.events} in the week of ${week.week}`}
          className="w-1.5 rounded-sm bg-zinc-600"
          style={{ height: `${Math.max(8, Math.round((week.events / ceiling) * 100))}%` }}
        />
      ))}
    </span>
  );
}
