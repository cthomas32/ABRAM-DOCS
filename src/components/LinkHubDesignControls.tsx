/**
 * Link Hub design controls, rendered as live swatches rather than a list.
 *
 * SHARED between /alternatives/linktree and /creators on purpose. Every value
 * below mirrors an option set in abram-network/src/lib/apps/linkHub.ts:
 * THEME_PRESETS, FONT_OPTIONS, BACKGROUND_PRESETS, BUTTON_STYLE_OPTIONS,
 * BUTTON_RADIUS_OPTIONS, BUTTON_SIZE_OPTIONS, BUTTON_SHADOW_OPTIONS,
 * AVATAR_SHAPE_OPTIONS, HIGHLIGHT_OPTIONS, LINK_DISPLAY_OPTIONS and
 * BLOCK_LAYOUT_OPTIONS.
 *
 * The counts in the headings are the honest counts from those arrays. If the
 * app gains a theme or a font, update it here once and both pages follow,
 * rather than two marketing pages disagreeing about how many exist.
 *
 * Font chips are styled by CATEGORY (serif, sans, mono) using generic system
 * families, not by downloading eleven webfonts onto a marketing page. The chip
 * shows the name; it does not claim to be a specimen of the exact face.
 */

const themeSwatches = [
  { name: "Midnight", cls: "bg-[#0A0A0A]", dot: "bg-[#8ECAFF]" },
  { name: "Carbon", cls: "bg-black", dot: "bg-white" },
  { name: "Paper", cls: "bg-[#F5F4F0]", dot: "bg-[#0A0A0A]" },
  { name: "Studio", cls: "bg-[#101014]", dot: "bg-[#C4A6FF]" },
  { name: "Daylight", cls: "bg-gradient-to-b from-white to-[#DCEBFF]", dot: "bg-[#2563EB]" },
  { name: "Reel", cls: "bg-[#07110D]", dot: "bg-[#4ADE80]" },
  { name: "Signal", cls: "bg-[#0A0A0A]", dot: "bg-white" },
];

/** BACKGROUND_PRESETS, with the colours the app actually stores. */
const backgroundPresets = [
  { name: "Ink", cls: "bg-[#0A0A0A]" },
  { name: "Bone", cls: "bg-gradient-to-br from-[#F5F4F0] to-[#E8E6DF]" },
  { name: "Dusk", cls: "bg-gradient-to-br from-[#0B0B12] to-[#2B1C3F]" },
  { name: "Ember", cls: "bg-gradient-to-br from-[#120B08] to-[#4A2415]" },
  { name: "Tide", cls: "bg-gradient-to-br from-[#04121A] to-[#0C3B4D]" },
  { name: "Moss", cls: "bg-gradient-to-br from-[#07110D] to-[#17402C]" },
  { name: "Aurora", cls: "bg-[#050A14] shadow-[inset_0_0_26px_rgba(30,77,123,0.95)]" },
  { name: "Halo", cls: "bg-[#0A0A0A] shadow-[inset_0_0_26px_rgba(58,42,85,0.95)]" },
  { name: "Daybreak", cls: "bg-gradient-to-br from-white to-[#DCEBFF]" },
  { name: "Sand", cls: "bg-gradient-to-br from-[#FBF6EC] to-[#E7D3B3]" },
  { name: "Graphite", cls: "bg-gradient-to-br from-[#141414] to-[#2E2E32]" },
  { name: "Custom", cls: "bg-gradient-to-tr from-zinc-700 via-zinc-500 to-zinc-800" },
];

/** FONT_OPTIONS. `cat` picks the generic family used to hint the category. */
const fontOptions = [
  { name: "General Sans", cat: "font-sans" },
  { name: "Archivo", cat: "font-display" },
  { name: "Mono", cat: "font-mono" },
  { name: "Inter", cat: "font-sans" },
  { name: "Space Grotesk", cat: "font-sans" },
  { name: "Outfit", cat: "font-sans" },
  { name: "Sora", cat: "font-sans" },
  { name: "DM Serif", cat: "font-serif" },
  { name: "Playfair", cat: "font-serif" },
  { name: "Fraunces", cat: "font-serif" },
  { name: "Bebas Neue", cat: "font-display uppercase tracking-wide" },
];

const buttonSwatches = [
  { name: "Glass", cls: "bg-white/10 border border-white/20 backdrop-blur-sm text-white" },
  { name: "Fill", cls: "bg-white text-zinc-950 font-semibold" },
  { name: "Outline", cls: "bg-transparent border border-white/60 text-white" },
  { name: "Soft", cls: "bg-zinc-800 text-white shadow-lg shadow-black/60" },
  { name: "Hard", cls: "bg-zinc-900 text-white border border-white/70 shadow-[3px_3px_0px_rgba(255,255,255,0.7)]" },
];

const shapeSwatches = [
  { name: "Sharp", cls: "rounded-[4px]" },
  { name: "Rounded", cls: "rounded-2xl" },
  { name: "Pill", cls: "rounded-full" },
];

/** BUTTON_SIZE_OPTIONS, at the heights the app renders them. */
const sizeSwatches = [
  { name: "Compact", h: "h-9", text: "text-[10px]" },
  { name: "Regular", h: "h-11", text: "text-[11px]" },
  { name: "Large", h: "h-14", text: "text-xs" },
];

