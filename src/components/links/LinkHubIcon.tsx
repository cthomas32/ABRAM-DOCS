"use client";

import {
  BookOpen,
  Boxes,
  Building2,
  CalendarDays,
  Clapperboard,
  CreditCard,
  Download,
  FileText,
  Globe,
  Heart,
  Link as LinkIcon,
  Mail,
  MapPin,
  MessageSquare,
  Mic,
  Phone,
  PlayCircle,
  Rocket,
  Scissors,
  ShoppingBag,
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

/**
 * Line weight for the outline icons. The lucide default of 2 reads as
 * playful at small sizes; 1.5 keeps them quiet next to the label.
 */
const STROKE = 1.5;

const LUCIDE_ICONS: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties; strokeWidth?: number }>
> = {
  link: LinkIcon,
  rocket: Rocket,
  clapperboard: Clapperboard,
  building: Building2,
  scissors: Scissors,
  boxes: Boxes,
  tag: Tag,
  book: BookOpen,
  mail: Mail,
  phone: Phone,
  calendar: CalendarDays,
  map: MapPin,
  play: PlayCircle,
  star: Star,
  heart: Heart,
  download: Download,
  message: MessageSquare,
  shopping: ShoppingBag,
  credit: CreditCard,
  file: FileText,
  globe: Globe,
  podcast: Mic,
};

function Glyph({
  className,
  style,
  children,
}: {
  className: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
      style={style}
    >
      {children}
    </svg>
  );
}

type BrandIcon = (className: string, style?: React.CSSProperties) => React.ReactElement;

