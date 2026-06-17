"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { resolveDocLink } from "./MdxLink";

interface WorkflowCardProps {
  step: string;
  title: string;
  tag: string;
  href?: string;
  description?: string;
  children?: React.ReactNode;
}

export function WorkflowCard({
  step,
  title,
  tag,
  href,
  description,
  children,
}: WorkflowCardProps) {
  const pathname = usePathname() || "";
  const bodyText = description || children;

  const cardContent = (
    <div className="flex flex-col justify-between h-full p-4 min-h-[160px]">
      <div className="space-y-4">
        {/* Header step and tag */}
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold text-zinc-600 dark:text-zinc-500 font-sans tracking-widest uppercase">
            STEP {step}
          </span>
          <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/3 text-zinc-500 font-sans border border-white/3">
            {tag}
          </span>
        </div>

        {/* Title and Body */}
        <div className="space-y-2">
          <h3 className="font-sans text-xs font-bold uppercase tracking-wide text-zinc-200 group-hover:text-white transition-colors">
            {title}
          </h3>
          <div className="text-[10px] text-zinc-400 leading-relaxed font-sans font-normal [&_p]:text-[10px] [&_p]:text-zinc-400 [&_p]:my-0 [&_p]:leading-relaxed">
            {typeof bodyText === "string" ? <p>{bodyText}</p> : bodyText}
          </div>
        </div>
      </div>

      {/* Footer link */}
      {href && (
        <div className="pt-3 flex items-center justify-end text-[9px] font-bold text-zinc-500 group-hover:text-white transition-colors gap-0.5 font-sans">
          Read Guide
          <ChevronRight className="h-2.5 w-2.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      )}
    </div>
  );

  const className = "group relative flex flex-col justify-between rounded-xl glass-panel border border-white/3 hover:bg-zinc-900/10 hover:-translate-y-0.5 transition-all duration-300 h-full overflow-hidden no-underline cursor-pointer";

  if (href) {
    const resolvedHref = resolveDocLink(href, pathname);
    const isExternal =
      href.startsWith("http://") ||
      href.startsWith("https://") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("//");

    if (isExternal) {
      return (
        <a href={resolvedHref} target="_blank" rel="noopener noreferrer" className={className}>
          {cardContent}
        </a>
      );
    }

    return (
      <Link href={resolvedHref} className={className}>
        {cardContent}
      </Link>
    );
  }

  return <div className={className}>{cardContent}</div>;
}

interface WorkflowCardGroupProps {
  cols?: number;
  children: React.ReactNode;
}

export function WorkflowCardGroup({ cols = 4, children }: WorkflowCardGroupProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  }[cols] || "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div className={`grid ${gridCols} gap-4 my-6`}>
      {children}
    </div>
  );
}
