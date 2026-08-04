import { readFile } from "fs/promises";
import path from "path";
import { ImageResponse } from "next/og";
import { BACKDROP_INK, backdropImageUrl, getBackdrop, photoBox, photoScrim } from "./backdrops";
import { contentInsets, getFormat, type SocialFormat } from "./formats";
import { effectiveAlign, getPlacement } from "./placement";
import { getTheme, type SocialTheme } from "./themes";
import {
  DEFAULT_MOCKUP_SHARE,
  MOCKUP_SHARE,
  TEMPLATES_WITH_MOCKUP,
  normalizeSpec,
  type SocialImageSpec,
} from "./spec";
import { AppMockup, MOCKUP_ASPECT } from "./mockups";

/**
 * The renderer behind every social image on the site.
 *
 * This began as the Open Graph card for the campaign landing pages and
 * grew into six templates across five sizes, which is why the frame and
 * the templates are separate: the lockup, the wash, the corner rule and
 * the footer are the same argument on every card, and only the middle
 * changes.
 *
 * Rendered with Satori, which supports a subset of CSS. The rules that
 * bite in practice:
 *   - flexbox only, no grid
 *   - any element with more than one child needs an explicit display: flex
 *   - radial gradients render with a hard edge, so every wash is linear
 *   - only glyphs in the loaded font exist, so ticks are drawn, not typed
 */

export const OG_CONTENT_TYPE = "image/png";

/**
 * Geist, the site's own typeface.
 *
 * Satori has no access to the browser's fonts, so without this a card is
 * drawn in whatever fallback the renderer ships with and reads as a
 * different brand from the page it links to. The four weights are the ones
 * DESIGN.md actually uses: 400 body, 500 captions, 600 overlines, 700
 * headings. Vendored as TTF rather than fetched, so a render never depends
 * on the network.
 */
const FONT_WEIGHTS = [400, 500, 600, 700] as const;

type LoadedFont = { name: string; data: ArrayBuffer; weight: (typeof FONT_WEIGHTS)[number]; style: "normal" };

let fontsPromise: Promise<LoadedFont[]> | null = null;

function getFonts(): Promise<LoadedFont[]> {
  if (!fontsPromise) {
    fontsPromise = Promise.all(
      FONT_WEIGHTS.map(async (weight) => {
        const file = await readFile(path.join(process.cwd(), "public", "fonts", `Geist-${weight}.ttf`));
        return {
          name: "Geist",
          data: file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer,
          weight,
          style: "normal" as const,
        };
      })
    ).catch((err) => {
      // A card in the fallback face is still a card. Losing the whole
      // render because a font file moved would be the worse failure.
      console.error("Social card: could not read Geist, falling back:", err);
      fontsPromise = null;
      return [];
    });
  }
  return fontsPromise;
}

/**
 * Brand assets: the lockup (mark plus wordmark) and the mark on its own,
 * each in cream and in black.
 *
 * Satori cannot resolve a relative asset path, so these are read off disk
 * and inlined. They are generated from the masters in `images/` rather
 * than hand-cropped: the file this replaced had lost the final M of the
 * wordmark, which is why every card looked subtly wrong.
 *
 * Cached at module scope. Most cards are generated once per build, but the
 * studio hits the render route on every keystroke.
 */
const BRAND_RATIO = {
  /** 2400x440 */
  lockup: 440 / 2400,
  /** 674x1200, so this one is height over width */
  mark: 1200 / 674,
} as const;

const brandCache = new Map<string, Promise<string>>();

/** Any PNG under `public/brand/`, inlined and cached at module scope. */
function getBrandFile(relative: string): Promise<string> {
  const cached = brandCache.get(relative);
  if (cached) return cached;

  const loading = readFile(path.join(process.cwd(), "public", "brand", relative))
    .then((data) => `data:image/png;base64,${data.toString("base64")}`)
    .catch((err) => {
      console.error(`Social card: could not read brand asset ${relative}:`, err);
      brandCache.delete(relative);
      return "";
    });

  brandCache.set(relative, loading);
  return loading;
}

function getBrandAsset(kind: "lockup" | "mark", ink: "cream" | "black"): Promise<string> {
  return getBrandFile(`${kind}-${ink}.png`);
}

/**
 * The film grain tile, written by `scripts/build-grain.js`.
 *
 * A missing tile is not worth failing a render over: the card just comes
 * out clean, which is what every card looked like before this existed.
 */
function getGrain(): Promise<string> {
  return getBrandFile("grain.png");
}

/**
 * An uploaded photograph, pulled out of the backdrops bucket and inlined.
 *
 * Fetched and turned into a data URI rather than handed to Satori as a
 * remote `src`, for the same reason the brand assets are: one fetch we can
 * cache and reason about, and a card that comes out plain instead of
 * failing when the file has gone.
 *
 * Cached at module scope by path. The studio hits the render route on
 * every keystroke and a two megabyte photograph is not worth fetching a
 * hundred times to draw the same sky.
 */
const photoCache = new Map<string, Promise<string>>();

/** A backdrop this big is a slow render on every card that uses it. */
const MAX_PHOTO_BYTES = 12 * 1024 * 1024;

function getBackdropPhoto(storagePath: string): Promise<string> {
  const cached = photoCache.get(storagePath);
  if (cached) return cached;

  const url = backdropImageUrl(storagePath);
  if (!url) return Promise.resolve("");

  const loading = fetch(url, { cache: "force-cache" })
    .then(async (response) => {
      if (!response.ok) throw new Error(`the bucket answered ${response.status}`);
      const type = response.headers.get("content-type") || "image/jpeg";
      if (!type.startsWith("image/")) throw new Error(`the bucket answered with ${type}`);
      const bytes = await response.arrayBuffer();
      if (bytes.byteLength > MAX_PHOTO_BYTES) throw new Error("the file is too large to draw");
      return `data:${type};base64,${Buffer.from(bytes).toString("base64")}`;
    })
    .catch((err) => {
      // The card still draws, on the base colour. A missing photograph is
      // a plain card; a thrown render is no card at all.
      console.error(`Social card: could not read the backdrop ${storagePath}:`, err);
      photoCache.delete(storagePath);
      return "";
    });

  photoCache.set(storagePath, loading);
  return loading;
}

/**
 * Satori wraps on words but gives us no measurement pass, so long copy is
 * fitted by estimate: shrink the size until the text is likely to fall
 * within the line budget. The ratio is the average glyph width as a
 * fraction of the font size, measured off the medium weight.
 *
 * It fits for two things, not one. The line budget is the obvious one.
 * The other is that the last two words have to fit on a line together,
 * because `noWidow` is about to bind them and a pair too wide for a line
 * would run off the edge instead of wrapping. Without this the fitter
 * would settle on a size where the only legal wrap leaves one word alone,
 * and the widow would be baked in before there was anything to fix. That
 * is exactly what "Every call sheet you send is already / reconciled"
 * was: at 109 points a line holds fifteen characters and "already
 * reconciled" is eighteen, so no arrangement of that headline had two
 * words on its last line. The type has to give.
 *
 * A synthetic string of one long token — which is how the list templates
 * measure their longest item — has no last pair, so this costs them
 * nothing.
 */