const BRAND_ICONS: Record<string, BrandIcon> = {
  x: (className, style) => (
    <Glyph className={className} style={style}>
      <path d="M18.9 2.5h3.4l-7.5 8.6 8.8 11.6h-6.9l-5.4-7-6.2 7H1.7l8-9.1L1.3 2.5h7.1l4.9 6.4 5.6-6.4Zm-1.2 18.1h1.9L7.4 4.4H5.4l12.3 16.2Z" />
    </Glyph>
  ),
  instagram: (className, style) => (
    <Glyph className={className} style={style}>
      <path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.2.05 1.8.25 2.2.42.6.22 1 .48 1.4.9.43.42.7.83.92 1.4.17.42.37 1.03.42 2.2.06 1.3.07 1.7.07 4.9s0 3.6-.07 4.9c-.05 1.2-.25 1.8-.42 2.2a3.8 3.8 0 0 1-.92 1.4c-.42.43-.83.7-1.4.92-.42.17-1.03.37-2.2.42-1.3.06-1.7.07-4.9.07s-3.6 0-4.9-.07c-1.2-.05-1.8-.25-2.2-.42a3.8 3.8 0 0 1-1.4-.92 3.8 3.8 0 0 1-.92-1.4c-.17-.42-.37-1.03-.42-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.9c.05-1.2.25-1.8.42-2.2.22-.6.48-1 .92-1.4a3.8 3.8 0 0 1 1.4-.92c.42-.17 1.03-.37 2.2-.42C8.4 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.14 0-3.5 0-4.74.07-.9.04-1.38.19-1.7.31-.43.17-.73.37-1.05.69-.32.32-.52.62-.69 1.05-.12.32-.27.8-.31 1.7C3.44 8.5 3.43 8.86 3.43 12s0 3.5.08 4.74c.4.9.19 1.38.31 1.7.17.43.37.73.69 1.05.32.32.62.52 1.05.69.32.12.8.27 1.7.31 1.24.07 1.6.08 4.74.08s3.5 0 4.74-.08c.9-.04 1.38-.19 1.7-.31.43-.17.73-.37 1.05-.69.32-.32.52-.62.69-1.05.12-.32.27-.8.31-1.7.07-1.24.08-1.6.08-4.74s0-3.5-.08-4.74c-.04-.9-.19-1.38-.31-1.7a2.9 2.9 0 0 0-.69-1.05 2.9 2.9 0 0 0-1.05-.69c-.32-.12-.8-.27-1.7-.31C15.5 4 15.14 4 12 4Zm0 3.06a4.94 4.94 0 1 1 0 9.88 4.94 4.94 0 0 1 0-9.88Zm0 1.8a3.14 3.14 0 1 0 0 6.28 3.14 3.14 0 0 0 0-6.28Zm5.1-.3a1.16 1.16 0 1 1 0-2.32 1.16 1.16 0 0 1 0 2.32Z" />
    </Glyph>
  ),
  youtube: (className, style) => (
    <Glyph className={className} style={style}>
      <path d="M22.5 7.2a2.8 2.8 0 0 0-2-2C18.7 4.7 12 4.7 12 4.7s-6.7 0-8.5.5a2.8 2.8 0 0 0-2 2C1 9 1 12 1 12s0 3 .5 4.8a2.8 2.8 0 0 0 2 2c1.8.5 8.5.5 8.5.5s6.7 0 8.5-.5a2.8 2.8 0 0 0 2-2C23 15 23 12 23 12s0-3-.5-4.8ZM9.8 15.4V8.6l5.9 3.4-5.9 3.4Z" />
    </Glyph>
  ),
  linkedin: (className, style) => (
    <Glyph className={className} style={style}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z" />
    </Glyph>
  ),
  tiktok: (className, style) => (
    <Glyph className={className} style={style}>
      <path d="M16.6 5.82a4.28 4.28 0 0 1-1.03-2.82h-3.1v12.4a2.59 2.59 0 0 1-2.6 2.5 2.6 2.6 0 0 1 0-5.2c.27 0 .53.04.77.12V9.66a5.9 5.9 0 0 0-.77-.05A5.7 5.7 0 1 0 15.57 15.3V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.3 4.3 0 0 1-3.27-1.48Z" />
    </Glyph>
  ),
  facebook: (className, style) => (
    <Glyph className={className} style={style}>
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z" />
    </Glyph>
  ),
  threads: (className, style) => (
    <Glyph className={className} style={style}>
      <path d="M16.3 11.15c-.1-.05-.2-.1-.3-.14-.18-3.3-1.98-5.18-5-5.2h-.04c-1.8 0-3.3.77-4.23 2.18l1.66 1.14c.68-1.04 1.76-1.26 2.57-1.26h.03c1.01 0 1.77.3 2.26.87.36.42.6 1 .72 1.73a13 13 0 0 0-2.9-.14c-2.92.17-4.8 1.87-4.67 4.24.06 1.2.66 2.23 1.69 2.9.87.57 1.99.85 3.15.79 1.54-.09 2.74-.68 3.58-1.75.64-.81 1.04-1.86 1.22-3.19.74.45 1.29 1.04 1.59 1.75.51 1.2.54 3.18-1.07 4.79-1.41 1.4-3.1 2.02-5.66 2.04-2.84-.02-4.99-.93-6.39-2.7C3.2 17.5 2.53 15.16 2.5 12c.03-3.16.7-5.5 2.01-7.14C5.91 3.1 8.06 2.19 10.9 2.17c2.86.02 5.05.93 6.5 2.7.72.87 1.26 1.96 1.61 3.24l1.95-.52c-.43-1.57-1.11-2.93-2.04-4.05C17.06 1.27 14.32.05 10.9.03h-.01C7.5.05 4.79 1.28 3.04 3.6 1.48 5.66.67 8.53.64 11.99v.02c.03 3.46.84 6.33 2.4 8.39 1.75 2.32 4.46 3.55 7.85 3.57h.01c3.02-.02 5.15-.81 6.9-2.56 2.29-2.29 2.22-5.16 1.47-6.92-.55-1.27-1.6-2.3-3.03-3.02Zm-5.22 5.1c-1.29.07-2.63-.51-2.69-1.72-.05-.9.64-1.9 2.77-2.02.24-.02.48-.02.71-.02.77 0 1.5.08 2.15.22-.24 3.03-1.66 3.47-2.94 3.54Z" />
    </Glyph>
  ),
  github: (className, style) => (
    <Glyph className={className} style={style}>
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.2 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.96 0-1.31.47-2.39 1.24-3.23-.12-.31-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.4 11.4 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.87.12 3.18.77.84 1.24 1.92 1.24 3.23 0 4.63-2.81 5.65-5.49 5.95.43.37.82 1.1.82 2.22v3.29c0 .32.21.7.83.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5Z" />
    </Glyph>
  ),
  discord: (className, style) => (
    <Glyph className={className} style={style}>
      <path d="M20.32 4.94A19.8 19.8 0 0 0 15.43 3.4a.07.07 0 0 0-.08.04c-.21.38-.44.87-.61 1.26a18.3 18.3 0 0 0-5.48 0 12.6 12.6 0 0 0-.62-1.26.08.08 0 0 0-.08-.04A19.74 19.74 0 0 0 3.68 4.94a.07.07 0 0 0-.03.03C.53 9.6-.32 14.12.1 18.58c0 .02.02.04.04.06a19.9 19.9 0 0 0 5.99 3.03.08.08 0 0 0 .09-.03c.46-.63.87-1.3 1.22-2a.08.08 0 0 0-.04-.11 13.1 13.1 0 0 1-1.87-.9.08.08 0 0 1 0-.13l.37-.29a.07.07 0 0 1 .08 0 14.2 14.2 0 0 0 12.06 0 .07.07 0 0 1 .08 0l.37.3a.08.08 0 0 1 0 .12c-.6.35-1.22.65-1.87.9a.08.08 0 0 0-.04.11c.36.7.77 1.36 1.22 2a.08.08 0 0 0 .09.03 19.84 19.84 0 0 0 6-3.03.08.08 0 0 0 .03-.06c.5-5.15-.84-9.64-3.55-13.61a.06.06 0 0 0-.03-.03ZM8.02 15.86c-1.18 0-2.16-1.09-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.33-.96 2.42-2.16 2.42Zm7.98 0c-1.18 0-2.16-1.09-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.33-.95 2.42-2.16 2.42Z" />
    </Glyph>
  ),
  spotify: (className, style) => (
    <Glyph className={className} style={style}>
      <path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm5.5 17.32a.75.75 0 0 1-1.03.25c-2.82-1.72-6.37-2.11-10.55-1.16a.75.75 0 1 1-.33-1.46c4.57-1.04 8.5-.59 11.66 1.34.35.22.46.68.25 1.03Zm1.47-3.27a.94.94 0 0 1-1.29.31c-3.23-1.98-8.15-2.56-11.97-1.4a.94.94 0 1 1-.54-1.79c4.37-1.33 9.79-.68 13.5 1.59.44.27.58.85.3 1.29Zm.13-3.4C15.23 8.35 8.9 8.14 5.2 9.26a1.12 1.12 0 1 1-.65-2.15c4.25-1.29 11.24-1.04 15.67 1.59a1.12 1.12 0 1 1-1.14 1.94Z" />
    </Glyph>
  ),
};

export default function LinkHubIcon({
  icon,
  className = "w-4 h-4",
  style,
}: {
  icon: string;
  className?: string;
  /** Lets a caller size the glyph in pixels, e.g. to match button size. */
  style?: React.CSSProperties;
}) {
  if (icon === "abram") {
    const size = typeof style?.width === "number" ? style.width : 16;
    return <AbramMark size={size} className="rounded-[3px] shrink-0" />;
  }

  const brand = BRAND_ICONS[icon];
  if (brand) return brand(className, style);

  const Icon = LUCIDE_ICONS[icon] || LinkIcon;
  return <Icon className={className} style={style} strokeWidth={STROKE} />;
}
