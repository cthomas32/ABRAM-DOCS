/**
 * The QR design studio: what a designed code is made of.
 *
 * A designed code follows the same idea as a social card. The saved thing
 * is a spec, not a picture: a template, a size, a palette, an ink and a few
 * lines of copy. Drawing is a pure function of that, so a design can be
 * previewed before any file exists, and changing a template later re-draws
 * every code that has not been exported yet.
 *
 * Everything in here bends around one constraint. A beautiful code that
 * fails to scan across a conference hall is worth nothing, so the palette
 * is not free: the plate is always light, the modules are always dark, and
 * the pairing has to clear a contrast floor before the studio will offer
 * it. That check happens in {@link inksForPlate}, which is a filter rather
 * than a warning, so the failing combination never reaches a control.
 */

import type { BackdropId, BackdropFocus } from "@/lib/social/backdrops";
import type { SocialThemeId } from "@/lib/social/themes";

/* ------------------------------------------------------------------ */
/*  Sizes                                                              */
/* ------------------------------------------------------------------ */

export type QrFormatId =
  | "wallpaper_large"
  | "wallpaper_standard"
  | "wallpaper_short"
  | "business_card"
  | "badge_sticker"
  | "share_square"
  | "share_link";

/**
 * The same shape the social formats use, so a size here reads the same way
 * a size there does: pixels, a type scale set by eye rather than derived,
 * padding already in output pixels, and a safe area for whatever the
 * surface puts on top of the picture.
 */
export interface QrFormat {
  id: QrFormatId;
  label: string;
  /** Where this size is actually used, shown next to the picker */
  usedFor: string;
  width: number;
  height: number;
  /** Multiplier on every type size in a layout */
  scale: number;
  paddingX: number;
  paddingY: number;
  /** Kept clear because something else sits there */
  safeTop?: number;
  safeBottom?: number;
  safeNote?: string;
  /** Groups the picker, and decides which templates make sense */
  kind: "wallpaper" | "print" | "share";
  /** Printed sizes say what they are in inches, since that is the unit that matters */
  printNote?: string;
}

/**
 * Wallpaper safe areas are the whole point of the wallpaper.
 *
 * A phone lock screen is not an empty rectangle. The clock and the date sit
 * across the top, widgets sit under them, and the bottom carries the torch
 * and camera buttons and the home indicator. A code drawn in the middle of
 * the full frame comes out half covered. So the wallpapers keep the top
 * third and the bottom sixth clear and draw into the band between, which is
 * where nothing is ever placed.
 */
const WALLPAPER_NOTE =
  "The clock and widgets cover the top, and the torch and camera buttons cover the bottom. The code sits in the clear band between them.";

export const QR_FORMATS: Record<QrFormatId, QrFormat> = {
  wallpaper_large: {
    id: "wallpaper_large",
    label: "Lock screen, large phone",
    usedFor: "The larger phone size. Set it as your wallpaper and hold the screen up.",
    width: 1290,
    height: 2796,
    scale: 1.25,
    paddingX: 92,
    paddingY: 90,
    safeTop: 770,
    safeBottom: 380,
    safeNote: WALLPAPER_NOTE,
    kind: "wallpaper",
  },
  wallpaper_standard: {
    id: "wallpaper_standard",
    label: "Lock screen, standard phone",
    usedFor: "The standard phone size of the last few generations.",
    width: 1179,
    height: 2556,
    scale: 1.15,
    paddingX: 84,
    paddingY: 84,
    safeTop: 704,
    safeBottom: 348,
    safeNote: WALLPAPER_NOTE,
    kind: "wallpaper",
  },
  wallpaper_short: {
    id: "wallpaper_short",
    label: "Lock screen, earlier standard phone",
    usedFor: "The slightly shorter standard screen on earlier handsets.",
    width: 1170,
    height: 2532,
    scale: 1.15,
    paddingX: 84,
    paddingY: 84,
    safeTop: 697,
    safeBottom: 344,
    safeNote: WALLPAPER_NOTE,
    kind: "wallpaper",
  },
  business_card: {
    id: "business_card",
    label: "Business card back",
    usedFor: "The reverse of a card you hand over.",
    width: 1050,
    height: 600,
    scale: 0.82,
    paddingX: 64,
    paddingY: 56,
    kind: "print",
    printNote: "3.5 by 2 inches at 300 dots per inch.",
  },
  badge_sticker: {
    id: "badge_sticker",
    label: "Badge sticker",
    usedFor: "Square, for the back of a lanyard badge or a loose sticker.",
    width: 1200,
    height: 1200,
    scale: 0.98,
    paddingX: 96,
    paddingY: 96,
    kind: "print",
    printNote: "4 by 4 inches at 300 dots per inch.",
  },
  share_square: {
    id: "share_square",
    label: "Share image, square",
    usedFor: "The same square the social cards use, for a feed or a message.",
    width: 1080,
    height: 1080,
    scale: 1.02,
    paddingX: 88,
    paddingY: 88,
    kind: "share",
  },
  share_link: {
    id: "share_link",
    label: "Share image, link preview",
    usedFor: "The same size a link preview uses, for a slide or an email.",
    width: 1200,
    height: 630,
    scale: 0.86,
    paddingX: 80,
    paddingY: 72,
    kind: "share",
  },
};

