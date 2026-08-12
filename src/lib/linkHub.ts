/**
 * Link hub: the single shareable page of links that goes in a social bio.
 *
 * Blocks and page appearance are managed from the admin panel, so this
 * file holds the shapes, the icon vocabulary, the theme presets and the
 * small amount of colour maths shared between the public page, the admin
 * editor and the live preview.
 */

/**
 * Block types.
 *
 * The last four arrived with the abram-network Link Hub options wave
 * (supabase/migrations/20270824000100_link_hub_options.sql over there) and are
 * rendered by /l/<slug> in this repo. This repo's OWN link hub — the one the
 * admin panel edits — only ever writes the first three, and nothing here
 * requires it to learn the rest: a union that is wider than one writer needs
 * costs nothing, and keeping ONE vocabulary is what lets the two renderers stay
 * identical.
 */
export type LinkBlockType =
  | "link"
  | "header"
  | "social"
  | "email"
  | "phone"
  | "embed_video"
  | "collection";
export type LinkBlockLayout = "classic" | "featured";
export type LinkHighlight = "none" | "pulse" | "shine" | "bounce";

export interface LinkHubLink {
  id: string;
  label: string;
  url: string;
  description: string | null;
  icon: string;
  thumbnail_url: string | null;
  block_type: LinkBlockType;
  layout: LinkBlockLayout;
  /** The collection this block sits in, or null. One level deep only. */
  parent_id: string | null;
  highlight: LinkHighlight;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  clicks: number;
  last_clicked_at: string | null;
  starts_at: string | null;
  ends_at: string | null;
}

/** One entry in the icon strip under the bio. */
export interface SocialLink {
  platform: string;
  url: string;
}

export type BackgroundStyle = "solid" | "gradient" | "glow" | "image";
export type ButtonStyle = "glass" | "fill" | "outline" | "soft" | "hard";
export type ButtonShadow = "none" | "soft" | "hard";
export type ButtonRadius = "sharp" | "rounded" | "pill";
export type ButtonSize = "compact" | "regular" | "large";
export type LinkDisplay = "list" | "grid";
/**
 * The page's typeface.
 *
 * The first three are faces this site already serves; the rest are Google
 * fonts, fetched only by a page that asks for one. MIRRORS abram-network's
 * `src/lib/apps/linkHub.ts` FONT_OPTIONS and the CHECK on
 * `link_pages.font_family` (their migration 20270825000100). A key only one
 * renderer knows renders one way in that app's editor and another way here,
 * to the visitor — the three move together.
 */
export type LinkFont =
  | "sans"
  | "display"
  | "mono"
  | "inter"
  | "space_grotesk"
  | "outfit"
  | "sora"
  | "dm_serif"
  | "playfair"
  | "fraunces"
  | "bebas";
export type AvatarShape = "circle" | "rounded" | "square";
export type AvatarKind = "none" | "image" | "abram";

export interface LinkHubSettings {
  heading: string;
  subheading: string;
  footer_note: string | null;
  avatar_url: string | null;
  avatar_shape: AvatarShape;
  avatar_kind: AvatarKind;
  theme: string;
  background_style: BackgroundStyle;
  background_color: string;
  background_color_alt: string;
  background_image_url: string | null;
  background_blur: number;
  background_overlay: number;
  button_style: ButtonStyle;
  button_shadow: ButtonShadow;
  button_radius: ButtonRadius;
  button_size: ButtonSize;
  button_color: string;
  button_text_color: string;
  link_display: LinkDisplay;
  accent_color: string;
  text_color: string;
  font_family: LinkFont;
  socials: SocialLink[];
  show_icons: boolean;
  share_enabled: boolean;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  /** Which curated swatch is lit in the editor. Presentation only. */
  background_preset: string;
  /**
   * Whether the public page draws the "Powered by ABRAM" credit.
   *
   * Computed by `public_link_pages` in the abram-network project — the wish
   * AND the plan, resolved per read — so this repo never sees a tier and never
   * decides. Defaults to TRUE: a row that predates the column, or a view that
   * failed to return it, shows the credit. The paid state is the one that has
   * to be earned.
   */
  show_branding: boolean;
  views: number;
}

