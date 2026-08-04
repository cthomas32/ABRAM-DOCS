"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Copy,
  Download,
  ChevronLeft,
  Layers,
  Loader2,
  MonitorSmartphone,
  Plus,
  Save,
  Square,
  Trash2,
} from "lucide-react";
import { SOCIAL_FORMATS, SOCIAL_FORMAT_IDS, hasSafeArea, type SocialFormatId } from "@/lib/social/formats";
import { SOCIAL_THEMES, SOCIAL_THEME_IDS, type SocialThemeId } from "@/lib/social/themes";
import {
  DEFAULT_BACKDROP_BASE,
  DEFAULT_DIM,
  DEFAULT_FOCUS,
  type BackdropFocus,
  type BackdropId,
} from "@/lib/social/backdrops";
import { DEFAULT_PLACEMENT, PLACEMENTS, PLACEMENT_IDS, canCentre, type PlacementId } from "@/lib/social/placement";
import {
  SOCIAL_DESTINATIONS,
  SOCIAL_DESTINATION_IDS,
  type SocialDestinationId,
} from "@/lib/social/platforms";
import {
  BRAND_KINDS,
  BRAND_SCALES,
  EMPTY_SPEC,
  LIST_FIELDS,
  MAX_ITEMS,
  MAX_SLIDES,
  MOCKUPS,
  MOCKUP_GROUPS,
  SOCIAL_TEMPLATES,
  SOCIAL_TEMPLATE_IDS,
  TYPE_SCALES,
  type CreditSide,
  canToggleMockup,
  drawsMockup,
  mockupsInGroup,
  normalizeSpec,
  specToFilename,
  specToRenderPath,
  type SocialImageSpec,
  type BrandKind,
  type SocialSpecField,
  type SocialTemplateId,
} from "@/lib/social/spec";
import { CAROUSEL_PRESETS, SOCIAL_PRESETS } from "@/lib/social/presets";
import { saveAsset, saveCarousel } from "@/app/admin/dashboard/social/actions";
import BackdropPicker, { type BackdropState } from "./BackdropPicker";

/**
 * The studio: copy on the left, the card on the right, redrawn as you type.
 *
 * The preview is an `<img>` pointing at the render route rather than a
 * canvas re-implementation of the card. There is exactly one renderer, so
 * what you approve is what you were looking at.
 *
 * The controls are in three groups rather than one column. There are
 * thirty of them now, and stacked in a single scroll they read as a
 * settings screen: the thing you are looking for is always somewhere below
 * the fold and never twice in the same place. Grouped, each panel holds
 * four or five decisions and the preview stays put beside all of them.
 */

export type StudioMode = "single" | "carousel";

/** Which group of controls is open. The preview does not move between them. */
type Panel = "post" | "words" | "look";

const PANELS: { id: Panel; label: string; note: string }[] = [
  { id: "post", label: "Post", note: "Where it goes, and how big" },
  { id: "words", label: "Words", note: "The layout and the copy on it" },
  { id: "look", label: "Look", note: "Colour, backdrop, size and placement" },
];

export interface StudioSeed {
  mode: StudioMode;
  title: string;
  note: string;
  format: SocialFormatId;
  theme: SocialThemeId;
  backdrop: BackdropId;
  backdropImage: string;
  backdropCrop: number;
  backdropFocus: BackdropFocus;
  backdropDim: number;
  backdropBase: string;
  backdropCredit: string;
  backdropCreditSide: CreditSide;
  placement: PlacementId;
  grain: boolean;
  typeScale: number;
  brandScale: number;
  slides: SocialImageSpec[];
  /** Set when editing something already in the library */
  assetId?: string;
  setId?: string;
}

export function blankSeed(): StudioSeed {
  return {
    mode: "single",
    title: "",
    note: "",
    format: "square",
    theme: "midnight",
    backdrop: "none",
    backdropImage: "",
    backdropCrop: 1,
    backdropFocus: DEFAULT_FOCUS,
    backdropDim: DEFAULT_DIM,
    backdropBase: DEFAULT_BACKDROP_BASE,
    backdropCredit: "",
    backdropCreditSide: "left",
    placement: DEFAULT_PLACEMENT,
    grain: false,
    typeScale: 1,
    brandScale: 1,
    slides: [normalizeSpec({ ...EMPTY_SPEC })],
  };
}

const LABEL = "text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500";
const HINT = "text-[11px] text-zinc-600 leading-relaxed";
const WARN = "text-[11px] text-amber-400/80 leading-relaxed";
const INPUT =
  "w-full bg-white/[0.03] border border-white/8 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-colors";