export const QR_FORMAT_IDS = Object.keys(QR_FORMATS) as QrFormatId[];

export const DEFAULT_QR_FORMAT: QrFormatId = "wallpaper_large";

export function getQrFormat(id: string | null | undefined): QrFormat {
  return QR_FORMATS[(id as QrFormatId) ?? DEFAULT_QR_FORMAT] ?? QR_FORMATS[DEFAULT_QR_FORMAT];
}

/** Where a layout is allowed to draw. Padding plus whatever covers the frame. */
export function qrContentInsets(format: QrFormat) {
  return {
    top: format.paddingY + (format.safeTop ?? 0),
    bottom: format.paddingY + (format.safeBottom ?? 0),
    left: format.paddingX,
    right: format.paddingX,
  };
}

/* ------------------------------------------------------------------ */
/*  Ink and plate                                                      */
/* ------------------------------------------------------------------ */

/**
 * The floor.
 *
 * A reader technically needs about three to one between the dark modules
 * and the light background. Ten to one is the number here because none of
 * the conditions are ever technical: a phone screen held at an angle under
 * hall lighting loses contrast to glare, a printed sticker loses it to ink
 * spread, and a photograph of a badge loses it to the camera. The headroom
 * is the point.
 */
export const QR_CONTRAST_FLOOR = 10;

export type QrPlateId = "white" | "paper" | "bone" | "mist";
export type QrInkId = "black" | "graphite" | "midnight" | "oxide" | "steel" | "accent";

export interface QrSwatch<Id extends string> {
  id: Id;
  label: string;
  hex: string;
}

/** The code always sits on one of these. All light, all opaque. */
export const QR_PLATES: QrSwatch<QrPlateId>[] = [
  { id: "white", label: "White", hex: "#FFFFFF" },
  { id: "paper", label: "Paper", hex: "#FAFAF9" },
  { id: "bone", label: "Bone", hex: "#F4F4F5" },
  { id: "mist", label: "Mist", hex: "#E4E9F0" },
];

/**
 * Candidate inks. Not all of them survive every plate, and two of them
 * survive none: the blue is in the list precisely so the studio has to
 * throw it out rather than quietly draw a code nobody can read.
 */
export const QR_INKS: QrSwatch<QrInkId>[] = [
  { id: "black", label: "Black", hex: "#0A0A0A" },
  { id: "graphite", label: "Graphite", hex: "#18181B" },
  { id: "midnight", label: "Midnight", hex: "#050B14" },
  { id: "oxide", label: "Oxide", hex: "#3B0A0A" },
  { id: "steel", label: "Steel", hex: "#3F3F46" },
  { id: "accent", label: "Accent blue", hex: "#1D4ED8" },
];

export const DEFAULT_QR_PLATE: QrPlateId = "white";
export const DEFAULT_QR_INK: QrInkId = "black";

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** Relative luminance of three 0 to 255 channels. */
export function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Relative luminance of a `#rrggbb` colour. */
export function luminance(hex: string): number {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return 0;
  return relativeLuminance(r, g, b);
}

/** Contrast ratio between two `#rrggbb` colours, 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const light = Math.max(la, lb);
  const dark = Math.min(la, lb);
  return (light + 0.05) / (dark + 0.05);
}

export function plateSwatch(id: string | null | undefined): QrSwatch<QrPlateId> {
  return QR_PLATES.find((p) => p.id === id) ?? QR_PLATES[0];
}

export function inkSwatch(id: string | null | undefined): QrSwatch<QrInkId> {
  return QR_INKS.find((i) => i.id === id) ?? QR_INKS[0];
}

/* ------------------------------------------------------------------ */
/*  How solid the plate is                                             */
/* ------------------------------------------------------------------ */

