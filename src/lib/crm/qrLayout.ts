/**
 * Turning a saved design into a draw list.
 *
 * This is the layout half of the QR studio. It reads a spec, the palettes
 * and backdrops the social cards already use, and the address the code
 * carries, and produces a {@link QrScene} in output pixels. It draws
 * nothing itself, which is what lets the preview, the PNG and the print
 * file all come from one arrangement.
 *
 * Three rules run through every branch:
 *
 *  1. **The quiet zone is structural.** The code always sits on an opaque
 *     light plate with four modules of that plate on every side, plus a
 *     little more for looks. Modules are never drawn over a photograph.
 *  2. **Modules land on whole pixels.** The module size is floored to an
 *     integer and the plate is sized from it, rather than the other way
 *     round. A module boundary on a half pixel comes out grey on both
 *     sides, and grey edges are what make a code marginal at distance.
 *  3. **The code takes the space first.** Type is measured, the remainder
 *     goes to the code, and on a lock screen that remainder is most of the
 *     clear band. It is going to be read off a screen at arm's length, at
 *     an angle, with a reflection across it.
 */

import { encodeQR } from "@/lib/qrcode";
import {
  BACKDROP_INK,
  getBackdrop,
  photoBox,
  photoScrim,
  type BackdropFocus,
} from "@/lib/social/backdrops";
import { getTheme } from "@/lib/social/themes";
import {
  CLEAR_MAX_VEIL,
  QR_CONTRAST_FLOOR,
  blurBleed,
  blurPixels,
  contrastRatio,
  getQrFormat,
  luminance,
  plateBlurPixels,
  qrContentInsets,
  resolveQrColors,
  type QrDesignSpec,
  type QrPlateMode,
} from "./qrDesign";
import { measurePlate, minimumVeil, type BackdropSample } from "./qrField";
import {
  parseLinearGradient,
  type ModulesOp,
  type PlateOp,
  type QrGuard,
  type QrOp,
  type QrScene,
  type TextOp,
} from "./qrScene";

/* ------------------------------------------------------------------ */
/*  Inputs                                                             */
/* ------------------------------------------------------------------ */

export interface QrSceneAssets {
  /** The brand mark on a dark field */
  markCream: string;
  /** The brand mark on a light field, which is the one the cutout uses */
  markBlack: string;
  /** A photograph to draw under everything, already an address */
  backdropImage?: string | null;
}

export const DEFAULT_QR_ASSETS: QrSceneAssets = {
  markCream: "/brand/mark-cream.png",
  markBlack: "/brand/mark-black.png",
};

/** Modules of light margin around the code. Four is the specified minimum. */
export const QUIET_MODULES = 4;

/** The brand mark is 674 by 1200. Width over height, so it is never squashed. */
const MARK_ASPECT = 674 / 1200;

/**
 * How much of the code the mark cutout is allowed to cover.
 *
 * The encoder writes at error correction level M, which recovers from
 * roughly fifteen per cent of the codewords being damaged. A centred square
 * of a fifth of the code's width is about four per cent of its area, which
 * leaves the rest of the budget for the things this cannot control: a
 * fingerprint, a crease in a sticker, a reflection off a phone screen. It
 * is deliberately nowhere near the limit.
 */
const CUT_FRACTION = 0.16;
const CUT_MIN = 3;
const CUT_MAX = 5;

/* ------------------------------------------------------------------ */
/*  Type measurement                                                   */
/* ------------------------------------------------------------------ */

/**
 * A rough advance width, good enough to stop a long company name running
 * off the edge. Real metrics would need the font loaded, which the layout
 * deliberately does not depend on so it can run anywhere.
 */
function measure(value: string, size: number, family: "sans" | "mono", tracking = 0): number {
  const factor = family === "mono" ? 0.6 : 0.55;
  return value.length * size * factor + Math.max(0, value.length - 1) * tracking;
}

function fit(
  value: string,
  maxWidth: number,
  size: number,
  family: "sans" | "mono",
  tracking = 0
): { text: string; size: number } {
  let current = size;
  const floor = Math.max(8, size * 0.62);
  while (current > floor && measure(value, current, family, tracking) > maxWidth) current -= 1;

  let text = value;
  while (text.length > 4 && measure(`${text}…`, current, family, tracking) > maxWidth) {
    text = text.slice(0, -1);
  }
  return { text: text === value ? value : `${text.trimEnd()}…`, size: current };
}

