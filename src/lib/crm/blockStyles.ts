/**
 * Block chrome for the CRM boards and queues.
 *
 * Ported from the product app's project blocks so the two consoles read as
 * one family: same lane, same four-row card rhythm, same count pill, same
 * chip. The class strings differ because this app has no design tokens, so
 * `bg-card` and `bg-well` are written out as the white overlays they resolve
 * to, and `text-fg/NN` as the zinc ramp.
 *
 * The rule they encode is the same in both apps: meaning is never a coloured
 * bar or slab on the edge of a card. Colour lives in small chips and small
 * glyphs, so a board reads as black and white with a few points of signal.
 */

/** The one label recipe. */
export const LABEL_CAPS = "text-xs uppercase font-bold tracking-widest text-gray-400";

/** The column a set of blocks sits in. 312px, wider than a phone, so the rail snaps. */
export const BLOCK_LANE = "rounded-2xl border border-white/5 bg-white/[0.02] p-3";

export const BLOCK_LANE_WIDTH = "w-[312px] min-w-[312px] shrink-0 snap-start";

/** One block: a step lighter than its lane, no edge accent of any kind. */
export const BLOCK_CARD =
  "rounded-xl border border-white/8 bg-white/[0.03] p-3.5 transition-colors";

/** Hover brightens the hairline only. */
export const BLOCK_CARD_HOVER = "hover:border-white/20";

/** Row-1 key label. Uppercase, quiet, never a colour. */
export const BLOCK_KEY_LABEL = "text-[11px] uppercase tracking-wider text-zinc-500";

/** Row-2 title. */
export const BLOCK_TITLE = "text-sm text-white leading-snug";

/** Row-3 context line, prefixed with an arrow by the caller. */
export const BLOCK_SUBLINE = "text-xs text-zinc-500";

/** Row-4 meta chip. Shared by every chip so they cannot drift. */
export const BLOCK_CHIP =
  "h-6 rounded-md bg-white/[0.04] px-1.5 inline-flex items-center gap-1 text-[11px] text-zinc-300 whitespace-nowrap";

/** Lane-header count pill. */
export const BLOCK_COUNT_PILL =
  "text-[11px] text-zinc-400 bg-white/[0.04] rounded-full px-2 py-0.5 tabular-nums";

/** Dashed placeholder for an empty lane or an empty section. */
export const BLOCK_EMPTY =
  "rounded-xl border border-dashed border-white/[0.12] p-6 text-center text-[11px] text-zinc-500";

/**
 * Lateness is amber, never red. The palette reserves nothing for red at all
 * in this console, and amber is spent on the one thing it is allowed on: a
 * state that costs something if it keeps being ignored.
 */
export const OVERDUE_TEXT = "text-amber-400";

/** One toolbar row is one control height. */
export const CONTROL_HEIGHT = "h-9";
