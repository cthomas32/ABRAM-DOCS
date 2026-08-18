"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Two views of one thing.
 *
 * The deal list and the deal board were two rows in the navigation, which
 * said they were two things. They are one set of deals looked at twice —
 * once as a table you can sort and once as columns you can drag — so the
 * sidebar now carries one Deals row and the choice is made here, where
 * the reader is already looking at the deals.
 *
 * Links rather than state, because both views are real URLs that people
 * bookmark and that the command palette can reach.
 *
 * One control height per toolbar row: h-9, matching every filter and
 * button beside it.
 */

export interface ViewOption {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export default function ViewSwitch({
  options,
  className = "",
}: {
  options: ViewOption[];
  className?: string;
}) {
  const pathname = (usePathname() ?? "").replace(/\/$/, "");

  return (
    <div
      role="group"
      aria-label="Choose a view"
      className={`inline-flex items-center h-9 p-0.5 rounded-full border border-white/8 bg-white/[0.02] ${className}`}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const active = pathname === option.href.replace(/\/$/, "");
        return (
          <Link
            key={option.href}
            href={option.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium transition-colors ${
              active ? "bg-white text-black" : "text-zinc-300 hover:text-white"
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}

/** The one pair this console has. Named so both screens cannot disagree. */
export const DEAL_VIEWS: ViewOption[] = [
  { href: "/admin/dashboard/deals", label: "List" },
  { href: "/admin/dashboard/deals/board", label: "Board" },
];

/**
 * The same control, switching a view that is not its own address.
 *
 * The table and the board are two ways of drawing one filtered set that
 * is held in memory, and putting the choice in the URL would throw the
 * filters away on every press. So this one is state, and the link version
 * above stays for the cases where the two views really are two pages.
 */
export function SegmentedSwitch<Value extends string>({
  options,
  value,
  onChange,
  className = "",
}: {
  options: { value: Value; label: string; icon?: React.ComponentType<{ className?: string }> }[];
  value: Value;
  onChange: (next: Value) => void;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label="Choose a view"
      className={`inline-flex items-center h-9 p-0.5 rounded-full border border-white/8 bg-white/[0.02] shrink-0 ${className}`}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium transition-colors ${
              active ? "bg-white text-black" : "text-zinc-300 hover:text-white"
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