function fitFontSize(
  content: string,
  availableWidth: number,
  maxLines: number,
  base: number,
  min: number,
  glyphRatio = 0.54
): number {
  let size = base;
  while (size > min) {
    if (
      estimateLines(content, size, availableWidth, glyphRatio) <= maxLines &&
      lastPairFits(content, size, availableWidth, glyphRatio)
    ) {
      break;
    }
    size -= 2;
  }
  return Math.max(size, min);
}

/**
 * How much of a line the last two words are allowed to want.
 *
 * They are about to be bound into one unbreakable token, so they have to
 * fit on a line together or they overflow instead of wrapping. The
 * shortfall from a whole line is margin against the estimate, which is an
 * average and can be beaten by a pair of unusually wide words.
 */
const PAIR_FITS = 0.8;

/**
 * Whether the last two words could share a line at this size.
 *
 * Under three words there is nothing to decide: two words that will not
 * fit on one line widow whatever anybody does.
 */
function lastPairFits(content: string, size: number, availableWidth: number, glyphRatio: number): boolean {
  const words = content.trim().split(/\s+/);
  if (words.length < 3) return true;
  const pair = `${words[words.length - 2]} ${words[words.length - 1]}`;
  return pair.length * size * glyphRatio <= availableWidth * PAIR_FITS;
}

/**
 * One size for a list, that every item in it can live at.
 *
 * The list templates set all their items at one size, because a checklist
 * whose third line is smaller than its second reads as a bug. Which size
 * is decided by the longest item, measured as a run of `x` so the
 * character count does the work.
 *
 * That synthetic string is why these need their own fitter. It has no
 * spaces, so the widow constraint inside `fitFontSize` sees nothing to
 * check and passes every size. So the pairs are checked here, against the
 * real items, and the size comes down until the last two words of every
 * one of them can share a line.
 */
function fitItems(
  items: string[],
  availableWidth: number,
  maxLines: number,
  base: number,
  min: number,
  glyphRatio = 0.54
): number {
  const longest = items.reduce((max, item) => Math.max(max, item.length), 0);
  let size = fitFontSize("x".repeat(longest), availableWidth, maxLines, base, min, glyphRatio);
  while (size > min && !items.every((item) => lastPairFits(item, size, availableWidth, glyphRatio))) {
    size -= 2;
  }
  return Math.max(size, min);
}

/**
 * Never leave one word alone on the last line.
 *
 * A headline that wraps to "…the call sheet still to / do" is the one
 * typographic mistake on a card that everybody sees and nobody can name.
 * It is not a wrapping bug — the line broke exactly where it had to — so
 * there is nothing to fix in the layout. The fix is in the text: bind the
 * last two words with a non-breaking space and the breaker has to take
 * them down together, which means the shortest a last line can be is two
 * words.
 *
 * Satori runs the Unicode line breaking algorithm, where U+00A0 is glue
 * and carries a prohibited break on both sides, so this is the same
 * mechanism a browser uses rather than a trick that happens to work.
 *
 * The size this is called with came out of `fitFontSize`, which shrank
 * the type until this pair would fit, so the guard here almost always
 * passes. It is still checked, because the fitter has a floor: copy long
 * enough to drive the type down to its minimum keeps its widow rather
 * than running off the edge of the card, which is the worse of the two.
 */
function noWidow(content: string, size: number, availableWidth: number, glyphRatio = 0.54): string {
  const words = content.trim().split(/\s+/);
  if (words.length < 3) return content;
  if (!lastPairFits(content, size, availableWidth, glyphRatio)) return content;

  return [...words.slice(0, -2), `${words[words.length - 2]}\u00A0${words[words.length - 1]}`].join(" ");
}

/** Same estimate, used to budget vertical space before laying anything out. */
function estimateLines(content: string, size: number, availableWidth: number, glyphRatio = 0.54): number {
  if (!content) return 0;
  const charsPerLine = Math.max(1, Math.floor(availableWidth / (size * glyphRatio)));
  return Math.ceil(content.length / charsPerLine);
}

interface RenderContext {
  spec: SocialImageSpec;
  theme: SocialTheme;
  format: SocialFormat;
  /** Scales a size tuned against the 1200x630 card to the current format */
  s: (n: number) => number;
  /** Card width minus horizontal padding */
  contentWidth: number;
  /** Height left for the template once the lockup and footer have taken theirs */
  contentHeight: number;
  /** The brand mark as a data URI, for the app windows drawn inside a card */
  mark: string;
  /** The full lockup, for the places inside the app that name the assistant */
  lockup: string;
  /** The identity this card carries, already picked and inked. Empty for none. */
  brandAsset: string;
  /** Its drawn height, with the card's brand scale already applied. */
  brandHeight: number;
  /**
   * How the lines are set, once the placement and the layout have both had
   * their say. A layout that is a list to scan down keeps its left edge
   * whatever the placement asks for, so templates read this rather than
   * the placement itself.
   */
  align: "left" | "center";
}

/**
 * Centring in Satori, which has no `margin: auto` worth relying on.
 *
 * A line is its own flex box laid across the full content width, and the
 * text inside it is positioned with `justifyContent` and `textAlign`
 * together: the first places a single line, the second places the lines of
 * a wrapped one. Spread on to a text div; `stack` goes on the column that
 * holds them.
 */
function line(align: "left" | "center") {
  return {
    width: "100%",
    justifyContent: align === "center" ? ("center" as const) : ("flex-start" as const),
    textAlign: align === "center" ? ("center" as const) : ("left" as const),
  };
}

function stack(align: "left" | "center") {
  return { alignItems: align === "center" ? ("center" as const) : ("flex-start" as const) };
}

// ---------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------

function Eyebrow({ ctx }: { ctx: RenderContext }) {
  const { spec, theme, s } = ctx;
  if (!spec.eyebrow) return null;
  return (
    <div
      style={{
        display: "flex",
        ...line(ctx.align),
        fontSize: s(20),
        fontWeight: 600,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: theme.accent,
        marginBottom: s(26),
      }}
    >
      {spec.eyebrow}
    </div>
  );
}

/** A drawn tick, because the render font is not guaranteed to carry one. */
function Tick({ ctx }: { ctx: RenderContext }) {
  const { theme, s } = ctx;
  const box = s(20);
  return (
    <div
      style={{
        display: "flex",
        width: box,
        height: box,
        borderRadius: box / 2,
        backgroundColor: theme.accent,
        marginTop: s(12),
        marginRight: s(22),
        flexShrink: 0,
      }}
    />
  );
}

