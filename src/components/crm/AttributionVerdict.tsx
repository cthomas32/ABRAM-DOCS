/**
 * The verdict, and every rule that did not fire.
 *
 * The rejection list is not a debugging aid, it is the feature. "Why did
 * this not pay" gets asked far more often than "why did this pay", and an
 * answer that lists what was tested and what each test said settles it in
 * one screen instead of in a thread. So the rejections are shown by
 * default rather than hidden behind a disclosure — a person who has to
 * click to find out why they were not paid has already decided the system
 * is hiding something.
 *
 * There is nothing to change here on purpose. Attribution is derived, and
 * the only way to move it is to change the underlying fact — link a promo
 * code, correct a source, approve a registration — each of which is
 * recorded somewhere else. A dropdown on this panel would be the
 * discretionary override the agreement rules out.
 *
 * Presentational only: no data fetching, no server imports. Safe for a
 * client component to render.
 */

import type { AttributionVerdict as Verdict } from "@/lib/crm/attribution";
import { attributionSpec } from "@/lib/crm/constants";

export interface AttributionVerdictProps {
  /** Null while it has not been derived yet. */
  verdict: Verdict | null;
  /** Settled deals show the answer that was settled, not a fresher one. */
  locked?: boolean;
  /** Things a person has to settle. Never things the rules decided. */
  warnings?: string[];
  /** Rendered under the verdict — builder A's "Recheck attribution" button. */
  action?: React.ReactNode;
  className?: string;
}

export default function AttributionVerdict({
  verdict,
  locked = false,
  warnings = [],
  action,
  className = "",
}: AttributionVerdictProps) {
  const spec = verdict ? attributionSpec(verdict.rule) : null;

  return (
    <section className={`rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 font-sans">
          Attribution
        </span>
        {locked ? (
          <span className="text-[10px] font-medium tracking-wide uppercase text-zinc-500 border border-white/5 rounded-full px-2 py-0.5">
            Settled
          </span>
        ) : null}
      </div>

      {!verdict || !spec ? (
        <p className="text-sm text-zinc-400">Not derived yet.</p>
      ) : (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[11px] font-medium rounded-full border px-2.5 py-1 ${spec.badge}`}
            >
              {spec.label}
            </span>
            {verdict.ref ? (
              <code className="text-[11px] text-zinc-400 font-mono truncate max-w-[16rem]">
                {verdict.ref}
              </code>
            ) : null}
          </div>

          <p className="text-sm text-zinc-300 mt-3 leading-relaxed">{verdict.reason}</p>

          {verdict.rejected.length > 0 ? (
            <div className="mt-4 pt-4 border-t border-white/5">
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 font-sans">
                Tested and rejected
              </span>
              <ul className="mt-2.5 space-y-1.5">
                {verdict.rejected.map((rejection, index) => (
                  <li
                    key={`${rejection.rule}-${index}`}
                    className="text-[11px] text-zinc-400 leading-relaxed flex gap-2"
                  >
                    <span className="text-zinc-600 shrink-0">
                      {attributionSpec(rejection.rule).label}
                    </span>
                    <span>{rejection.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Warnings are separated from rejections deliberately. A
              rejection is the rules working; a warning is a fact in the
              data that a person has to go and settle. */}
          {warnings.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {warnings.map((warning, index) => (
                <li
                  key={index}
                  className="text-[11px] text-amber-200/80 leading-relaxed rounded-xl border border-amber-500/15 bg-amber-500/[0.04] px-3 py-2"
                >
                  {warning}
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}

      {action ? <div className="mt-4">{action}</div> : null}
    </section>
  );
}
