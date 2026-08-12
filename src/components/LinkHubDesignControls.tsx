/**
 * Link Hub design controls, rendered as live swatches rather than a list.
 *
 * SHARED between /alternatives/linktree and /creators on purpose. These values
 * mirror the option sets in abram-network/src/lib/apps/linkHub.ts
 * (THEME_PRESETS, BUTTON_STYLE_OPTIONS, BUTTON_RADIUS_OPTIONS,
 * BACKGROUND_PRESETS). One component means one place to update when the app
 * gains a theme, instead of two pages quietly disagreeing about how many
 * there are.
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

const backgroundSwatches = [
  { name: "Solid", cls: "bg-[#141414]" },
  { name: "Gradient", cls: "bg-gradient-to-br from-[#120B08] to-[#4A2415]" },
  { name: "Glow", cls: "bg-[#050A14] shadow-[inset_0_0_28px_rgba(30,77,123,0.9)]" },
  { name: "Image", cls: "bg-gradient-to-tr from-zinc-700 via-zinc-500 to-zinc-800" },
];

export default function LinkHubDesignControls() {
  return (
    <div className="w-full p-6 sm:p-8 rounded-2xl border border-white/10 bg-zinc-900/30 space-y-8">
      {/* Themes */}
      <div>
        <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 font-sans mb-4">
          7 Theme presets
        </div>
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

      {/* Buttons */}
      <div className="pt-6 border-t border-white/[0.06]">
        <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 font-sans mb-4">
          5 Button styles
        </div>
        <div className="flex flex-wrap gap-3">
          {buttonSwatches.map((b) => (
            <div key={b.name} className={`px-4 py-2.5 rounded-xl text-[11px] font-sans ${b.cls}`}>
              {b.name}
            </div>
          ))}
        </div>
      </div>

      {/* Shapes + backgrounds */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 border-t border-white/[0.06]">
        <div>
          <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 font-sans mb-4">
            3 Button shapes
          </div>
          <div className="flex flex-wrap gap-3">
            {shapeSwatches.map((s) => (
              <div
                key={s.name}
                className={`px-4 py-2.5 text-[11px] font-sans bg-white/[0.06] border border-white/15 text-zinc-200 ${s.cls}`}
              >
                {s.name}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 font-sans mb-4">
            4 Background styles
          </div>
          <div className="flex flex-wrap gap-3">
            {backgroundSwatches.map((bg) => (
              <div key={bg.name} className="text-center">
                <div className={`w-14 h-14 rounded-xl border border-white/15 ${bg.cls}`} />
                <div className="text-[10px] text-zinc-400 font-sans mt-1.5">{bg.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-[11px] text-zinc-500 font-sans pt-6 border-t border-white/[0.06]">
        Plus three button sizes, list or grid layout, classic or featured blocks, block highlights of
        pulse, shine and bounce, and an optional avatar image.
      </p>
    </div>
  );
}
