"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, CalendarDays, Globe, IdCard } from "lucide-react";
import AbramMark from "@/components/AbramMark";
import { ease } from "@/lib/motion";

/**
 * The contact card surface.
 *
 * This is the only place the card is drawn. The public page at /c/<slug>
 * renders it with the real capture form, and the console renders it with a
 * dead one to preview a design. Two components that merely resembled each
 * other drifted apart within a day, so there is deliberately only one.
 *
 * It takes plain values and a slot. It fetches nothing, writes nothing and
 * knows nothing about the network, which is what makes it safe for the
 * console to render.
 *
 * The whole page is one column on a phone held in one hand, so the order is
 * the order of the conversation: who this is, take my details, leave me
 * yours. Each block settles in once on arrival and nothing moves after
 * that, because anything still animating while somebody is typing their
 * name is noise.
 */

export interface CardLink {
  href: string;
  label: string;
  kind: "website" | "linkedin" | "calendar" | "cta";
}

export interface ContactCardSurfaceProps {
  slug: string;
  fullName: string;
  role: string | null;
  tagline: string | null;
  avatarUrl: string | null;
  links: CardLink[];
  /** The capture form on the real card, a dead copy of it in a preview. */
  formSlot: React.ReactNode;
  /**
   * A preview sits inside a phone mockup that is already scrolled and
   * sized, so it drops the full height and the safe area padding the real
   * page needs.
   *
   * It also holds the card at its phone proportions. A media query answers
   * to the viewport rather than to the frame it is drawn in, so a preview
   * on a desktop console would otherwise take the tablet sizes while the
   * phone it is meant to be showing takes the small ones. The console frame
   * is a phone, so in preview the small sizes are the only sizes.
   */
  preview?: boolean;
}

/** Lucide dropped its brand glyphs, so this one is drawn inline. */
function LinkedInGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-3.5 w-3.5">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

function linkIcon(kind: CardLink["kind"]) {
  if (kind === "linkedin") return <LinkedInGlyph />;
  if (kind === "calendar") return <CalendarDays className="h-3.5 w-3.5" />;
  return <Globe className="h-3.5 w-3.5" />;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0][0] || "?").toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function ContactCardSurface({
  slug,
  fullName,
  role,
  tagline,
  avatarUrl,
  links,
  formSlot,
  preview = false,
}: ContactCardSurfaceProps) {
  const reduce = useReducedMotion();

  /* The arrival animation is the `card-rise` keyframe in globals.css rather
     than a JavaScript one. A library that holds content at opacity 0 until
     it hydrates will show a stranger an empty screen if the bundle is slow
     or broken, and on this page that costs a contact. Motion below is kept
     for things that only exist once JavaScript is running anyway. */

  return (
    <div
      className={`relative w-full overflow-x-hidden bg-[#0A0A0A] font-sans ${
        preview ? "h-full" : "min-h-[100dvh]"
      }`}
    >
      {/* Ambient light. Purely decorative, and kept far enough behind the
          content that it never competes with the form. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={`absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-white/[0.045] blur-[120px] ${
            preview ? "" : "md:h-[560px] md:w-[560px]"
          }`}
        />
        <div
          className={`absolute -bottom-32 -right-24 h-[320px] w-[320px] rounded-full bg-[#8ECAFF]/[0.05] blur-[110px] ${
            preview ? "" : "md:h-[440px] md:w-[440px]"
          }`}
        />
      </div>

      <div
        className={`relative mx-auto flex w-full max-w-md flex-col px-5 pt-12 ${
          preview ? "pb-10" : "pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:pt-16"
        }`}
      >
        {/* ---------------------------------------------------------------- */}
        {/* Who this is                                                      */}
        {/* ---------------------------------------------------------------- */}
        <div className="card-rise flex flex-col items-center text-center">
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute -inset-[3px] rounded-full bg-gradient-to-b from-white/25 to-white/0"
            />
            {avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={avatarUrl}
                alt=""
                width={80}
                height={80}
                className="relative h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div
                aria-hidden="true"
                className="relative flex h-20 w-20 items-center justify-center rounded-full bg-zinc-900 text-xl font-semibold tracking-tight text-zinc-300"
              >
                {initials(fullName)}
              </div>
            )}
          </div>

          <h1
            className={`mt-5 text-3xl font-semibold tracking-tight break-words text-white ${
              preview ? "" : "sm:text-4xl"
            }`}
          >
            {fullName}
          </h1>
          {role ? (
            <p className="mt-2 text-sm font-medium break-words text-zinc-400">{role}</p>
          ) : null}
          {tagline ? (
            <p className="mt-3 max-w-[36ch] text-sm leading-relaxed break-words text-zinc-500">
              {tagline}
            </p>
          ) : null}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Take mine                                                        */}
        {/* ---------------------------------------------------------------- */}
        <div className="card-rise mt-8 [animation-delay:70ms]">
          <motion.a
            href={`/c/${slug}/vcf`}
            data-testid="save-contact"
            whileTap={reduce ? undefined : { scale: 0.985 }}
            transition={{ duration: 0.15, ease: ease.snap }}
            className="flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-full bg-white px-6 text-[15px] font-semibold text-[#0A0A0A] transition-colors duration-200 hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
          >
            <IdCard className="h-[18px] w-[18px]" />
            Save my contact
          </motion.a>
          <p className="mt-2.5 text-center text-xs leading-relaxed text-zinc-600">
            Adds {fullName.split(/\s+/)[0]} straight to your address book.
          </p>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Leave yours                                                      */}
        {/* ---------------------------------------------------------------- */}
        <div className="card-rise mt-9 [animation-delay:140ms]">
          <div
            className={`rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 backdrop-blur-sm ${
              preview ? "" : "sm:p-6"
            }`}
          >
            <span className="font-sans text-[10px] font-semibold tracking-[0.2em] text-zinc-500 uppercase">
              Your turn
            </span>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">Send me yours</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
              Your name and email is all I need. Company helps.
            </p>

            {formSlot}
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Elsewhere                                                        */}
        {/* ---------------------------------------------------------------- */}
        {links.length > 0 ? (
          <div className="card-rise mt-6 flex flex-wrap justify-center gap-2 [animation-delay:210ms]">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.02] px-4 text-xs font-medium text-zinc-400 transition-colors duration-200 hover:border-white/15 hover:text-zinc-200"
              >
                {linkIcon(link.kind)}
                <span className="break-all">{link.label}</span>
              </a>
            ))}
          </div>
        ) : null}

        {/* ---------------------------------------------------------------- */}
        {/* Who ABRAM is                                                     */}
        {/* ---------------------------------------------------------------- */}
        <div className="card-rise mt-10 flex justify-center [animation-delay:270ms]">
          <a
            href="https://abram.network"
            className="group inline-flex items-center gap-2 text-xs leading-relaxed text-zinc-600 transition-colors duration-200 hover:text-zinc-400"
          >
            <AbramMark size={12} className="shrink-0" />
            <span>An operations platform for creative teams</span>
            <ArrowUpRight className="h-3 w-3 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