export const DEFAULT_SETTINGS: LinkHubSettings = {
  heading: "ABRAM",
  subheading: "The creative operations platform for production teams.",
  footer_note: null,
  avatar_url: null,
  avatar_shape: "rounded",
  avatar_kind: "abram",
  theme: "midnight",
  background_style: "glow",
  background_color: "#0A0A0A",
  background_color_alt: "#111C33",
  background_image_url: null,
  background_blur: 0,
  background_overlay: 55,
  button_style: "glass",
  button_shadow: "none",
  button_radius: "rounded",
  button_size: "regular",
  button_color: "#141414",
  button_text_color: "#FFFFFF",
  link_display: "list",
  accent_color: "#8ECAFF",
  text_color: "#FFFFFF",
  font_family: "sans",
  socials: [],
  show_icons: true,
  share_enabled: true,
  seo_title: null,
  seo_description: null,
  og_image_url: null,
  background_preset: "none",
  show_branding: true,
  views: 0,
};

/**
 * Icon keys offered in the admin picker. `abram` renders the brand mark;
 * every other key maps to a lucide icon in LinkHubIcon.
 */
export const LINK_ICON_KEYS = [
  "link",
  "abram",
  "rocket",
  "clapperboard",
  "building",
  "scissors",
  "boxes",
  "tag",
  "book",
  "instagram",
  "youtube",
  "linkedin",
  "x",
  "tiktok",
  "facebook",
  "threads",
  "github",
  "discord",
  "spotify",
  "podcast",
  "mail",
  "phone",
  "calendar",
  "map",
  "play",
  "star",
  "heart",
  "download",
  "message",
  "shopping",
  "credit",
  "file",
  "globe",
] as const;

export type LinkIconKey = (typeof LINK_ICON_KEYS)[number];

/** Icon keys that read as a social account, offered first for social blocks. */
export const SOCIAL_ICON_KEYS: readonly string[] = [
  "instagram",
  "x",
  "tiktok",
  "youtube",
  "linkedin",
  "facebook",
  "threads",
  "github",
  "discord",
  "spotify",
  "podcast",
  "mail",
  "phone",
  "globe",
];

/* ------------------------------------------------------------------ */
/*  Row normalisation                                                  */
/* ------------------------------------------------------------------ */

const BLOCK_TYPES: LinkBlockType[] = [
  "link",
  "header",
  "social",
  "email",
  "phone",
  "embed_video",
  "collection",
];
const BLOCK_LAYOUTS: LinkBlockLayout[] = ["classic", "featured"];
const HIGHLIGHTS: LinkHighlight[] = ["none", "pulse", "shine", "bounce"];

/**
 * Fills in anything a stored row is missing.
 *
 * A remote database can lag behind the migrations, so every reader goes
 * through here and a row without the newer columns simply behaves like a
 * plain link rather than crashing the page.
 */
export function normalizeLink(row: Partial<LinkHubLink> & { id: string }): LinkHubLink {
  const blockType = BLOCK_TYPES.includes(row.block_type as LinkBlockType)
    ? (row.block_type as LinkBlockType)
    : "link";
  const highlight = HIGHLIGHTS.includes(row.highlight as LinkHighlight)
    ? (row.highlight as LinkHighlight)
    : "none";

  return {
    id: row.id,
    label: row.label ?? "",
    url: row.url ?? "",
    description: row.description ?? null,
    icon: row.icon ?? "link",
    thumbnail_url: row.thumbnail_url ?? null,
    block_type: blockType,
    layout: BLOCK_LAYOUTS.includes(row.layout as LinkBlockLayout)
      ? (row.layout as LinkBlockLayout)
      : "classic",
    parent_id: row.parent_id ?? null,
    highlight,
    is_active: row.is_active ?? true,
    is_featured: row.is_featured ?? false,
    sort_order: row.sort_order ?? 0,
    clicks: row.clicks ?? 0,
    last_clicked_at: row.last_clicked_at ?? null,
    starts_at: row.starts_at ?? null,
    ends_at: row.ends_at ?? null,
  };
}

