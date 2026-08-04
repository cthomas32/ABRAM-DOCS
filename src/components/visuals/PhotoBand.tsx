import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { creditLine, type SitePhoto } from "@/lib/siteImages";

/**
 * A photograph across the page, with one thing said over it.
 *
 * ON THE SHELF. This is not on any page today: it was placed once and
 * taken back off, and the placement is being rethought. See
 * `.agents/site-visuals.md` before wiring it in again.
 *
 * The site is dark panels on a dark background, which is right for the
 * product and wrong for every third screen of it: a page of glass tiles
 * reads as software, and the work our reader actually does happens
 * outdoors, at six in the morning, in weather. One of our own photographs
 * across the page says that in less time than a paragraph.
 *
 * Two rules hold it together. The scrim is heavy on the left where the
 * words are and light on the right, because the library holds bright
 * pictures as well as dark ones and copy has to survive both. And the top
 * and bottom fade to the page colour, so the band is part of the page
 * rather than a rectangle somebody pasted onto it.
 *
 * With no photograph it renders the copy on the ordinary background. The
 * library going quiet costs a section its picture, never its words.
 */
export default function PhotoBand({
  photo,
  eyebrow,
  headline,
  body,
  cta,
  align = "left",
  height = "tall",
  priority = false,
}: {
  photo: SitePhoto | null;
  eyebrow?: string;
  headline: string;
  body?: string;
  cta?: { label: string; href: string };
  align?: "left" | "center";
  /** `tall` is a section of its own; `short` is a break between two of them. */
  height?: "tall" | "short";
  /** Only ever true above the fold, and nothing here is above the fold today. */
  priority?: boolean;
}) {
  const credit = photo ? creditLine(photo) : null;
  const centered = align === "center";

  return (
    <section className="relative w-full overflow-hidden">
      {photo ? (
        <>
          {/* Under the picture while it loads, and if it ever goes missing. */}
          <div className="absolute inset-0" style={{ backgroundColor: photo.baseColor }} />
          <Image
            src={photo.url}
            alt=""
            fill
            sizes="100vw"
            priority={priority}
            loading={priority ? undefined : "lazy"}
            className="object-cover"
          />

          {/* The scrim: heaviest under the words, lifting toward the far
              edge so some of the photograph survives. */}
          <div
            className={
              centered
                ? "absolute inset-0 bg-black/70"
                : "absolute inset-0 bg-gradient-to-r from-black/90 via-black/72 to-black/35"
            }
          />
          {/* And the joins. Without these the band is a rectangle. */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#0A0A0A] to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
          {/* The same grain the cards use, which is most of the difference
              between a photograph and a stock photograph.

              Plain opacity, never a blend mode. A `mix-blend-mode` anywhere
              on the page moves the backdrop root, and the fixed header's
              `backdrop-filter` then samples nothing: the glass goes flat and
              the page scrolls under it sharp. It cost the whole site its
              header blur the first time this shipped. */}
          <div
            className="absolute inset-0 opacity-[0.12] pointer-events-none"
            style={{ backgroundImage: "url(/brand/grain.png)", backgroundSize: "160px 160px" }}
          />
        </>
      ) : null}

      <div
        className={`relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 ${
          height === "tall" ? "py-24 sm:py-32" : "py-16 sm:py-20"
        }`}
      >
        <div className={`max-w-2xl ${centered ? "mx-auto text-center" : ""}`}>
          {eyebrow ? (
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-400 mb-3 inline-block font-sans">
              {eyebrow}
            </span>
          ) : null}

          <h2 className="text-2xl sm:text-4xl font-medium tracking-tight text-white leading-[1.15] text-balance break-words">
            {headline}
          </h2>

          {body ? (
            <p className="mt-4 text-sm sm:text-base text-zinc-300 leading-relaxed text-pretty">{body}</p>
          ) : null}

          {cta ? (
            <Link
              href={cta.href}
              className={`mt-7 inline-flex items-center gap-1.5 text-sm font-medium text-white hover:text-zinc-300 transition-colors ${
                centered ? "justify-center" : ""
              }`}
            >
              {cta.label}
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          ) : null}
        </div>
      </div>

      {/* A corner is the only place a credit can go on a band, and it is
          the whole of what the library records. */}
      {credit ? (
        <span className="absolute bottom-3 right-4 z-10 text-[9px] tracking-wide text-white/35 font-sans">
          {credit}
        </span>
      ) : null}
    </section>
  );
}
