/**
 * Measuring the field a code actually sits on.
 *
 * The studio used to be able to guarantee scannability by construction: the
 * plate was opaque and light, so the contrast between the modules and what
 * they sat on was a property of two hex values and nothing else. A frosted
 * plate and a clear one both break that, because what is under the modules
 * is now partly a photograph, and a photograph is not a hex value.
 *
 * So the guarantee moves from assumption to measurement. The backdrop is
 * drawn once at a coarse resolution, the region the code will occupy is
 * read back, and the contrast is computed against those pixels. Two things
 * fall out of that and they are the whole reason this file exists:
 *
 *  1. **Frosted is measured on the blurred field.** The plate blurs what is
 *     behind it before tinting it, so the honest thing to measure is the
 *     blurred grid, not the raw one. Blur is what makes a frosted plate
 *     safe, and the measurement has to be able to see that.
 *  2. **Clear is measured cell by cell, and the worst cell wins.** An
 *     average is the wrong number for a transparent code. A photograph that
 *     averages to a comfortable mid grey can still have a blown out cloud
 *     in one corner, and that corner is where the code stops decoding. The
 *     average would say yes. The worst cell says no, and the worst cell is
 *     right.
 *
 * Nothing here touches a canvas or a DOM node. It takes a grid of colours
 * and gives back numbers, so the browser and a decode harness can reach the
 * same verdict from the same arithmetic.
 */

import { QR_CONTRAST_FLOOR, relativeLuminance } from "./qrDesign";

/* ------------------------------------------------------------------ */
/*  The grid                                                           */
/* ------------------------------------------------------------------ */

/**
 * The backdrop, drawn small.
 *
 * `cols` by `rows` cells covering a frame of `width` by `height` output
 * pixels, so a rectangle in output pixels can be mapped onto the grid
 * without the caller knowing how coarse the grid is. Around ninety six
 * cells across the shorter edge puts a cell comfortably under one module,
 * which is the smallest thing a reader can resolve anyway.
 */
export interface BackdropSample {
  width: number;
  height: number;
  cols: number;
  rows: number;
  /** Three bytes per cell, row major, no alpha. */
  data: Uint8ClampedArray;
}

/** Cells across the shorter edge. Fine enough to catch a bright corner. */
export const SAMPLE_CELLS = 96;

/** The grid dimensions to draw a frame of this shape at. */
export function sampleGridSize(width: number, height: number): { cols: number; rows: number } {
  const shorter = Math.max(1, Math.min(width, height));
  const scale = SAMPLE_CELLS / shorter;
  return {
    cols: Math.max(2, Math.round(width * scale)),
    rows: Math.max(2, Math.round(height * scale)),
  };
}

/** Drop the alpha channel off a rendered grid. */
export function sampleFromRgba(
  rgba: Uint8ClampedArray | Uint8Array,
  cols: number,
  rows: number,
  width: number,
  height: number
): BackdropSample {
  const data = new Uint8ClampedArray(cols * rows * 3);
  for (let i = 0, j = 0; i < cols * rows; i++, j += 3) {
    data[j] = rgba[i * 4];
    data[j + 1] = rgba[i * 4 + 1];
    data[j + 2] = rgba[i * 4 + 2];
  }
  return { width, height, cols, rows, data };
}

/* ------------------------------------------------------------------ */
/*  Blur                                                               */
/* ------------------------------------------------------------------ */

/**
 * Three box passes, which is the usual stand in for a Gaussian.
 *
 * The width comes from the standard relation between a run of box blurs and
 * the deviation they approximate, so the number handed in here is the same
 * standard deviation the plate is actually drawn with. The measurement and
 * the picture are looking at the same softness.
 */
function boxWidth(sigma: number): number {
  if (!(sigma > 0)) return 0;
  const ideal = Math.sqrt(4 * sigma * sigma + 1);
  const w = Math.max(1, Math.round(ideal));
  return w % 2 === 0 ? w + 1 : w;
}