/* ------------------------------------------------------------------ */
/*  Palette                                                            */
/* ------------------------------------------------------------------ */

interface SceneInk {
  title: string;
  body: string;
  muted: string;
  /** Which mark asset sits correctly on this field */
  mark: "cream" | "black";
}

/* ------------------------------------------------------------------ */
/*  The scene                                                          */
/* ------------------------------------------------------------------ */

export interface BuildQrSceneInput {
  spec: QrDesignSpec;
  /** The address the code carries. This is the whole payload. */
  url: string;
  assets?: Partial<QrSceneAssets>;
  /**
   * The backdrop drawn small, which is the only way a frosted or a clear
   * plate can be judged. Absent means nothing has been measured, and a
   * plate that needs a measurement falls back to the opaque one rather
   * than being drawn on trust.
   */
  sample?: BackdropSample | null;
  /**
   * Draw what the spec asked for even where it fails, so the studio can put
   * the failure on screen next to the reason. The guard still reports it
   * and the studio still refuses to save it. Off everywhere else, which
   * means every path that produces a file gets the safe picture.
   */
  showFailures?: boolean;
}

/**
 * Build the draw list. Returns null when the address is too long to encode,
 * which the studio reports rather than drawing a broken square.
 */
export function buildQrScene({
  spec,
  url,
  assets,
  sample = null,
  showFailures = false,
}: BuildQrSceneInput): QrScene | null {
  let matrix: boolean[][];
  try {
    matrix = encodeQR(url);
  } catch {
    return null;
  }

  const art = { ...DEFAULT_QR_ASSETS, ...assets };
  const format = getQrFormat(spec.format);
  const theme = getTheme(spec.theme);
  const colors = resolveQrColors(spec, { enforce: !showFailures });
  const { width, height } = format;
  const s = format.scale;
  const ins = qrContentInsets(format);
  const bandX = ins.left;
  const bandY = ins.top;
  const bandW = width - ins.left - ins.right;
  const bandH = height - ins.top - ins.bottom;

  const ops: QrOp[] = [];
  let background = theme.background;
  let ink: SceneInk = {
    title: theme.text,
    body: theme.secondary,
    muted: theme.muted,
    mark: theme.ink,
  };

  /* ---------------- the field under everything ---------------- */

  const usePhoto = spec.template === "photo";
  const photo = usePhoto ? art.backdropImage || null : null;
  const backdrop = usePhoto ? getBackdrop(spec.backdrop) : getBackdrop("none");

  if (spec.template === "plain") {
    background = colors.plate;
    ink = { title: "#0A0A0A", body: "#3F3F46", muted: "#71717A", mark: "black" };
  } else if (usePhoto && photo) {
    background = backdrop.base || "#0A0A0A";
    const box = photoBox(width, height, spec.backdropCrop, spec.backdropFocus as BackdropFocus);
    /* A blurred picture is drawn larger than the box it fills. A Gaussian
       has nothing to sample past the pixels it was handed, so a photograph
       blurred at its own bounds fades to nothing along every edge and
       leaves a soft rim of the base colour around the frame. Growing the
       box by the kernel's reach on all four sides puts that rim outside
       the picture. Everything after this is drawn sharp. */
    const blur = blurPixels(spec.backdropBlur, width, height);
    const bleed = blurBleed(blur);
    ops.push({
      op: "image",
      x: box.left - bleed,
      y: box.top - bleed,
      w: box.width + bleed * 2,
      h: box.height + bleed * 2,
      src: photo,
      ...(blur > 0 ? { blur } : {}),
    });
    pushGradient(ops, photoScrim(spec.backdropDim, "center"), 0, 0, width, height);
    ink = {
      title: BACKDROP_INK.text,
      body: BACKDROP_INK.secondary,
      muted: BACKDROP_INK.muted,
      mark: "cream",
    };
  } else if (usePhoto && backdrop.layers?.length) {
    background = backdrop.base;
    for (const layer of backdrop.layers) pushGradient(ops, layer, 0, 0, width, height);
    pushGradient(ops, backdrop.scrim, 0, 0, width, height);
    ink = {
      title: BACKDROP_INK.text,
      body: BACKDROP_INK.secondary,
      muted: BACKDROP_INK.muted,
      mark: "cream",
    };
  } else {
    // Branded, and the photographic template with no backdrop chosen.
    pushGradient(ops, theme.wash, 0, 0, width, height);
  }

  const markSrc = ink.mark === "cream" ? art.markCream : art.markBlack;
  const showMark = spec.template !== "plain";
  const credit = usePhoto && photo ? (spec.backdropCredit || "").trim() : "";

  /* ---------------- type sizes ---------------- */

  const promptSize = Math.round(23 * s);
  const nameSize = Math.round(56 * s);
  const subSize = Math.round(29 * s);
  const urlSize = Math.round(21 * s);
  const creditSize = Math.round(16 * s);
  const promptTrack = Math.round(promptSize * 0.16);
  /* The mark asset is 674 by 1200, so it is taller than it is wide. Drawing
     it into a square box squashes it, which reads as a clipped logo. Height
     drives the size and the width follows from the real proportions. */
  const markSize = Math.round(52 * s);
  const markW = Math.round(markSize * MARK_ASPECT);

  const prompt = (spec.prompt || "").trim();
  const name = (spec.name || "").trim();
  const subtitle = (spec.subtitle || "").trim();
  const address = spec.showUrl ? url.replace(/^https?:\/\//, "") : "";

  /* ---------------- arrangement ---------------- */

  // Wide frames put the code beside the words; everything else stacks. A
  // business card back and a link preview are both far wider than they are
  // tall, and a stacked code on either leaves the code tiny.
  const split = width / height >= 1.5;
  const total = matrix.length + QUIET_MODULES * 2;

  // Every block height is the distance from one baseline to the next, so a
  // line that is not drawn takes no room at all and the rest close up.
  const markBlockH = showMark ? markSize + Math.round(26 * s) : 0;
  const promptBlockH = prompt ? Math.round(promptSize * 1.2) + Math.round(30 * s) : 0;
  const nameBlockH = name ? Math.round(nameSize * 1.42) : 0;
  const subBlockH = subtitle ? Math.round(subSize * 1.7) : 0;
  const urlBlockH = address ? Math.round(urlSize * 1.9) : 0;
  const creditBlockH = credit ? Math.round(creditSize * 2.4) : 0;

  let plateX: number;
  let plateY: number;
  let plateSize: number;
  let modulePx: number;
  let platePad: number;
  let textX: number;
  let textW: number;
  let textAlign: "left" | "center";
  let cursor: number;

  if (split) {
    const gutter = Math.round(56 * s);
    const target = Math.min(bandH, Math.round(bandW * 0.46));
    modulePx = Math.max(2, Math.floor(target / (total + 1.8)));
    platePad = Math.round(modulePx * 0.9);
    plateSize = modulePx * total + platePad * 2;
    plateX = bandX;
    plateY = bandY + Math.round((bandH - plateSize) / 2);

    textX = bandX + plateSize + gutter;
    textW = bandW - plateSize - gutter;
    textAlign = "left";

    const blockH = markBlockH + promptBlockH + nameBlockH + subBlockH + urlBlockH;
    cursor = bandY + Math.round((bandH - blockH) / 2);
  } else {
    const topH = markBlockH + promptBlockH;
    const bottomH = Math.round(44 * s) + nameBlockH + subBlockH + urlBlockH;
    const available = bandH - topH - bottomH - creditBlockH;
    const target = Math.min(bandW, available);
    modulePx = Math.max(2, Math.floor(target / (total + 1.8)));
    platePad = Math.round(modulePx * 0.9);
    plateSize = modulePx * total + platePad * 2;

    const contentH = topH + plateSize + bottomH + creditBlockH;
    const startY = bandY + Math.round((bandH - contentH) / 2);

    plateX = bandX + Math.round((bandW - plateSize) / 2);
    plateY = startY + topH;
    textX = bandX + Math.round(bandW / 2);
    textW = bandW;
    textAlign = "center";
    cursor = startY;
  }

  /* ---------------- the block above the code ---------------- */

  if (split) {
    if (showMark) {
      ops.push({ op: "image", x: textX, y: cursor, w: markW, h: markSize, src: markSrc });
      cursor += markBlockH;
    }
  } else if (showMark) {
    ops.push({
      op: "image",
      x: textX - Math.round(markW / 2),
      y: cursor,
      w: markW,
      h: markSize,
      src: markSrc,
    });
    cursor += markBlockH;
  }

  if (prompt) {
    const fitted = fit(prompt.toUpperCase(), textW, promptSize, "sans", promptTrack);
    // Centred text that has been letter spaced carries a trailing space of
    // tracking on the last character, so the optical centre sits half a
    // space to the left of the geometric one. Nudged back.
    const nudge = textAlign === "center" ? Math.round(promptTrack / 2) : 0;
    ops.push(
      textOp(fitted.text, textX + nudge, cursor + fitted.size, {
        size: fitted.size,
        weight: 600,
        color: ink.muted,
        align: textAlign,
        tracking: promptTrack,
      })
    );
    cursor += promptBlockH;
  }

  /* ---------------- the code ---------------- */

  const cut = spec.mark
    ? Math.min(CUT_MAX, Math.max(CUT_MIN, Math.round(matrix.length * CUT_FRACTION)))
    : 0;

  // The plate carries the quiet zone, so it is drawn as its own rectangle
  // and the modules operation is positioned inside it. The corner radius is
  // capped well under the quiet zone so rounding never eats into it.
  const radius = Math.min(Math.round(plateSize * 0.055), platePad + modulePx * 2);
  const plateRect = { x: plateX, y: plateY, w: plateSize, h: plateSize };

  const { plate, guard } = decidePlate({
    spec,
    rect: plateRect,
    radius,
    tint: colors.plate,
    ink: colors.ink,
    width,
    height,
    sample,
    showFailures,
  });
  ops.push(plate);

  const modules: ModulesOp = {
    op: "modules",
    x: plateX + platePad,
    y: plateY + platePad,
    module: modulePx,
    quiet: QUIET_MODULES,
    matrix,
    dark: colors.ink,
    // An opaque plate paints the square under the modules as it always has.
    // A translucent one must not, since that square is the whole area the
    // design is asking to see through.
    light: plate.opacity >= 1 ? colors.plate : null,
    cut,
  };
  ops.push(modules);

  if (cut > 0) {
    const cutPx = cut * modulePx;
    // The knockout is square and centred, so the same offset applies on
    // both axes: the quiet zone, then however many modules sit before it.
    const offset = (QUIET_MODULES + Math.floor((matrix.length - cut) / 2)) * modulePx;
    const cutX = modules.x + offset;
    const cutY = modules.y + offset;
    /* The knockout is square but the mark is 674 by 1200. Filling the square
       squashes it, which is what made it look cut off in the middle of the
       code. Height fills the square less the inset, width follows from the
       real proportions, and the result is centred in the gap. */
    const markInset = Math.round(cutPx * 0.16);
    const markH = cutPx - markInset * 2;
    const markW = Math.round(markH * MARK_ASPECT);
    ops.push({
      op: "image",
      x: cutX + Math.round((cutPx - markW) / 2),
      y: cutY + markInset,
      w: markW,
      h: markH,
      src: art.markBlack,
    });
  }

  /* ---------------- the block under the code ---------------- */

  if (!split) cursor = plateY + plateSize + Math.round(44 * s);

  if (name) {
    const fitted = fit(name, textW, nameSize, "sans");
    ops.push(
      textOp(fitted.text, textX, cursor + fitted.size, {
        size: fitted.size,
        weight: 600,
        color: ink.title,
        align: textAlign,
      })
    );
    cursor += nameBlockH;
  }

  if (subtitle) {
    const fitted = fit(subtitle, textW, subSize, "sans");
    ops.push(
      textOp(fitted.text, textX, cursor + fitted.size, {
        size: fitted.size,
        weight: 400,
        color: ink.body,
        align: textAlign,
      })
    );
    cursor += subBlockH;
  }

  if (address) {
    const fitted = fit(address, textW, urlSize, "mono");
    ops.push(
      textOp(fitted.text, textX, cursor + fitted.size, {
        size: fitted.size,
        weight: 400,
        color: ink.muted,
        align: textAlign,
      })
    );
    cursor += urlBlockH;
  }

  if (credit) {
    // Inside the clear band rather than along the bottom edge, because on a
    // lock screen the bottom edge is under the torch and camera buttons.
    //
    // On a wide frame the plate reaches most of the way down that band, so
    // a line centred across the whole width runs over its bottom corner and
    // into the quiet zone. It stays in the text column instead, which is
    // the one part of a split layout the code never occupies.
    const creditX = split ? textX : bandX + Math.round(bandW / 2);
    const creditW = split ? textW : bandW;
    const fitted = fit(credit, creditW, creditSize, "sans");
    ops.push(
      textOp(fitted.text, creditX, bandY + bandH - Math.round(creditSize * 0.6), {
        size: fitted.size,
        weight: 400,
        color: ink.muted,
        align: split ? "left" : "center",
        opacity: 0.8,
      })
    );
  }

  return {
    width,
    height,
    background,
    ops,
    meta: {
      payload: url,
      modules: matrix.length,
      modulePx,
      plateSize,
      plateRect,
      quietPx: QUIET_MODULES * modulePx,
      contrast: guard.contrast,
      cutArea: cut > 0 ? (cut * cut) / (matrix.length * matrix.length) : 0,
      guard,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  The guard                                                          */
/* ------------------------------------------------------------------ */

interface PlateDecision {
  spec: QrDesignSpec;
  rect: { x: number; y: number; w: number; h: number };
  radius: number;
  tint: string;
  ink: string;
  width: number;
  height: number;
  sample: BackdropSample | null;
  showFailures: boolean;
}

/**
 * Decide what the code sits on, and be able to say why.
 *
 * Three modes, and the discipline is different for each because the shape
 * of the choice is different for each.
 *
 *  - **Solid** needs no measurement. Two hex values, one ratio, done.
 *  - **Frosted** has a control, so the control filters. The opacity and the
 *    blur are picked from lists, and the studio only offers combinations
 *    that clear the floor against the pixels actually behind the plate.
 *    Anything that arrives here failing was hand written or arrived before
 *    the picture changed under it, and it is refused.
 *  - **Clear** has no control to filter, so it gets the smallest correction
 *    that works instead: a veil of the plate colour, raised in small steps
 *    until the worst square under the code clears the floor. Usually that
 *    is nothing at all. Where more than {@link CLEAR_MAX_VEIL} would be
 *    needed the answer is no, because a veil past a half is a plate, and
 *    calling it a clear code would be a lie told in the interface.
 *
 * Nothing above the floor is ever refused and nothing below it is ever
 * quietly drawn. Where a mode cannot be made safe, the picture falls back
 * to the opaque plate that has always worked, and the reason travels with
 * the scene so a control can put it in words.
 */
function decidePlate(input: PlateDecision): { plate: PlateOp; guard: QrGuard } {
  const { spec, rect, radius, tint, ink, width, height, sample, showFailures } = input;
  const floor = QR_CONTRAST_FLOOR;
  const staticRatio = contrastRatio(ink, tint);
  const positive = luminance(ink) < luminance(tint);

  const requested: QrPlateMode =
    // The plain template has no field to see through. Its background is the
    // plate colour, so frosting it would frost nothing.
    spec.template === "plain" ? "solid" : spec.plateMode;

  const opaque = (reasons: string[]): { plate: PlateOp; guard: QrGuard } => ({
    plate: {
      op: "plate",
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
      r: radius,
      fill: tint,
      opacity: 1,
      backdropBlur: 0,
    },
    guard: {
      mode: "solid",
      requested,
      contrast: staticRatio,
      average: staticRatio,
      floor,
      ok: staticRatio >= floor && positive,
      measured: false,
      veil: 0,
      worst: tint,
      reasons,
    },
  });

  if (requested === "solid") {
    return opaque(
      staticRatio >= floor && positive
        ? []
        : [
            `That ink reads ${staticRatio.toFixed(1)} to 1 against the plate, under the floor of ${floor} to 1. Pick something darker.`,
          ]
    );
  }

  if (!sample) {
    // Nothing has been drawn to measure yet. In the studio this lasts one
    // frame. Anywhere else it means a file is being produced without pixels
    // to check, and the opaque plate is the only honest answer.
    return opaque([
      "The picture behind the code has not been measured yet, so it is drawn on a solid plate until it has.",
    ]);
  }

  const blurPx = plateBlurPixels(spec.plateBlur, width, height);

  if (requested === "frosted") {
    const opacity = Math.min(1, Math.max(0, spec.plateOpacity));
    const reading = measurePlate({ sample, rect, tint, opacity, blurPx, ink, floor });

    if (!reading.ok && !showFailures) {
      return opaque([
        `A frosted plate at this setting leaves ${reading.min.toFixed(1)} to 1 under the code, under the floor of ${floor} to 1, so it is drawn solid instead.`,
      ]);
    }

    return {
      plate: {
        op: "plate",
        x: rect.x,
        y: rect.y,
        w: rect.w,
        h: rect.h,
        r: radius,
        fill: tint,
        opacity,
        backdropBlur: blurPx,
      },
      guard: {
        mode: "frosted",
        requested,
        contrast: reading.min,
        average: reading.avg,
        floor,
        ok: reading.ok,
        measured: true,
        veil: 0,
        worst: reading.worst,
        reasons: reading.ok
          ? []
          : [
              reading.positive
                ? `The darkest square under this plate leaves ${reading.min.toFixed(1)} to 1 against the ink, under the floor of ${floor} to 1. Make the plate denser, blur it harder, or darken the photograph.`
                : "The picture behind this plate comes out darker than the ink in places, which would invert the code. Make the plate denser or pick a darker ink.",
            ],
      },
    };
  }

  /* Clear. The measurement is taken square by square with no blur, because
     there is nothing between the modules and the photograph to even the
     field out. A bright cloud in one corner is what stops a code decoding,
     and an average over the whole plate is exactly the number that would
     miss it. */
  const bare = measurePlate({ sample, rect, tint, opacity: 0, blurPx: 0, ink, floor });
  if (bare.ok) {
    return {
      plate: {
        op: "plate",
        x: rect.x,
        y: rect.y,
        w: rect.w,
        h: rect.h,
        r: radius,
        fill: tint,
        opacity: 0,
        backdropBlur: 0,
      },
      guard: {
        mode: "clear",
        requested,
        contrast: bare.min,
        average: bare.avg,
        floor,
        ok: true,
        measured: true,
        veil: 0,
        worst: bare.worst,
        reasons: [],
      },
    };
  }

  const veil = minimumVeil({ sample, rect, tint, blurPx: 0, ink, floor }, CLEAR_MAX_VEIL);

  if (veil === null) {
    const sentence = bare.positive
      ? `This picture is too dark under the code. The worst square leaves ${bare.min.toFixed(1)} to 1 against the ink and no veil under a half would fix it, so a clear code cannot be made to read here.`
      : "This picture is darker than the ink in places, which would invert the code. A clear code cannot be made to read here.";
    if (!showFailures) return opaque([sentence]);
    return {
      plate: {
        op: "plate",
        x: rect.x,
        y: rect.y,
        w: rect.w,
        h: rect.h,
        r: radius,
        fill: tint,
        opacity: 0,
        backdropBlur: 0,
      },
      guard: {
        mode: "clear",
        requested,
        contrast: bare.min,
        average: bare.avg,
        floor,
        ok: false,
        measured: true,
        veil: 0,
        worst: bare.worst,
        reasons: [sentence],
      },
    };
  }

  const veiled = measurePlate({ sample, rect, tint, opacity: veil, blurPx: 0, ink, floor });
  return {
    plate: {
      op: "plate",
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
      r: radius,
      fill: tint,
      opacity: veil,
      backdropBlur: 0,
    },
    guard: {
      mode: "clear",
      requested,
      contrast: veiled.min,
      average: veiled.avg,
      floor,
      ok: veiled.ok,
      measured: true,
      veil,
      worst: veiled.worst,
      reasons: [
        `Part of this picture is too bright under the code, so a ${Math.round(veil * 100)}% veil of the plate colour has been laid under it. That is the least that clears the floor of ${floor} to 1.`,
      ],
    },
  };
}

/* ------------------------------------------------------------------ */

function textOp(
  text: string,
  x: number,
  y: number,
  rest: Omit<TextOp, "op" | "text" | "x" | "y" | "family"> & { family?: "sans" | "mono" }
): TextOp {
  return { ...rest, op: "text", text, x, y, family: rest.family ?? "sans" };
}

function pushGradient(ops: QrOp[], css: string, x: number, y: number, w: number, h: number) {
  if (!css) return;
  const gradient = parseLinearGradient(css);
  if (!gradient) return;
  ops.push({ op: "rect", x, y, w, h, fill: gradient });
}