/**
 * What the code sits on.
 *
 * The studio began with one answer to this and it was a good one: an opaque
 * light rectangle, every time, no argument. That is still the answer for
 * anything printed and still the default for everything else, because it is
 * the only one that needs no measurement to be safe.
 *
 * The other two are the same idea loosened by exactly as much as a
 * measurement can cover:
 *
 *  - **Frosted** keeps a plate but makes it translucent and blurs what is
 *    behind it, which is what frosted glass does and why you can read
 *    through a shower door but cannot see through it. The blur is doing the
 *    real work: it flattens the photograph into a near uniform field, and a
 *    near uniform field is one a contrast reading can stand behind.
 *  - **Clear** removes the plate and puts the modules straight onto the
 *    photograph. Nothing structural is protecting the code here, so
 *    everything rests on the measurement, and the measurement is taken cell
 *    by cell rather than as an average.
 */
export type QrPlateMode = "solid" | "frosted" | "clear";

export const QR_PLATE_MODES: { id: QrPlateMode; label: string; blurb: string }[] = [
  {
    id: "solid",
    label: "Solid",
    blurb: "An opaque light rectangle. Safe by construction and the only choice for print.",
  },
  {
    id: "frosted",
    label: "Frosted",
    blurb:
      "Translucent, with the picture blurred behind it. The blur is what keeps the field under the modules even.",
  },
  {
    id: "clear",
    label: "Clear",
    blurb:
      "No plate at all. Offered only where the picture under the code is measured light enough everywhere.",
  },
];

/** How translucent a frosted plate may be drawn. */
export const PLATE_OPACITIES: { value: number; label: string }[] = [
  { value: 0.92, label: "Dense" },
  { value: 0.82, label: "Frosted" },
  { value: 0.7, label: "Light" },
  { value: 0.58, label: "Thin" },
  { value: 0.45, label: "Barely there" },
];

/**
 * How hard a frosted plate blurs what is behind it, as a fraction of the
 * frame's shorter edge. Same unit and same reason as the focus depth on the
 * photograph, so one saved design reads the same on a lock screen and on a
 * card back.
 */
export const PLATE_BLURS: { value: number; label: string }[] = [
  { value: 0.008, label: "Barely" },
  { value: 0.018, label: "Frosted glass" },
  { value: 0.032, label: "Deep" },
  { value: 0.05, label: "Opaque looking" },
];

export const MIN_PLATE_BLUR = 0.008;
export const MAX_PLATE_BLUR = 0.05;

export const DEFAULT_PLATE_OPACITY = 0.82;
export const DEFAULT_PLATE_BLUR = 0.018;

/**
 * The most veil a clear code is allowed to be rescued with.
 *
 * A clear code over a picture that is too bright in one corner can be saved
 * by laying a thin wash of the plate colour under it, and up to a point
 * that is a fair trade: the design still reads as the photograph showing
 * through. Past a half it stops being a clear code and becomes a plate
 * wearing a different name, and at that point the honest answer is to
 * refuse and say so.
 */
export const CLEAR_MAX_VEIL = 0.5;

/** The blur a frosted plate applies, in output pixels for this frame. */
export function plateBlurPixels(blur: number, width: number, height: number): number {
  if (!(blur > 0)) return 0;
  return Math.round(Math.min(MAX_PLATE_BLUR, blur) * Math.min(width, height));
}

/* ------------------------------------------------------------------ */
/*  A colour somebody typed                                            */
/* ------------------------------------------------------------------ */

/**
 * Read a hand entered colour.
 *
 * Accepts the two forms a colour input and a person both produce, with or
 * without the hash, and gives back one canonical `#RRGGBB`. Anything else
 * comes back null and the caller falls through to the preset, so a half
 * typed value in a text field never reaches the renderer.
 */
export function normalizeHex(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const clean = value.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{3}$/.test(clean) && !/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  return `#${full.toUpperCase()}`;
}

/**
 * The inks this plate can carry. The studio builds its ink control from
 * this, so an ink that would drop the code under the floor is not a choice
 * somebody has to be talked out of. It is simply not there.
 */
export function inksForPlate(plateId: string | null | undefined): QrSwatch<QrInkId>[] {
  const plate = plateSwatch(plateId);
  return QR_INKS.filter((ink) => contrastRatio(ink.hex, plate.hex) >= QR_CONTRAST_FLOOR);
}

