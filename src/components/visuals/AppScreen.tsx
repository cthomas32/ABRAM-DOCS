"use client";

import React, { useEffect, useRef, useState } from "react";
import { AppMockup, MOCKUP_ASPECT } from "@/lib/social/mockups";
import { SOCIAL_THEMES, type SocialThemeId } from "@/lib/social/themes";
import type { MockupKind } from "@/lib/social/spec";

/**
 * One drawn screen of the app, on a web page.
 *
 * ON THE SHELF, with the rest of `visuals/`. Nothing renders it today.
 * See `.agents/site-visuals.md`.
 *
 * The same twenty-nine screens the social cards are built from, rendered
 * straight into the page. They were always plain flex boxes with inline
 * styles, because the card renderer has no CSS engine, and that is exactly
 * what a browser will take.
 *
 * The alternative was a screenshot, which is soft on a retina display, goes
 * stale the first time the UI moves, and carries whatever data happened to
 * be on screen the day it was taken. These are sharp at any size, invented
 * on purpose, and they change with the product because they are drawn from
 * the same file the cards use.
 *
 * The screens size everything off one width, so this measures its container
 * and hands that width down. No transform, no scaling artefacts, and the
 * type inside stays real type at whatever size the column ends up.
 */
export default function AppScreen({
  kind,
  theme = "midnight",
  className = "",
  maxWidth = 900,
  label,
}: {
  kind: MockupKind;
  theme?: SocialThemeId;
  className?: string;
  /** Beyond this the internals stop growing, so a wide column does not draw a wall of 20px type. */
  maxWidth?: number;
  /** What the screen shows, for anyone who cannot see it. */
  label?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = box.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const measured = entries[0]?.contentRect.width ?? 0;
      // Rounded to four pixels so a resize drag does not re-render on
      // every frame, and so the drawn units stay stable while it moves.
      setWidth(Math.round(measured / 4) * 4);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const drawn = Math.min(width, maxWidth);
  const aspect = MOCKUP_ASPECT[kind] ?? 0.72;

  return (
    <div
      ref={box}
      className={className}
      // The height is known before the width is measured, so the page does
      // not jump when the screen arrives.
      style={{ aspectRatio: `1 / ${aspect}` }}
      role="img"
      aria-label={label || "A screen from ABRAM"}
    >
      {drawn > 0 ? (
        <AppMockup
          kind={kind}
          theme={SOCIAL_THEMES[theme]}
          // Served from public/, which the browser reads directly. The card
          // renderer inlines these as data URIs because Satori cannot fetch.
          mark={SOCIAL_THEMES[theme].ink === "black" ? "/brand/mark-black.png" : "/brand/mark-cream.png"}
          lockup={SOCIAL_THEMES[theme].ink === "black" ? "/brand/lockup-black.png" : "/brand/lockup-cream.png"}
          width={drawn}
        />
      ) : null}
    </div>
  );
}
