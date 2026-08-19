"use client";

/**
 * The browser end of the QR studio.
 *
 * Everything here consumes the draw list a layout produced. The preview
 * canvas and the downloaded PNG are the same call at the same size, so what
 * is on screen is the file, and the vector export writes the same list out
 * through the shared serialiser with its pictures embedded.
 *
 * The code is painted module by module with `fillRect` rather than by
 * rasterising a scaled SVG, for the reason the printed codes have always
 * been drawn that way: a scaled rasterisation leaves a grey half pixel
 * along every module boundary, and that softness is what turns a code that
 * reads across a room into one that has to be held still at arm's length.
 */

import {
  gradientLine,
  isGradient,
  fontStack,
  sceneToSvg,
  type PlateOp,
  type QrFill,
  type QrScene,
} from "@/lib/crm/qrScene";
import {
  sampleFromRgba,
  sampleGridSize,
  type BackdropSample,
} from "@/lib/crm/qrField";

/* ------------------------------------------------------------------ */
/*  Pictures                                                           */
/* ------------------------------------------------------------------ */

export type ImageBag = Map<string, HTMLImageElement>;

function sourcesIn(scene: QrScene): string[] {
  const seen = new Set<string>();
  for (const op of scene.ops) if (op.op === "image" && op.src) seen.add(op.src);
  return [...seen];
}

/**
 * Load every picture the scene refers to.
 *
 * One that will not load is left out rather than thrown, and the paint step
 * skips it. A missing brand mark should cost a card its mark, never its
 * code, and a backdrop that has been deleted from the library should still
 * leave a scannable square on the base colour.
 */
const decoded = new Map<string, HTMLImageElement>();

export async function loadSceneImages(scene: QrScene): Promise<ImageBag> {
  const bag: ImageBag = new Map();
  await Promise.all(
    sourcesIn(scene).map(async (src) => {
      // Held across renders. The studio redraws on every keystroke, and a
      // full size photograph decoded again each time is what turns a live
      // preview into a stutter.
      const cached = decoded.get(src);
      if (cached) {
        bag.set(src, cached);
        return;
      }
      await new Promise<void>((resolve) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => {
          decoded.set(src, image);
          bag.set(src, image);
          resolve();
        };
        image.onerror = () => resolve();
        image.src = src;
      });
    })
  );
  return bag;
}

/* ------------------------------------------------------------------ */
/*  Painting                                                           */
/* ------------------------------------------------------------------ */

function fillStyle(
  ctx: CanvasRenderingContext2D,
  fill: QrFill,
  x: number,
  y: number,
  w: number,
  h: number
): string | CanvasGradient {
  if (!isGradient(fill)) return fill;
  const line = gradientLine(fill, x, y, w, h);
  const gradient = ctx.createLinearGradient(line.x1, line.y1, line.x2, line.y2);
  for (const stop of fill.stops) gradient.addColorStop(stop.offset, stop.color);
  return gradient;
}

/** The canvas equivalent of `object-fit: cover` inside a box. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const sourceRatio = image.naturalWidth / image.naturalHeight;
  const boxRatio = w / h;
  let sw = image.naturalWidth;
  let sh = image.naturalHeight;
  if (sourceRatio > boxRatio) sw = image.naturalHeight * boxRatio;
  else sh = image.naturalWidth / boxRatio;
  ctx.drawImage(
    image,
    (image.naturalWidth - sw) / 2,
    (image.naturalHeight - sh) / 2,
    sw,
    sh,
    x,
    y,
    w,
    h
  );
}

interface LetterSpaced extends CanvasRenderingContext2D {
  letterSpacing: string;
}

/**
 * Whether this browser can blur while it draws.
 *
 * `ctx.filter` arrived in Safari 16.4, and the site supports Safari 16, so
 * there is a narrow band of phones where it is missing. Rather than let a
 * design quietly come out sharp on one machine and soft on another, the
 * fallback below approximates the same softening by other means.
 */
function canFilter(ctx: CanvasRenderingContext2D): boolean {
  return typeof (ctx as { filter?: unknown }).filter === "string";
}

/**
 * Draw a picture out of focus.
 *
 * Where the filter exists this is a real Gaussian at the same standard
 * deviation the vector file writes, so the PNG and the SVG come out of the
 * same number. Where it does not, the picture goes through a small
 * offscreen canvas and comes back up: repeated bilinear sampling is not a
 * Gaussian, but it is the same kind of softness at roughly the same
 * strength, which is a much smaller difference than blur against no blur.
 */
function drawBlurredCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  blur: number
) {
  if (canFilter(ctx)) {
    ctx.save();
    ctx.filter = `blur(${blur}px)`;
    drawCover(ctx, image, x, y, w, h);
    ctx.restore();
    return;
  }

  // A box the size of the drawn picture, shrunk so one small pixel spans
  // about two standard deviations, then scaled back up with smoothing on.
  const scale = Math.min(1, 1 / Math.max(1, blur * 2));
  const smallW = Math.max(1, Math.round(w * scale));
  const smallH = Math.max(1, Math.round(h * scale));
  const small = document.createElement("canvas");
  small.width = smallW;
  small.height = smallH;
  const sctx = small.getContext("2d");
  if (!sctx) {
    drawCover(ctx, image, x, y, w, h);
    return;
  }
  sctx.imageSmoothingEnabled = true;
  sctx.imageSmoothingQuality = "high";
  drawCover(sctx, image, 0, 0, smallW, smallH);

  const previous = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(small, 0, 0, smallW, smallH, x, y, w, h);
  ctx.imageSmoothingEnabled = previous;
}

/** A rounded rectangle as a path on the current context. */
function platePath(ctx: CanvasRenderingContext2D, op: PlateOp) {
  ctx.beginPath();
  if (op.r) ctx.roundRect(op.x, op.y, op.w, op.h, op.r);
  else ctx.rect(op.x, op.y, op.w, op.h);
}

/**
 * Frosted glass on a canvas.
 *
 * There is no backdrop filter to reach for here, so the region is done by
 * hand: copy the pixels already painted inside the plate's bounds and a
 * little way past them, blur the copy, and put it back under a clip in the
 * plate's own shape. The margin is the same three standard deviations the
 * photograph is drawn with, and for the same reason, because a Gaussian
 * given nothing past its edge fades to nothing at that edge. Where the
 * margin runs off the frame the copy starts filled with the background, so
 * the fade lands on the colour that is there anyway.
 */
function blurBehindPlate(ctx: CanvasRenderingContext2D, op: PlateOp, background: string) {
  const bleed = Math.ceil(op.backdropBlur * 3);
  const sx = op.x - bleed;
  const sy = op.y - bleed;
  const sw = op.w + bleed * 2;
  const sh = op.h + bleed * 2;

  const temp = document.createElement("canvas");
  temp.width = Math.max(1, Math.round(sw));
  temp.height = Math.max(1, Math.round(sh));
  const tctx = temp.getContext("2d");
  if (!tctx) return;

  tctx.fillStyle = background;
  tctx.fillRect(0, 0, temp.width, temp.height);

  // The overlap between the region wanted and the canvas that exists.
  const cx = Math.max(0, sx);
  const cy = Math.max(0, sy);
  const cw = Math.min(ctx.canvas.width, sx + sw) - cx;
  const ch = Math.min(ctx.canvas.height, sy + sh) - cy;
  if (cw > 0 && ch > 0) {
    tctx.drawImage(ctx.canvas, cx, cy, cw, ch, cx - sx, cy - sy, cw, ch);
  }

  ctx.save();
  platePath(ctx, op);
  ctx.clip();
  if (canFilter(ctx)) {
    ctx.filter = `blur(${op.backdropBlur}px)`;
    ctx.drawImage(temp, sx, sy, sw, sh);
  } else {
    // Same fallback the photograph uses on the browsers with no filter:
    // down and back up, which is a different kernel at a similar strength.
    const scale = Math.min(1, 1 / Math.max(1, op.backdropBlur * 2));
    const small = document.createElement("canvas");
    small.width = Math.max(1, Math.round(temp.width * scale));
    small.height = Math.max(1, Math.round(temp.height * scale));
    const sctx = small.getContext("2d");
    if (sctx) {
      sctx.imageSmoothingEnabled = true;
      sctx.imageSmoothingQuality = "high";
      sctx.drawImage(temp, 0, 0, small.width, small.height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(small, 0, 0, small.width, small.height, sx, sy, sw, sh);
    } else {
      ctx.drawImage(temp, sx, sy, sw, sh);
    }
  }
  ctx.restore();
}

export interface PaintOptions {
  /**
   * Stop before the plate, leaving only what is behind the code on the
   * canvas. This is how the backdrop gets measured: the guard needs the
   * pixels under the plate, and the plate is the thing about to be judged.
   */
  backdropOnly?: boolean;
  /** Draw everything at this fraction of output size */
  scale?: number;
}

/**
 * Draw the scene onto a context sized to the scene.
 *
 * The context is passed in rather than created, so a test can hand this a
 * stand in and check the pixels the same code would put on a canvas.
 */
export function paintScene(
  ctx: CanvasRenderingContext2D,
  scene: QrScene,
  images: ImageBag,
  options: PaintOptions = {}
) {
  ctx.save();
  if (options.scale && options.scale !== 1) ctx.scale(options.scale, options.scale);
  ctx.fillStyle = scene.background;
  ctx.fillRect(0, 0, scene.width, scene.height);

  for (const op of scene.ops) {
    if (op.op === "plate" && options.backdropOnly) break;

    if (op.op === "plate") {
      if (op.backdropBlur > 0) blurBehindPlate(ctx, op, scene.background);
      if (op.opacity > 0) {
        ctx.globalAlpha = op.opacity;
        ctx.fillStyle = op.fill;
        platePath(ctx, op);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      continue;
    }

    if (op.op === "rect") {
      ctx.fillStyle = fillStyle(ctx, op.fill, op.x, op.y, op.w, op.h);
      if (op.r) {
        ctx.beginPath();
        ctx.roundRect(op.x, op.y, op.w, op.h, op.r);
        ctx.fill();
      } else {
        ctx.fillRect(op.x, op.y, op.w, op.h);
      }
      continue;
    }

    if (op.op === "image") {
      const image = images.get(op.src);
      if (!image) continue;
      if (op.blur && op.blur > 0) {
        drawBlurredCover(ctx, image, op.x, op.y, op.w, op.h, op.blur);
      } else {
        drawCover(ctx, image, op.x, op.y, op.w, op.h);
      }
      continue;
    }

    if (op.op === "text") {
      ctx.font = `${op.weight} ${op.size}px ${fontStack(op.family)}`;
      ctx.fillStyle = op.color;
      ctx.textAlign = op.align === "center" ? "center" : "left";
      ctx.textBaseline = "alphabetic";
      ctx.globalAlpha = op.opacity ?? 1;
      const spaced = ctx as LetterSpaced;
      const previous = spaced.letterSpacing;
      if (op.tracking && previous !== undefined) spaced.letterSpacing = `${op.tracking}px`;
      ctx.fillText(op.text, op.x, op.y);
      if (op.tracking && previous !== undefined) spaced.letterSpacing = previous;
      ctx.globalAlpha = 1;
      continue;
    }

    // The light square first where there is one, so the quiet zone exists
    // whatever was underneath, then the dark modules on whole pixels. A
    // translucent plate leaves it null and the measurement is what stands
    // in for the square that is no longer painted.
    const size = op.matrix.length;
    const side = (size + op.quiet * 2) * op.module;
    if (op.light) {
      ctx.fillStyle = op.light;
      ctx.fillRect(op.x, op.y, side, side);
    }

    const cutFrom = op.cut > 0 ? Math.floor((size - op.cut) / 2) : -1;
    const cutTo = op.cut > 0 ? cutFrom + op.cut : -1;
    const originX = op.x + op.quiet * op.module;
    const originY = op.y + op.quiet * op.module;

    ctx.fillStyle = op.dark;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!op.matrix[r][c]) continue;
        if (op.cut > 0 && r >= cutFrom && r < cutTo && c >= cutFrom && c < cutTo) continue;
        ctx.fillRect(originX + c * op.module, originY + r * op.module, op.module, op.module);
      }
    }
  }

  ctx.restore();
}

