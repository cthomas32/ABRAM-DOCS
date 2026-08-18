/**
 * One number, named.
 *
 * Extracted from the earnings page, which was the only screen that had it
 * and the only screen that looked settled. Every stat on the console uses
 * this now, so a row of four on one page is the same object as a row of
 * four on another.
 *
 * A tile is quiet on purpose. No coloured edge, no accent fill, no icon
 * badge. The number is the loud part.
 */

import React from "react";
import Overline from "./Overline";

export default function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  /** Already formatted. Pass `formatMoney(...)` or a `<Money />` element. */
  value: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
      <Overline>{label}</Overline>
      <span className="block text-lg sm:text-2xl font-bold tracking-tight text-white mt-1.5 break-words tabular-nums">
        {value}
      </span>
      {hint && (
        <span className="block text-[11px] text-zinc-500 mt-1 leading-relaxed">{hint}</span>
      )}
    </div>
  );
}

/** The row a set of tiles sits in, so the grid is not rewritten per page. */
export function StatRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">{children}</div>
  );
}

/**
 * The shape of a tile while its number is still loading. Same box, same
 * height, so the page does not jump when the figure arrives.
 */
export function StatTileSkeleton() {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4" aria-hidden="true">
      <span className="block h-3 w-20 rounded bg-white/[0.06]" />
      <span className="block h-7 w-28 rounded bg-white/[0.06] mt-2" />
    </div>
  );
}
