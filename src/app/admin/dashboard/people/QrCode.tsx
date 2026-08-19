"use client";

import React, { useMemo } from "react";
import { encodeQR, qrPath } from "@/lib/qrcode";

/**
 * A printed code, drawn from the matrix rather than fetched as an image.
 *
 * Two rules decide everything about how this looks, and neither of them is
 * negotiable for the sake of the dark theme around it. The square is black
 * on white, because a phone camera reading across a conference hall under
 * mixed lighting has no patience for a low contrast code. And there is a
 * quiet zone of four modules on every side, which the specification requires
 * and which scanners genuinely use to find the code's edges. An inverted or
 * tightly cropped code looks better in a screenshot and fails on a badge.
 */

/** Modules of white margin. Four is the specified minimum, not a preference. */
export const QUIET_ZONE = 4;

interface QrCodeProps {
  /** The URL to encode. */
  value: string;
  /** Rendered width and height in CSS pixels. */
  size?: number;
  className?: string;
  /** Rounded corners on the white plate. Purely cosmetic, never inside the code. */
  rounded?: boolean;
}

export default function QrCode({ value, size = 160, className = "", rounded = true }: QrCodeProps) {
  const matrix = useMemo(() => {
    try {
      return encodeQR(value);
    } catch {
      return null;
    }
  }, [value]);

  if (!matrix) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`flex items-center justify-center rounded-lg bg-white/[0.03] border border-white/8 text-[10px] text-zinc-500 text-center px-2 ${className}`}
      >
        That address is too long to encode
      </div>
    );
  }

  const modules = matrix.length;
  const total = modules + QUIET_ZONE * 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${total} ${total}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label="QR code for this card"
      className={`${rounded ? "rounded-lg" : ""} ${className}`}
    >
      <rect width={total} height={total} fill="#FFFFFF" />
      <g transform={`translate(${QUIET_ZONE} ${QUIET_ZONE})`}>
        <path d={qrPath(matrix)} fill="#000000" />
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Files                                                              */
/* ------------------------------------------------------------------ */

/** The same square as a standalone SVG document, ready to be written to disk. */
export function qrSvgDocument(value: string, pixels = 1024): string | null {
  let matrix: boolean[][];
  try {
    matrix = encodeQR(value);
  } catch {
    return null;
  }
  const modules = matrix.length;
  const total = modules + QUIET_ZONE * 2;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${pixels}" height="${pixels}"`,
    ` viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges">`,
    `<rect width="${total}" height="${total}" fill="#FFFFFF"/>`,
    `<g transform="translate(${QUIET_ZONE} ${QUIET_ZONE})">`,
    `<path d="${qrPath(matrix)}" fill="#000000"/>`,
    `</g></svg>`,
  ].join("");
}

/**
 * The same square as a PNG.
 *
 * Drawn module by module onto a canvas rather than by loading the SVG into
 * an image, which keeps every edge on a whole pixel. Rasterising a scaled
 * SVG gives grey half pixels along every module boundary, and that softness
 * is exactly what makes a small printed code marginal to read.
 */
export function qrPngBlob(value: string, targetPixels = 1024): Promise<Blob | null> {
  let matrix: boolean[][];
  try {
    matrix = encodeQR(value);
  } catch {
    return Promise.resolve(null);
  }

  const modules = matrix.length;
  const total = modules + QUIET_ZONE * 2;
  const scale = Math.max(4, Math.floor(targetPixels / total));
  const side = total * scale;

  const canvas = document.createElement("canvas");
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, side, side);
  ctx.fillStyle = "#000000";
  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      if (!matrix[r][c]) continue;
      ctx.fillRect((c + QUIET_ZONE) * scale, (r + QUIET_ZONE) * scale, scale, scale);
    }
  }

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/png"));
}