function ItemList({ ctx, size, maxLines = 2 }: { ctx: RenderContext; size: number; maxLines?: number }) {
  const { spec, theme, s, contentWidth } = ctx;
  if (spec.items.length === 0) return null;

  const width = contentWidth - s(42);
  const fitted = fitItems(spec.items, width, maxLines, size, Math.round(size * 0.62));

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      {spec.items.map((item, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            alignItems: "flex-start",
            marginTop: index === 0 ? 0 : s(18),
            width: "100%",
          }}
        >
          <Tick ctx={ctx} />
          <div
            style={{
              display: "flex",
              fontSize: fitted,
              fontWeight: 400,
              lineHeight: 1.32,
              color: theme.secondary,
              flexGrow: 1,
            }}
          >
            {noWidow(item, fitted, width)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------

function StatementBody({ ctx }: { ctx: RenderContext }) {
  const { spec, theme, s, contentWidth } = ctx;
  const longest = Math.max(spec.headline.length, spec.headlineAccent.length);
  const size = fitFontSize("x".repeat(longest), contentWidth, 2, s(68), s(34));

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", ...stack(ctx.align) }}>
      <Eyebrow ctx={ctx} />
      {spec.headline ? (
        <div
          style={{
            display: "flex",
            ...line(ctx.align),
            fontSize: size,
            fontWeight: 700,
            color: theme.text,
            lineHeight: 1.08,
            letterSpacing: "-0.025em",
          }}
        >
          {noWidow(spec.headline, size, contentWidth)}
        </div>
      ) : null}
      {spec.headlineAccent ? (
        <div
          style={{
            display: "flex",
            ...line(ctx.align),
            fontSize: size,
            fontWeight: 700,
            color: theme.secondary,
            lineHeight: 1.08,
            letterSpacing: "-0.025em",
            marginTop: s(6),
          }}
        >
          {spec.headlineAccent}
        </div>
      ) : null}
    </div>
  );
}

function QuoteBody({ ctx }: { ctx: RenderContext }) {
  const { spec, theme, s, contentWidth } = ctx;
  const size = fitFontSize(spec.headline, contentWidth, 5, s(56), s(28));

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", ...stack(ctx.align) }}>
      <div
        style={{
          display: "flex",
          ...line(ctx.align),
          fontSize: s(120),
          lineHeight: 0.8,
          fontWeight: 700,
          color: theme.accent,
          marginBottom: s(10),
          height: s(72),
        }}
      >
        &ldquo;
      </div>
      <div
        style={{
          display: "flex",
          ...line(ctx.align),
          fontSize: size,
          fontWeight: 400,
          color: theme.text,
          lineHeight: 1.28,
          letterSpacing: "-0.01em",
        }}
      >
        {noWidow(spec.headline, size, contentWidth)}
      </div>
      {spec.attribution ? (
        <div
          style={{
            display: "flex",
            ...line(ctx.align),
            fontSize: s(24),
            fontWeight: 500,
            color: theme.muted,
            marginTop: s(32),
            letterSpacing: "0.02em",
          }}
        >
          {spec.attribution}
        </div>
      ) : null}
    </div>
  );
}

function StatBody({ ctx }: { ctx: RenderContext }) {
  const { spec, theme, s, contentWidth } = ctx;
  const statSize = fitFontSize(spec.stat, contentWidth, 1, s(180), s(72), 0.62);
  const headlineSize = fitFontSize(spec.headline, contentWidth, 3, s(46), s(26));

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", ...stack(ctx.align) }}>
      <Eyebrow ctx={ctx} />
      {spec.stat ? (
        <div
          style={{
            display: "flex",
            ...line(ctx.align),
            fontSize: statSize,
            fontWeight: 700,
            color: theme.accent,
            lineHeight: 1,
            letterSpacing: "-0.04em",
          }}
        >
          {spec.stat}
        </div>
      ) : null}
      {spec.headline ? (
        <div
          style={{
            display: "flex",
            ...line(ctx.align),
            fontSize: headlineSize,
            fontWeight: 700,
            color: theme.text,
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
            marginTop: s(26),
          }}
        >
          {noWidow(spec.headline, headlineSize, contentWidth)}
        </div>
      ) : null}
      {spec.attribution ? (
        <div
          style={{
            display: "flex",
            ...line(ctx.align),
            fontSize: s(22),
            fontWeight: 400,
            color: theme.muted,
            lineHeight: 1.4,
            marginTop: s(20),
          }}
        >
          {spec.attribution}
        </div>
      ) : null}
    </div>
  );
}

function ChecklistBody({ ctx }: { ctx: RenderContext }) {
  const { spec, theme, s, contentWidth } = ctx;
  const headlineSize = fitFontSize(spec.headline, contentWidth, 2, s(54), s(30));

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Eyebrow ctx={ctx} />
      {spec.headline ? (
        <div
          style={{
            display: "flex",
            fontSize: headlineSize,
            fontWeight: 700,
            color: theme.text,
            lineHeight: 1.1,
            letterSpacing: "-0.025em",
            marginBottom: s(38),
          }}
        >
          {noWidow(spec.headline, headlineSize, contentWidth)}
        </div>
      ) : null}
      <ItemList ctx={ctx} size={s(32)} />
    </div>
  );
}

function FeatureBody({ ctx }: { ctx: RenderContext }) {
  const { spec, theme, s, contentWidth } = ctx;
  const headlineSize = fitFontSize(spec.headline, contentWidth, 2, s(52), s(30));
  const bodySize = fitFontSize(spec.body, contentWidth, 4, s(28), s(20));

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Eyebrow ctx={ctx} />
      {spec.headline ? (
        <div
          style={{
            display: "flex",
            fontSize: headlineSize,
            fontWeight: 700,
            color: theme.text,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}
        >
          {noWidow(spec.headline, headlineSize, contentWidth)}
        </div>
      ) : null}
      {spec.body ? (
        <div
          style={{
            display: "flex",
            fontSize: bodySize,
            fontWeight: 400,
            color: theme.secondary,
            lineHeight: 1.6,
            marginTop: s(24),
          }}
        >
          {noWidow(spec.body, bodySize, contentWidth)}
        </div>
      ) : null}
      {spec.items.length > 0 ? (
        <div style={{ display: "flex", marginTop: s(34), width: "100%" }}>
          <ItemList ctx={ctx} size={s(27)} maxLines={1} />
        </div>
      ) : null}
    </div>
  );
}

