/**
 * Cinematic backdrops, for the cards that are a photograph and a sentence.
 *
 * Most of this system draws the product. This is the other register: no
 * panel, no eyebrow, no footer, a small mark and one line, over something
 * atmospheric. It is the register that survives a feed best, because there
 * is nothing on it to skip.
 *
 * Two kinds of backdrop:
 *
 *   - **Drawn** ones are stacks of linear gradients and need no asset at
 *     all, which is why they are the default. Satori renders a radial
 *     gradient with a visible hard edge, so every layer here is linear and
 *     the shapes come from stacking them at different angles.
 *   - **Photographic** ones name a file in `public/brand/backdrops/`. Drop
 *     an image in that folder, add an entry here, and it appears in the
 *     studio picker and in KIPP's options. Nothing else needs touching.
 *   - **Uploaded** ones are photographs put in through the studio. They
 *     live in the `social-backdrops` bucket rather than in the repository,
 *     because a picture somebody found this morning should not need a
 *     deploy. A card names one by storage path and carries its own crop.
 *
 * All three get the same treatment on top: a scrim so type stays legible
 * wherever it lands, and grain, which is what stops a gradient reading as
 * a software gradient.
 */

export type BackdropId = "none" | "dusk" | "storm" | "ember" | "haze" | "deep";

export interface Backdrop {
  id: BackdropId;
  label: string;
  /** What it feels like, shown in the picker */
  blurb: string;
  /**
   * Gradient layers, painted in order, first on top. Absent on a
   * photographic backdrop.
   */
  layers?: string[];
  /** A file in `public/brand/backdrops/`, for the photographic ones */
  image?: string;
  /**
   * Base colour under everything. Matters for a photograph too: it is what
   * shows while the image is loading and if the file has gone missing.
   */
  base: string;
  /**
   * Darkening laid over the backdrop and under the type. Weighted towards
   * wherever the copy sits, which for these cards is the top.
   */
  scrim: string;
  /** Swatch for the studio picker */
  swatch: string;
}

export const SOCIAL_BACKDROPS: Record<BackdropId, Backdrop> = {
  none: {
    id: "none",
    label: "None",
    blurb: "The palette's own background, flat and clean.",
    base: "",
    scrim: "",
    swatch: "#0A0A0A",
  },
  dusk: {
    id: "dusk",
    label: "Dusk",
    blurb: "Deep blue, light breaking low. The closest to the site's own colour.",
    base: "#0B1A26",
    layers: [
      "linear-gradient(12deg, rgba(226,232,214,0.50) 0%, rgba(148,175,178,0.20) 16%, rgba(11,26,38,0) 40%)",
      "linear-gradient(200deg, rgba(11,26,38,0.85) 0%, rgba(11,26,38,0.10) 55%, rgba(11,26,38,0) 100%)",
      "linear-gradient(340deg, rgba(196,214,206,0.28) 0%, rgba(11,26,38,0) 46%)",
    ],
    scrim: "linear-gradient(180deg, rgba(6,15,22,0.72) 0%, rgba(6,15,22,0.34) 42%, rgba(6,15,22,0.10) 100%)",
    swatch: "#0B1A26",
  },
  storm: {
    id: "storm",
    label: "Storm",
    blurb: "Weather coming in. Cold and heavy, for anything about a day going wrong.",
    base: "#0D1114",
    layers: [
      "linear-gradient(28deg, rgba(190,200,206,0.34) 0%, rgba(120,134,144,0.14) 22%, rgba(13,17,20,0) 46%)",
      "linear-gradient(190deg, rgba(13,17,20,0.90) 0%, rgba(13,17,20,0.20) 60%, rgba(13,17,20,0) 100%)",
      "linear-gradient(320deg, rgba(160,176,186,0.20) 0%, rgba(13,17,20,0) 40%)",
    ],
    scrim: "linear-gradient(180deg, rgba(8,10,12,0.74) 0%, rgba(8,10,12,0.38) 44%, rgba(8,10,12,0.12) 100%)",
    swatch: "#0D1114",
  },
  ember: {
    id: "ember",
    label: "Golden hour",
    blurb: "Last of the light. Warm, and the one that reads as the end of a shoot day.",
    base: "#140C0A",
    layers: [
      "linear-gradient(16deg, rgba(255,196,140,0.42) 0%, rgba(206,88,44,0.20) 20%, rgba(20,12,10,0) 44%)",
      "linear-gradient(198deg, rgba(20,12,10,0.88) 0%, rgba(20,12,10,0.16) 58%, rgba(20,12,10,0) 100%)",
      "linear-gradient(334deg, rgba(206,28,28,0.24) 0%, rgba(20,12,10,0) 42%)",
    ],
    scrim: "linear-gradient(180deg, rgba(12,7,6,0.74) 0%, rgba(12,7,6,0.36) 44%, rgba(12,7,6,0.10) 100%)",
    swatch: "#140C0A",
  },
  haze: {
    id: "haze",
    label: "Haze",
    blurb: "Soft and high key. The lightest of them, and the one that suits a quiet line.",
    base: "#1B2430",
    layers: [
      "linear-gradient(8deg, rgba(232,236,238,0.44) 0%, rgba(176,192,202,0.24) 26%, rgba(27,36,48,0) 52%)",
      "linear-gradient(186deg, rgba(27,36,48,0.72) 0%, rgba(27,36,48,0.10) 62%, rgba(27,36,48,0) 100%)",
    ],
    scrim: "linear-gradient(180deg, rgba(14,20,28,0.70) 0%, rgba(14,20,28,0.30) 48%, rgba(14,20,28,0.08) 100%)",
    swatch: "#1B2430",
  },
  deep: {
    id: "deep",
    label: "Deep",
    blurb: "Nearly black, one edge of light. For when the words are doing all the work.",
    base: "#07080A",
    layers: [
      "linear-gradient(24deg, rgba(142,202,255,0.26) 0%, rgba(59,130,246,0.08) 18%, rgba(7,8,10,0) 40%)",
      "linear-gradient(196deg, rgba(7,8,10,0.92) 0%, rgba(7,8,10,0.30) 62%, rgba(7,8,10,0) 100%)",
    ],
    scrim: "linear-gradient(180deg, rgba(4,5,7,0.66) 0%, rgba(4,5,7,0.28) 46%, rgba(4,5,7,0.06) 100%)",
    swatch: "#07080A",
  },
};