function Chip({
  active,
  onClick,
  children,
  title,
  muted,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
  /** Still selectable, just not what this surface wants */
  muted?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-colors min-h-[44px] sm:min-h-[36px] ${
        active
          ? "bg-white text-black border-white"
          : muted
            ? "bg-transparent text-zinc-600 border-white/5 hover:text-zinc-300 hover:border-white/15"
            : "bg-white/[0.03] text-zinc-400 border-white/8 hover:text-zinc-200 hover:border-white/15"
      }`}
    >
      {children}
    </button>
  );
}

/** One control with its label above it and its explanation under it. */
function Group({
  label,
  hint,
  warn,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  warn?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className={LABEL}>{label}</span>
      {children}
      {hint ? <span className={HINT}>{hint}</span> : null}
      {warn ? <span className={WARN}>{warn}</span> : null}
    </div>
  );
}

function Field({
  label,
  hint,
  value,
  limit,
  onChange,
  multiline,
  placeholder,
}: {
  label: string;
  hint?: string;
  value: string;
  limit?: number;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  const over = limit ? value.length > limit : false;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className={LABEL}>{label}</span>
        {limit ? (
          <span className={`text-[10px] tabular-nums ${over ? "text-amber-400" : "text-zinc-600"}`}>
            {value.length}/{limit}
          </span>
        ) : null}
      </div>
      {multiline ? (
        <textarea
          value={value}
          rows={3}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`${INPUT} resize-y leading-relaxed`}
        />
      ) : (
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={INPUT}
        />
      )}
      {hint ? <span className={HINT}>{hint}</span> : null}
    </div>
  );
}

/**
 * Placement, drawn rather than named.
 *
 * Six words in a row would be six words to read and compare. Six small
 * cards with the type roughed in where it will land is one glance, and it
 * is also the only honest way to show that "top centre" and "middle left"
 * are the same decision made twice.
 */
function PlacementGrid({
  value,
  onChange,
  centringIgnored,
}: {
  value: PlacementId;
  onChange: (next: PlacementId) => void;
  centringIgnored: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 max-w-[280px]">
      {PLACEMENT_IDS.map((id) => {
        const p = PLACEMENTS[id];
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            title={p.label}
            aria-label={p.label}
            className={`aspect-[4/3] rounded-lg border p-2 flex flex-col gap-1 transition-colors ${
              active
                ? "bg-white/10 border-white"
                : "bg-white/[0.02] border-white/8 hover:border-white/25"
            }`}
            style={{
              justifyContent:
                p.vertical === "start" ? "flex-start" : p.vertical === "end" ? "flex-end" : "center",
              alignItems: p.align === "center" ? "center" : "flex-start",
            }}
          >
            <span className={`block h-[3px] w-3/5 rounded-full ${active ? "bg-white" : "bg-zinc-600"}`} />
            <span className={`block h-[3px] w-2/5 rounded-full ${active ? "bg-white/60" : "bg-zinc-700"}`} />
          </button>
        );
      })}
      {centringIgnored ? (
        <span className={`${WARN} col-span-3`}>
          This layout is a set of lines to read down, so it keeps its left edge. Centring applies to the
          poster, hook, statement, quote, stat and definition cards.
        </span>
      ) : null}
    </div>
  );
}

const FIELD_META: Record<
  SocialSpecField,
  { label: string; hint?: string; multiline?: boolean; placeholder?: string; itemPlaceholder?: string }
> = {
  eyebrow: { label: "Eyebrow", placeholder: "FOR PRODUCERS" },
  headline: {
    label: "Headline",
    hint: "Say what the reader walks away with. Give them a reason to want the rest of it.",
    placeholder: "Leave set without the call sheet still to do",
  },
  headlineAccent: {
    label: "Second line",
    hint: "Finish the sentence. Never use it to say what the thing is not.",
    placeholder: "from the week's paperwork.",
  },
  body: { label: "Body", multiline: true, placeholder: "One or two sentences on what changes for them." },
  items: {
    label: "Points",
    hint: `Up to ${MAX_ITEMS}. One idea each.`,
    itemPlaceholder: "One seat and one active project",
  },
  itemsB: {
    label: "Right column",
    hint: "What changes. Same number of lines as the left, roughly.",
    itemPlaceholder: "The sheet is built from the schedule you already made",
  },
  labelA: {
    label: "Left heading",
    hint: "Describe a real week here. A straw man is worse than no card.",
    placeholder: "How it goes now",
  },
  labelB: { label: "Right heading", placeholder: "With ABRAM" },
  stat: { label: "The number", hint: "Only a figure you measured. No invented metrics.", placeholder: "12 min" },
  attribution: { label: "Attribution", placeholder: "From the August release notes" },
  footnote: { label: "Footer, left", hint: "The invitation. Keep it short.", placeholder: "Free plan. No card." },
  cta: { label: "Footer, right", placeholder: "abram.network" },
};

/** The left column of a comparison is `items`, so it gets a different label there. */
function fieldLabel(field: SocialSpecField, template: SocialTemplateId): string {
  if (field === "items") {
    if (template === "compare") return "Left column";
    if (template === "steps") return "Steps";
    if (template === "grid") return "The four things";
  }
  return FIELD_META[field].label;
}

export default function SocialStudio({
  seed,
  onSaved,
  onNotify,
}: {
  seed: StudioSeed;
  onSaved: (message: string, tone: "success" | "error") => void;
  /**
   * Says something without moving anybody. `onSaved` sends you to the
   * library, which is right after a save and wrong after an upload.
   */
  onNotify: (message: string, tone: "success" | "error") => void;
}) {
  const [panel, setPanel] = useState<Panel>("post");
  const [mode, setMode] = useState<StudioMode>(seed.mode);
  const [title, setTitle] = useState(seed.title);
  const [note, setNote] = useState(seed.note);
  const [format, setFormat] = useState<SocialFormatId>(seed.format);
  const [theme, setTheme] = useState<SocialThemeId>(seed.theme);
  /**
   * Everything behind the card belongs to the set, the same way the palette
   * does: a carousel with a different sky on every slide is six posts.
   */
  const [backing, setBacking] = useState<BackdropState>({
    backdrop: seed.backdrop,
    backdropImage: seed.backdropImage,
    backdropCrop: seed.backdropCrop,
    backdropFocus: seed.backdropFocus,
    backdropDim: seed.backdropDim,
    backdropBase: seed.backdropBase,
    backdropCredit: seed.backdropCredit,
    backdropCreditSide: seed.backdropCreditSide,
  });
  const [grain, setGrain] = useState(seed.grain);
  /** Type size, mark size and placement are set-level too, for the same reason. */
  const [typeScale, setTypeScale] = useState(seed.typeScale);
  const [brandScale, setBrandScale] = useState(seed.brandScale);
  const [placement, setPlacement] = useState<PlacementId>(seed.placement);
  /**
   * Where the card is headed. It is editorial rather than part of the
   * spec: it picks the size and colours the advice, and nothing about the
   * rendered PNG depends on it, so it is deliberately not saved.
   */
  const [destination, setDestination] = useState<SocialDestinationId>("instagram-feed");
  const [slides, setSlides] = useState<SocialImageSpec[]>(seed.slides);
  const [active, setActive] = useState(0);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Reloading the editor from the library replaces everything at once.
  useEffect(() => {
    setMode(seed.mode);
    setTitle(seed.title);
    setNote(seed.note);
    setFormat(seed.format);
    setTheme(seed.theme);
    setBacking({
      backdrop: seed.backdrop,
      backdropImage: seed.backdropImage,
      backdropCrop: seed.backdropCrop,
      backdropFocus: seed.backdropFocus,
      backdropDim: seed.backdropDim,
      backdropBase: seed.backdropBase,
      backdropCredit: seed.backdropCredit,
      backdropCreditSide: seed.backdropCreditSide,
    });
    setGrain(seed.grain);
    setTypeScale(seed.typeScale);
    setBrandScale(seed.brandScale);
    setPlacement(seed.placement);
    setSlides(seed.slides);
    setActive(0);
  }, [seed]);

  const isCarousel = mode === "carousel";
  const current = slides[Math.min(active, slides.length - 1)] ?? slides[0];
  const template = SOCIAL_TEMPLATES[current.template];
  const place = SOCIAL_DESTINATIONS[destination];
  const suitsPlace = place.suits.includes(current.template);
  const onBacking = backing.backdrop !== "none" || Boolean(backing.backdropImage);
  const showDemo = drawsMockup(current);

  /**
   * The optional fields somebody has asked for on this card.
   *
   * A field counts as on when it holds something, so a card that already
   * has an eyebrow opens with the box showing. `revealed` covers the gap
   * between switching one on and typing into it, and starts empty again on
   * every slide and every change of layout: a switch that stayed on from
   * the last card is how the eyebrow got onto everything in the first place.
   */
  const optionalFields = template.optional ?? [];
  const [revealed, setRevealed] = useState<SocialSpecField[]>([]);
  useEffect(() => setRevealed([]), [active, current.template]);

  const extras = optionalFields.filter(
    (field) => revealed.includes(field) || String(current[field] ?? "").length > 0
  );
  /** The eyebrow draws above the headline, so it is asked for above it too. */
  const shownFields: SocialSpecField[] = [...extras, ...template.fields];

  /** Format and theme belong to the set, so they are stitched in here rather than stored per slide. */
  const specAt = useCallback(
    (index: number): SocialImageSpec =>
      normalizeSpec({
        ...slides[index],
        format,
        theme,
        ...backing,
        grain,
        typeScale,
        brandScale,
        placement,
        slideIndex: isCarousel ? index + 1 : 0,
        slideCount: isCarousel ? slides.length : 0,
      }),
    [slides, format, theme, backing, grain, typeScale, brandScale, placement, isCarousel]
  );

  const currentSpec = useMemo(
    () => specAt(Math.min(active, slides.length - 1)),
    [specAt, active, slides.length]
  );

  const patch = (changes: Partial<SocialImageSpec>) => {
    setSlides((prev) => prev.map((slide, i) => (i === active ? { ...slide, ...changes } : slide)));
  };

  const setItem = (field: "items" | "itemsB", index: number, value: string) => {
    const list = [...current[field]];
    list[index] = value;
    patch({ [field]: list } as Partial<SocialImageSpec>);
  };

  const toggleExtra = (field: SocialSpecField) => {
    if (!extras.includes(field)) {
      setRevealed((prev) => [...prev, field]);
      return;
    }
    setRevealed((prev) => prev.filter((f) => f !== field));
    // Off takes the words with it. Leaving them behind would mean a switch
    // that says the eyebrow is off over a card that is still drawing one.
    patch({ [field]: "" } as Partial<SocialImageSpec>);
  };

  const addSlide = () => {
    if (slides.length >= MAX_SLIDES) return;
    setSlides((prev) => [...prev, normalizeSpec({ ...EMPTY_SPEC, template: prev[prev.length - 1]?.template })]);
    setActive(slides.length);
  };

  const removeSlide = (index: number) => {
    if (slides.length <= 1) return;
    const remaining = slides.length - 1;
    setSlides((prev) => prev.filter((_, i) => i !== index));
    // Clamping matters beyond the highlight: edits are applied by index, so
    // an active index past the end would leave the fields editing nothing.
    setActive((prev) => Math.min(remaining - 1, prev > index ? prev - 1 : prev));
  };

  const moveSlide = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= slides.length) return;
    setSlides((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setActive(target);
  };

  const applyPreset = (spec: Partial<SocialImageSpec>) => {
    if (spec.theme) setTheme(spec.theme);
    if (spec.grain !== undefined) setGrain(spec.grain);
    if (spec.typeScale !== undefined) setTypeScale(spec.typeScale);
    if (spec.brandScale !== undefined) setBrandScale(spec.brandScale);
    if (spec.placement !== undefined) setPlacement(spec.placement);
    if (spec.backdrop !== undefined) {
      setBacking((prev) => ({
        ...prev,
        backdrop: spec.backdrop as BackdropId,
        // A preset asking for a drawn sky means the drawn sky, so an
        // uploaded photograph left over from the last card stands down,
        // and the credit for it goes at the same time.
        backdropImage: "",
        backdropCredit: "",
      }));
    }
    setSlides((prev) =>
      prev.map((slide, i) => (i === active ? normalizeSpec({ ...EMPTY_SPEC, ...spec, format, theme: spec.theme || theme }) : slide))
    );
  };

  const applyCarouselPreset = (id: string) => {
    const preset = CAROUSEL_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setMode("carousel");
    setTheme(preset.theme);
    setTitle((prev) => prev || preset.label);
    setSlides(preset.slides.map((slide) => normalizeSpec({ ...EMPTY_SPEC, ...slide, theme: preset.theme })));
    setActive(0);
    setPanel("words");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isCarousel) {
        const result = await saveCarousel({
          title,
          note,
          setId: seed.setId,
          slides: slides.map((_, i) => specAt(i)),
        });
        onSaved(
          result.error ||
            `Carousel saved as a draft, ${slides.length} slides. Approve it in the library to get a public address.`,
          result.error ? "error" : "success"
        );
      } else {
        const result = await saveAsset({ id: seed.assetId, title, note, spec: currentSpec });
        onSaved(
          result.error || "Saved as a draft. Approve it in the library to get a public address.",
          result.error ? "error" : "success"
        );
      }
    } finally {
      setSaving(false);
    }
  };

  /**
   * Downloading fetches the same render the preview is showing. The route
   * is signed in, so this goes through fetch and a blob rather than a bare
   * link, which would open a new tab and lose the filename.
   */
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const targets = isCarousel ? slides.map((_, i) => specAt(i)) : [currentSpec];
      for (const spec of targets) {
        const response = await fetch(specToRenderPath(spec));
        if (!response.ok) throw new Error("That card did not come back. Try again.");
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = specToFilename(spec, title);
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Could not download that card.", "error");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 xl:gap-8">
      {/* ----------------------------------------------------------- */}
      {/* Controls                                                     */}
      {/* ----------------------------------------------------------- */}
      <div className="flex-1 min-w-0 flex flex-col gap-6 order-2 lg:order-1">
        {/* Which group of controls. Three panels of four or five
            decisions each, rather than one column of thirty. */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-1 p-1 rounded-full bg-white/[0.03] border border-white/8 w-fit">
            {PANELS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPanel(p.id)}
                className={`px-4 py-1.5 rounded-full text-[11px] font-semibold transition-colors min-h-[44px] sm:min-h-[34px] ${
                  panel === p.id ? "bg-white text-black" : "text-zinc-400 hover:text-zinc-100"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <span className={HINT}>{PANELS.find((p) => p.id === panel)?.note}</span>
        </div>

        {/* =========================================================== */}
        {/* POST                                                        */}
        {/* =========================================================== */}
        {panel === "post" ? (
          <div className="flex flex-col gap-6">
            <Group label="Post type">
              <div className="flex gap-2">
                <Chip active={!isCarousel} onClick={() => setMode("single")}>
                  <span className="flex items-center gap-1.5">
                    <Square className="w-3 h-3" />
                    Single image
                  </span>
                </Chip>
                <Chip active={isCarousel} onClick={() => setMode("carousel")}>
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3 h-3" />
                    Carousel
                  </span>
                </Chip>
              </div>
            </Group>

            <Group
              label="Start from"
              hint="Every preset names what the reader gets. Keep that when you edit it, and only put a number on a card if you measured it."
            >
              <div className="flex flex-wrap gap-2">
                {(isCarousel ? CAROUSEL_PRESETS : SOCIAL_PRESETS).map((preset) => (
                  <Chip
                    key={preset.id}
                    active={false}
                    title={preset.intent}
                    onClick={() => {
                      if (isCarousel) {
                        applyCarouselPreset(preset.id);
                      } else {
                        applyPreset((preset as (typeof SOCIAL_PRESETS)[number]).spec);
                        setPanel("words");
                      }
                    }}
                  >
                    {preset.label}
                  </Chip>
                ))}
              </div>
            </Group>

            {/* Picking a place picks the size, which is the order the
                question actually gets asked in. */}
            <Group label="Destination">
              <div className="flex flex-wrap gap-2">
                {SOCIAL_DESTINATION_IDS.map((id) => (
                  <Chip
                    key={id}
                    active={destination === id}
                    title={SOCIAL_DESTINATIONS[id].surface}
                    onClick={() => {
                      setDestination(id);
                      const [first] = SOCIAL_DESTINATIONS[id].formats;
                      if (first && !SOCIAL_DESTINATIONS[id].formats.includes(format)) setFormat(first);
                    }}
                  >
                    {SOCIAL_DESTINATIONS[id].label}
                  </Chip>
                ))}
              </div>
              {place ? (
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-zinc-500 leading-relaxed">{place.note}</span>
                  {place.captionHint ? <span className={HINT}>{place.captionHint}</span> : null}
                  {isCarousel && place.carousel ? <span className={HINT}>{place.carousel.note}</span> : null}
                  {isCarousel && !place.carousel ? (
                    <span className={WARN}>
                      {place.label} has no carousel. These will go out as separate posts.
                    </span>
                  ) : null}
                </div>
              ) : null}
            </Group>

            <Group
              label="Size"
              hint={`${SOCIAL_FORMATS[format].width} x ${SOCIAL_FORMATS[format].height}. ${SOCIAL_FORMATS[format].usedFor}.`}
              warn={
                hasSafeArea(SOCIAL_FORMATS[format])
                  ? `${SOCIAL_FORMATS[format].safeNote} The card is already drawn inside that.`
                  : undefined
              }
            >
              <div className="flex flex-wrap gap-2">
                {SOCIAL_FORMAT_IDS.map((id) => (
                  <Chip key={id} active={format === id} onClick={() => setFormat(id)} title={SOCIAL_FORMATS[id].usedFor}>
                    {SOCIAL_FORMATS[id].label}
                  </Chip>
                ))}
              </div>
            </Group>

            {isCarousel ? (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className={LABEL}>Slides</span>
                  <span className="text-[11px] text-zinc-600">
                    {slides.length} of {MAX_SLIDES}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {slides.map((slide, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-1 rounded-full border transition-colors ${
                        active === index ? "bg-white text-black border-white" : "bg-white/[0.03] border-white/8 text-zinc-400"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setActive(index)}
                        className="pl-3 pr-1 py-1.5 text-[11px] font-semibold min-h-[44px] sm:min-h-[36px]"
                      >
                        {index + 1}. {SOCIAL_TEMPLATES[slide.template].label}
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSlide(index, -1)}
                        aria-label={`Move slide ${index + 1} earlier`}
                        className="px-1 py-1.5 opacity-60 hover:opacity-100 disabled:opacity-20"
                        disabled={index === 0}
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSlide(index)}
                        aria-label={`Remove slide ${index + 1}`}
                        className="pr-2.5 pl-1 py-1.5 opacity-60 hover:opacity-100 disabled:opacity-20"
                        disabled={slides.length <= 1}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <Chip active={false} onClick={addSlide}>
                    <span className="flex items-center gap-1.5">
                      <Plus className="w-3 h-3" />
                      Add slide
                    </span>
                  </Chip>
                </div>
                <span className={HINT}>
                  Slide one earns the swipe, the middle slides do one idea each, and the last one asks for
                  something. Every slide but the last adds Swipe to its footer for you.
                </span>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* =========================================================== */}
        {/* WORDS                                                       */}
        {/* =========================================================== */}
        {panel === "words" ? (
          <div className="flex flex-col gap-6">
            <Group
              label={isCarousel ? `Slide ${active + 1} layout` : "Layout"}
              hint={template.blurb}
              warn={
                suitsPlace ? undefined : (
                  <>
                    {/* Not lowercased: it would turn X post into x post. */}
                    {template.label} is a lot to read on {place.label}. It will render, but{" "}
                    {place.suits
                      .slice(0, 3)
                      .map((id) => SOCIAL_TEMPLATES[id].label)
                      .join(", ")}{" "}
                    land harder there.
                  </>
                )
              }
            >
              <div className="flex flex-wrap gap-2">
                {SOCIAL_TEMPLATE_IDS.map((id) => (
                  <Chip
                    key={id}
                    active={current.template === id}
                    onClick={() => patch({ template: id as SocialTemplateId })}
                    title={SOCIAL_TEMPLATES[id].blurb}
                    // Dimmed marks the layouts that hold up where this is going.
                    muted={!place.suits.includes(id) && current.template !== id}
                  >
                    {SOCIAL_TEMPLATES[id].label}
                  </Chip>
                ))}
              </div>
            </Group>

            {/* Everything that is off unless you ask for it. Both switches
                live here because both are things a card is usually better
                without, and a control that is off by default belongs next
                to the other one rather than buried in its own group. */}
            <Group
              label="Extras"
              hint={
                <>
                  A card earns an eyebrow by having something in it a reader would miss. Most do not:
                  a letterspaced label over a headline that already says the thing is a word to step
                  over on the way to the sentence.
                </>
              }
              warn={
                current.showMockup ? (
                  <>
                    A short card or a dense layout leaves the panel no room, and it is dropped rather
                    than drawn as a smudge. The preview is the same renderer, so it tells you.
                  </>
                ) : undefined
              }
            >
              <div className="flex flex-wrap gap-2">
                {optionalFields.map((field) => (
                  <Chip
                    key={field}
                    active={extras.includes(field)}
                    onClick={() => toggleExtra(field)}
                    title={
                      field === "eyebrow"
                        ? "A small letterspaced line above the headline"
                        : undefined
                    }
                  >
                    {FIELD_META[field].label}
                  </Chip>
                ))}
                {canToggleMockup(current.template) ? (
                  <Chip
                    active={current.showMockup}
                    onClick={() => patch({ showMockup: !current.showMockup })}
                    title="Draw a panel of the app under the words"
                  >
                    <span className="flex items-center gap-1.5">
                      <MonitorSmartphone className="w-3 h-3" />
                      App demo
                    </span>
                  </Chip>
                ) : null}
              </div>
            </Group>

            {/* Which app screen, for the layouts that draw one and the ones
                that have been switched on */}
            {showDemo ? (
              <div className="flex flex-col gap-2.5">
                <span className={LABEL}>Screen</span>
                <div className="flex flex-col gap-2.5">
                  {MOCKUP_GROUPS.map((group) => (
                    <div key={group} className="flex flex-col gap-1.5">
                      <span className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">{group}</span>
                      <div className="flex flex-wrap gap-2">
                        {mockupsInGroup(group).map((mockup) => (
                          <Chip
                            key={mockup.id}
                            active={current.mockup === mockup.id}
                            onClick={() => patch({ mockup: mockup.id })}
                            title={mockup.valueLine}
                          >
                            {mockup.label}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {/* A printed sheet is taller than it is wide, and a landscape
                    card can only ever give it a sliver. */}
                {MOCKUPS[current.mockup].shape === "tall" &&
                SOCIAL_FORMATS[format].width / SOCIAL_FORMATS[format].height > 1.2 ? (
                  <span className={WARN}>
                    {MOCKUPS[current.mockup].label} is a tall panel and this is a wide card, so it will draw
                    small. Portrait or story gives it the room.
                  </span>
                ) : null}
                {template.fields.includes("body") ? (
                  <button
                    type="button"
                    onClick={() => patch({ body: MOCKUPS[current.mockup].valueLine })}
                    className="text-[11px] text-zinc-500 hover:text-zinc-300 text-left transition-colors"
                  >
                    Use the suggested value line: &ldquo;{MOCKUPS[current.mockup].valueLine}&rdquo;
                  </button>
                ) : (
                  <span className={HINT}>{MOCKUPS[current.mockup].valueLine}</span>
                )}
              </div>
            ) : null}

            {/* Copy */}
            <div className="flex flex-col gap-4 pt-2 border-t border-white/5">
              {shownFields.map((field) => {
                const meta = FIELD_META[field];

                if (LIST_FIELDS.includes(field)) {
                  const listField = field as "items" | "itemsB";
                  // A tiles card only draws four, so offering a fifth is a
                  // line somebody writes and then never sees.
                  const rows = current.template === "grid" ? 4 : MAX_ITEMS;
                  return (
                    <div key={field} className="flex flex-col gap-2">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className={LABEL}>{fieldLabel(field, current.template)}</span>
                        <span className="text-[10px] text-zinc-600 text-right">{meta.hint}</span>
                      </div>
                      {Array.from({ length: rows }).map((_, index) => (
                        <input
                          key={index}
                          type="text"
                          value={current[listField][index] || ""}
                          placeholder={index === 0 ? meta.itemPlaceholder : ""}
                          onChange={(e) => setItem(listField, index, e.target.value)}
                          className={INPUT}
                        />
                      ))}
                    </div>
                  );
                }

                return (
                  <Field
                    key={field}
                    label={fieldLabel(field, current.template)}
                    hint={meta.hint}
                    placeholder={meta.placeholder}
                    multiline={meta.multiline}
                    limit={template.limits[field]}
                    value={current[field] as string}
                    onChange={(value) => patch({ [field]: value } as Partial<SocialImageSpec>)}
                  />
                );
              })}
            </div>

            {/* Filing */}
            <div className="flex flex-col gap-4 pt-4 border-t border-white/5">
              <Field
                label="Library title"
                hint="How you will find this again. Defaults to the headline."
                value={title}
                onChange={setTitle}
                placeholder="Call sheet, square, August"
              />
              <Field
                label="Note"
                multiline
                hint="Where you plan to post it, or anything the next person should know."
                value={note}
                onChange={setNote}
              />
            </div>
          </div>
        ) : null}

        {/* =========================================================== */}
        {/* LOOK                                                        */}
        {/* =========================================================== */}
        {panel === "look" ? (
          <div className="flex flex-col gap-6">
            <Group
              label="Palette"
              hint={
                onBacking
                  ? "Something is set behind the card, and it brings its own colour and its own text tiers."
                  : undefined
              }
            >
              <div className="flex flex-wrap gap-2">
                {SOCIAL_THEME_IDS.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTheme(id)}
                    disabled={onBacking}
                    className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full text-[11px] font-semibold border transition-colors min-h-[44px] sm:min-h-[36px] disabled:opacity-40 ${
                      theme === id
                        ? "bg-white text-black border-white"
                        : "bg-white/[0.03] text-zinc-400 border-white/8 hover:text-zinc-200 hover:border-white/15"
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                      style={{ backgroundColor: SOCIAL_THEMES[id].swatch }}
                    />
                    {SOCIAL_THEMES[id].label}
                  </button>
                ))}
              </div>
            </Group>

            <div className="pt-1 border-t border-white/5" />

            <BackdropPicker
              value={backing}
              onChange={(next) =>
                setBacking((prev) => {
                  const merged = { ...prev, ...next };
                  // Grain on a flat colour is noise for its own sake, and
                  // anything behind the card without it reads as software.
                  if (next.backdrop !== undefined || next.backdropImage !== undefined) {
                    setGrain(merged.backdrop !== "none" || Boolean(merged.backdropImage));
                  }
                  return merged;
                })
              }
              onNotify={onNotify}
            />

            <Group
              label="Grain"
              hint="What stops a gradient reading as a software gradient, and most of the difference between a card that looks photographed and one that looks generated."
            >
              <div className="flex gap-2">
                <Chip active={grain} onClick={() => setGrain(true)}>
                  On
                </Chip>
                <Chip active={!grain} onClick={() => setGrain(false)}>
                  Off
                </Chip>
              </div>
            </Group>

            <div className="pt-1 border-t border-white/5" />

            <Group
              label="Placement"
              hint="Where the words sit on the card. On a photograph the composition decides this, so it is a control rather than something each layout fixes."
            >
              <PlacementGrid
                value={placement}
                onChange={setPlacement}
                centringIgnored={PLACEMENTS[placement].align === "center" && !canCentre(current.template)}
              />
            </Group>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Group
                label="Text size"
                hint="Gaps and padding move with the words, so a bigger headline still has room around it."
              >
                <div className="flex flex-wrap gap-2">
                  {TYPE_SCALES.map((step) => (
                    <Chip key={step.value} active={typeScale === step.value} onClick={() => setTypeScale(step.value)}>
                      {step.label}
                    </Chip>
                  ))}
                </div>
              </Group>

              <Group
                label="Mark size"
                hint={
                  current.brand === "none"
                    ? "This card carries no mark, so there is nothing to size."
                    : "Held separately from the text size, so the mark stays put while the words move."
                }
              >
                <div className="flex flex-wrap gap-2">
                  {BRAND_SCALES.map((step) => (
                    <Chip
                      key={step.value}
                      active={brandScale === step.value}
                      onClick={() => setBrandScale(step.value)}
                      muted={current.brand === "none"}
                    >
                      {step.label}
                    </Chip>
                  ))}
                </div>
              </Group>
            </div>

            <Group
              label={isCarousel ? `Slide ${active + 1} branding` : "Branding"}
              hint="The lockup carries the name, so use it wherever a reader might be meeting ABRAM for the first time. Mark only suits the middle slides of a carousel, where slide one already said it."
            >
              <div className="flex flex-wrap gap-2">
                {BRAND_KINDS.map((kind) => (
                  <Chip
                    key={kind.id}
                    active={current.brand === kind.id}
                    onClick={() => patch({ brand: kind.id as BrandKind })}
                  >
                    {kind.label}
                  </Chip>
                ))}
              </div>
            </Group>

            <Group
              label="Corner rule"
              hint="The short laser line in the top left, echoing the site. Take it off for the quiet cards; the poster drops it either way."
            >
              <div className="flex gap-2">
                <Chip active={current.showRule} onClick={() => patch({ showRule: true })}>
                  On
                </Chip>
                <Chip active={!current.showRule} onClick={() => patch({ showRule: false })}>
                  Off
                </Chip>
              </div>
            </Group>
          </div>
        ) : null}

        {/* Actions. Outside the panels: saving is never one group's job. */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-full disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {seed.assetId || seed.setId ? "Save changes" : "Save to library"}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="btn-glass flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-full disabled:opacity-50"
          >
            {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {isCarousel ? `Download ${slides.length} PNGs` : "Download PNG"}
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* Preview                                                      */}
      {/* ----------------------------------------------------------- */}
      <div className="w-full lg:w-[380px] xl:w-[440px] shrink-0 order-1 lg:order-2">
        <div className="lg:sticky lg:top-6 flex flex-col gap-3">
          <CardPreview spec={currentSpec} />
          {isCarousel && slides.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {slides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActive(index)}
                  className={`shrink-0 w-16 rounded-lg overflow-hidden border transition-colors ${
                    active === index ? "border-white" : "border-white/10 hover:border-white/25"
                  }`}
                  style={{ aspectRatio: `${SOCIAL_FORMATS[format].width} / ${SOCIAL_FORMATS[format].height}` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={specToRenderPath(specAt(index))} alt={`Slide ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Live preview.
 *
 * The spec is debounced before it reaches the `<img>`, so typing a
 * headline is one render at the end rather than one per keystroke. The
 * previous card stays on screen while the next one loads, which is why
 * two images are stacked rather than one being swapped out.
 */
function CardPreview({ spec }: { spec: SocialImageSpec }) {
  const [settled, setSettled] = useState(() => specToRenderPath(spec));
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const next = specToRenderPath(spec);

  useEffect(() => {
    if (next === settled) return;
    setLoading(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSettled(next), 400);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [next, settled]);

  const format = SOCIAL_FORMATS[spec.format];

  const copyPreviewLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}${settled}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className={LABEL}>Preview</span>
        <span className="text-[10px] text-zinc-600 tabular-nums">
          {format.width} x {format.height}
        </span>
      </div>

      <div
        className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-black/40"
        style={{ aspectRatio: `${format.width} / ${format.height}` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={settled}
          src={settled}
          alt="Card preview"
          onLoad={() => setLoading(false)}
          onError={() => setLoading(false)}
          className="w-full h-full object-contain"
        />
        {loading ? (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-[10px] text-zinc-300">
            <Loader2 className="w-3 h-3 animate-spin" />
            Redrawing
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={copyPreviewLink}
        className="btn-ghost flex items-center justify-center gap-2 px-4 py-2 text-[11px] font-semibold rounded-full"
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? "Preview link copied" : "Copy preview link"}
      </button>
      <span className="text-[10px] text-zinc-600 leading-relaxed text-center">
        A preview link only opens for someone signed in here. Approve the card to get a public address.
      </span>
    </div>
  );
}
