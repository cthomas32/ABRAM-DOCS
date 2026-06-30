import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 font-sans">
      <div className="glass-panel max-w-md w-full p-8 md:p-10 rounded-2xl border border-white/5 space-y-6 shadow-2xl">
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500 font-mono">
          Error 404
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Page Not Found
        </h1>
        <p className="text-sm leading-relaxed text-zinc-400">
          The article or resource you are looking for might have been moved, deleted, or is currently saved as a draft.
        </p>
        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-primary py-2 px-5 text-xs font-semibold rounded-full">
            Go to Homepage
          </Link>
          <Link href="/docs" className="btn-glass py-2 px-5 text-xs font-medium rounded-full">
            Help Documentation
          </Link>
        </div>
      </div>
    </div>
  );
}
