"use client";

import {
  AVATAR_KIND_OPTIONS,
  BUTTON_RADIUS_OPTIONS,
  BUTTON_SIZE_OPTIONS,
  BUTTON_STYLE_OPTIONS,
  FONT_OPTIONS,
  THEME_PRESETS,
  buildLinkHubTheme,
  normalizeImageUrl,
  type AvatarKind,
  type AvatarShape,
  type BackgroundStyle,
  type ButtonRadius,
  type ButtonSize,
  type ButtonStyle,
  type LinkFont,
  type LinkHubSettings,
} from "@/lib/linkHub";
import { Choice, ColorField, Field, Panel, Slider, TextArea } from "./LinkHubFields";
import ImageField from "./ImageField";

/**
 * Appearance controls for the link hub.
 *
 * A preset writes a whole set of values in one go; every individual
 * control below stays editable afterwards, so a preset is a starting
 * point rather than a lock.
 */
export default function LinkHubDesignPanel({
  settings,
  onChange,
}: {
  settings: LinkHubSettings;
  onChange: (patch: Partial<LinkHubSettings>) => void;
}) {
  const ogPreview = settings.og_image_url ? normalizeImageUrl(settings.og_image_url) : null;

  return (
    <div className="space-y-5">
      <Panel title="Theme">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {THEME_PRESETS.map((preset) => {
            const theme = buildLinkHubTheme({ ...settings, ...preset.values });
            const active = settings.theme === preset.key;

            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => onChange({ theme: preset.key, ...preset.values })}
                className={`rounded-xl border p-2 text-left transition-all cursor-pointer ${
                  active
                    ? "border-white/30 bg-white/[0.06]"
                    : "border-white/8 bg-white/[0.02] hover:border-white/20"
                }`}
              >
                <div
                  className="h-16 rounded-lg mb-2 flex flex-col justify-center gap-1 px-2"
                  style={{ background: theme.background }}
                >
                  <span
                    className="h-2 rounded-full"
                    style={{
                      background: theme.vars["--lh-btn-bg"],
                      border: `1px solid ${theme.vars["--lh-btn-border"]}`,
                    }}
                  />
                  <span
                    className="h-2 rounded-full"
                    style={{ background: theme.vars["--lh-accent"] }}
                  />
                  <span
                    className="h-2 rounded-full w-2/3"
                    style={{
                      background: theme.vars["--lh-btn-bg"],
                      border: `1px solid ${theme.vars["--lh-btn-border"]}`,
                    }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-zinc-300">{preset.name}</span>
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel title="Profile">
        <div className="space-y-4">
          <Field
            label="Display name"
            value={settings.heading}
            onChange={(v) => onChange({ heading: v })}
          />

          <TextArea
            label="Bio"
            value={settings.subheading}
            rows={2}
            onChange={(v) => onChange({ subheading: v })}
          />

          <Choice<AvatarKind>
            label="Avatar"
            value={settings.avatar_kind}
            onChange={(v) => onChange({ avatar_kind: v })}
            options={AVATAR_KIND_OPTIONS}
          />

          {settings.avatar_kind === "image" ? (
            <ImageField
              label="Avatar picture"
              folder="avatars"
              value={settings.avatar_url}
              onChange={(v) => onChange({ avatar_url: v })}
              hint="Square images look best. Drop one here or upload from your computer."
            />
          ) : null}

          {settings.avatar_kind !== "none" ? (
            <Choice<AvatarShape>
              label="Avatar shape"
              value={settings.avatar_shape}
              onChange={(v) => onChange({ avatar_shape: v })}
              options={[
                { key: "circle", name: "Circle" },
                { key: "rounded", name: "Rounded" },
                { key: "square", name: "Square" },
              ]}
            />
          ) : null}

          <TextArea
            label="Footer note (optional)"
            value={settings.footer_note || ""}
            rows={2}
            onChange={(v) => onChange({ footer_note: v })}
          />
        </div>
      </Panel>

      <Panel title="Background">
        <div className="space-y-4">
          <Choice<BackgroundStyle>
            label="Style"
            value={settings.background_style}
            onChange={(v) => onChange({ background_style: v })}
            options={[
              { key: "solid", name: "Solid" },
              { key: "gradient", name: "Gradient" },
              { key: "glow", name: "Glow" },
              { key: "image", name: "Image" },
            ]}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ColorField
              label={settings.background_style === "solid" ? "Colour" : "Base colour"}
              value={settings.background_color}
              onChange={(v) => onChange({ background_color: v })}
            />
            {settings.background_style === "gradient" || settings.background_style === "glow" ? (
              <ColorField
                label="Second colour"
                value={settings.background_color_alt}
                onChange={(v) => onChange({ background_color_alt: v })}
              />
            ) : null}
          </div>

          {settings.background_style === "image" ? (
            <>
              <ImageField
                label="Background picture"
                folder="backgrounds"
                aspect="wide"
                value={settings.background_image_url}
                onChange={(v) => onChange({ background_image_url: v })}
                hint="Landscape images work best. Blur and darkening keep the text readable."
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Slider
                  label="Blur"
                  value={settings.background_blur}
                  min={0}
                  max={40}
                  unit="px"
                  onChange={(v) => onChange({ background_blur: v })}
                />
                <Slider
                  label="Darken"
                  value={settings.background_overlay}
                  min={0}
                  max={90}
                  unit="%"
                  onChange={(v) => onChange({ background_overlay: v })}
                />
              </div>
            </>
          ) : null}
        </div>
      </Panel>

      <Panel title="Buttons and type">
        <div className="space-y-4">
          <Choice<ButtonStyle>
            label="Button style"
            value={settings.button_style}
            onChange={(v) => onChange({ button_style: v })}
            options={BUTTON_STYLE_OPTIONS}
          />

          <Choice<ButtonSize>
            label="Button size"
            value={settings.button_size}
            onChange={(v) => onChange({ button_size: v })}
            options={BUTTON_SIZE_OPTIONS}
          />

          <Choice<ButtonRadius>
            label="Corners"
            value={settings.button_radius}
            onChange={(v) => onChange({ button_radius: v })}
            options={BUTTON_RADIUS_OPTIONS}
          />

          <Choice<LinkFont>
            label="Font"
            value={settings.font_family}
            onChange={(v) => onChange({ font_family: v })}
            options={FONT_OPTIONS}
          />

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.show_icons}
              onChange={(event) => onChange({ show_icons: event.target.checked })}
              className="mt-0.5 w-4 h-4 accent-white cursor-pointer"
            />
            <span>
              <span className="text-xs font-semibold text-zinc-200 block">Show icons on links</span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">
                Turn this off for a plain typographic page. Thumbnails still show when set.
              </span>
            </span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ColorField
              label="Button colour"
              value={settings.button_color}
              onChange={(v) => onChange({ button_color: v })}
            />
            <ColorField
              label="Button text"
              value={settings.button_text_color}
              onChange={(v) => onChange({ button_text_color: v })}
            />
            <ColorField
              label="Accent (featured links)"
              value={settings.accent_color}
              onChange={(v) => onChange({ accent_color: v })}
            />
            <ColorField
              label="Page text"
              value={settings.text_color}
              onChange={(v) => onChange({ text_color: v })}
            />
          </div>
        </div>
      </Panel>

      <Panel title="Sharing and search">
        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.share_enabled}
              onChange={(event) => onChange({ share_enabled: event.target.checked })}
              className="mt-0.5 w-4 h-4 accent-white cursor-pointer"
            />
            <span>
              <span className="text-xs font-semibold text-zinc-200 block">Show the share button</span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">
                Gives visitors a copy button, the system share menu and a downloadable QR code.
              </span>
            </span>
          </label>

          <Field
            label="Search title"
            value={settings.seo_title || ""}
            placeholder="ABRAM Links"
            onChange={(v) => onChange({ seo_title: v })}
          />

          <TextArea
            label="Search description"
            value={settings.seo_description || ""}
            rows={2}
            placeholder="Falls back to the bio when left empty."
            onChange={(v) => onChange({ seo_description: v })}
          />

          <ImageField
            label="Link preview picture"
            folder="previews"
            aspect="wide"
            value={settings.og_image_url}
            onChange={(v) => onChange({ og_image_url: v })}
            hint="Shown when the page is pasted into a message or post. 1200 by 630 works best."
          />

          {/* What the fields above actually produce, so they are not
              three inputs with no visible effect. */}
          <div>
            <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 block mb-1.5">
              How it will look when shared
            </span>
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02] max-w-sm">
              {ogPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ogPreview} alt="" aria-hidden="true" className="w-full h-32 object-cover" />
              ) : (
                <div className="w-full h-32 flex items-center justify-center bg-black/40 text-[10px] text-zinc-600">
                  No preview picture set
                </div>
              )}
              <div className="p-3">
                <p className="text-[9px] uppercase tracking-wider text-zinc-600">abram.network</p>
                <p className="text-xs font-semibold text-zinc-100 mt-1 line-clamp-1">
                  {(settings.seo_title?.trim() || "ABRAM Links") + " | ABRAM Network"}
                </p>
                <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-2 leading-relaxed">
                  {settings.seo_description?.trim() ||
                    settings.subheading ||
                    "Every ABRAM link in one place."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}