/**
 * The ink a spec asks for, preset or hand picked.
 *
 * A custom colour wins over the preset when it is readable, which is the
 * whole point of offering one. It loses silently when it is not, so a value
 * that arrived from a hand edited row cannot put an unreadable code on a
 * badge.
 */
export function specInk(spec: QrDesignSpec): string {
  return normalizeHex(spec.inkCustom) ?? inkSwatch(spec.ink).hex;
}

/**
 * The pair that actually gets drawn.
 *
 * A spec can arrive from the database written by an older build, or by a
 * hand edit, so the last word on contrast is here rather than in the
 * controls. Anything that fails falls back to black on white, which is the
 * pairing the printed codes have always used.
 *
 * Two conditions, and the second one is newer than the first. The pair has
 * to clear the floor, and the modules have to be the darker of the two. A
 * light code on a dark field decodes on most phones and on none of the
 * printed paths this system also feeds, and every reader assumption written
 * anywhere else in the studio takes the positive polarity for granted. It
 * stays taken for granted, and a custom colour that would invert the code
 * is refused rather than quietly drawn.
 *
 * `enforce` is off in exactly one place: the studio's own preview, which
 * draws what was asked so somebody can see what is wrong with it while the
 * save and download buttons are held shut.
 */
export function resolveQrColors(
  spec: QrDesignSpec,
  { enforce = true }: { enforce?: boolean } = {}
): { ink: string; plate: string; ratio: number } {
  const plate = plateSwatch(spec.plate);
  const ink = specInk(spec);
  const ratio = contrastRatio(ink, plate.hex);
  const positive = luminance(ink) < luminance(plate.hex);
  if (!enforce || (ratio >= QR_CONTRAST_FLOOR && positive)) {
    return { ink, plate: plate.hex, ratio };
  }
  return { ink: "#0A0A0A", plate: "#FFFFFF", ratio: contrastRatio("#0A0A0A", "#FFFFFF") };
}

/* ------------------------------------------------------------------ */
/*  Templates                                                          */
/* ------------------------------------------------------------------ */

export type QrTemplateId = "plain" | "branded" | "photo";

export interface QrTemplate {
  id: QrTemplateId;
  label: string;
  blurb: string;
  /** Whether the backdrop controls are worth showing */
  usesBackdrop: boolean;
  /** Whether the palette controls are worth showing */
  usesTheme: boolean;
}

export const QR_TEMPLATES: QrTemplate[] = [
  {
    id: "plain",
    label: "Plain",
    blurb: "White field, black code, one line of type. The one that reads from furthest away.",
    usesBackdrop: false,
    usesTheme: false,
  },
  {
    id: "branded",
    label: "Branded",
    blurb: "The palette's own background with the mark, and the code on a light plate.",
    usesBackdrop: false,
    usesTheme: true,
  },
  {
    id: "photo",
    label: "Photographic",
    blurb: "A backdrop from the shared image library, with the code on a solid plate over it.",
    usesBackdrop: true,
    usesTheme: true,
  },
];

export function getQrTemplate(id: string | null | undefined): QrTemplate {
  return QR_TEMPLATES.find((t) => t.id === id) ?? QR_TEMPLATES[0];
}

/* ------------------------------------------------------------------ */
/*  Softening the photograph                                           */
/* ------------------------------------------------------------------ */

/**
 * How far out of focus the photograph behind the code is thrown.
 *
 * A sharp photograph and a hard edged code compete: both are detail, both
 * are at the same distance, and the eye has to be told which one it is
 * meant to be reading. Throwing the picture out of focus settles that in
 * one move, and it is the reason a portrait lens exists. The plate, the
 * modules and the type stay perfectly sharp, so the only thing that softens
 * is the thing that was never the subject.
 *
 * The number is a fraction of the frame's shorter edge rather than a pixel
 * count, so the same saved design reads the same on a 1290 wide lock screen
 * and on a 1050 wide card back. Blur is a standard deviation, which is what
 * both `blur()` in a canvas filter and `feGaussianBlur` in a vector file
 * take, so the two paths agree without a conversion.
 */
export const BACKDROP_BLURS: { value: number; label: string }[] = [
  { value: 0, label: "Sharp" },
  { value: 0.01, label: "Soft" },
  { value: 0.022, label: "Bokeh" },
  { value: 0.038, label: "Deep bokeh" },
];

