/**
 * The draw list a designed code comes out as.
 *
 * Nothing here touches a canvas, a DOM node or React. A layout produces an
 * ordered list of primitive operations in output pixels, and separate
 * backends consume it: the browser paints it onto a canvas for the preview
 * and the PNG, and {@link sceneToSvg} writes the same list out as a vector
 * file for print. One list means the preview, the download and the print
 * file cannot drift apart, and it means the geometry that decides whether a
 * code scans can be checked without a browser in the room.
 *
 * The one operation that matters is `modules`. Every coordinate it draws is
 * a whole number of output pixels, because a module boundary that lands on
 * a half pixel comes out grey on both sides, and that softness is exactly
 * what makes a small printed code marginal to read.
 */

/* ------------------------------------------------------------------ */
/*  Fills                                                              */
/* ------------------------------------------------------------------ */

export interface GradientStop {
  /** 0 to 1 along the gradient line */
  offset: number;
  color: string;
}

export interface LinearGradient {
  /** CSS convention: 0 points up, 90 points right, increasing clockwise */
  angle: number;
  stops: GradientStop[];
}

export type QrFill = string | LinearGradient;

export function isGradient(fill: QrFill): fill is LinearGradient {
  return typeof fill !== "string";
}

/**
 * Parse the `linear-gradient(...)` strings the shared palettes and
 * backdrops are written in.
 *
 * The themes and backdrops in the social library are all plain two stop or
 * three stop linear gradients with an explicit angle and percentage stops,
 * which is the whole grammar this needs to handle. Anything it cannot read
 * comes back null and the caller skips that layer, so an unparseable wash
 * costs a little atmosphere rather than the whole card.
 */