/** Same idea for the single settings row. */
export function normalizeSettings(row: Partial<LinkHubSettings> | null): LinkHubSettings {
  if (!row) return DEFAULT_SETTINGS;
  const merged = { ...DEFAULT_SETTINGS, ...row };

  // A null in a column the migration has not backfilled would otherwise
  // reach a style attribute or a class lookup.
  return {
    ...merged,
    heading: merged.heading || DEFAULT_SETTINGS.heading,
    subheading: merged.subheading ?? "",
    avatar_shape: merged.avatar_shape || DEFAULT_SETTINGS.avatar_shape,
    // A page saved before uploads existed has no avatar_kind, so it is
    // inferred from whether an address was ever stored.
    avatar_kind: merged.avatar_kind || (merged.avatar_url ? "image" : "none"),
    theme: merged.theme || DEFAULT_SETTINGS.theme,
    background_style: merged.background_style || DEFAULT_SETTINGS.background_style,
    background_color: merged.background_color || DEFAULT_SETTINGS.background_color,
    background_color_alt: merged.background_color_alt || DEFAULT_SETTINGS.background_color_alt,
    background_blur: merged.background_blur ?? 0,
    background_overlay: merged.background_overlay ?? 55,
    button_style: merged.button_style || DEFAULT_SETTINGS.button_style,
    button_shadow: merged.button_shadow || DEFAULT_SETTINGS.button_shadow,
    button_radius: merged.button_radius || DEFAULT_SETTINGS.button_radius,
    button_size: merged.button_size || DEFAULT_SETTINGS.button_size,
    button_color: merged.button_color || DEFAULT_SETTINGS.button_color,
    button_text_color: merged.button_text_color || DEFAULT_SETTINGS.button_text_color,
    link_display: merged.link_display || DEFAULT_SETTINGS.link_display,
    accent_color: merged.accent_color || DEFAULT_SETTINGS.accent_color,
    text_color: merged.text_color || DEFAULT_SETTINGS.text_color,
    font_family: merged.font_family || DEFAULT_SETTINGS.font_family,
    // jsonb arrives as whatever was stored, and every entry ends up in an
    // href — so it is re-validated here rather than trusted.
    socials: normalizeSocials((row as { socials?: unknown }).socials),
    background_preset: merged.background_preset || "none",
    show_icons: merged.show_icons ?? true,
    share_enabled: merged.share_enabled ?? true,
    // Absent means shown. Only an explicit false takes the credit away.
    show_branding: merged.show_branding !== false,
    views: merged.views ?? 0,
  };
}

/** Whatever came out of the jsonb column, turned into something renderable. */
export function normalizeSocials(raw: unknown): SocialLink[] {
  if (!Array.isArray(raw)) return [];
  const out: SocialLink[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const platform = String((entry as Record<string, unknown>).platform ?? "").trim();
    const value = String((entry as Record<string, unknown>).url ?? "");
    const url =
      platform === "mail"
        ? contactHref("email", value)
        : platform === "phone"
          ? contactHref("phone", value)
          : normalizeLinkUrl(value);
    if (!platform || !url) continue;
    out.push({ platform, url });
    if (out.length >= 12) break;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/*  URLs                                                               */
/* ------------------------------------------------------------------ */

/** Normalize whatever a user typed into a URL we are willing to link to. */
export function normalizeLinkUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Allow site-relative links so the hub can point at our own pages.
  if (trimmed.startsWith("/")) return trimmed;

  // Contact links are useful on a bio page and are safe to pass through.
  if (/^(mailto|tel):/i.test(trimmed)) return trimmed;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return `mailto:${trimmed}`;

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withScheme);
    // Only ever emit http(s), never javascript: or data: URLs.
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Image sources we are willing to render, so a stored value cannot inject script. */
export function normalizeImageUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/")) return trimmed;
  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * What an `email` or `phone` block actually links to.
 *
 * Mirrors contactHref in abram-network's src/lib/apps/linkHub.ts. Both
 * renderers have to agree on what a stored value means, so the rule lives in
 * both repos in the same shape rather than in one and approximated in the
 * other.
 */
export function contactHref(blockType: LinkBlockType, raw: string): string | null {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;

  if (blockType === "email") {
    if (/^mailto:/i.test(trimmed)) return trimmed;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
    return `mailto:${trimmed}`;
  }

  if (blockType === "phone") {
    if (/^(tel|sms):/i.test(trimmed)) return trimmed;
    const digits = trimmed.replace(/(?!^\+)[^\d]/g, "");
    return digits.replace(/^\+?/, "").length >= 4 ? `tel:${digits}` : null;
  }

  return normalizeLinkUrl(trimmed);
}

/* ------------------------------------------------------------------ */
/*  Video embeds                                                       */
/* ------------------------------------------------------------------ */

export interface VideoEmbed {
  provider: "youtube" | "vimeo";
  id: string;
  watchUrl: string;
  thumbnailUrl: string | null;
}

/**
 * NO IFRAMES ON THE PUBLIC PAGE.
 *
 * An `embed_video` block renders as the provider's own still, a play glyph and
 * a link out — never a player. A YouTube or Vimeo embed is a third-party
 * document with its own scripts, cookies and consent obligations, dropped onto
 * a page a stranger opened from someone's bio, and it costs several hundred
 * kilobytes before anyone has decided to watch. This gets the visitor the same
 * video and loads nothing from a third party until they ask.
 *
 * Vimeo has no unauthenticated thumbnail endpoint, so a Vimeo block falls back
 * to the owner's uploaded cover rather than a guessed URL that 404s.
 *
 * Kept identical to parseVideoEmbed in abram-network.
 */
export function parseVideoEmbed(raw: string): VideoEmbed | null {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const host = url.hostname.replace(/^www\./, "").toLowerCase();

  if (host === "youtu.be") return youtubeEmbed(url.pathname.slice(1).split("/")[0]);

  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") return youtubeEmbed(url.searchParams.get("v") ?? "");
    const match = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
    return match ? youtubeEmbed(match[1]) : null;
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const match = url.pathname.match(/(\d{6,})/);
    if (!match) return null;
    return {
      provider: "vimeo",
      id: match[1],
      watchUrl: `https://vimeo.com/${match[1]}`,
      thumbnailUrl: null,
    };
  }

  return null;
}