/** The largest blur a spec may carry, whoever wrote it. */
export const MAX_BACKDROP_BLUR = 0.038;

/** The blur in output pixels for a frame of these dimensions. */
export function blurPixels(blur: number, width: number, height: number): number {
  if (!(blur > 0)) return 0;
  return Math.round(Math.min(MAX_BACKDROP_BLUR, blur) * Math.min(width, height));
}

/**
 * How far past its box a blurred picture has to be drawn.
 *
 * A Gaussian samples nothing outside the pixels it was given, so an image
 * blurred at its own bounds fades to transparent along every edge and
 * leaves a soft rim of whatever is underneath. Three standard deviations is
 * where the kernel has effectively run out, so drawing the picture that
 * much larger on every side puts the rim off the frame entirely.
 */
export function blurBleed(blurPx: number): number {
  return blurPx > 0 ? Math.ceil(blurPx * 3) : 0;
}

/* ------------------------------------------------------------------ */
/*  The spec                                                           */
/* ------------------------------------------------------------------ */

/**
 * A saved design. This is the whole of what gets stored against a code, and
 * the whole of what the renderer reads.
 */
export interface QrDesignSpec {
  v: 1;
  template: QrTemplateId;
  format: QrFormatId;
  theme: SocialThemeId;
  /** A drawn backdrop from the shared library. Only read by the photo template. */
  backdrop: BackdropId;
  /** An uploaded photograph, by storage path, which wins over the drawn one. */
  backdropImage: string | null;
  backdropCrop: number;
  backdropFocus: BackdropFocus;
  backdropDim: number;
  /**
   * How far the photograph is thrown out of focus, as a fraction of the
   * frame's shorter edge. Zero is sharp, which is what a spec saved before
   * this field existed comes back as.
   */
  backdropBlur: number;
  /**
   * Who took the photograph, drawn small along the bottom. Carried on the
   * spec rather than looked up at draw time so an exported card keeps its
   * credit even if the library row is retitled later.
   */
  backdropCredit: string | null;
  plate: QrPlateId;
  /**
   * How solid the plate is. A spec saved before this field existed comes
   * back solid, which is what it was drawn as and what it carries on being
   * drawn as.
   */
  plateMode: QrPlateMode;
  /** How translucent a frosted plate is. Ignored by the other two modes. */
  plateOpacity: number;
  /**
   * How hard a frosted plate blurs what is behind it, as a fraction of the
   * frame's shorter edge. This is the field that makes frosted safe.
   */
  plateBlur: number;
  ink: QrInkId;
  /**
   * A colour somebody chose rather than picked, as `#RRGGBB`. Wins over the
   * preset when it is readable and is dropped when it is not, so the five
   * presets are a shortcut rather than a ceiling.
   */
  inkCustom: string | null;
  /** The mark in the middle of the code. Small enough to stay inside the budget. */
  mark: boolean;
  /** Small line above the code, telling a stranger what to do */
  prompt: string;
  /** Who this is */
  name: string;
  /** Role and company, on one line */
  subtitle: string;
  /** The address under the caption, for anyone who would rather type it */
  showUrl: boolean;
}

export const DEFAULT_PROMPT = "Scan to save my details";

export function defaultQrDesign(overrides: Partial<QrDesignSpec> = {}): QrDesignSpec {
  return {
    v: 1,
    template: "branded",
    format: DEFAULT_QR_FORMAT,
    theme: "midnight",
    backdrop: "deep",
    backdropImage: null,
    backdropCrop: 1,
    backdropFocus: "center",
    backdropDim: 0.58,
    backdropBlur: 0,
    backdropCredit: null,
    plate: DEFAULT_QR_PLATE,
    plateMode: "solid",
    plateOpacity: DEFAULT_PLATE_OPACITY,
    plateBlur: DEFAULT_PLATE_BLUR,
    ink: DEFAULT_QR_INK,
    inkCustom: null,
    mark: false,
    prompt: DEFAULT_PROMPT,
    name: "",
    subtitle: "",
    showUrl: true,
    ...overrides,
  };
}