export function parseLinearGradient(css: string): LinearGradient | null {
  const match = /^\s*linear-gradient\(\s*([-\d.]+)deg\s*,(.+)\)\s*$/is.exec(css);
  if (!match) return null;

  const angle = Number(match[1]);
  if (!Number.isFinite(angle)) return null;

  // Split on commas that are not inside an rgb()/rgba() call.
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of match[2]) {
    if (char === "(") depth++;
    if (char === ")") depth--;
    if (char === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  parts.push(current);

  const stops: GradientStop[] = [];
  parts.forEach((part, index) => {
    const trimmed = part.trim();
    if (!trimmed) return;
    const stop = /\s([-\d.]+)%\s*$/.exec(trimmed);
    const color = stop ? trimmed.slice(0, stop.index).trim() : trimmed;
    const offset = stop ? Number(stop[1]) / 100 : index / Math.max(1, parts.length - 1);
    if (!color) return;
    stops.push({ offset: Math.min(1, Math.max(0, offset)), color });
  });

  return stops.length >= 2 ? { angle, stops } : null;
}

/**
 * The two endpoints of a CSS gradient line across a box.
 *
 * The line runs through the centre at the given angle and is long enough
 * that the first and last stops land exactly on the corners, which is what
 * CSS specifies and what makes a stacked pair of layers line up the way it
 * does on the site.
 */
export function gradientLine(
  gradient: LinearGradient,
  x: number,
  y: number,
  width: number,
  height: number
): { x1: number; y1: number; x2: number; y2: number } {
  const radians = (gradient.angle * Math.PI) / 180;
  const dx = Math.sin(radians);
  const dy = -Math.cos(radians);
  const length = Math.abs(width * dx) + Math.abs(height * dy);
  const cx = x + width / 2;
  const cy = y + height / 2;
  return {
    x1: cx - (dx * length) / 2,
    y1: cy - (dy * length) / 2,
    x2: cx + (dx * length) / 2,
    y2: cy + (dy * length) / 2,
  };
}

/* ------------------------------------------------------------------ */
/*  Operations                                                         */
/* ------------------------------------------------------------------ */

export interface RectOp {
  op: "rect";
  x: number;
  y: number;
  w: number;
  h: number;
  /** Corner radius. Never applied to anything inside a code. */
  r?: number;
  fill: QrFill;
}

export interface ImageOp {
  op: "image";
  x: number;
  y: number;
  w: number;
  h: number;
  /** An address, or a key into the data URI map the backend is given */
  src: string;
  /**
   * Gaussian standard deviation in output pixels, or absent for a sharp
   * picture. The unit is chosen so the two backends need no conversion:
   * `blur(Npx)` in a canvas filter and `feGaussianBlur stdDeviation="N"`
   * in a vector file are the same number and the same kernel.
   *
   * Only ever set on the photograph under everything. Nothing that carries
   * information is drawn through this.
   */
  blur?: number;
}

export interface TextOp {
  op: "text";
  x: number;
  /** The text baseline */
  y: number;
  text: string;
  size: number;
  weight: number;
  color: string;
  align: "left" | "center";
  family: "sans" | "mono";
  /** Letter spacing in output pixels */
  tracking?: number;
  opacity?: number;
}

export interface ModulesOp {
  op: "modules";
  /** Top left of the light plate the code sits on, in output pixels */
  x: number;
  y: number;
  /** Side of one module in whole output pixels */
  module: number;
  /** Modules of light margin on every side. Four is the specified minimum. */
  quiet: number;
  matrix: boolean[][];
  dark: string;
  /**
   * The colour of the square painted under the modules, or null when the
   * plate beneath is translucent and painting an opaque square would undo
   * the whole point of it. Null is only ever set where a measurement has
   * already established that the field is light enough without one.
   */
  light: string | null;
  /**
   * Side, in modules, of a light square knocked out of the middle for the
   * mark. Zero when there is no cutout. Kept small enough that the error
   * correction absorbs it, which is checked where the layout sets it.
   */
  cut: number;
}

/**
 * The plate, which is the one thing under the code.
 *
 * At full opacity with no blur this is a plain rounded rectangle and draws
 * exactly as the rectangle it replaced. Below full opacity it is frosted
 * glass: whatever has already been drawn inside its bounds is blurred, and
 * the tint goes over the top.
 *
 * Backdrop blur is the awkward one, because it means blurring a region of
 * the picture so far rather than blurring a source image. Both backends
 * handle it the same way and neither of them can shortcut it: the canvas
 * copies the region it has already painted, blurs the copy and puts it
 * back under a clip, and the vector file replays every operation that came
 * before this one into a group that carries the blur filter and the same
 * clip. One standard deviation, two routes, the same picture.
 */
export interface PlateOp {
  op: "plate";
  x: number;
  y: number;
  w: number;
  h: number;
  /** Corner radius, capped by the layout so it never eats the quiet zone */
  r?: number;
  /** The tint laid over whatever is behind */
  fill: string;
  /** 0 draws no tint at all, 1 is an opaque plate */
  opacity: number;
  /**
   * Gaussian standard deviation in output pixels applied to what is behind
   * the plate, or 0 for none. Same unit as {@link ImageOp.blur} and for the
   * same reason.
   */
  backdropBlur: number;
}

export type QrOp = RectOp | ImageOp | TextOp | ModulesOp | PlateOp;

/**
 * What the contrast guard decided, and why.
 *
 * Carried on the scene rather than worked out again in the studio, so the
 * sentence a control shows and the picture beside it can never disagree.
 * A guard that reports one thing while the renderer does another is worse
 * than no guard, because it is trusted.
 */
export interface QrGuard {
  /** Which plate the picture was actually drawn with, after any downgrade */
  mode: "solid" | "frosted" | "clear";
  /** What the spec asked for, which may be more than the measurement allowed */
  requested: "solid" | "frosted" | "clear";
  /** The worst contrast anywhere under the code. This is the number that decides. */
  contrast: number;
  /** The same reading taken as an average, kept so the two can be compared */
  average: number;
  floor: number;
  /** Whether the picture as drawn may be saved and downloaded */
  ok: boolean;
  /** Whether the reading came from pixels rather than from two hex values */
  measured: boolean;
  /** The veil a clear code had to be rescued with, 0 when it needed none */
  veil: number;
  /** The colour of the worst square under the code, for a control that has to explain itself */
  worst: string | null;
  /** Plain sentences. Empty when there is nothing to say. */
  reasons: string[];
}

export interface QrScene {
  width: number;
  height: number;
  /** What shows through anywhere nothing was drawn */
  background: string;
  ops: QrOp[];
  /**
   * What the finished picture claims about itself, carried alongside the
   * ops so the studio can show it and a test can assert on it without
   * re-deriving the layout.
   */
  meta: {
    /** The string encoded into the code */
    payload: string;
    /** Modules across the code, not counting the quiet zone */
    modules: number;
    /** One module in output pixels */
    modulePx: number;
    /** The plate's outer square in output pixels */
    plateSize: number;
    /** Where the plate sits, so a measurement knows which pixels to read */
    plateRect: { x: number; y: number; w: number; h: number };
    /** Quiet zone in output pixels */
    quietPx: number;
    /** Contrast between the modules and the field they sit on */
    contrast: number;
    /** Fraction of the code's area the mark cutout covers, 0 when off */
    cutArea: number;
    /** What the guard decided about that contrast */
    guard: QrGuard;
  };
}

/* ------------------------------------------------------------------ */
/*  SVG                                                                */
/* ------------------------------------------------------------------ */

const FONT_SANS =
  "'Geist Sans','Geist',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const FONT_MONO = "'Geist Mono','SFMono-Regular',Menlo,Consolas,monospace";

export function fontStack(family: "sans" | "mono"): string {
  return family === "mono" ? FONT_MONO : FONT_SANS;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Every dark module as one path, which keeps the file small and the edges hard. */
export function modulesPath(op: ModulesOp): string {
  const parts: string[] = [];
  const size = op.matrix.length;
  const cutFrom = op.cut > 0 ? Math.floor((size - op.cut) / 2) : -1;
  const cutTo = op.cut > 0 ? cutFrom + op.cut : -1;
  const originX = op.x + op.quiet * op.module;
  const originY = op.y + op.quiet * op.module;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!op.matrix[r][c]) continue;
      if (op.cut > 0 && r >= cutFrom && r < cutTo && c >= cutFrom && c < cutTo) continue;
      const x = originX + c * op.module;
      const y = originY + r * op.module;
      parts.push(`M${x} ${y}h${op.module}v${op.module}h-${op.module}z`);
    }
  }
  return parts.join("");
}

