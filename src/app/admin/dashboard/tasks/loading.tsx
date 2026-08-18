/**
 * The queue, shaped, while the rows are read.
 *
 * Same header, stat row and card rhythm as the real queue, so arriving
 * does not flash an empty page and then push everything into place.
 */
export default function TasksLoading() {
  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 flex-1 min-w-0">
      <div className="mb-5 h-9 w-64 rounded-lg bg-white/[0.04] animate-pulse" />
      <div className="mb-5 h-[92px] rounded-2xl border border-white/5 bg-white/[0.02]" />

      <div className="space-y-7 max-w-3xl">
        {[0, 1, 2].map((section) => (
          <div key={section}>
            <div className="mb-2.5 h-3 w-24 animate-pulse rounded bg-white/[0.06]" />
            <div className="space-y-2.5">
              {[0, 1].map((row) => (
                <div
                  key={row}
                  className="flex gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-3.5"
                >
                  <div className="mt-0.5 h-5 w-5 shrink-0 animate-pulse rounded-full bg-white/[0.04]" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-2.5 w-40 animate-pulse rounded bg-white/[0.04]" />
                    <div className="h-3 w-3/5 animate-pulse rounded bg-white/[0.06]" />
                    <div className="flex gap-1.5">
                      <div className="h-6 w-20 animate-pulse rounded-md bg-white/[0.04]" />
                      <div className="h-6 w-24 animate-pulse rounded-md bg-white/[0.04]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
