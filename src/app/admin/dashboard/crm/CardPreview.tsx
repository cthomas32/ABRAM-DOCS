"use client";

import React, { useEffect, useRef, useState } from "react";
import CaptureForm from "@/components/crm/CaptureForm";
import ContactCardSurface, { type CardLink } from "@/components/crm/ContactCardSurface";
import { SOCIAL_THEMES } from "@/lib/social/themes";

/**
 * The card, on a phone, while you are still typing it.
 *
 * The fields on this tab used to be a form with no picture of what they
 * produce, so the only way to find out what a change did was to save it and
 * open the card on a handset. This draws the same thing beside the inputs
 * and updates on every keystroke, which is the difference between filling
 * in a form and designing a card.
 *
 * What is inside the frame is the card. Not a copy of it, not something
 * built to match it: `ContactCardSurface` and `CaptureForm` are the exact
 * two components `/c/<slug>` renders, in preview mode. A replica lived here
 * once and had already drifted from the real page by the time anybody
 * noticed, which is the whole argument against keeping one.
 *
 * Preview mode is what makes that safe. The form starts no outbox, sends no
 * scan beacon, registers no service worker, and its submit handler returns
 * before it touches anything, so nothing in this console can write a
 * contact or send an email. The surface, meanwhile, draws nothing but what
 * it is given.
 *
 * It draws what a visitor would see rather than what was typed. Anything
 * left blank on the card falls through to the shared team record, and the
 * caller resolves that fallback before handing the values down. A blank job
 * title with an inherited one behind it is not an empty line.
 *
 * The card is laid out at a real handset's width and then scaled, so the
 * relationship between the photograph, the name and the button is the one
 * that will be on the phone rather than an approximation of it at whatever
 * width the console column happens to be.
 *
 * The frame around it is drawn here rather than borrowed, because the
 * Social Studio has no handset: `mockups.tsx` draws browser shaped app
 * windows, and the one phone screen it once had was deleted on purpose,
 * for the reason set out in `.agents/social-images.md`. What is borrowed is
 * its palette, so the bezel, the border and the shadow are the same tokens
 * a drawn app window is built from and the two read as one family.
 */

/** A real handset's logical screen, which is what the card is laid out for. */
const SCREEN_WIDTH = 390;
const SCREEN_HEIGHT = 844;

export type { CardLink };

export interface CardPreviewProps {
  /** The address the real card would live at, which the vCard button uses. */
  slug: string;
  fullName: string;
  role: string | null;
  tagline: string | null;
  avatarUrl: string | null;
  links: CardLink[];
}

export default function CardPreview({
  slug,
  fullName,
  role,
  tagline,
  avatarUrl,
  links,
}: CardPreviewProps) {
  const box = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [contentHeight, setContentHeight] = useState(SCREEN_HEIGHT);

  /* The frame is measured rather than fixed, because this sits in a column
     that is a third of a desktop and the whole width of a phone. Rounded to
     four pixels so a resize drag does not re-render on every frame. */
  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const measured = entries[0]?.contentRect.width ?? 0;
      setWidth(Math.round(measured / 4) * 4);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  /* A transform does not change layout, so the scrolling wrapper is told
     the drawn height rather than being left to work it out from a box that
     is still its full size as far as the document is concerned. */
  useEffect(() => {
    const element = content.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      setContentHeight(Math.ceil(entries[0]?.contentRect.height ?? SCREEN_HEIGHT));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const theme = SOCIAL_THEMES.midnight;
  // The bezel takes a few pixels off each side before the screen starts.
  const bezel = Math.max(6, Math.round(width * 0.028));
  const screenWidth = Math.max(0, width - bezel * 2);
  const scale = screenWidth > 0 ? screenWidth / SCREEN_WIDTH : 0;
  const name = fullName.trim() || "Your name";

  return (
    <div
      ref={box}
      role="img"
      aria-label={`Preview of the card a visitor sees for ${name}`}
      className="mx-auto w-full max-w-[320px]"
    >
      <div
        className="relative rounded-[2.4rem]"
        style={{
          padding: bezel,
          backgroundColor: theme.appShell,
          border: `1px solid ${theme.panelBorder}`,
          boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
        }}
      >
        <div
          className="relative overflow-hidden rounded-[1.9rem] bg-[#0A0A0A]"
          style={{ height: scale > 0 ? Math.round(SCREEN_HEIGHT * scale) : 420 }}
        >
          {/* The band a handset keeps for its own clock and camera. Drawn so
              the preview is read as a screen rather than as a panel. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-black/80"
          />

          <div
            className="h-full w-full overflow-y-auto overscroll-contain"
            style={{ scrollbarWidth: "none" }}
          >
            <div
              style={{
                height: scale > 0 ? Math.round(contentHeight * scale) : undefined,
                position: "relative",
              }}
            >
              {/* `inert` is what makes a working form safe to draw. It takes
                  the whole subtree out of the tab order, out of the pointer
                  and out of the accessibility tree in one attribute, so the
                  real inputs are a picture rather than something to
                  accidentally type into or tab through. The frame carries
                  the description instead. */}
              <div
                ref={content}
                inert
                className="absolute left-0 top-0 select-none font-sans"
                style={{
                  width: SCREEN_WIDTH,
                  transform: scale > 0 ? `scale(${scale})` : undefined,
                  transformOrigin: "top left",
                }}
              >
                <ContactCardSurface
                  preview
                  slug={slug}
                  fullName={name}
                  role={role}
                  tagline={tagline}
                  avatarUrl={avatarUrl}
                  links={links}
                  formSlot={<CaptureForm preview slug={slug} code={null} ownerName={name} />}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
