"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { usePathname } from "next/navigation";
import { getAllDocPages } from "../utils/navigation";

interface BreadcrumbsProps {
  slug?: string[];
}

export default function Breadcrumbs({ slug }: BreadcrumbsProps) {
  const pathname = usePathname();

  // If slug is not passed, resolve it from the pathname (e.g. /docs/user-guide/1.1-onboarding -> ["user-guide", "1.1-onboarding"])
  const resolvedSlug = slug !== undefined ? slug : (
    pathname.startsWith("/docs") 
      ? pathname.slice(5).split("/").filter(Boolean) 
      : []
  );

  if (resolvedSlug.length === 0) {
    return (
      <nav className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-6" aria-label="Breadcrumb">
        <span className="flex items-center gap-1">
          <Home className="h-3.5 w-3.5" />
          <span>Help Guides</span>
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
        <span className="text-zinc-900 dark:text-zinc-200 font-semibold">Introduction</span>
      </nav>
    );
  }

  const currentPath = resolvedSlug.join("/");
  const pages = getAllDocPages();
  const currentPage = pages.find((p) => p.path === currentPath);

  if (!currentPage) {
    return null;
  }

  return (
    <nav className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-6 flex-wrap" aria-label="Breadcrumb">
      <Link
        href="/docs"
        className="flex items-center gap-1 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
        <span>Help Guides</span>
      </Link>
      <ChevronRight className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
      <span>{currentPage.group}</span>
      <ChevronRight className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
      <span className="text-zinc-900 dark:text-zinc-200 font-semibold truncate max-w-[200px] sm:max-w-none">
        {currentPage.title}
      </span>
    </nav>
  );
}
