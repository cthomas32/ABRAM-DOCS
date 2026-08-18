/**
 * The four panel treatments, and only four.
 *
 * amber for warnings, emerald for success, rose for errors and zinc for
 * everything else were being picked inline, file by file, so the same
 * state looked different on two screens and two different states looked
 * the same on one. The set is closed now:
 *
 *   neutral    the default. Also what an ERROR looks like. There is no red
 *              on this console: a failed save is a sentence, not an alarm,
 *              and colouring it red makes every ordinary mistake look like
 *              data loss.
 *   attention  amber, for one thing only: a state that costs money if it
 *              is ignored. No terms recorded, a window about to lapse. Not
 *              validation, not warnings in general.
 *   reached    emerald, for one thing only: a threshold that has been
 *              crossed. Not success toasts.
 *   empty      a dashed panel where content would be. One sentence saying
 *              what would appear here, and one action.
 *
 * If a fifth is wanted, the honest question is which of these four the
 * state actually is.
 */

import React from "react";

export type PanelTone = "neutral" | "attention" | "reached";

const TONES: Record<PanelTone, { box: string; title: string; body: string }> = {
  neutral: {
    box: "border-white/10 bg-white/[0.02]",
    title: "text-white",
    body: "text-zinc-400",
  },
  attention: {
    box: "border-amber-500/20 bg-amber-500/[0.04]",
    title: "text-amber-200",
    body: "text-zinc-400",
  },
  reached: {
    box: "border-emerald-500/20 bg-emerald-500/[0.04]",
    title: "text-emerald-200",
    body: "text-zinc-400",
  },
};

export default function Panel({
  tone = "neutral",
  title,
  icon,
  children,
  className = "",
}: {
  tone?: PanelTone;
  title?: React.ReactNode;
  /** A lucide icon element, already sized. Optional. */
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  const spec = TONES[tone];

  return (
    <div className={`rounded-2xl border p-4 ${spec.box} ${className}`}>
      <div className="flex gap-3">
        {icon && <span className="shrink-0 mt-0.5">{icon}</span>}
        <div className="min-w-0">
          {title && (
            <p className={`text-xs font-semibold ${spec.title}`}>{title}</p>
          )}
          {children && (
            <div className={`text-[11px] leading-relaxed ${spec.body} ${title ? "mt-1" : ""}`}>
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Nothing here yet, and why.
 *
 * Never a bare zero and never a shrug. It says what would be in this
 * space and, where there is one, offers the action that would put
 * something in it.
 */
export function EmptyPanel({
  title,
  children,
  icon,
  action,
}: {
  title: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-8 text-center">
      {icon && <div className="flex justify-center mb-3 text-zinc-400">{icon}</div>}
      <p className="text-sm text-white">{title}</p>
      {children && (
        <p className="text-[11px] text-zinc-400 mt-1.5 max-w-md mx-auto leading-relaxed">
          {children}
        </p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

/**
 * A block of content that has not arrived yet, shaped like what it
 * replaces. Rows of the height they will be, so nothing jumps.
 */
export function PanelSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2.5" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <span className="block h-3.5 w-40 rounded bg-white/[0.06] animate-pulse" />
          <span className="block h-2.5 w-24 rounded bg-white/[0.04] animate-pulse mt-2" />
        </div>
      ))}
    </div>
  );
}
