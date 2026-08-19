import { PanelSkeleton } from "@/components/admin/Panel";

/**
 * The company record, before it arrives.
 *
 * Same wrapper, same rhythm, no spinner. Nothing moves except the pulse,
 * because a spinner in the middle of a page that is about to become a
 * form tells the reader less than the shape of the form does.
 */
export default function CompanyLoading() {
  return (
    <div className="flex-1 min-w-0 overflow-y-auto">
      <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-6xl mx-auto pb-16">
        <div className="mb-4 h-4 w-40 rounded bg-white/[0.04] animate-pulse" />
        <div className="mb-2.5 h-9 w-72 rounded-lg bg-white/[0.04] animate-pulse" />
        <div className="mb-5 h-3 w-56 rounded bg-white/[0.04] animate-pulse" />

        <div className="mb-6 flex gap-2 border-b border-white/5 pb-3">
          {[0, 1, 2].map((pill) => (
            <div key={pill} className="h-11 sm:h-9 w-28 rounded-full bg-white/[0.03] animate-pulse" />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-6 lg:gap-8 items-start">
          <div className="min-w-0 space-y-7">
            {[0, 1].map((section) => (
              <div key={section} className="space-y-3.5">
                <div className="h-3 w-24 rounded bg-white/[0.06] animate-pulse" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
                  {[0, 1, 2, 3].map((field) => (
                    <div key={field}>
                      <div className="mb-1.5 h-2.5 w-16 rounded bg-white/[0.04] animate-pulse" />
                      <div className="h-11 sm:h-9 rounded-lg bg-white/[0.02] border border-white/8" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="min-w-0">
            <PanelSkeleton rows={4} />
          </div>
        </div>
      </div>
    </div>
  );
}
