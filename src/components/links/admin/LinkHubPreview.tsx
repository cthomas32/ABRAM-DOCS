"use client";

import { RefreshCw, Smartphone } from "lucide-react";
import type { LinkHubLink, LinkHubSettings } from "@/lib/linkHub";
import LinkHubView from "../LinkHubView";

/**
 * Live preview of the public page inside a phone frame.
 *
 * It renders the real page component, so anything an editor changes in
 * the design panel is exactly what a visitor will see. Links are inert
 * here and nothing is tracked.
 */
export default function LinkHubPreview({
  links,
  settings,
  onRefresh,
}: {
  links: LinkHubLink[];
  settings: LinkHubSettings;
  onRefresh?: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 flex items-center gap-1.5">
          <Smartphone className="w-3 h-3" />
          Live preview
        </span>
        {onRefresh ? (
          <button
            onClick={onRefresh}
            aria-label="Refresh preview"
            className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      <div className="rounded-[2.25rem] border border-white/10 bg-black p-2.5 shadow-2xl shadow-black/60">
        <div className="relative rounded-[1.85rem] overflow-hidden bg-black">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 w-24 h-5 rounded-b-2xl bg-black" />
          {/* --lh-vh tells the locked background layer how tall the
              scrolling viewport is, so it pins inside this frame. */}
          <div
            className="h-[620px] overflow-y-auto overscroll-contain"
            style={{ "--lh-vh": "620px" } as React.CSSProperties}
          >
            <LinkHubView
              links={links}
              settings={settings}
              shareUrl="https://abram.network/links"
              preview
            />
          </div>
        </div>
      </div>
    </div>
  );
}
