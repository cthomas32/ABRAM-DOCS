"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { getAdjacentPages } from "../utils/navigation";

interface PrevNextNavProps {
  slug?: string[];
}

export default function PrevNextNav({ slug }: PrevNextNavProps) {
  const pathname = usePathname();

  // If slug is not passed, resolve it from the pathname
  const resolvedSlug = slug !== undefined ? slug : (
    pathname.startsWith("/docs") 
      ? pathname.slice(5).split("/").filter(Boolean) 
      : []
  );

  const currentPath = resolvedSlug.join("/");
  const { prev, next } = getAdjacentPages(currentPath);

  if (!prev && !next) {
    return null;
  }

  return (
    <div className="mt-12 flex flex-col sm:flex-row gap-4 border-t border-zinc-200 dark:border-zinc-800 pt-8">
      {prev ? (
        <Link
          href={prev.slug.length === 0 ? "/docs" : `/docs/${prev.slug.join("/")}`}
          className="group flex flex-1 flex-col gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 text-left transition hover:border-emerald-500/50 hover:bg-zinc-50/20 dark:hover:border-emerald-500/30 dark:hover:bg-zinc-900/10 no-underline"
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 group-hover:text-emerald-500 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Previous</span>
          </div>
          <span className="font-sans text-sm font-bold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
            {prev.title}
          </span>
        </Link>
      ) : (
        <div className="hidden sm:block flex-1" />
      )}

      {next ? (
        <Link
          href={next.slug.length === 0 ? "/docs" : `/docs/${next.slug.join("/")}`}
          className="group flex flex-1 flex-col gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 text-right items-end transition hover:border-emerald-500/50 hover:bg-zinc-50/20 dark:hover:border-emerald-500/30 dark:hover:bg-zinc-900/10 no-underline"
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 group-hover:text-emerald-500 transition-colors">
            <span>Next</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
          <span className="font-sans text-sm font-bold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
            {next.title}
          </span>
        </Link>
      ) : (
        <div className="hidden sm:block flex-1" />
      )}
    </div>
  );
}
