"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  Download,
  Image as ImageIcon,
  Info,
  Loader2,
  RotateCcw,
  Save,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
  BACKDROP_CROPS,
  BACKDROP_DIMS,
  BACKDROP_FOCUS,
  BACKDROP_FOCUS_IDS,
  SOCIAL_BACKDROPS,
  SOCIAL_BACKDROP_IDS,
  backdropImageUrl,
  backdropThumbUrl,
  type BackdropFocus,
  type BackdropId,
} from "@/lib/social/backdrops";
import { SOCIAL_THEMES, SOCIAL_THEME_IDS, type SocialThemeId } from "@/lib/social/themes";
import {
  BACKDROP_BLURS,
  CLEAR_MAX_VEIL,
  PLATE_BLURS,
  PLATE_OPACITIES,
  QR_CONTRAST_FLOOR,
  QR_FORMATS,
  QR_FORMAT_IDS,
  QR_PLATES,
  QR_PLATE_MODES,
  QR_TEMPLATES,
  contrastRatio,
  creditLine,
  defaultQrDesign,
  getQrFormat,
  getQrTemplate,
  inkSwatch,
  inksForPlate,
  normalizeHex,
  plateBlurPixels,
  plateSwatch,
  resolveQrColors,
  specInk,
  type QrDesignSpec,
  type QrFormatId,
  type QrInkId,
  type QrPlateId,
  type QrPlateMode,
  type QrTemplateId,
} from "@/lib/crm/qrDesign";
import { measurePlate, minimumVeil, type BackdropSample } from "@/lib/crm/qrField";
import { buildQrScene } from "@/lib/crm/qrLayout";
import type { QrGuard, QrScene } from "@/lib/crm/qrScene";
import type { CrmCaptureCode, CrmProfile } from "@/lib/crm/types";
import {
  loadSceneImages,
  paintScene,
  sampleSceneBackdrop,
  scenePngBlob,
  sceneSvgDocument,
} from "./qrPaint";
import { subtitleFor } from "./codeDesign";
import { downloadFile, type Notify } from "./lib";

/**
 * The designer.
 *
 * A design is a saved spec rather than a picture, so everything here edits
 * a small object and the canvas beside it is redrawn from scratch each
 * time. Nothing is written anywhere until somebody presses save, and the
 * file only exists once somebody presses download.
 *
 * The lock screen sizes are the reason this exists. A wallpaper puts a very
 * large code in the band a phone leaves clear between the clock and the
 * torch button, so the answer to "have you got a card" is to hold up a
 * screen and let the other person point their camera at it.
 *
 * This is the body of a page rather than a dialog. Seven sizes, a photo
 * library, a palette and a live canvas is a workspace, and a workspace put
 * in a modal ends up as a scrolling box inside a scrolling box with the
 * save button somewhere below the fold. It renders at
 * `/admin/dashboard/crm/design`, and both ways in are links to that
 * address. The preview column holds still while the controls scroll under
 * it, so the picture being argued with is on screen for every control that
 * changes it.
 */

interface BackdropRow {
  id: string;
  label: string;
  storage_path: string;
  credit: string | null;
  credit_handle: string | null;
}

interface QrDesignerProps {
  code: CrmCaptureCode;
  profile: CrmProfile;
  /** The address the code carries */
  url: string;
  /** Whatever was saved against this code last time */
  saved: QrDesignSpec;
  /** Told what landed, so the page around this can hold the new baseline. */
  onSaved?: (spec: QrDesignSpec) => void;
  notify: Notify;
}

