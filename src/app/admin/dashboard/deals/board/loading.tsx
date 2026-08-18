/**
 * The board, shaped, while the rows are read.
 *
 * Five columns of the right width with three card-sized blocks in each,
 * so arriving at the page does not flash an empty screen and then push
 * everything into place.
 */
export default function DealBoardLoading() {
  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 flex-1 min-w-0">
      <div className="mb-6 h-9 w-72 rounded-lg bg-white/[0.04] animate-pulse" />

      <div className="flex gap-3 overflow-hidden pb-3">
        {[0, 1, 2, 3, 4].map((column) => (
          <div
            key={column}
            className="w-[260px] xl:w-[280px] shrink-0 rounded-2xl border border-white/5 bg-white/[0.02]"
          >
            <div className="px-3 pt-3 pb-2 border-b border-white/5">
              <div className="h-3 w-24 rounded bg-white/[0.05] animate-pulse" />
              <div className="h-3 w-16 rounded bg-white/[0.04] animate-pulse mt-2" />
            </div>
            <div className="p-2 flex flex-col gap-2">
              {[0, 1, 2].map((card) => (
                <div
                  key={card}
                  className="h-[104px] rounded-xl border border-white/8 bg-white/[0.02] animate-pulse"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
