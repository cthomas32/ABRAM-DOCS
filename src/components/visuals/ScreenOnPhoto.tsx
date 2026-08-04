import React from "react";
import Image from "next/image";
import AppScreen from "./AppScreen";
import { creditLine, type SitePhoto } from "@/lib/siteImages";
import type { MockupKind } from "@/lib/social/spec";
import type { SocialThemeId } from "@/lib/social/themes";

/**
 * The app, in front of a photograph.
 *
 * ON THE SHELF, with the rest of `visuals/`. Nothing renders it today.
 * See `.agents/site-visuals.md`.
 *
 * The strongest picture this system can make, and the social cards found
 * it first: a window standing in front of a real place says what the
 * software is for and what it does in one look, where either half alone
 * says only one of them.
 *
 * The screen keeps a shadow under it on purpose. A rectangle sitting on a
 * photograph with no shadow reads as a hole cut in the picture, and the
 * shadow is the whole of what makes it a window in front of one.
 */
export default function ScreenOnPhoto({
  photo,
  screen,
  theme = "midnight",
  label,
  eyebrow,
  headline,
  body,
  className = "",
}: {
  photo: SitePhoto | null;
  screen: MockupKind;
  theme?: SocialThemeId;
  /** What the screen shows, for anyone who cannot see it. */
  label?: string;
  eyebrow?: string;
  headline?: string;
  body?: string;
  className?: string;
}) {
  const credit = photo ? creditLine(photo) : null;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-white/8 ${className}`}
      style={{ backgroundColor: photo?.baseColor || "#0A0A0A" }}
    >
      {photo ? (
        <>
          <Image
            src={photo.url}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 1100px"
            loading="lazy"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black/80" />
          {/* Plain opacity. A blend mode here moves the backdrop root and
              the fixed header loses its blur. See PhotoBand. */}
          <div
            className="absolute inset-0 opacity-[0.12] pointer-events-none"
            style={{ backgroundImage: "url(/brand/grain.png)", backgroundSize: "160px 160px" }}
          />
        </>
      ) : null}

      <div className="relative z-10 px-4 py-8 sm:px-10 sm:py-12">
        {eyebrow || headline || body ? (
          <div className="max-w-xl mb-8">
            {eyebrow ? (
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-400 mb-3 inline-block font-sans">
                {eyebrow}
              </span>
            ) : null}
            {headline ? (
              <h3 className="text-xl sm:text-2xl font-medium tracking-tight text-white leading-snug text-balance break-words">
                {headline}
              </h3>
            ) : null}
            {body ? <p className="mt-3 text-sm text-zinc-300 leading-relaxed text-pretty">{body}</p> : null}
          </div>
        ) : null}

        <AppScreen
          kind={screen}
          theme={theme}
          label={label}
          maxWidth={900}
          className="w-full mx-auto drop-shadow-[0_30px_60px_rgba(0,0,0,0.55)]"
        />
      </div>

      {credit ? (
        <span className="absolute bottom-2.5 right-4 z-10 text-[9px] tracking-wide text-white/35 font-sans">
          {credit}
        </span>
      ) : null}
    </div>
  );
}