export const SOCIAL_BACKDROP_IDS = Object.keys(SOCIAL_BACKDROPS) as BackdropId[];

export const DEFAULT_BACKDROP: BackdropId = "none";

export function getBackdrop(id: string | null | undefined): Backdrop {
  return SOCIAL_BACKDROPS[(id as BackdropId) ?? DEFAULT_BACKDROP] ?? SOCIAL_BACKDROPS[DEFAULT_BACKDROP];
}

/**
 * Every backdrop here is dark, so type on one is always the cream ink and
 * the light tiers, whatever palette the card is otherwise set to. A card
 * with a cream palette and a dusk backdrop would otherwise put near-black
 * text on a near-black sky.
 *
 * The drawn app panels have to come with it. Only the text tiers were
 * overridden at first, which left the cream palette's white `appPanel`
 * under the white headline this override had just created: pick cream,
 * then pick a backdrop, and a product card drew a blank rectangle. The
 * panel tokens are part of the ink, so they move with it.
 *
 * ## The app window is opaque, and has to be
 *
 * These panel fills were once frosted glass: `appPanel` at 0.72, the shell
 * under it at 0.55. That reads as glass in a browser, where a
 * `backdrop-filter` blurs whatever is behind it. Satori has no
 * `backdrop-filter` and no `filter`, so what actually rendered was the
 * photograph at full sharpness, at nearly a third strength, straight
 * through the middle of the app. On a bright picture — and half the
 * library is bright — a call sheet came out with a river running through
 * its rows. There is no blur available to fix that, so the fill does the
 * job instead: near enough opaque that the screen is a screen, with the
 * last few per cent of translucency left in so it still picks up the
 * colour of the picture it is sitting on.
 *
 * The shadow is the other half. A rectangle on top of a photograph with
 * nothing under it reads as a hole cut in the photograph; the shadow is
 * what turns it into a window in front of one.
 */
export const BACKDROP_INK = {
  text: "#FFFFFF",
  secondary: "rgba(255,255,255,0.82)",
  muted: "rgba(255,255,255,0.62)",
  hairline: "rgba(255,255,255,0.20)",
  panel: "rgba(255,255,255,0.04)",
  panelBorder: "rgba(255,255,255,0.14)",
  appShell: "rgba(6,7,10,0.94)",
  appPanel: "rgba(11,13,17,0.97)",
  appTile: "rgba(255,255,255,0.07)",
  appShadow: "0 24px 60px rgba(0,0,0,0.55)",
  ink: "cream" as const,
};

// ---------------------------------------------------------------------
// Uploaded photographs
// ---------------------------------------------------------------------

/**
 * The bucket uploaded backdrops live in. Public read, so the renderer can
 * pull the file without a session, which matters because approving a card
 * renders it on a server action rather than in the caller's browser.
 */
export const BACKDROP_BUCKET = "social-backdrops";

/**
 * A card stores the storage path, not the address, so the same spec keeps
 * working if the project ever moves. The address is rebuilt here.
 */
export function backdropImageUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base || !storagePath) return "";
  return `${base.replace(/\/+$/, "")}/storage/v1/object/public/${BACKDROP_BUCKET}/${storagePath}`;
}

/**
 * A small version of a picture, for the library grid.
 *
 * Uploads are scaled to 2560 on the long edge, which is right for a card
 * and absurd for a tile 180 across: the grid was pulling a megabyte per
 * square to draw a thumbnail, so fifteen images was fifteen megabytes and
 * a hundred would be a hundred. The storage layer will resize on request
 * and cache the result, and the same picture comes back at 25 kilobytes.
 *
 * Cover rather than contain for a square tile, because the grid is a wall
 * of squares and a letterboxed one in the middle of it reads as broken.
 * The detail view asks for `contain` and a real width instead: there the
 * shape of the picture is a thing you are looking at.
 *
 * Never used for the card itself. The renderer takes the full file, since
 * a story at the tightest crop is 3360 across.
 */