export default function QrDesigner({
  code,
  profile,
  url,
  saved,
  onSaved,
  notify,
}: QrDesignerProps) {
  const [spec, setSpec] = useState<QrDesignSpec>(saved);
  const [images, setImages] = useState<BackdropRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState<"png" | "svg" | null>(null);
  const [sample, setSample] = useState<BackdropSample | null>(null);
  /* What is in the colour field, which is not always a colour. Somebody
     halfway through typing `#1a1` has a value the renderer cannot use and
     a field that must not be yanked out from under them, so the text lives
     here and only a complete reading is written into the spec. */
  const [inkText, setInkText] = useState<string>(saved.inkCustom ?? "");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const set = useCallback(<K extends keyof QrDesignSpec>(key: K, value: QrDesignSpec[K]) => {
    setSpec((current) => ({ ...current, [key]: value }));
  }, []);

  /* ---------------- the shared image library ---------------- */

  useEffect(() => {
    let live = true;
    void (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("social_backdrop_images")
        .select("id,label,storage_path,credit,credit_handle")
        .order("created_at", { ascending: false })
        .limit(60);
      if (live && data) setImages(data as BackdropRow[]);
    })();
    return () => {
      live = false;
    };
  }, []);

  /* ---------------- the picture ---------------- */

  const photoUrl = spec.backdropImage ? backdropImageUrl(spec.backdropImage) : null;

  /* The picture is built twice and that is deliberate.

     A frosted or a clear plate cannot be judged without the pixels behind
     it, and those pixels come from drawing the backdrop. So the first pass
     is a probe: the same spec, no measurement, used only for the backdrop
     layers and for where the plate is going to sit. Neither of those
     depends on the verdict, so the probe's geometry is the final geometry.
     The second pass gets the measurement and is what goes on screen. */
  const probe: QrScene | null = useMemo(
    () => buildQrScene({ spec, url, assets: { backdropImage: photoUrl } }),
    [spec, url, photoUrl]
  );

  /* Only the backdrop settings can change the pixels under the code, so the
     measurement is keyed on those. Typing a name redraws the picture and
     leaves the reading alone, which is what keeps a live preview live. */
  const backdropKey = [
    spec.template,
    spec.format,
    spec.theme,
    spec.backdrop,
    spec.backdropImage ?? "",
    spec.backdropCrop,
    spec.backdropFocus,
    spec.backdropDim,
    spec.backdropBlur,
  ].join("|");

  useEffect(() => {
    if (!probe) return;
    let live = true;
    void (async () => {
      const measured = await sampleSceneBackdrop(probe);
      if (live) setSample(measured);
    })();
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backdropKey, url]);

  const scene: QrScene | null = useMemo(
    () =>
      buildQrScene({
        spec,
        url,
        assets: { backdropImage: photoUrl },
        sample,
        // The studio draws what was asked so a failure can be looked at.
        // Every path that writes a file gets the enforced picture instead.
        showFailures: true,
      }),
    [spec, url, photoUrl, sample]
  );

  useEffect(() => {
    if (!scene) return;
    let live = true;
    void (async () => {
      const bag = await loadSceneImages(scene);
      const canvas = canvasRef.current;
      if (!live || !canvas) return;
      canvas.width = scene.width;
      canvas.height = scene.height;
      const ctx = canvas.getContext("2d");
      if (ctx) paintScene(ctx, scene, bag);
    })();
    return () => {
      live = false;
    };
  }, [scene]);

  /* ---------------- actions ---------------- */

  const template = getQrTemplate(spec.template);
  const format = getQrFormat(spec.format);
  const inks = inksForPlate(spec.plate);
  const guard = scene?.meta.guard ?? null;

  /* ---------------- what the plate controls may offer ---------------- */

  /**
   * The same filter the ink picker has always applied, pointed at the two
   * new controls.
   *
   * An opacity that would drop the code under the floor against the
   * photograph actually behind it is removed from the list rather than
   * offered with a warning beside it, because a warning is a thing to
   * dismiss and a missing option is a thing that never happened. When the
   * list comes back empty the mode itself goes with it.
   */
  const plateChoices = useMemo(() => {
    const colors = resolveQrColors(spec, { enforce: false });
    const rect = probe?.meta.plateRect ?? null;
    const empty = {
      opacities: [] as typeof PLATE_OPACITIES,
      blurs: [] as typeof PLATE_BLURS,
      clearVeil: null as number | null,
      clearReading: null as ReturnType<typeof measurePlate> | null,
    };
    if (!sample || !rect || !probe) return empty;

    const base = {
      sample,
      rect,
      tint: colors.plate,
      ink: colors.ink,
      floor: QR_CONTRAST_FLOOR,
    };
    const blurPx = plateBlurPixels(spec.plateBlur, probe.width, probe.height);

    return {
      opacities: PLATE_OPACITIES.filter(
        (option) => measurePlate({ ...base, opacity: option.value, blurPx }).ok
      ),
      blurs: PLATE_BLURS.filter(
        (option) =>
          measurePlate({
            ...base,
            opacity: spec.plateOpacity,
            blurPx: plateBlurPixels(option.value, probe.width, probe.height),
          }).ok
      ),
      clearVeil: minimumVeil({ ...base, blurPx: 0 }, CLEAR_MAX_VEIL),
      clearReading: measurePlate({ ...base, opacity: 0, blurPx: 0 }),
    };
  }, [sample, probe, spec]);

  const measuring = template.id !== "plain" && spec.plateMode !== "solid" && !sample;
  const blocked = guard ? !guard.ok : false;

  /* Keep the frosted settings inside what the measurement allows.

     Changing the photograph changes which densities survive, and a select
     showing a value that is no longer one of its options is a control
     lying about the picture beside it. So the setting moves to the nearest
     one that does survive, which is the same thing the ink picker has
     always done when the plate changes underneath it. */
  useEffect(() => {
    if (spec.plateMode !== "frosted" || !sample) return;
    const okOpacity = plateChoices.opacities.some((o) => o.value === spec.plateOpacity);
    const okBlur = plateChoices.blurs.some((b) => b.value === spec.plateBlur);
    if (okOpacity && okBlur) return;
    setSpec((current) => ({
      ...current,
      plateOpacity:
        okOpacity || plateChoices.opacities.length === 0
          ? current.plateOpacity
          : plateChoices.opacities[0].value,
      plateBlur:
        okBlur || plateChoices.blurs.length === 0 ? current.plateBlur : plateChoices.blurs[0].value,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plateChoices, spec.plateMode, sample]);

  const save = async () => {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("crm_capture_codes")
      .update({ design: spec })
      .eq("id", code.id);
    setSaving(false);

    if (error) {
      // The column is additive and may not be there on an older database.
      // Losing the saved design is worth saying plainly; it does not stop
      // anyone downloading the file they are looking at.
      notify(
        /column/i.test(error.message)
          ? "This database has no place to keep a design yet. You can still download the file."
          : error.message,
        "error"
      );
      return;
    }
    notify("Design saved against this code.", "success");
    onSaved?.(spec);
  };

  const savePng = async () => {
    if (!scene) return;
    setExporting("png");
    const blob = await scenePngBlob(scene);
    setExporting(null);
    if (!blob) {
      notify("That design could not be drawn as a PNG.", "error");
      return;
    }
    downloadFile(`qr-${code.code}-${spec.format}.png`, "image/png", blob);
  };

  const saveSvg = async () => {
    if (!scene) return;
    setExporting("svg");
    const svg = await sceneSvgDocument(scene);
    setExporting(null);
    downloadFile(`qr-${code.code}-${spec.format}.svg`, "image/svg+xml", svg);
  };

  const reset = () => {
    setInkText("");
    setSpec(
      defaultQrDesign({
        name: profile.full_name,
        subtitle: subtitleFor(profile),
      })
    );
  };

  /* ---------------- the workspace ---------------- */

  /* Preview first in the source, so a phone gets the picture before the
     controls with no ordering classes to keep in step. On a wide screen the
     same element is the sticky one.

     Two things make that stick. The grid is `items-start`, so the column is
     only as tall as its own contents and has room to travel inside a row
     track sized by the controls beside it. And no ancestor between here and
     the page's scrolling container sets `overflow`, which would silently
     take the stickiness away. */
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-4 lg:gap-6 items-start">
      {/* -------- preview -------- */}
      <div className="lg:sticky lg:top-6 min-w-0">
        <div className="glass-panel rounded-2xl border-white/8 p-4 sm:p-5 space-y-4 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
          <div className="flex items-center justify-center min-h-[220px]">
            {scene ? (
              <canvas
                ref={canvasRef}
                aria-label="Preview of the designed code"
                className="max-w-full max-h-[46vh] w-auto h-auto rounded-xl shadow-2xl shadow-black/60"
              />
            ) : (
              <p className="text-xs text-zinc-500 text-center max-w-xs">
                That address is too long to encode. Shorten the code token and try again.
              </p>
            )}
          </div>

          {scene && guard && (
            <dl className="grid grid-cols-2 gap-2 text-[10px]">
              <Readout label="Output" value={`${scene.width} by ${scene.height}`} />
              <Readout label="One module" value={`${scene.meta.modulePx}px`} />
              <Readout label="Quiet zone" value={`${scene.meta.quietPx}px, four modules`} />
              <Readout
                label={guard.measured ? "Worst square" : "Contrast"}
                value={`${guard.contrast.toFixed(1)} to 1, floor ${QR_CONTRAST_FLOOR}`}
                tone={guard.ok ? "normal" : "bad"}
              />
            </dl>
          )}

          {/* What the guard decided, in words, right under the picture it
              decided about. A number on its own tells somebody a code is
              wrong; it does not tell them which corner of the photograph
              did it or what to change. */}
          {guard && guard.reasons.length > 0 && (
            <div
              className={`rounded-xl border px-3 py-2.5 ${
                guard.ok ? "border-white/8 bg-white/[0.02]" : "border-red-500/30 bg-red-500/[0.06]"
              }`}
            >
              <div className="flex items-start gap-2">
                {guard.ok ? (
                  <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 space-y-1">
                  {guard.reasons.map((reason) => (
                    <p
                      key={reason}
                      className={`text-[11px] leading-relaxed break-words ${
                        guard.ok ? "text-zinc-400" : "text-red-200"
                      }`}
                    >
                      {reason}
                    </p>
                  ))}
                  {!guard.ok && (
                    <p className="text-[10px] text-zinc-500 leading-relaxed">
                      Saving and downloading are held until this clears.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Saving and downloading travel with the picture rather than
              sitting at the foot of the controls, so whatever is on screen
              can be kept or exported without scrolling back for a button. */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving || blocked}
              className="btn-primary px-4 min-h-[44px] sm:min-h-[36px] text-xs rounded-full disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Save design
            </button>
            <button
              type="button"
              onClick={() => void savePng()}
              disabled={!scene || exporting !== null || blocked}
              className="btn-glass px-4 min-h-[44px] sm:min-h-[36px] text-xs font-semibold rounded-full disabled:opacity-50"
            >
              {exporting === "png" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              PNG
            </button>
            <button
              type="button"
              onClick={() => void saveSvg()}
              disabled={!scene || exporting !== null || blocked}
              className="btn-glass px-4 min-h-[44px] sm:min-h-[36px] text-xs font-semibold rounded-full disabled:opacity-50"
            >
              {exporting === "svg" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ImageIcon className="w-3.5 h-3.5" />
              )}
              SVG
            </button>
            <button
              type="button"
              onClick={reset}
              className="btn-ghost px-4 min-h-[44px] sm:min-h-[36px] text-xs font-semibold rounded-full ml-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Start over
            </button>
          </div>
        </div>
      </div>

      {/* -------- controls -------- */}
      <div className="glass-panel rounded-2xl border-white/8 p-4 sm:p-6 space-y-6 min-w-0">
        <Group title="Template" hint={template.blurb}>
          <Pills
            options={QR_TEMPLATES.map((t) => ({ id: t.id, label: t.label }))}
            value={spec.template}
            onChange={(id) => set("template", id as QrTemplateId)}
          />
        </Group>

        <Group
          title="Size"
          hint={[format.usedFor, format.printNote, format.safeNote].filter(Boolean).join(" ")}
        >
          <select
            value={spec.format}
            aria-label="Size"
            onChange={(e) => set("format", e.target.value as QrFormatId)}
            className="admin-input h-11 sm:h-9 py-0 cursor-pointer"
          >
            <optgroup label="Phone lock screen">
              {QR_FORMAT_IDS.filter((id) => QR_FORMATS[id].kind === "wallpaper").map((id) => (
                <option key={id} value={id}>
                  {QR_FORMATS[id].label} ({QR_FORMATS[id].width} by {QR_FORMATS[id].height})
                </option>
              ))}
            </optgroup>
            <optgroup label="Print">
              {QR_FORMAT_IDS.filter((id) => QR_FORMATS[id].kind === "print").map((id) => (
                <option key={id} value={id}>
                  {QR_FORMATS[id].label} ({QR_FORMATS[id].width} by {QR_FORMATS[id].height})
                </option>
              ))}
            </optgroup>
            <optgroup label="Share">
              {QR_FORMAT_IDS.filter((id) => QR_FORMATS[id].kind === "share").map((id) => (
                <option key={id} value={id}>
                  {QR_FORMATS[id].label} ({QR_FORMATS[id].width} by {QR_FORMATS[id].height})
                </option>
              ))}
            </optgroup>
          </select>
        </Group>

        {template.usesTheme && (
          <Group title="Palette" hint="The same palettes the social cards are drawn in.">
            <div className="flex flex-wrap gap-2">
              {SOCIAL_THEME_IDS.map((id) => (
                <Swatch
                  key={id}
                  label={SOCIAL_THEMES[id].label}
                  color={SOCIAL_THEMES[id].swatch}
                  active={spec.theme === id}
                  onClick={() => set("theme", id as SocialThemeId)}
                />
              ))}
            </div>
          </Group>
        )}

        {template.usesBackdrop && (
          <Group
            title="Backdrop"
            hint="Drawn backdrops need no file. A photograph from the library is credited on the card."
          >
            <div className="flex flex-wrap gap-2">
              {SOCIAL_BACKDROP_IDS.map((id) => (
                <Swatch
                  key={id}
                  label={SOCIAL_BACKDROPS[id].label}
                  color={SOCIAL_BACKDROPS[id].swatch}
                  active={!spec.backdropImage && spec.backdrop === id}
                  onClick={() => {
                    setSpec((current) => ({
                      ...current,
                      backdrop: id as BackdropId,
                      backdropImage: null,
                      backdropCredit: null,
                    }));
                  }}
                />
              ))}
            </div>

            {images.length > 0 && (
              <div className="mt-3">
                <span className="block text-[10px] text-zinc-600 mb-2">
                  From the shared image library
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {images.map((image) => {
                    const active = spec.backdropImage === image.storage_path;
                    return (
                      <button
                        key={image.id}
                        type="button"
                        title={`${image.label}${
                          creditLine(image.credit, image.credit_handle)
                            ? ` by ${creditLine(image.credit, image.credit_handle)}`
                            : ""
                        }`}
                        onClick={() =>
                          setSpec((current) => ({
                            ...current,
                            backdropImage: image.storage_path,
                            backdropCredit: creditLine(image.credit, image.credit_handle) || null,
                          }))
                        }
                        className={`relative aspect-square rounded-lg overflow-hidden border min-h-[44px] ${
                          active ? "border-white/60" : "border-white/10 hover:border-white/25"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={backdropThumbUrl(image.storage_path, { width: 160 })}
                          alt={image.label}
                          className="w-full h-full object-cover"
                        />
                        {active && (
                          <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <Check className="w-3.5 h-3.5 text-white" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {spec.backdropImage && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <Mini label="Crop">
                  <select
                    value={String(spec.backdropCrop)}
                    aria-label="Crop"
                    onChange={(e) => set("backdropCrop", Number(e.target.value))}
                    className="admin-input h-11 sm:h-9 py-0 cursor-pointer"
                  >
                    {BACKDROP_CROPS.map((crop) => (
                      <option key={crop.value} value={crop.value}>
                        {crop.label}
                      </option>
                    ))}
                  </select>
                </Mini>
                <Mini label="Focus">
                  <select
                    value={spec.backdropFocus}
                    aria-label="Focus"
                    onChange={(e) => set("backdropFocus", e.target.value as BackdropFocus)}
                    className="admin-input h-11 sm:h-9 py-0 cursor-pointer"
                  >
                    {BACKDROP_FOCUS_IDS.map((id) => (
                      <option key={id} value={id}>
                        {BACKDROP_FOCUS[id].label}
                      </option>
                    ))}
                  </select>
                </Mini>
                <Mini label="Darkening">
                  <select
                    value={String(spec.backdropDim)}
                    aria-label="Darkening"
                    onChange={(e) => set("backdropDim", Number(e.target.value))}
                    className="admin-input h-11 sm:h-9 py-0 cursor-pointer"
                  >
                    {BACKDROP_DIMS.map((dim) => (
                      <option key={dim.value} value={dim.value}>
                        {dim.label}
                      </option>
                    ))}
                  </select>
                </Mini>
                <Mini label="Focus depth">
                  <select
                    value={String(spec.backdropBlur)}
                    aria-label="Focus depth"
                    onChange={(e) => set("backdropBlur", Number(e.target.value))}
                    className="admin-input h-11 sm:h-9 py-0 cursor-pointer"
                  >
                    {BACKDROP_BLURS.map((blur) => (
                      <option key={blur.value} value={blur.value}>
                        {blur.label}
                      </option>
                    ))}
                  </select>
                </Mini>
              </div>
            )}

            {spec.backdropImage && (
              <p className="mt-2 text-[10px] text-zinc-600 leading-relaxed">
                Throwing the photograph out of focus is what makes the code read as the
                subject. The plate, the code and the type stay sharp whatever this is set to.
              </p>
            )}
          </Group>
        )}

        <Group
          title="The code itself"
          hint={`Every choice here is filtered against a ${QR_CONTRAST_FLOOR} to 1 floor. A pairing that would drop under it is removed rather than warned about.`}
        >
          <span className="block text-[10px] text-zinc-600 mb-1.5">Plate</span>
          <div className="flex flex-wrap gap-2">
            {QR_PLATES.map((plate) => (
              <Swatch
                key={plate.id}
                label={plate.label}
                color={plate.hex}
                active={spec.plate === plate.id}
                onClick={() => {
                  setSpec((current) => {
                    const allowed = inksForPlate(plate.id);
                    const keep = allowed.some((i) => i.id === current.ink);
                    return {
                      ...current,
                      plate: plate.id as QrPlateId,
                      ink: keep ? current.ink : allowed[0].id,
                    };
                  });
                }}
              />
            ))}
          </div>

          {/* ---- how solid the plate is ---- */}
          {template.id !== "plain" && (
            <>
              <span className="block text-[10px] text-zinc-600 mt-3 mb-1.5">How solid it is</span>
              <div className="flex flex-wrap gap-2">
                {QR_PLATE_MODES.map((mode) => {
                  // A mode already chosen stays clickable even when the
                  // measurement has turned against it, so the reason under
                  // the picture belongs to something still on screen.
                  const off =
                    spec.plateMode !== mode.id &&
                    ((mode.id === "frosted" &&
                      sample !== null &&
                      plateChoices.opacities.length === 0) ||
                      (mode.id === "clear" && sample !== null && plateChoices.clearVeil === null));
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      disabled={off}
                      title={
                        off
                          ? mode.id === "frosted"
                            ? "No frosted setting stays readable over this picture."
                            : "This picture cannot carry a clear code."
                          : mode.blurb
                      }
                      onClick={() => set("plateMode", mode.id as QrPlateMode)}
                      className={`px-4 min-h-[44px] sm:min-h-[34px] text-[11px] font-semibold rounded-full border transition-colors ${
                        off
                          ? "bg-white/[0.01] text-zinc-700 border-white/5 cursor-not-allowed line-through"
                          : spec.plateMode === mode.id
                            ? "bg-white text-black border-white"
                            : "bg-white/[0.03] text-zinc-400 border-white/10 hover:border-white/25"
                      }`}
                    >
                      {mode.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-zinc-600 leading-relaxed mt-2">
                {QR_PLATE_MODES.find((m) => m.id === spec.plateMode)?.blurb}
              </p>

              {measuring && (
                <p className="text-[10px] text-zinc-500 leading-relaxed mt-1.5">
                  Reading the picture behind the code...
                </p>
              )}

              {spec.plateMode === "frosted" && sample && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Mini label="How dense">
                    <select
                      value={String(spec.plateOpacity)}
                      aria-label="How dense the plate is"
                      onChange={(e) => set("plateOpacity", Number(e.target.value))}
                      className="admin-input h-11 sm:h-9 py-0 cursor-pointer"
                    >
                      {plateChoices.opacities.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label} ({Math.round(option.value * 100)}%)
                        </option>
                      ))}
                    </select>
                  </Mini>
                  <Mini label="Blur behind it">
                    <select
                      value={String(spec.plateBlur)}
                      aria-label="Blur behind the plate"
                      onChange={(e) => set("plateBlur", Number(e.target.value))}
                      className="admin-input h-11 sm:h-9 py-0 cursor-pointer"
                    >
                      {plateChoices.blurs.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Mini>
                </div>
              )}

              {spec.plateMode === "frosted" && (
                <p className="mt-2 text-[10px] text-zinc-600 leading-relaxed">
                  The blur is what makes this safe. It flattens the picture under the code into an
                  even field, and only settings measured above the floor against that field appear
                  in these two lists.
                </p>
              )}

              {spec.plateMode === "clear" && plateChoices.clearReading && (
                <p className="mt-2 text-[10px] text-zinc-600 leading-relaxed">
                  Measured square by square rather than as an average, because one bright corner is
                  what stops a code decoding. Bare, this picture reads{" "}
                  {plateChoices.clearReading.min.toFixed(1)} to 1 at its worst and{" "}
                  {plateChoices.clearReading.avg.toFixed(1)} to 1 on average.
                </p>
              )}
            </>
          )}

          <span className="block text-[10px] text-zinc-600 mt-4 mb-1.5">Ink</span>
          <div className="flex flex-wrap gap-2">
            {inks.map((ink) => (
              <Swatch
                key={ink.id}
                label={ink.label}
                color={ink.hex}
                active={!spec.inkCustom && spec.ink === ink.id}
                onClick={() =>
                  setSpec((current) => ({
                    ...current,
                    ink: ink.id as QrInkId,
                    inkCustom: null,
                  }))
                }
              />
            ))}
          </div>

          {/* ---- a colour rather than a preset ---- */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 pl-1.5 pr-3 min-h-[44px] sm:min-h-[34px] rounded-full border border-white/10 hover:border-white/25 transition-colors cursor-pointer">
              <input
                type="color"
                aria-label="Pick an ink colour"
                value={spec.inkCustom ?? inkSwatch(spec.ink).hex}
                onChange={(e) => {
                  setInkText(e.target.value.toUpperCase());
                  set("inkCustom", normalizeHex(e.target.value));
                }}
                className="w-5 h-5 rounded-full border border-white/15 bg-transparent p-0 cursor-pointer shrink-0"
              />
              <span className="text-[11px] font-medium text-zinc-400">Own colour</span>
            </label>
            <input
              value={inkText}
              onChange={(e) => {
                setInkText(e.target.value);
                const parsed = normalizeHex(e.target.value);
                if (parsed || e.target.value.trim() === "") set("inkCustom", parsed);
              }}
              placeholder="#1B2A4A"
              maxLength={7}
              aria-label="Ink colour as a hex value"
              className="admin-input h-11 sm:h-9 py-0 w-32 font-mono"
            />
            {spec.inkCustom && (
              <button
                type="button"
                onClick={() => {
                  setInkText("");
                  set("inkCustom", null);
                }}
                className="btn-ghost px-3 min-h-[44px] sm:min-h-[34px] text-[11px] font-semibold rounded-full"
              >
                Back to presets
              </button>
            )}
          </div>

          <p className="mt-2 text-[10px] text-zinc-600 leading-relaxed">
            {inkContrastNote(spec, guard)}
          </p>

          <label className="flex items-start gap-2.5 mt-4 cursor-pointer">
            <input
              type="checkbox"
              checked={spec.mark}
              onChange={(e) => set("mark", e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-white shrink-0"
            />
            <span className="text-[11px] text-zinc-400 leading-relaxed">
              Put the ABRAM mark in the middle of the code.
              <span className="block text-zinc-600">
                {scene && scene.meta.cutArea > 0
                  ? `It covers ${(scene.meta.cutArea * 100).toFixed(1)}% of the code, which the error correction rebuilds.`
                  : "A small centre cutout, kept far inside what the error correction can rebuild."}
              </span>
            </span>
          </label>
        </Group>

        <Group title="What it says" hint="Enough that somebody who cannot scan can still read who you are.">
          <div className="space-y-2.5">
            <Mini label="Line above the code">
              <input
                value={spec.prompt}
                onChange={(e) => set("prompt", e.target.value)}
                maxLength={80}
                className="admin-input h-11 sm:h-9 py-0"
              />
            </Mini>
            <Mini label="Name">
              <input
                value={spec.name}
                onChange={(e) => set("name", e.target.value)}
                maxLength={80}
                className="admin-input h-11 sm:h-9 py-0"
              />
            </Mini>
            <Mini label="Role and company">
              <input
                value={spec.subtitle}
                onChange={(e) => set("subtitle", e.target.value)}
                maxLength={120}
                className="admin-input h-11 sm:h-9 py-0"
              />
            </Mini>
            <label className="flex items-center gap-2.5 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={spec.showUrl}
                onChange={(e) => set("showUrl", e.target.checked)}
                className="w-4 h-4 accent-white shrink-0"
              />
              <span className="text-[11px] text-zinc-400">
                Print the address under the caption
              </span>
            </label>
          </div>
        </Group>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Group({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500 mb-1.5">
        {title}
      </h3>
      {hint && <p className="text-[11px] text-zinc-600 leading-relaxed mb-2.5">{hint}</p>}
      {children}
    </section>
  );
}

function Mini({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

function Pills({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={`px-4 min-h-[44px] sm:min-h-[34px] text-[11px] font-semibold rounded-full border transition-colors ${
            value === option.id
              ? "bg-white text-black border-white"
              : "bg-white/[0.03] text-zinc-400 border-white/10 hover:border-white/25"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Swatch({
  label,
  color,
  active,
  onClick,
}: {
  label: string;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-2 pl-1.5 pr-3 min-h-[44px] sm:min-h-[34px] rounded-full border text-[11px] font-medium transition-colors ${
        active
          ? "border-white/60 text-white bg-white/[0.06]"
          : "border-white/10 text-zinc-400 hover:border-white/25"
      }`}
    >
      <span
        aria-hidden="true"
        className="w-5 h-5 rounded-full border border-white/15 shrink-0"
        style={{ background: color }}
      />
      {label}
    </button>
  );
}

function Readout({
  label,
  value,
  tone = "normal",
}: {
  label: string;
  value: string;
  tone?: "normal" | "bad";
}) {
  return (
    <div
      className={`rounded-lg border px-2.5 py-1.5 ${
        tone === "bad" ? "border-red-500/30 bg-red-500/[0.06]" : "border-white/5 bg-white/[0.02]"
      }`}
    >
      <dt className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600">{label}</dt>
      <dd
        className={`text-[11px] font-mono mt-0.5 truncate ${
          tone === "bad" ? "text-red-200" : "text-zinc-300"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

/**
 * The contrast sentence under the ink control.
 *
 * A ratio on its own is a number somebody has to be taught to read. What
 * this says instead is which two things were compared, what came out, and
 * what happens next, because the person choosing a colour is choosing it
 * for how it looks and needs to be told in words why the answer is no.
 */
function inkContrastNote(spec: QrDesignSpec, guard: QrGuard | null): string {
  const ink = specInk(spec);
  const flat = contrastRatio(ink, plateSwatch(spec.plate).hex);
  const floor = `${QR_CONTRAST_FLOOR} to 1`;

  if (!guard || !guard.measured) {
    return guard && !guard.ok
      ? `This ink reads ${flat.toFixed(1)} to 1 against the plate. The floor is ${floor}, so the code would come out too faint to read across a hall and cannot be saved.`
      : `This ink reads ${flat.toFixed(1)} to 1 against the plate, clear of the ${floor} floor.`;
  }

  return guard.ok
    ? `Against the darkest square under the code this ink reads ${guard.contrast.toFixed(
        1
      )} to 1, clear of the ${floor} floor. Flat on the plate it would read ${flat.toFixed(1)} to 1.`
    : `Against the darkest square under the code this ink reads ${guard.contrast.toFixed(
        1
      )} to 1. The floor is ${floor}, so this cannot be saved or downloaded.`;
}