function boxPass(
  src: Float32Array,
  dst: Float32Array,
  cols: number,
  rows: number,
  radius: number,
  horizontal: boolean
) {
  const outer = horizontal ? rows : cols;
  const inner = horizontal ? cols : rows;
  const span = radius * 2 + 1;

  for (let o = 0; o < outer; o++) {
    for (let ch = 0; ch < 3; ch++) {
      let sum = 0;
      const at = (i: number) => {
        const clamped = Math.min(inner - 1, Math.max(0, i));
        const index = horizontal ? o * cols + clamped : clamped * cols + o;
        return src[index * 3 + ch];
      };
      for (let i = -radius; i <= radius; i++) sum += at(i);
      for (let i = 0; i < inner; i++) {
        const index = horizontal ? o * cols + i : i * cols + o;
        dst[index * 3 + ch] = sum / span;
        sum += at(i + radius + 1) - at(i - radius);
      }
    }
  }
}

/** The grid as it would look blurred by this standard deviation, in output pixels. */
export function blurSample(sample: BackdropSample, sigmaPx: number): BackdropSample {
  if (!(sigmaPx > 0)) return sample;

  const cellW = sample.width / sample.cols;
  const cellH = sample.height / sample.rows;
  const wx = boxWidth(sigmaPx / cellW);
  const wy = boxWidth(sigmaPx / cellH);
  if (wx <= 1 && wy <= 1) return sample;

  let a = Float32Array.from(sample.data);
  let b = new Float32Array(a.length);

  for (let pass = 0; pass < 3; pass++) {
    if (wx > 1) {
      boxPass(a, b, sample.cols, sample.rows, (wx - 1) / 2, true);
      [a, b] = [b, a];
    }
    if (wy > 1) {
      boxPass(a, b, sample.cols, sample.rows, (wy - 1) / 2, false);
      [a, b] = [b, a];
    }
  }

  return { ...sample, data: Uint8ClampedArray.from(a) };
}

