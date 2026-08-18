import { BLOCK_LANE, BLOCK_LANE_WIDTH } from "@/lib/crm/blockStyles";

/**
 * The board, shaped, while the rows are read.
 *
 * Same lane widths and card rhythm as the real board, ported from the
 * product app's board skeleton, so the first paint does not reflow.
 */
export default function DealBoardLoading() {
  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 flex-1 min-w-0">
      <div className="mb-5 h-9 w-72 rounded-lg bg-white/[0.04] animate-pulse" />
      <div className="mb-5 h-[92px] rounded-2xl border border-white/5 bg-white/[0.02]" />

      <div className="-mx-1 flex gap-3 overflow-hidden px-1 pb-3">
        {[0, 1, 2, 3, 4].map((lane) => (
          <div key={lane} className={`${BLOCK_LANE_WIDTH} flex flex-col ${BLOCK_LANE}`}>
            <div className="mb-1 flex items-center gap-2 px-0.5">
              <div className="h-3 w-24 animate-pulse rounded bg-white/[0.06]" />
              <div className="ml-auto h-4 w-7 animate-pulse rounded-full bg-white/[0.04]" />
            </div>
            <div className="mb-2.5 h-2.5 w-16 animate-pulse rounded bg-white/[0.04]" />

            <div className="space-y-2.5">
              {[0, 1, 2].map((card) => (
                <div
                  key={card}
                  className="flex flex-col gap-2.5 rounded-xl border border-white/8 bg-white/[0.03] p-3.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-2.5 w-16 animate-pulse rounded bg-white/[0.04]" />
                    <div className="h-[22px] w-[22px] animate-pulse rounded-full bg-white/[0.04]" />
                  </div>
                  <div className="h-3 w-4/5 animate-pulse rounded bg-white/[0.06]" />
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-16 animate-pulse rounded-md bg-white/[0.04]" />
                    <div className="h-6 w-16 animate-pulse rounded-md bg-white/[0.04]" />
                  </div>
                  <div className="h-9 animate-pulse rounded-lg bg-white/[0.03]" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