function AnnounceBody({ ctx }: { ctx: RenderContext }) {
  const { spec, theme, s, contentWidth } = ctx;
  const headlineSize = fitFontSize(spec.headline, contentWidth, 3, s(58), s(30));
  const bodySize = fitFontSize(spec.body, contentWidth, 4, s(27), s(20));

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {spec.eyebrow ? (
        <div style={{ display: "flex", marginBottom: s(30) }}>
          <div
            style={{
              display: "flex",
              fontSize: s(18),
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: theme.background,
              backgroundColor: theme.accent,
              paddingTop: s(8),
              paddingBottom: s(8),
              paddingLeft: s(18),
              paddingRight: s(18),
              borderRadius: s(999),
            }}
          >
            {spec.eyebrow}
          </div>
        </div>
      ) : null}
      {spec.headline ? (
        <div
          style={{
            display: "flex",
            fontSize: headlineSize,
            fontWeight: 700,
            color: theme.text,
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
          }}
        >
          {noWidow(spec.headline, headlineSize, contentWidth)}
        </div>
      ) : null}
      {spec.body ? (
        <div
          style={{
            display: "flex",
            fontSize: bodySize,
            fontWeight: 400,
            color: theme.secondary,
            lineHeight: 1.6,
            marginTop: s(26),
          }}
        >
          {noWidow(spec.body, bodySize, contentWidth)}
        </div>
      ) : null}
    </div>
  );
}

/**
 * The card that shows the app rather than describing it.
 *
 * Wide formats put the panel beside the copy, tall ones put it underneath.
 * That is not just fitting: on a landscape link preview the eye reads
 * left to right and the claim should land first, while in a feed the
 * panel is what stops the scroll, so it wants to be the larger shape.
 */
function ProductBody({ ctx }: { ctx: RenderContext }) {
  const { spec, theme, format, s, contentWidth, contentHeight } = ctx;
  const sideBySide = format.width / format.height > 1.2;
  const aspect = MOCKUP_ASPECT[spec.mockup] ?? 0.72;
  // A phone and a printed sheet are taller than they are wide, and the
  // rules that suit a wide window get them exactly wrong: stretched to the
  // column they run off the bottom of the card, and given a column's share
  // of a landscape they end up a postage stamp.
  const tall = aspect > 0.9;

  const copyWidth = sideBySide ? Math.round(contentWidth * (tall ? 0.56 : 0.42)) : contentWidth;
  const headlineSize = fitFontSize(spec.headline, copyWidth, sideBySide ? 4 : 2, s(46), s(26));
  const bodySize = fitFontSize(spec.body, copyWidth, 4, s(25), s(18));

  /**
   * The panel is sized by whichever runs out first, width or height.
   * Sizing on width alone pushed the footer off the bottom of a square
   * card, which is the one thing a card cannot afford to lose.
   */
  const { panelWidth, panelScaleWidth } = (() => {
    if (sideBySide) {
      const share = Math.round(contentWidth * (tall ? 0.34 : 0.54));
      const fitted = Math.max(s(120), Math.min(share, Math.floor(contentHeight / aspect)));
      return { panelWidth: fitted, panelScaleWidth: fitted };
    }
    const copyHeight =
      (spec.eyebrow ? s(46) : 0) +
      estimateLines(spec.headline, headlineSize, copyWidth) * headlineSize * 1.12 +
      (spec.body ? estimateLines(spec.body, bodySize, copyWidth) * bodySize * 1.6 + s(18) : 0);
    const room = contentHeight - copyHeight - s(38);
    const fitted = Math.max(s(160), Math.min(contentWidth, Math.floor(room / aspect)));
    // A tall panel is sized by the height it has and then centred. A wide
    // one spans the full column, and only its internals are sized down.
    return tall
      ? { panelWidth: fitted, panelScaleWidth: fitted }
      : { panelWidth: contentWidth, panelScaleWidth: Math.max(s(280), fitted) };
  })();

  const copy = (
    <div style={{ display: "flex", flexDirection: "column", width: sideBySide ? copyWidth : "100%" }}>
      <Eyebrow ctx={ctx} />
      {spec.headline ? (
        <div
          style={{
            display: "flex",
            fontSize: headlineSize,
            fontWeight: 700,
            color: theme.text,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}
        >
          {noWidow(spec.headline, headlineSize, copyWidth)}
        </div>
      ) : null}
      {spec.body ? (
        <div
          style={{
            display: "flex",
            fontSize: bodySize,
            fontWeight: 400,
            color: theme.secondary,
            lineHeight: 1.6,
            marginTop: s(18),
          }}
        >
          {noWidow(spec.body, bodySize, copyWidth)}
        </div>
      ) : null}
    </div>
  );

  const panel = (
    <div
      style={{
        display: "flex",
        marginTop: sideBySide ? 0 : s(38),
        // Centred when it does not span the column, so a phone sits in the
        // middle of the card rather than hard against its left edge.
        justifyContent: "center",
        ...(sideBySide ? {} : { width: "100%" }),
      }}
    >
      <AppMockup
        kind={spec.mockup}
        theme={theme}
        mark={ctx.mark}

        lockup={ctx.lockup}
        width={panelWidth}
        scaleWidth={panelScaleWidth}
      />
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: sideBySide ? "row" : "column",
        alignItems: sideBySide ? "center" : "flex-start",
        justifyContent: sideBySide ? "space-between" : "flex-start",
        width: "100%",
      }}
    >
      {copy}
      {panel}
    </div>
  );
}

/**
 * One line, as large as the card will take it.
 *
 * The card for the moment before anyone has decided to read anything. It
 * has no body, no bullets and no second thought on purpose: a hook that
 * needs a supporting sentence is not a hook, it is a statement, and there
 * is already a template for that.
 */
function HookBody({ ctx }: { ctx: RenderContext }) {
  const { spec, theme, s, contentWidth, contentHeight } = ctx;
  // Four lines is the most that still reads as one thought at this size.
  const size = fitFontSize(spec.headline, contentWidth, 4, s(104), s(46), 0.55);
  // A hook that only fills half the card has not earned the format, so it
  // grows until it is close to filling the height it was given.
  const lines = estimateLines(spec.headline, size, contentWidth, 0.55);
  const capped = Math.min(size, Math.max(s(46), Math.floor((contentHeight * 0.88) / Math.max(1, lines) / 1.04)));

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", ...stack(ctx.align) }}>
      {spec.eyebrow ? (
        <div
          style={{
            display: "flex",
            ...line(ctx.align),
            fontSize: s(20),
            fontWeight: 600,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: theme.accent,
            marginBottom: s(34),
          }}
        >
          {spec.eyebrow}
        </div>
      ) : null}
      <div
        style={{
          display: "flex",
          ...line(ctx.align),
          fontSize: capped,
          fontWeight: 700,
          color: theme.text,
          lineHeight: 1.04,
          letterSpacing: "-0.035em",
        }}
      >
        {noWidow(spec.headline, size, contentWidth, 0.55)}
      </div>
    </div>
  );
}

/**
 * Two columns: the way it goes now, and the way it goes with this.
 *
 * The most shared shape in this whole set and the easiest one to lie with,
 * so the left column has to describe a real Tuesday rather than a straw
 * man. If the left column would make a working producer roll their eyes,
 * the card is worse than no card.
 *
 * Stacks on a story, where two columns of large type leaves about ten
 * characters a line.
 */