function youtubeEmbed(rawId: string): VideoEmbed | null {
  const id = rawId.trim();
  // The id is interpolated into a URL, so it is checked against YouTube's own
  // alphabet rather than used as typed.
  if (!/^[A-Za-z0-9_-]{6,20}$/.test(id)) return null;
  return {
    provider: "youtube",
    id,
    watchUrl: `https://www.youtube.com/watch?v=${id}`,
    thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  };
}

/**
 * Where a block actually points, whatever its type. One function so the two
 * renderers can never disagree about a destination. Null means there is
 * nothing safe to link to, and the block is drawn inert.
 */
export function blockHref(block: Pick<LinkHubLink, "block_type" | "url">): string | null {
  if (block.block_type === "embed_video") {
    return parseVideoEmbed(block.url)?.watchUrl ?? normalizeLinkUrl(block.url);
  }
  if (block.block_type === "email" || block.block_type === "phone") {
    return contactHref(block.block_type, block.url);
  }
  return normalizeLinkUrl(block.url);
}

/** Host shown as a hint under a link, e.g. "instagram.com". */
export function linkHost(url: string): string | null {
  if (url.startsWith("/")) return "abram.network";
  if (/^mailto:/i.test(url)) return "email";
  if (/^tel:/i.test(url)) return "phone";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** Absolute form of a stored URL, for structured data and the QR code. */
export function absoluteLinkUrl(url: string, origin = "https://abram.network"): string {
  return url.startsWith("/") ? `${origin}${url}` : url;
}

/* ------------------------------------------------------------------ */
/*  Scheduling                                                         */
/* ------------------------------------------------------------------ */

/**
 * A block is live when it is active and inside its scheduled window.
 * Both ends are optional: no start means "already live", no end means
 * "runs until switched off".
 */
export function isLinkLive(link: LinkHubLink, now: Date = new Date()): boolean {
  if (!link.is_active) return false;
  if (link.starts_at && new Date(link.starts_at).getTime() > now.getTime()) return false;
  if (link.ends_at && new Date(link.ends_at).getTime() <= now.getTime()) return false;
  return true;
}

export type ScheduleState = "live" | "scheduled" | "expired" | "hidden";

export function scheduleState(link: LinkHubLink, now: Date = new Date()): ScheduleState {
  if (!link.is_active) return "hidden";
  if (link.starts_at && new Date(link.starts_at).getTime() > now.getTime()) return "scheduled";
  if (link.ends_at && new Date(link.ends_at).getTime() <= now.getTime()) return "expired";
  return "live";
}

/* ------------------------------------------------------------------ */
/*  Colour helpers                                                     */
/* ------------------------------------------------------------------ */

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean.padEnd(6, "0").slice(0, 6);
  const value = parseInt(full, 16);
  if (Number.isNaN(value)) return [0, 0, 0];
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Perceived brightness, used to pick readable foregrounds. */
export function isLightColor(hex: string): boolean {
  const [r, g, b] = hexToRgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000 > 140;
}

export function readableOn(hex: string): string {
  return isLightColor(hex) ? "#0A0A0A" : "#FFFFFF";
}

/** Mix a colour towards white or black, for hover and muted tones. */
export function shade(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const target = amount > 0 ? 255 : 0;
  const t = Math.abs(amount);
  const mix = (c: number) => Math.round(c + (target - c) * t);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

const HEX_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Guard stored values before they reach a style attribute. */
export function safeHex(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  return HEX_PATTERN.test(trimmed) ? trimmed : fallback;
}

/* ------------------------------------------------------------------ */
/*  Themes                                                             */
/* ------------------------------------------------------------------ */

export interface ThemePreset {
  key: string;
  name: string;
  values: Pick<
    LinkHubSettings,
    | "background_style"
    | "background_color"
    | "background_color_alt"
    | "button_style"
    | "button_radius"
    | "button_color"
    | "button_text_color"
    | "accent_color"
    | "text_color"
    | "font_family"
  >;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    key: "midnight",
    name: "Midnight",
    values: {
      background_style: "glow",
      background_color: "#0A0A0A",
      background_color_alt: "#111C33",
      button_style: "glass",
      button_radius: "rounded",
      button_color: "#141414",
      button_text_color: "#FFFFFF",
      accent_color: "#8ECAFF",
      text_color: "#FFFFFF",
      font_family: "sans",
    },
  },
  {
    key: "carbon",
    name: "Carbon",
    values: {
      background_style: "solid",
      background_color: "#000000",
      background_color_alt: "#000000",
      button_style: "outline",
      button_radius: "pill",
      button_color: "#000000",
      button_text_color: "#FFFFFF",
      accent_color: "#FFFFFF",
      text_color: "#FFFFFF",
      font_family: "sans",
    },
  },
  {
    key: "paper",
    name: "Paper",
    values: {
      background_style: "solid",
      background_color: "#F5F4F0",
      background_color_alt: "#E8E6DF",
      button_style: "hard",
      button_radius: "sharp",
      button_color: "#FFFFFF",
      button_text_color: "#0A0A0A",
      accent_color: "#0A0A0A",
      text_color: "#0A0A0A",
      font_family: "sans",
    },
  },
  {
    key: "studio",
    name: "Studio",
    values: {
      background_style: "gradient",
      background_color: "#101014",
      background_color_alt: "#2A2038",
      button_style: "soft",
      button_radius: "pill",
      button_color: "#1C1A22",
      button_text_color: "#FFFFFF",
      accent_color: "#C4A6FF",
      text_color: "#FFFFFF",
      font_family: "display",
    },
  },
  {
    key: "daylight",
    name: "Daylight",
    values: {
      background_style: "gradient",
      background_color: "#FFFFFF",
      background_color_alt: "#DCEBFF",
      button_style: "fill",
      button_radius: "pill",
      button_color: "#0A0A0A",
      button_text_color: "#FFFFFF",
      accent_color: "#2563EB",
      text_color: "#0A0A0A",
      font_family: "sans",
    },
  },
  {
    key: "ember",
    name: "Ember",
    values: {
      background_style: "gradient",
      background_color: "#140A08",
      background_color_alt: "#4A1D12",
      button_style: "glass",
      button_radius: "rounded",
      button_color: "#1F110C",
      button_text_color: "#FFFFFF",
      accent_color: "#FF9E64",
      text_color: "#FFFFFF",
      font_family: "sans",
    },
  },
  {
    key: "reel",
    name: "Reel",
    values: {
      background_style: "glow",
      background_color: "#07110D",
      background_color_alt: "#0E3A2A",
      button_style: "outline",
      button_radius: "sharp",
      button_color: "#07110D",
      button_text_color: "#EAFFF5",
      accent_color: "#4ADE80",
      text_color: "#EAFFF5",
      font_family: "mono",
    },
  },
  {
    key: "signal",
    name: "Signal",
    values: {
      background_style: "solid",
      background_color: "#0A0A0A",
      background_color_alt: "#0A0A0A",
      button_style: "fill",
      button_radius: "pill",
      button_color: "#FFFFFF",
      button_text_color: "#0A0A0A",
      accent_color: "#FFFFFF",
      text_color: "#FFFFFF",
      font_family: "display",
    },
  },
];

export const BUTTON_STYLE_OPTIONS: { key: ButtonStyle; name: string }[] = [
  { key: "glass", name: "Glass" },
  { key: "fill", name: "Fill" },
  { key: "outline", name: "Outline" },
  { key: "soft", name: "Soft shadow" },
  { key: "hard", name: "Hard shadow" },
];

export const BUTTON_RADIUS_OPTIONS: { key: ButtonRadius; name: string; radius: string }[] = [
  { key: "sharp", name: "Sharp", radius: "4px" },
  { key: "rounded", name: "Rounded", radius: "16px" },
  { key: "pill", name: "Pill", radius: "999px" },
];

/** Button proportions. Every value feeds a custom property on .lh-btn. */
export const BUTTON_SIZE_OPTIONS: {
  key: ButtonSize;
  name: string;
  height: string;
  padY: string;
  padX: string;
  font: string;
  gap: string;
  icon: number;
  stack: string;
}[] = [
  {
    key: "compact",
    name: "Compact",
    height: "48px",
    padY: "0.625rem",
    padX: "0.875rem",
    font: "0.8125rem",
    gap: "0.625rem",
    icon: 16,
    stack: "0.5rem",
  },
  {
    key: "regular",
    name: "Regular",
    height: "60px",
    padY: "0.875rem",
    padX: "1.125rem",
    font: "0.875rem",
    gap: "0.875rem",
    icon: 18,
    stack: "0.75rem",
  },
  {
    key: "large",
    name: "Large",
    height: "76px",
    padY: "1.25rem",
    padX: "1.375rem",
    font: "1rem",
    gap: "1rem",
    icon: 22,
    stack: "1rem",
  },
];

export const AVATAR_KIND_OPTIONS: { key: AvatarKind; name: string }[] = [
  { key: "none", name: "None" },
  { key: "abram", name: "ABRAM mark" },
  { key: "image", name: "Upload" },
];

/**
 * The typefaces a page can be set in.
 *
 * `stack` is what actually renders — it lands on `--lh-font` and everything
 * inside `.lh-page` inherits it. A Tailwind class was the wrong carrier:
 * globals.css styles headings directly, and a direct rule beats an inherited
 * family, so the page heading ignored the choice. `google` is null for the
 * faces this site already serves.
 */
export const FONT_OPTIONS: {
  key: LinkFont;
  name: string;
  stack: string;
  google: { family: string; weights: string } | null;
}[] = [
  { key: "sans",          name: "Geist Sans",    stack: "var(--font-sans)",                              google: null },
  { key: "display",       name: "Archivo",       stack: "var(--font-display)",                           google: null },
  { key: "mono",          name: "Geist Mono",    stack: "var(--font-mono, ui-monospace, monospace)",     google: null },
  { key: "inter",         name: "Inter",         stack: '"Inter", ui-sans-serif, system-ui, sans-serif',  google: { family: "Inter", weights: "400;500;600;700" } },
  { key: "space_grotesk", name: "Space Grotesk", stack: '"Space Grotesk", ui-sans-serif, sans-serif',     google: { family: "Space+Grotesk", weights: "400;500;600;700" } },
  { key: "outfit",        name: "Outfit",        stack: '"Outfit", ui-sans-serif, system-ui, sans-serif', google: { family: "Outfit", weights: "400;500;600;700" } },
  { key: "sora",          name: "Sora",          stack: '"Sora", ui-sans-serif, system-ui, sans-serif',   google: { family: "Sora", weights: "400;500;600;700" } },
  { key: "dm_serif",      name: "DM Serif",      stack: '"DM Serif Display", ui-serif, Georgia, serif',   google: { family: "DM+Serif+Display", weights: "400" } },
  { key: "playfair",      name: "Playfair",      stack: '"Playfair Display", ui-serif, Georgia, serif',   google: { family: "Playfair+Display", weights: "400;500;600;700" } },
  { key: "fraunces",      name: "Fraunces",      stack: '"Fraunces", ui-serif, Georgia, serif',           google: { family: "Fraunces", weights: "400;500;600;700" } },
  { key: "bebas",         name: "Bebas Neue",    stack: '"Bebas Neue", var(--font-display), sans-serif',  google: { family: "Bebas+Neue", weights: "400" } },
];

/**
 * The stylesheet a face needs, or null when this site already serves it.
 *
 * `display=swap`: a bio page shows its text immediately and re-draws it in the
 * chosen face; it never holds the page blank on a third-party font.
 */
export function linkFontStylesheet(key: LinkFont | string): string | null {
  const font = FONT_OPTIONS.find((option) => option.key === key);
  if (!font?.google) return null;
  return `https://fonts.googleapis.com/css2?family=${font.google.family}:wght@${font.google.weights}&display=swap`;
}

/** The CSS font stack for a stored key, falling back to this site's own. */
export function linkFontStack(key: LinkFont | string): string {
  return (FONT_OPTIONS.find((option) => option.key === key) ?? FONT_OPTIONS[0]).stack;
}

export const HIGHLIGHT_OPTIONS: { key: LinkHighlight; name: string }[] = [
  { key: "none", name: "None" },
  { key: "pulse", name: "Pulse" },
  { key: "shine", name: "Shine" },
  { key: "bounce", name: "Bounce" },
];

/* ------------------------------------------------------------------ */
/*  Rendering                                                          */
/* ------------------------------------------------------------------ */

export interface LinkHubTheme {
  /** Custom properties applied to the page wrapper. */
  vars: Record<string, string>;
  /** Background declaration for the page wrapper. */
  background: string;
  /** The stylesheet the chosen face needs, or null when this site serves it. */
  fontStylesheet: string | null;
  /** True when the page is light, so overlays flip direction. */
  light: boolean;
  /** Pixel size for icons inside a button, which scale with button size. */
  iconSize: number;
}

/**
 * Turns stored settings into the CSS the page renders with.
 *
 * Colours come from the database, so they are validated here and passed
 * through custom properties. The `.lh-*` classes in globals.css do the
 * rest, which keeps the markup free of per-element inline styling.
 */
export function buildLinkHubTheme(settings: LinkHubSettings): LinkHubTheme {
  const bg = safeHex(settings.background_color, DEFAULT_SETTINGS.background_color);
  const bgAlt = safeHex(settings.background_color_alt, bg);
  const accent = safeHex(settings.accent_color, DEFAULT_SETTINGS.accent_color);
  const text = safeHex(settings.text_color, readableOn(bg));
  const btnBg = safeHex(settings.button_color, DEFAULT_SETTINGS.button_color);
  const btnFg = safeHex(settings.button_text_color, readableOn(btnBg));
  const light = isLightColor(bg);

  const radius =
    BUTTON_RADIUS_OPTIONS.find((option) => option.key === settings.button_radius)?.radius ?? "16px";
  const size =
    BUTTON_SIZE_OPTIONS.find((option) => option.key === settings.button_size) ??
    BUTTON_SIZE_OPTIONS[1];

  let background: string;
  switch (settings.background_style) {
    case "gradient":
      background = `linear-gradient(165deg, ${bg} 0%, ${bgAlt} 100%)`;
      break;
    case "glow":
      background = `radial-gradient(120% 80% at 50% -10%, ${withAlpha(bgAlt, 0.9)} 0%, ${bg} 62%), ${bg}`;
      break;
    case "image":
      // The picture is drawn as its own layer so it can be blurred and
      // darkened independently; this colour is what shows through.
      background = bg;
      break;
    default:
      background = bg;
  }

  // Per-style button surface. Each entry sets the four properties the
  // .lh-btn class reads, so switching styles never needs new markup.
  // The edge treatment is what makes a surface read as glass rather than
  // as a flat translucent box: a hairline catch of light along the top,
  // a tight contact shadow, and a wide soft one underneath.
  const edge = light
    ? "inset 0 1px 0 rgba(255,255,255,0.7), 0 1px 2px rgba(0,0,0,0.06), 0 12px 28px -16px rgba(0,0,0,0.28)"
    : "inset 0 1px 0 rgba(255,255,255,0.06), 0 1px 1px rgba(0,0,0,0.4), 0 14px 32px -18px rgba(0,0,0,0.9)";

  const surfaces: Record<ButtonStyle, Record<string, string>> = {
    glass: {
      "--lh-btn-bg": withAlpha(btnBg, light ? 0.5 : 0.38),
      "--lh-btn-bg-hover": withAlpha(btnBg, light ? 0.72 : 0.58),
      "--lh-btn-border": withAlpha(light ? "#000000" : "#FFFFFF", light ? 0.08 : 0.08),
      "--lh-btn-border-hover": withAlpha(light ? "#000000" : "#FFFFFF", light ? 0.16 : 0.18),
      "--lh-btn-shadow": edge,
      "--lh-btn-blur": "blur(24px) saturate(150%)",
    },
    fill: {
      "--lh-btn-bg": btnBg,
      "--lh-btn-bg-hover": shade(btnBg, light ? -0.1 : 0.12),
      "--lh-btn-border": "transparent",
      "--lh-btn-border-hover": "transparent",
      "--lh-btn-shadow": light
        ? "0 1px 2px rgba(0,0,0,0.08), 0 10px 24px -16px rgba(0,0,0,0.4)"
        : "inset 0 1px 0 rgba(255,255,255,0.05), 0 10px 24px -18px rgba(0,0,0,0.9)",
      "--lh-btn-blur": "none",
    },
    outline: {
      "--lh-btn-bg": "transparent",
      "--lh-btn-bg-hover": withAlpha(btnFg, 0.05),
      "--lh-btn-border": withAlpha(btnFg, 0.22),
      "--lh-btn-border-hover": withAlpha(btnFg, 0.42),
      "--lh-btn-shadow": "none",
      "--lh-btn-blur": "none",
    },
    soft: {
      "--lh-btn-bg": btnBg,
      "--lh-btn-bg-hover": shade(btnBg, light ? -0.07 : 0.1),
      "--lh-btn-border": withAlpha(light ? "#000000" : "#FFFFFF", 0.06),
      "--lh-btn-border-hover": withAlpha(light ? "#000000" : "#FFFFFF", 0.12),
      "--lh-btn-shadow": `0 18px 40px -22px ${withAlpha(light ? "#000000" : accent, 0.7)}`,
      "--lh-btn-blur": "none",
    },
    hard: {
      "--lh-btn-bg": btnBg,
      "--lh-btn-bg-hover": shade(btnBg, light ? -0.05 : 0.08),
      "--lh-btn-border": withAlpha(btnFg, 0.85),
      "--lh-btn-border-hover": withAlpha(btnFg, 1),
      "--lh-btn-shadow": `3px 3px 0 0 ${withAlpha(btnFg, 0.85)}`,
      "--lh-btn-blur": "none",
    },
  };

  // Button shadow is a SEPARATE axis from button style: it layers on top of
  // whatever the surface asked for instead of replacing it, so a glass button
  // can have a drop shadow. Identical to the abram-network implementation —
  // the two renderers must produce the same box-shadow list.
  const surface = surfaces[settings.button_style] ?? surfaces.glass;
  const baseShadow = surface["--lh-btn-shadow"];
  const extraShadow =
    settings.button_shadow === "soft"
      ? `0 18px 40px -20px ${withAlpha("#000000", light ? 0.32 : 0.85)}`
      : settings.button_shadow === "hard"
        ? `4px 4px 0 0 ${withAlpha(btnFg, 0.9)}`
        : null;

  const shadow = !extraShadow
    ? baseShadow
    : baseShadow === "none"
      ? extraShadow
      : `${baseShadow}, ${extraShadow}`;

  return {
    light,
    background,
    fontStylesheet: linkFontStylesheet(settings.font_family),
    iconSize: size.icon,
    vars: {
      ...surface,
      "--lh-btn-shadow": shadow,
      "--lh-font": linkFontStack(settings.font_family),
      "--lh-bg": bg,
      "--lh-bg-alt": bgAlt,
      "--lh-accent": accent,
      "--lh-accent-fg": readableOn(accent),
      "--lh-text": text,
      "--lh-muted": withAlpha(text, 0.62),
      "--lh-faint": withAlpha(text, 0.4),
      "--lh-hairline": withAlpha(text, 0.12),
      "--lh-btn-fg": btnFg,
      "--lh-radius": radius,
      "--lh-btn-h": size.height,
      "--lh-btn-pad-y": size.padY,
      "--lh-btn-pad-x": size.padX,
      "--lh-btn-font": size.font,
      "--lh-btn-gap": size.gap,
      "--lh-stack": size.stack,
      "--lh-thumb": `calc(var(--lh-btn-h) - (var(--lh-btn-pad-y) * 2))`,
    },
  };
}
