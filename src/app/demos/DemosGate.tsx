/**
 * What a locked /demos looks like.
 *
 * A plain server-rendered form with no client component behind it. The
 * page that renders this has not fetched a single video, so there is
 * nothing here for a crawler or a curious reader to find in the source.
 */

export default function DemosGate({
  next,
  failed,
}: {
  next: string;
  failed: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-24 pt-28 sm:px-6 sm:pt-32 lg:px-8">
      <div className="max-w-md">
        <span className="mb-3 inline-block font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Demos
        </span>
        <h1 className="text-3xl font-medium tracking-tight text-white sm:text-4xl">
          Private.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400 sm:leading-7">
          This page is private. Enter the password to view the demo library.
        </p>

        <form action="/api/demos/unlock" method="POST" className="mt-8">
          <input type="hidden" name="next" value={next} />

          <label
            htmlFor="demos-password"
            className="mb-2 block font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500"
          >
            Password
          </label>
          <input
            id="demos-password"
            name="password"
            type="password"
            autoComplete="off"
            autoFocus
            required
            aria-describedby={failed ? "demos-password-error" : undefined}
            className="w-full rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-white/20 focus:outline-none"
          />

          {failed && (
            <p id="demos-password-error" className="mt-3 text-xs text-zinc-400">
              That password did not work. Try again.
            </p>
          )}

          <button type="submit" className="btn-primary mt-5">
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
}