/**
 * Write the scene out as a standalone SVG document.
 *
 * `inline` maps an image source to a data URI. Anything present is embedded
 * so the file stands on its own, which is what a print shop needs; anything
 * missing is written as a plain reference and simply does not draw in a
 * standalone viewer.
 */
export function sceneToSvg(scene: QrScene, inline: Record<string, string> = {}): string {
  const defs: string[] = [];
  const body: string[] = [];
  let gradientId = 0;
  let blurId = 0;
  let clipId = 0;

  /**
   * A blur that matches what a canvas does.
   *
   * Two details are load bearing. A CSS `blur()` filter works in sRGB,
   * while a `<filter>` element defaults to linear light, so the same
   * standard deviation would come out visibly lighter in the vector file
   * unless it is told otherwise. And the filter region has to be wide
   * enough for the kernel: the default region clips at ten per cent, which
   * would cut the blur off at the edges of the very box that was oversized
   * to hide that edge in the first place.
   */
  const blurFilter = (deviation: number): string => {
    const id = `b${blurId++}`;
    defs.push(
      `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%" filterUnits="objectBoundingBox" color-interpolation-filters="sRGB">` +
        `<feGaussianBlur stdDeviation="${deviation}"/>` +
        `</filter>`
    );
    return id;
  };

  const roundedClip = (op: PlateOp): string => {
    const id = `c${clipId++}`;
    const radius = op.r ? ` rx="${op.r}" ry="${op.r}"` : "";
    defs.push(
      `<clipPath id="${id}"><rect x="${op.x}" y="${op.y}" width="${op.w}" height="${op.h}"${radius}/></clipPath>`
    );
    return id;
  };

  const fillFor = (fill: QrFill, x: number, y: number, w: number, h: number): string => {
    if (!isGradient(fill)) return fill;
    const id = `g${gradientId++}`;
    const line = gradientLine(fill, x, y, w, h);
    const stops = fill.stops
      .map(
        (stop) =>
          `<stop offset="${(stop.offset * 100).toFixed(2)}%" stop-color="${escapeXml(stop.color)}"/>`
      )
      .join("");
    defs.push(
      `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${line.x1.toFixed(2)}" y1="${line.y1.toFixed(
        2
      )}" x2="${line.x2.toFixed(2)}" y2="${line.y2.toFixed(2)}">${stops}</linearGradient>`
    );
    return `url(#${id})`;
  };

  /** The background, drawn large enough that a blur never finds its edge. */
  const backgroundRect = (bleed: number): string =>
    `<rect x="${-bleed}" y="${-bleed}" width="${scene.width + bleed * 2}" height="${
      scene.height + bleed * 2
    }" fill="${scene.background}"/>`;

  /**
   * One operation as markup.
   *
   * Split out from the loop because the frosted plate has to replay
   * everything under it into a blurred group, and a replay that used a
   * different code path from the first pass would be a second renderer
   * pretending to be the same one.
   */
  const emit = (op: QrOp, out: string[]) => {
    if (op.op === "rect") {
      const radius = op.r ? ` rx="${op.r}" ry="${op.r}"` : "";
      out.push(
        `<rect x="${op.x}" y="${op.y}" width="${op.w}" height="${op.h}"${radius} fill="${fillFor(
          op.fill,
          op.x,
          op.y,
          op.w,
          op.h
        )}"/>`
      );
      return;
    }

    if (op.op === "image") {
      const href = inline[op.src] || op.src;
      const filter = op.blur ? ` filter="url(#${blurFilter(op.blur)})"` : "";
      out.push(
        `<image x="${op.x}" y="${op.y}" width="${op.w}" height="${op.h}" href="${escapeXml(
          href
        )}" preserveAspectRatio="xMidYMid slice"${filter}/>`
      );
      return;
    }

    if (op.op === "text") {
      const anchor = op.align === "center" ? "middle" : "start";
      const tracking = op.tracking ? ` letter-spacing="${op.tracking}"` : "";
      const opacity = op.opacity !== undefined ? ` opacity="${op.opacity}"` : "";
      out.push(
        `<text x="${op.x}" y="${op.y}" fill="${op.color}" font-size="${op.size}" font-weight="${
          op.weight
        }" font-family="${escapeXml(fontStack(op.family))}" text-anchor="${anchor}"${tracking}${opacity}>${escapeXml(
          op.text
        )}</text>`
      );
      return;
    }

    if (op.op === "plate") {
      const index = scene.ops.indexOf(op);
      const radius = op.r ? ` rx="${op.r}" ry="${op.r}"` : "";

      /* Frosted glass in a vector file.
         There is no backdrop filter in SVG and there never has been: the
         one that was specified for it was withdrawn before anything
         shipped it. What there is instead is the draw list, which is
         ordered, so everything under the plate can simply be drawn a
         second time into a group that carries the blur and is clipped to
         the plate's own rounded rectangle. The result is the same pixels
         the canvas produces, by the longer road.

         Clipping after filtering is the rendering order the spec already
         defines, so the soft edge the kernel leaves is cut away rather
         than left showing outside the plate. */
      if (op.backdropBlur > 0 && index > 0) {
        const bleed = Math.ceil(op.backdropBlur * 3);
        const under: string[] = [backgroundRect(bleed)];
        for (let i = 0; i < index; i++) emit(scene.ops[i], under);
        out.push(
          `<g clip-path="url(#${roundedClip(op)})" filter="url(#${blurFilter(
            op.backdropBlur
          )})">${under.join("")}</g>`
        );
      }

      if (op.opacity > 0) {
        const alpha = op.opacity >= 1 ? "" : ` opacity="${op.opacity}"`;
        out.push(
          `<rect x="${op.x}" y="${op.y}" width="${op.w}" height="${op.h}"${radius} fill="${op.fill}"${alpha}/>`
        );
      }
      return;
    }

    // The light square first where there is one, then the dark modules on
    // top. A translucent plate sets it to null, because painting an opaque
    // square here would put back exactly what the plate removed.
    const total = (op.matrix.length + op.quiet * 2) * op.module;
    if (op.light) {
      out.push(
        `<rect x="${op.x}" y="${op.y}" width="${total}" height="${total}" fill="${op.light}"/>`
      );
    }
    out.push(`<path d="${modulesPath(op)}" fill="${op.dark}" shape-rendering="crispEdges"/>`);
  };

  for (const op of scene.ops) emit(op, body);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${scene.width}" height="${scene.height}"`,
    ` viewBox="0 0 ${scene.width} ${scene.height}">`,
    defs.length ? `<defs>${defs.join("")}</defs>` : "",
    `<rect width="${scene.width}" height="${scene.height}" fill="${scene.background}"/>`,
    body.join(""),
    `</svg>`,
  ].join("");
}
