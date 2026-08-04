/**
 * Getting a photograph ready for the library, in the browser, before it
 * goes anywhere near the bucket.
 *
 * Everything that touches an uploaded picture pays for its size twice. The
 * renderer fetches the whole file and base64s it into the card on every
 * keystroke in the studio, and the picker draws every image in the library
 * at once. A phone photograph is four thousand pixels wide and eight
 * megabytes, and a card is at most 1080 across: the other three thousand
 * pixels are paid for on every render and shown to nobody.
 *
 * So a file is decoded once here and three things come out of that single
 * decode: the scaled bytes, the pixel size, and the average colour that
 * shows if the file is ever unreadable. Doing it in the browser rather
 * than on the way out of the bucket means the saving is on the upload too,
 * which is the slow part on a hotel wifi.
 *
 * Client only: it wants `createImageBitmap` and a canvas.
 */

/**
 * The longest edge we keep.
 *
 * The biggest a picture is ever drawn is a story at the tightest crop:
 * 1920 tall times 1.75, so 3360. Keeping that in full would mean carrying
 * the worst case for every card, and at the tightest crop most of those
 * pixels are outside the frame anyway. 2560 covers every crop at every
 * size with room over, and is about a quarter of the bytes of a phone
 * original.
 */
const MAX_EDGE = 2560;

/**
 * Below this, a picture is left exactly as it arrived.
 *
 * Re-encoding a small file usually makes it larger, and always makes it
 * different: a flat gradient someone exported as a PNG comes back out of a
 * lossy encoder with banding on it. Under a megabyte and inside the size
 * cap, there is nothing to win.
 */
const LEAVE_ALONE_BYTES = 1024 * 1024;

/** JPEG at this quality is visually clean on photographs. */
const QUALITY = 0.86;

/**
 * What the card renderer can actually draw.
 *
 * This is the constraint the whole file answers to, and it is not the
 * browser's. Satori decodes PNG and JPEG; handed a WebP it does not fall
 * back to a plain card, it takes the render down with it, so the studio
 * preview returns nothing at all while the library grid beside it looks
 * perfect, because the grid is a browser `<img>` and browsers read WebP.
 *
 * Uploads used to be re-encoded to WebP whenever they were scaled, which
 * made every photograph over 2560 on its long edge unrenderable. A stock
 * photograph is always over 2560 on its long edge.
 */
const RENDERABLE = ["image/jpeg", "image/png"];

export interface PreparedImage {
  /** What to upload. The original file when nothing was worth changing. */
  blob: Blob;
  contentType: string;
  /** Matches the content type, for the storage path. */
  extension: string;
  /** The pixel size of what is being uploaded, after any scaling. */
  width: number;
  height: number;
  /** The average colour, as `#rrggbb`. What shows if the file goes missing. */
  colour: string;
  /** What the person chose, before any of this. */
  originalBytes: number;
  /** The size of the original, so the studio can say what a picture lost. */
  originalWidth: number;
  originalHeight: number;
  /** True when the bytes being uploaded are not the bytes that were chosen. */
  changed: boolean;
}

const FALLBACK_COLOUR = "#0A0A0A";

const EXTENSIONS: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
};

/**
 * Scale, re-encode and measure a chosen file.
 *
 * Throws only when the file cannot be read as an image at all, which is
 * the one case the caller has to tell somebody about. Everything else
 * degrades: a canvas that will not give up a blob means the original is
 * uploaded untouched, which is what used to happen to every file.
 */
export async function prepareImage(file: File): Promise<PreparedImage> {
  const bitmap = await decode(file);

  const originalWidth = bitmap.width;
  const originalHeight = bitmap.height;
  const longest = Math.max(originalWidth, originalHeight);
  const ratio = longest > MAX_EDGE ? MAX_EDGE / longest : 1;
  const width = Math.max(1, Math.round(originalWidth * ratio));
  const height = Math.max(1, Math.round(originalHeight * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    bitmap.close?.();
    return untouched(file, originalWidth, originalHeight, FALLBACK_COLOUR);
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const colour = averageColour(canvas);

  // A file the renderer cannot draw has to be re-encoded however small it
  // is, so the cheap exit is only open to the formats that already work.
  const drawable = RENDERABLE.includes(file.type);

  // Small, drawable and already inside the cap: nothing to win, and
  // re-encoding would only cost quality.
  if (drawable && ratio === 1 && file.size <= LEAVE_ALONE_BYTES) {
    return untouched(file, originalWidth, originalHeight, colour);
  }

  const type = "image/jpeg";
  const encoded = await toBlob(canvas, type, QUALITY);

  // An encoder that gives back something larger than it was handed has
  // done the opposite of its job, so the original goes up instead. This is
  // the ordinary outcome for flat graphics, where PNG beats JPEG. It only
  // applies to a file that was drawable to begin with: sending a WebP up
  // untouched because it happened to be smaller is how the card ends up
  // unable to draw it.
  if (!encoded || (drawable && ratio === 1 && encoded.size >= file.size)) {
    return untouched(file, originalWidth, originalHeight, colour);
  }

  return {
    blob: encoded,
    contentType: type,
    extension: EXTENSIONS[type] ?? "jpg",
    width,
    height,
    colour,
    originalBytes: file.size,
    originalWidth,
    originalHeight,
    changed: true,
  };
}

/**
 * Upload exactly what was chosen.
 *
 * Only reached for a format the renderer can draw, or when the canvas
 * refused to produce a blob at all. In that second case the type is left
 * as it was rather than relabelled: mislabelling WebP bytes as JPEG would
 * turn a picture that does not draw into a picture that does not draw and
 * lies about why.
 */
function untouched(file: File, width: number, height: number, colour: string): PreparedImage {
  const type = EXTENSIONS[file.type] ? file.type : "image/jpeg";
  return {
    blob: file,
    contentType: type,
    extension: EXTENSIONS[type] ?? "jpg",
    width,
    height,
    colour,
    originalBytes: file.size,
    originalWidth: width,
    originalHeight: height,
    changed: false,
  };
}

/**
 * `createImageBitmap` where it exists, an `<img>` where it does not.
 *
 * The bitmap path decodes off the main thread, which is the difference
 * between a responsive panel and a frozen one when six files land at once.
 */
async function decode(file: File): Promise<ImageBitmap & { close?: () => void }> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // Some encoders produce files Chrome's bitmap path refuses and the
      // `<img>` path accepts. Fall through rather than rejecting the file.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("That file could not be read as an image."));
      el.src = url;
    });
    // Shaped like an ImageBitmap for the one caller, which only needs the
    // size and something `drawImage` will take.
    return Object.assign(image, {
      width: image.naturalWidth,
      height: image.naturalHeight,
    }) as unknown as ImageBitmap;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * The average colour, taken by drawing the whole canvas into one pixel and
 * reading it back. It is what shows under a card while the file loads and,
 * more importantly, if the file cannot be read at all: without it a card
 * whose photograph had gone drew its scrim over nothing and came out a
 * light grey gradient, which is the one thing a dark brand cannot ship by
 * accident.
 */
function averageColour(source: HTMLCanvasElement): string {
  try {
    const one = document.createElement("canvas");
    one.width = 1;
    one.height = 1;
    const context = one.getContext("2d");
    if (!context) return FALLBACK_COLOUR;
    context.drawImage(source, 0, 0, 1, 1);
    const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
    return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
  } catch {
    return FALLBACK_COLOUR;
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** Bytes as somebody would say them, for the line under a tile. */
export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
