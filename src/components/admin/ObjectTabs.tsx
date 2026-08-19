/**
 * One object, one route, tabs inside it.
 *
 * The CRM had grown a page per verb: contacts, accounts, deals, the deal
 * board, tasks, registrations, reports, sequences, lists. Nine rows in a
 * sidebar for four things anybody actually thinks about, which is why the
 * founder's complaint about it kept coming back. So the shape is the
 * product's own project screen: an object is one address, and the ways of
 * looking at it are tabs on that address.
 *
 * The tab is in the URL rather than in state, so a tab can be linked, a
 * back button works, and a redirect from an old address can land on the
 * right one. That is the whole reason this is links rather than buttons.
 */

import Link from "next/link";
import React from "react";

export interface ObjectTab {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  /** Drawn after the label. A count, usually. */
  badge?: React.ReactNode;
}

export default function ObjectTabs({
  tabs,
  current,
  /** The route the tabs live on. `?tab=` is appended to it. */
  basePath,
  className = "",
}: {
  tabs: ObjectTab[];
  current: string;
  basePath: string;
  className?: string;
}) {
  return (
    <nav
      aria-label="Views of this object"
      className={`flex gap-2 border-b border-white/5 pb-3 overflow-x-auto ${className}`}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = tab.id === current;
        return (
          <Link
            key={tab.id}
            href={`${basePath}?tab=${encodeURIComponent(tab.id)}`}
            aria-current={active ? "page" : undefined}
            className={`flex items-center justify-center gap-2 px-4 h-11 sm:h-9 rounded-full text-[11px] font-medium border transition-colors shrink-0 ${
              active
                ? "bg-white text-black border-white"
                : "bg-white/[0.03] text-zinc-400 border-white/8 hover:text-zinc-200"
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {tab.label}
            {tab.badge !== undefined && tab.badge !== null && (
              <span className="tabular-nums opacity-70">{tab.badge}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * The header every object screen opens with.
 *
 * Name, what it holds, and the one action that makes a new one. Nothing
 * else: a subtitle explaining the object is a subtitle nobody reads twice,
 * and the tabs directly below already say what can be done with it.
 */
export function ObjectHeader({
  title,
  count,
  countLabel,
  action,
  children,
}: {
  title: string;
  count?: number;
  /** The word after the number. Singular and plural handled by the caller. */
  countLabel?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          {title}
          {count !== undefined && (
            <span className="text-zinc-500 text-lg font-normal tracking-normal ml-3 tabular-nums">
              {count.toLocaleString()}
              {countLabel ? ` ${countLabel}` : ""}
            </span>
          )}
        </h1>
        {children}
      </div>
      {action && <div className="flex flex-wrap gap-2 shrink-0">{action}</div>}
    </header>
  );
}

/** Which tab to draw, given what the address asked for. */
export function resolveTab(tabs: ObjectTab[], wanted: string | undefined, fallback: string): string {
  return tabs.some((tab) => tab.id === wanted) ? (wanted as string) : fallback;
}