export function backdropThumbUrl(
  storagePath: string,
  { width, height, resize = "cover", quality = 70 }: {
    width: number;
    height?: number;
    resize?: "cover" | "contain";
    quality?: number;
  }
): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base || !storagePath) return "";
  const params = new URLSearchParams({ width: String(width), resize, quality: String(quality) });
  if (height) params.set("height", String(height));
  return (
    `${base.replace(/\/+$/, "")}/storage/v1/render/image/public/${BACKDROP_BUCKET}/${storagePath}` +
    `?${params.toString()}`
  );
}

/**
 * How close the crop is.
 *
 * A photograph is always drawn to cover the card, so the widest step is
 * the whole picture with its long edge trimmed. The rest push in, which is
 * how a face, a horizon or a corner of sky becomes the composition. Named
 * the way a shot list names them, because that is what this is.
 */
export const BACKDROP_CROPS: { value: number; label: string }[] = [
  { value: 1, label: "Wide" },
  { value: 1.2, label: "Mid" },
  { value: 1.45, label: "Close" },
  { value: 1.75, label: "Tight" },
];

/** Which part of the picture survives the crop. A 3x3, so it is a place rather than a number. */
export type BackdropFocus =
  | "top-left"
  | "top"
  | "top-right"
  | "left"
  | "center"
  | "right"
  | "bottom-left"
  | "bottom"
  | "bottom-right";

export const BACKDROP_FOCUS: Record<BackdropFocus, { x: number; y: number; label: string }> = {
  "top-left": { x: 0, y: 0, label: "Top left" },
  top: { x: 0.5, y: 0, label: "Top" },
  "top-right": { x: 1, y: 0, label: "Top right" },
  left: { x: 0, y: 0.5, label: "Left" },
  center: { x: 0.5, y: 0.5, label: "Middle" },
  right: { x: 1, y: 0.5, label: "Right" },
  "bottom-left": { x: 0, y: 1, label: "Bottom left" },
  bottom: { x: 0.5, y: 1, label: "Bottom" },
  "bottom-right": { x: 1, y: 1, label: "Bottom right" },
};

/** In reading order, so the studio can lay them out as the grid they are. */
export const BACKDROP_FOCUS_IDS = Object.keys(BACKDROP_FOCUS) as BackdropFocus[];

export const DEFAULT_FOCUS: BackdropFocus = "center";

/**
 * How much darkening sits between the photograph and the words.
 *
 * A photograph nobody has scrimmed is a photograph you cannot read a
 * headline off. Heavy is for a busy picture, none is for one that is
 * already nearly black where the type lands.
 */
export const BACKDROP_DIMS: { value: number; label: string }[] = [
  { value: 0, label: "None" },
  { value: 0.38, label: "Light" },
  { value: 0.58, label: "Medium" },
  { value: 0.78, label: "Heavy" },
];

export const DEFAULT_DIM = 0.58;

/** What sits under a photograph that has not loaded, or has gone. */
export const DEFAULT_BACKDROP_BASE = "#0A0A0A";

/**
 * The scrim over an uploaded photograph, weighted towards wherever the
 * words are. Built here rather than stored, because it depends on the
 * placement, and a fixed top-weighted scrim on a card whose only line is
 * at the bottom darkens the half of the picture nobody is reading over.
 */
export function photoScrim(strength: number, from: "top" | "center" | "bottom"): string {
  if (strength <= 0) return "";
  const a = (n: number) => `rgba(0,0,0,${Math.min(0.95, Math.max(0, n)).toFixed(3)})`;

  if (from === "center") {
    // Flat, with the ends brought up a little so the mark and the footer
    // have something to sit on too.
    return `linear-gradient(180deg, ${a(strength * 0.92)} 0%, ${a(strength * 0.7)} 42%, ${a(strength * 0.92)} 100%)`;
  }

  const angle = from === "top" ? 180 : 0;
  return `linear-gradient(${angle}deg, ${a(strength)} 0%, ${a(strength * 0.72)} 26%, ${a(strength * 0.28)} 62%, ${a(strength * 0.12)} 100%)`;
}

/**
 * Where a photograph is drawn, given the crop and the focus.
 *
 * Satori has no `object-position`, so the picture is laid out at its
 * covered size and pushed with absolute offsets instead. At the widest
 * crop this comes out at exactly the card's own size and zero offset,
 * which is the behaviour the built-in photographic backdrops already had.
 */
export function photoBox(
  width: number,
  height: number,
  crop: number,
  focus: BackdropFocus
): { width: number; height: number; left: number; top: number } {
  const point = BACKDROP_FOCUS[focus] ?? BACKDROP_FOCUS.center;
  const w = Math.round(width * crop);
  const h = Math.round(height * crop);
  return {
    width: w,
    height: h,
    left: -Math.round((w - width) * point.x),
    top: -Math.round((h - height) * point.y),
  };
}
