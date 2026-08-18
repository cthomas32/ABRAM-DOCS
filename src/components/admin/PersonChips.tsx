/**
 * Where a person is, and how they got here.
 *
 * Two chips, drawn the same way everywhere they appear, because the
 * lifecycle and the source were previously readable only by opening the
 * record and inferring them from four other columns.
 *
 * The lifecycle is one chip and carries the only colour: violet at sales
 * qualified, emerald at customer, quiet grey for everything else. The
 * sources are as many chips as there are, all quiet — they are facts
 * about the past, not a state anybody acts on.
 */

import React from "react";
import { lifecycleSpec, sourceLabel } from "@/lib/crm/people";

const CHIP =
  "inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded border whitespace-nowrap";

export function LifecycleChip({
  stage,
  className = "",
}: {
  stage: string | null | undefined;
  className?: string;
}) {
  const spec = lifecycleSpec(stage);
  return (
    <span className={`${CHIP} ${spec.badge} ${className}`} title={spec.hint}>
      {spec.label}
    </span>
  );
}

export function SourceChips({
  sources,
  /** Beyond this, the rest are counted rather than listed. */
  limit = 3,
  className = "",
}: {
  sources: readonly string[] | null | undefined;
  limit?: number;
  className?: string;
}) {
  const all = sources ?? [];
  if (all.length === 0) return null;

  const shown = all.slice(0, limit);
  const rest = all.length - shown.length;

  return (
    <span className={`inline-flex flex-wrap items-center gap-1 ${className}`}>
      {shown.map((source) => (
        <span key={source} className={`${CHIP} bg-white/[0.03] border-white/8 text-zinc-400`}>
          {sourceLabel(source)}
        </span>
      ))}
      {rest > 0 && (
        <span
          className={`${CHIP} bg-white/[0.03] border-white/8 text-zinc-400`}
          title={all.map(sourceLabel).join(", ")}
        >
          +{rest}
        </span>
      )}
    </span>
  );
}