const TEMPLATE_IDS = QR_TEMPLATES.map((t) => t.id);
const PLATE_IDS = QR_PLATES.map((p) => p.id);
const PLATE_MODE_IDS = QR_PLATE_MODES.map((m) => m.id);
const INK_IDS = QR_INKS.map((i) => i.id);
const THEME_IDS: SocialThemeId[] = ["midnight", "laser", "ember", "steel", "cream"];
const BACKDROP_IDS: BackdropId[] = ["none", "dusk", "storm", "ember", "haze", "deep"];
const FOCUS_IDS: BackdropFocus[] = [
  "top-left",
  "top",
  "top-right",
  "left",
  "center",
  "right",
  "bottom-left",
  "bottom",
  "bottom-right",
];

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

function text(value: unknown, limit: number): string {
  return typeof value === "string" ? value.slice(0, limit) : "";
}

function num(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;
}

/**
 * Read a spec off a row.
 *
 * Defensive on every field, because the column is JSON and a row can have
 * been written by an older build. A design that cannot be read is a design
 * that comes back as the default rather than an exception in the console.
 */
export function parseQrDesign(value: unknown, overrides: Partial<QrDesignSpec> = {}): QrDesignSpec {
  const base = defaultQrDesign(overrides);
  if (!value || typeof value !== "object") return base;
  const raw = value as Record<string, unknown>;

  const plate = pick(raw.plate, PLATE_IDS, base.plate);
  const inkCandidate = pick(raw.ink, INK_IDS, base.ink);
  // An ink that no longer clears the floor against its plate is dropped
  // here rather than at draw time, so the controls and the picture agree.
  const allowed = inksForPlate(plate).map((i) => i.id);
  const ink = allowed.includes(inkCandidate) ? inkCandidate : (allowed[0] ?? DEFAULT_QR_INK);

  /* A hand picked colour gets the same treatment as a preset, against the
     plate's own hex. That is the solid case and the floor of every other
     case, since a frosted or clear plate can only ever be darker than the
     tint it is drawn in and darker means less contrast with a dark ink. A
     colour that fails here could not pass anywhere, so it is dropped and
     the preset underneath it takes over. The measured check that frosted
     and clear additionally need happens at draw time, where the pixels are. */
  const customCandidate = normalizeHex(raw.inkCustom);
  const plateHex = plateSwatch(plate).hex;
  const customOk =
    customCandidate !== null &&
    contrastRatio(customCandidate, plateHex) >= QR_CONTRAST_FLOOR &&
    luminance(customCandidate) < luminance(plateHex);

  return {
    v: 1,
    template: pick(raw.template, TEMPLATE_IDS, base.template),
    format: pick(raw.format, QR_FORMAT_IDS, base.format),
    theme: pick(raw.theme, THEME_IDS, base.theme),
    backdrop: pick(raw.backdrop, BACKDROP_IDS, base.backdrop),
    backdropImage: text(raw.backdropImage, 400) || null,
    backdropCrop: num(raw.backdropCrop, base.backdropCrop, 1, 2),
    backdropFocus: pick(raw.backdropFocus, FOCUS_IDS, base.backdropFocus),
    backdropDim: num(raw.backdropDim, base.backdropDim, 0, 0.95),
    // Absent on every design saved before the blur control existed, which
    // is exactly the case the default covers: those cards were drawn sharp
    // and they carry on being drawn sharp.
    backdropBlur: num(raw.backdropBlur, base.backdropBlur, 0, MAX_BACKDROP_BLUR),
    backdropCredit: text(raw.backdropCredit, 240) || null,
    plate,
    // Absent on every design saved before the plate could be anything but
    // opaque, so those come back solid and redraw exactly as they were.
    plateMode: pick(raw.plateMode, PLATE_MODE_IDS, base.plateMode),
    plateOpacity: num(raw.plateOpacity, base.plateOpacity, 0.2, 1),
    plateBlur: num(raw.plateBlur, base.plateBlur, 0, MAX_PLATE_BLUR),
    ink,
    inkCustom: customOk ? customCandidate : null,
    mark: typeof raw.mark === "boolean" ? raw.mark : base.mark,
    prompt: text(raw.prompt, 80) || base.prompt,
    name: text(raw.name, 80) || base.name,
    subtitle: text(raw.subtitle, 120) || base.subtitle,
    showUrl: typeof raw.showUrl === "boolean" ? raw.showUrl : base.showUrl,
  };
}

/** A credit line from the two halves the image library stores. */
export function creditLine(credit: string | null, handle: string | null): string {
  const name = (credit || "").trim();
  const at = (handle || "").trim().replace(/^@+/, "");
  if (name && at) return `${name} (@${at})`;
  if (name) return name;
  if (at) return `@${at}`;
  return "";
}