/* ------------------------------------------------------------------ */
/*  Measuring the backdrop                                             */
/* ------------------------------------------------------------------ */

/**
 * The picture behind the code, drawn small and read back.
 *
 * This is the evidence the frosted and clear plates rest on. It is a real
 * render rather than a guess at what the gradients or the photograph will
 * come out as, which matters because a scrim over a picture over a base
 * colour is three layers of compositing and reasoning about the result is
 * how people end up shipping a code nobody can scan.
 *
 * Ninety six cells across the shorter edge, which puts a cell under one
 * module at every size the studio offers, and costs a fraction of a
 * millisecond to draw. The plate itself is never drawn, since it is the
 * thing being judged.
 */
export async function sampleSceneBackdrop(
  scene: QrScene,
  images?: ImageBag
): Promise<BackdropSample | null> {
  const bag = images ?? (await loadSceneImages(scene));
  const { cols, rows } = sampleGridSize(scene.width, scene.height);
  const canvas = document.createElement("canvas");
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  paintScene(ctx, scene, bag, { backdropOnly: true, scale: cols / scene.width });

  const pixels = ctx.getImageData(0, 0, cols, rows).data;
  return sampleFromRgba(pixels, cols, rows, scene.width, scene.height);
}

/* ------------------------------------------------------------------ */
/*  Files                                                              */
/* ------------------------------------------------------------------ */

/** The scene as a PNG at its full output size. */
export async function scenePngBlob(scene: QrScene, images?: ImageBag): Promise<Blob | null> {
  const bag = images ?? (await loadSceneImages(scene));
  const canvas = document.createElement("canvas");
  canvas.width = scene.width;
  canvas.height = scene.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  paintScene(ctx, scene, bag);
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/png"));
}

async function dataUri(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * The scene as a standalone SVG, with its pictures embedded.
 *
 * Vector is what a print shop wants for a business card back or a sticker:
 * the code stays a set of exact rectangles at any size the press runs at,
 * rather than a raster that has to be supplied at the right resolution.
 */
export async function sceneSvgDocument(scene: QrScene): Promise<string> {
  const inline: Record<string, string> = {};
  await Promise.all(
    sourcesIn(scene).map(async (src) => {
      const encoded = await dataUri(src);
      if (encoded) inline[src] = encoded;
    })
  );
  return sceneToSvg(scene, inline);
}
