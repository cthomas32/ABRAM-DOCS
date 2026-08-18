"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface CollapsibleCardProps {
  title: string;
  subtitle?: string;
  /** Short value shown next to the title while collapsed, e.g. a row count. */
  badge?: string;
  icon?: React.ComponentType<{ className?: string }>;
  /** Expanded on load on small screens. Always expanded from `md` up. */
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/**
 * A panel that reads as an accordion on phones and as a plain card from `md` up,
 * so dense analytics sections do not turn mobile into an endless scroll.
 */
export default function CollapsibleCard({
  title,
  subtitle,
  badge,
  icon: Icon,
  defaultOpen = false,
  children,
}: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="glass-panel rounded-2xl border-white/8">
      {/* Phone: tap the header to expand */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="md:hidden w-full flex items-center justify-between gap-3 p-4 text-left min-h-[56px]"
      >
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            {Icon && <Icon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />}
            <span className="text-xs uppercase font-bold tracking-widest text-gray-400 truncate">
              {title}
            </span>
            {badge && (
              <span className="text-[9px] font-mono text-zinc-400 bg-white/[0.04] border border-white/8 px-1.5 py-0.5 rounded shrink-0">
                {badge}
              </span>
            )}
          </span>
          {subtitle && <span className="block text-[10px] text-zinc-400 mt-1 truncate">{subtitle}</span>}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Desktop: a normal card header */}
      <div className="hidden md:block px-6 pt-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 font-sans flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-zinc-400" />}
          {title}
        </h2>
        {subtitle && <p className="text-[10px] text-zinc-400 mt-1">{subtitle}</p>}
      </div>

      <div className={`${open ? "block" : "hidden"} md:block px-4 pb-4 md:px-6 md:pb-6 md:pt-4`}>
        {children}
      </div>
    </div>
  );
}
