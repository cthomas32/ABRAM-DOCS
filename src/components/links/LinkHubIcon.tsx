"use client";

import {
  BookOpen,
  Boxes,
  Building2,
  CalendarDays,
  Clapperboard,
  Download,
  Link as LinkIcon,
  Mail,
  MessageSquare,
  PlayCircle,
  Rocket,
  Scissors,
  Star,
  Tag,
} from "lucide-react";
import AbramMark from "@/components/AbramMark";

/**
 * Resolves a stored icon key to a glyph.
 *
 * The `abram` key renders the brand mark: per the design system the mark
 * IS the ABRAM icon, and no generic sparkle ever stands in for it.
 *
 * Lucide removed its brand icons, so the social glyphs are drawn inline
 * rather than pulled from the icon set.
 */

const LUCIDE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  link: LinkIcon,
  rocket: Rocket,
  clapperboard: Clapperboard,
  building: Building2,
  scissors: Scissors,
  boxes: Boxes,
  tag: Tag,
  book: BookOpen,
  mail: Mail,
  calendar: CalendarDays,
  play: PlayCircle,
  star: Star,
  download: Download,
  message: MessageSquare,
};

function Glyph({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      {children}
    </svg>
  );
}

const BRAND_ICONS: Record<string, (className: string) => React.ReactElement> = {
  x: (className) => (
    <Glyph className={className}>
      <path d="M18.9 2.5h3.4l-7.5 8.6 8.8 11.6h-6.9l-5.4-7-6.2 7H1.7l8-9.1L1.3 2.5h7.1l4.9 6.4 5.6-6.4Zm-1.2 18.1h1.9L7.4 4.4H5.4l12.3 16.2Z" />
    </Glyph>
  ),
  instagram: (className) => (
    <Glyph className={className}>
      <path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.2.05 1.8.25 2.2.42.6.22 1 .48 1.4.9.43.42.7.83.92 1.4.17.42.37 1.03.42 2.2.06 1.3.07 1.7.07 4.9s0 3.6-.07 4.9c-.05 1.2-.25 1.8-.42 2.2a3.8 3.8 0 0 1-.92 1.4c-.42.43-.83.7-1.4.92-.42.17-1.03.37-2.2.42-1.3.06-1.7.07-4.9.07s-3.6 0-4.9-.07c-1.2-.05-1.8-.25-2.2-.42a3.8 3.8 0 0 1-1.4-.92 3.8 3.8 0 0 1-.92-1.4c-.17-.42-.37-1.03-.42-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.9c.05-1.2.25-1.8.42-2.2.22-.6.48-1 .92-1.4a3.8 3.8 0 0 1 1.4-.92c.42-.17 1.03-.37 2.2-.42C8.4 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.14 0-3.5 0-4.74.07-.9.04-1.38.19-1.7.31-.43.17-.73.37-1.05.69-.32.32-.52.62-.69 1.05-.12.32-.27.8-.31 1.7C3.44 8.5 3.43 8.86 3.43 12s0 3.5.08 4.74c.4.9.19 1.38.31 1.7.17.43.37.73.69 1.05.32.32.62.52 1.05.69.32.12.8.27 1.7.31 1.24.07 1.6.08 4.74.08s3.5 0 4.74-.08c.9-.04 1.38-.19 1.7-.31.43-.17.73-.37 1.05-.69.32-.32.52-.62.69-1.05.12-.32.27-.8.31-1.7.07-1.24.08-1.6.08-4.74s0-3.5-.08-4.74c-.04-.9-.19-1.38-.31-1.7a2.9 2.9 0 0 0-.69-1.05 2.9 2.9 0 0 0-1.05-.69c-.32-.12-.8-.27-1.7-.31C15.5 4 15.14 4 12 4Zm0 3.06a4.94 4.94 0 1 1 0 9.88 4.94 4.94 0 0 1 0-9.88Zm0 1.8a3.14 3.14 0 1 0 0 6.28 3.14 3.14 0 0 0 0-6.28Zm5.1-.3a1.16 1.16 0 1 1 0-2.32 1.16 1.16 0 0 1 0 2.32Z" />
    </Glyph>
  ),
  youtube: (className) => (
    <Glyph className={className}>
      <path d="M22.5 7.2a2.8 2.8 0 0 0-2-2C18.7 4.7 12 4.7 12 4.7s-6.7 0-8.5.5a2.8 2.8 0 0 0-2 2C1 9 1 12 1 12s0 3 .5 4.8a2.8 2.8 0 0 0 2 2c1.8.5 8.5.5 8.5.5s6.7 0 8.5-.5a2.8 2.8 0 0 0 2-2C23 15 23 12 23 12s0-3-.5-4.8ZM9.8 15.4V8.6l5.9 3.4-5.9 3.4Z" />
    </Glyph>
  ),
  linkedin: (className) => (
    <Glyph className={className}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z" />
    </Glyph>
  ),
  tiktok: (className) => (
    <Glyph className={className}>
      <path d="M16.6 5.82a4.28 4.28 0 0 1-1.03-2.82h-3.1v12.4a2.59 2.59 0 0 1-2.6 2.5 2.6 2.6 0 0 1 0-5.2c.27 0 .53.04.77.12V9.66a5.9 5.9 0 0 0-.77-.05A5.7 5.7 0 1 0 15.57 15.3V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.3 4.3 0 0 1-3.27-1.48Z" />
    </Glyph>
  ),
};

export default function LinkHubIcon({
  icon,
  className = "w-4 h-4",
}: {
  icon: string;
  className?: string;
}) {
  if (icon === "abram") {
    return <AbramMark size={16} className="rounded-[3px] shrink-0" />;
  }

  const brand = BRAND_ICONS[icon];
  if (brand) return brand(className);

  const Icon = LUCIDE_ICONS[icon] || LinkIcon;
  return <Icon className={className} />;
}