/* ------------------------------------------------------------------ */
/*  Colour arithmetic                                                  */
/* ------------------------------------------------------------------ */

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = (hex || "").replace("#", "");
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
  return {
    r: Number.isNaN(r) ? 0 : r,
    g: Number.isNaN(g) ? 0 : g,
    b: Number.isNaN(b) ? 0 : b,
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const part = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${part(r)}${part(g)}${part(b)}`.toUpperCase();
}

/**
 * A tint laid over a backdrop, the way a browser composites it.
 *
 * Canvas alpha blending happens on the stored byte values rather than in
 * linear light, so mixing in plain sRGB here is what matches the picture
 * that actually gets drawn. Measuring in linear light would be more
 * physically correct and would disagree with the pixels, which is the one
 * outcome that would make this whole file worthless.
 */
export function composite(
  tint: { r: number; g: number; b: number },
  alpha: number,
  back: { r: number; g: number; b: number }
): { r: number; g: number; b: number } {
  const a = Math.min(1, Math.max(0, alpha));
  return {
    r: tint.r * a + back.r * (1 - a),
    g: tint.g * a + back.g * (1 - a),
    b: tint.b * a + back.b * (1 - a),
  };
}

export function contrastRgb(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number }
): number {
  const la = relativeLuminance(a.r, a.g, a.b);
  const lb = relativeLuminance(b.r, b.g, b.b);
  const light = Math.max(la, lb);
  const dark = Math.min(la, lb);
  return (light + 0.05) / (dark + 0.05);
}

/* ------------------------------------------------------------------ */
/*  The measurement                                                    */
/* ------------------------------------------------------------------ */

export interface PlateRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MeasureInput {
  sample: BackdropSample;
  rect: PlateRect;
  /** The plate's tint, or the ink's own colour when there is no plate at all */
  tint: string;
  /** 0 for a fully clear plate, 1 for an opaque one */
  opacity: number;
  /** Standard deviation the plate blurs what is behind it by, in output pixels */
  blurPx: number;
  ink: string;
  floor?: number;
}

export interface PlateMeasurement {
  /** The worst contrast anywhere under the plate. This is the number that decides. */
  min: number;
  /** Contrast against the mean of the whole region, kept only so the two can be compared */
  avg: number;
  /** The colour that produced the worst reading, for a control that has to explain itself */
  worst: string;
  /** Where that colour was, as a fraction of the plate, so the studio can point at it */
  worstAt: { x: number; y: number };
  /** How much of the plate falls under the floor, 0 to 1 */
  failing: number;
  /** Whether the modules stay the darker of the two everywhere */
  positive: boolean;
  ok: boolean;
}

/**
 * Read the field under the plate.
 *
 * The blur is applied to the whole grid before the region is cut out,
 * because a Gaussian under a plate pulls colour in from outside the plate's
 * own edge. Blurring the cut out region instead would miss the bright thing
 * sitting just past the corner, which is exactly the thing worth catching.
 */
export function measurePlate(input: MeasureInput): PlateMeasurement {
  const floor = input.floor ?? QR_CONTRAST_FLOOR;
  const grid = blurSample(input.sample, input.blurPx);
  const ink = hexToRgb(input.ink);
  const tint = hexToRgb(input.tint);
  const inkLum = relativeLuminance(ink.r, ink.g, ink.b);

  const cellW = grid.width / grid.cols;
  const cellH = grid.height / grid.rows;
  const c0 = Math.max(0, Math.floor(input.rect.x / cellW));
  const c1 = Math.min(grid.cols - 1, Math.ceil((input.rect.x + input.rect.w) / cellW) - 1);
  const r0 = Math.max(0, Math.floor(input.rect.y / cellH));
  const r1 = Math.min(grid.rows - 1, Math.ceil((input.rect.y + input.rect.h) / cellH) - 1);

  let min = Infinity;
  let worst = { r: 255, g: 255, b: 255 };
  let worstAt = { x: 0.5, y: 0.5 };
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let count = 0;
  let failed = 0;
  let positive = true;

  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      const i = (r * grid.cols + c) * 3;
      const field = composite(tint, input.opacity, {
        r: grid.data[i],
        g: grid.data[i + 1],
        b: grid.data[i + 2],
      });
      const ratio = contrastRgb(ink, field);
      sumR += field.r;
      sumG += field.g;
      sumB += field.b;
      count++;
      if (ratio < floor) failed++;
      if (relativeLuminance(field.r, field.g, field.b) <= inkLum) positive = false;
      if (ratio < min) {
        min = ratio;
        worst = field;
        worstAt = {
          x: (c + 0.5) / Math.max(1, grid.cols),
          y: (r + 0.5) / Math.max(1, grid.rows),
        };
      }
    }
  }

  if (count === 0) {
    // The plate sits entirely off the grid, which cannot happen from a real
    // layout. Report the pairing on its own terms rather than inventing a
    // reading, and let the caller decide.
    const field = composite(tint, input.opacity, { r: 255, g: 255, b: 255 });
    const ratio = contrastRgb(ink, field);
    return {
      min: ratio,
      avg: ratio,
      worst: rgbToHex(field.r, field.g, field.b),
      worstAt: { x: 0.5, y: 0.5 },
      failing: ratio < floor ? 1 : 0,
      positive: true,
      ok: ratio >= floor,
    };
  }

  const mean = { r: sumR / count, g: sumG / count, b: sumB / count };
  return {
    min,
    avg: contrastRgb(ink, mean),
    worst: rgbToHex(worst.r, worst.g, worst.b),
    worstAt,
    failing: failed / count,
    positive,
    ok: min >= floor && positive,
  };
}

/**
 * The smallest veil that brings a clear code above the floor.
 *
 * Stepped rather than solved, because the relationship between the tint's
 * alpha and the worst cell's contrast is only monotonic when the tint is
 * lighter than everything under it, and a picker that hands out plate
 * colours cannot promise that. Twenty five steps is a fiftieth of a stop
 * each and costs nothing.
 *
 * Returns null when even the cap will not do it, which is the refusal.
 */
export function minimumVeil(
  input: Omit<MeasureInput, "opacity">,
  cap: number,
  step = 0.02
): number | null {
  for (let alpha = 0; alpha <= cap + 1e-9; alpha += step) {
    const rounded = Math.round(alpha * 100) / 100;
    if (measurePlate({ ...input, opacity: rounded }).ok) return rounded;
  }
  return null;
}
