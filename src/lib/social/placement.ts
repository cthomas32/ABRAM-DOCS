/**
 * Where the words sit on the card.
 *
 * Every layout used to draw its block in the middle of the frame, which is
 * the safe answer and never the best one. On a photograph the composition
 * decides where the type goes: a sky at the top wants the line low, a
 * horizon low in the frame wants it high. Six presets rather than an x and
 * a y, for the same reason the type sizes are steps: a set of cards laid
 * out by hand comes out six different shapes.
 *
 * Placement is set-level, so a carousel holds its shape from slide to
 * slide.
 */

export type PlacementId =
  | "top-left"
  | "top-center"
  | "center-left"
  | "center"
  | "bottom-left"
  | "bottom-center";

export interface Placement {
  id: PlacementId;
  label: string;
  /** Where the block sits down the height of the card */
  vertical: "start" | "center" | "end";
  /** How the lines inside it are set */
  align: "left" | "center";
  /**
   * Which end of a photograph gets darkened. The scrim follows the words:
   * darkening the top of a picture whose only type is at the bottom
   * throws away the part of the image the card was chosen for.
   */
  scrimFrom: "top" | "center" | "bottom";
}

export const PLACEMENTS: Record<PlacementId, Placement> = {
  "top-left": {
    id: "top-left",
    label: "Top left",
    vertical: "start",
    align: "left",
    scrimFrom: "top",
  },
  "top-center": {
    id: "top-center",
    label: "Top centre",
    vertical: "start",
    align: "center",
    scrimFrom: "top",
  },
  "center-left": {
    id: "center-left",
    label: "Middle left",
    vertical: "center",
    align: "left",
    scrimFrom: "center",
  },
  center: {
    id: "center",
    label: "Middle",
    vertical: "center",
    align: "center",
    scrimFrom: "center",
  },
  "bottom-left": {
    id: "bottom-left",
    label: "Bottom left",
    vertical: "end",
    align: "left",
    scrimFrom: "bottom",
  },
  "bottom-center": {
    id: "bottom-center",
    label: "Bottom centre",
    vertical: "end",
    align: "center",
    scrimFrom: "bottom",
  },
};

export const PLACEMENT_IDS = Object.keys(PLACEMENTS) as PlacementId[];

/** Where every card sat before this existed, so an old spec renders unchanged. */
export const DEFAULT_PLACEMENT: PlacementId = "center-left";

export function getPlacement(id: string | null | undefined): Placement {
  return PLACEMENTS[(id as PlacementId) ?? DEFAULT_PLACEMENT] ?? PLACEMENTS[DEFAULT_PLACEMENT];
}

/**
 * Layouts that can be centred.
 *
 * Centring one or two lines reads as composition. Centring a checklist, a
 * comparison or a numbered sequence reads as a mistake: a ragged left edge
 * gives the eye nothing to come back to on the next line, and every one of
 * these layouts is a set of lines you are meant to scan down. Those keep
 * their left edge whatever the placement says, and the studio says so
 * rather than quietly ignoring the control.
 */
export const CENTRABLE_TEMPLATES = ["poster", "hook", "statement", "quote", "stat", "term"] as const;

export function canCentre(template: string): boolean {
  return (CENTRABLE_TEMPLATES as readonly string[]).includes(template);
}

/** The alignment a card will actually be drawn with, once the layout has had its say. */
export function effectiveAlign(placement: Placement, template: string): "left" | "center" {
  return placement.align === "center" && canCentre(template) ? "center" : "left";
}