const shadowSwatches = [
  { name: "None", cls: "" },
  { name: "Soft", cls: "shadow-lg shadow-black/70" },
  { name: "Hard", cls: "shadow-[3px_3px_0px_rgba(255,255,255,0.55)]" },
];

const avatarShapes = [
  { name: "Circle", cls: "rounded-full" },
  { name: "Rounded", cls: "rounded-xl" },
  { name: "Square", cls: "rounded-none" },
];

const highlights = ["None", "Pulse", "Shine", "Bounce"];
const displays = ["List", "Grid"];
const layouts = ["Classic", "Featured"];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 font-sans mb-4">
      {children}
    </div>
  );
}

function Chips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((t) => (
        <span
          key={t}
          className="px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-[11px] text-zinc-300 font-sans"
        >
          {t}
        </span>
      ))}
    </div>
  );
}

export default function LinkHubDesignControls() {
  return (
    <div className="w-full p-6 sm:p-8 rounded-2xl border border-white/10 bg-zinc-900/30 space-y-8">
      {/* Themes */}
      <div>
        <SectionLabel>7 Theme presets</SectionLabel>
        <div className="flex flex-wrap gap-3">
          {themeSwatches.map((t) => (
            <div key={t.name} className="text-center">
              <div className={`w-14 h-20 rounded-xl border border-white/15 flex items-end justify-center p-2 ${t.cls}`}>
                <div className={`w-full h-2 rounded-full ${t.dot}`} />
              </div>
              <div className="text-[10px] text-zinc-400 font-sans mt-1.5">{t.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Backgrounds */}
      <div className="pt-6 border-t border-white/[0.06]">
        <SectionLabel>12 Background presets, in solid, gradient, glow or your own image</SectionLabel>
        <div className="flex flex-wrap gap-3">
          {backgroundPresets.map((b) => (
            <div key={b.name} className="text-center">
              <div className={`w-[52px] h-[52px] rounded-xl border border-white/15 ${b.cls}`} />
              <div className="text-[10px] text-zinc-400 font-sans mt-1.5">{b.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Fonts */}
      <div className="pt-6 border-t border-white/[0.06]">
        <SectionLabel>11 Fonts</SectionLabel>
        <div className="flex flex-wrap gap-2.5">
          {fontOptions.map((f) => (
            <span
              key={f.name}
              className={`px-3.5 py-2 rounded-lg bg-white/[0.06] border border-white/10 text-zinc-200 text-[13px] ${f.cat}`}
            >
              {f.name}
            </span>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className="pt-6 border-t border-white/[0.06]">
        <SectionLabel>5 Button styles</SectionLabel>
        <div className="flex flex-wrap gap-3">
          {buttonSwatches.map((b) => (
            <div key={b.name} className={`px-4 py-2.5 rounded-xl text-[11px] font-sans ${b.cls}`}>
              {b.name}
            </div>
          ))}
        </div>
      </div>

      {/* Shapes, sizes, shadows */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-6 border-t border-white/[0.06]">
        <div>
          <SectionLabel>3 Shapes</SectionLabel>
          <div className="flex flex-wrap gap-2.5">
            {shapeSwatches.map((s) => (
              <div
                key={s.name}
                className={`px-3.5 py-2.5 text-[11px] font-sans bg-white/[0.06] border border-white/15 text-zinc-200 ${s.cls}`}
              >
                {s.name}
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionLabel>3 Sizes</SectionLabel>
          <div className="flex flex-wrap items-end gap-2.5">
            {sizeSwatches.map((s) => (
              <div
                key={s.name}
                className={`px-3.5 flex items-center rounded-xl bg-white/[0.06] border border-white/15 text-zinc-200 font-sans ${s.h} ${s.text}`}
              >
                {s.name}
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionLabel>3 Shadows</SectionLabel>
          <div className="flex flex-wrap gap-3">
            {shadowSwatches.map((s) => (
              <div
                key={s.name}
                className={`px-3.5 py-2.5 rounded-xl text-[11px] font-sans bg-zinc-800 border border-white/15 text-zinc-200 ${s.cls}`}
              >
                {s.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Avatar + the rest */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 border-t border-white/[0.06]">
        <div>
          <SectionLabel>3 Avatar shapes</SectionLabel>
          <div className="flex flex-wrap gap-3">
            {avatarShapes.map((a) => (
              <div key={a.name} className="text-center">
                <div
                  className={`w-12 h-12 bg-gradient-to-br from-zinc-500 to-zinc-700 border border-white/20 ${a.cls}`}
                />
                <div className="text-[10px] text-zinc-400 font-sans mt-1.5">{a.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <SectionLabel>4 Block highlights</SectionLabel>
            <Chips items={highlights} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 border-t border-white/[0.06]">
        <div>
          <SectionLabel>2 Link displays</SectionLabel>
          <Chips items={displays} />
        </div>
        <div>
          <SectionLabel>2 Block layouts</SectionLabel>
          <Chips items={layouts} />
        </div>
      </div>
    </div>
  );
}