function CompareBody({ ctx }: { ctx: RenderContext }) {
  const { spec, theme, format, s, contentWidth } = ctx;
  const stacked = format.height / format.width > 1.4;
  const headlineSize = fitFontSize(spec.headline, contentWidth, 2, s(50), s(28));
  const columnWidth = stacked ? contentWidth : Math.floor((contentWidth - s(48)) / 2);

  const itemWidth = columnWidth - s(34);
  const itemSize = fitItems([...spec.items, ...spec.itemsB], itemWidth, 2, s(26), s(16));

  const column = (label: string, items: string[], positive: boolean) => (
    <div style={{ display: "flex", flexDirection: "column", width: stacked ? "100%" : columnWidth }}>
      <div
        style={{
          display: "flex",
          fontSize: s(17),
          fontWeight: 600,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: positive ? theme.accent : theme.muted,
          paddingBottom: s(14),
          marginBottom: s(18),
          borderBottom: `1px solid ${positive ? theme.accent : theme.hairline}`,
        }}
      >
        {label}
      </div>
      {items.map((item, index) => (
        <div key={index} style={{ display: "flex", alignItems: "flex-start", marginTop: index === 0 ? 0 : s(16) }}>
          {/* A tick against a dash, drawn rather than typed: the render
              font is not guaranteed to carry either glyph. */}
          <div
            style={{
              display: "flex",
              width: s(14),
              height: positive ? s(14) : s(3),
              borderRadius: s(14),
              backgroundColor: positive ? theme.accent : theme.muted,
              marginTop: positive ? Math.round(itemSize * 0.4) : Math.round(itemSize * 0.62),
              marginRight: s(16),
              flexShrink: 0,
            }}
          />
          <div
            style={{
              display: "flex",
              fontSize: itemSize,
              fontWeight: 400,
              lineHeight: 1.32,
              color: positive ? theme.secondary : theme.muted,
              flexGrow: 1,
            }}
          >
            {noWidow(item, itemSize, itemWidth)}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Eyebrow ctx={ctx} />
      {spec.headline ? (
        <div
          style={{
            display: "flex",
            fontSize: headlineSize,
            fontWeight: 700,
            color: theme.text,
            lineHeight: 1.1,
            letterSpacing: "-0.025em",
            marginBottom: s(40),
          }}
        >
          {noWidow(spec.headline, headlineSize, contentWidth)}
        </div>
      ) : null}
      <div
        style={{
          display: "flex",
          flexDirection: stacked ? "column" : "row",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        {column(spec.labelA || "Now", spec.items, false)}
        <div style={{ display: "flex", ...(stacked ? { height: s(40) } : { width: s(48) }) }} />
        {column(spec.labelB || "With ABRAM", spec.itemsB, true)}
      </div>
    </div>
  );
}

/** A numbered sequence. Three or four; five is a process, not a post. */
function StepsBody({ ctx }: { ctx: RenderContext }) {
  const { spec, theme, s, contentWidth } = ctx;
  const headlineSize = fitFontSize(spec.headline, contentWidth, 2, s(50), s(28));
  const numberWidth = s(64);
  const itemWidth = contentWidth - numberWidth;
  const itemSize = fitItems(spec.items, itemWidth, 2, s(30), s(19));

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Eyebrow ctx={ctx} />
      {spec.headline ? (
        <div
          style={{
            display: "flex",
            fontSize: headlineSize,
            fontWeight: 700,
            color: theme.text,
            lineHeight: 1.1,
            letterSpacing: "-0.025em",
            marginBottom: s(38),
          }}
        >
          {noWidow(spec.headline, headlineSize, contentWidth)}
        </div>
      ) : null}
      {spec.items.map((item, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            alignItems: "flex-start",
            width: "100%",
            marginTop: index === 0 ? 0 : s(24),
            paddingTop: index === 0 ? 0 : s(24),
            borderTop: index === 0 ? "none" : `1px solid ${theme.hairline}`,
          }}
        >
          <div
            style={{
              display: "flex",
              width: numberWidth,
              flexShrink: 0,
              fontSize: Math.round(itemSize * 1.15),
              fontWeight: 700,
              color: theme.accent,
              letterSpacing: "-0.02em",
            }}
          >
            {String(index + 1).padStart(2, "0")}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: itemSize,
              fontWeight: 400,
              lineHeight: 1.34,
              color: theme.secondary,
              flexGrow: 1,
            }}
          >
            {noWidow(item, itemSize, itemWidth)}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Four short things in a two by two.
 *
 * A vertical list implies an order and a ranking whether you meant one or
 * not. When the four things are peers, the grid says so and the list does
 * not.
 */
function GridBody({ ctx }: { ctx: RenderContext }) {
  const { spec, theme, s, contentWidth } = ctx;
  const headlineSize = fitFontSize(spec.headline, contentWidth, 2, s(46), s(26));
  const gap = s(20);
  const tileWidth = Math.floor((contentWidth - gap) / 2);
  const tiles = spec.items.slice(0, 4);
  const tileTextWidth = tileWidth - s(56);
  const tileSize = fitItems(tiles, tileTextWidth, 3, s(26), s(16));

  const tile = (item: string | undefined, index: number) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: tileWidth,
        backgroundColor: theme.panel,
        border: `1px solid ${theme.panelBorder}`,
        borderRadius: s(20),
        paddingLeft: s(26),
        paddingRight: s(26),
        paddingTop: s(24),
        paddingBottom: s(24),
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: s(15),
          fontWeight: 700,
          letterSpacing: "0.14em",
          color: theme.accent,
          marginBottom: s(14),
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </div>
      <div style={{ display: "flex", fontSize: tileSize, fontWeight: 500, lineHeight: 1.3, color: theme.secondary }}>
        {noWidow(item || "", tileSize, tileTextWidth)}
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Eyebrow ctx={ctx} />
      {spec.headline ? (
        <div
          style={{
            display: "flex",
            fontSize: headlineSize,
            fontWeight: 700,
            color: theme.text,
            lineHeight: 1.1,
            letterSpacing: "-0.025em",
            marginBottom: s(34),
          }}
        >
          {noWidow(spec.headline, headlineSize, contentWidth)}
        </div>
      ) : null}
      {/* Two explicit rows: Satori ignores flex-wrap, so a wrapping row
          collapses into a single column instead of a grid. */}
      {[0, 2].map((offset) => (
        <div key={offset} style={{ display: "flex", justifyContent: "space-between", marginTop: offset === 0 ? 0 : gap }}>
          {tile(tiles[offset], offset)}
          {tile(tiles[offset + 1], offset + 1)}
        </div>
      ))}
    </div>
  );
}

/**
 * A word and what it means on a set.
 *
 * Useful before it is an advert, which is the only reason anyone saves a
 * post from a software company. The term stays short: this is a card, not
 * a glossary entry.
 */
function TermBody({ ctx }: { ctx: RenderContext }) {
  const { spec, theme, s, contentWidth } = ctx;
  const termSize = fitFontSize(spec.headline, contentWidth, 2, s(84), s(40), 0.58);
  const bodySize = fitFontSize(spec.body, contentWidth, 5, s(30), s(20));

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", ...stack(ctx.align) }}>
      {spec.eyebrow ? (
        <div
          style={{
            display: "flex",
            ...line(ctx.align),
            fontSize: s(19),
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: theme.muted,
            marginBottom: s(26),
          }}
        >
          {spec.eyebrow}
        </div>
      ) : null}
      {spec.headline ? (
        <div
          style={{
            display: "flex",
            ...line(ctx.align),
            fontSize: termSize,
            fontWeight: 700,
            color: theme.text,
            lineHeight: 1.06,
            letterSpacing: "-0.035em",
          }}
        >
          {noWidow(spec.headline, termSize, contentWidth, 0.58)}
        </div>
      ) : null}
      <div
        style={{
          display: "flex",
          width: s(120),
          height: s(4),
          flexShrink: 0,
          backgroundColor: theme.accent,
          marginTop: s(30),
          marginBottom: s(30),
        }}
      />
      {spec.body ? (
        <div
          style={{
            display: "flex",
            ...line(ctx.align),
            fontSize: bodySize,
            fontWeight: 400,
            color: theme.secondary,
            lineHeight: 1.55,
          }}
        >
          {noWidow(spec.body, bodySize, contentWidth)}
        </div>
      ) : null}
    </div>
  );
}

/**
 * The app panel as the whole card, with one line over it.
 *
 * The product template argues and shows. This one only shows. Use it when
 * the screen is genuinely the interesting thing and a paragraph beside it
 * would just be apologising for it.
 */
function ShowcaseBody({ ctx }: { ctx: RenderContext }) {
  const { spec, theme, s, contentWidth, contentHeight } = ctx;
  const aspect = MOCKUP_ASPECT[spec.mockup] ?? 0.72;
  const tall = aspect > 0.9;
  const headlineSize = fitFontSize(spec.headline, contentWidth, 2, s(48), s(26));

  const copyHeight =
    (spec.eyebrow ? s(46) : 0) + estimateLines(spec.headline, headlineSize, contentWidth) * headlineSize * 1.12;
  const room = contentHeight - copyHeight - s(34);
  const fitted = Math.max(s(160), Math.min(contentWidth, Math.floor(room / aspect)));

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <Eyebrow ctx={ctx} />
      {spec.headline ? (
        <div
          style={{
            display: "flex",
            fontSize: headlineSize,
            fontWeight: 700,
            color: theme.text,
            lineHeight: 1.1,
            letterSpacing: "-0.025em",
          }}
        >
          {noWidow(spec.headline, headlineSize, contentWidth)}
        </div>
      ) : null}
      <div style={{ display: "flex", justifyContent: "center", width: "100%", marginTop: s(34) }}>
        <AppMockup
          kind={spec.mockup}
          theme={theme}
          mark={ctx.mark}

          lockup={ctx.lockup}
          width={tall ? fitted : contentWidth}
          scaleWidth={tall ? fitted : Math.max(s(320), fitted)}
        />
      </div>
    </div>
  );
}

/**
 * The quiet one.
 *
 * A small mark, one line, and something atmospheric behind it. Centred,
 * and with none of the furniture the other templates carry: no eyebrow, no
 * corner rule, no footer bar, no drawn panel. The restraint is the whole
 * design. Everything the other cards use to look considered, this one
 * removes, and it stops a scroll better than any of them because there is
 * nothing on it to skip past.
 *
 * The mark goes inside the block rather than in the frame's brand row, so
 * it sits with the type instead of floating in a corner. Set `brand` to
 * none alongside this, which the preset does.
 */
function PosterBody({ ctx }: { ctx: RenderContext }) {
  const { spec, theme, s, contentWidth } = ctx;
  const width = Math.min(contentWidth, Math.round(contentWidth * 0.86));
  const size = fitFontSize(spec.headline, width, 3, s(58), s(30), 0.55);

  /**
   * The poster carries the identity itself, centred over the type, which
   * is why the frame skips its own brand row here. It carries exactly what
   * the brand field says, and none means none: nothing about this layout
   * makes the mark compulsory.
   *
   * Two thirds the height it would be in a corner, because a centred mark
   * sitting with the words reads larger than the same mark floating in the
   * top left.
   */
  const markHeight = Math.round(ctx.brandHeight * 0.62);
  const markWidth =
    spec.brand === "mark" ? Math.round(markHeight / BRAND_RATIO.mark) : Math.round(markHeight / BRAND_RATIO.lockup);

  /**
   * The poster was centred and nothing else for its first version, which
   * is the right default and turned out to be the wrong rule. On a
   * photograph with the light low in the frame, the same card set flush
   * left at the top is the stronger picture. It follows the placement like
   * every other layout now, and the placement still defaults to centred
   * here through the preset rather than through the template.
   */
  const flush = { display: "flex", ...line(ctx.align), width } as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", ...stack(ctx.align) }}>
      {ctx.brandAsset ? (
        <div style={{ display: "flex", marginBottom: s(32) }}>
          <img src={ctx.brandAsset} width={markWidth} height={markHeight} alt="ABRAM" />
        </div>
      ) : null}

      {spec.headline ? (
        <div
          style={{
            ...flush,
            fontSize: size,
            fontWeight: 700,
            color: theme.text,
            lineHeight: 1.18,
            letterSpacing: "-0.02em",
          }}
        >
          {noWidow(spec.headline, size, width, 0.55)}
        </div>
      ) : null}

      {spec.body ? (
        <div
          style={{
            ...flush,
            fontSize: Math.max(s(20), Math.round(size * 0.52)),
            fontWeight: 400,
            color: theme.secondary,
            lineHeight: 1.4,
            marginTop: s(34),
          }}
        >
          {noWidow(spec.body, Math.max(s(20), Math.round(size * 0.52)), width)}
        </div>
      ) : null}

      {spec.footnote ? (
        <div
          style={{
            display: "flex",
            ...line(ctx.align),
            fontSize: s(19),
            fontWeight: 500,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: theme.muted,
            marginTop: s(44),
          }}
        >
          {spec.footnote}
        </div>
      ) : null}
    </div>
  );
}

function TemplateBody({ ctx }: { ctx: RenderContext }) {
  switch (ctx.spec.template) {
    case "quote":
      return <QuoteBody ctx={ctx} />;
    case "stat":
      return <StatBody ctx={ctx} />;
    case "checklist":
      return <ChecklistBody ctx={ctx} />;
    case "feature":
      return <FeatureBody ctx={ctx} />;
    case "announce":
      return <AnnounceBody ctx={ctx} />;
    case "product":
      return <ProductBody ctx={ctx} />;
    case "hook":
      return <HookBody ctx={ctx} />;
    case "compare":
      return <CompareBody ctx={ctx} />;
    case "steps":
      return <StepsBody ctx={ctx} />;
    case "grid":
      return <GridBody ctx={ctx} />;
    case "term":
      return <TermBody ctx={ctx} />;
    case "showcase":
      return <ShowcaseBody ctx={ctx} />;
    case "poster":
      return <PosterBody ctx={ctx} />;
    case "statement":
    default:
      return <StatementBody ctx={ctx} />;
  }
}

// ---------------------------------------------------------------------
// Frame
// ---------------------------------------------------------------------

/**
 * Render a spec to a PNG.
 *
 * Returns an `ImageResponse`, which is a normal `Response`, so a route can
 * hand it straight back and a server action can call `.arrayBuffer()` on it
 * to get bytes for upload.
 */
export async function renderSocialImage(input: Partial<SocialImageSpec> | SocialImageSpec) {
  const spec = normalizeSpec(input);
  const format = getFormat(spec.format);
  const placement = getPlacement(spec.placement);
  // An uploaded photograph wins over a drawn sky. Two backgrounds in one
  // frame is two of them arguing, and the one somebody chose this morning
  // is the one they meant.
  const uploaded = Boolean(spec.backdropImage);
  const backdrop = getBackdrop(uploaded ? "none" : spec.backdrop);
  const onBackdrop = uploaded || spec.backdrop !== "none";
  // Every backdrop is dark, so a card on one takes the light text tiers and
  // the cream mark whatever palette it is otherwise set to. Without this a
  // cream card on a dusk sky is near-black type on near-black.
  const theme = onBackdrop ? { ...getTheme(spec.theme), ...BACKDROP_INK } : getTheme(spec.theme);
  // Both are loaded whether or not the card shows one at the top: the drawn
  // app windows put the mark in their own headers, and the screens that name
  // the assistant set the lockup rather than typing the word.
  const [fonts, brand, mark, lockup, grain, photo] = await Promise.all([
    getFonts(),
    spec.brand === "none" ? Promise.resolve("") : getBrandAsset(spec.brand, theme.ink),
    getBrandAsset("mark", theme.ink),
    getBrandAsset("lockup", theme.ink),
    spec.grain ? getGrain() : Promise.resolve(""),
    uploaded
      ? getBackdropPhoto(spec.backdropImage)
      : backdrop.image
        ? getBrandFile(path.posix.join("backdrops", backdrop.image))
        : Promise.resolve(""),
  ]);

  /**
   * The crop, as a box. An uploaded photograph carries its own; the built
   * in photographic backdrops were drawn to cover the whole frame and stay
   * that way.
   */
  const crop = uploaded
    ? photoBox(format.width, format.height, spec.backdropCrop, spec.backdropFocus)
    : { width: format.width, height: format.height, left: 0, top: 0 };

  /**
   * A drawn backdrop brings its own scrim, weighted for a card whose copy
   * sits at the top. An uploaded photograph gets one built here instead,
   * because its strength is a control and its direction follows wherever
   * the words ended up.
   */
  const scrim = uploaded ? photoScrim(spec.backdropDim, placement.scrimFrom) : backdrop.scrim;

  // Type scale rides on the format's own multiplier, so gaps and paddings
  // grow with the words rather than leaving them crowded.
  const s = (n: number) => Math.round(n * format.scale * spec.typeScale);
  // Padding plus whatever the platform's own interface is going to cover.
  const inset = contentInsets(format);
  const contentWidth = format.width - inset.left - inset.right;

  // The lockup is sized by width, the mark by height, because one is a
  // long horizontal and the other is a tall glyph. Both land on the same
  // cap height so switching between them does not move the header.
  // Sized off the format alone, so the mark holds still while type moves.
  const brandHeight = Math.round(44 * format.scale * spec.brandScale);
  const brandWidth =
    spec.brand === "mark"
      ? Math.round(brandHeight / BRAND_RATIO.mark)
      : Math.round(brandHeight / BRAND_RATIO.lockup);

  /**
   * The poster owns its own furniture.
   *
   * It centres its own mark, sets its own footnote under the type, and
   * wants no corner rule and no footer bar. Suppressing those here rather
   * than asking the author to clear three fields is the difference between
   * a template that is minimal and one that can be made minimal.
   */
  const isPoster = spec.template === "poster";

  const isSlide = spec.slideCount > 1 && spec.slideIndex > 0;
  // A carousel that is not on its last slide earns a nudge to keep going,
  // which is the whole mechanic of the format.
  const footerRight = isSlide && spec.slideIndex < spec.slideCount ? "Swipe" : spec.cta;
  const hasFooter = !isPoster && Boolean(spec.footnote || footerRight);

  // What the template has left after the brand row, the footer and the
  // breathing room around the middle block have taken their share.
  const roomForBody =
    format.height -
    inset.top -
    inset.bottom -
    (spec.brand === "none" ? 0 : brandHeight) -
    (hasFooter ? s(78) : 0) -
    s(56);

  /**
   * The app panel on a layout that does not compose one itself.
   *
   * Product and showcase are built around a panel and place it with the
   * copy, so they are left alone. Everywhere else it is a switch, and the
   * frame draws the panel under the words: a strip of the app under a
   * stat or a statement, sized by the room the words leave rather than by
   * the width of the card, so the words never get pushed into the footer.
   *
   * The gap it takes is removed from what the template is told it has, so
   * a hook still fills its share of a shorter card instead of overrunning
   * the panel.
   */
  const demoGap = s(34);
  const demo = (() => {
    if (!spec.showMockup || TEMPLATES_WITH_MOCKUP.includes(spec.template)) return null;
    const aspect = MOCKUP_ASPECT[spec.mockup] ?? 0.72;
    const share = MOCKUP_SHARE[spec.template] ?? DEFAULT_MOCKUP_SHARE;
    const width = Math.min(contentWidth, Math.floor((roomForBody * share) / aspect));
    /**
     * No room is no panel.
     *
     * Measured against the width of the card rather than in pixels,
     * because that is what decides whether a screen is readable: a banner
     * is 128 points tall once the brand row and the footer have theirs, so
     * a wide panel came out 173 across on a card 1584 wide and read as a
     * smudge. A third of the column is the line where an interface is
     * still an interface. Under it the panel is dropped, and the studio
     * preview shows that, because the preview is this same render.
     */
    if (width < Math.max(s(160), contentWidth * 0.32)) return null;
    return { width, height: Math.round(width * aspect) };
  })();

  const contentHeight = roomForBody - (demo ? demo.height + demoGap : 0);

  /**
   * How far off the bottom edge a photographer's credit sits.
   *
   * Inside the padding but below the footer, which is the margin of the
   * card. On a story that still lands well clear of the reply bar, since
   * the safe inset there is 250 and this only gives back sixty of it.
   *
   * Sized so the credit clears the footer line rather than sitting on its
   * shoulder: at half this it read as a second footer rather than as a
   * note in the margin, which is the whole difference between crediting
   * somebody and cluttering the card.
   */
  const creditBottom = Math.max(12, inset.bottom - s(44));

  const ctx: RenderContext = {
    spec,
    theme,
    format,
    s,
    contentWidth,
    contentHeight,
    mark,
    lockup,
    brandAsset: brand,
    brandHeight,
    align: effectiveAlign(placement, spec.template),
  };

  /** The middle block's share of the height, given where the words go. */
  const verticalPlacement =
    placement.vertical === "start" ? "flex-start" : placement.vertical === "end" ? "flex-end" : "center";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          // Under an uploaded photograph it is the spec's own base, which
          // is the colour of the picture. `backdrop.base` is empty for
          // `none`, so leaning on it here left a missing photograph as
          // white with a dark scrim over the bottom half.
          backgroundColor: uploaded ? spec.backdropBase : onBackdrop ? backdrop.base : theme.background,
          paddingTop: inset.top,
          paddingBottom: inset.bottom,
          paddingLeft: inset.left,
          paddingRight: inset.right,
          position: "relative",
        }}
      >
        {/* A photograph, if this backdrop has one. Covers rather than
            fits: a card is a fixed crop and letterboxing it would be
            worse than losing an edge of the picture. */}
        {photo ? (
          <img
            src={photo}
            width={crop.width}
            height={crop.height}
            alt=""
            style={{
              position: "absolute",
              top: crop.top,
              left: crop.left,
              width: crop.width,
              height: crop.height,
              objectFit: "cover",
            }}
          />
        ) : null}

        {/* Backdrop gradients, painted over the photo or on their own.
            Separate boxes rather than one multi-layer background, because
            Satori takes the layers of a shorthand in the opposite order
            from the browser and the stack comes out inside out. */}
        {onBackdrop
          ? (backdrop.layers ?? []).map((layer, index) => (
              <div
                key={index}
                style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: layer, display: "flex" }}
              />
            ))
          : null}

        {/* Scrim, so a line of type is legible wherever it lands. On an
            uploaded photograph it is weighted towards the placement: a
            top-heavy scrim over a card whose only line is at the bottom
            darkens the half of the picture nobody is reading over. */}
        {onBackdrop && scrim ? (
          <div
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: scrim, display: "flex" }}
          />
        ) : null}

        {/* Ambient brand wash. It covers the whole card and fades out on its
            own colour stops: cutting the box short instead left a visible
            seam wherever the angled gradient met the edge. Suppressed on a
            backdrop, which is already doing this job and doing it better. */}
        {onBackdrop ? null : (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: theme.wash,
              display: "flex",
            }}
          />
        )}

        {/* Corner rule, echoing the laser detail on the site */}
        {spec.showRule && !isPoster ? (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: Math.round(format.width * 0.27),
              height: 3,
              background: theme.rule,
              display: "flex",
            }}
          />
        ) : null}

        {/* Brand, and the slide counter when this card is one of a set.
            The name is only ever the drawn mark. If the asset cannot be
            read the row is left empty rather than typing the word, because
            ABRAM set in the body face is not the identity, and a card that
            looks slightly wrong travels further than one that looks
            obviously broken. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            // A mark in the top-left corner over centred type reads as a
            // mistake, so the identity follows the words. A slide counter
            // pins the row back open, which is what it is there for.
            justifyContent: isSlide ? "space-between" : ctx.align === "center" ? "center" : "flex-start",
            flexShrink: 0,
            height: spec.brand === "none" ? 0 : brandHeight,
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            {spec.brand !== "none" && brand && !isPoster ? (
              <img src={brand} width={brandWidth} height={brandHeight} alt="ABRAM" />
            ) : null}
          </div>

          {isSlide ? (
            <div
              style={{
                display: "flex",
                fontSize: s(20),
                fontWeight: 600,
                letterSpacing: "0.12em",
                color: theme.muted,
              }}
            >
              {String(spec.slideIndex).padStart(2, "0")} / {String(spec.slideCount).padStart(2, "0")}
            </div>
          ) : null}
        </div>

        {/* The template's own block, placed down the height of the card by
            the placement rather than always sitting in the middle. The
            middle is the safe answer and never the best one: on a
            photograph the composition decides where the words go. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            justifyContent: verticalPlacement,
            paddingTop: s(28),
            paddingBottom: s(28),
          }}
        >
          <TemplateBody ctx={ctx} />

          {/* The demo, when this layout has been asked for one. Under the
              words rather than beside them: the copy is the claim and the
              panel is the evidence, and evidence goes second. It follows
              the alignment so a centred card does not end up with the
              screen hard against its left edge. */}
          {demo ? (
            <div
              style={{
                display: "flex",
                width: "100%",
                justifyContent: ctx.align === "center" ? "center" : "flex-start",
                marginTop: demoGap,
              }}
            >
              <AppMockup
                kind={spec.mockup}
                theme={theme}
                mark={mark}
                lockup={lockup}
                width={demo.width}
                scaleWidth={demo.width}
              />
            </div>
          ) : null}
        </div>

        {/* Footer line */}
        {hasFooter ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: `1px solid ${theme.hairline}`,
              paddingTop: s(26),
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", fontSize: s(24), color: theme.secondary }}>{spec.footnote}</div>
            <div style={{ display: "flex", fontSize: s(24), color: theme.muted }}>{footerRight}</div>
          </div>
        ) : null}

        {/* The photographer's credit.
            In the margin under the footer rather than in the composition,
            the way a printed page credits a picture: small, faint, and out
            of the way of the thing it is crediting. It sits inside the
            card's horizontal insets so a banner's cropped ends and a
            story's reply bar cannot eat it, and it is drawn before the
            grain so it gets the same texture as everything else. */}
        {spec.backdropCredit ? (
          <div
            style={{
              position: "absolute",
              bottom: creditBottom,
              left: inset.left,
              right: inset.right,
              display: "flex",
              justifyContent: spec.backdropCreditSide === "right" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: s(15),
                fontWeight: 500,
                letterSpacing: "0.08em",
                color: theme.muted,
                opacity: 0.7,
              }}
            >
              {spec.backdropCredit}
            </div>
          </div>
        ) : null}

        {/* Film grain, over everything including the type and the footer.
            It is painted last for that reason: drawn before the footer, the
            footer bar was the one element on the card with no grain on it,
            which is exactly where the eye goes looking for the seam.
            This is what stops a gradient reading as a software gradient.
            Tiled from a small seeded PNG, because Satori has no filters, no
            blend modes and no noise of its own. */}
        {grain ? (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              backgroundImage: `url(${grain})`,
              backgroundRepeat: "repeat",
              backgroundSize: "160px 160px",
            }}
          />
        ) : null}
      </div>
    ),
    {
      width: format.width,
      height: format.height,
      // An empty list means the font files were unreadable; Satori then
      // uses its own fallback rather than refusing to draw.
      ...(fonts.length > 0 ? { fonts } : {}),
    }
  );
}
