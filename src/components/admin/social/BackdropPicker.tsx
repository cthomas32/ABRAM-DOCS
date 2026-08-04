"use client";

import React from "react";
import {
  BACKDROP_CROPS,
  BACKDROP_DIMS,
  BACKDROP_FOCUS,
  BACKDROP_FOCUS_IDS,
  SOCIAL_BACKDROPS,
  SOCIAL_BACKDROP_IDS,
  type BackdropFocus,
  type BackdropId,
} from "@/lib/social/backdrops";
import { creditLine, type CreditSide } from "@/lib/social/spec";
import ImageLibrary from "./ImageLibrary";

/**
 * Everything that goes behind a card: the drawn skies, the image library,
 * and the three controls that decide how a picture is cropped and how hard
 * it is scrimmed.
 *
 * The library itself lives in `ImageLibrary`, which is the same component
 * the Library tab renders as a gallery. This is the picker view of it,
 * with the card's own controls around it.
 */

const LABEL = "text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500";

export interface BackdropState {
  backdrop: BackdropId;
  backdropImage: string;
  backdropCrop: number;
  backdropFocus: BackdropFocus;
  backdropDim: number;
  backdropBase: string;
  backdropCredit: string;
  backdropCreditSide: CreditSide;
}

function Chip({
  active,
  onClick,
  children,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-colors min-h-[44px] sm:min-h-[36px] disabled:opacity-30 ${
        active
          ? "bg-white text-black border-white"
          : "bg-white/[0.03] text-zinc-400 border-white/8 hover:text-zinc-200 hover:border-white/15"
      }`}
    >
      {children}
    </button>
  );
}

export default function BackdropPicker({
  value,
  onChange,
  onNotify,
}: {
  value: BackdropState;
  onChange: (next: Partial<BackdropState>) => void;
  onNotify: (message: string, tone: "success" | "error") => void;
}) {
  const onPhoto = Boolean(value.backdropImage);

  return (
    <div className="flex flex-col gap-5">
      {/* ------------------------------------------------------------- */}
      {/* Drawn skies                                                   */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col gap-2.5">
        <span className={LABEL}>Backdrop</span>
        <div className="flex flex-wrap gap-2">
          {SOCIAL_BACKDROP_IDS.map((id) => (
            <button
              key={id}
              type="button"
              title={SOCIAL_BACKDROPS[id].blurb}
              onClick={() =>
                onChange({
                  backdrop: id,
                  // Picking a drawn sky puts the photograph away. Two
                  // backgrounds in one frame is two of them arguing. The
                  // credit goes with it: a drawn sky has nobody to credit,
                  // and a stray name along the bottom of one is worse than
                  // no credit at all.
                  backdropImage: "",
                  backdropCredit: "",
                })
              }
              className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full text-[11px] font-semibold border transition-colors min-h-[44px] sm:min-h-[36px] ${
                value.backdrop === id && !onPhoto
                  ? "bg-white text-black border-white"
                  : "bg-white/[0.03] text-zinc-400 border-white/8 hover:text-zinc-200 hover:border-white/15"
              }`}
            >
              <span
                className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                style={{ backgroundColor: SOCIAL_BACKDROPS[id].swatch }}
              />
              {SOCIAL_BACKDROPS[id].label}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-zinc-600 leading-relaxed">
          {onPhoto ? "An image is set, so the drawn skies are standing down." : SOCIAL_BACKDROPS[value.backdrop].blurb}
        </span>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* The image library, as a picker                                */}
      {/* ------------------------------------------------------------- */}
      <ImageLibrary
        mode="pick"
        selectedPath={value.backdropImage}
        creditSide={value.backdropCreditSide}
        onCreditSide={(next) => onChange({ backdropCreditSide: next })}
        onCreditChange={(line) => onChange({ backdropCredit: line })}
        onSelect={(image) =>
          onChange(
            image
              ? {
                  backdrop: "none",
                  backdropImage: image.storage_path,
                  backdropBase: image.base_color,
                  // Crediting is the default wherever there is somebody to
                  // credit. Making it a second deliberate step is how a
                  // credit ends up being the thing nobody remembered.
                  backdropCredit: creditLine(image.credit, image.credit_handle),
                }
              : { backdropImage: "", backdropCredit: "" }
          )
        }
        onNotify={onNotify}
      />

      {/* ------------------------------------------------------------- */}
      {/* Crop, focus and scrim. Only mean anything on an image.         */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2.5">
            <span className={LABEL}>Crop</span>
            <div className="flex flex-wrap gap-2">
              {BACKDROP_CROPS.map((step) => (
                <Chip
                  key={step.value}
                  active={value.backdropCrop === step.value}
                  disabled={!onPhoto}
                  onClick={() => onChange({ backdropCrop: step.value })}
                >
                  {step.label}
                </Chip>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className={LABEL}>Scrim</span>
            <div className="flex flex-wrap gap-2">
              {BACKDROP_DIMS.map((step) => (
                <Chip
                  key={step.value}
                  active={value.backdropDim === step.value}
                  disabled={!onPhoto}
                  onClick={() => onChange({ backdropDim: step.value })}
                >
                  {step.label}
                </Chip>
              ))}
            </div>
            <span className="text-[11px] text-zinc-600 leading-relaxed">
              The darkening between the picture and the words. It follows the placement, so moving the
              words moves the darkest part of the card with them.
            </span>
          </div>
        </div>

        {/* A 3x3, because the answer is a place in the picture rather than
            two numbers. */}
        <div className="flex flex-col gap-2.5">
          <span className={LABEL}>Focus</span>
          <div className={`grid grid-cols-3 gap-1.5 w-[132px] ${onPhoto ? "" : "opacity-30 pointer-events-none"}`}>
            {BACKDROP_FOCUS_IDS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => onChange({ backdropFocus: id })}
                title={BACKDROP_FOCUS[id].label}
                aria-label={BACKDROP_FOCUS[id].label}
                className={`h-10 rounded-lg border transition-colors ${
                  value.backdropFocus === id
                    ? "bg-white border-white"
                    : "bg-white/[0.03] border-white/8 hover:border-white/25"
                }`}
              />
            ))}
          </div>
          <span className="text-[11px] text-zinc-600 leading-relaxed">
            Which part of the picture survives the crop. Only does anything once the crop is closer than
            wide.
          </span>
        </div>
      </div>
    </div>
  );
}
